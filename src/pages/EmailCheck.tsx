import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const mockResults = [
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
  { email: "ahmedhossam@gmail.com", password: "ahmwd53636", hash: "x475479#" },
];

const EmailCheck = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [results, setResults] = useState<typeof mockResults | null>(null);

  const handleEmailSubmit = () => {
    if (!email) return;
    setShowOtp(true);
  };

  const handleOtpSubmit = () => {
    if (otp.length !== 6) return;
    setResults(mockResults);
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Email Chick</h1>

          {/* Email Input */}
          <div className="flex gap-2 mb-8">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cyber-input-white flex-1"
            />
            <Button variant="cyber" size="icon" onClick={handleEmailSubmit} className="w-12 h-12">
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
              <Button variant="cyber" onClick={handleOtpSubmit}>
                Submit
              </Button>
            </div>
          )}

          {results && (
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailCheck;
