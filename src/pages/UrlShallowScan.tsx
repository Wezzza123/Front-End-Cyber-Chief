import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const UrlShallowScan = () => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<null | {
    original: string;
    expanded: string;
    redirection: string;
    threatLevel: string;
    redFlags: string[];
    warnings: string[];
  }>(null);

  const handleScan = () => {
    if (!url) return;
    
    // Mock result
    setResult({
      original: url,
      expanded: url,
      redirection: url,
      threatLevel: "Dangerous",
      redFlags: [
        "Suspicious domain pattern detected",
        "Known phishing indicators found",
        "SSL certificate issues",
      ],
      warnings: [
        "Recently registered domain",
        "Unusual redirect chain",
      ],
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">URL Shallow Scanning</h1>

          {/* URL Input */}
          <div className="flex gap-2 mb-8">
            <input
              type="url"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="cyber-input-white flex-1"
            />
            <Button variant="cyber" size="icon" onClick={handleScan} className="w-12 h-12">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {result && (
            <div className="space-y-6 animate-slide-in">
              {/* URL Info Card */}
              <div className="cyber-card-white space-y-3">
                <p>
                  <span className="text-primary font-medium">Original URL</span> : {result.original}
                </p>
                <p>
                  <span className="text-primary font-medium">Expanded URL</span> : {result.expanded}
                </p>
                <p>
                  <span className="text-primary font-medium">Redirection URL</span> : {result.redirection}
                </p>
              </div>

              {/* Threat Level */}
              <div>
                <h2 className="text-2xl mb-4">
                  <span className="text-primary font-medium">Threat Level</span> : {result.threatLevel}
                </h2>
              </div>

              {/* Flags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Red Flags */}
                <div className="cyber-card-white">
                  <h3 className="text-destructive font-semibold mb-4">
                    Red Flags : {result.redFlags.length}
                  </h3>
                  <ul className="space-y-2">
                    {result.redFlags.map((flag, i) => (
                      <li key={i} className="text-gray-700">{flag}</li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                <div className="cyber-card-white">
                  <h3 className="text-warning font-semibold mb-4">
                    Warnings : {result.warnings.length}
                  </h3>
                  <ul className="space-y-2">
                    {result.warnings.map((warning, i) => (
                      <li key={i} className="text-gray-700">{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UrlShallowScan;
