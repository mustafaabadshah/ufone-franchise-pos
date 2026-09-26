import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Search, DollarSign, Calendar, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function RetailerCollections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [summary, setSummary] = useState({ total_collections: 0, total_amount: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getRetailerCollections({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        collection_type: paymentMethod || undefined,
      });
      setCollections(data);

      const total = data.reduce((acc: number, c: any) => acc + Number(c.amount_collected || 0), 0);
      setSummary({
        total_collections: data.length,
        total_amount: total,
      });
    } catch (err: any) {
      console.error('Failed to load retailer collections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, paymentMethod]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retailer Collections History</h1>
          <p className="text-sm text-slate-500 mt-1">Audit log of all recovered credit payments and deposits from partner shops</p>
        </div>
        <ExportPrintButtons title="Retailer Collections Log" targetId="collections-table" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MetricCard
          title="Total Recovered Amount"
          value={`Rs. ${Number(summary.total_amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Cleared balance deposited into cash/bank"
        />
        <MetricCard
          title="Collection Receipts"
          value={summary.total_collections}
          icon={CheckCircle2}
          color="indigo"
          subtitle="Total verified collection transactions"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Method:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <button
            onClick={loadData}
            className="ml-auto flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="collections-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Retailer Shop</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount Collected</th>
                <th className="py-3 px-4">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading collection receipts...</td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No collections found for selected range.</td>
                </tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-indigo-600">
                      REC-{String(c.id).padStart(5, '0')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {new Date(c.collection_date || c.created_at).toLocaleDateString('en-PK')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.retailer?.shop_name || c.retailer?.name || `Retailer #${c.retailer_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {c.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                      Rs. {Number(c.amount_collected || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                      {c.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
