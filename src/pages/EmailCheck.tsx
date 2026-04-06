import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { requestOtpForEmail, verifyAndCheck } from "@/lib/api";

type Found = { email: string; password: string; hash: string; source?: string };

const EmailCheck = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [results, setResults] = useState<Found[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter an email", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await requestOtpForEmail(email);
      const message = res?.data?.message || "OTP sent if email exists";
      toast({ title: res.ok ? "Success" : "Notice", description: message });
      if (res.ok) setShowOtp(true);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to request OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 3) {
      toast({ title: "Error", description: "Please enter the OTP", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const res = await verifyAndCheck(email, otp);
      if (!res.ok) {
        const msg = res?.data?.message || "Verification failed";
        toast({ title: "Error", description: msg, variant: "destructive" });
        return;
      }

      const data = res?.data;
      const founds: Found[] = data?.founds || [];
      setResults(founds);
      toast({ title: "Done", description: `Found ${data?.resultsCount ?? founds.length} results.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Unable to verify OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Email Check</h1>

          {/* Email Input */}
          <div className="flex gap-2 mb-8">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cyber-input-white flex-1"
            />
            <Button variant="cyber" size="icon" onClick={handleEmailSubmit} className="w-12 h-12" disabled={loading}>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {showOtp && (
            <div className="text-center mb-8 animate-slide-in">
              <h2 className="text-2xl font-bold mb-6">Enter The OTP</h2>
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot 
                        key={i} 
                        index={i} 
                        className="w-12 h-14 bg-white text-gray-900 border-gray-300 text-xl font-bold rounded-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button variant="cyber" onClick={handleOtpSubmit} disabled={loading}>
                Submit
              </Button>
            </div>
          )}

          {results && results.length === 0 ? (
            <div className="cyber-card-white p-6 text-center animate-slide-in">
              <p className="text-lg font-semibold">No matches found — this email appears safe.</p>
              <p className="text-sm text-muted-foreground">No exposed passwords or hashes were found for this email.</p>
            </div>
          ) : results ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in">
              {results.map((result, index) => (
                <div key={index} className="cyber-card-white">
                  <p className="mb-2">
                    <span className="text-primary font-medium">Email</span> : {result.email}
                  </p>
                  <p className="mb-2">
                    <span className="text-primary font-medium">Password</span> : {result.password}
                  </p>
                  <p>
                    <span className="text-primary font-medium">Hash</span> : {result.hash}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailCheck;
