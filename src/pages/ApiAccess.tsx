import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

const apiEndpoints = [
  { method: "Post", path: "/pet", description: "Add a new pet to the store", color: "bg-primary" },
  { method: "Put", path: "/pet", description: "Add a new pet to the store", color: "bg-warning" },
  { method: "Get", path: "/pet", description: "Add a new pet to the store", color: "bg-primary" },
  { method: "Post", path: "/pet", description: "Add a new pet to the store", color: "bg-primary" },
  { method: "Delete", path: "/pet", description: "Add a new pet to the store", color: "bg-destructive" },
  { method: "Post", path: "/pet", description: "Add a new pet to the store", color: "bg-primary" },
];

const ApiAccess = () => {
  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Pet Everything About pet</h1>

          <div className="space-y-3">
            {apiEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="cyber-card-white flex items-center gap-4"
              >
                <Badge 
                  className={`${endpoint.color} text-white px-4 py-1 text-sm font-medium`}
                >
                  {endpoint.method}
                </Badge>
                <span className="text-gray-600">{endpoint.path}</span>
                <span className="text-gray-800 ml-4">{endpoint.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiAccess;
