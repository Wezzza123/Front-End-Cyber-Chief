import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SubmitUrl = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<null | {
    score: number;
    threatLevel: string;
    activities: string[];
  }>(null);

  const handleSubmit = () => {
    if (!url) return;
    
    // Mock result
    setResult({
      score: 10,
      threatLevel: "known bad",
      activities: [
        "Drop files",
        "Resource forcing",
        "Modifier register class",
        "Svs use of write process",
      ],
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Submit URL</h1>
          
          <div className="mb-8 space-y-2">
            <p>
              <span className="text-primary font-medium">Analyze</span> : this is to be directly analyze a URI that will be open in the browser.
            </p>
            <p>
              <span className="text-primary font-medium">Sitch</span> : execut the URL in the sendbox.
            </p>
          </div>

          {/* URL Input */}
          <div className="flex gap-2 mb-8">
            <input
              type="url"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="cyber-input-white flex-1"
            />
            <Button variant="cyber" size="icon" onClick={handleSubmit} className="w-12 h-12">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in">
              {/* Score Card */}
              <div className="bg-card border border-border rounded-xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Score</h3>
                  <p className="text-5xl font-bold">{result.score}/10</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-primary font-medium">Threat level</span> : {result.threatLevel}
                </div>
              </div>

              {/* Activities */}
              <div className="cyber-card-white">
                <h3 className="text-xl font-semibold mb-4">
                  <span className="text-primary">Malicious</span> activity summary
                </h3>
                <div className="space-y-3">
                  {result.activities.map((activity, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-3 text-gray-700">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubmitUrl;
