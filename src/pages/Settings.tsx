import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type ThemeMode = "dark" | "light";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("theme", "light");
  } else {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem("theme");
  }
}

const Settings = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  const isLight = theme === "light";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const onToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? "light" : "dark");
  };

  const modeBadge = useMemo(() => {
    return isLight ? "White Mode" : "Dark Mode";
  }, [isLight]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 gradient-mesh min-h-full">
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="cyber-card">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Toggle the theme between the current dark mode and a bright white mode.
                </p>
              </div>
              <Badge variant="secondary">{modeBadge}</Badge>
            </div>

            <div className="flex items-center justify-between gap-6 py-3 border-t border-border">
              <div>
                <div className="font-medium">White mode</div>
                <div className="text-sm text-muted-foreground">
                  Uses light colors without changing the current dark appearance.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Dark</span>
                <Switch checked={isLight} onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")} />
                <span className="text-sm text-muted-foreground">White</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setTheme("dark")}
                disabled={!isLight}
                className="min-w-[160px]"
              >
                Use Dark
              </Button>
              <Button
                variant="outline"
                onClick={() => setTheme("light")}
                disabled={isLight}
                className="min-w-[160px]"
              >
                Use White
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

