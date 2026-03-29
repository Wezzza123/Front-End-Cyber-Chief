import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

type HttpMethod = "GET" | "POST";

type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  description: string;
};

type ApiSection = {
  title: string;
  endpoints: ApiEndpoint[];
};

function methodBadgeClass(method: HttpMethod): string {
  return method === "GET"
    ? "bg-sky-600 hover:bg-sky-600 text-white"
    : "bg-emerald-700 hover:bg-emerald-700 text-white";
}

/** Relative paths only — matches `src/lib/api.ts`; prefix with your API host in client config. */
const apiSections: ApiSection[] = [
  {
    title: "Dashboard",
    endpoints: [
      {
        method: "GET",
        path: "/api/Dashboard/all-scanned-urls",
        description:
          "Recent scanned URLs with scores. Send Bearer token if your deployment requires it.",
      },
    ],
  },
  {
    title: "Auth",
    endpoints: [
      {
        method: "POST",
        path: "/api/Auth/register",
        description: "Register: JSON body firstName, lastName, email, password.",
      },
      {
        method: "POST",
        path: "/api/Auth/login",
        description: "Login: JSON body email, password.",
      },
      {
        method: "POST",
        path: "/api/Auth/forgot-password",
        description: "Forgot password: JSON body email.",
      },
      {
        method: "POST",
        path: "/api/Auth/reset-password",
        description: "Reset password: JSON body email, token, newPassword.",
      },
    ],
  },
  {
    title: "Security",
    endpoints: [
      {
        method: "POST",
        path: "/api/Security/request-otp-for-email?email={email}",
        description: "Request OTP for email breach check (query param email). Empty JSON body.",
      },
      {
        method: "GET",
        path: "/api/Security/verify-and-check?email={email}&otp={otp}",
        description: "Verify OTP and run breach check.",
      },
      {
        method: "GET",
        path: "/api/Security/inspect-password?password={password}",
        description: "Password strength / exposure analysis. Optional Bearer token.",
      },
    ],
  },
  {
    title: "Web scan",
    endpoints: [
      {
        method: "POST",
        path: "/api/WebScan/start?request={url}",
        description: "Start (or reuse) a website scan. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/WebScan/my-history",
        description: "Current user’s scan history. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/WebScan/status?target={url}",
        description: "Poll scan status for a target URL. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/WebScan/report?target={url}",
        description: "Download scan report as PDF. Bearer required.",
      },
    ],
  },
  {
    title: "URL expander (shallow)",
    endpoints: [
      {
        method: "GET",
        path: "/api/UrlExpander/extract?url={url}",
        description: "Expand URL and security analysis. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/UrlExpander/my-history",
        description: "Shallow scan history. Bearer required.",
      },
    ],
  },
  {
    title: "Triage (deep URL)",
    endpoints: [
      {
        method: "POST",
        path: "/api/Triage/url?url={url}",
        description: "Submit URL for deep analysis. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/Triage/sample/{sampleId}",
        description: "Sample status by id (no auth in app client).",
      },
      {
        method: "GET",
        path: "/api/Triage/sample/{sampleId}/overview",
        description: "Sample overview by id (no auth in app client).",
      },
      {
        method: "GET",
        path: "/api/Triage/my-history",
        description: "Deep scan history. Bearer required.",
      },
    ],
  },
  {
    title: "Container",
    endpoints: [
      {
        method: "POST",
        path: "/api/Container/start-scan",
        description:
          "Start container image scan: JSON body image, optional tag, source, dockerImageId, repositoryId. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/Container/my-history",
        description: "Container scan history. Bearer required.",
      },
      {
        method: "GET",
        path: "/api/Container/image-summary?imagename={imageName}",
        description: "Vulnerability summary for an image name. Bearer required.",
      },
    ],
  },
];

const ApiAccess = () => {
  return (
    <DashboardLayout>
      <div className="p-8 gradient-mesh min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">API reference</h1>
          <p className="text-muted-foreground text-sm mb-8 max-w-2xl">
            These are the HTTP routes this app calls. Paths are shown from the root of your API
            server only (no host or scheme). Use the same base URL as configured in the client.
          </p>

          <div className="space-y-10">
            {apiSections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.endpoints.map((endpoint) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}`}
                      className="cyber-card-white flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                    >
                      <Badge
                        className={`${methodBadgeClass(endpoint.method)} px-3 py-1 text-xs font-semibold uppercase tracking-wide shrink-0`}
                      >
                        {endpoint.method}
                      </Badge>
                      <div className="min-w-0 flex-1 space-y-1">
                        <code className="text-sm font-mono text-foreground break-all block">
                          {endpoint.path}
                        </code>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiAccess;
