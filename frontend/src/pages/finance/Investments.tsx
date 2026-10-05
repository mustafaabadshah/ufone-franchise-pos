import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Plus, Search, Wallet, ArrowDownRight, ArrowUpRight,
  Phone, RefreshCw, CheckCircle2, Clock, ShieldCheck,
  Coins, PiggyBank, History, FileText
} from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function Investments() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentReturns, setInvestmentReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolios' | 'returns'>('portfolios');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  // New Investment Form
  const [form, setForm] = useState({
    name: '',
    phone: '',
    amount_given: '',
    investment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    remarks: ''
  });

  // Return of Investment Form
  const [returnForm, setReturnForm] = useState({
    investment_id: 0,
    amount: '',
    return_date: new Date().toISOString().split('T')[0],
    return_type: 'Profit Distribution',
    payment_method: 'Cash',
    reference: '',
    remarks: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, retData] = await Promise.all([
        api.getInvestments(),
        api.getInvestmentReturns()
      ]);
      setInvestments(invData || []);
      setInvestmentReturns(retData || []);
    } catch (err: any) {
      console.error('Failed to load investments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInvested = investments.reduce((acc, i) => acc + Number(i.amount_given || 0), 0);
  const totalReturned = investments.reduce((acc, i) => acc + Number(i.returns || 0), 0);
  const totalRemaining = investments.reduce((acc, i) => acc + Number(i.remaining || 0), 0);

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(form.amount_given);
      if (amt <= 0) {
        alert('Please enter a valid investment amount');
        return;
      }
      await api.createInvestment({
        name: form.name,
        phone: form.phone,
        amount_given: amt,
        investment_date: form.investment_date,
        payment_method: form.payment_method,
        remarks: form.remarks
      });
      setShowAddModal(false);
      setForm({
        name: '',
        phone: '',
        amount_given: '',
        investment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        remarks: ''
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording investment');
    }
  };

  const handleOpenReturnModal = (inv?: any) => {
    if (inv) {
      setSelectedInvestment(inv);
      setReturnForm({
        investment_id: inv.id,
        amount: '',
        return_date: new Date().toISOString().split('T')[0],
        return_type: 'Profit Distribution',
        payment_method: 'Cash',
        reference: `RET-INV-${Date.now().toString().slice(-6)}`,
        remarks: `Return to ${inv.name}`
      });
    } else if (investments.length > 0) {
      setSelectedInvestment(investments[0]);
      setReturnForm({
        investment_id: investments[0].id,
        amount: '',
        return_date: new Date().toISOString().split('T')[0],
        return_type: 'Profit Distribution',
        payment_method: 'Cash',
        reference: `RET-INV-${Date.now().toString().slice(-6)}`,
        remarks: `Return to ${investments[0].name}`
      });
    }
    setShowReturnModal(true);
  };

  const handleRecordReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amt = Number(returnForm.amount);
      if (amt <= 0) {
        alert('Please enter a valid return amount');
        return;
      }
      if (!returnForm.investment_id) {
        alert('Please select an investor portfolio');
        return;
      }
      await api.recordInvestmentReturn(returnForm.investment_id, {
        amount: amt,
        return_date: returnForm.return_date,
        return_type: returnForm.return_type,
        payment_method: returnForm.payment_method,
        reference: returnForm.reference,
        remarks: returnForm.remarks
      });
      setShowReturnModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording return of investment');
    }
  };

  const filteredInvestments = investments.filter(i =>
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.phone || '').includes(searchTerm) ||
    (i.remarks || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReturns = investmentReturns.filter(r =>
    (r.return_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Investment Portfolios &amp; Returns</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Equity &amp; Capital Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track permanent equity capital, return of investment disbursements, and remaining active balances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportPrintButtons reportType="ledger" title="Investments and Returns Ledger" targetId="investments-printable-table" />
          <button
            onClick={() => handleOpenReturnModal()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            Record Return of Investment
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Capital Invested</p>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading font-mono">
            Rs. {Number(totalInvested).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Permanent partner &amp; owner capital</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return of Investment Disbursed</p>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-heading font-mono">
            Rs. {Number(totalReturned).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Profit shares &amp; capital returns</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Active Capital Retained</p>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2 font-heading font-mono">
            Rs. {Number(totalRemaining).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-amber-800 mt-1 font-medium">Remaining balance in business</p>
        </div>
      </div>

      {/* Zero Double Entry Info Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <span className="font-bold">Zero Double Entry Guarantee:</span> Return of investment payments are recorded directly against Owner Capital / Equity Account (3010) and Cash/Bank. They do <span className="font-bold underline">not</span> register as operational expenses in your daily profit &amp; loss statement, avoiding double counting and artificial profit reductions.
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('portfolios')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'portfolios'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Investor Portfolios ({investments.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'returns'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Return of Investment History ({investmentReturns.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search investor, phone..."
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

      {/* Tab 1: Investor Portfolios Table */}
      {activeTab === 'portfolios' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="investments-printable-table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Investor Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Capital Invested</th>
                  <th className="py-3 px-4 text-right">Returns Disbursed</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4">Investment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">Loading investment records...</td>
                  </tr>
                ) : filteredInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">No investment records found.</td>
                  </tr>
                ) : (
                  filteredInvestments.map((inv, idx) => {
                    const rem = Number(inv.remaining || 0);
                    const isSettled = rem <= 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {inv.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                          {inv.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                          Rs. {Number(inv.amount_given || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                          Rs. {Number(inv.returns || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
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
                          {inv.investment_date || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {isSettled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {inv.status || (isSettled ? 'Settled' : 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenReturnModal(inv)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Record Return
                          </button>
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

      {/* Tab 2: Return of Investment History Table */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4 text-right">Amount Returned</th>
                  <th className="py-3 px-4">Return Head / Type</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">Loading returns history...</td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">No return of investment disbursements recorded yet.</td>
                  </tr>
                ) : (
                  filteredReturns.map((ret, idx) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 font-medium">
                        {ret.return_date || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        Rs. {Number(ret.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {ret.return_type || 'Profit Distribution'}
                        </span>
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

      {/* Modal: Record New Investment */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record New Investment">
        <form onSubmit={handleCreateInvestment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Investor Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Islam Badshah"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Investment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.investment_date}
                onChange={(e) => setForm({ ...form, investment_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Capital Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="1000"
                placeholder="e.g. 5000000"
                value={form.amount_given}
                onChange={(e) => setForm({ ...form, amount_given: e.target.value })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method Received In
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Cash">Cash (Account 1010)</option>
                <option value="Bank Transfer">Bank Transfer (Account 1020)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Terms / Notes Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Owner equity injection into franchise operations"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Save Investment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Return of Investment */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Record Return of Investment (Equity / Dividend)">
        <form onSubmit={handleRecordReturn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Investor Portfolio <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={returnForm.investment_id}
              onChange={(e) => {
                const id = Number(e.target.value);
                const inv = investments.find(item => item.id === id);
                setSelectedInvestment(inv);
                setReturnForm({ ...returnForm, investment_id: id });
              }}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {investments.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} — Remaining: Rs. {Number(inv.remaining || 0).toLocaleString()} (Original: Rs. {Number(inv.amount_given || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {selectedInvestment && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Investor:</span>
                <span className="font-bold text-slate-900">{selectedInvestment.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invested:</span>
                <span className="font-mono font-medium text-slate-900">Rs. {Number(selectedInvestment.amount_given || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Returned:</span>
                <span className="font-mono font-medium text-emerald-600">Rs. {Number(selectedInvestment.returns || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-indigo-900">Remaining Balance:</span>
                <span className="font-mono text-indigo-700">Rs. {Number(selectedInvestment.remaining || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Disbursement Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="e.g. 103910"
                value={returnForm.amount}
                onChange={(e) => setReturnForm({ ...returnForm, amount: e.target.value })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Return Head / Classification
              </label>
              <select
                value={returnForm.return_type}
                onChange={(e) => setReturnForm({ ...returnForm, return_type: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Profit Distribution">Profit Distribution / Dividend</option>
                <option value="Capital Withdrawal">Capital Withdrawal / Reduction</option>
                <option value="Personal Drawing">Personal Drawing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method Disbursed From <span className="text-rose-500">*</span>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference / Cheque Number
            </label>
            <input
              type="text"
              value={returnForm.reference}
              onChange={(e) => setReturnForm({ ...returnForm, reference: e.target.value })}
              className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Return of investment dividend disbursement"
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
              Confirm Return of Investment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
