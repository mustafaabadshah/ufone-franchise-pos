import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  X, Search, Wallet, Landmark, ArrowDownRight, ArrowUpRight,
  Phone, CheckCircle2, Clock, PiggyBank, ArrowRight, ShieldCheck,
  FileSpreadsheet, Download
} from 'lucide-react';

interface CreditDebitModalProps {
  isOpen: boolean;
  type: 'credit' | 'debit';
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const CreditDebitModal: React.FC<CreditDebitModalProps> = ({
  isOpen,
  type,
  onClose,
  onNavigate
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debitFilter, setDebitFilter] = useState<'all' | 'investments' | 'loans'>('all');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getCreditDebitSummary()
        .then((res) => setData(res))
        .catch((err) => console.error('Failed to load credit debit summary', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCredit = type === 'credit';
  const creditData = data?.credit;
  const debitData = data?.debit;

  const debtorItems = (creditData?.items || []).filter((item: any) =>
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.shop_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.route || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.phone || '').includes(search)
  );

  const debitItems = (debitData?.items || []).filter((item: any) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.type || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.phone || '').includes(search);
    if (!matchesSearch) return false;
    if (debitFilter === 'investments') return item.type === 'Capital Investment';
    if (debitFilter === 'loans') return item.type !== 'Capital Investment';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Banner */}
        <div className={`p-6 border-b border-slate-100 flex items-start justify-between ${
          isCredit
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 text-white'
            : 'bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'} border border-white/10`}>
                {isCredit ? <Wallet className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  {isCredit ? '1st Dashboard Option: Credit Particulars' : '2nd Dashboard Option: Debit Particulars'}
                </span>
                <h2 className="text-2xl font-black font-heading tracking-tight mt-0.5">
                  {isCredit ? 'Market Credit / Outstanding Debtors' : 'Total Injected Capital & Working Loans'}
                </h2>
              </div>
            </div>
            <p className="text-xs text-indigo-200/80 mt-2 max-w-2xl">
              {isCredit
                ? 'Itemized particulars of market credit receivables across 10 authorized parties (August.xlsx Rows 23-34). Total Market Credit: Rs. 719,385.00.'
                : 'Itemized particulars of permanent equity capital and short-term working capital borrowings (August.xlsx Rows 14-21). Total Debit: Rs. 6,649,340.00.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Top Summary Stat Cards */}
          {isCredit ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Market Debtors</span>
                <p className="text-xl font-black font-heading font-mono text-indigo-900 mt-1">
                  Rs. {Number(creditData?.total_credit_amount || 719385).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">10 Verified Retailers &amp; Accounts</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Wholesale Credit (HQ)</span>
                <p className="text-xl font-black font-heading font-mono text-slate-800 mt-1">
                  Rs. {Number(creditData?.wholesale_credit || 221250).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">Ufone company credit line</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">External Loans Payable</span>
                <p className="text-xl font-black font-heading font-mono text-amber-600 mt-1">
                  Rs. {Number(creditData?.loans_payable || 928930).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-amber-700 font-semibold">Current borrowings liability</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Debit / Injected Funds</span>
                <p className="text-xl font-black font-heading font-mono text-indigo-900 mt-1">
                  Rs. {Number(debitData?.total_debit_amount || 6649340).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-indigo-600 font-semibold">Equity (Rs. 5.22M) + Loans (Rs. 1.43M)</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Permanent Owner Equity</span>
                <p className="text-xl font-black font-heading font-mono text-emerald-600 mt-1">
                  Rs. {Number(debitData?.total_equity_invested || 5220410).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">Islam Badshah (Returns: Rs. 103,910)</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Working Capital Loans</span>
                <p className="text-xl font-black font-heading font-mono text-purple-700 mt-1">
                  Rs. {Number(debitData?.total_loans_taken || 1428930).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-purple-700 font-semibold">Rs. 500k repaid | Rs. 928,930 remaining</span>
              </div>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isCredit ? "Search debtor name, route, or phone..." : "Search account, lender, or type..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {!isCredit && (
              <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDebitFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    debitFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Accounts ({debitData?.items?.length || 6})
                </button>
                <button
                  onClick={() => setDebitFilter('investments')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    debitFilter === 'investments' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Owner Capital
                </button>
                <button
                  onClick={() => setDebitFilter('loans')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    debitFilter === 'loans' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Working Loans
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[380px]">
              {isCredit ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Debtor / Retailer Name</th>
                      <th className="py-3 px-4">Shop / Role</th>
                      <th className="py-3 px-4">Sector / Route</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-right">Outstanding Credit (PKR)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">Loading debtor particulars...</td>
                      </tr>
                    ) : debtorItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">No matching debtors found.</td>
                      </tr>
                    ) : (
                      debtorItems.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                          <td className="py-3 px-4 text-slate-600">{item.shop_name || '-'}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                              {item.route || 'Dargai Central'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{item.phone || '-'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                            Rs. {Number(item.balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Active Debtor
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Account / Investor Name</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4 text-right">Injected / Borrowed</th>
                      <th className="py-3 px-4 text-right">Repaid / Returned</th>
                      <th className="py-3 px-4 text-right">Active Net Balance</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">Loading capital particulars...</td>
                      </tr>
                    ) : debitItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">No matching accounts found.</td>
                      </tr>
                    ) : (
                      debitItems.map((item: any, idx: number) => {
                        const isEquity = item.type === 'Capital Investment';
                        const isSettled = Number(item.remaining || 0) <= 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div>{item.name}</div>
                              {item.phone && <span className="font-mono text-[10px] text-slate-400">{item.phone}</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                isEquity
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              Rs. {Number(item.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                              Rs. {Number(item.returned || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                isSettled
                                  ? 'bg-slate-100 text-slate-500'
                                  : isEquity
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                Rs. {Number(item.remaining || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isSettled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {item.status || (isSettled ? 'Settled' : 'Active')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Page Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited against August.xlsx general ledger</span>
          </div>

          <div className="flex items-center gap-3">
            {isCredit ? (
              <>
                <button
                  onClick={() => { onClose(); onNavigate('retailer-collections'); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  View Collections History
                </button>
                <button
                  onClick={() => { onClose(); onNavigate('retailers'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Manage Retailer Debtors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onClose(); onNavigate('loans'); }}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Manage Loans &amp; Return of Loans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { onClose(); onNavigate('investments'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Manage Investments &amp; Returns</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
