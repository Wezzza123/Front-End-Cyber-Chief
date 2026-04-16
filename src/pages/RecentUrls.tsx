import { useEffect, useState, type CSSProperties } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { dashboardAllScannedUrls, type DashboardScannedUrlItem } from "@/lib/api";

function scoreBadgeStyle(score: number): CSSProperties {
  const clamped = Math.min(10, Math.max(1, score));
  const t = (clamped - 1) / 9;
  const hue = Math.round(120 * (1 - t));
  return {
    backgroundColor: `hsl(${hue} 72% 38%)`,
    color: "hsl(0 0% 98%)",
  };
}

const RecentUrls = () => {
  const [recentUrls, setRecentUrls] = useState<DashboardScannedUrlItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecentLoading(true);
      setRecentError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const { ok, data, status } = await dashboardAllScannedUrls(token);
      if (cancelled) return;
      if (!ok) {
        setRecentError(`Could not load recent URLs (${status}).`);
        setRecentUrls([]);
      } else {
        setRecentUrls(data);
      }
      setRecentLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 gradient-mesh min-h-full relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 800" fill="none">
            <path d="M0 400 Q 250 300 500 400 T 1000 400" stroke="currentColor" strokeWidth="1" className="text-primary" />
            <path d="M0 500 Q 250 400 500 500 T 1000 500" stroke="currentColor" strokeWidth="1" className="text-primary" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <div className="cyber-card">
            <h3 className="text-xl font-bold mb-6">All Checked URLs</h3>
            {recentLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentError ? (
              <p className="text-sm text-destructive">{recentError}</p>
            ) : recentUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scanned URLs yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUrls.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg min-h-12"
                  >
                    <span className="text-sm text-muted-foreground truncate flex-1 mr-3">
                      {item.url}
                    </span>
                    <span
                      className="px-3 py-0.5 rounded-full text-sm font-medium tabular-nums shrink-0"
                      style={scoreBadgeStyle(item.score)}
                    >
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecentUrls;
