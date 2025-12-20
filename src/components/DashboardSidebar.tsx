import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Key, 
  Wallet, 
  Info, 
  Users, 
  Settings, 
  Phone,
  Mail,
  Bell,
  LogOut
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Key, label: "API Access", path: "/api-access" },
  { icon: Wallet, label: "Wallets", path: "/wallets" },
  { icon: Info, label: "About Us", path: "/about" },
  { icon: Users, label: "Accounts", path: "/accounts" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Phone, label: "Contact Us", path: "/contact" },
];

const DashboardSidebar = () => {
  const location = useLocation();

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
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-sidebar-accent transition-colors" title="Messages">
              <Mail className="w-4 h-4 text-sidebar-foreground" />
            </button>
            <button className="p-2 rounded-md hover:bg-sidebar-accent transition-colors" title="Notifications">
              <Bell className="w-4 h-4 text-sidebar-foreground" />
            </button>
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
                  <span>{item.label}</span>
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
