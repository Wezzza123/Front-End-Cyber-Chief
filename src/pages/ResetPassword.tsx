import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !token || !newPassword) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(email, token, newPassword);
      const message = res?.data?.message || "Password reset successful";
      toast({ title: "Success", description: message });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CyberLogo size="lg" />
          <h2 className="text-2xl font-bold mt-4">Reset password</h2>
          <p className="text-sm text-muted-foreground">Enter the email, token and your new password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cyber-input"
          />

          <input
            type="text"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="cyber-input"
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="cyber-input"
          />

          <Button type="submit" disabled={loading} className="w-full">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
