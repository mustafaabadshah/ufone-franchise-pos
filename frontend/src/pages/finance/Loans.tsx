import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Plus, Search, Landmark, ArrowDownRight, ArrowUpRight,
  Phone, RefreshCw, CheckCircle2, Clock, AlertCircle, FileText,
  DollarSign, Calendar, ShieldCheck
} from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function Loans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loanReturns, setLoanReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loans' | 'returns'>('loans');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  // New Loan Form
  const [loanForm, setLoanForm] = useState({
    lender_name: '',
    phone: '',
    loan_type: 'Working Capital Loan',
    amount: '',
    loan_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_method: 'Cash',
    remarks: ''
  });

  // Loan Return Form
  const [returnForm, setReturnForm] = useState({
    loan_id: 0,
    amount_returned: '',
    return_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference: '',
    remarks: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, returnsData] = await Promise.all([
        api.getLoans(),
        api.getLoanReturns()
      ]);
      setLoans(loansData || []);
      setLoanReturns(returnsData || []);
    } catch (err: any) {
      console.error('Failed to load loans data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLoansTaken = loans.reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const totalLoansReturned = loans.reduce((acc, l) => acc + Number(l.total_returned || 0), 0);
  const totalRemainingBalance = loans.reduce((acc, l) => acc + Number(l.remaining_balance || 0), 0);
  const activeLoansCount = loans.filter(l => Number(l.remaining_balance || 0) > 0).length;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(loanForm.amount);
      if (amt <= 0) {
        alert('Please enter a valid loan amount');
        return;
      }
      await api.createLoan({
        ...loanForm,
        amount: amt,
        due_date: loanForm.due_date || undefined
      });
      setShowAddLoanModal(false);
      setLoanForm({
        lender_name: '',
        phone: '',
        loan_type: 'Working Capital Loan',
        amount: '',
        loan_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_method: 'Cash',
        remarks: ''
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording loan');
    }
  };

  const handleOpenReturnModal = (loan?: any) => {
    if (loan) {
      setSelectedLoan(loan);
      setReturnForm({
        loan_id: loan.id,
        amount_returned: String(loan.remaining_balance || ''),
        return_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        reference: `RET-LOAN-${Date.now().toString().slice(-6)}`,
        remarks: `Repayment to ${loan.lender_name}`
      });
    } else if (loans.length > 0) {
      const firstActive = loans.find(l => Number(l.remaining_balance || 0) > 0) || loans[0];
      setSelectedLoan(firstActive);
      setReturnForm({
        loan_id: firstActive.id,
        amount_returned: String(firstActive.remaining_balance || ''),
        return_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        reference: `RET-LOAN-${Date.now().toString().slice(-6)}`,
        remarks: `Repayment to ${firstActive.lender_name}`
      });
    }
    setShowReturnModal(true);
  };

  const handleRecordReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(returnForm.amount_returned);
      if (amt <= 0) {
        alert('Please enter a valid return amount');
        return;
      }
      if (!returnForm.loan_id) {
        alert('Please select a loan');
        return;
      }
      await api.recordLoanReturn(returnForm.loan_id, {
        amount_returned: amt,
        return_date: returnForm.return_date,
        payment_method: returnForm.payment_method,
        reference: returnForm.reference,
        remarks: returnForm.remarks
      });
      setShowReturnModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording return of loan');
    }
  };

  const filteredLoans = loans.filter(l =>
    (l.lender_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.loan_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.phone || '').includes(searchTerm)
  );

  const filteredReturns = loanReturns.filter(r =>
    (r.lender_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Loans & Working Capital Borrowings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Zero Double Entry Protected
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track external third-party borrowings, schedule repayments, and review historical returns of loans.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportPrintButtons reportType="ledger" title="Loans & Repayments Ledger" targetId="loans-printable-table" />
          <button
            onClick={() => handleOpenReturnModal()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            Record Return of Loan
          </button>
          <button
            onClick={() => setShowAddLoanModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Loans Taken</p>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading font-mono">
            Rs. {Number(totalLoansTaken).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Cumulative principal borrowings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return of Loans Made</p>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-heading font-mono">
            Rs. {Number(totalLoansReturned).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Principal repaid to lenders</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Loan Balance</p>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-heading font-mono">
            Rs. {Number(totalRemainingBalance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Current active loan liability</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Borrowing Accounts</p>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading font-mono">
            {activeLoansCount} / {loans.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending settlement lenders</p>
        </div>
      </div>

      {/* Info Notice: Zero Double Entry Assurance */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950">
          <span className="font-bold">Zero Double Entry Guarantee:</span> Recording a loan or returning a loan creates balance sheet entries (Debit/Credit to Cash &amp; Loans Payable 2030). These transactions do <span className="font-bold underline">not</span> pollute operating expenses or inflate your cost structure, ensuring your franchise profit &amp; loss statement remains 100% accurate.
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'loans'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active &amp; Settled Loans ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'returns'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Return of Loan History ({loanReturns.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lender, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Loans List Table */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="loans-printable-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Lender Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Loan Type</th>
                  <th className="py-3 px-4 text-right">Amount Taken</th>
                  <th className="py-3 px-4 text-right">Total Returned</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4">Loan Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">Loading loan records...</td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">No loan records found.</td>
                  </tr>
                ) : (
                  filteredLoans.map((loan, idx) => {
                    const rem = Number(loan.remaining_balance || 0);
                    const isSettled = rem <= 0;
                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {loan.lender_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                          {loan.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {loan.loan_type || 'Working Capital Loan'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                          Rs. {Number(loan.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                          Rs. {Number(loan.total_returned || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            Rs. {rem.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {loan.loan_date || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : Number(loan.total_returned || 0) > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isSettled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {loan.status || (isSettled ? 'Settled' : 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!isSettled ? (
                            <button
                              onClick={() => handleOpenReturnModal(loan)}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Record Return
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Fully Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Return of Loan History */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Lender / Account</th>
                  <th className="py-3 px-4 text-right">Amount Returned</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">Loading repayment history...</td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">No return of loan transactions recorded yet.</td>
                  </tr>
                ) : (
                  filteredReturns.map((ret, idx) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 font-medium">
                        {ret.return_date || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ret.lender_name || `Loan #${ret.loan_id}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        Rs. {Number(ret.amount_returned || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {ret.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700">
                        {ret.reference || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {ret.remarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add New Loan */}
      <Modal isOpen={showAddLoanModal} onClose={() => setShowAddLoanModal(false)} title="Record New Loan / Borrowing">
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Lender / Creditor Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Israr Kiran or Bank Al Habib"
              value={loanForm.lender_name}
              onChange={(e) => setLoanForm({ ...loanForm, lender_name: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="03001234567"
                value={loanForm.phone}
                onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Loan Type
              </label>
              <select
                value={loanForm.loan_type}
                onChange={(e) => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Working Capital Loan">Working Capital Loan</option>
                <option value="Short-Term Emergency Loan">Short-Term Emergency Loan</option>
                <option value="Trade Credit Advance">Trade Credit Advance</option>
                <option value="Director / Partner Loan">Director / Partner Loan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Principal Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="100"
                placeholder="e.g. 500000"
                value={loanForm.amount}
                onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method Received In
              </label>
              <select
                value={loanForm.payment_method}
                onChange={(e) => setLoanForm({ ...loanForm, payment_method: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Cash">Cash (Account 1010)</option>
                <option value="Bank Transfer">Bank Transfer (Account 1020)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Loan Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={loanForm.loan_date}
                onChange={(e) => setLoanForm({ ...loanForm, loan_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expected Due Date (Optional)
              </label>
              <input
                type="date"
                value={loanForm.due_date}
                onChange={(e) => setLoanForm({ ...loanForm, due_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Agreement / Terms Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 0% markup working capital loan, to be returned within 60 days"
              value={loanForm.remarks}
              onChange={(e) => setLoanForm({ ...loanForm, remarks: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddLoanModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Record Loan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Return of Loan */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Record Return of Loan (Repayment)">
        <form onSubmit={handleRecordReturn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Loan / Lender <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={returnForm.loan_id}
              onChange={(e) => {
                const id = Number(e.target.value);
                const l = loans.find(item => item.id === id);
                setSelectedLoan(l);
                setReturnForm({
                  ...returnForm,
                  loan_id: id,
                  amount_returned: l ? String(l.remaining_balance || '') : ''
                });
              }}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {loans.map(l => (
                <option key={l.id} value={l.id}>
                  {l.lender_name} — Remaining: Rs. {Number(l.remaining_balance || 0).toLocaleString()} (Original: Rs. {Number(l.amount || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {selectedLoan && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Lender:</span>
                <span className="font-bold text-slate-900">{selectedLoan.lender_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Borrowed:</span>
                <span className="font-mono font-medium text-slate-900">Rs. {Number(selectedLoan.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Returned:</span>
                <span className="font-mono font-medium text-emerald-600">Rs. {Number(selectedLoan.total_returned || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-amber-800">Remaining Balance:</span>
                <span className="font-mono text-amber-800">Rs. {Number(selectedLoan.remaining_balance || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Repayment Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="1"
                max={selectedLoan ? Number(selectedLoan.remaining_balance || 0) : undefined}
                placeholder="e.g. 50000"
                value={returnForm.amount_returned}
                onChange={(e) => setReturnForm({ ...returnForm, amount_returned: e.target.value })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Disbursement Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={returnForm.payment_method}
                onChange={(e) => setReturnForm({ ...returnForm, payment_method: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Cash">Cash (Account 1010)</option>
                <option value="Bank Transfer">Bank Transfer (Account 1020)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Return Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={returnForm.return_date}
                onChange={(e) => setReturnForm({ ...returnForm, return_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transaction / Receipt Reference
              </label>
              <input
                type="text"
                value={returnForm.reference}
                onChange={(e) => setReturnForm({ ...returnForm, reference: e.target.value })}
                className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Debt settlement payment row 57 August.xlsx"
              value={returnForm.remarks}
              onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Confirm Return of Loan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
