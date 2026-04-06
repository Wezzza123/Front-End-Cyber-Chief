import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { dashboardAllScannedUrls, type DashboardScannedUrlItem } from "@/lib/api";

const userServices = [
  { label: "URL shallow scanning", path: "/url-shallow" },
  { label: "URL Deep scanning", path: "/url-deep" },
  { label: "Email chick", path: "/email-check" },
  { label: "Password chick", path: "/password-check" },
];

const devServices = [
  { label: "Scan Your Container", path: "/scan-container" },
  { label: "Scan Your Website", path: "/scan-website" },
  { label: "Scan Your File", path: "/file-upload" },
];

/** Score 1 → green, 10 → red (linear hue). Values outside 1–10 are clamped. */
function scoreBadgeStyle(score: number): CSSProperties {
  const clamped = Math.min(10, Math.max(1, score));
  const t = (clamped - 1) / 9;
  const hue = Math.round(120 * (1 - t));
  return {
    backgroundColor: `hsl(${hue} 72% 38%)`,
    color: "hsl(0 0% 98%)",
  };
}

const Dashboard = () => {
  const [recentUrls, setRecentUrls] = useState<DashboardScannedUrlItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecentLoading(true);
      setRecentError(null);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
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
        {/* Background decorative lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 800" fill="none">
            <path d="M0 400 Q 250 300 500 400 T 1000 400" stroke="currentColor" strokeWidth="1" className="text-primary" />
            <path d="M0 500 Q 250 400 500 500 T 1000 500" stroke="currentColor" strokeWidth="1" className="text-primary" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 items-stretch">
            {/* User Services */}
            <div className="cyber-card h-full flex flex-col p-6 sm:p-8 hover:shadow-xl transition-all duration-500 border border-primary/10 hover:border-primary/40 group relative overflow-hidden bg-gradient-to-b from-card to-card/50">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 tracking-tight text-foreground/90 group-hover:text-primary transition-colors relative z-10">User Services</h3>
              <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 relative z-10 min-h-[180px]">
                {userServices.map((service) => (
                  <Button key={service.path} asChild variant="outline" className="w-full justify-center h-12 sm:h-14 text-sm sm:text-base font-medium tracking-wide hover:bg-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <Link to={service.path}>{service.label}</Link>
                  </Button>
                ))}
              </div>
            </div> 

            {/* Dev Services */}
            <div className="cyber-card h-full flex flex-col p-6 sm:p-8 hover:shadow-xl transition-all duration-500 border border-primary/10 hover:border-primary/40 group relative overflow-hidden bg-gradient-to-b from-card to-card/50">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 tracking-tight text-foreground/90 group-hover:text-primary transition-colors relative z-10">Dev Services</h3>
              <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4 relative z-10 min-h-[180px]">
                {devServices.map((service) => (
                  <Button key={service.path} asChild variant="outline" className="w-full justify-center h-12 sm:h-14 text-sm sm:text-base font-medium tracking-wide hover:bg-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <Link to={service.path}>{service.label}</Link>
                  </Button>
                ))}
              </div>
            </div>  
          </div>

          {/* Recent Checked URLs */}
          <div className="cyber-card">
            <h3 className="text-lg font-semibold mb-4 sm:mb-6">Recent Checked URLs</h3>
            {recentLoading ? (
              <p className="text-sm sm:text-sm text-muted-foreground">Loading…</p>
            ) : recentError ? (
              <p className="text-xs sm:text-sm text-destructive">{recentError}</p>
            ) : recentUrls.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">No scanned URLs yet.</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentUrls.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg min-h-10 sm:min-h-12"
                  >
                    <span className="text-xs sm:text-sm text-muted-foreground truncate flex-1 mr-3">
                      {item.url}
                    </span>
                    <span
                      className="px-3 py-0.5 rounded-full text-xs sm:text-sm font-medium tabular-nums shrink-0"
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

export default Dashboard;
