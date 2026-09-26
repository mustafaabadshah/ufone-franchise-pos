import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, ShoppingBag, ShoppingCart, Receipt,
  DollarSign, Boxes, Users, AlertTriangle, ArrowRight, Building2,
  Wallet, Coins, PiggyBank, RotateCcw, Landmark, Filter, RefreshCw
} from "lucide-react";
import { api } from "../../api/client";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend
} from "recharts";

import { FranchiseFinancialEquationCard } from "../../components/dashboard/FranchiseFinancialEquationCard";

interface DashboardProps {
  onNavigate: (tabId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>("30_days");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (selectedPeriod = period) => {
    setIsLoading(true);
    try {
      const [m, c, l] = await Promise.all([
        api.getDashboardMetrics(),
        api.getDashboardCharts(selectedPeriod),
        api.getLowStockAlerts()
      ]);
      setMetrics(m);
      setChartsData(c);
      setLowStockAlerts(l);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  if (isLoading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading franchise metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Shop Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Overview of sales, inventory, telecom distribution, staff, purchases, expenses and double-entry profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick period filters */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            {[
              { id: "today", label: "Today" },
              { id: "7_days", label: "7 Days" },
              { id: "30_days", label: "30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "this_year", label: "This Year" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  period === tab.id
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(period)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Franchise Financial Equation & Net Profit/Loss Health Widget */}
      <FranchiseFinancialEquationCard metrics={metrics} onNavigate={onNavigate} />

      {/* Primary KPI Grid (Matching Reference App + Clickable drill-downs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today Sales"
          value={metrics?.today_sales ?? 0}
          prefix="Rs. "
          variant="blue"
          onClick={() => onNavigate("sales")}
          subtitle="Click to view today's sales"
        />
        <MetricCard
          title="Total Sales"
          value={metrics?.total_sales ?? 0}
          prefix="Rs. "
          variant="green"
          onClick={() => onNavigate("sales")}
          subtitle="Overall gross revenue"
        />
        <MetricCard
          title="Total Purchases"
          value={metrics?.total_purchases ?? 0}
          prefix="Rs. "
          variant="purple"
          onClick={() => onNavigate("purchases")}
          subtitle="Stock replenishment"
        />
        <MetricCard
          title="Total Expenses"
          value={metrics?.total_expenses ?? 0}
          prefix="Rs. "
          variant="red"
          onClick={() => onNavigate("expenses")}
          subtitle="Operational utilities & rent"
        />
        <MetricCard
          title="Total Salaries"
          value={metrics?.total_salaries ?? 0}
          prefix="Rs. "
          variant="amber"
          onClick={() => onNavigate("salaries")}
          subtitle="Disbursed payroll"
        />
        <MetricCard
          title="Net Profit / Loss"
          value={metrics?.net_profit ?? 0}
          prefix="Rs. "
          variant={metrics?.is_net_loss ? "rose" : "cyan"}
          onClick={() => onNavigate("pnl")}
          subtitle={metrics?.is_net_loss ? "NET LOSS - Revenue < COGS + Exp" : "Gross Profit - Expenses - Salaries"}
        />
        <MetricCard
          title="Purchase Due"
          value={metrics?.purchase_due ?? 0}
          prefix="Rs. "
          variant="red"
          onClick={() => onNavigate("purchases")}
          subtitle="Payable to vendors"
        />
        <MetricCard
          title="Company Credit"
          value={metrics?.company_credit_outstanding ?? 0}
          prefix="Rs. "
          variant="indigo"
          onClick={() => onNavigate("company-credit")}
          subtitle="Ufone Wholesale credit balance"
        />
      </div>

      {/* Secondary Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Staff Count"
          value={metrics?.staff_count ?? 8}
          variant="green"
          onClick={() => onNavigate("staff")}
        />
        <MetricCard
          title="Products"
          value={metrics?.product_count ?? 6}
          variant="purple"
          onClick={() => onNavigate("products")}
        />
        <MetricCard
          title="Pending Purchases"
          value={metrics?.pending_purchases ?? 0}
          variant="amber"
          onClick={() => onNavigate("purchases")}
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics?.low_stock_items ?? 0}
          variant="red"
          onClick={() => onNavigate("stock")}
        />
        <MetricCard
          title="Cash on Hand"
          value={metrics?.cash_in_hand ?? 0}
          prefix="Rs. "
          variant="blue"
          onClick={() => onNavigate("cash-management")}
        />
        <MetricCard
          title="Investments"
          value={metrics?.investment ?? 0}
          prefix="Rs. "
          variant="indigo"
          onClick={() => onNavigate("investments")}
        />
      </div>

      {/* Telecom Distribution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate("retailer-collections")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer Receivable</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-heading">
              Rs. {Number(metrics?.retailer_receivable ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-indigo-600 mt-1 font-medium">Click for Retailer Collections</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate("rso")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">RSO Pending Collections</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-heading">
              Rs. {Number(metrics?.rso_receivable ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-indigo-600 mt-1 font-medium">Click for RSO Route Balances</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate("commissions")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Income</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-heading">
              Rs. {Number(metrics?.commission_income ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Sales incentives & franchise bonus</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales & Purchases Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-800">Financial Trend</h3>
              <p className="text-xs text-slate-500 font-medium">Daily Sales, Purchases & Operating Expenses</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold uppercase tracking-wider">
              {period.replace("_", " ")}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData?.daily_trends || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#purGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Distribution Entities */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-heading text-slate-800">Top RSO Field Routes</h3>
          <div className="space-y-3">
            {chartsData?.top_rsos?.map((rso: any, idx: number) => (
              <div
                key={idx}
                onClick={() => onNavigate("rso")}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{rso.name}</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{rso.route}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    Rs. {Number(rso.balance).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">Pending</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate("rso")}
              className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 py-1"
            >
              <span>View All RSO Daily Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Table (Exact Match to Reference App) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-800">Low Stock Alerts</h3>
            <p className="text-xs text-slate-500 font-medium">Critical inventory items requiring restock</p>
          </div>
          <button
            onClick={() => onNavigate("stock")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Manage Stock &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-6">SKU</th>
                <th className="py-3 px-6">Current Stock</th>
                <th className="py-3 px-6">Alert Qty</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {lowStockAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    All products have sufficient stock levels!
                  </td>
                </tr>
              ) : (
                lowStockAlerts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-6 text-slate-500 font-mono text-[11px]">{item.sku}</td>
                    <td className="py-3 px-6 font-bold text-rose-600 font-mono">
                      {Number(item.current_stock).toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-slate-600 font-mono">
                      {Number(item.alert_quantity).toFixed(2)}
                    </td>
                    <td className="py-3 px-6">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => onNavigate("purchases")}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                      >
                        Order Restock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
