import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, ShoppingBag, ShoppingCart, Receipt,
  DollarSign, Boxes, Users, AlertTriangle, ArrowRight, Building2,
  Wallet, Coins, PiggyBank, RotateCcw, Landmark, Filter, RefreshCw,
  Calendar, Smartphone, FileSpreadsheet
} from "lucide-react";
import { api } from "../../api/client";
import { MetricCard } from "../../components/common/MetricCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend
} from "recharts";

import { FranchiseFinancialEquationCard } from "../../components/dashboard/FranchiseFinancialEquationCard";
import { CreditDebitModal } from "../../components/dashboard/CreditDebitModal";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

interface DashboardProps {
  onNavigate: (tabId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");
  const [dateFrom, setDateFrom] = useState<string>("2026-08-01");
  const [dateTo, setDateTo] = useState<string>("2026-08-31");
  const [periodPreset, setPeriodPreset] = useState<string>("august_2026");
  const [creditDebitModal, setCreditDebitModal] = useState<{ isOpen: boolean; type: 'credit' | 'debit' }>({ isOpen: false, type: 'credit' });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (m = selectedMonth, from = dateFrom, to = dateTo) => {
    setIsLoading(true);
    try {
      const [mRes, cRes, lRes] = await Promise.all([
        api.getDashboardMetrics({
          month: m && m !== "all" ? m : undefined,
          date_from: from || undefined,
          date_to: to || undefined,
        }),
        api.getDashboardCharts("custom", from || undefined, to || undefined, m && m !== "all" ? m : undefined),
        api.getLowStockAlerts()
      ]);
      setMetrics(mRes);
      setChartsData(cRes);
      setLowStockAlerts(lRes);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth, dateFrom, dateTo);
  }, []);

  const handleMonthSelect = (mStr: string) => {
    setSelectedMonth(mStr);
    if (!mStr || mStr === "all") {
      setPeriodPreset("all");
      setDateFrom("");
      setDateTo("");
      loadData("all", "", "");
      return;
    }
    const [year, month] = mStr.split("-").map(Number);
    const firstDay = new Date(Date.UTC(year, month - 1, 1)).toISOString().split("T")[0];
    const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().split("T")[0];
    setDateFrom(firstDay);
    setDateTo(lastDay);
    setPeriodPreset(mStr === "2026-08" ? "august_2026" : "custom");
    loadData(mStr, firstDay, lastDay);
  };

  const handlePresetSelect = (preset: string) => {
    setPeriodPreset(preset);
    const today = new Date();
    if (preset === "august_2026") {
      handleMonthSelect("2026-08");
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      const mStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(mStr);
      setDateFrom(firstDay);
      setDateTo(todayStr);
      loadData(mStr, firstDay, todayStr);
    } else if (preset === "this_year") {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      setSelectedMonth("");
      setDateFrom(firstDay);
      setDateTo(todayStr);
      loadData("", firstDay, todayStr);
    } else if (preset === "all") {
      setSelectedMonth("all");
      setDateFrom("");
      setDateTo("");
      loadData("all", "", "");
    }
  };

