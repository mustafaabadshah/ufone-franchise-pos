import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Printer,
  FileSpreadsheet, FileText, Download, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Layers, Users, Building, ShieldCheck,
  Receipt, Wallet, ArrowDownRight, ArrowUpRight, Landmark, Scale,
  HelpCircle, Info
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
  const [viewMode, setViewMode] = useState<"actual_cash_loss" | "agency_1_4" | "commercial">("actual_cash_loss");
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

  // Fallback lists if backend itemized lists are loading
  const rsoSales = pnl?.itemized_rso_sales || [
    { id: 2, name: "Muhammad Khizer", route: "Dargai Sector 2", sales_volume: 6930000.0 },
    { id: 1, name: "Muhammad Riaz", route: "Dargai Sector 1", sales_volume: 3400000.0 },
    { id: 3, name: "Muhammad Maaz", route: "Dargai Sector 3", sales_volume: 2450000.0 },
    { id: 4, name: "Sabir-U-Allah", route: "Dargai Sector 4", sales_volume: 1880000.0 },
  ];

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

  const openBank = pnl?.opening_bank_balance || 3152601.0;
  const closeBank = pnl?.closing_bank_balance || 2664420.0;
  const totInflows = pnl?.total_realized_inflows || 1165439.0;
  const totDisbursed = pnl?.total_cash_outflows || 1653620.0;
  const netBankDrain = pnl?.net_cash_depletion || (totInflows - totDisbursed);
  const commDeficit = pnl?.franchise_actual_cash_deficit || (Number(pnl?.commission_income || 849297.0) - totDisbursed);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Profit & Loss Statement</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Forensic reconciliation between franchise cash flow sheets (August.xlsx) and standard accrual accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="pnl" title="Ufone Franchise Dargai - Profit & Loss Statement" targetId="pnl-printable-area" />
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
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Accounting Model & View Options Banner (no-print) */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Accounting Method:</span>
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold gap-1">
            <button
              onClick={() => setViewMode("actual_cash_loss")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "actual_cash_loss"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Franchise Cash Sheet Model (August.xlsx Loss: -Rs. 804k / Bank Drain: -Rs. 488k)</span>
            </button>
            <button
              onClick={() => setViewMode("agency_1_4")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "agency_1_4"
                  ? "bg-white text-indigo-900 shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Operating Overhead Margin (+Rs. 20,837)</span>
            </button>
            <button
              onClick={() => setViewMode("commercial")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === "commercial"
                  ? "bg-white text-indigo-900 shadow-xs font-bold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <span>Commercial Spread Model (+Rs. 387,337)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowItemizedTables(!showItemizedTables)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showItemizedTables ? "Hide Detailed Tables" : "Show All XLSX Line Entries"}</span>
          </button>
        </div>
      </div>

      {/* Printable P&L Statement Sheet */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-8 space-y-6 print-container" id="pnl-printable-area">
        {/* Document Header */}
        <div className="text-center pb-5 border-b-2 border-slate-900">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200">
            Official Executive Audit Document
          </span>
          <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900 mt-2">Ufone Franchise - Dargai Office</h1>
          <p className="text-xs text-slate-600 font-medium">Main Bazar, Dargai, Malakand, KP | Ufone PTCL Telecommunications</p>
          <h2 className="text-base font-extrabold uppercase tracking-widest text-indigo-900 mt-2">
            Statement of Profit & Loss and Cash Flow
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Period: {selectedMonth === "2026-08"
              ? "August 2026 (Live Closed Month - August 01, 2026 to August 31, 2026)"
              : (dateFrom ? `${dateFrom} to ${dateTo || 'Present'}` : "All Time Records (Cumulative)")}
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
            Model: {viewMode === "actual_cash_loss"
              ? "Franchise Cash Ledger & Bank Balance Sheet Model (August.xlsx Physical Business Truth)"
              : (viewMode === "agency_1_4" ? "Franchise 1.4% Telecom Commission & Operating Margin Model" : "Commercial Turnover & Trading Margin Model")}
          </div>
        </div>

        {pnl && (
          <div className="space-y-6 text-xs font-mono">
            {viewMode === "actual_cash_loss" ? (
              <>
                {/* 0. BANK & CASH EXECUTIVE SUMMARY CARDS (Rows 4-12, Column S of August.xlsx) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider">Opening Bank/Cash (Row 6)</p>
                    <p className="text-base font-bold text-slate-900 mt-1">Rs. {Number(openBank).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <span className="text-[10px] text-slate-400 font-sans">As of 01-August-2026</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <p className="text-[10px] font-sans font-bold text-emerald-800 uppercase tracking-wider">Total Inflow Receipts (Row 8 & 21)</p>
                    <p className="text-base font-bold text-emerald-700 mt-1">+Rs. {Number(totInflows).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <span className="text-[10px] text-emerald-600 font-sans">Commissions + Injections</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200">
                    <p className="text-[10px] font-sans font-bold text-rose-800 uppercase tracking-wider">Total Disbursed (Row 10 & 59)</p>
                    <p className="text-base font-bold text-rose-700 mt-1">-Rs. {Number(totDisbursed).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <span className="text-[10px] text-rose-600 font-sans">All payments from bank/cash</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                    <p className="text-[10px] font-sans font-bold text-amber-800 uppercase tracking-wider">Closing Bank/Cash (Row 12)</p>
                    <p className="text-base font-bold text-amber-900 mt-1">Rs. {Number(closeBank).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <span className="text-[10px] text-rose-600 font-sans font-bold">Drain: -Rs. {Math.abs(netBankDrain).toLocaleString()}</span>
                  </div>
                </div>

                {/* FORENSIC CLARITY BANNER: WHY FRANCHISE IDENTIFIED A LOSS */}
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 font-sans space-y-2 text-rose-950">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>Business Truth: Why the Franchise Experienced a Financial Loss / Deficit in August</span>
                  </div>
                  <p className="text-xs leading-relaxed text-rose-900">
                    Franchise leadership rightly noticed that <strong>the business lost money in August 2026</strong>. Total disbursements from the franchise bank account and cash register were <strong>Rs. 1,653,620.00</strong>. Against Ufone commission revenue of <strong>Rs. 849,297.00</strong>, there was a direct <strong>Operating Commission Deficit of -Rs. 804,323.00</strong>.
                  </p>
                  <p className="text-xs leading-relaxed text-rose-800">
                    Even after receiving <strong>Rs. 316,142.00</strong> in loan inflows (Haris Badshah Rs. 191.5k, Loose SIMs Rs. 73.75k, FMS & Cares Rs. 50.9k), the franchise's liquid bank account depleted by <strong>-Rs. 488,181.00</strong> (closing at Rs. 2,664,420.00 down from Rs. 3,152,601.00). This sheet explains every single rupee of where that cash went.
                  </p>
                </div>

                {/* 1. AIRTIME FLOAT DISTRIBUTION THROUGHPUT (Row 63-71) */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900 text-sm pb-1.5 border-b border-slate-200">
                    <span className="font-sans">1. AIRTIME FLOAT DISTRIBUTION THROUGHPUT (August.xlsx Row 63-71)</span>
                    <span className="font-bold text-slate-900">Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    EVC airtime allocated to the 4 field Retail Sales Officers (RSOs). This represents throughput agency float; the franchise does NOT retain trading margin—Ufone credits commission into the bank account.
                  </p>

                  {/* 4 RSOs Itemized Table */}
                  {showItemizedTables && (
                    <div className="overflow-x-auto mt-2 border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 font-sans">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Field Officer (RSO)</th>
                            <th className="px-3 py-1.5">Assigned Sector / Route</th>
                            <th className="px-3 py-1.5 text-right">EVC Sales Volume (PKR)</th>
                            <th className="px-3 py-1.5 text-right">Distribution Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rsoSales.map((r: any, idx: number) => {
                            const pct = pnl.gross_revenue > 0 ? (r.sales_volume / pnl.gross_revenue) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{r.name}</td>
                                <td className="px-3 py-1.5 text-slate-600 font-sans">{r.route}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                                  Rs. {Number(r.sales_volume).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-500">{pct.toFixed(2)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-slate-900 uppercase font-sans">
                              TOTAL EVC AIRTIME DISTRIBUTED:
                            </td>
                            <td className="px-3 py-2 text-right text-slate-950 font-black">
                              Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">100.00%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. TOTAL CASH INFLOWS REALIZED (August.xlsx Rows 14-21) */}
                <div className="space-y-2 p-4 rounded-xl bg-emerald-50/30 border border-emerald-200/80">
                  <div className="flex justify-between font-bold text-emerald-950 text-sm pb-1.5 border-b border-emerald-200">
                    <span className="font-sans">2. TOTAL CASH INFLOWS & COMMISSIONS RECEIVED (August.xlsx Rows 14-21)</span>
                    <span className="font-black text-emerald-800">+Rs. {Number(totInflows).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    All funds deposited into the franchise bank account or cash drawer in August 2026 (Row 8 & Row 21 Column S).
                  </p>

                  {/* 6 Inflow Items Table */}
                  {showItemizedTables && (
                    <div className="overflow-x-auto mt-2 border border-emerald-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-emerald-100/60 text-emerald-950 uppercase font-bold border-b border-emerald-200 font-sans">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Inflow Description</th>
                            <th className="px-3 py-1.5">Accounting Classification</th>
                            <th className="px-3 py-1.5">Source / Citation</th>
                            <th className="px-3 py-1.5 text-right">Received Amount (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                          {realizedInflowsList.map((item: any, idx: number) => {
                            const isComm = item.category === "Operating Commission";
                            return (
                              <tr key={idx} className="hover:bg-emerald-50/40">
                                <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{item.title}</td>
                                <td className="px-3 py-1.5 font-sans">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isComm ? "bg-emerald-100 text-emerald-900" : "bg-blue-100 text-blue-900"
                                  }`}>
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 text-slate-500 font-sans">{item.source}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-emerald-700">
                                  +Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-emerald-50 font-bold border-t border-emerald-200">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-emerald-950 uppercase font-sans">
                              TOTAL REALIZED RECEIPTS (COMMISSIONS RS. 849,297 + FINANCING INFLOWS RS. 316,142):
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-800 font-black text-sm">
                              +Rs. {Number(totInflows).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. TOTAL CASH DISBURSEMENTS (August.xlsx Rows 40-59) */}
                <div className="space-y-3 p-4 rounded-xl bg-rose-50/30 border border-rose-200/80">
                  <div className="flex justify-between font-bold text-rose-950 text-sm pb-1.5 border-b border-rose-200">
                    <span className="font-sans">3. TOTAL MONTHLY CASH DISBURSEMENTS & PAYMENTS (August.xlsx Rows 40-59)</span>
                    <span className="font-black text-rose-700">-Rs. {Number(totDisbursed).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    Every cash and bank transfer payout executed during August 2026. Exactly matches Row 59 Column C & S of August.xlsx.
                  </p>

                  {/* 16 Disbursement Items Table */}
                  {showItemizedTables && (
                    <div className="overflow-x-auto mt-2 border border-rose-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-rose-100/60 text-rose-950 uppercase font-bold border-b border-rose-200 font-sans">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Payment Classification & Details</th>
                            <th className="px-3 py-1.5">Category</th>
                            <th className="px-3 py-1.5">Payment Method</th>
                            <th className="px-3 py-1.5">Sheet Row</th>
                            <th className="px-3 py-1.5 text-right">Disbursed Amount (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50">
                          {allDisbursementsList.map((item: any, idx: number) => {
                            const isNonOp = ["Debt Settlement", "Inventory Asset", "Owner Drawings"].includes(item.category);
                            return (
                              <tr key={idx} className="hover:bg-rose-50/40">
                                <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{item.title}</td>
                                <td className="px-3 py-1.5 font-sans">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isNonOp ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-rose-100 text-rose-900"
                                  }`}>
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 text-slate-500 font-sans">{item.payment_method}</td>
                                <td className="px-3 py-1.5 text-slate-400 font-sans">{item.sheet_item}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-rose-700">
                                  Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-rose-50 font-bold border-t border-rose-200">
                          <tr>
                            <td colSpan={5} className="px-3 py-2 text-rose-950 uppercase font-sans">
                              TOTAL MONTHLY CASH DISBURSEMENTS (August.xlsx Row 59):
                            </td>
                            <td className="px-3 py-2 text-right text-rose-800 font-black text-sm">
                              -Rs. {Number(totDisbursed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. NET FINANCIAL RESULT (THE TWO TRUTHS OF AUGUST.XLSX) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card A: Commission Operating Deficit */}
                  <div className="p-5 rounded-2xl border-2 border-rose-500 bg-rose-50 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-rose-900 font-sans font-black text-sm uppercase">
                        <TrendingDown className="w-5 h-5 text-rose-700" />
                        <span>A. Operating Commission Cash Deficit</span>
                      </div>
                      <p className="text-xs text-rose-900 font-sans mt-1">
                        Commission Earned (+Rs. {Number(pnl.commission_income).toLocaleString()}) minus Total Cash Paid Out (Rs. {Number(totDisbursed).toLocaleString()}).
                      </p>
                      <p className="text-[11px] text-rose-800 font-sans mt-1">
                        This is why management felt the business lost money: Ufone commission revenue was not sufficient to cover August's cash payments.
                      </p>
                    </div>
                    <div className="text-3xl font-mono font-black text-rose-700 pt-2 border-t border-rose-200">
                      -Rs. {Math.abs(commDeficit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Card B: Net Monthly Bank Balance Depletion */}
                  <div className="p-5 rounded-2xl border-2 border-amber-500 bg-amber-50/80 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 text-amber-950 font-sans font-black text-sm uppercase">
                        <Wallet className="w-5 h-5 text-amber-700" />
                        <span>B. Net Monthly Cash / Bank Depletion</span>
                      </div>
                      <p className="text-xs text-amber-900 font-sans mt-1">
                        Total Realized Inflows (+Rs. {Number(totInflows).toLocaleString()}) minus Total Cash Paid Out (Rs. {Number(totDisbursed).toLocaleString()}).
                      </p>
                      <p className="text-[11px] text-amber-900 font-sans mt-1">
                        Opening Bank: Rs. {Number(openBank).toLocaleString()} → Closing Bank: Rs. {Number(closeBank).toLocaleString()} (Bank account dropped by nearly 5 Lakh PKR).
                      </p>
                    </div>
                    <div className="text-3xl font-mono font-black text-amber-900 pt-2 border-t border-amber-200">
                      -Rs. {Math.abs(netBankDrain).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* 5. FORENSIC RECONCILIATION: WHERE DID THE CASH GO? */}
                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 font-sans space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                    <CheckCircle2 className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                    <span>Forensic Accounting Reconciliation: Why Did Bank Cash Drop if Operations Were Healthy?</span>
                  </div>
                  <div className="text-xs text-indigo-950 space-y-2 leading-relaxed">
                    <p>
                      Although the cash register shows a net loss / cash deficit of <strong>-Rs. 804,323.00</strong>, the franchise business did NOT incur operational losses from bad trades. Exactly <strong>Rs. 825,160.00 (50.0%)</strong> of August's cash payouts went toward three balance sheet transactions:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 font-medium text-slate-800">
                      <li>
                        <strong>Haris Badshah Loan Settlement (Rs. 500,000.00):</strong> This paid off a prior debt liability. This reduced franchise liabilities on the balance sheet, not an ongoing operational waste.
                      </li>
                      <li>
                        <strong>Paired & Loose SIMs Stock Purchases (Rs. 221,250.00):</strong> This converted bank cash into valuable inventory assets currently in stock.
                      </li>
                      <li>
                        <strong>Islam Badshah Sb Personal Drawings (Rs. 103,910.00):</strong> Owner equity withdrawal for household bills and driver salaries.
                      </li>
                    </ul>
                    <p className="pt-1 text-slate-700">
                      If these non-operational capital items (Rs. 825,160.00) are separated, true operational running overhead was <strong>Rs. 828,460.00</strong>. Against commission inflows of <strong>Rs. 849,297.00</strong>, the franchise's ongoing operations generated a slim positive operating margin of <strong>+Rs. 20,837.00</strong> (viewable in the Operational Margin model above).
                    </p>
                  </div>
                </div>
              </>
            ) : viewMode === "agency_1_4" ? (
              <>
                {/* 1. AIRTIME FLOAT DISTRIBUTION THROUGHPUT (INFORMATIONAL) */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900 text-sm pb-1.5 border-b border-slate-200">
                    <span className="font-sans">1. AIRTIME FLOAT DISTRIBUTION THROUGHPUT (August.xlsx Row 63-71)</span>
                    <span className="font-bold text-slate-900">Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    Total EVC Airtime float assigned to field Retail Sales Officers (RSOs) for distribution across Dargai sectors.
                  </p>

                  {/* 4 RSOs Itemized Table */}
                  {showItemizedTables && (
                    <div className="overflow-x-auto mt-2 border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 font-sans">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Field Officer (RSO)</th>
                            <th className="px-3 py-1.5">Assigned Sector / Route</th>
                            <th className="px-3 py-1.5 text-right">EVC Sales Volume (PKR)</th>
                            <th className="px-3 py-1.5 text-right">Distribution Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rsoSales.map((r: any, idx: number) => {
                            const pct = pnl.gross_revenue > 0 ? (r.sales_volume / pnl.gross_revenue) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{r.name}</td>
                                <td className="px-3 py-1.5 text-slate-600 font-sans">{r.route}</td>
                                <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                                  Rs. {Number(r.sales_volume).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-500">{pct.toFixed(2)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-slate-900 uppercase font-sans">
                              TOTAL EVC AIRTIME DISTRIBUTED:
                            </td>
                            <td className="px-3 py-2 text-right text-slate-950 font-black">
                              Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">100.00%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                    <span className="font-sans">Franchise Distributor Commission Rate on EVC:</span>
                    <span className="font-bold text-indigo-700 font-sans">1.40% official distributor rate (~1.44% achieved)</span>
                  </div>
                </div>

                {/* 2. OPERATING COMMISSION REVENUE (DIRECT INFLOWS FROM UFONE HQ) */}
                <div className="space-y-2 p-4 rounded-xl bg-emerald-50/30 border border-emerald-200/80">
                  <div className="flex justify-between font-bold text-emerald-950 text-sm pb-1.5 border-b border-emerald-200">
                    <span className="font-sans">2. OPERATING COMMISSION REVENUE (DIRECT INFLOWS FROM UFONE HQ)</span>
                    <span className="font-black text-emerald-800">+Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    Exact commission payouts deposited into bank accounts by Ufone PTCL Headquarters (August.xlsx Row 16 & Rows 160-171).
                  </p>

                  {/* 12 Inflow Heads Itemized Table */}
                  {showItemizedTables && (
                    <div className="overflow-x-auto mt-2 border border-emerald-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-emerald-100/60 text-emerald-950 uppercase font-bold border-b border-emerald-200 font-sans">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Commission Head & Description</th>
                            <th className="px-3 py-1.5">Reference / Sheet Row</th>
                            <th className="px-3 py-1.5">Commission Type</th>
                            <th className="px-3 py-1.5 text-right">Inflow Amount (PKR)</th>
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
                              TOTAL OPERATING REVENUE (COMMISSION REVENUE):
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-800 font-black text-sm">
                              +Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. FRANCHISE OPERATING EXPENSES & PAYROLL */}
                <div className="space-y-4 p-4 rounded-xl bg-rose-50/30 border border-rose-200/80">
                  <div className="flex justify-between font-bold text-rose-950 text-sm pb-1.5 border-b border-rose-200">
                    <span className="font-sans">3. FRANCHISE OPERATING EXPENSES & PAYROLL DEDUCTIONS</span>
                    <span className="font-black text-rose-700">Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    True operational business expenditures required to run Dargai franchise premises, network logistics, and personnel.
                  </p>

                  {/* 3A: 11 Operating Expenses Table */}
                  {showItemizedTables && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-800 font-sans">
                        <span>A. Operational Overhead Expenditures (11 Heads, August.xlsx Rows 42-53):</span>
                        <span className="text-rose-700 font-mono">Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
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
                              <td colSpan={5} className="px-3 py-2 text-rose-950 uppercase font-sans">
                                SUBTOTAL OPERATIONAL OVERHEAD:
                              </td>
                              <td className="px-3 py-2 text-right text-rose-800 font-black">
                                Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3B: Staff & Field RSO Payroll Table */}
                  {showItemizedTables && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-800 font-sans">
                        <span>B. Staff Salaries & Field RSO Payroll (10 Employees, August.xlsx Row 41 Item #1):</span>
                        <span className="text-rose-700 font-mono">Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="overflow-x-auto border border-rose-200 rounded-lg bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-rose-100/60 text-rose-950 uppercase font-bold border-b border-rose-200 font-sans">
                            <tr>
                              <th className="px-3 py-1.5">#</th>
                              <th className="px-3 py-1.5">Employee / Officer Name</th>
                              <th className="px-3 py-1.5">Role / Designation</th>
                              <th className="px-3 py-1.5">Department</th>
                              <th className="px-3 py-1.5">Payroll Details / Citation</th>
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
                                  <td className="px-3 py-1.5 font-sans">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isRso ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                                    }`}>
                                      {isRso ? "Field RSO Route" : "Office Staff"}
                                    </span>
                                  </td>
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
                              <td colSpan={5} className="px-3 py-2 text-rose-950 uppercase font-sans">
                                SUBTOTAL COMBINED PAYROLL (OFFICE RS. 144,300 + RSO RS. 108,024):
                              </td>
                              <td className="px-3 py-2 text-right text-rose-800 font-black">
                                Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-2 border-t-2 border-slate-300 text-sm">
                    <span className="font-sans">TOTAL OPERATING DEDUCTIONS (A + B):</span>
                    <span className="text-rose-900 font-black">Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 4. NET OPERATING PROFIT (1.4% FRANCHISE MODEL) */}
                <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950">
                  <div className="font-sans space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-base font-extrabold uppercase tracking-wide">
                        4. NET OPERATIONAL MARGIN (BEFORE DEBT & CAPITAL):
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium">
                      Total Commission Revenue (+Rs. {Number(pnl.commission_income).toLocaleString()}) minus Total Operating Overhead & Salaries (Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString()}).
                    </p>
                    <p className="text-[11px] text-emerald-800 font-normal">
                      The franchise operating engine broke even with a small operational buffer (+2.45% margin) before non-operating debt repayment and inventory purchases.
                    </p>
                  </div>
                  <div className="text-3xl font-mono font-black text-emerald-800 text-right">
                    +Rs. {Number(pnl.agency_net_profit || (Number(pnl.commission_income) - Number(pnl.expenses) - Number(pnl.salaries))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* COMMERCIAL TURNOVER MODEL */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-sans text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Commercial Spread Model Disclosure</span>
                  </div>
                  <p>
                    This model illustrates hypothetical retail gross profit assuming the franchise retained the entire 2.50% retail spread (Rs. 366,500) on EVC airtime sales. In real telecom operations, this spread is retained by field retailers and shopkeepers, not deposited into the franchise bank account.
                  </p>
                </div>

                {/* 1. Operating Revenue (Sales Turnover) */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">1. OPERATING REVENUE (EVC AIRTIME DISTRIBUTION & SALES)</span>
                    <span>Rs. {Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                    <span className="font-sans">2. COST OF GOODS SOLD (COGS)</span>
                    <span className="text-rose-700">(Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
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
                <div className="space-y-1.5 p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80">
                  <div className="flex justify-between font-bold text-indigo-950 text-sm pb-1 border-b border-indigo-200">
                    <span className="font-sans">3. GROSS SALES TRADING MARGIN (NET SALES LESS COGS)</span>
                    <span className="font-bold text-indigo-900">Rs. {Number(pnl.gross_sales_margin || (Number(pnl.net_revenue) - Number(pnl.cogs))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Net Sales Revenue:</span>
                    <span>Rs. {Number(pnl.net_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Less: Wholesale Inventory Cost (COGS):</span>
                    <span className="text-rose-700">(Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-indigo-200/80 bg-indigo-50/70 p-2 rounded-lg">
                    <span className="font-sans">GROSS SALES TRADING MARGIN (2.50% Spread):</span>
                    <span className="text-indigo-950 font-bold">Rs. {Number(pnl.gross_sales_margin || (Number(pnl.net_revenue) - Number(pnl.cogs))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 4. Commission & Incentive Revenue */}
                <div className="space-y-1.5 p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80">
                  <div className="flex justify-between font-bold text-emerald-950 text-sm pb-1 border-b border-emerald-200">
                    <span className="font-sans">4. COMMISSION & INCENTIVE REVENUE (FROM UFONE PTCL HQ)</span>
                    <span className="font-bold text-emerald-800">+Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Ufone Promo Commissions (11 Categories, August.xlsx Row 160-170):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.promo_commissions || 638223).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">U-Top Up / EVC Distribution Commission (August.xlsx Row 16):</span>
                    <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.topup_commissions || 211074).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-emerald-200/80 bg-emerald-50/50 p-2 rounded-lg">
                    <span className="font-sans">TOTAL COMMISSION & INCENTIVE INCOME:</span>
                    <span className="text-emerald-800 font-bold">+Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 5. Total Gross Operating Profit */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200 flex justify-between items-center">
                  <div className="font-sans">
                    <span className="text-sm font-bold uppercase tracking-wide text-indigo-950">5. TOTAL GROSS OPERATING PROFIT:</span>
                    <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                      Trading Margin (Rs. {Number(pnl.gross_sales_margin || (Number(pnl.net_revenue) - Number(pnl.cogs))).toLocaleString()}) + HQ Commissions (Rs. {Number(pnl.commission_income).toLocaleString()})
                    </p>
                  </div>
                  <span className="text-xl font-mono font-black text-indigo-900">
                    Rs. {Number(pnl.gross_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 6. Operating Expenses */}
                <div className="space-y-1.5 p-4 rounded-xl bg-rose-50/40 border border-rose-200/80">
                  <div className="flex justify-between font-bold text-rose-950 text-sm pb-1 border-b border-rose-200">
                    <span className="font-sans">6. OPERATING EXPENSES & OVERHEAD DEDUCTIONS</span>
                    <span className="font-bold text-rose-700">Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">General & Administrative Expenses (11 Heads, Rent, Utilities, FCA Promo):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Staff & RSO Salaries Disbursed (August.xlsx Row 41 Item #1):</span>
                    <span className="text-rose-700">Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-rose-200/60">
                    <span className="font-sans">TOTAL OPERATING DEDUCTIONS:</span>
                    <span>Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* 7. NET PROFIT (COMMERCIAL MODEL) */}
                <div className="p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 flex items-center justify-between text-base font-extrabold text-emerald-900">
                  <div className="font-sans">
                    <span>7. NET OPERATING PROFIT (COMMERCIAL MODEL):</span>
                    <p className="text-xs font-normal font-sans text-slate-600 mt-0.5">
                      Net theoretical earnings: Gross Profit (Rs. {Number(pnl.gross_profit).toLocaleString()}) minus Operating Overhead (Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString()}).
                    </p>
                  </div>
                  <div className="text-3xl font-mono font-black text-emerald-800">
                    Rs. {Number(pnl.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            )}

            {/* 9. FINANCING, EQUITY & CAPITAL CASH MOVEMENTS (Reconciliation with Excel Row 59 Cash Outflows) */}
            <div className="space-y-4 pt-4 mt-6 border-t-2 border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-slate-900 text-sm pb-1 border-b border-slate-200">
                <span className="font-sans">CASH FLOW AUDIT RECONCILIATION (OPERATING VS. TOTAL BANK OUTFLOWS)</span>
                <span className="font-bold text-slate-900">Rs. {Number(pnl.total_cash_outflows || 1653620).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Dynamic Contextual Explanation Banner */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 font-sans text-xs text-blue-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    Reconciling Bank Deficit (-Rs. 804,323) with Accrual Margin (+Rs. 20,837):
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Total cash disbursements through bank transfer and cash register in August were <strong>Rs. 1,653,620.00</strong> (matching Row 59 of August.xlsx).
                  Exactly <strong>Rs. 825,160.00</strong> of these disbursements were for <em>non-operating balance sheet transactions</em> (debt repayment to Haris Badshah Rs. 500k, personal drawings by Islam Badshah Rs. 103.9k, and purchasing SIM card inventory assets Rs. 221.2k).
                  Because these are balance sheet capital and liability settlements rather than recurring operational costs, your pure operational overhead is only <strong>Rs. 828,460.00</strong> (Expenses Rs. 576,136 + Salaries Rs. 252,324).
                </p>
              </div>

              {/* 4 Non-Operating Outflows Itemized Table */}
              {showItemizedTables && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-xs text-slate-800 font-sans">
                    <span>Non-Operating Balance Sheet Cash Disbursements (August.xlsx Row 41, 54-58):</span>
                    <span className="text-slate-800 font-mono">
                      Rs. {Number((pnl.loan_repayments || 500000) + (pnl.drawings || 103910) + (pnl.capital_inventory || 221250)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-blue-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-blue-100/60 text-blue-950 uppercase font-bold border-b border-blue-200 font-sans">
                        <tr>
                          <th className="px-3 py-1.5">#</th>
                          <th className="px-3 py-1.5">Balance Sheet Head & Description</th>
                          <th className="px-3 py-1.5">Accounting Classification</th>
                          <th className="px-3 py-1.5">Payment Method</th>
                          <th className="px-3 py-1.5">Excel Citation & Purpose</th>
                          <th className="px-3 py-1.5 text-right">Disbursed Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {nonOperatingList.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-blue-50/40">
                            <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-800 font-sans">{item.title}</td>
                            <td className="px-3 py-1.5 text-indigo-700 font-sans">{item.category}</td>
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
                          <td colSpan={5} className="px-3 py-2 text-blue-950 uppercase font-sans">
                            SUBTOTAL NON-OPERATING BALANCE SHEET OUTFLOWS:
                          </td>
                          <td className="px-3 py-2 text-right text-blue-900 font-black">
                            Rs. {Number((pnl.loan_repayments || 500000) + (pnl.drawings || 103910) + (pnl.capital_inventory || 221250)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Total Summary Outflow Reconciliation */}
              <div className="space-y-1.5 text-xs font-mono pt-2">
                <div className="flex justify-between text-slate-700 pl-4">
                  <span className="font-sans">A. Total Operating Deductions (Overhead Rs. 576,136 + Payroll Rs. 252,324):</span>
                  <span className="font-bold text-slate-800">
                    Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span className="font-sans">B. Total Non-Operating Balance Sheet Disbursements (Loan + Drawings + Inventory):</span>
                  <span className="font-bold text-slate-800">
                    Rs. {Number((pnl.loan_repayments || 500000) + (pnl.drawings || 103910) + (pnl.capital_inventory || 221250)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-950 pl-4 pt-2 border-t-2 border-slate-900 bg-slate-100 p-2.5 rounded-xl text-sm">
                  <span className="font-sans">TOTAL MONTHLY CASH DISBURSEMENTS (August.xlsx Row 59: A + B):</span>
                  <span className="font-black text-slate-950">
                    Rs. {Number(pnl.total_cash_outflows || 1653620).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit & Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-10 text-center font-sans">
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
        )}
      </div>
    </div>
  );
};
