import React, { useState, useEffect } from "react";
import {
  Building2, Plus, DollarSign, Calendar, FileText, CheckCircle2,
  AlertCircle, History, ArrowRight
} from "lucide-react";
import { api } from "../../api/client";
import { CompanyCreditAccount } from "../../types";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons, printTargetContent } from "../../components/common/ExportPrintButtons";

export const CompanyCredit: React.FC = () => {
  const [accounts, setAccounts] = useState<CompanyCreditAccount[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Statement / Payment modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CompanyCreditAccount | null>(null);
  const [statementData, setStatementData] = useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Bank Transfer",
    reference: "",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, sum] = await Promise.all([
        api.getCompanyCreditAccounts(),
        api.getCompanyCreditSummary()
      ]);
      setAccounts(accs);
      setSummary(sum);
    } catch (err) {
      console.error("Company credit load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatement = async (acc: CompanyCreditAccount) => {
    setSelectedAccount(acc);
    setIsStatementOpen(true);
    try {
      const stmt = await api.getCompanyStatement(acc.id);
      setStatementData(stmt);
    } catch (err) {
      console.error("Statement fetch error:", err);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      await api.createCompanyCreditPayment({
        account_id: selectedAccount.id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        remarks: paymentForm.remarks
      });
      setIsPayOpen(false);
      setPaymentForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "Bank Transfer", reference: "", remarks: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Company Credit & Payables</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage wholesale inventory received on revolving loan lines from PTCL/Ufone with no false cash reduction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="purchases" title="Company Credit Facility & Ledger" targetId="company-credit-table" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Credit Granted"
          value={summary?.total_credit ?? 0}
          prefix="Rs. "
          variant="indigo"
          subtitle="All stock received on credit"
        />
        <MetricCard
          title="Total Settle Payments"
          value={summary?.total_paid ?? 0}
          prefix="Rs. "
          variant="green"
          subtitle="Transferred to company accounts"
        />
        <MetricCard
          title="Outstanding Payable"
          value={summary?.total_outstanding ?? 0}
          prefix="Rs. "
          variant="red"
          subtitle="Net company payable due"
        />
      </div>

      {/* Credit Accounts Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="company-credit-table">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-base font-bold font-heading text-slate-800">Company Credit Accounts</h3>
          <span className="text-xs text-slate-500">{accounts.length} active credit facility lines</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Reference Line</th>
                <th className="py-3 px-6">Company Entity</th>
                <th className="py-3 px-6">Total Credit (PKR)</th>
                <th className="py-3 px-6">Settled (PKR)</th>
                <th className="py-3 px-6">Outstanding (PKR)</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{acc.reference_number}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{acc.company_name || "Ufone Wholesale"}</td>
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                    Rs. {Number(acc.total_credit).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                    Rs. {Number(acc.amount_paid).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-rose-700">
                    Rs. {Number(acc.outstanding).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">{acc.due_date || "Revolving"}</td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={acc.status} />
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenStatement(acc)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                    >
                      Statement
                    </button>
                    {acc.outstanding > 0 && (
                      <button
                        onClick={() => {
                          setSelectedAccount(acc);
                          setPaymentForm({
                            ...paymentForm,
                            amount: acc.outstanding.toString()
                          });
                          setIsPayOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors"
                      >
                        Make Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Payment Modal */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title="Make Payment to Company"
        subtitle={`Settle credit line: ${selectedAccount?.reference_number} | Outstanding: Rs. ${selectedAccount?.outstanding.toLocaleString()}`}
        maxWidth="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (PKR) *</label>
            <input
              type="number"
              step="0.01"
              required
              max={selectedAccount?.outstanding}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="Bank Transfer">Bank Transfer (Corporate Direct)</option>
              <option value="Cash">Cash Handover</option>
              <option value="Cheque">Bank Cheque</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank Reference / Cheque #</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              placeholder="e.g. HBL-FT-992144"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-md shadow-indigo-600/30"
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </Modal>

      {/* Company Statement Modal */}
      <Modal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        title="Company Credit Statement"
        subtitle={`Entity: ${statementData?.company_name} | Ref: ${statementData?.reference_number}`}
        maxWidth="3xl"
      >
        {statementData && (
          <div className="space-y-4 text-xs" id="credit-statement-printable">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 font-mono">
              <div>
                <p className="text-slate-500 font-sans text-[10px] uppercase">Total Credit</p>
                <p className="text-base font-bold text-slate-900">Rs. {Number(statementData.total_credit).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 font-sans text-[10px] uppercase">Total Paid</p>
                <p className="text-base font-bold text-emerald-700">Rs. {Number(statementData.amount_paid).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 font-sans text-[10px] uppercase">Outstanding</p>
                <p className="text-base font-bold text-rose-700">Rs. {Number(statementData.outstanding).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Transaction History</h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Amount (PKR)</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementData.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 text-slate-500">{t.date}</td>
                        <td className="py-2 px-3 font-semibold">{t.tx_type}</td>
                        <td className="py-2 px-3 font-mono font-bold">Rs. {Number(t.amount).toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-600">{t.payment_method}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{t.reference || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 no-print">
              <button
                onClick={() => printTargetContent('credit-statement-printable', `Company Credit Statement - ${statementData?.company_name || 'Ufone'}`)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
              >
                Print Statement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