  const handleApplyCustomDates = () => {
    setPeriodPreset("custom");
    setSelectedMonth("");
    loadData("", dateFrom, dateTo);
  };

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="dashboard-printable-area">
      {/* Overview & Specific Month Filter Banner */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Shop Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {selectedMonth === "2026-08"
                ? "August 2026 (Live Closed Month)"
                : selectedMonth === "all" || (!dateFrom && !dateTo)
                ? "All Time Records (Cumulative)"
                : `${dateFrom} to ${dateTo}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Live sales turnover, telecom airtime float, inventory solvency, expenditures, and audited net profit.
          </p>
          <div className="mt-3 no-print">
            <ExportPrintButtons
              title={`Ufone Franchise Dashboard - ${selectedMonth === "2026-08" ? "August 2026" : (selectedMonth || "Audit")}`}
              targetId="dashboard-printable-area"
              reportType="pnl"
            />
          </div>
        </div>

        {/* Specific Month & Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Specific Month Dropdown */}
          <div className="flex items-center gap-2 bg-indigo-50/60 border border-indigo-200/80 p-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-700 ml-1.5" />
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthSelect(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="2026-08">August 2026 (Live Closed Month)</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="all">All Time Records (Cumulative)</option>
            </select>
          </div>

          {/* Quick preset tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            {[
              { id: "august_2026", label: "August 2026" },
              { id: "this_month", label: "This Month" },
              { id: "this_year", label: "This Year" },
              { id: "all", label: "All Time" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handlePresetSelect(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  periodPreset === tab.id
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setSelectedMonth(""); setPeriodPreset("custom"); }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setSelectedMonth(""); setPeriodPreset("custom"); }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
            />
            <button
              onClick={handleApplyCustomDates}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-2xs hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
          </div>

          <button
            onClick={() => loadData(selectedMonth, dateFrom, dateTo)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Franchise Financial Equation & Net Profit/Loss Health Widget */}
      <FranchiseFinancialEquationCard metrics={metrics} onNavigate={onNavigate} />

      {/* Client Priority: 1st Option (Credit) & 2nd Option (Debit) Interactive Particulars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1st Option: Credit Option Card */}
        <div
          onClick={() => setCreditDebitModal({ isOpen: true, type: 'credit' })}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-indigo-950 p-6 text-white shadow-lg border border-blue-400/30 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-inner group-hover:bg-blue-500/30 transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                  Option 1: Market Credit
                </span>
                <h3 className="text-lg font-black font-heading text-white">Credit Receivables</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-400/20 text-blue-200 border border-blue-300/30">
              10 Debtors Active
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-black font-heading font-mono text-white tracking-tight">
                Rs. {Number(metrics?.credit_amount ?? 719385).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-200/80 mt-1 font-medium">
                Customer &amp; retailer outstanding dues (August.xlsx Rows 23-34)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold text-blue-300 group-hover:text-white transition-colors">
            <span>Click to view itemized debtor particulars</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2nd Option: Debit Option Card */}
        <div
          onClick={() => setCreditDebitModal({ isOpen: true, type: 'debit' })}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 p-6 text-white shadow-lg border border-purple-400/30 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-inner group-hover:bg-purple-500/30 transition-colors">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                  Option 2: Total Injected Funds
                </span>
                <h3 className="text-lg font-black font-heading text-white">Debit (Capital &amp; Loans)</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-400/20 text-purple-200 border border-purple-300/30">
              Equity + Borrowings
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-black font-heading font-mono text-white tracking-tight">
                Rs. {Number(metrics?.debit_amount ?? 6649340).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-purple-200/80 mt-1 font-medium">
                Rs. 5.22M Owner Capital + Rs. 1.43M Working Loans (August.xlsx Rows 14-21)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-white transition-colors">
            <span>Click to view itemized capital &amp; loan particulars</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* FCA Monthly Progress Quick Access Banner */}
      <div className="bg-gradient-to-r from-[#17153b] via-[#1e1b4b] to-[#2e1065] rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl border border-indigo-500/30">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400 shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-bold text-base text-white">
                FCA & BVS Monthly Progress Ledger
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                81 Field Agents Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Jan – Sep 2026 Live
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
              Consolidated 3-sheet master tracking from <code className="text-amber-300 font-mono text-[11px]">FCA Table AUG 2026-1.xlsx</code> and monthly dynamic uploads like <code className="text-emerald-300 font-mono text-[11px]">BVS SEP 2026 FCA.xlsx</code>. Shakeel Ahmad & Shahid Khan full access to edit, upload, and export.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("fca-performance")}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Open FCA Progress Sheet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

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
          value={metrics?.net_profit ?? -804323}
          prefix="Rs. "
          variant={metrics?.is_net_loss ? "rose" : "emerald"}
          onClick={() => onNavigate("pnl")}
          subtitle={metrics?.is_net_loss ? "NET LOSS - Expenses exceed commissions" : "Total Commissions − (Expenses + Salaries)"}
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
              {selectedMonth === "2026-08"
                ? "August 2026"
                : selectedMonth === "all" || (!dateFrom && !dateTo)
                ? "All Records"
                : (dateFrom ? `${dateFrom} - ${dateTo}` : "Custom Scope")}
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
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
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
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
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

      {/* Credit / Debit Interactive Particulars Modal */}
      <CreditDebitModal
        isOpen={creditDebitModal.isOpen}
        type={creditDebitModal.type}
        onClose={() => setCreditDebitModal({ ...creditDebitModal, isOpen: false })}
        onNavigate={onNavigate}
      />
    </div>
  );
};
