import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Award, TrendingUp, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function Commissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    commission_type: 'SIM Activation', // 'SIM Activation' | 'EasyLoad' | 'Postpaid Billing' | 'MNP' | 'Handset Sales'
    target_amount: 100000,
    achieved_amount: 115000,
    commission_rate: 3.5,
    commission_amount: 4025,
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    status: 'Pending', // 'Pending' | 'Approved' | 'Disbursed'
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getCommissions(typeFilter || undefined);
      setCommissions(data);
    } catch (err: any) {
      console.error('Failed to load commissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const totalEarned = commissions.reduce((acc, c) => acc + Number(c.commission_amount || 0), 0);
  const totalApproved = commissions
    .filter((c) => c.status === 'Approved' || c.status === 'Disbursed')
    .reduce((acc, c) => acc + Number(c.commission_amount || 0), 0);
  const totalPending = totalEarned - totalApproved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCommission({
        ...form,
        target_amount: Number(form.target_amount),
        achieved_amount: Number(form.achieved_amount),
        commission_rate: Number(form.commission_rate),
        commission_amount: (Number(form.achieved_amount) * Number(form.commission_rate)) / 100,
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording commission');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Commissions & Incentives</h1>
          <p className="text-sm text-slate-500 mt-1">Ufone telco commission targets, MNP bonuses, SIM activation incentives, and payout tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons title="Commissions & Incentives" targetId="commissions-table" />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Claim Commission
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total Commission Earned"
          value={`Rs. ${Number(totalEarned).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={Award}
          color="indigo"
          subtitle="All telecom incentives booked"
        />
        <MetricCard
          title="Settled & Disbursed"
          value={`Rs. ${Number(totalApproved).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle}
          color="emerald"
          subtitle="Received into bank / ledger"
        />
        <MetricCard
          title="Pending From Telco"
          value={`Rs. ${Number(totalPending).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={Clock}
          color="amber"
          subtitle="Under verification / audit"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Stream:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700"
            >
              <option value="">All Revenue Streams</option>
              <option value="SIM Activation">SIM Activation</option>
              <option value="EasyLoad">EasyLoad</option>
              <option value="Postpaid Billing">Postpaid Billing</option>
              <option value="MNP">MNP</option>
              <option value="Handset Sales">Handset Sales</option>
            </select>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="commissions-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Revenue Stream</th>
                <th className="py-3 px-4 text-right">Target Volume</th>
                <th className="py-3 px-4 text-right">Achieved Volume</th>
                <th className="py-3 px-4 text-center">Rate</th>
                <th className="py-3 px-4 text-right">Commission Earned</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading commissions...</td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No commissions recorded.</td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-indigo-700">
                      {c.period || '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.commission_type}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      Rs. {Number(c.target_amount || 0).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      Rs. {Number(c.achieved_amount || 0).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {c.commission_rate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                      Rs. {Number(c.commission_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'Disbursed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'Approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {c.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Claim / Add Commission */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Commission Claim / Target">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Stream / Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.commission_type}
                onChange={(e) => setForm({ ...form, commission_type: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="SIM Activation">SIM Activation</option>
                <option value="EasyLoad">EasyLoad</option>
                <option value="Postpaid Billing">Postpaid Billing</option>
                <option value="MNP">MNP</option>
                <option value="Handset Sales">Handset Sales</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Month / Period (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                required
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Volume (PKR)
              </label>
              <input
                type="number"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Achieved Volume (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={form.achieved_amount}
                onChange={(e) => setForm({ ...form, achieved_amount: Number(e.target.value) })}
                className="w-full text-sm font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Commission Rate (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Claim Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved by ZBM</option>
                <option value="Disbursed">Disbursed / Paid</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex justify-between items-center text-xs">
            <span className="text-slate-500">Calculated Commission:</span>
            <div className="font-bold text-emerald-600 font-mono text-sm">
              Rs. {((Number(form.achieved_amount || 0) * Number(form.commission_rate || 0)) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks / Telco Reference #
            </label>
            <input
              type="text"
              placeholder="e.g. Approved under Q3 Ufone Franchise Incentive Scheme"
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
              Save Commission Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
