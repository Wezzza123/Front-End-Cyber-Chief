import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { inspectPassword, type PasswordInspectResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PasswordCheck = () => {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasswordInspectResponse | null>(null);

  const handleCheck = async () => {
    if (!password.trim()) {
      toast({ title: "Password required", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("auth_token");
    setLoading(true);
    setResult(null);
    try {
      const res = await inspectPassword(password, token);
      if (!res.ok || !res.data) {
        toast({
          title: "Check failed",
          description: `Request failed (${res.status}).`,
          variant: "destructive",
        });
        return;
      }
      setResult(res.data);
    } catch (e: unknown) {
      toast({
        title: "Check failed",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto pt-12">
          <h1 className="text-3xl font-bold mb-2">Password check</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Strength score, breach exposure (HIBP-style), and rough crack-time estimate. Your password is sent to the
            inspection API only for this check.
          </p>

          <div className="flex gap-2 mb-8">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleCheck()}
              className="cyber-input-white flex-1"
              autoComplete="off"
              disabled={loading}
            />
            <Button
              variant="cyber"
              size="icon"
              onClick={() => void handleCheck()}
              className="w-12 h-12 shrink-0"
              disabled={loading}
              aria-label="Check password"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          {result && (result.isPwned === false && (result.pwnedCount ?? 0) === 0) ? (
            <div className="cyber-card-white p-6 text-center animate-slide-in">
              <p className="text-lg font-semibold">No exposures found — this password appears safe.</p>
              <p className="text-sm text-muted-foreground">It was not found in known breaches.</p>
            </div>
          ) : result ? (
            <div className="cyber-card-white space-y-6 animate-slide-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Masked</p>
                  <p className="font-mono text-sm">{result.maskedPassword ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Strength</p>
                  <p className="text-lg font-semibold">
                    {result.scoreText ?? (result.score != null ? String(result.score) : "—")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entropy</p>
                  <p className="text-sm">
                    {result.entropyBits != null ? `${result.entropyBits.toFixed(2)} bits` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Est. crack time</p>
                  <p className="text-sm">{result.crackTimeDisplay ?? "—"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">Breaches</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.isPwned
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {result.isPwned ? "Found in breaches" : "Not found in known breaches"}
                  </span>
                  {result.pwnedCount != null && (
                    <span className="text-sm text-muted-foreground">
                      Count: {result.pwnedCount.toLocaleString()}
                    </span>
                  )}
                </div>
                {result.summary ? (
                  <p className="text-sm mt-3 text-foreground/90">{result.summary}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PasswordCheck;
