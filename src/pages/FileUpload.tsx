import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<null | {
    target: string;
    size: string;
    threatLevel: string;
    score: number;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    
    // Mock result
    setResult({
      target: file.name.split(".")[0] || "xz",
      size: `${Math.round(file.size / 1024)}kb`,
      threatLevel: "Likely begin",
      score: 5,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Upload File</h1>
          <p className="text-primary mb-8">
            Upload Sample From Your Local Machine For Analyze
          </p>

          {/* File Input */}
          <div className="flex gap-2 mb-8">
            <div 
              className="cyber-input-white flex-1 cursor-pointer flex items-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-gray-500">
                {file ? file.name : "Drop File For Analyze OR Browse"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="destructive" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="cyber" onClick={handleSubmit}>
              Submit
            </Button>
          </div>

          {result && (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold mb-6">Analysis Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details */}
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Target</span> : {result.target}
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Size</span> : {result.size}
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <span className="text-primary font-medium">Threat Level</span> : {result.threatLevel}
                  </div>
                </div>

                {/* Score */}
                <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold mb-2">Score</h3>
                  <p className="text-4xl font-bold">{result.score}/10</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FileUpload;
