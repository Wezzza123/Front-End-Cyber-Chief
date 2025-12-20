import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const PasswordCheck = () => {
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<null | {
    isPawned: boolean;
    summary: string;
  }>(null);

  const handleCheck = () => {
    if (!password) return;
    
    // Mock result
    setResult({
      isPawned: true,
      summary: "has already been seen 2187 in data branches.",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto pt-20">
          <h1 className="text-3xl font-bold mb-8">
            Click Strength Of Pass Breached Rectory
          </h1>

          {/* Password Input */}
          <div className="flex gap-2 mb-8">
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input-white flex-1"
            />
            <Button variant="cyber" size="icon" onClick={handleCheck} className="w-12 h-12">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {result && (
            <div className="space-y-4 animate-slide-in">
              <p>
                <span className="text-primary font-medium">Is pawned</span> : {result.isPawned ? "True" : "False"}.
              </p>
              <p>
                <span className="text-primary font-medium">Summary</span> : {result.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PasswordCheck;
