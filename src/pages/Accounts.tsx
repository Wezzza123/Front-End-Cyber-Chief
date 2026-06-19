import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const claim = (
  payload: Record<string, unknown> | null,
  keys: string[]
): string | null => {
  if (!payload) return null;
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
};

const formatUnix = (value: string | null): string => {
  if (!value) return "—";
  const seconds = Number(value);
  if (Number.isNaN(seconds)) return "—";
  return new Date(seconds * 1000).toLocaleString();
};

type AccountField = { label: string; value: string };

const services: Array<{ name: string; description: string; path: string }> = [
  { name: "Dashboard", description: "Overview of recent activity and quick actions", path: "/dashboard" },
  { name: "Deep URL Scan", description: "Full website vulnerability scan with PDF report", path: "/scan-website" },
  { name: "Shallow URL Scan", description: "Fast safety check and redirect expansion", path: "/url-shallow" },
  { name: "Email Breach Check", description: "Check an email against known breaches", path: "/email-check" },
  { name: "Password Check", description: "Strength and breach signals for a password", path: "/password-check" },
  { name: "Container Scan", description: "Scan container images for vulnerabilities", path: "/scan-container" },
  { name: "API Access", description: "Use the platform programmatically", path: "/api-access" },
];

const Accounts = () => {
  const [fields, setFields] = useState<AccountField[]>([]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const payload = token ? decodeJwt(token) : null;

    const fullName = claim(payload, [
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      "name",
      "Full_Name",
      "username",
    ]);
    const email = claim(payload, [
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "email",
    ]);
    const userId = claim(payload, [
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      "sub",
      "nameid",
    ]);
    const role = claim(payload, [
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
      "role",
    ]);

    setFields([
      { label: "Full name", value: fullName ?? "—" },
      { label: "Email", value: email ?? "—" },
      { label: "Account ID", value: userId ?? "—" },
      { label: "Role", value: role ?? "User" },
      { label: "Session started", value: formatUnix(claim(payload, ["iat"])) },
      { label: "Session expires", value: formatUnix(claim(payload, ["exp"])) },
    ]);
  }, []);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 gradient-mesh min-h-full relative">
        <div className="relative z-10 max-w-3xl mx-auto w-full space-y-6">
          {/* Account details */}
          <div className="cyber-card">
            <h1 className="text-2xl font-bold mb-1">Account</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Details for the account you are currently signed in with.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.label}>
                    <TableCell className="font-medium">{f.label}</TableCell>
                    <TableCell className="text-muted-foreground break-all">
                      {f.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Services available to the account */}
          <div className="cyber-card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Your services</h2>
              <Badge variant="secondary">{services.length} available</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Tools included with your account. Select Open to get started.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.path}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={s.path}
                        className="text-primary hover:underline font-medium"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
