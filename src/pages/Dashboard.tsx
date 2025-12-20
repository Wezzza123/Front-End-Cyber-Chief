import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const userServices = [
  { label: "URL shallow scanning", path: "/url-shallow" },
  { label: "URL Deep scanning", path: "/url-deep" },
  { label: "Email chick", path: "/email-check" },
  { label: "Password chick", path: "/password-check" },
];

const devServices = [
  { label: "Scan Your Container", path: "/scan-container" },
  { label: "Scan Your Website", path: "/scan-website" },
  { label: "Scan Your File", path: "/file-upload" },
];

const limits = [
  { label: "Food and Drinks", value: 900.780, progress: 90 },
  { label: "Shopping", value: 796.668, progress: 80 },
  { label: "Transportation", value: 865.009, progress: 85 },
  { label: "Housing", value: 466.757, progress: 47 },
  { label: "Vehicle", value: 786.779, progress: 79 },
];

const recentUrls = [
  { url: "https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-cal", score: 10 },
  { url: "https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-cal", score: 10 },
  { url: "https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-cal", score: 10 },
  { url: "https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-cal", score: 10 },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full relative">
        {/* Background decorative lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 800" fill="none">
            <path d="M0 400 Q 250 300 500 400 T 1000 400" stroke="currentColor" strokeWidth="1" className="text-primary" />
            <path d="M0 500 Q 250 400 500 500 T 1000 500" stroke="currentColor" strokeWidth="1" className="text-primary" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-stretch">
            {/* User Services */}
            <div className="cyber-card h-full flex flex-col">
              <h3 className="text-lg font-semibold text-center mb-6">User Services</h3>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {userServices.map((service) => (
                  <Link key={service.path} to={service.path}>
                    <Button variant="outline" className="w-full justify-center">
                      {service.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div> 

            {/* Dev Services */}
            <div className="cyber-card h-full flex flex-col">
              <h3 className="text-lg font-semibold text-center mb-6">Dev Services</h3>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {devServices.map((service) => (
                  <Link key={service.path} to={service.path}>
                    <Button variant="outline" className="w-full justify-center">
                      {service.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>  

            {/* Your Limits */}
            <div className="cyber-card h-full flex flex-col">
              <h3 className="text-lg font-semibold text-center mb-6">Your Limits</h3>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {limits.map((limit) => (
                  <div key={limit.label} className="py-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{limit.label}</span>
                      <span className="font-medium">{limit.value.toLocaleString()}</span>
                    </div>
                    <Progress value={limit.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </div> 
          </div>

          {/* Recent Checked URLs */}
          <div className="cyber-card">
            <h3 className="text-lg font-semibold mb-6">Recent Checked URLs</h3>
            <div className="space-y-3">
              {recentUrls.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg min-h-12"
                >
                  <span className="text-sm text-muted-foreground truncate flex-1 mr-4">
                    {item.url}
                  </span>
                  <span className="px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
