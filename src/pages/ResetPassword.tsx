import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";
import { resetPassword, validateResetToken } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isResetTokenValid, setIsResetTokenValid] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!email || !token) {
        if (!cancelled) {
          setIsResetTokenValid(false);
          setValidating(false);
        }
        return;
      }

      setValidating(true);
      setIsResetTokenValid(null);
      setSubmitError(null);

      try {
        const res = await validateResetToken(email, token);
        if (cancelled) return;
        if (res.ok) {
          setIsResetTokenValid(true);
        } else {
          setIsResetTokenValid(false);
        }
      } catch {
        if (cancelled) return;
        setIsResetTokenValid(false);
      } finally {
        if (!cancelled) setValidating(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [email, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!newPassword) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(email, token, newPassword);
      if (!res?.ok) {
        const message = res?.data?.message || "Unable to reset password";
        setSubmitError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }

      const message = res?.data?.message || "Password reset successful";
      toast({ title: "Success", description: message });
      navigate("/login");
    } catch (err: any) {
      const message = err?.message || "Unable to reset password";
      setSubmitError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const expiredMessage =
    "This password reset link has expired or is invalid. Please request a new one.";

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {validating ? (
          <div className="text-center">
            <CyberLogo size="lg" />
            <h2 className="text-2xl font-bold mt-4">Verifying your reset link...</h2>
          </div>
        ) : isResetTokenValid ? (
          <>
            <div className="text-center mb-8">
              <CyberLogo size="lg" />
              <h2 className="text-2xl font-bold mt-4">Reset password</h2>
              <p className="text-sm text-muted-foreground">Enter your new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="cyber-input"
              />

              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

              <Button type="submit" disabled={loading} className="w-full">
                Reset password
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <CyberLogo size="lg" />
            <h2 className="text-2xl font-bold mt-4">Reset password</h2>
            <p className="text-sm text-muted-foreground mt-2">{expiredMessage}</p>

            <div className="mt-6">
              <Button onClick={() => navigate("/forgot-password")} className="w-full">
                Request a new reset link
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
