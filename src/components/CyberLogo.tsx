import { Shield } from "lucide-react";

interface CyberLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const CyberLogo = ({ size = "md", showText = true }: CyberLogoProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-pulse" />
          <div className="absolute inset-2 border border-primary/50 rounded-full" />
          
          {/* Shield icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Shield className={`${size === "sm" ? "w-6 h-6" : size === "md" ? "w-10 h-10" : "w-14 h-14"} text-primary fill-primary/20`} />
              {/* Brain pattern inside shield */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-5 h-5" : "w-7 h-7"} bg-gradient-to-br from-primary to-primary/60 rounded-full opacity-60`} />
              </div>
            </div>
          </div>
          
          {/* Orbital dots */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary/60 rounded-full" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-primary/60 rounded-full" />
        </div>
      </div>
      
      {showText && (
        <h1 className={`${textSizes[size]} font-bold tracking-wider`}>
          CYBER BRIEF
        </h1>
      )}
    </div>
  );
};

export default CyberLogo;
