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

  const handlePeriodQuickSelect = (p: string) => {
    setPeriod(p);
    const today = new Date();
    if (p === "today") {
      const dStr = today.toISOString().split("T")[0];
      setDateFrom(dStr);
      setDateTo(dStr);
    } else if (p === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (p === "this_year") {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (p === "all") {
      setDateFrom("");
      setDateTo("");
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

      {/* Period Selector (no-print) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          {["today", "this_month", "this_year", "all"].map(p => (
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
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
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
            {/* 1. Operating Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                <span className="font-sans">1. OPERATING REVENUE</span>
                <span>(PKR)</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span className="font-sans">Gross Sales Revenue:</span>
                <span>{Number(pnl.gross_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span className="font-sans">Less: Sales Discounts:</span>
                <span className="text-rose-600">({Number(pnl.sales_discounts).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span className="font-sans">Less: Sales Returns:</span>
                <span className="text-rose-600">({Number(pnl.sales_returns).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                <span className="font-sans">NET SALES REVENUE:</span>
                <span>Rs. {Number(pnl.net_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 2. Cost of Goods Sold */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                <span className="font-sans">2. COST OF GOODS SOLD (COGS)</span>
                <span>(PKR)</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span className="font-sans">Weighted Average Cost of Sold Inventory:</span>
                <span className="text-slate-800">Rs. {Number(pnl.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span className="font-sans">Commission / Incentive Income:</span>
                <span className="text-emerald-700 font-bold">+Rs. {Number(pnl.commission_income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-indigo-900 pl-4 pt-1.5 border-t border-slate-300 bg-indigo-50/50 p-2 rounded-lg">
                <span className="font-sans">GROSS PROFIT:</span>
                <span>Rs. {Number(pnl.gross_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                <span className="font-sans">3. OPERATING EXPENSES & OVERHEAD</span>
                <span>(PKR)</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span className="font-sans">General & Administrative Expenses (Rent, Utilities, Transport):</span>
                <span className="text-rose-700">Rs. {Number(pnl.expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-4">
                <span className="font-sans">Staff Salaries & Payroll Disbursed:</span>
                <span className="text-rose-700">Rs. {Number(pnl.salaries).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1 border-t border-slate-200/60">
                <span className="font-sans">TOTAL OPERATING DEDUCTIONS:</span>
                <span>Rs. {(Number(pnl.expenses) + Number(pnl.salaries)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 4. NET PROFIT OR NET LOSS (Instruction 11 & 28: Never hide negative values!) */}
            <div className={`mt-6 p-4 rounded-xl border-2 flex items-center justify-between text-base font-extrabold ${
              pnl.is_loss
                ? "bg-rose-50 border-rose-400 text-rose-800"
                : "bg-emerald-50 border-emerald-400 text-emerald-800"
            }`}>
              <div className="font-sans">
                <span>{pnl.is_loss ? "NET OPERATING LOSS" : "NET OPERATING PROFIT"}:</span>
                <p className="text-xs font-normal font-sans text-slate-600 mt-0.5">
                  {pnl.is_loss
                    ? "Operating expenses exceed gross profit. Negative earnings shown explicitly."
                    : "Net operating bottom-line earnings after weighted inventory cost (COGS), staff/RSO payroll, and operational overhead."}
                </p>
              </div>
              <div className="text-xl font-mono">
                {pnl.is_loss ? (
                  <span>-Rs. {Number(pnl.loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                ) : (
                  <span>Rs. {Number(pnl.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                )}
              </div>
            </div>

            {/* 5. FINANCING, EQUITY & CAPITAL CASH MOVEMENTS (Reconciliation with Excel Row 59 Cash Outflows) */}
            {(pnl.loan_repayments > 0 || pnl.drawings > 0 || pnl.capital_inventory > 0) && (
              <div className="space-y-1.5 pt-4 mt-6 border-t border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-slate-800 text-sm pb-1 border-b border-slate-200">
                  <span className="font-sans">5. FINANCING & CAPITAL CASH MOVEMENTS (NON-OPERATING)</span>
                  <span>(PKR)</span>
                </div>
                {pnl.loan_repayments > 0 && (
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Loan Principal Repayment (Haris Badshah Settlement):</span>
                    <span className="text-slate-700">Rs. {Number(pnl.loan_repayments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {pnl.drawings > 0 && (
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Owner Personal Drawings (Islam Badshah Sb Household, IESCO/SNGPL, Driver):</span>
                    <span className="text-slate-700">Rs. {Number(pnl.drawings).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {pnl.capital_inventory > 0 && (
                  <div className="flex justify-between text-slate-600 pl-4">
                    <span className="font-sans">Merchandise Stock Inflow (Paired & Loose SIM Orders Ufone HQ):</span>
                    <span className="text-slate-700">Rs. {Number(pnl.capital_inventory).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pl-4 pt-1.5 border-t border-slate-300 bg-slate-50 p-2 rounded-lg">
                  <span className="font-sans">TOTAL CASH OUTFLOWS (Operating + Financing + Equity):</span>
                  <span>Rs. {Number(pnl.total_cash_outflows || (Number(pnl.expenses) + Number(pnl.salaries) + Number(pnl.loan_repayments || 0) + Number(pnl.drawings || 0) + Number(pnl.capital_inventory || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {/* Audit & Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-10 text-center font-sans">
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">Rashid Qureshi</p>
                <p className="text-[10px] text-slate-500 uppercase">Prepared by Finance Officer</p>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">Shahid Khan</p>
                <p className="text-[10px] text-slate-500 uppercase">Approved by Franchise Owner</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
