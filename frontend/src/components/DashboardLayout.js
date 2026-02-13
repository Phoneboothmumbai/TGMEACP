import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "New Request", href: "/admin/new-request", icon: PlusCircle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]" data-testid="dashboard-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#FBFBFD] border-r border-[#D2D2D7] transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#D2D2D7]">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0071E3] flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AC+</span>
              </div>
              <span className="font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">
                AppleCare+
              </span>
            </Link>
            <button
              className="lg:hidden p-1 hover:bg-[#F5F5F7] rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#0071E3] text-white shadow-sm"
                      : "text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#D2D2D7]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#E8E8ED] flex items-center justify-center">
                <span className="text-sm font-medium text-[#1D1D1F]">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1D1D1F] truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-[#86868B] truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-[#1D1D1F] hover:bg-[#F5F5F7] hover:text-[#FF3B30]"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7] flex items-center px-6">
          <button
            className="lg:hidden p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors mr-4"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5 text-[#1D1D1F]" />
          </button>
          <h1 className="text-xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans'] tracking-tight">
            {title}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
