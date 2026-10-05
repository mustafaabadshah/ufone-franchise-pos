import React, { useState } from "react";
import { Coins, CheckCircle2, AlertTriangle, Calculator, RefreshCw } from "lucide-react";
import { api } from "../../api/client";

export const CashManagement: React.FC = () => {
  const [expectedCash, setExpectedCash] = useState("25000");
  const [denominations, setDenominations] = useState<Record<number, number>>({
    5000: 3,
    1000: 8,
    500: 4,
    100: 0,
    50: 0,
    20: 0,
    10: 0
  });

  const physicalCashTotal = Object.entries(denominations).reduce((acc, [denom, qty]) => {
    return acc + Number(denom) * Number(qty);
  }, 0);

  const expNum = Number(expectedCash) || 0;
  const cashDiff = physicalCashTotal - expNum;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Physical Cash & Denominations</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          End-of-day drawer count reconciliation comparing physical cash envelope against expected register totals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Register Cash</p>
          <div className="mt-2 flex items-center gap-1 font-mono">
            <span className="text-xs text-slate-400">Rs.</span>
            <input
              type="number"
              value={expectedCash}
              onChange={(e) => setExpectedCash(e.target.value)}
              className="text-2xl font-bold text-slate-900 w-full border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-600 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated from day's net transactions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Counted Cash</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-2">
            Rs. {physicalCashTotal.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Sum of counted banknotes below</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${
          cashDiff === 0
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : cashDiff > 0
            ? "bg-indigo-50 border-indigo-200 text-indigo-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <p className="text-xs font-bold uppercase tracking-wider">Reconciliation Status</p>
          <p className="text-2xl font-bold font-mono mt-2">
            {cashDiff === 0 ? "Matched (0)" : cashDiff > 0 ? `+Rs. ${cashDiff}` : `Rs. ${cashDiff}`}
          </p>
          <p className="text-[11px] font-medium mt-1">
            {cashDiff === 0 ? "Drawer physically in balance" : cashDiff > 0 ? "Cash Excess / Surplus" : "Cash Shortage Detected"}
          </p>
        </div>
      </div>

      {/* Denomination Counter Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-800">Banknote Quantities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[5000, 1000, 500, 100, 50, 20, 10].map(val => (
            <div key={val} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1 sm:gap-2">
              <span className="font-bold text-slate-800 font-mono text-xs sm:text-sm w-16 sm:w-24">Rs. {val}</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-slate-400">&times;</span>
                <input
                  type="number"
                  min="0"
                  value={denominations[val]}
                  onChange={(e) => setDenominations({ ...denominations, [val]: Number(e.target.value) || 0 })}
                  className="w-16 sm:w-20 px-2 py-1.5 text-center font-mono font-bold rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <span className="font-mono font-bold text-slate-900 text-right text-xs sm:text-sm min-w-[70px] sm:w-28">
                = Rs. {(val * (denominations[val] || 0)).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
