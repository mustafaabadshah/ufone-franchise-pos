import React, { useState, useEffect } from "react";
import {
  ShoppingCart, Plus, Search, Calendar, Building2,
  DollarSign, CheckCircle2, AlertCircle, Eye, X
} from "lucide-react";
import { api } from "../../api/client";
import { Purchase, Product, Investment } from "../../types";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons, printTargetContent } from "../../components/common/ExportPrintButtons";
import { useAuth } from "../../context/AuthContext";

export const PurchasesList: React.FC = () => {
  const { user, canEditPurchases } = useAuth();
  const isViewer = user?.role?.toLowerCase() === "viewer";
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Add Purchase Form State (mirroring reference app fields + items array)
  const [formData, setFormData] = useState({
    invoice_number: "",
    company_name: "Pakistan Telecommunication Company Limited (Ufone 4G Wholesale)",
    purchase_date: new Date().toISOString().split("T")[0],
    product_id: "",
    quantity: "100",
    purchase_price: "90",
    sale_price: "100",
    amount_paid: "9000",
    payment_method: "Cash", // Cash, Bank Transfer, Company Credit
    investment_id: "",
    due_date: "",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [purs, sum, prods, invs] = await Promise.all([
        api.getPurchases({ search, date_from: dateFrom, date_to: dateTo, payment_status: paymentStatus }),
        api.getPurchasesSummary({ date_from: dateFrom, date_to: dateTo }),
        api.getProducts(),
        api.getInvestments()
      ]);
      setPurchases(purs);
      setSummary(sum);
      setProducts(prods);
      setInvestments(invs);
    } catch (err) {
      console.error("Purchases load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (monthKey: string) => {
    setSelectedMonth(monthKey);
    let from = "";
    let to = "";
    if (monthKey === "2026-08") {
      from = "2026-08-01";
      to = "2026-08-31";
    } else if (monthKey === "2026-09") {
      from = "2026-09-01";
      to = "2026-09-30";
    } else if (monthKey === "2026-10") {
      from = "2026-10-01";
      to = "2026-10-31";
    } else if (monthKey === "2026-07") {
      from = "2026-07-01";
      to = "2026-07-31";
    }
    setDateFrom(from);
    setDateTo(to);
  };

  useEffect(() => {
    loadData();
  }, [search, paymentStatus, dateFrom, dateTo]);

  // Real-time calculated total and due amount
  const qtyNum = Number(formData.quantity) || 0;
  const priceNum = Number(formData.purchase_price) || 0;
  const calculatedTotal = qtyNum * priceNum;
  const paidNum = Number(formData.amount_paid) || 0;
  const calculatedDue = Math.max(0, calculatedTotal - paidNum);

  const handleProductSelect = (prodId: string) => {
    const prod = products.find(p => p.id.toString() === prodId);
    setFormData(prev => ({
      ...prev,
      product_id: prodId,
      purchase_price: prod ? prod.purchase_price.toString() : prev.purchase_price,
      sale_price: prod ? prod.selling_price.toString() : prev.sale_price
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      alert("Please select a product");
      return;
    }

    try {
      await api.createPurchase({
        invoice_number: formData.invoice_number || undefined,
        company_name: formData.company_name,
        purchase_date: formData.purchase_date,
        paid_amount: paidNum,
        payment_method: formData.payment_method,
        investment_id: formData.investment_id ? Number(formData.investment_id) : undefined,
        due_date: formData.due_date || undefined,
        remarks: formData.remarks,
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: qtyNum,
            purchase_price: priceNum,
            sale_price: Number(formData.sale_price) || 0,
            discount: 0
          }
        ]
      });
      setIsCreateOpen(false);
      setFormData({
        invoice_number: "",
        company_name: "Pakistan Telecommunication Company Limited (Ufone 4G Wholesale)",
        purchase_date: new Date().toISOString().split("T")[0],
        product_id: "",
        quantity: "100",
        purchase_price: "90",
        sale_price: "100",
        amount_paid: "9000",
        payment_method: "Cash",
        investment_id: "",
        due_date: "",
        remarks: ""
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create purchase");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Purchase Invoices</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Record supplier bills, cash purchases, and revolving company credit inventory from Ufone.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="purchases" title="Purchases Register" targetId="purchases-table" />
          {canEditPurchases && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards (Matching Reference App: Total Quantity, Purchase Total Amount, Total Paid Amount, Total Due Amount) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Quantity"
          value={summary?.total_quantity ?? 0}
          variant="indigo"
          subtitle="Items procured"
        />
        <MetricCard
          title="Purchase Total"
          value={summary?.total_amount ?? 0}
          prefix="Rs. "
          variant="blue"
          subtitle="Gross purchase value"
        />
        <MetricCard
          title="Total Paid Amount"
          value={summary?.total_paid ?? 0}
          prefix="Rs. "
          variant="green"
          subtitle="Disbursed cash & bank"
        />
        <MetricCard
          title="Total Due Amount"
          value={summary?.total_due ?? 0}
          prefix="Rs. "
          variant="red"
          subtitle="Company / vendor payable"
        />
      </div>

      {/* Filters (Matching Reference App: Live Search, From Date, To Date, Filter Button) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Live Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Invoice number or supplier..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="w-44">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-900 bg-indigo-50/50"
          >
            <option value="all">All Records</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setSelectedMonth("custom");
              setDateFrom(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setSelectedMonth("custom");
              setDateTo(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          />
        </div>

        <div className="self-end">
          <button
            onClick={loadData}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Purchases Table (Matching Reference Columns: S.No, Product Name, Investor, Quantity, Purchase, Total Amount, Total Paid Amount, Total Due Amount, Actions) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="purchases-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">S.No</th>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Supplier / Company</th>
                <th className="py-3 px-6">Quantity</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Total Amount (PKR)</th>
                <th className="py-3 px-6">Paid Amount (PKR)</th>
                <th className="py-3 px-6">Due Amount (PKR)</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No purchase invoices found.
                  </td>
                </tr>
              ) : (
                purchases.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{p.invoice_number}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">{p.company_name || "Company"}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                      {p.items?.reduce((acc, i) => acc + Number(i.quantity), 0) || 0}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.payment_method === "Company Credit" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      Rs. {Number(p.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                      Rs. {Number(p.paid_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-700">
                      Rs. {Number(p.due_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={p.payment_status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedPurchase(p);
                          setIsDetailOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="py-3.5 px-6 text-right uppercase tracking-wider font-extrabold text-slate-800">
                  Total Purchases ({purchases.length} Invoices):
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-slate-800">
                  {purchases.reduce((acc, p) => acc + (p.items?.reduce((q, i) => q + Number(i.quantity), 0) || 0), 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-6 text-slate-500 font-normal">
                  -
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-slate-950 text-sm whitespace-nowrap">
                  Rs. {purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                  Rs. {purchases.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                  Rs. {purchases.reduce((acc, p) => acc + Number(p.due_amount || 0), 0).toLocaleString()}
                </td>
                <td colSpan={2} className="py-3.5 px-6 text-slate-500 font-normal">
                  Vendor Payables & Stock
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Purchase Form Modal (Exact Fields matching reference app /shop/purchases/create) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Purchase"
        subtitle="Create new purchase invoice with automatic stock & double-entry ledger impact"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product *</label>
              <select
                required
                value={formData.product_id}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Investment (Optional)</label>
              <select
                value={formData.investment_id}
                onChange={(e) => setFormData({ ...formData, investment_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">None (Franchise Internal Capital)</option>
                {investments.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.name} (Remaining: Rs. {inv.remaining})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Single Item Price (Cost PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="90.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sale Price (Customer PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="100.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Paid *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Company Credit">Company Credit / Loan (No false cash reduction)</option>
              </select>
            </div>
          </div>

          {/* Real-time Calculation Display (Matching Reference App: Total Amount, Due Amount) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 font-medium">Total Amount:</p>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                Rs. {calculatedTotal.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Due Amount:</p>
              <p className={`text-xl font-extrabold font-mono mt-0.5 ${calculatedDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                Rs. {calculatedDue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-md shadow-indigo-600/30"
            >
              Save Purchase
            </button>
          </div>
        </form>
      </Modal>

      {/* Purchase Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Purchase Invoice: ${selectedPurchase?.invoice_number}`}
        subtitle={`Date: ${selectedPurchase?.purchase_date} | Supplier: ${selectedPurchase?.company_name}`}
        maxWidth="2xl"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs" id="purchase-invoice-printable">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-sans">Total Amount</p>
                <p className="text-base font-bold text-slate-900">Rs. {Number(selectedPurchase.total_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-sans">Paid</p>
                <p className="text-base font-bold text-emerald-700">Rs. {Number(selectedPurchase.paid_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-sans">Due</p>
                <p className="text-base font-bold text-rose-700">Rs. {Number(selectedPurchase.due_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-sans">Payment Method</p>
                <p className="text-xs font-bold text-indigo-700">{selectedPurchase.payment_method}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Invoice Items</h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3">Quantity</th>
                      <th className="py-2 px-3">Cost Price</th>
                      <th className="py-2 px-3">Sale Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{it.product_name || `Product ID ${it.product_id}`}</td>
                        <td className="py-2 px-3 font-mono">{Number(it.quantity)}</td>
                        <td className="py-2 px-3 font-mono">Rs. {Number(it.purchase_price)}</td>
                        <td className="py-2 px-3 font-mono">Rs. {Number(it.sale_price)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">Rs. {Number(it.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 no-print">
              <button
                onClick={() => printTargetContent('purchase-invoice-printable', `Purchase Invoice - ${selectedPurchase.invoice_number}`)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
              >
                Print Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
