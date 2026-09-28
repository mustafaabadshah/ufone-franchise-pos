import React, { useState, useEffect } from "react";
import {
  ShoppingBag, Plus, Search, Calendar, Users, DollarSign,
  Printer, CheckCircle2, AlertCircle, Eye, X, Smartphone, ArrowRight
} from "lucide-react";
import { api } from "../../api/client";
import { Sale, Product, Staff, Retailer, RSO } from "../../types";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

interface SalesListProps {
  initialOpenPos?: boolean;
}

export const SalesList: React.FC<SalesListProps> = ({ initialOpenPos = false }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [rsos, setRsos] = useState<RSO[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(initialOpenPos);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Add Sale Form State (Matching reference /shop/sales/create)
  const [formData, setFormData] = useState({
    title: "Counter Customer Sale",
    sale_type: "Customer", // Customer, Retailer, RSO
    staff_id: "",
    retailer_id: "",
    rso_id: "",
    product_id: "",
    quantity: "1",
    single_price: "",
    sale_date: new Date().toISOString().split("T")[0],
    paid_amount: "",
    payment_method: "Cash",
    discount: "0",
    commission: "0",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, sum, prods, staff, rets, rsoList] = await Promise.all([
        api.getSales({
          search,
          staff_id: selectedStaff !== "All" ? Number(selectedStaff) : undefined,
          date_from: dateFrom,
          date_to: dateTo
        }),
        api.getSalesSummary({
          staff_id: selectedStaff !== "All" ? Number(selectedStaff) : undefined,
          date_from: dateFrom,
          date_to: dateTo
        }),
        api.getProducts(),
        api.getStaff(),
        api.getRetailers(),
        api.getRsos()
      ]);
      setSales(sList);
      setSummary(sum);
      setProducts(prods);
      setStaffList(staff);
      setRetailers(rets);
      setRsos(rsoList);
    } catch (err) {
      console.error("Sales data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedStaff]);

  const handleProductSelect = (prodId: string) => {
    const prod = products.find(p => p.id.toString() === prodId);
    let price = "0";
    if (prod) {
      if (formData.sale_type === "Retailer" && prod.retailer_price > 0) {
        price = prod.retailer_price.toString();
      } else if (formData.sale_type === "RSO" && prod.rso_price > 0) {
        price = prod.rso_price.toString();
      } else {
        price = prod.selling_price.toString();
      }
    }
    setFormData(prev => ({
      ...prev,
      product_id: prodId,
      single_price: price,
      paid_amount: (Number(prev.quantity || 1) * Number(price)).toString()
    }));
  };

  const qty = Number(formData.quantity) || 0;
  const singlePrice = Number(formData.single_price) || 0;
  const discountVal = Number(formData.discount) || 0;
  const calculatedTotal = Math.max(0, qty * singlePrice - discountVal);
  const paidVal = Number(formData.paid_amount) || 0;
  const calculatedRemaining = Math.max(0, calculatedTotal - paidVal);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      alert("Please select a product");
      return;
    }

    try {
      await api.createSale({
        title: formData.title,
        sale_date: formData.sale_date,
        sale_type: formData.sale_type,
        staff_id: formData.staff_id ? Number(formData.staff_id) : undefined,
        retailer_id: formData.retailer_id ? Number(formData.retailer_id) : undefined,
        rso_id: formData.rso_id ? Number(formData.rso_id) : undefined,
        discount: discountVal,
        commission: Number(formData.commission) || 0,
        paid_amount: paidVal,
        payment_method: formData.payment_method,
        remarks: formData.remarks,
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: qty,
            unit_price: singlePrice,
            discount: discountVal,
            commission: Number(formData.commission) || 0
          }
        ]
      });
      setIsCreateOpen(false);
      setFormData({
        title: "Counter Customer Sale",
        sale_type: "Customer",
        staff_id: "",
        retailer_id: "",
        rso_id: "",
        product_id: "",
        quantity: "1",
        single_price: "",
        sale_date: new Date().toISOString().split("T")[0],
        paid_amount: "",
        payment_method: "Cash",
        discount: "0",
        commission: "0",
        remarks: ""
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create sale");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Sales / POS Terminal</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Process counter sales, retailer bulk dispatches, and field RSO inventory issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="sales" />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale / POS</span>
          </button>
        </div>
      </div>

      {/* Summary Cards (Matching Reference App: Total Quantity, Total Amount, Paid Amount, Total Remaining) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Quantity"
          value={summary?.total_quantity ?? 0}
          variant="indigo"
          subtitle="Items sold & dispatched"
        />
        <MetricCard
          title="Total Amount"
          value={summary?.total_amount ?? 0}
          prefix="Rs. "
          variant="blue"
          subtitle="Gross sales revenue"
        />
        <MetricCard
          title="Paid Amount"
          value={summary?.paid_amount ?? 0}
          prefix="Rs. "
          variant="green"
          subtitle="Cash collected"
        />
        <MetricCard
          title="Total Remaining"
          value={summary?.total_remaining ?? 0}
          prefix="Rs. "
          variant="red"
          subtitle="Customer / Retailer receivable"
        />
      </div>

      {/* Filters (Matching Reference App: Sales Man, From Date, To Date, Filter Button) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-56">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Sales Person</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="All">All Sales Persons</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id.toString()}>{s.name} ({s.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
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

      {/* Sales Table (Matching Reference Columns: S.No, Title, Product, Quantity, Total Amount, Paid Amount, Remaining, Actions) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">S.No</th>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Customer / Party</th>
                <th className="py-3 px-6">Quantity</th>
                <th className="py-3 px-6">Total Amount (PKR)</th>
                <th className="py-3 px-6">Paid Amount (PKR)</th>
                <th className="py-3 px-6">Remaining (PKR)</th>
                <th className="py-3 px-6">Gross Profit</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                sales.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{s.invoice_number}</td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-800">{s.customer_name || s.retailer_name || s.rso_name || s.title}</p>
                      <span className="text-[10px] text-slate-400 font-normal">{s.sale_type} &bull; {s.staff_name || "Self"}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                      {s.items?.reduce((acc, i) => acc + Number(i.quantity), 0) || 0}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      Rs. {Number(s.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                      Rs. {Number(s.paid_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-700">
                      Rs. {Number(s.remaining_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-indigo-700">
                      Rs. {Number(s.gross_profit).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedSale(s);
                          setIsDetailOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSale(s);
                          setTimeout(() => window.print(), 100);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal (Exact match to reference /shop/sales/create) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Sale / Fast POS"
        subtitle="Quick cashier checkout with automatic inventory deduction and gross profit calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sale Type *</label>
              <select
                value={formData.sale_type}
                onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Customer">Walk-in Direct Customer</option>
                <option value="Retailer">Retailer Dispatch</option>
                <option value="RSO">RSO Route Distribution</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Person</label>
              <select
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Counter Cashier</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            {formData.sale_type === "Retailer" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Retailer Shop *</label>
                <select
                  required
                  value={formData.retailer_id}
                  onChange={(e) => setFormData({ ...formData, retailer_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Choose Retailer</option>
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.shop_name} (Bal: Rs. {r.balance})</option>
                  ))}
                </select>
              </div>
            )}

            {formData.sale_type === "RSO" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select RSO Field Officer *</label>
                <select
                  required
                  value={formData.rso_id}
                  onChange={(e) => setFormData({ ...formData, rso_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Choose RSO</option>
                  {rsos.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.route})</option>
                  ))}
                </select>
              </div>
            )}

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
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => {
                  const q = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    quantity: q,
                    paid_amount: (Number(q) * Number(prev.single_price)).toString()
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Single Price (PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.single_price}
                onChange={(e) => {
                  const p = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    single_price: p,
                    paid_amount: (Number(prev.quantity) * Number(p)).toString()
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Paid By Customer / Party *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
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
                <option value="Retailer Balance">Retailer Balance (Credit)</option>
              </select>
            </div>
          </div>

          {/* Real-time Display (Matching Reference App: Total Price, Amount Remaining) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 font-medium">Total Price:</p>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                Rs. {calculatedTotal.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Amount Remaining:</p>
              <p className={`text-xl font-extrabold font-mono mt-0.5 ${calculatedRemaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                Rs. {calculatedRemaining.toLocaleString()}
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
              Save Sale
            </button>
          </div>
        </form>
      </Modal>

      {/* Sale Detail / Receipt Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Sales Receipt: ${selectedSale?.invoice_number}`}
        subtitle={`Date: ${selectedSale?.sale_date} | Method: ${selectedSale?.payment_method}`}
        maxWidth="lg"
      >
        {selectedSale && (
          <div className="space-y-4 text-xs font-mono">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 font-sans">
              <h3 className="text-base font-bold text-slate-900">Ufone Franchise - Dargai Office</h3>
              <p className="text-[11px] text-slate-500">Main Bazar, Dargai, Malakand, KP</p>
              <p className="text-[11px] text-slate-500">Ph: +92 333 9123456</p>
            </div>

            <div className="space-y-1">
              <p><span className="text-slate-400 font-sans">Invoice:</span> {selectedSale.invoice_number}</p>
              <p><span className="text-slate-400 font-sans">Customer / Party:</span> {selectedSale.customer_name || selectedSale.retailer_name || selectedSale.title}</p>
              <p><span className="text-slate-400 font-sans">Sales Officer:</span> {selectedSale.staff_name || "Counter Cashier"}</p>
            </div>

            <table className="w-full text-left border-y border-dashed border-slate-300 my-2">
              <thead>
                <tr className="border-b border-dashed border-slate-200 text-slate-500">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5">{item.product_name || `Product #${item.product_id}`}</td>
                    <td className="py-1.5 text-center">{Number(item.quantity)}</td>
                    <td className="py-1.5 text-right">Rs. {Number(item.unit_price)}</td>
                    <td className="py-1.5 text-right font-bold">Rs. {Number(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-right">
              <p>Subtotal: Rs. {Number(selectedSale.subtotal).toLocaleString()}</p>
              {Number(selectedSale.discount) > 0 && <p className="text-rose-600">Discount: -Rs. {Number(selectedSale.discount)}</p>}
              <p className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                Total: Rs. {Number(selectedSale.total_amount).toLocaleString()}
              </p>
              <p className="text-emerald-700">Paid: Rs. {Number(selectedSale.paid_amount).toLocaleString()}</p>
              {Number(selectedSale.remaining_amount) > 0 && (
                <p className="text-rose-600 font-bold">Due / Remaining: Rs. {Number(selectedSale.remaining_amount).toLocaleString()}</p>
              )}
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 text-center font-sans text-slate-500 text-[10px]">
              <p>Thank you for choosing Ufone 4G Network!</p>
              <p className="mt-0.5">Software by NextGen Software Solutions</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
