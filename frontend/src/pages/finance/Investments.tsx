import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Search, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Phone, RefreshCw } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function Investments() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    investor_name: '',
    phone: '',
    amount: 100000,
    investment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInvestments();
      setInvestments(data);
    } catch (err: any) {
      console.error('Failed to load investments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInvested = investments.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const totalRemaining = investments.reduce((acc, i) => acc + Number(i.remaining_amount !== undefined ? i.remaining_amount : i.amount), 0);
  const totalReturned = totalInvested - totalRemaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvestment({
        ...form,
        amount: Number(form.amount),
        remaining_amount: Number(form.amount),
      });
      setShowModal(false);
      setForm({
        investor_name: '',
        phone: '',
        amount: 100000,
        investment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording investment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Portfolios</h1>
          <p className="text-sm text-slate-500 mt-1">Track external investor capital, purchase utilization, repayments, and remaining balances</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="ledger" title="Investor Portfolios" targetId="investments-table" />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total Capital Invested"
          value={`Rs. ${Number(totalInvested).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="indigo"
          subtitle="Cumulative partner capital injected"
        />
        <MetricCard
          title="Capital Repaid / Returned"
          value={`Rs. ${Number(totalReturned).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={ArrowDownRight}
          color="emerald"
          subtitle="Returned funds or profit settlements"
        />
        <MetricCard
          title="Active Remaining Balance"
          value={`Rs. ${Number(totalRemaining).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={ArrowUpRight}
          color="amber"
          subtitle="Current capital retained in operations"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Registered Investors & Holdings
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="investments-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Investor Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Total Invested</th>
                <th className="py-3 px-4 text-right">Repaid / Returned</th>
                <th className="py-3 px-4 text-right">Active Balance</th>
                <th className="py-3 px-4">Investment Date</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading investments...</td>
                </tr>
              ) : investments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No investment records registered yet.</td>
                </tr>
              ) : (
                investments.map((inv, idx) => {
                  const rem = Number(inv.remaining_amount !== undefined ? inv.remaining_amount : inv.amount);
                  const ret = Number(inv.amount || 0) - rem;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {inv.investor_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {inv.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                        Rs. {Number(inv.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                        Rs. {Number(ret).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200">
                          Rs. {Number(rem).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {inv.investment_date || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                        {inv.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Investment */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record New Investment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Investor Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Malik Muhammad Afzal"
              value={form.investor_name}
              onChange={(e) => setForm({ ...form, investor_name: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Investment Capital Amount (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              min="1000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Terms / Agreement Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 5% quarterly profit sharing agreement, capital guaranteed"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
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
    </div>
  );
}
