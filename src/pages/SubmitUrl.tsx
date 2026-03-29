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
  triageExtractSampleId,
  triageMyHistory,
  triageReportFromOverview,
  triageReportFromSubmitPayload,
  triageSampleOverview,
  triageSampleStatus,
  triageSubmitUrl,
  type TriageHistoryScan,
  type TriageReportView,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const POLL_MS = 4000;

const MSG_SCAN_RUNNING = "Your scan is running. The report will open when it is ready.";
const MSG_ANALYSIS_READY = "Your results are ready in the report window.";
const MSG_POLL_UI = "Analysis in progress. This page will update automatically.";

function normalizeUrl(input: string) {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isReportedStatus(s: string | undefined) {
  return (s || "").toLowerCase() === "reported";
}

function isRunningStatus(s: string | undefined) {
  const x = (s || "").toLowerCase();
  return x === "pending" || x === "running";
}

const SubmitUrl = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<TriageReportView | null>(null);
  const [history, setHistory] = useState<TriageHistoryScan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pollHint, setPollHint] = useState<string | null>(null);
  const [openingSampleId, setOpeningSampleId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadHistory = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      const t = localStorage.getItem("auth_token");
      if (!t) return;
      if (!silent) setHistoryLoading(true);
      try {
        const res = await triageMyHistory(t);
        if (!res.ok) {
          if (!silent) {
            toast({
              title: "Could not load history",
              description: res.status === 401 ? "Session expired. Please log in again." : `Error ${res.status}`,
              variant: "destructive",
            });
          }
          return;
        }
        const sorted = [...res.data].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
        setHistory(sorted);
      } catch (e: unknown) {
        if (!silent) {
          toast({ title: "Could not load history", description: e instanceof Error ? e.message : "Network error", variant: "destructive" });
        }
      } finally {
        if (!silent) setHistoryLoading(false);
      }
    },
    [toast]
  );

  const fetchOverview = useCallback(
    async (sampleId: string): Promise<TriageReportView | null> => {
      const ov = await triageSampleOverview(sampleId);
      if (ov.status === 409) return null;
      if (!ov.ok || !ov.data) return null;
      return triageReportFromOverview(ov.data, sampleId);
    },
    []
  );

  const runPoll = useCallback(
    (sampleId: string) => {
      clearPoll();
      setPollHint(MSG_POLL_UI);

      const tick = async () => {
        void loadHistory({ silent: true });
        const st = await triageSampleStatus(sampleId);
        if (!st.ok || !st.data) {
          setPollHint(MSG_POLL_UI);
          return;
        }
        setPollHint(MSG_POLL_UI);

        if (isReportedStatus(st.data.status)) {
          clearPoll();
          setPollHint(null);
          const view = await fetchOverview(sampleId);
          if (view) {
            setReport(view);
            toast({ title: "Analysis ready", description: MSG_ANALYSIS_READY });
          } else {
            toast({ title: "Could not load report", description: "Please try again in a moment.", variant: "destructive" });
          }
          await loadHistory({ silent: true });
          return;
        }

        if (!isRunningStatus(st.data.status) && !isReportedStatus(st.data.status)) {
          setPollHint(MSG_POLL_UI);
        }
      };

      void tick();
      pollRef.current = setInterval(() => void tick(), POLL_MS);
    },
    [clearPoll, fetchOverview, loadHistory, toast]
  );

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login", { replace: true });
      return;
    }
    void loadHistory();
  }, [navigate, loadHistory]);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const openHistoryReport = useCallback(
    async (row: TriageHistoryScan) => {
      setOpeningSampleId(row.sampleId);
      try {
        const view = await fetchOverview(row.sampleId);
        if (view) {
          setReport(view);
          return;
        }
        if (row.score != null || row.severity) {
          setReport({
            sampleId: row.sampleId,
            target: row.url,
            score: row.score,
            severity: row.severity,
            tags: undefined,
            signatures: [],
          });
          return;
        }
        toast({ title: "Still processing", description: "This scan is not finished yet. Try again in a little while.", variant: "destructive" });
      } catch {
        toast({ title: "Could not open report", description: "Please try again.", variant: "destructive" });
      } finally {
        setOpeningSampleId(null);
      }
    },
    [fetchOverview, toast]
  );

  const handleSubmit = async () => {
    const t = localStorage.getItem("auth_token");
    if (!t) {
      navigate("/login");
      return;
    }
    const target = normalizeUrl(url);
    if (!target) {
      toast({ title: "URL required", description: "Enter a URL to analyze.", variant: "destructive" });
      return;
    }

    clearPoll();
    setSubmitting(true);
    setPollHint(null);
    setReport(null);

    try {
      const res = await triageSubmitUrl(target, t);
      if (!res.ok || !res.data) {
        toast({ title: "Could not start scan", description: "Please check the URL and try again.", variant: "destructive" });
        return;
      }

      const data = res.data;
      const sampleId = triageExtractSampleId(data);
      if (!sampleId) {
        toast({ title: "Could not start scan", description: "Something went wrong. Please try again.", variant: "destructive" });
        return;
      }

      setUrl("");

      const inline = triageReportFromSubmitPayload(data);
      const hasInlineSummary = inline && (inline.signatures.length > 0 || inline.score != null || (inline.tags?.length ?? 0) > 0);
      if (hasInlineSummary && inline) {
        const enriched = await fetchOverview(sampleId);
        setReport(enriched ?? inline);
        toast({ title: data.alreadyCached ? "Earlier result loaded" : "Analysis ready", description: MSG_ANALYSIS_READY });
        await loadHistory({ silent: true });
        return;
      }

      if (data.alreadyCached) {
        setPollHint("Opening your report…");
        let view = await fetchOverview(sampleId);
        if (!view) {
          toast({ title: "Scan started", description: MSG_SCAN_RUNNING });
          void loadHistory({ silent: true });
          runPoll(sampleId);
          return;
        }
        setPollHint(null);
        setReport(view);
        toast({ title: "Analysis ready", description: MSG_ANALYSIS_READY });
        await loadHistory({ silent: true });
        return;
      }

      toast({ title: "Scan started", description: MSG_SCAN_RUNNING });
      void loadHistory({ silent: true });
      runPoll(sampleId);
    } catch (e: unknown) {
      toast({ title: "Submit failed", description: e instanceof Error ? e.message : "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const severityClass = (sev: string | undefined) => {
    const s = (sev || "").toLowerCase();
    if (s === "critical") return "text-destructive";
    if (s === "high") return "text-orange-600 dark:text-orange-400";
    if (s === "medium") return "text-amber-700 dark:text-amber-400";
    if (s === "low") return "text-yellow-700 dark:text-yellow-500";
    if (s === "clean") return "text-muted-foreground";
    return "text-foreground";
  };

  if (!token) return null;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 gradient-mesh min-h-full">
        <div className="max-w-xl sm:max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">URL Deep Scanning</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Triage analysis: behavioral score, severity, and notable signatures. Sign in required. Tap a past scan in
            your history to open its report in a pop-up.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              className="cyber-input-white flex-1 h-12 rounded-lg px-4"
              disabled={submitting}
            />
            <Button
              variant="cyber"
              onClick={() => void handleSubmit()}
              className="w-full sm:w-12 h-12 shrink-0"
              disabled={submitting}
              aria-label="Analyze URL"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="inline sm:hidden">Analyze</span>
                  <ArrowRight className="w-5 h-5 hidden sm:inline" />
                </>
              )}
            </Button>
          </div>

          {pollHint && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              {pollHint}
            </div>
          )}

          <div className="cyber-card-white mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Your Triage history</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tap a row to open its report in a pop-up. The list updates when a scan finishes.
              </p>
            </div>

            {historyLoading && history.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No scans yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((row) => {
                  const selected = report?.sampleId === row.sampleId;
                  return (
                    <li key={`${row.sampleId}-${row.scannedAt}`}>
                      <button
                        type="button"
                        onClick={() => void openHistoryReport(row)}
                        disabled={openingSampleId === row.sampleId}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors border ${
                          selected
                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                            : "bg-secondary/50 border-transparent hover:bg-secondary hover:border-border"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={row.url}>
                            {row.url}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(row.scannedAt).toLocaleString()} · {row.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-sm">
                          {openingSampleId === row.sampleId ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : null}
                          {row.score != null && <span>Score {row.score}/10</span>}
                          {row.severity ? (
                            <span className={`font-medium ${severityClass(row.severity)}`}>{row.severity}</span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Dialog
            open={Boolean(report)}
            onOpenChange={(open) => {
              if (!open) setReport(null);
            }}
          >
            <DialogContent className="max-h-[90vh] w-screen h-screen sm:w-[calc(100vw-2rem)] sm:h-auto sm:max-w-4xl overflow-y-auto p-6 gap-4">
              {report ? (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle>Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-1">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="font-medium break-all">{report.target ?? "—"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Sample: {report.sampleId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Score / severity</p>
                        <p className="text-2xl font-bold">
                          {report.score != null ? `${report.score}/10` : "—"} {report.severity ? (
                            <span className={`text-lg font-semibold ${severityClass(report.severity)}`}>
                              ({report.severity})
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    {report.tags && report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {report.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {report.signatures.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Notable signatures</h3>
                        <ul className="space-y-2">
                          {report.signatures.slice(0, 12).map((sig, i) => (
                            <li key={`${sig.name}-${i}`} className="text-sm border-l-2 border-primary/40 pl-3">
                              <span className="font-medium">{sig.name}</span>
                              {sig.score != null && (
                                <span className="text-muted-foreground"> · score {sig.score}</span>
                              )}
                              {sig.description ? (
                                <p className="text-muted-foreground mt-0.5">{sig.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        {report.signatures.length > 12 ? (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{report.signatures.length - 12} more
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No signature list for this view. Run a new scan or open a completed item once the full report is
                        available.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile sticky action */}
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-50">
          <Button variant="cyber" onClick={() => void handleSubmit()} className="w-full h-12" disabled={submitting}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubmitUrl;
