import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Key, 
  Info, 
  Users, 
  Settings, 
  Phone,
  LogOut
} from "lucide-react";

const menuItems: Array<{ icon: any; label: string; path: string; badge?: string }> = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Key, label: "API Access", path: "/api-access" },
  { icon: Info, label: "About Us", path: "/about", badge: "About" },
  { icon: Users, label: "Accounts", path: "/accounts" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Phone, label: "Contact Us", path: "/contact" },
];

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
};

const DashboardSidebar = () => {
  const location = useLocation();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        // Microsoft identity claims
        const nameClaim = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const emailClaim = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        
        setUserName(nameClaim || payload.name || payload.username || payload.Full_Name || emailClaim || payload.email || "User");
      }
    }
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* User Profile */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col truncate">
              <span className="font-medium text-sidebar-foreground truncate max-w-[140px]" title={userName}>
                {userName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px] h-auto leading-none whitespace-nowrap"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
