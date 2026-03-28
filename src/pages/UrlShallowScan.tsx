import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  urlExpanderExtract,
  urlExpanderMyHistory,
  type UrlExpanderExtractResult,
  type UrlExpanderHistoryItem,
  type UrlExpanderSecurityAnalysis,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const LIST_PREVIEW = 3;

function normalizeUrl(input: string) {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function pickDisplayUrl(r: UrlExpanderExtractResult) {
  return r.OriginalURL || r.ExpandedURL || "—";
}

function AnalysisSummary({ a }: { a: UrlExpanderSecurityAnalysis | undefined }) {
  if (!a) return <p className="text-muted-foreground text-sm">No analysis returned.</p>;

  const reds = a.RedFlags ?? [];
  const warns = a.Warnings ?? [];
  const redShown = reds.slice(0, LIST_PREVIEW);
  const warnShown = warns.slice(0, LIST_PREVIEW);
  const redMore = Math.max(0, reds.length - LIST_PREVIEW);
  const warnMore = Math.max(0, warns.length - LIST_PREVIEW);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            a.IsSafe === false
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary"
          }`}
        >
          {a.IsSafe === false ? "Not safe" : a.IsSafe === true ? "Marked safe" : "Unknown"}
        </span>
        <span className="text-lg font-semibold">{a.ThreatLevel ?? "—"}</span>
      </div>
      {a.Message ? (
        <p className="text-sm text-foreground/90 leading-relaxed">{a.Message}</p>
      ) : null}

      {(redShown.length > 0 || (a.RedFlagCount ?? 0) > 0) && (
        <div>
          <p className="text-xs font-medium text-destructive mb-1">
            Red flags ({a.RedFlagCount ?? reds.length})
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {redShown.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {redMore > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">+{redMore} more</p>
          ) : null}
        </div>
      )}

      {(warnShown.length > 0 || (a.WarningCount ?? 0) > 0) && (
        <div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
            Warnings ({a.WarningCount ?? warns.length})
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {warnShown.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {warnMore > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">+{warnMore} more</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

const UrlShallowScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<UrlExpanderHistoryItem[]>([]);
  const [latest, setLatest] = useState<UrlExpanderExtractResult | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const loadHistory = useCallback(async () => {
    const t = localStorage.getItem("auth_token");
    if (!t) return;
    setHistoryLoading(true);
    try {
      const res = await urlExpanderMyHistory(t);
      if (!res.ok) {
        toast({
          title: "Could not load history",
          description: res.status === 401 ? "Session expired. Please log in again." : `Error ${res.status}`,
          variant: "destructive",
        });
        setHistory([]);
        return;
      }
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
      );
      setHistory(sorted);
    } catch (e: unknown) {
      toast({
        title: "Could not load history",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login", { replace: true });
      return;
    }
    void loadHistory();
  }, [navigate, loadHistory]);

  const handleScan = async () => {
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

    setLoading(true);
    try {
      const res = await urlExpanderExtract(target, t);
      if (!res.ok || !res.data) {
        toast({
          title: "Scan failed",
          description: `Could not analyze URL (${res.status}).`,
          variant: "destructive",
        });
        return;
      }
      setLatest(res.data);
      setUrl("");
      toast({ title: "Analysis complete", description: pickDisplayUrl(res.data) });
      await loadHistory();
    } catch (e: unknown) {
      toast({
        title: "Scan failed",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">URL Shallow Scanning</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Quick link check: threat level, safety signal, and key warnings. Sign in required.
          </p>

          <div className="flex gap-2 mb-8">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleScan()}
              className="cyber-input-white flex-1"
              disabled={loading}
            />
            <Button
              variant="cyber"
              size="icon"
              onClick={() => void handleScan()}
              className="w-12 h-12 shrink-0"
              disabled={loading}
              aria-label="Analyze URL"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          {latest && (
            <div className="cyber-card-white mb-8 animate-slide-in">
              <h2 className="text-lg font-semibold mb-1">Latest result</h2>
              <p className="text-sm text-muted-foreground truncate mb-4" title={pickDisplayUrl(latest)}>
                {pickDisplayUrl(latest)}
              </p>
              <AnalysisSummary a={latest.SecurityAnalysis} />
            </div>
          )}

          <div className="cyber-card-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent analyses</h2>
              <Button variant="outline" size="sm" onClick={() => void loadHistory()} disabled={historyLoading}>
                {historyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {historyLoading && history.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No history yet. Analyze a URL above.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((row) => {
                  const sa = row.result?.SecurityAnalysis;
                  const level = sa?.ThreatLevel ?? "—";
                  const safe = sa?.IsSafe;
                  return (
                    <li
                      key={`${row.url}-${row.analyzedAt}`}
                      className="p-4 bg-secondary/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={row.url}>
                          {row.url}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(row.analyzedAt).toLocaleString()}
                        </p>
                        {sa?.Message ? (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sa.Message}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium">{level}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            safe === false
                              ? "bg-destructive/15 text-destructive"
                              : safe === true
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {safe === false ? "Risk" : safe === true ? "OK" : "—"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UrlShallowScan;
