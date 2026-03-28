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
import { ArrowRight, Loader2 } from "lucide-react";
import {
  containerStartScan,
  containerHistory,
  containerImageSummary,
  type ContainerHistoryItem,
  type ImageSummary,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const POLL_MS = 4000;
const MSG_SCAN_RUNNING = "Your scan is running. The report will open when it is ready.";

function severityClass(sev: string | undefined) {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return "text-destructive";
  if (s === "high") return "text-orange-600 dark:text-orange-400";
  if (s === "medium") return "text-amber-700 dark:text-amber-400";
  if (s === "low") return "text-yellow-700 dark:text-yellow-500";
  if (s === "clean") return "text-muted-foreground";
  return "text-foreground";
}

const ScanContainer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageInput, setImageInput] = useState("");
  const [containerSubmitting, setContainerSubmitting] = useState(false);
  const [containerReport, setContainerReport] = useState<ImageSummary | null>(null);
  const [containerHistoryList, setContainerHistoryList] = useState<ContainerHistoryItem[]>([]);
  const [containerHistoryLoading, setContainerHistoryLoading] = useState(true);
  const [containerPollHint, setContainerPollHint] = useState<string | null>(null);
  const [openingImageId, setOpeningImageId] = useState<string | null>(null);
  const containerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearContainerPoll = useCallback(() => {
    if (containerPollRef.current) {
      clearInterval(containerPollRef.current);
      containerPollRef.current = null;
    }
  }, []);

  const loadContainerHistory = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      const t = localStorage.getItem("auth_token");
      if (!t) return;
      if (!silent) setContainerHistoryLoading(true);
      try {
        const res = await containerHistory(t);
        if (!res.ok) {
          if (!silent) {
            toast({ title: "Could not load container history", description: `Error ${res.status}`, variant: "destructive" });
          }
          return;
        }
        const sorted = [...res.data].sort((a, b) => (b.id || "").localeCompare(a.id || ""));
        setContainerHistoryList(sorted);
      } catch (e: unknown) {
        if (!silent) {
          toast({ title: "Could not load container history", description: e instanceof Error ? e.message : "Network error", variant: "destructive" });
        }
      } finally {
        if (!silent) setContainerHistoryLoading(false);
      }
    },
    [toast]
  );

  const fetchImageSummary = useCallback(async (imageName: string): Promise<ImageSummary | null> => {
    const t = localStorage.getItem("auth_token");
    if (!t) return null;
    const res = await containerImageSummary(imageName, t);
    if (!res.ok || !res.data) return null;
    return res.data;
  }, []);

  const runContainerPoll = useCallback(
    (imageName: string) => {
      clearContainerPoll();
      setContainerPollHint("Analysis in progress. This page will update automatically.");

      const tick = async () => {
        void loadContainerHistory({ silent: true });
        const summary = await fetchImageSummary(imageName);
        if (summary && (summary.totalVulnerabilities != null || (summary.vulnerabilities && summary.vulnerabilities.length > 0))) {
          clearContainerPoll();
          setContainerPollHint(null);
          setContainerReport(summary);
          toast({ title: "Container scan ready", description: "Detailed report is available." });
          await loadContainerHistory({ silent: true });
        }
      };

      void tick();
      containerPollRef.current = setInterval(() => void tick(), POLL_MS);
    },
    [clearContainerPoll, fetchImageSummary, loadContainerHistory, toast]
  );

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login", { replace: true });
      return;
    }
    void loadContainerHistory();
  }, [navigate, loadContainerHistory]);

  useEffect(() => () => clearContainerPoll(), [clearContainerPoll]);

  const openContainerSummary = useCallback(
    async (row: ContainerHistoryItem) => {
      const idOrName = row.name ?? row.id ?? "";
      setOpeningImageId(row.id ?? idOrName);
      try {
        const name = row.name ?? idOrName;
        const summary = await fetchImageSummary(name);
        if (summary) {
          setContainerReport(summary);
          return;
        }
        toast({ title: "Summary not available", description: "The image summary is not ready yet.", variant: "destructive" });
      } catch {
        toast({ title: "Could not open summary", description: "Please try again.", variant: "destructive" });
      } finally {
        setOpeningImageId(null);
      }
    },
    [fetchImageSummary, toast]
  );

    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [selectedVuln, setSelectedVuln] = useState<Record<string, any> | null>(null);
    const [hoverSegment, setHoverSegment] = useState<string | null>(null);

    const filteredVulnerabilities = (containerReport?.vulnerabilities ?? []).filter((v) => {
      const sev = String((v as any).severity ?? "").toLowerCase();
      if (severityFilter === "all") return true;
      if (severityFilter === "info") return sev === "info" || sev === "low" && sev === "info";
      return sev === severityFilter;
    });

  

  const handleContainerSubmit = async () => {
    const t = localStorage.getItem("auth_token");
    if (!t) {
      navigate("/login");
      return;
    }
    const name = imageInput.trim();
    if (!name) {
      toast({ title: "Image required", description: "Enter an image name (e.g. myrepo/my-image).", variant: "destructive" });
      return;
    }

    clearContainerPoll();
    setContainerSubmitting(true);
    setContainerPollHint(null);
    setContainerReport(null);

    try {
      const res = await containerStartScan({ image: name }, t);
      if (!res.ok || !res.data) {
        toast({ title: "Could not start container scan", description: `Error ${res.status}`, variant: "destructive" });
        return;
      }
      const data = res.data;
      if ((data.status && data.status.toLowerCase() === "success") || data.progress === 100 || data.summaryId) {
        const summaryName = data.imageName ?? name;
        const summary = await fetchImageSummary(summaryName);
        if (summary) {
          setContainerReport(summary);
          toast({ title: "Analysis ready", description: "Detailed report opened." });
          await loadContainerHistory({ silent: true });
          setImageInput("");
          return;
        }
      }

      toast({ title: "Scan started", description: MSG_SCAN_RUNNING });
      void loadContainerHistory({ silent: true });
      runContainerPoll(name);
    } catch (e: unknown) {
      toast({ title: "Submit failed", description: e instanceof Error ? e.message : "Network error", variant: "destructive" });
    } finally {
      setContainerSubmitting(false);
    }
  };

  if (!localStorage.getItem("auth_token")) return null;

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Container Image Scanning</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Submit an image name to scan (e.g. avre1/my-website). Sign in required.
          </p>

          <div className="cyber-card-white mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Container image scanning</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Submit a container image name (e.g. avre1/my-website). Tap a previous image to open its detailed report.
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="avre1/my-website"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleContainerSubmit()}
                className="cyber-input-white flex-1"
                disabled={containerSubmitting}
              />
              <Button
                variant="cyber"
                size="icon"
                onClick={() => void handleContainerSubmit()}
                className="w-12 h-12 shrink-0"
                disabled={containerSubmitting}
                aria-label="Scan image"
              >
                {containerSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </Button>
            </div>

            {containerPollHint && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {containerPollHint}
              </div>
            )}

            {containerHistoryLoading && containerHistoryList.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : containerHistoryList.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No container scans yet.</p>
            ) : (
              <ul className="space-y-3">
                {containerHistoryList.map((row) => {
                  const idKey = row.id ?? row.name ?? Math.random().toString(36).slice(2);
                  const selected = containerReport?.imageName === row.name || containerReport?.id === row.id;
                  const progress = row.progress ?? row.progres ?? 0;
                  return (
                    <li key={idKey}>
                      <button
                        type="button"
                        onClick={() => void openContainerSummary(row)}
                        disabled={openingImageId === (row.id ?? row.name)}
                        className={`w-full text-left p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors border ${
                          selected
                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                            : "bg-secondary/50 border-transparent hover:bg-secondary hover:border-border"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={row.name}>
                            {row.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {row.tag ? `tag: ${row.tag} · ` : ""}{row.status ?? "-"} · {progress}%
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-sm">
                          {openingImageId === (row.id ?? row.name) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : null}
                          {row.status ? <span className={`font-medium ${severityClass(row.status)}`}>{row.status}</span> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Dialog
            open={Boolean(containerReport)}
            onOpenChange={(open) => {
              if (!open) setContainerReport(null);
            }}
          >
            <DialogContent className="max-h-[80vh] w-full max-w-4xl overflow-auto p-4 sm:p-6 gap-4">
              {containerReport ? (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle>Image Summary</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Image</p>
                        <p className="font-medium break-all">{containerReport.imageName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Generated: {containerReport.finishedAt ?? containerReport.startedAt ?? "—"}</p>
                      </div>
                      <div />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-36 h-36 flex-shrink-0 mx-auto sm:mx-0 mb-2 sm:mb-0">
                          {(() => {
                            const critical = Number(containerReport.criticalVulnerabilities ?? 0);
                            const high = Number(containerReport.highetVulnerabilities ?? 0);
                            const medium = Number(containerReport.mediumVulnerabilities ?? 0);
                            const low = Number(containerReport.lowetVulnerabilities ?? 0);
                            const total = critical + high + medium + low || Number(containerReport.totalVulnerabilities ?? 0) || 0;
                            const segments = [
                              { key: 'critical', label: 'Critical', value: critical, color: '#ef4444' },
                              { key: 'high', label: 'High', value: high, color: '#f97316' },
                              { key: 'medium', label: 'Medium', value: medium, color: '#fbbf24' },
                              { key: 'low', label: 'Low', value: low, color: '#3b82f6' },
                            ];
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
                                          style={{ cursor: 'pointer', transition: 'stroke-width 120ms' }}
                                          onClick={() => { setSeverityFilter(s.key); }}
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
                                    const active = hoverSegment ?? (severityFilter === 'all' ? null : severityFilter);
                                    const valueText = active ? String(segments.find(s => s.key === active)?.value ?? 0) : String(total);
                                    const labelText = active ? (segments.find(s => s.key === active)?.label ?? '') : 'Total CVEs';
                                    return (
                                      <>
                                        <text x={0} y={-4} textAnchor="middle" className="text-lg font-semibold" style={{ fontSize: '16px' }}>
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

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="text-sm font-medium">Vulnerabilities</div>
                            <div className="flex flex-wrap gap-2">
                              <button className={`px-2 py-1 rounded text-xs ${severityFilter === 'all' ? 'bg-green-500 text-white' : 'bg-muted-foreground/10'}`} onClick={() => setSeverityFilter('all')}>All</button>
                              <button className={`px-2 py-1 rounded text-xs ${severityFilter === 'critical' ? 'bg-red-500 text-white' : 'bg-muted-foreground/10'}`} onClick={() => setSeverityFilter('critical')}>Critical</button>
                              <button className={`px-2 py-1 rounded text-xs ${severityFilter === 'high' ? 'bg-orange-500 text-white' : 'bg-muted-foreground/10'}`} onClick={() => setSeverityFilter('high')}>High</button>
                              <button className={`px-2 py-1 rounded text-xs ${severityFilter === 'medium' ? 'bg-amber-500 text-white' : 'bg-muted-foreground/10'}`} onClick={() => setSeverityFilter('medium')}>Medium</button>
                              <button className={`px-2 py-1 rounded text-xs ${severityFilter === 'low' ? 'bg-blue-500 text-white' : 'bg-muted-foreground/10'}`} onClick={() => setSeverityFilter('low')}>Low</button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical: {containerReport.criticalVulnerabilities ?? 0}</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> High: {containerReport.highetVulnerabilities ?? 0}</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Medium: {containerReport.mediumVulnerabilities ?? 0}</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Low: {containerReport.lowetVulnerabilities ?? 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Vulnerability Details</h3>
                        <div className="flex items-center gap-2">
                          {[["all","All"],["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"],["info","Info"]].map(([key,label]) => (
                            <button key={String(key)} onClick={() => setSeverityFilter(String(key))} className={`px-3 py-1 text-xs rounded ${severityFilter===String(key)?"bg-primary text-white":"bg-secondary/60"}`}>
                              {String(label)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredVulnerabilities.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-4">No vulnerabilities listed for this filter.</p>
                      ) : (
                        <div className="overflow-x-auto mt-4">
                          <table className="w-full text-sm table-auto border-collapse">
                            <thead>
                              <tr className="text-left">
                                <th className="p-2 border-b">Package</th>
                                <th className="p-2 border-b">Vulnerability</th>
                                <th className="p-2 border-b">Severity</th>
                                <th className="p-2 border-b">Fixed Version</th>
                                <th className="p-2 border-b">Source</th>
                              </tr>
                            </thead>
                            <tbody>
                                  {filteredVulnerabilities.map((vul, i) => {
                                const pkg = String((vul as any).package ?? (vul as any).pkg ?? "-");
                                const id = String((vul as any).vulnerability ?? (vul as any).id ?? "-");
                                const sev = String((vul as any).severity ?? "Unknown");
                                const src = String((vul as any).source ?? "");
                                const fixed = String((vul as any).fixedVersion ?? (vul as any).fixed ?? "Not available");
                                return (
                                  <tr key={`${id}-${i}`} className="align-top hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedVuln(vul as Record<string, any>)}>
                                    <td className="p-3 border-b">{pkg}</td>
                                    <td className="p-3 border-b">{id}</td>
                                    <td className="p-3 border-b"><span className={`px-2 py-1 rounded text-xs font-semibold ${sev.toLowerCase()==='critical'? 'bg-red-100 text-red-800' : sev.toLowerCase()==='high'? 'bg-orange-100 text-orange-800' : sev.toLowerCase()==='medium'? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{sev}</span></td>
                                    <td className="p-3 border-b">{fixed}</td>
                                    <td className="p-3 border-b">{src}</td>
                                  </tr>
                                );
                              })}
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
          <Dialog
            open={Boolean(selectedVuln)}
            onOpenChange={(open) => {
              if (!open) setSelectedVuln(null);
            }}
          >
            <DialogContent className="max-h-[70vh] w-full max-w-xl overflow-auto p-6 gap-4">
              {selectedVuln ? (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle>Vulnerability details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Package</p>
                      <p className="font-medium">{String(selectedVuln.package ?? selectedVuln.pkg ?? "-")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vulnerability</p>
                      <p className="font-medium">{String(selectedVuln.vulnerability ?? selectedVuln.id ?? "-")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className={`font-semibold ${severityClass(String(selectedVuln.severity ?? ""))}`}>{String(selectedVuln.severity ?? "Unknown")}</p>
                    </div>
                    {selectedVuln.explenation || selectedVuln.explanation ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Explanation</p>
                        <p className="text-sm text-muted-foreground mt-1">{String(selectedVuln.explenation ?? selectedVuln.explanation)}</p>
                      </div>
                    ) : null}
                    {selectedVuln.batch ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Recommendation / Patch</p>
                        <p className="text-sm text-muted-foreground mt-1">{String(selectedVuln.batch)}</p>
                      </div>
                    ) : null}
                    {selectedVuln.source ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="text-sm">{String(selectedVuln.source)}</p>
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

export default ScanContainer;
