import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  triageExtractSampleId,
  triageReportFromOverview,
  triageSampleOverview,
  triageSampleStatus,
  triageSubmitFile,
  type TriageReportView,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const POLL_MS = 4000;
const RESULT_TTL_MS = 5 * 60 * 1000; // keep the result for 5 minutes after leaving
const CACHE_KEY = "file_scan_result";

type ScanMeta = { fileName: string; fileSize: number };
type CachedResult = { report: TriageReportView; meta: ScanMeta; expiresAt: number };

// ── Ephemeral result cache (localStorage + rolling 5-minute TTL) ───────────
// The result is not stored in the database. It is kept client-side so it
// survives navigation/refresh, and is discarded 5 minutes after the user
// leaves the page.
function readCache(): CachedResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedResult;
    if (!parsed || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
function writeCache(report: TriageReportView, meta: ScanMeta) {
  try {
    const payload: CachedResult = { report, meta, expiresAt: Date.now() + RESULT_TTL_MS };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable — result just won't persist */
  }
}
function touchCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CachedResult;
    parsed.expiresAt = Date.now() + RESULT_TTL_MS;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}
function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function isReportedStatus(s: string | undefined) {
  return (s || "").toLowerCase() === "reported";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function severityFromScore(score?: number): string {
  if (score == null) return "unknown";
  if (score >= 8) return "critical";
  if (score >= 6) return "high";
  if (score >= 4) return "medium";
  if (score >= 2) return "low";
  return "clean";
}

const FileUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pollHint, setPollHint] = useState<string | null>(null);
  const [report, setReport] = useState<TriageReportView | null>(null);
  const [meta, setMeta] = useState<ScanMeta | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasResultRef = useRef(false);
  hasResultRef.current = report != null;

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Auth guard + restore a recent (< 5 min) result on mount.
  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login", { replace: true });
      return;
    }
    const cached = readCache();
    if (cached) {
      setReport(cached.report);
      setMeta(cached.meta);
      touchCache(); // user is active again → restart the 5-minute window
    }
  }, [navigate]);

  // Keep the result alive while the page is open, and start the 5-minute
  // countdown when the user leaves (SPA nav, tab hide, refresh, or close).
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (hasResultRef.current) touchCache();
    }, 60 * 1000);

    const onLeave = () => {
      if (hasResultRef.current) touchCache();
    };
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onLeave);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      clearPoll();
      onLeave(); // navigating away within the app → begin 5-minute expiry
    };
  }, [clearPoll]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleClear = () => {
    clearPoll();
    clearCache();
    setFile(null);
    setReport(null);
    setMeta(null);
    setBusy(false);
    setPollHint(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchOverview = useCallback(async (sampleId: string) => {
    const ov = await triageSampleOverview(sampleId);
    if (ov.status === 409) return null;
    if (!ov.ok || !ov.data) return null;
    return triageReportFromOverview(ov.data, sampleId);
  }, []);

  const runPoll = useCallback(
    (sampleId: string, scanMeta: ScanMeta) => {
      clearPoll();
      setPollHint("Analysis in progress. This page will update automatically.");

      const tick = async () => {
        const st = await triageSampleStatus(sampleId);
        if (!st.ok || !st.data) return;

        if (isReportedStatus(st.data.status)) {
          clearPoll();
          setPollHint(null);
          setBusy(false);
          const view = await fetchOverview(sampleId);
          if (view) {
            setReport(view);
            setMeta(scanMeta);
            writeCache(view, scanMeta);
            toast({ title: "Analysis ready", description: "Results are shown below for 5 minutes." });
          } else {
            toast({
              title: "Could not load report",
              description: "Please try again in a moment.",
              variant: "destructive",
            });
          }
        }
      };

      void tick();
      pollRef.current = setInterval(() => void tick(), POLL_MS);
    },
    [clearPoll, fetchOverview, toast]
  );

  const handleSubmit = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!file) {
      toast({ title: "No file selected", description: "Choose a file to analyze.", variant: "destructive" });
      return;
    }

    const scanMeta: ScanMeta = { fileName: file.name, fileSize: file.size };

    clearPoll();
    clearCache();
    setReport(null);
    setMeta(null);
    setBusy(true);
    setPollHint("Uploading file…");

    try {
      const res = await triageSubmitFile(file, token);
      if (!res.ok || !res.data) {
        setBusy(false);
        setPollHint(null);
        toast({
          title: "Could not start scan",
          description: res.status === 413 ? "File is too large." : "Please try again.",
          variant: "destructive",
        });
        return;
      }

      const sampleId = triageExtractSampleId(res.data);
      if (!sampleId) {
        setBusy(false);
        setPollHint(null);
        toast({ title: "Could not start scan", description: "Something went wrong. Please try again.", variant: "destructive" });
        return;
      }

      runPoll(sampleId, scanMeta);
    } catch (e: unknown) {
      setBusy(false);
      setPollHint(null);
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Upload File</h1>
          <p className="text-primary mb-8">
            Upload a sample from your local machine for sandbox analysis. Results
            are shown here temporarily (about 5 minutes) and are not saved.
          </p>

          {/* File Input */}
          <div className="flex gap-2 mb-4">
            <div
              className="cyber-input-white flex-1 cursor-pointer flex items-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-gray-500">
                {file ? file.name : "Drop file for analysis OR browse"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="destructive" onClick={handleClear} disabled={busy}>
              Clear
            </Button>
            <Button variant="cyber" onClick={handleSubmit} disabled={busy || !file}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>

          {pollHint && (
            <p className="text-sm text-muted-foreground mb-8">{pollHint}</p>
          )}

          {report && (
            <div className="animate-slide-in mt-6">
              <h2 className="text-2xl font-bold mb-6">Analysis Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details */}
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Target</span> :{" "}
                    {report.target || meta?.fileName || "—"}
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Size</span> :{" "}
                    {meta ? formatSize(meta.fileSize) : "—"}
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Threat Level</span> :{" "}
                    <span className="capitalize">
                      {report.severity || severityFromScore(report.score)}
                    </span>
                  </div>
                  {report.tags && report.tags.length > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <span className="text-primary font-medium">Tags</span> :{" "}
                      {report.tags.join(", ")}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold mb-2">Score</h3>
                  <p className="text-4xl font-bold">{report.score ?? 0}/10</p>
                </div>
              </div>

              {/* High-risk signatures */}
              {report.signatures.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">High-risk signatures</h3>
                  <div className="space-y-2">
                    {report.signatures.map((sig, i) => (
                      <div key={`${sig.name}-${i}`} className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sig.name}</span>
                          {sig.score != null && (
                            <span className="text-sm text-muted-foreground">score {sig.score}</span>
                          )}
                        </div>
                        {sig.description && (
                          <p className="text-sm text-muted-foreground mt-1">{sig.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FileUpload;
