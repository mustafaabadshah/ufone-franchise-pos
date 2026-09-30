import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Search, Smartphone, Send, ArrowRightLeft, TrendingUp, RefreshCw, CheckCircle2 } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function EasyLoadList() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [rsos, setRsos] = useState<any[]>([]);
  const [searchMsisdn, setSearchMsisdn] = useState('');
  const [summary, setSummary] = useState({ total_volume: 0, total_commission: 0, count: 0 });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    transaction_type: 'retailer_transfer', // 'retailer_transfer' | 'direct_load'
    msisdn: '',
    amount: 1000,
    retailer_id: '',
    rso_id: '',
    commission_rate: 2.5, // 2.5% standard Ufone franchise commission
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [txData, summaryData, retData, rsoData] = await Promise.all([
        api.getEasyloadTransactions({ msisdn: searchMsisdn || undefined }),
        api.getEasyloadSummary().catch(() => ({})),
        api.getRetailers(),
        api.getRsos(),
      ]);
      setTransactions(txData);
      setRetailers(retData);
      setRsos(rsoData);

      const totalVol = txData.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
      const totalComm = txData.reduce((acc: number, t: any) => acc + Number(t.commission_amount || 0), 0);
      setSummary({
        total_volume: totalVol,
        total_commission: totalComm,
        count: txData.length,
      });
    } catch (err: any) {
      console.error('Failed to load easyload data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchMsisdn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        transaction_type: form.transaction_type,
        msisdn: form.msisdn,
        amount: Number(form.amount),
        commission_rate: Number(form.commission_rate),
        commission_amount: (Number(form.amount) * Number(form.commission_rate)) / 100,
        notes: form.notes,
      };
      if (form.retailer_id) payload.retailer_id = Number(form.retailer_id);
      if (form.rso_id) payload.rso_id = Number(form.rso_id);

      await api.createEasyloadTransaction(payload);
      setShowModal(false);
      setForm({
        transaction_type: 'retailer_transfer',
        msisdn: '',
        amount: 1000,
        retailer_id: '',
        rso_id: '',
        commission_rate: 2.5,
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing EasyLoad transaction');
    }
  };

  const calculatedCommission = (Number(form.amount || 0) * Number(form.commission_rate || 0)) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EasyLoad & Balance Management</h1>
          <p className="text-sm text-slate-500 mt-1">Ufone franchise e-load transfers to retailers, direct subscriber top-ups & commissions</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="easyload" title="EasyLoad Transactions" targetId="easyload-table" />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New EasyLoad Transfer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total EasyLoad Volume"
          value={`Rs. ${Number(summary.total_volume).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={Smartphone}
          color="indigo"
          subtitle="Gross balance dispensed"
        />
        <MetricCard
          title="Earned Commission"
          value={`Rs. ${Number(summary.total_commission).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="emerald"
          subtitle="Net franchise commission margin"
        />
        <MetricCard
          title="Transactions Executed"
          value={summary.count}
          icon={ArrowRightLeft}
          color="amber"
          subtitle="Retailer transfers & topups"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by MSISDN / Mobile Number..."
              value={searchMsisdn}
              onChange={(e) => setSearchMsisdn(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="easyload-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Target MSISDN / Retailer</th>
                <th className="py-3 px-4">Assigned RSO</th>
                <th className="py-3 px-4 text-right">Transfer Amount</th>
                <th className="py-3 px-4 text-right">Commission</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading EasyLoad records...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No EasyLoad transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-indigo-600">
                      ELD-{String(tx.id).padStart(6, '0')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {new Date(tx.created_at || Date.now()).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.transaction_type === 'retailer_transfer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tx.transaction_type === 'retailer_transfer' ? 'Retailer Load' : 'Direct Subscriber'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900 font-medium">{tx.msisdn}</div>
                      {tx.retailer && (
                        <div className="text-xs text-slate-500">{tx.retailer.shop_name || tx.retailer.name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {tx.rso?.name || 'Counter / Shop POS'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      Rs. {Number(tx.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                      Rs. {Number(tx.commission_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Dispatched
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process EasyLoad */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Dispatch EasyLoad Balance">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Dispatch Destination Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, transaction_type: 'retailer_transfer' })}
                className={`py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  form.transaction_type === 'retailer_transfer'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Retailer Transfer (B2B)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, transaction_type: 'direct_load' })}
                className={`py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  form.transaction_type === 'direct_load'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Direct Subscriber (B2C)
              </button>
            </div>
          </div>

          {form.transaction_type === 'retailer_transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Retailer Shop <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.retailer_id}
                onChange={(e) => {
                  const sel = retailers.find((r) => r.id === Number(e.target.value));
                  setForm({
                    ...form,
                    retailer_id: e.target.value,
                    msisdn: sel?.phone || form.msisdn,
                  });
                }}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Choose Retailer --</option>
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.shop_name || r.name} - ({r.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              MSISDN / Mobile Number (03XXXXXXXXX) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="03331234567"
              value={form.msisdn}
              onChange={(e) => setForm({ ...form, msisdn: e.target.value })}
              className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                EasyLoad Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="50"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
                className="w-full text-base font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500">Franchise Margin Earned:</span>
              <div className="font-bold text-emerald-600 font-mono text-sm">
                + Rs. {calculatedCommission.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Net Debit to Main Pool:</span>
              <div className="font-bold text-slate-800 font-mono text-sm">
                Rs. {Number(form.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Dispatching RSO / Officer
            </label>
            <select
              value={form.rso_id}
              onChange={(e) => setForm({ ...form, rso_id: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Counter Direct (No RSO)</option>
              {rsos.map((rso) => (
                <option key={rso.id} value={rso.id}>
                  {rso.name} ({rso.route || 'General'})
                </option>
              ))}
            </select>
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Authorize & Send EasyLoad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
