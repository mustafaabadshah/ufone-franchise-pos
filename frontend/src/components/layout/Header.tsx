import React from "react";
import { Bell, Search, ShoppingBag, Shield, MapPin, Sparkles, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenPos?: () => void;
  lowStockCount?: number;
  onNavigate?: (tab: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenPos,
  lowStockCount = 0,
  onNavigate,
  onToggleMobileSidebar
}) => {
  const { user, isShakeel, isViewer } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden flex-shrink-0 cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-indigo-600" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold font-heading text-slate-800 tracking-tight truncate block" title={title}>
            {title}
          </h2>
          {subtitle && (
            <p className="hidden md:block text-xs text-slate-500 font-medium truncate">{subtitle}</p>
          )}
        </div>

        {/* Branch tag */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dargai Malakand Branch</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick POS Terminal Button (Hidden for Read-Only Viewers and Shakeel) */}
        {onOpenPos && !isViewer && !isShakeel && (
          <button
            onClick={onOpenPos}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-xs shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 active:scale-98 transition-all shrink-0 cursor-pointer"
            title="Open POS Terminal"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wide hidden sm:inline">POS Terminal</span>
            <span className="font-semibold tracking-wide inline sm:hidden">POS</span>
          </button>
        )}

        {/* Low Stock Notification Bell (Hidden for Read-Only Viewers and Shakeel) */}
        {!isViewer && !isShakeel && (
          <button
            onClick={() => onNavigate && onNavigate("stock")}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Stock Alerts"
          >
            <Bell className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
        )}

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm ring-2 ${
            isShakeel
              ? "bg-amber-500 ring-amber-100"
              : isViewer
              ? "bg-emerald-600 ring-emerald-100"
              : "bg-indigo-600 ring-indigo-100"
          }`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : (isShakeel ? "S" : "S")}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || (isShakeel ? "Shakeel Ahmad" : "Shahid Khan")}</p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isViewer
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isShakeel
                ? "bg-amber-50 text-amber-800 border border-amber-300"
                : "bg-indigo-50 text-indigo-700"
            }`}>
              {user?.name?.toLowerCase().includes("islam badshah")
                ? "Franchise Owner (Audit View)"
                : isShakeel
                ? "FCA Operations Specialist"
                : isViewer
                ? "Reports Viewer"
                : (user?.role === "Admin" ? "Admin / Incharge" : user?.role || "Finance Officer")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
