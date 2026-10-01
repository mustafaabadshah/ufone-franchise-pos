import React, { useState, useEffect } from "react";
import {
  Package, Plus, Search, Filter, Eye, Edit2, Trash2,
  TrendingUp, History, AlertTriangle, ArrowUpDown, X
} from "lucide-react";
import { api } from "../../api/client";
import { Product, Category } from "../../types";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";
import { useAuth } from "../../context/AuthContext";

export const ProductsList: React.FC = () => {
  const { canEditProducts } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<any>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category_id: "",
    brand: "Ufone",
    unit: "Piece",
    purchase_price: "",
    selling_price: "",
    retailer_price: "",
    rso_price: "",
    company_price: "",
    alert_quantity: "10",
    current_stock: "0",
    commission: "0",
    discount: "0",
    tax_percent: "0",
    description: "",
  });

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({ search, category_id: selectedCategory !== "All" ? Number(selectedCategory) : undefined }),
        api.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory]);

  const handleOpenDetail = async (prod: Product) => {
    setSelectedProduct(prod);
    setIsDetailOpen(true);
    try {
      const [analysis, history] = await Promise.all([
        api.getProductAnalysis(prod.id),
        api.getProductStockHistory(prod.id)
      ]);
      setProductAnalysis(analysis);
      setStockHistory(history);
    } catch (err) {
      console.error("Failed to fetch product analysis:", err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
        purchase_price: Number(formData.purchase_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        retailer_price: Number(formData.retailer_price) || 0,
        rso_price: Number(formData.rso_price) || 0,
        company_price: Number(formData.company_price) || 0,
        alert_quantity: Number(formData.alert_quantity) || 10,
        current_stock: Number(formData.current_stock) || 0,
        commission: Number(formData.commission) || 0,
        discount: Number(formData.discount) || 0,
        tax_percent: Number(formData.tax_percent) || 0,
      });
      setIsCreateOpen(false);
      setFormData({
        name: "", sku: "", barcode: "", category_id: "", brand: "Ufone", unit: "Piece",
        purchase_price: "", selling_price: "", retailer_price: "", rso_price: "",
        company_price: "", alert_quantity: "10", current_stock: "0", commission: "0",
        discount: "0", tax_percent: "0", description: ""
      });
      loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to create product");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Products & Categories</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage distribution SIMs, cards, hardware devices and electronic load rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="stock" title="Product Catalog & Stock" targetId="products-table" />
          {canEditProducts ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
              <span>Catalog Managed by Shahid Khan</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name, SKU or Barcode..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id.toString()}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table (Mirroring Reference App) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="products-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">S.No</th>
                <th className="py-3 px-6">Product</th>
                <th className="py-3 px-6">SKU</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Cost (PKR)</th>
                <th className="py-3 px-6">Sale Price (PKR)</th>
                <th className="py-3 px-6">Stock</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No products found. Click "Add Product" to create one.
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">{p.sku}</td>
                    <td className="py-3.5 px-6 text-slate-600">{p.category_name || "General"}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-700 font-semibold">{Number(p.avg_cost || p.purchase_price).toFixed(2)}</td>
                    <td className="py-3.5 px-6 font-mono text-indigo-700 font-bold">{Number(p.selling_price).toFixed(2)}</td>
                    <td className="py-3.5 px-6 font-mono font-bold">
                      <span className={p.current_stock <= p.alert_quantity ? "text-rose-600" : "text-emerald-700"}>
                        {Number(p.current_stock).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={p.current_stock <= 0 ? "Out of stock" : (p.current_stock <= p.alert_quantity ? "Low stock" : "In stock")} />
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        View
                      </button>
                      {canEditProducts && (
                        <>
                          <button
                            onClick={() => handleOpenDetail(p)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Product"
        subtitle="Configure pricing tiers and initial inventory"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Paired SIM 115"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. PS000115"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Optional scanner barcode"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (Customer) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retailer Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.retailer_price}
                onChange={(e) => setFormData({ ...formData, retailer_price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">RSO Route Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.rso_price}
                onChange={(e) => setFormData({ ...formData, rso_price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
              <input
                type="number"
                step="0.01"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alert Quantity Threshold</label>
              <input
                type="number"
                step="0.01"
                value={formData.alert_quantity}
                onChange={(e) => setFormData({ ...formData, alert_quantity: e.target.value })}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Create Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Detail Analysis Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedProduct?.name || "Product Analysis"}
        subtitle={`SKU: ${selectedProduct?.sku} | Current Stock: ${selectedProduct?.current_stock}`}
        maxWidth="3xl"
      >
        {productAnalysis && (
          <div className="space-y-6 text-xs">
            {/* Analysis Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Current Stock</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{productAnalysis.current_stock}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <p className="text-[11px] font-bold text-blue-700 uppercase">Total Revenue</p>
                <p className="text-xl font-extrabold mt-1 font-mono">Rs. {productAnalysis.total_revenue.toLocaleString()}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                <p className="text-[11px] font-bold text-purple-700 uppercase">Total COGS (Cost)</p>
                <p className="text-xl font-extrabold mt-1 font-mono">Rs. {productAnalysis.total_cost.toLocaleString()}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <p className="text-[11px] font-bold text-emerald-700 uppercase">Total Profit</p>
                <p className="text-xl font-extrabold mt-1 font-mono">Rs. {productAnalysis.total_profit.toLocaleString()}</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-500">Total Units Purchased:</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{productAnalysis.total_purchased_qty}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Units Sold:</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{productAnalysis.total_sold_qty}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Units Returned:</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{productAnalysis.total_returned_qty}</p>
              </div>
              <div>
                <p className="text-slate-500">Commission Earned:</p>
                <p className="font-bold text-emerald-700 font-mono mt-0.5">Rs. {productAnalysis.total_commission}</p>
              </div>
            </div>

            {/* Stock Movement Audit */}
            <div>
              <h4 className="font-bold font-heading text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Recent Stock Movements</span>
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Balance After</th>
                      <th className="py-2 px-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockHistory.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-slate-400">No stock movements recorded yet.</td></tr>
                    ) : (
                      stockHistory.slice(0, 5).map((h) => (
                        <tr key={h.id}>
                          <td className="py-2 px-3 text-slate-500">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 font-semibold">{h.movement_type}</td>
                          <td className={`py-2 px-3 font-mono font-bold ${h.quantity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold">{h.balance_after}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{h.reference || "N/A"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
