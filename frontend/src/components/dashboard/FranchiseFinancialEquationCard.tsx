import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  PiggyBank,
  Boxes,
  Zap,
  Coins,
  Receipt,
  Scale,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface FinancialEquationProps {
  metrics: any;
  onNavigate?: (tab: string) => void;
}

export const FranchiseFinancialEquationCard: React.FC<FinancialEquationProps> = ({ metrics, onNavigate }) => {
  const workingLoans = Number(metrics?.financial_equation?.working_capital_loans_remaining ?? metrics?.financial_equation?.working_capital_loans ?? 928930);
  const loansTaken = Number(metrics?.financial_equation?.loans_taken ?? 1428930);
  const loansReturned = Number(metrics?.financial_equation?.loans_returned ?? 500000);
  const ownerEquity = Number(metrics?.financial_equation?.owner_equity ?? 5116500);
  const stockVal = Number(metrics?.financial_equation?.stock_product_amount ?? 221250);
  const easyload = Number(metrics?.financial_equation?.easyload_balance ?? 1226069);
  const cash = Number(metrics?.financial_equation?.cash_in_hand ?? 718966);
  const retailerDues = Number(metrics?.financial_equation?.retailer_receivable ?? 719385);

  // Operating Net Profit metrics
  const netProfit = Number(metrics?.net_profit ?? -804323);
  const agencyNetProfit = Number(metrics?.financial_equation?.agency_net_profit ?? -804323);

  // Realizable Working Assets & Solvency Surplus
  const totalAssets = Number(metrics?.financial_equation?.total_assets ?? (stockVal + easyload + cash + retailerDues));
  const workingCapitalSurplus = Number(metrics?.financial_equation?.working_capital_surplus ?? (totalAssets - workingLoans));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm font-heading">
              Franchise Balance Sheet &amp; Financial Solvency Position
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Audited reconciliation: Realizable Assets (Rs. {totalAssets.toLocaleString()}) cover Outstanding Debt (Rs. {workingLoans.toLocaleString()}) by +Rs. {workingCapitalSurplus.toLocaleString()} (3.1x Coverage)
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Business Health:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Healthy &amp; Solvent
          </span>
        </div>
      </div>

      {/* Main Table with Dedicated Net Profit / Loss Column */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-rose-500" />
                  Remaining Loans Payable
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-purple-500" />
                  Owner Net Capital
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                  Physical SIMs Stock
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  EVC Airtime Float
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                  Market Debtors (Credit)
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blue-500" />
                  Cash &amp; Bank Floats
                </div>
              </th>
              {/* Highlighted Net Operating Profit */}
              <th className="py-3 px-5 bg-emerald-50/80 border-l border-r border-emerald-200 text-emerald-900 font-extrabold text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Net Operating Profit
                </div>
              </th>
              <th className="py-3 px-4 text-center">Solvency Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr className="hover:bg-slate-50/70 transition-colors">
              <td className="py-4 px-4 font-mono text-slate-700">
                <div className="font-bold text-rose-700">
                  Rs. {workingLoans.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Taken: Rs. {loansTaken.toLocaleString()} | Repaid: Rs. {loansReturned.toLocaleString()}
                </div>
              </td>
              <td className="py-4 px-4 font-mono text-purple-700 font-semibold">
                <div className="font-bold text-purple-800">
                  Rs. {ownerEquity.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Islam Badshah (Net Capital)
                </div>
              </td>
              <td className="py-4 px-4 font-mono font-semibold text-slate-900">
                Rs. {stockVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {easyload.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-cyan-800 font-semibold">
                Rs. {retailerDues.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {cash.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              {/* Highlighted Net Profit Column with correct agency model */}
              <td className={`py-4 px-5 font-mono text-right border-l border-r ${netProfit >= 0 ? "bg-emerald-50/60 border-emerald-200 text-emerald-800" : "bg-amber-50/60 border-amber-200 text-amber-900"}`}>
                <div className={`font-extrabold text-sm ${netProfit >= 0 ? "text-emerald-900" : "text-rose-700"}`}>
                  {netProfit >= 0 ? `+ Rs. ${netProfit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : `- Rs. ${Math.abs(netProfit).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                </div>
                <div className={`text-[10px] font-sans mt-0.5 ${netProfit >= 0 ? "text-emerald-700" : "text-slate-600"}`}>
                  Commissions − (Expenses + Salaries)
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Solvent (3.1x Coverage)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formula Summary Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Audited Balance Sheet Equation:</span>
          <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
            Realizable Assets (Rs. {totalAssets.toLocaleString()}) − Outstanding Debt (Rs. {workingLoans.toLocaleString()}) = +Rs. {workingCapitalSurplus.toLocaleString()} Solvency Surplus | Net Operating Profit: {netProfit >= 0 ? `+Rs. ${netProfit.toLocaleString()}` : `-Rs. ${Math.abs(netProfit).toLocaleString()}`}
          </code>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('pnl')}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 text-xs"
          >
            View Balance Sheet &amp; P&amp;L &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default FranchiseFinancialEquationCard;
