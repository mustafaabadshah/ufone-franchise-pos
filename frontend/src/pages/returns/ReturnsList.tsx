import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, RotateCcw, Search, DollarSign, Package, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function ReturnsList() {
  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    return_type: 'customer', // 'customer' | 'supplier' | 'investor'
    product_id: '',
    retailer_id: '',
    investment_id: '',
    quantity: 1,
    refund_amount: 0,
    reason: 'Damaged packaging / SIM defective',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [returnData, prodData, invData, retData] = await Promise.all([
        api.getReturns(),
        api.getProducts(),
        api.getInvestments().catch(() => []),
        api.getRetailers().catch(() => []),
      ]);
      setReturns(returnData);
      setProducts(prodData);
      setInvestments(invData);
      setRetailers(retData);
    } catch (err: any) {
      console.error('Failed to load returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRefundAmount = returns.reduce((acc, r) => acc + Number(r.refund_amount || 0), 0);
  const totalItemQty = returns.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        return_type: form.return_type,
        quantity: Number(form.quantity),
        refund_amount: Number(form.refund_amount),
        reason: form.reason,
        notes: form.notes,
      };
      if (form.product_id) payload.product_id = Number(form.product_id);
      if (form.retailer_id) payload.retailer_id = Number(form.retailer_id);
      if (form.investment_id) payload.investment_id = Number(form.investment_id);

      await api.createReturn(payload);
      setShowModal(false);
      setForm({
        return_type: 'customer',
        product_id: '',
        retailer_id: '',
        investment_id: '',
        quantity: 1,
        refund_amount: 0,
        reason: 'Damaged packaging / SIM defective',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Returns & Reversals</h1>
          <p className="text-sm text-slate-500 mt-1">Manage product defect returns, stock restock reversals, and investor capital payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="returns" title="Returns Log" targetId="returns-table" />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Process Return
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total Returns Value"
          value={`Rs. ${Number(totalRefundAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="rose"
          subtitle="Cumulative refunded amounts"
        />
        <MetricCard
          title="Returned Units"
          value={totalItemQty}
          icon={Package}
          color="amber"
          subtitle="Items reversed to stock / written off"
        />
        <MetricCard
          title="Total Logged Cases"
          value={returns.length}
          icon={RotateCcw}
          color="indigo"
          subtitle="Reversal and payout vouchers"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            All Processed Return Slips
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="returns-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Slip #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product / Party</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading returns...</td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No returns or reversals found.</td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-indigo-600">
                      RET-{String(r.id).padStart(5, '0')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {new Date(r.created_at || Date.now()).toLocaleDateString('en-PK')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        r.return_type === 'investor'
                          ? 'bg-purple-100 text-purple-800'
                          : r.return_type === 'supplier'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.return_type === 'investor' ? 'Investor Payout' : r.return_type === 'supplier' ? 'Supplier Reversal' : 'Customer Return'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.product && <div className="font-medium text-slate-900">{r.product.name}</div>}
                      {r.investment && <div className="font-medium text-slate-900">Investor: {r.investment.investor_name}</div>}
                      {r.retailer && <div className="text-xs text-slate-500">Retailer: {r.retailer.shop_name}</div>}
                      {!r.product && !r.investment && !r.retailer && <div className="text-slate-500">-</div>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {r.quantity || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                      Rs. {Number(r.refund_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      <div className="font-medium text-slate-800">{r.reason || 'General Return'}</div>
                      {r.notes && <div className="text-slate-400 truncate">{r.notes}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Return */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Return / Payout Voucher">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Return Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'customer', label: 'Customer / POS' },
                { id: 'supplier', label: 'Supplier Return' },
                { id: 'investor', label: 'Investor Return' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setForm({ ...form, return_type: t.id })}
                  className={`py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    form.return_type === t.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.return_type !== 'investor' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Item <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.product_id}
                  onChange={(e) => {
                    const sel = products.find((p) => p.id === Number(e.target.value));
                    setForm({
                      ...form,
                      product_id: e.target.value,
                      refund_amount: sel ? Number(sel.sale_price || 0) * Number(form.quantity || 1) : form.refund_amount,
                    });
                  }}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku || 'N/A'}) - Price: Rs. {p.sale_price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Returned Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const sel = products.find((p) => p.id === Number(form.product_id));
                      setForm({
                        ...form,
                        quantity: qty,
                        refund_amount: sel ? Number(sel.sale_price || 0) * qty : form.refund_amount,
                      });
                    }}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Total Refund Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.refund_amount}
                    onChange={(e) => setForm({ ...form, refund_amount: Number(e.target.value) })}
                    className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Investor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.investment_id}
                onChange={(e) => setForm({ ...form, investment_id: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Choose Investor --</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investor_name} - Balance Remaining: Rs. {inv.remaining_amount || inv.amount}
                  </option>
                ))}
              </select>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payout Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.refund_amount || ''}
                  onChange={(e) => setForm({ ...form, refund_amount: Number(e.target.value) })}
                  className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Return / Payout
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scratched scratch card barcode / Defective biometric SIM"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or reference ticket number"
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Process Return
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
