import React, { useState } from "react";
import {
  LayoutDashboard, Package, FolderTree, Boxes, ShoppingCart, ShoppingBag,
  RotateCcw, Users, UserCheck, CalendarDays, Zap, PhoneCall, Wallet,
  TrendingUp, BookOpen, Receipt, DollarSign, PiggyBank, Coins, ShieldCheck,
  FileSpreadsheet, Settings, ShieldAlert, ChevronDown, ChevronRight, LogOut,
  Building2, Landmark, Smartphone
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  currentTab: string;
  onNavigate: (tabId: string) => void;
  lowStockCount?: number;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate, lowStockCount = 0 }) => {
  const { user, logout, isShakeel, isViewer } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const shakeelSections: NavSection[] = [
    {
      title: "FCA Operations",
      items: [
        { id: "fca-performance", label: "FCA Monthly Progress", icon: Smartphone },
      ]
    }
  ];

  const allSections: NavSection[] = [
    {
      title: "Operations",
      items: [
        { id: "products", label: "Products", icon: Package },
        { id: "categories", label: "Categories", icon: FolderTree },
        { id: "stock", label: "Stock", icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: "bg-amber-500/20 text-amber-300" },
        { id: "purchases", label: "Purchases", icon: ShoppingCart },
        { id: "sales", label: "Sales / POS", icon: ShoppingBag },
        { id: "returns", label: "Returns", icon: RotateCcw },
      ]
    },
    {
      title: "Telecom / Distribution",
      items: [
        { id: "fca-performance", label: "FCA Monthly Progress", icon: Smartphone },
        { id: "rso", label: "RSO Management", icon: Users },
        { id: "rso-daily", label: "RSO Daily Report", icon: CalendarDays },
        { id: "rso-weekly", label: "RSO Weekly Report", icon: CalendarDays },
        { id: "rso-monthly", label: "RSO Monthly Report", icon: CalendarDays },
        { id: "easyload", label: "EasyLoad Management", icon: Zap },
        { id: "retailer-collections", label: "Retailer Collections", icon: Wallet },
      ]
    },
    {
      title: "Finance & Accounting",
      items: [
        { id: "pnl", label: "Profit & Loss", icon: TrendingUp },
        { id: "ledger", label: "General Ledger", icon: BookOpen },
        { id: "expenses", label: "Expenses", icon: Receipt },
        { id: "salaries", label: "Salaries / Payroll", icon: DollarSign },
        { id: "investments", label: "Investments", icon: PiggyBank },
        { id: "cash-management", label: "Cash Denominations", icon: Coins },
        { id: "company-credit", label: "Company Credit / Payables", icon: Building2 },
        { id: "commissions", label: "Commissions", icon: Landmark },
      ]
    },
    {
      title: "People & Network",
      items: [
        { id: "retailers", label: "Retailers Network", icon: Smartphone },
        { id: "staff", label: "Staff & Employees", icon: UserCheck },
      ]
    },
    {
      title: "Reports",
      items: [
        { id: "reports", label: "Report Center", icon: FileSpreadsheet },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: "users", label: "Users & Access", icon: ShieldCheck },
        { id: "settings", label: "Franchise Settings", icon: Settings },
        { id: "audit-logs", label: "Audit Logs", icon: ShieldAlert },
      ]
    }
  ];

  const viewerSections: NavSection[] = [
    {
      title: "Executive Reports & Audit",
      items: [
        { id: "reports", label: "Executive Report Hub", icon: FileSpreadsheet },
        { id: "fca-performance", label: "FCA Monthly Progress", icon: Smartphone },
        { id: "pnl", label: "Profit & Loss Statement", icon: TrendingUp },
        { id: "ledger", label: "General Ledger", icon: BookOpen },
        { id: "audit-logs", label: "Security Audit Logs", icon: ShieldAlert },
        { id: "rso-daily", label: "RSO Daily Report", icon: CalendarDays },
        { id: "rso-weekly", label: "RSO Weekly Report", icon: CalendarDays },
        { id: "rso-monthly", label: "RSO Monthly Report", icon: CalendarDays },
      ]
    },
    {
      title: "Operations & Ledgers (View Only)",
      items: [
        { id: "expenses", label: "Expenses Breakdown", icon: Receipt },
        { id: "salaries", label: "Staff Payroll & RSO Salaries", icon: DollarSign },
        { id: "retailers", label: "Retailers Network & Balances", icon: Smartphone },
        { id: "sales", label: "Sales Register", icon: ShoppingBag },
        { id: "purchases", label: "Purchases & Inward Stock", icon: ShoppingCart },
        { id: "stock", label: "Stock & Inventory", icon: Boxes },
        { id: "company-credit", label: "Company Credit / Payables", icon: Building2 },
      ]
    }
  ];

  const sections = isShakeel ? shakeelSections : (isViewer ? viewerSections : allSections);

  return (
    <aside className="w-72 bg-gradient-to-b from-[#17153b] via-[#1e1b4b] to-[#12102e] text-slate-200 h-screen flex flex-col flex-shrink-0 shadow-2xl border-r border-indigo-950/60 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-indigo-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-white text-lg font-heading tracking-wider">
            U4G
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-white leading-tight">Shop Panel</h1>
            <p className="text-[11px] text-indigo-300 font-medium tracking-wide">Franchise POS & S&D</p>
          </div>
        </div>
      </div>

      {isViewer && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="leading-snug">Islam Badshah (Franchise Owner - Audit & Reports View)</span>
        </div>
      )}

      {isShakeel && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span className="leading-snug">Shakeel Ahmad (FCA Monthly Progress Only)</span>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
        {/* Dashboard Top Link (Hidden for Shakeel who is restricted to FCA Progress) */}
        {!isShakeel && (
          <button
            onClick={() => onNavigate("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              currentTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                : "text-slate-300 hover:bg-indigo-900/40 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">Dashboard</span>
          </button>
        )}

        {/* Categorized Sections */}
        {sections.map(section => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/80 hover:text-white transition-colors"
              >
                <span>{section.title}</span>
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-1">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold"
                            : "text-slate-300 hover:bg-indigo-900/40 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-indigo-400/80"}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.badgeColor || "bg-indigo-500/20 text-indigo-300"}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-indigo-900/50 bg-[#131130]/90">
        <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner ${
              isShakeel ? "bg-amber-500" : isViewer ? "bg-emerald-600" : "bg-gradient-to-tr from-indigo-500 to-purple-600"
            }`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : (isShakeel ? "S" : "U")}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name || (isShakeel ? "Shakeel Ahmad" : "Shahid Khan")}</p>
              <p className="text-[10px] text-indigo-300 font-medium truncate">{isShakeel ? "FCA Specialist" : (user?.role || "Admin")}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
