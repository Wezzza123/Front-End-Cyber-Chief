import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import {
  webScanHistory,
  webScanReport,
  webScanStart,
  webScanStatus,
  type WebScanHistoryItem,
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

const ScanWebsite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<WebScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingTarget, setDownloadingTarget] = useState<string | null>(null);
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
              ? "This target was already scanned. You can download the report."
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

  const handleDownloadReport = async (target: string) => {
    const t = localStorage.getItem("auth_token");
    if (!t) {
      navigate("/login");
      return;
    }
    setDownloadingTarget(target);
    try {
      const res = await webScanReport(target, t);
      if (!res.ok || !res.blob) {
        toast({
          title: "Report unavailable",
          description: `Could not download report (${res.status}).`,
          variant: "destructive",
        });
        return;
      }
      const safe = target.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(res.blob);
      a.download = `webscan-report-${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Report downloaded" });
    } catch (e: unknown) {
      toast({
        title: "Report unavailable",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setDownloadingTarget(null);
    }
  };

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
              live status, and a PDF report when the scan completes. You must be signed in.
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
                          onClick={() => void handleDownloadReport(row.target)}
                          disabled={downloadingTarget === row.target}
                        >
                          {downloadingTarget === row.target ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScanWebsite;
