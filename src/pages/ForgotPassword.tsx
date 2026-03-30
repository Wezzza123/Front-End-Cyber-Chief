import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CyberLogo from "@/components/CyberLogo";
import { toast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      const message = res?.data?.message || "Check your email for reset instructions";
      toast({ title: "Success", description: message });
      // Backend may return a message indicating the email is not registered
      if (message && message.toLowerCase().includes("not registered")) {
        // Let user know
        return;
      }
      // The reset-password page expects `?email=...&token=...` from the email link.
      // So after requesting a reset email, we send the user back to login.
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to send reset email", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CyberLogo size="lg" />
          <h2 className="text-2xl font-bold mt-4">Forgot password</h2>
          <p className="text-sm text-muted-foreground">Enter your email to receive reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cyber-input"
          />
          <Button type="submit" disabled={loading} className="w-full">
            Send reset email
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
