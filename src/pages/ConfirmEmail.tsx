import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import CyberLogo from "@/components/CyberLogo";
import { Button } from "@/components/ui/button";
import { confirmEmail } from "@/lib/api";

type ConfirmState = "loading" | "success" | "error";

const extractApiMessage = (data: unknown): string => {
  if (!data || typeof data !== "object") return "";
  const payload = data as Record<string, unknown>;
  const raw = payload.message ?? payload.Message;
  return typeof raw === "string" ? raw : "";
};

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState("Confirming your email...");

  const hasRequiredParams = useMemo(() => Boolean(userId && token), [token, userId]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    if (!hasRequiredParams || !userId || !token) {
      setState("error");
      setMessage("Invalid confirmation link. Please go to login and request a new confirmation email.");
      return;
    }

    (async () => {
      try {
        const res = await confirmEmail(userId, token);
        if (cancelled) return;

        const apiMessage = extractApiMessage(res?.data);

        if (!res?.ok) {
          setState("error");
          setMessage(apiMessage || "Email confirmation failed. The link may be invalid or expired.");
          return;
        }

        setState("success");
        setMessage(apiMessage || "Email confirmed! You can now log in.");

        timer = window.setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } catch (err: any) {
        if (cancelled) return;
        setState("error");
        setMessage(err?.message || "Unable to confirm email right now. Please try again later.");
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasRequiredParams, navigate, token, userId]);

  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background/80 backdrop-blur p-8 shadow-2xl animate-slide-in text-center">
        <div className="flex justify-center mb-6">
          <CyberLogo size="sm" />
        </div>

        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Confirming Email</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Email Confirmed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login in 3 seconds...</p>
          </>
        )}

        {state === "error" && (
          <>
            <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Confirmation Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/login">
              <Button variant="cyber-white" size="lg" className="w-full">
                Go to Login
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
