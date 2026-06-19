import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, FileSearch, Loader2 } from "lucide-react";
import {
  webScanHistory,
  webScanResult,
  webScanStart,
  webScanStatus,
  type WebFinding,
  type WebScanHistoryItem,
  type WebScanResult,
  type WebScanStartResponse,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function normalizeUrl(input: string) {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isCompleted(status: string) {
  return status.toLowerCase() === "completed";
}

function severityClass(sev: string | undefined) {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return "text-destructive";
  if (s === "high") return "text-orange-600 dark:text-orange-400";
  if (s === "medium") return "text-amber-700 dark:text-amber-400";
  if (s === "low") return "text-blue-600 dark:text-blue-400";
  return "text-muted-foreground";
}

function severityBadge(sev: string) {
  const s = sev.toLowerCase();
  if (s === "critical") return "bg-red-100 text-red-800";
  if (s === "high") return "bg-orange-100 text-orange-800";
  if (s === "medium") return "bg-amber-100 text-amber-800";
  if (s === "low") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-800";
}

const ScanWebsite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<WebScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openingTarget, setOpeningTarget] = useState<string | null>(null);
  const [report, setReport] = useState<WebScanResult | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [hoverSegment, setHoverSegment] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<WebFinding | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const loadHistory = useCallback(async () => {
    const t = localStorage.getItem("auth_token");
    if (!t) return;
    setLoadingHistory(true);
    try {
      const res = await webScanHistory(t);
      if (!res.ok) {
        toast({
          title: "Could not load history",
          description: res.status === 401 ? "Session expired. Please log in again." : `Error ${res.status}`,
          variant: "destructive",
        });
        return;
      }
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sorted);
    } catch (e: unknown) {
      toast({
        title: "Could not load history",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login", { replace: true });
      return;
    }
    loadHistory();
  }, [navigate, loadHistory]);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    if (!t) return;

    const tick = async () => {
      const list = itemsRef.current;
      const pending = list.filter((item) => !isCompleted(item.status));
      if (pending.length === 0) return;

      const updates = await Promise.all(
        pending.map(async (item) => {
          const r = await webScanStatus(item.target, t);
          if (!r.ok || !r.scanStatus) return item;
          return { ...item, status: r.scanStatus };
        })
      );

      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.target, x]));
        for (const u of updates) {
          const cur = map.get(u.target);
          if (cur && u.status !== cur.status) map.set(u.target, u);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    };

    const id = window.setInterval(tick, 5000);
    void tick();
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = async () => {
    const t = localStorage.getItem("auth_token");
    if (!t) {
      navigate("/login");
      return;
    }
    const requestUrl = normalizeUrl(url);
    if (!requestUrl) {
      toast({ title: "URL required", description: "Enter a URL to scan.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await webScanStart(requestUrl, t);
      if (!res.ok) {
        toast({
          title: "Scan could not be started",
          description:
            (res.data && typeof res.data === "object" && "message" in res.data
              ? String((res.data as { message: unknown }).message)
              : null) || `Request failed (${res.status})`,
          variant: "destructive",
        });
        return;
      }

      const body = res.data as WebScanStartResponse | null;
      const statusFromApi =
        body?.status && typeof body.status === "string" ? body.status : "running";
      const cached = Boolean(body?.cached);
      const apiMessage =
        body?.message && typeof body.message === "string" ? body.message : undefined;

      setUrl("");
      if (statusFromApi.toLowerCase() === "completed") {
        toast({
          title: "Scan completed",
          description:
            apiMessage ??
            (cached
              ? "This target was already scanned. You can open the report."
              : "The scan finished."),
        });
      } else {
        toast({ title: "Scan started", description: requestUrl });
      }

      const optimistic: WebScanHistoryItem = {
        target: requestUrl,
        status: statusFromApi,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.target, x]));
        map.set(requestUrl, optimistic);
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      await loadHistory();
    } catch (e: unknown) {
      toast({
        title: "Scan could not be started",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (target: string) => {
    const t = localStorage.getItem("auth_token");
    if (!t) {
      navigate("/login");
      return;
    }
    setOpeningTarget(target);
    try {
      const res = await webScanResult(target, t);
      if (!res.ok || !res.data) {
        toast({
          title: "Report unavailable",
          description: `Could not load report (${res.status}).`,
          variant: "destructive",
        });
        return;
      }
      if (!isCompleted(res.data.status)) {
        toast({
          title: "Scan not finished yet",
          description: "The report will be available once the scan completes.",
        });
        return;
      }
      setSeverityFilter("all");
      setReport(res.data);
    } catch (e: unknown) {
      toast({
        title: "Report unavailable",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setOpeningTarget(null);
    }
  };

  const filteredFindings = (report?.findings ?? []).filter((f) => {
    if (severityFilter === "all") return true;
    return (f.severity || "").toLowerCase() === severityFilter;
  });

  if (!token) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Scan your website</h1>

          <div className="mb-8 space-y-2">
            <p>
              <span className="text-primary font-medium">Full web assessment</span> on the URL you submit: history,
              live status, and a detailed findings report when the scan completes. You must be signed in.
            </p>
          </div>

          <div className="flex gap-2 mb-8">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              className="cyber-input-white flex-1"
              disabled={submitting}
            />
            <Button
              variant="cyber"
              size="icon"
              onClick={() => void handleSubmit()}
              className="w-12 h-12 shrink-0"
              disabled={submitting}
              aria-label="Start scan"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          <div className="cyber-card-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Scan history</h2>
              <Button variant="outline" size="sm" onClick={() => void loadHistory()} disabled={loadingHistory}>
                {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {loadingHistory && items.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading history…
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No scans yet. Submit a URL above.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((row) => (
                  <li
                    key={`${row.target}-${row.createdAt}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={row.target}>
                        {row.target}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isCompleted(row.status)
                            ? "bg-primary/15 text-primary"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {row.status}
                      </span>
                      {isCompleted(row.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => void handleViewReport(row.target)}
                          disabled={openingTarget === row.target}
                        >
                          {openingTarget === row.target ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileSearch className="w-4 h-4" />
                          )}
                          View report
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Report dialog (mirrors the container summary) ── */}
          <Dialog
            open={Boolean(report)}
            onOpenChange={(open) => {
              if (!open) setReport(null);
            }}
          >
            <DialogContent className="max-h-[80vh] w-full max-w-4xl overflow-auto p-4 sm:p-6 gap-4">
              {report ? (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle>Web Scan Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Target</p>
                      <p className="font-medium break-all">{report.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.totalFindings} findings · status: {report.status}
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 flex-shrink-0 mx-auto sm:mx-0 mb-2 sm:mb-0">
                        {(() => {
                          const segments = [
                            { key: "critical", label: "Critical", value: report.criticalCount, color: "#ef4444" },
                            { key: "high", label: "High", value: report.highCount, color: "#f97316" },
                            { key: "medium", label: "Medium", value: report.mediumCount, color: "#fbbf24" },
                            { key: "low", label: "Low", value: report.lowCount, color: "#3b82f6" },
                            { key: "info", label: "Info", value: report.infoCount, color: "#94a3b8" },
                          ];
                          const total = segments.reduce((sum, s) => sum + s.value, 0);
                          const radius = 48;
                          const circumference = 2 * Math.PI * radius;
                          let offset = 0;
                          return (
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                              <g transform="translate(100,100)">
                                {segments.map((s) => {
                                  const dash = total > 0 ? (s.value / total) * circumference : 0;
                                  const dashArray = `${dash} ${circumference - dash}`;
                                  const transform = `rotate(${(offset / circumference) * 360 - 90})`;
                                  const isSelected = severityFilter === s.key;
                                  const strokeW = isSelected ? 18 : 12;
                                  const seg = (
                                    <g key={s.key} transform={transform}>
                                      <circle
                                        r={radius}
                                        cx={0}
                                        cy={0}
                                        fill="transparent"
                                        stroke={s.color}
                                        strokeWidth={strokeW}
                                        strokeLinecap="butt"
                                        strokeDasharray={dashArray}
                                        style={{ cursor: "pointer", transition: "stroke-width 120ms" }}
                                        onClick={() => setSeverityFilter(s.key)}
                                        onMouseEnter={() => setHoverSegment(s.key)}
                                        onMouseLeave={() => setHoverSegment(null)}
                                      />
                                    </g>
                                  );
                                  offset += dash;
                                  return seg;
                                })}
                                <circle r={36} cx={0} cy={0} fill="white" />
                                {(() => {
                                  const active = hoverSegment ?? (severityFilter === "all" ? null : severityFilter);
                                  const valueText = active
                                    ? String(segments.find((s) => s.key === active)?.value ?? 0)
                                    : String(total);
                                  const labelText = active
                                    ? segments.find((s) => s.key === active)?.label ?? ""
                                    : "Total";
                                  return (
                                    <>
                                      <text x={0} y={-4} textAnchor="middle" style={{ fontSize: "16px" }} className="font-semibold">
                                        {valueText}
                                      </text>
                                      <text x={0} y={18} textAnchor="middle" className="text-[10px] text-muted-foreground">
                                        {labelText}
                                      </text>
                                    </>
                                  );
                                })()}
                              </g>
                            </svg>
                          );
                        })()}
                      </div>

                      <div className="flex-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical: {report.criticalCount}</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> High: {report.highCount}</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Medium: {report.mediumCount}</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Low: {report.lowCount}</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Info: {report.infoCount}</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-sm font-semibold">Findings</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[["all", "All"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"], ["info", "Info"]].map(([key, label]) => (
                            <button
                              key={String(key)}
                              onClick={() => setSeverityFilter(String(key))}
                              className={`px-3 py-1 text-xs rounded ${severityFilter === String(key) ? "bg-primary text-white" : "bg-secondary/60"}`}
                            >
                              {String(label)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredFindings.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-4">No findings for this filter.</p>
                      ) : (
                        <div className="overflow-x-auto mt-4">
                          <table className="w-full text-sm table-auto border-collapse">
                            <thead>
                              <tr className="text-left">
                                <th className="p-2 border-b">Source</th>
                                <th className="p-2 border-b">CVE / Issue</th>
                                <th className="p-2 border-b">Severity</th>
                                <th className="p-2 border-b">Endpoint</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFindings.map((f, i) => (
                                <tr
                                  key={`${f.cve ?? f.issue}-${i}`}
                                  className="align-top hover:bg-secondary/30 cursor-pointer"
                                  onClick={() => setSelectedFinding(f)}
                                >
                                  <td className="p-3 border-b">{f.source}</td>
                                  <td className="p-3 border-b">{f.cve ?? f.issue}</td>
                                  <td className="p-3 border-b">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${severityBadge(f.severity)}`}>
                                      {f.severity}
                                    </span>
                                  </td>
                                  <td className="p-3 border-b break-all">{f.endpoint || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </DialogContent>
          </Dialog>

          {/* ── Single finding detail ── */}
          <Dialog
            open={Boolean(selectedFinding)}
            onOpenChange={(open) => {
              if (!open) setSelectedFinding(null);
            }}
          >
            <DialogContent className="max-h-[70vh] w-full max-w-xl overflow-auto p-6 gap-4">
              {selectedFinding ? (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle>{selectedFinding.cve ?? "Finding details"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Issue</p>
                      <p className="font-medium break-all">{selectedFinding.issue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className={`font-semibold ${severityClass(selectedFinding.severity)}`}>{selectedFinding.severity}</p>
                    </div>
                    {selectedFinding.explanation ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Explanation</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedFinding.explanation}</p>
                      </div>
                    ) : null}
                    {selectedFinding.patch ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Recommendation / Patch</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedFinding.patch}</p>
                      </div>
                    ) : null}
                    {selectedFinding.endpoint ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Endpoint</p>
                        <p className="text-sm break-all">{selectedFinding.endpoint}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p className="text-sm">{selectedFinding.source}</p>
                    </div>
                    {selectedFinding.referenceUrl ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Reference</p>
                        <a
                          href={selectedFinding.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline break-all"
                        >
                          {selectedFinding.referenceUrl}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScanWebsite;
