import React, { useState, useEffect } from "react";
import { BookOpen, Search, Filter, History, Calendar, CheckCircle2 } from "lucide-react";
import { api } from "../../api/client";
import { MetricCard } from "../../components/common/MetricCard";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

export const Ledger: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refType, setRefType] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        api.getLedgerAccounts(),
        api.getLedgerTransactions({ reference_type: refType !== "All" ? refType : undefined })
      ]);
      setAccounts(accs);
      setTransactions(txs);
    } catch (err) {
      console.error("Ledger load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refType]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">General Ledger & Chart of Accounts</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Single source of truth: verified double-entry transactions (Debit = Credit) powering franchise financial reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="ledger" title="General Ledger & Transactions Audit" targetId="ledger-printable-area" />
        </div>
      </div>

      {/* Accounts Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {accounts.map(acc => (
          <div key={acc.id} className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 font-bold">{acc.code}</span>
            <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{acc.name}</p>
            <p className="text-[10px] text-slate-500">{acc.account_type}</p>
            <p className="text-sm font-extrabold font-mono text-indigo-700 mt-2">
              Rs. {Number(acc.balance).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Transactions Journal */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="ledger-printable-area">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-800">Double-Entry Transaction Journal</h3>
            <p className="text-xs text-slate-500 font-medium">Automatic debit & credit entries recorded on all operations</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={refType}
              onChange={(e) => setRefType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
            >
              <option value="All">All Transactions</option>
              <option value="Sale">Sales</option>
              <option value="Purchase">Purchases</option>
              <option value="Expense">Expenses</option>
              <option value="Salary">Salaries</option>
              <option value="Return">Returns</option>
              <option value="CompanyCredit">Company Credit</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {tx.tx_code}
                  </span>
                  <span className="font-semibold text-slate-800">{tx.description}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                    {tx.reference_type}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(tx.date).toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white">
                <table className="w-full min-w-[500px] text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-1.5 px-3">Account</th>
                      <th className="py-1.5 px-3">Memo</th>
                      <th className="py-1.5 px-3 text-right">Debit (PKR)</th>
                      <th className="py-1.5 px-3 text-right">Credit (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono">
                    {tx.entries.map((e: any) => (
                      <tr key={e.id}>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">
                          {e.account_code} - {e.account_name}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 font-sans">{e.memo}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">
                          {e.entry_type === "Debit" ? Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="py-1.5 px-3 text-right text-blue-700 font-bold">
                          {e.entry_type === "Credit" ? Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
