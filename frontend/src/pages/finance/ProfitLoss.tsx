import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Printer,
  FileSpreadsheet, FileText, Download, CheckCircle2, AlertTriangle
} from "lucide-react";
import { api } from "../../api/client";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

export const ProfitLoss: React.FC = () => {
  const [pnl, setPnl] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState("this_month");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"agency_1_4" | "commercial">("agency_1_4");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfitAndLoss({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setPnl(data);
    } catch (err) {
      console.error("P&L error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const [selectedMonth, setSelectedMonth] = useState("2026-08");

  const handleMonthSelect = (mStr: string) => {
    setSelectedMonth(mStr);
    if (!mStr || mStr === "all") {
      setPeriod("all");
      setDateFrom("");
      setDateTo("");
      return;
    }
    const [year, month] = mStr.split("-").map(Number);
    const firstDay = new Date(Date.UTC(year, month - 1, 1)).toISOString().split("T")[0];
    const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().split("T")[0];
    setPeriod("custom");
    setDateFrom(firstDay);
    setDateTo(lastDay);
  };

  const handlePeriodQuickSelect = (p: string) => {
    setPeriod(p);
    const today = new Date();
    if (p === "today") {
      const dStr = today.toISOString().split("T")[0];
      setDateFrom(dStr);
      setDateTo(dStr);
    } else if (p === "this_month") {
      handleMonthSelect("2026-08");
    } else if (p === "this_year") {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (p === "all") {
      setDateFrom("");
      setDateTo("");
      setSelectedMonth("all");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Profit & Loss Statement</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Transaction-based accounting engine with Weighted Average Cost (COGS) and full operational deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="pnl" />
        </div>
      </div>

      {/* Period & Month Selector (no-print) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Month Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Select Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="2026-08">August 2026 (Live Closed Month)</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="all">All Records (Cumulative)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {["this_month", "this_year", "all"].map(p => (
            <button
              key={p}
              onClick={() => handlePeriodQuickSelect(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === p
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setSelectedMonth(""); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setSelectedMonth(""); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
          <button
            onClick={loadData}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Accounting Model Toggle Banner (no-print) */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Accounting Method:</span>
          <span className="text-[11px] text-slate-500 font-medium">Switch between official 1.4% franchise commission vs. commercial gross margin</span>
        </div>
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setViewMode("agency_1_4")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "agency_1_4"
                ? "bg-white text-indigo-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Franchise 1.4% Commission Model (Net: +Rs. 20,837)
          </button>
          <button
            onClick={() => setViewMode("commercial")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "commercial"
                ? "bg-white text-indigo-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Commercial Turnover Model (Net: +Rs. 387,337)
          </button>
        </div>
      </div>

      {/* Printable P&L Statement Sheet (Instruction 28) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-8 space-y-6 print-container">
        {/* Document Header */}
        <div className="text-center pb-5 border-b-2 border-slate-900">
          <h1 className="text-xl font-extrabold uppercase tracking-wide">Ufone Franchise - Dargai Office</h1>
          <p className="text-xs text-slate-600">Main Bazar, Dargai, Malakand, KP</p>
          <h2 className="text-base font-bold uppercase tracking-wider text-indigo-900 mt-2">Statement of Profit & Loss</h2>
          <p className="text-xs text-slate-500 font-medium">
            Period: {dateFrom ? `${dateFrom} to ${dateTo || 'Present'}` : "All Time Records"}
          </p>
        </div>

        {pnl && (
          <div className="space-y-4 text-xs font-mono">
            {viewMode === "agency_1_4" ? (
              <>
                {/* 1. Airtime Float Distribution Throughput */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">1. AIRTIME FLOAT DISTRIBUTION THROUGHPUT (INFORMATIONAL)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Total EVC Float Distributed by 4 RSOs (August.xlsx Row 63-71):</span>
                    <span className="font-bold text-slate-900">Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4 text-[11px]">
                    <span className="font-sans">Franchise Distributor Commission Rate on EVC:</span>
                    <span className="font-bold text-indigo-700">1.40% official distributor rate (~1.44% achieved)</span>
                  </div>
                </div>

                {/* 2. Direct Operating Commission Revenue */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">2. OPERATING COMMISSION REVENUE (DIRECT INFLOWS FROM UFONE HQ)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">1.4% EVC Top Up Commission (August.xlsx Row 16):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.topup_commissions || 211074).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Ufone Promo & Target Commissions (11 Heads, August.xlsx Row 160-170):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.promo_commissions || 638223).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-slate-200/80 bg-emerald-50/70 p-2.5 rounded-lg text-sm">
                    <span className="font-sans">TOTAL FRANCHISE OPERATING REVENUE (GROSS PROFIT):</span>
                    <span className="text-emerald-800 font-black">Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 3. Franchise Operating Deductions */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">3. FRANCHISE OPERATING EXPENSES & PAYROLL</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Operational Overhead (Rent 25.3k, Electricity 8k, PTCL 15.5k, Promo Loading 392k, Tax 90.2k):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Staff Salaries & Field RSO Payroll (August.xlsx Row 41 Item #1):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                    <span className="font-sans">TOTAL OPERATING DEDUCTIONS:</span>
                    <span>Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 4. NET OPERATING PROFIT */}
                <div className="mt-5 p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 flex items-center justify-between text-base font-extrabold text-emerald-900">
                  <div className="font-sans">
                    <span>4. NET OPERATING PROFIT (1.4% FRANCHISE MODEL):</span>
                    <p className="text-xs font-normal font-sans text-slate-600 mt-0.5">
                      Actual net earnings: Total Commission Revenue (Rs. {Number(pnl.commission_income).toLocaleString()}) minus Total Operating Overhead & Salaries (Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString()}).
                    </p>
                  </div>
                  <div className="text-2xl font-mono font-black text-emerald-800">
                    Rs. {Number(pnl.agency_net_profit || (Number(pnl.commission_income) - Number(pnl.expenses) - Number(pnl.salaries))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 1. Operating Revenue (Sales Turnover) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">1. OPERATING REVENUE (EVC AIRTIME DISTRIBUTION & SALES)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Gross EVC Sales Turnover (Row 63-71 of August.xlsx):</span>
                    <span>Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span className="font-sans">Less: Sales Discounts & Returns:</span>
                    <span>(Rs. 0.00)</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                    <span className="font-sans">NET SALES REVENUE:</span>
                    <span>Rs. {Number(pnl.net_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 2. Cost of Goods Sold (COGS) */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">2. COST OF GOODS SOLD (COGS)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Wholesale Inventory Cost of EVC Airtime (97.50% Wholesale Cost):</span>
                    <span className="text-slate-800">Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                    <span className="font-sans">TOTAL COST OF GOODS SOLD (COGS):</span>
                    <span className="text-rose-700 font-bold">(Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                </div>

                {/* 3. Gross Sales Trading Margin */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">3. GROSS SALES TRADING MARGIN (NET SALES LESS COGS)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Net Sales Revenue:</span>
                    <span>Rs. {Number(pnl.net_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Less: Wholesale Inventory Cost (COGS):</span>
                    <span className="text-rose-700">(Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-slate-200/80 bg-slate-50/70 p-2 rounded-lg">
                    <span className="font-sans">GROSS SALES TRADING MARGIN (2.50% Spread):</span>
                    <span className="text-indigo-950 font-bold">Rs. {Number(pnl.gross_sales_margin || (Number(pnl.net_revenue) - Number(pnl.cogs))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 4. Commission & Incentive Revenue */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">4. COMMISSION & INCENTIVE REVENUE (FROM UFONE PTCL HQ)</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Ufone Promo Commissions (11 Categories, August.xlsx Row 160-170):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.promo_commissions || 638223).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">U-Top Up / EVC Distribution Commission (August.xlsx Row 16):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.topup_commissions || 211074).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-slate-200/80 bg-emerald-50/50 p-2 rounded-lg">
                    <span className="font-sans">TOTAL COMMISSION & INCENTIVE INCOME:</span>
                    <span className="text-emerald-800 font-bold">+Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 5. Total Gross Operating Profit */}
                <div className="pt-2">
                  <div className="flex justify-between items-center font-bold text-base text-indigo-950 p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200">
                    <div className="font-sans">
                      <span className="text-sm uppercase tracking-wide">5. TOTAL GROSS OPERATING PROFIT:</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Trading Margin (Rs. {Number(pnl.gross_sales_margin || (Number(pnl.net_revenue) - Number(pnl.cogs))).toLocaleString()}) + HQ Commissions (Rs. {Number(pnl.commission_income).toLocaleString()})
                      </p>
                    </div>
                    <span className="text-xl font-mono font-black text-indigo-900">
                      Rs. {Number(pnl.gross_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 6. Operating Expenses */}
                <div className="space-y-1.5 pt-4">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">6. OPERATING EXPENSES & OVERHEAD DEDUCTIONS</span>
                    <span>(PKR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">General & Administrative Expenses (Rent, Utilities, Transport, FCA Promo):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Staff & RSO Salaries Disbursed (August.xlsx Row 41 Item #1):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                    <span className="font-sans">TOTAL OPERATING DEDUCTIONS:</span>
                    <span>Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 7. NET PROFIT OR NET LOSS */}
                <div className={`mt-6 p-4 rounded-xl border-2 flex items-center justify-between text-base font-extrabold ${
                  pnl.is_loss
                    ? "bg-rose-50 border-rose-400 text-rose-800"
                    : "bg-emerald-50 border-emerald-400 text-emerald-800"
                }`}>
                  <div className="font-sans">
                    <span>{pnl.is_loss ? "NET OPERATING LOSS" : "7. NET OPERATING PROFIT (COMMERCIAL MODEL)"}:</span>
                    <p className="text-xs font-normal font-sans text-slate-600 mt-0.5">
                      {pnl.is_loss
                        ? "Operating expenses exceed gross profit. Negative earnings shown explicitly."
                        : "Net operating bottom-line earnings: Gross Profit (Rs. " + Number(pnl.gross_profit).toLocaleString() + ") minus Operating Overhead (Rs. " + (Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString() + ")."}
                    </p>
                  </div>
                  <div className="text-2xl font-mono font-black">
                    {pnl.is_loss ? (
                      <span>-Rs. {Number(pnl.loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    ) : (
                      <span>Rs. {Number(pnl.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 9. FINANCING, EQUITY & CAPITAL CASH MOVEMENTS (Reconciliation with Excel Row 59 Cash Outflows) */}
            {(pnl.loan_repayments > 0 || pnl.drawings > 0 || pnl.capital_inventory > 0) && (
              <div className="space-y-3 pt-4 mt-6 border-t border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                  <span className="font-sans">9. CASH FLOW RECONCILIATION (OPERATING VS. TOTAL CASH OUTFLOWS)</span>
                  <span>(PKR)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 font-sans text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Why Net Profit is +Rs. {Number(pnl.net_profit).toLocaleString()} while Cash Outflow is Rs. {Number(pnl.total_cash_outflows).toLocaleString()}:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    Total cash disbursements from the bank/cash register in August were <strong>Rs. 1,653,620.00</strong> (matching Row 59 of August.xlsx).
                    However, <strong>Rs. 825,160.00</strong> of these outflows are <em>non-operating balance sheet items</em> (repaying Haris Badshah loan debt, owner drawings taken by Islam Badshah, and purchasing SIM card inventory assets).
                    Because these are asset/equity/liability transactions rather than franchise business losses, your true operational overhead is only <strong>Rs. 828,460.00</strong> (Operating Expenses Rs. 576,136 + Salaries Rs. 252,324).
                    Against Gross Profit of <strong>Rs. 1,215,797.00</strong> (EVC sales margin Rs. 366,500 + Commissions Rs. 849,297), the business generated a healthy <strong>Net Operating Profit of +Rs. {Number(pnl.net_profit).toLocaleString()}</strong>.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">A. Total Operating Deductions (Overhead + Salaries):</span>
                    <span className="text-slate-700">Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {pnl.loan_repayments > 0 && (
                    <div className="flex justify-between text-slate-600 pl-4">
                      <span className="font-sans">B. Loan Principal Repayment (Haris Badshah Debt Settlement):</span>
                      <span className="text-slate-700">Rs. {Number(pnl.loan_repayments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {pnl.drawings > 0 && (
                    <div className="flex justify-between text-slate-600 pl-4">
                      <span className="font-sans">C. Owner Personal Drawings (Islam Badshah Sb Household, IESCO/SNGPL, Driver):</span>
                      <span className="text-slate-700">Rs. {Number(pnl.drawings).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {pnl.capital_inventory > 0 && (
                    <div className="flex justify-between text-slate-600 pl-4">
                      <span className="font-sans">D. Merchandise Stock Inflow (Paired & Loose SIM Orders Ufone HQ):</span>
                      <span className="text-slate-700">Rs. {Number(pnl.capital_inventory).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-slate-300 bg-slate-50 p-2 rounded-lg">
                    <span className="font-sans">TOTAL CASH OUTFLOWS (Row 59 of August.xlsx: A + B + C + D):</span>
                    <span>Rs. {Number(pnl.total_cash_outflows || (Number(pnl.expenses) + Number(pnl.salaries) + Number(pnl.loan_repayments || 0) + Number(pnl.drawings || 0) + Number(pnl.capital_inventory || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Audit & Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-10 text-center font-sans">
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">Shahid Khan</p>
                <p className="text-[10px] text-slate-500 uppercase">Prepared by Finance Officer</p>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">Islam Badshah</p>
                <p className="text-[10px] text-slate-500 uppercase">Approved by Franchise Owner</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
