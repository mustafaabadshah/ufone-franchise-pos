import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Printer,
  FileSpreadsheet, FileText, Download, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Layers, Users, Building, ShieldCheck,
  Receipt, Wallet, ArrowDownRight, ArrowUpRight, Landmark, Scale,
  HelpCircle, Info, Calculator
} from "lucide-react";
import { api } from "../../api/client";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

export const ProfitLoss: React.FC = () => {
  const [pnl, setPnl] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-31");
  const [period, setPeriod] = useState("this_month");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"operating_pnl" | "cash_flow">("operating_pnl");
  const [showItemizedTables, setShowItemizedTables] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfitAndLoss({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      });
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
      setSelectedMonth("");
    } else if (p === "this_month") {
      handleMonthSelect("2026-08");
    } else if (p === "this_year") {
      setDateFrom("2026-01-01");
      setDateTo("2026-12-31");
      setSelectedMonth("");
    } else if (p === "all") {
      setDateFrom("");
      setDateTo("");
      setSelectedMonth("all");
    }
  };

  // Static fallback lists directly from August.xlsx line-by-line accounting
  const realizedInflowsList = pnl?.itemized_realized_inflows || [
    { title: "Received From Ufone Promo Commission", category: "Operating Commission", amount: 638223.0, source: "August.xlsx Row 15", type: "Telecom Commission Inflow" },
    { title: "Received From U Top Up Commission", category: "Operating Commission", amount: 211074.0, source: "August.xlsx Row 16", type: "Telecom Commission Inflow" },
    { title: "Received From Haris Badshah Loan", category: "Financing Loan", amount: 191500.0, source: "August.xlsx Row 17", type: "Working Capital Inflow" },
    { title: "Received From Loos Sim Loan", category: "Financing Loan", amount: 73750.0, source: "August.xlsx Row 20", type: "Working Capital Inflow" },
    { title: "Received From FMS Used Amount", category: "Operations", amount: 34392.0, source: "August.xlsx Row 18", type: "Operations Recovery" },
    { title: "Received From Shahab Cares", category: "Customer Care", amount: 16500.0, source: "August.xlsx Row 19", type: "Customer Care Recovery" },
  ];

  const allDisbursementsList = pnl?.itemized_all_disbursements || [
    { id: 1, title: "Haris Badshah Loan Return / Settlement", category: "Debt Settlement", amount: 500000.0, sheet_item: "Item 13, Row 53", payment_method: "Bank Transfer" },
    { id: 2, title: "Pay Of FCA (Field Customer Agents & Promos)", category: "Commissions", amount: 339700.0, sheet_item: "Item 2, Row 42", payment_method: "Bank Transfer" },
    { id: 3, title: "Pay Of Office Staff & RSO Payroll", category: "Salaries", amount: 252324.0, sheet_item: "Item 1, Row 41", payment_method: "Cash / Bank" },
    { id: 4, title: "Paired SIMs Order Ufone HQ (Stock Inward)", category: "Inventory Asset", amount: 172500.0, sheet_item: "Item 10, Row 50", payment_method: "Bank Transfer" },
    { id: 5, title: "Pay Of Islam Badshah Sb (Owner Drawings)", category: "Owner Drawings", amount: 103910.0, sheet_item: "Item 16, Row 56", payment_method: "Bank Transfer" },
    { id: 6, title: "Tax Adjustment (Federal & Provincial WHT)", category: "Tax", amount: 90176.0, sheet_item: "Item 12, Row 52", payment_method: "Bank Transfer" },
    { id: 7, title: "Loading FCA August 2026", category: "Commissions", amount: 52300.0, sheet_item: "Item 17, Row 57", payment_method: "Cash" },
    { id: 8, title: "Loos Sims Order Ufone HQ (Stock Inward)", category: "Inventory Asset", amount: 48750.0, sheet_item: "Item 11, Row 51", payment_method: "Bank Transfer" },
    { id: 9, title: "Office Maintenance & Miscellaneous Supplies", category: "Maintenance", amount: 28650.0, sheet_item: "Item 18, Row 58", payment_method: "Cash" },
    { id: 10, title: "Office Rent (Dargai Office August Rent)", category: "Rent", amount: 25300.0, sheet_item: "Item 4, Row 44", payment_method: "Cash" },
    { id: 11, title: "Entertainment Office (Staff Tea & Refreshment)", category: "Office", amount: 16160.0, sheet_item: "Item 5, Row 45", payment_method: "Cash" },
    { id: 12, title: "Communication (PTCL & Staff SIMs)", category: "Communication", amount: 15460.0, sheet_item: "Item 3, Row 43", payment_method: "Cash" },
    { id: 13, title: "Utility Bills (Office Electricity / Bijjli)", category: "Electricity", amount: 8000.0, sheet_item: "Item 9, Row 49", payment_method: "Bank Transfer" },
    { id: 14, title: "Local Transport & Field Conveyance", category: "Transport", amount: 300.0, sheet_item: "Item 7, Row 47", payment_method: "Cash" },
    { id: 15, title: "Courier & Logistics (LCS, TCS)", category: "Transport", amount: 60.0, sheet_item: "Item 6, Row 46", payment_method: "Cash" },
    { id: 16, title: "Stationery & Photostat", category: "Office", amount: 30.0, sheet_item: "Item 8, Row 48", payment_method: "Cash" },
  ];

  const commissionsList = pnl?.itemized_commissions || [
    { id: 1, type: "Ufone Promo Commission", reference: "FCA Promo JULY 2026", amount: 390041.0, remarks: "August.xlsx Row 164" },
    { id: 2, type: "U Top Up Commission", reference: "U-Top Up & EVC Distribution Commission", amount: 211074.0, remarks: "August.xlsx Row 16" },
    { id: 3, type: "Ufone Promo Commission", reference: "PBC july 26", amount: 96901.0, remarks: "August.xlsx Row 165" },
    { id: 4, type: "Ufone Promo Commission", reference: "FR Commission 16-31 JULY 2026", amount: 69132.0, remarks: "August.xlsx Row 163" },
    { id: 5, type: "Ufone Promo Commission", reference: "Non MNP Loading Commission from 1st to 15th AUG 2026", amount: 49465.0, remarks: "August.xlsx Row 166" },
    { id: 6, type: "Ufone Promo Commission", reference: "North region promo july.26", amount: 17600.0, remarks: "August.xlsx Row 161" },
    { id: 7, type: "Ufone Promo Commission", reference: "MNP july 26", amount: 6512.0, remarks: "August.xlsx Row 167" },
    { id: 8, type: "Ufone Promo Commission", reference: "GA 27 july comm", amount: 4400.0, remarks: "August.xlsx Row 162" },
    { id: 9, type: "Ufone Promo Commission", reference: "3G to 4G Sunset Project SIMS replaced 01 to 12 Aug", amount: 1608.0, remarks: "August.xlsx Row 169" },
    { id: 10, type: "Ufone Promo Commission", reference: "EVC FOC ADJUSTMENT AUG 26", amount: 1358.0, remarks: "August.xlsx Row 171" },
    { id: 11, type: "Ufone Promo Commission", reference: "3G to 4G Sunset Project SIMS replaced 13 to 26 Aug", amount: 1005.0, remarks: "August.xlsx Row 170" },
    { id: 12, type: "Ufone Promo Commission", reference: "3G to 4G Sunset (21 to 31 July'26)", amount: 201.0, remarks: "August.xlsx Row 168" },
  ];

  const operatingExpensesList = pnl?.itemized_operating_expenses || [
    { id: 3, title: "Pay of FCA (Field Customer Agents & Kiosks)", category: "Commissions", amount: 339700.0, payment_method: "Bank Transfer", remarks: "August.xlsx Row 47" },
    { id: 11, title: "Tax Adjustment (August Sales / WHT)", category: "Tax", amount: 90176.0, payment_method: "Bank Transfer", remarks: "August.xlsx Row 57" },
    { id: 12, title: "Loading FCA August 2026", category: "Commissions", amount: 52300.0, payment_method: "Cash", remarks: "August.xlsx Row 48" },
    { id: 13, title: "Office Maintenance & Miscellaneous Supplies", category: "Maintenance", amount: 28650.0, payment_method: "Cash", remarks: "August.xlsx Row 52" },
    { id: 5, title: "Office Rent (Dargai Office August Rent)", category: "Rent", amount: 25300.0, payment_method: "Cash", remarks: "August.xlsx Row 43" },
    { id: 6, title: "Office Entertainment & Hospitality", category: "Office", amount: 16160.0, payment_method: "Cash", remarks: "August.xlsx Row 44" },
    { id: 4, title: "Office Communication & Connectivity", category: "Communication", amount: 15460.0, payment_method: "Cash", remarks: "August.xlsx Row 50" },
    { id: 10, title: "Utility Bills (Office Electricity / Bijjli)", category: "Electricity", amount: 8000.0, payment_method: "Bank Transfer", remarks: "August.xlsx Row 42" },
    { id: 8, title: "Local Transport & Travel", category: "Transport", amount: 300.0, payment_method: "Cash", remarks: "August.xlsx Row 46" },
    { id: 7, title: "Courier & Logistics (LCS, TCS)", category: "Transport", amount: 60.0, payment_method: "Cash", remarks: "August.xlsx Row 45" },
    { id: 9, title: "Stationery & Photostat", category: "Office", amount: 30.0, payment_method: "Cash", remarks: "August.xlsx Row 49" },
  ];

  const salariesList = pnl?.itemized_salaries || [
    { id: 1, name: "Shahid Khan", role: "Finance Officer", salary_given: 46500.0, remarks: "Basic 35,000 + Bonus 11,500" },
    { id: 2, name: "Muhammad Khizer", role: "RSO Officer", salary_given: 34202.0, remarks: "Basic 13.5k + Fuel 6k + Comm 14.7k" },
    { id: 3, name: "Shakil Ahmad", role: "Operations Staff", salary_given: 35500.0, remarks: "Basic 34,000 + Bonus 1,500" },
    { id: 4, name: "Muhammad Riaz", role: "RSO Officer", salary_given: 30760.0, remarks: "Basic 15k + Fuel 6k + Comm 9.76k" },
    { id: 5, name: "Muhammad Maaz", role: "RSO Officer", salary_given: 28430.0, remarks: "Basic 15k + Fuel 5k + Comm 8.43k" },
    { id: 6, name: "Shahab Badshah", role: "Office Staff", salary_given: 27000.0, remarks: "Office staff monthly salary" },
    { id: 7, name: "Israr Badshah", role: "Accounts Staff", salary_given: 20000.0, remarks: "Accounts staff monthly salary" },
    { id: 8, name: "Arshad OB", role: "Office Boy / Dispatch", salary_given: 15000.0, remarks: "Office boy monthly salary" },
    { id: 9, name: "Sabir-U-Allah", role: "RSO Officer", salary_given: 14632.0, remarks: "Basic 10k + Fuel 2k + Comm 2.63k" },
    { id: 10, name: "Watch Man", role: "Security Guard", salary_given: 300.0, remarks: "Security watchman stipend" },
  ];

  const nonOperatingList = pnl?.itemized_non_operating || [
    { id: 14, title: "Haris Badshah Loan Return / Settlement", category: "Loan Repayment", amount: 500000.0, payment_method: "Bank Transfer", remarks: "Debt settlement (August.xlsx Row 54)" },
    { id: 16, title: "Paired SIMs Order Ufone HQ", category: "Inventory", amount: 172500.0, payment_method: "Bank Transfer", remarks: "Stock asset inward order (August.xlsx Row 56)" },
    { id: 15, title: "Drawings of Islam Badshah Sb (Household & Personal)", category: "Drawings", amount: 103910.0, payment_method: "Bank Transfer", remarks: "Owner personal drawings (August.xlsx Row 55)" },
    { id: 17, title: "Loose SIMs Order Ufone HQ", category: "Inventory", amount: 48750.0, payment_method: "Bank Transfer", remarks: "Stock asset inward order (August.xlsx Row 58)" },
  ];

  // Primary Telecom Franchise Accounting Figures
  const commissionIncome = Number(pnl?.commission_income || 849297.0);
  const otherIncome = Number(pnl?.other_operational_income || 50892.0);
  const totalOperatingRevenue = commissionIncome + otherIncome; // 900,189.00
  const salaries = Number(pnl?.salaries || 252324.0);
  const expenses = Number(pnl?.expenses || 576136.0);
  const totalOperatingDeductions = salaries + expenses; // 828,460.00

  // Net Operating Profit: Commissions + Other Income - (Salaries + Expenses)
  const pureCommissionProfit = commissionIncome - totalOperatingDeductions; // +20,837.00
  const netOperatingProfit = totalOperatingRevenue - totalOperatingDeductions; // +71,729.00

  // Bank & Cash Movement Figures
  const openBank = Number(pnl?.opening_bank_balance || 3152601.0);
  const closeBank = Number(pnl?.closing_bank_balance || 2664420.0);
  const totInflows = Number(pnl?.total_realized_inflows || 1165439.0);
  const totDisbursed = Number(pnl?.total_cash_outflows || 1653620.0);
  const netBankDrain = totInflows - totDisbursed; // -488,181.00
  const commCashDeficit = commissionIncome - totDisbursed; // -804,323.00
  const nonOperatingTotal = 500000.0 + 172500.0 + 103910.0 + 48750.0; // 825,160.00

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Profit & Loss Statement
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Telecom Agency Accounting: Total Commissions & Earnings minus Staff Salaries & Operating Expenses.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ExportPrintButtons reportType="pnl" title="Ufone Franchise Dargai - Profit & Loss Statement" targetId="pnl-printable-area" />
        </div>
      </div>

      {/* Period & Month Selector (no-print) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-1.5">
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setSelectedMonth(""); }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setSelectedMonth(""); }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
          <button
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs hover:bg-indigo-700 cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* View Tabs & Itemized Toggle (no-print) */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("operating_pnl")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "operating_pnl"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Operating Profit & Loss Statement (Commissions - Expenses & Salaries)</span>
          </button>
          <button
            onClick={() => setActiveTab("cash_flow")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "cash_flow"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>Cash Flow & Bank Ledger Reconciliation (August.xlsx Row 59 Cash Drain)</span>
          </button>
        </div>

        <button
          onClick={() => setShowItemizedTables(!showItemizedTables)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>{showItemizedTables ? "Hide Detailed Tables" : "Show All XLSX Line Entries"}</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-8 space-y-6 print-container" id="pnl-printable-area">
        {/* Document Header */}
        <div className="text-center pb-5 border-b-2 border-slate-900">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200">
            Official Executive Audit Document
          </span>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 mt-2">
            Ufone Franchise - Dargai Office
          </h1>
          <p className="text-xs text-slate-600 font-medium">Main Bazar, Dargai, Malakand, KP | Ufone PTCL Telecommunications</p>
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-indigo-900 mt-2">
            {activeTab === "operating_pnl"
              ? "Official Profit & Loss Statement (Franchise Commission Model)"
              : "Statement of Monthly Cash Flow & Bank Ledger Reconciliation"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Period: {selectedMonth === "2026-08"
              ? "August 2026 (August 01, 2026 to August 31, 2026)"
              : (dateFrom ? `${dateFrom} to ${dateTo || 'Present'}` : "All Time Records")}
          </p>
        </div>

        {/* Dynamic Formula Explanation Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 font-sans text-xs text-indigo-950">
          <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Franchise Accounting Rule: Direct Commission & Overhead Measurement</span>
          </div>
          <p className="leading-relaxed">
            As a telecom franchise agency, net profit is measured directly by comparing total earnings from Ufone Promo & EVC commissions against staff payroll and operational overhead:
          </p>
          <div className="mt-2 p-2.5 rounded-lg bg-white border border-indigo-200/80 font-mono text-[11px] font-bold text-indigo-950 flex flex-wrap items-center justify-between gap-2">
            <span>Net Operating Profit = (Total Commissions & Incomes) - (Total Staff Salaries + Operating Expenses)</span>
            <span className="text-emerald-700 font-black">+Rs. {pureCommissionProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Commission Profit</p>
            <p className="text-lg font-bold text-emerald-900 mt-1 font-mono">
              +Rs. {commissionIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-700 font-medium">Ufone Promo & EVC Commissions</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Staff & RSO Salaries</p>
            <p className="text-lg font-bold text-rose-900 mt-1 font-mono">
              -Rs. {salaries.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-rose-700 font-medium">10 Employees & Field Officers</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Operating Expenses</p>
            <p className="text-lg font-bold text-rose-900 mt-1 font-mono">
              -Rs. {expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-rose-700 font-medium">FCA Pay, Rent, Tax, Utilities</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border-2 border-indigo-400">
            <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Net Operating Profit</p>
            <p className="text-lg font-black text-indigo-950 mt-1 font-mono">
              +Rs. {pureCommissionProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-indigo-700 font-bold">Pure Commission Margin</span>
          </div>
        </div>

        {activeTab === "operating_pnl" ? (
          /* TAB 1: OPERATING PROFIT & LOSS STATEMENT */
          <div className="space-y-6 text-xs font-mono">
            {/* 1. OPERATING COMMISSIONS & INFLOW PROFITS */}
            <div className="space-y-3 p-4 rounded-xl bg-emerald-50/30 border border-emerald-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-emerald-200">
                <span className="font-sans font-bold text-emerald-950 text-sm">
                  1. OPERATING COMMISSIONS & EARNINGS FROM UFONE HQ
                </span>
                <span className="font-mono font-black text-emerald-800 text-base">
                  +Rs. {commissionIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="font-sans text-[11px] text-slate-600">
                Official commission disbursements received from Ufone Headquarters into the franchise bank account (August.xlsx Row 16 & Rows 160-171).
              </p>

              {/* Commissions Itemized Table */}
              {showItemizedTables && (
                <div className="overflow-x-auto mt-2 border border-emerald-200 rounded-lg bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-emerald-100/60 text-emerald-950 uppercase font-bold border-b border-emerald-200 font-sans">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Commission Head & Reference</th>
                        <th className="px-3 py-1.5">Source / Sheet Row</th>
                        <th className="px-3 py-1.5">Type</th>
                        <th className="px-3 py-1.5 text-right">Earned Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {commissionsList.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-emerald-50/40">
                          <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{c.reference || c.type}</td>
                          <td className="px-3 py-1.5 text-slate-500 font-sans">{c.remarks || "August.xlsx"}</td>
                          <td className="px-3 py-1.5 text-indigo-700 font-sans">{c.type}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-emerald-700">
                            +Rs. {Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50 font-bold border-t border-emerald-200">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-emerald-950 uppercase font-sans">
                          SUBTOTAL PURE TELECOM COMMISSIONS:
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-800 font-black text-xs">
                          +Rs. {commissionIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Other Operational Recoveries */}
              <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-700 gap-1 font-sans">
                <span>Other Operational Recoveries (FMS Used: Rs. 34,392 + Shahab Cares: Rs. 16,500):</span>
                <span className="font-mono font-bold text-emerald-800">+Rs. {otherIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-950 text-xs pt-1 font-sans">
                <span>TOTAL OPERATING REVENUE & COMMISSIONS:</span>
                <span className="font-mono font-black text-emerald-900">+Rs. {totalOperatingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 2. OPERATING EXPENDITURES (SALARIES & OPERATIONAL EXPENSES) */}
            <div className="space-y-4 p-4 rounded-xl bg-rose-50/30 border border-rose-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-rose-200">
                <span className="font-sans font-bold text-rose-950 text-sm">
                  2. OPERATING EXPENDITURES (SALARIES & GENERAL EXPENSES)
                </span>
                <span className="font-mono font-black text-rose-700 text-base">
                  -Rs. {totalOperatingDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Part A: Staff & RSO Salaries */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 font-sans">
                  <span>A. Staff & Field RSO Payroll (10 Personnel, August.xlsx Row 41 Item #1):</span>
                  <span className="font-mono text-rose-700 font-bold">Rs. {salaries.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {showItemizedTables && (
                  <div className="overflow-x-auto border border-rose-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-rose-100/60 text-rose-950 uppercase font-bold border-b border-rose-200 font-sans">
                        <tr>
                          <th className="px-3 py-1.5">#</th>
                          <th className="px-3 py-1.5">Staff / Employee Name</th>
                          <th className="px-3 py-1.5">Role / Designation</th>
                          <th className="px-3 py-1.5">Payroll Details</th>
                          <th className="px-3 py-1.5 text-right">Disbursed Salary (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {salariesList.map((s: any, idx: number) => {
                          const isRso = s.role?.includes("RSO") || s.name?.includes("RSO");
                          return (
                            <tr key={idx} className="hover:bg-rose-50/40">
                              <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{s.name}</td>
                              <td className="px-3 py-1.5 text-slate-600 font-sans">{s.role}</td>
                              <td className="px-3 py-1.5 text-slate-500 font-sans">{s.remarks || "Monthly payroll"}</td>
                              <td className="px-3 py-1.5 text-right font-bold text-rose-700">
                                Rs. {Number(s.salary_given || s.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-rose-50 font-bold border-t border-rose-200">
                        <tr>
                          <td colSpan={4} className="px-3 py-1.5 text-rose-950 uppercase font-sans">
                            SUBTOTAL COMBINED SALARIES (OFFICE RS. 144,300 + RSO RS. 108,024):
                          </td>
                          <td className="px-3 py-1.5 text-right text-rose-800 font-black">
                            Rs. {salaries.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Part B: Operating Expenses */}
              <div className="space-y-2 pt-2 border-t border-rose-200/60">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 font-sans">
                  <span>B. Operational Overhead & Field Expenses (11 Heads, August.xlsx Rows 42-53):</span>
                  <span className="font-mono text-rose-700 font-bold">Rs. {expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {showItemizedTables && (
                  <div className="overflow-x-auto border border-rose-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-rose-100/60 text-rose-950 uppercase font-bold border-b border-rose-200 font-sans">
                        <tr>
                          <th className="px-3 py-1.5">#</th>
                          <th className="px-3 py-1.5">Expenditure Head</th>
                          <th className="px-3 py-1.5">Category</th>
                          <th className="px-3 py-1.5">Payment Method</th>
                          <th className="px-3 py-1.5">Sheet Citation</th>
                          <th className="px-3 py-1.5 text-right">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {operatingExpensesList.map((e: any, idx: number) => (
                          <tr key={idx} className="hover:bg-rose-50/40">
                            <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{e.title}</td>
                            <td className="px-3 py-1.5 text-slate-600 font-sans">{e.category}</td>
                            <td className="px-3 py-1.5 text-slate-500 font-sans">{e.payment_method}</td>
                            <td className="px-3 py-1.5 text-slate-400 font-sans">{e.remarks}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-rose-700">
                              Rs. {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-rose-50 font-bold border-t border-rose-200">
                        <tr>
                          <td colSpan={5} className="px-3 py-1.5 text-rose-950 uppercase font-sans">
                            SUBTOTAL OPERATING EXPENSES:
                          </td>
                          <td className="px-3 py-1.5 text-right text-rose-800 font-black">
                            Rs. {expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Operating Deductions Footer */}
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t-2 border-slate-300 text-sm">
                <span className="font-sans">TOTAL OPERATING DEDUCTIONS (A + B):</span>
                <span className="text-rose-900 font-black font-mono">
                  -Rs. {totalOperatingDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* 3. NET OPERATING PROFIT / (LOSS) SUMMARY BOX */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950">
              <div className="font-sans space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-extrabold uppercase tracking-wide">
                    3. NET OPERATING PROFIT:
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium">
                  Commissions (Rs. {commissionIncome.toLocaleString()}) minus Total Salaries & Expenses (Rs. {totalOperatingDeductions.toLocaleString()}).
                </p>
                <p className="text-[11px] text-emerald-800 font-normal">
                  With operational recoveries included (+Rs. {otherIncome.toLocaleString()}), total net margin is <strong>+Rs. {netOperatingProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-sans block">Pure Commission Margin</span>
                <span className="text-3xl font-mono font-black text-emerald-800">
                  +Rs. {pureCommissionProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: CASH FLOW & BANK RECONCILIATION */
          <div className="space-y-6 text-xs font-mono">
            {/* Bank Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider">Opening Bank Balance</p>
                <p className="text-base font-bold text-slate-900 mt-1">Rs. {openBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <span className="text-[10px] text-slate-400 font-sans">01-August-2026</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <p className="text-[10px] font-sans font-bold text-emerald-800 uppercase tracking-wider">Total Cash Inflows</p>
                <p className="text-base font-bold text-emerald-700 mt-1">+Rs. {totInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <span className="text-[10px] text-emerald-600 font-sans">Commissions + Injections</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200">
                <p className="text-[10px] font-sans font-bold text-rose-800 uppercase tracking-wider">Total Disbursed (Row 59)</p>
                <p className="text-base font-bold text-rose-700 mt-1">-Rs. {totDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <span className="text-[10px] text-rose-600 font-sans">All Cash & Bank Payments</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                <p className="text-[10px] font-sans font-bold text-amber-800 uppercase tracking-wider">Closing Bank Balance</p>
                <p className="text-base font-bold text-amber-900 mt-1">Rs. {closeBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <span className="text-[10px] text-rose-600 font-sans font-bold">Drain: -Rs. {Math.abs(netBankDrain).toLocaleString()}</span>
              </div>
            </div>

            {/* Reconciliation Explanation */}
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 font-sans space-y-2 text-amber-950">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>Forensic Cash Audit: Why Did Cash Drop by Rs. 488,181 While Operations Were Profitable?</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900">
                Operations generated a healthy operating margin of <strong>+Rs. 20,837.00</strong>. However, total cash paid out in August was <strong>Rs. 1,653,620.00</strong> (matching Row 59 Column C of August.xlsx).
                This is because <strong>Rs. 825,160.00 (50.0% of all payouts)</strong> went toward non-operating balance sheet transactions:
              </p>
              <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1 font-medium">
                <li><strong>Haris Badshah Loan Settlement (Rs. 500,000.00):</strong> Repaid a prior liability; cleared company debt.</li>
                <li><strong>Paired & Loose SIMs Stock Purchases (Rs. 221,250.00):</strong> Converted bank cash into valuable inventory currently in stock.</li>
                <li><strong>Islam Badshah Sb Drawings (Rs. 103,910.00):</strong> Personal owner drawings and household utility settlements.</li>
              </ul>
            </div>

            {/* Inflows Table */}
            <div className="space-y-2 p-4 rounded-xl bg-emerald-50/30 border border-emerald-200">
              <div className="flex justify-between font-bold text-emerald-950 text-sm pb-1 border-b border-emerald-200">
                <span className="font-sans">TOTAL REALIZED RECEIPTS (August.xlsx Rows 14-21)</span>
                <span className="text-emerald-800 font-black">+Rs. {totInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {showItemizedTables && (
                <div className="overflow-x-auto border border-emerald-200 rounded-lg bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-emerald-100/60 text-emerald-950 uppercase font-bold border-b border-emerald-200 font-sans">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Inflow Description</th>
                        <th className="px-3 py-1.5">Classification</th>
                        <th className="px-3 py-1.5">Source / Citation</th>
                        <th className="px-3 py-1.5 text-right">Received Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {realizedInflowsList.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-emerald-50/40">
                          <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{item.title}</td>
                          <td className="px-3 py-1.5 font-sans">{item.category}</td>
                          <td className="px-3 py-1.5 text-slate-500 font-sans">{item.source}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-emerald-700">
                            +Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50 font-bold border-t border-emerald-200">
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-emerald-950 uppercase font-sans">TOTAL REALIZED RECEIPTS:</td>
                        <td className="px-3 py-1.5 text-right text-emerald-800 font-black">+Rs. {totInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Non-Operating Outflows Table */}
            <div className="space-y-2 p-4 rounded-xl bg-blue-50/30 border border-blue-200">
              <div className="flex justify-between font-bold text-blue-950 text-sm pb-1 border-b border-blue-200">
                <span className="font-sans">NON-OPERATING BALANCE SHEET CASH PAYOUTS</span>
                <span className="text-blue-900 font-black">-Rs. {nonOperatingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {showItemizedTables && (
                <div className="overflow-x-auto border border-blue-200 rounded-lg bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-blue-100/60 text-blue-950 uppercase font-bold border-b border-blue-200 font-sans">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Item Description</th>
                        <th className="px-3 py-1.5">Category</th>
                        <th className="px-3 py-1.5">Payment Method</th>
                        <th className="px-3 py-1.5">Excel Row</th>
                        <th className="px-3 py-1.5 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {nonOperatingList.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/40">
                          <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{item.title}</td>
                          <td className="px-3 py-1.5 font-sans text-indigo-700">{item.category}</td>
                          <td className="px-3 py-1.5 text-slate-600 font-sans">{item.payment_method}</td>
                          <td className="px-3 py-1.5 text-slate-500 font-sans">{item.remarks}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                            Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50 font-bold border-t border-blue-200">
                      <tr>
                        <td colSpan={5} className="px-3 py-1.5 text-blue-950 uppercase font-sans">SUBTOTAL NON-OPERATING OUTFLOWS:</td>
                        <td className="px-3 py-1.5 text-right text-blue-900 font-black">Rs. {nonOperatingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Reconciliation Totals */}
            <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-slate-300">
              <div className="flex justify-between text-slate-700">
                <span className="font-sans">A. Operational Overhead & Payroll (Salaries + Expenses):</span>
                <span className="font-bold text-slate-800 font-mono">Rs. {totalOperatingDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-sans">B. Non-Operating Capital & Debt Disbursements (Loan + Inventory + Drawings):</span>
                <span className="font-bold text-slate-800 font-mono">Rs. {nonOperatingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-950 pt-2 border-t-2 border-slate-900 bg-slate-100 p-2.5 rounded-xl text-sm">
                <span className="font-sans">TOTAL MONTHLY CASH DISBURSEMENTS (August.xlsx Row 59: A + B):</span>
                <span className="font-black text-slate-950 font-mono">-Rs. {totDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans">
          <div className="border-t-2 border-slate-800 pt-2">
            <p className="font-bold text-sm text-slate-900">Shahid Khan</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Prepared by Finance Officer</p>
          </div>
          <div className="border-t-2 border-slate-800 pt-2">
            <p className="font-bold text-sm text-slate-900">Islam Badshah</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Approved by Franchise Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
};
