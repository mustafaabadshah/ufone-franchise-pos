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
  const loan = Number(metrics?.company_credit_outstanding || 0) + Number(metrics?.purchase_due || 0);
  const investment = Number(metrics?.investment || 0);
  const stockVal = Number(metrics?.stock_product_amount || 0);
  const easyload = Number(metrics?.easyload_balance || 0);
  const cash = Number(metrics?.cash_in_hand || 0);
  const expenses = Number(metrics?.total_expenses || 0) + Number(metrics?.total_salaries || 0);

  // Business Formula:
  // Net Profit = Gross Profit + Commission Income - Total Expenses - Total Salaries
  const netProfit = Number(metrics?.net_profit || 0);
  const isLoss = metrics?.is_net_loss || netProfit < 0;

  // Capital Equity Standing:
  // (Stock + Easyload + Cash + Retailer Receivables) - (Loan + Investment)
  const retailerDues = Number(metrics?.retailer_receivable || 0);
  const totalAssets = stockVal + easyload + cash + retailerDues;
  const totalLiabilities = loan + investment;
  const capitalBalance = totalAssets - totalLiabilities;

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
              Shop Financial Summary & Net Profit / Loss
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Standard business calculation: Revenue − COGS − Overhead Expenses + Commission
            </p>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Business State:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              !isLoss
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {!isLoss ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Net Profit
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Net Loss
              </>
            )}
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
                  Loan / Credit
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-purple-500" />
                  Investment
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                  Stock Value
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  EasyLoad
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blue-500" />
                  Cash in Hand
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Other Expenses
                </div>
              </th>
              {/* Requested Added Column for Net Profit / Loss */}
              <th className="py-3 px-5 bg-indigo-50/80 border-l border-r border-indigo-200 text-indigo-900 font-extrabold text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {!isLoss ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
                  Net Profit / Loss
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr className="hover:bg-slate-50/70 transition-colors">
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {loan.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {investment.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono font-semibold text-slate-900">
                Rs. {stockVal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {easyload.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-slate-700">
                Rs. {cash.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 font-mono text-rose-600">
                Rs. {expenses.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </td>
              {/* Highlighted Net Profit / Loss Column */}
              <td
                className={`py-4 px-5 font-mono font-extrabold text-base text-right border-l border-r ${
                  !isLoss
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50/60 border-rose-200 text-rose-700'
                }`}
              >
                {!isLoss
                  ? `+ Rs. ${netProfit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                  : `- Rs. ${Math.abs(netProfit).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    !isLoss
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {!isLoss ? 'Profit' : 'Loss'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formula Summary Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Business Formula Applied:</span>
          <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800 text-[11px]">
            Gross Sales Profit ({Number(metrics?.gross_profit || 0).toLocaleString()}) − Expenses ({Number(metrics?.total_expenses || 0).toLocaleString()}) − Salaries ({Number(metrics?.total_salaries || 0).toLocaleString()}) + Commission ({Number(metrics?.commission_income || 0).toLocaleString()})
          </code>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('pnl')}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline shrink-0 text-xs"
          >
            View Detailed P&amp;L Statement &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default FranchiseFinancialEquationCard;
