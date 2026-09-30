import React, { useState, useEffect } from "react";
import {
  Boxes, Search, Filter, AlertTriangle, ArrowUpDown, History,
  TrendingDown, Plus, RefreshCw, CheckCircle2
} from "lucide-react";
import { api } from "../../api/client";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

export const StockOverview: React.FC = () => {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"overview" | "movements">("overview");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Adjustment Form
  const [adjustData, setAdjustData] = useState({
    product_id: "",
    adjustment_type: "Adjustment",
    quantity: "",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, items, movs] = await Promise.all([
        api.getStockSummary(),
        api.getStockItems({ search, status_filter: statusFilter }),
        api.getStockMovements()
      ]);
      setSummary(sum);
      setStockItems(items);
      setMovements(movs);
    } catch (err) {
      console.error("Stock data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStockAdjustment({
        product_id: Number(adjustData.product_id),
        adjustment_type: adjustData.adjustment_type,
        quantity: Number(adjustData.quantity),
        remarks: adjustData.remarks
      });
      setIsAdjustOpen(false);
      setAdjustData({ product_id: "", adjustment_type: "Adjustment", quantity: "", remarks: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to adjust stock");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Stock Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track available quantity, low-stock items, out-of-stock products and valuation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="stock" title="Stock Overview & Valuation" targetId="stock-table" />
          <button
            onClick={() => setIsAdjustOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards (Matching Reference App: PRODUCTS, TOTAL UNITS, LOW STOCK, OUT OF STOCK) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Products"
          value={summary?.products ?? 0}
          variant="indigo"
          subtitle="Active SKUs in inventory"
        />
        <MetricCard
          title="Total Units"
          value={summary?.total_units ?? 0}
          variant="green"
          subtitle="Available physical quantity"
        />
        <MetricCard
          title="Low Stock"
          value={summary?.low_stock ?? 0}
          variant="amber"
          subtitle="At or below alert quantity"
        />
        <MetricCard
          title="Out of Stock"
          value={summary?.out_of_stock ?? 0}
          variant="red"
          subtitle="Zero balance items"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Stock Level & Valuation
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "movements"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log / Movements</span>
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-4">
          {/* Search & Filter (Matching Reference App) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Product name or SKU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="w-48">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="All">All</option>
                <option value="In stock">In stock</option>
                <option value="Low stock">Low stock</option>
                <option value="Out of stock">Out of stock</option>
              </select>
            </div>

            <div className="self-end">
              <button
                onClick={loadData}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Table (Matching Reference Stock Table) */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="stock-table">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">S.No</th>
                    <th className="py-3 px-6">Product</th>
                    <th className="py-3 px-6">SKU</th>
                    <th className="py-3 px-6">Stock</th>
                    <th className="py-3 px-6">Alert At</th>
                    <th className="py-3 px-6">Valuation (PKR)</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {stockItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No inventory matches found.
                      </td>
                    </tr>
                  ) : (
                    stockItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{item.product_name}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">{item.sku}</td>
                        <td className="py-3.5 px-6 font-bold font-mono">
                          <span className={item.stock <= item.alert_at ? "text-rose-600" : "text-emerald-700"}>
                            {Number(item.stock).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-mono">{Number(item.alert_at).toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-slate-800 font-mono font-bold">
                          Rs. {Number(item.valuation).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Movements Audit Table */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-800">Complete Stock Movement Trail</h3>
            <span className="text-xs text-slate-500">{movements.length} logged events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500">{new Date(m.date).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{m.product_name}</td>
                    <td className="py-2.5 px-4 font-semibold">{m.movement_type}</td>
                    <td className={`py-2.5 px-4 font-mono font-bold ${m.quantity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold">{m.balance_after}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{m.reference || "-"}</td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">{m.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Stock Adjustment"
        subtitle="Record manual corrections, damages, losses or physical stock reconciliation"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              required
              value={adjustData.product_id}
              onChange={(e) => setAdjustData({ ...adjustData, product_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Choose Product</option>
              {stockItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} (Current: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
            <select
              value={adjustData.adjustment_type}
              onChange={(e) => setAdjustData({ ...adjustData, adjustment_type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="Adjustment">Adjustment (Standard)</option>
              <option value="Damage">Damage (Stock Reduction)</option>
              <option value="Loss">Loss / Expired</option>
              <option value="Correction">Correction / Audit Count</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantity Adjustment *</label>
            <input
              type="number"
              step="1"
              required
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
              placeholder="e.g. +10 or -5"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">Enter positive number to add, or negative to deduct.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Reason *</label>
            <textarea
              required
              value={adjustData.remarks}
              onChange={(e) => setAdjustData({ ...adjustData, remarks: e.target.value })}
              placeholder="Physical count reconciliation or damage inspection notes..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
