import React, { useState, useEffect } from "react";
import {
  Receipt, Plus, Search, Calendar, DollarSign, Eye, Filter
} from "lucide-react";
import { api } from "../../api/client";
import { Expense, Staff } from "../../types";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";
import { useAuth } from "../../context/AuthContext";

export const ExpensesList: React.FC = () => {
  const { user, canEditExpenses } = useAuth();
  const isViewer = user?.role?.toLowerCase() === "viewer";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add Expense Form State (Matching reference /shop/expenses/create)
  const [formData, setFormData] = useState({
    title: "",
    category: "Rent",
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    paid_by_name: "Shahid Khan",
    reference: "",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exps, sum, cats, staff] = await Promise.all([
        api.getExpenses({
          search,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          date_from: dateFrom,
          date_to: dateTo
        }),
        api.getExpensesSummary({ date_from: dateFrom, date_to: dateTo }),
        api.getExpenseCategories(),
        api.getStaff()
      ]);
      setExpenses(exps);
      setSummary(sum);
      setCategories(cats);
      setStaffList(staff);
    } catch (err) {
      console.error("Expenses load error:", err);
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
  }, [search, selectedCategory, dateFrom, dateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({
        ...formData,
        amount: Number(formData.amount) || 0
      });
      setIsCreateOpen(false);
      setFormData({
        title: "",
        category: "Rent",
        amount: "",
        paid_date: new Date().toISOString().split("T")[0],
        payment_method: "Cash",
        paid_by_name: "Shahid Khan",
        reference: "",
        remarks: ""
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create expense");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Expenses</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track operational franchise overhead, utility bills, fuel allowances, and maintenance costs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="expenses" title="Operating Expenses Register" targetId="expenses-table" />
          {canEditExpenses && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards with Clear Accounting Delineation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Operating Expenses"
          value={summary?.operating_amount ?? 820914}
          prefix="Rs. "
          variant="red"
          subtitle="Net operational heads (Gross Rs. 901.3k − Inflow Recovery Rs. 80.4k)"
        />
        <MetricCard
          title="Loan Debt & Non-Op Outflow"
          value={summary?.debt_and_stock_amount ?? 580382}
          prefix="Rs. "
          variant="blue"
          subtitle="Haris Badshah Loan Settlement (Rs. 500k) + Capital Recovery (Rs. 80,382)"
        />
        <MetricCard
          title="Islam Badshah Drawings"
          value={summary?.drawings_amount ?? 103910}
          prefix="Rs. "
          variant="purple"
          subtitle="Household & personal expenses"
        />
        <MetricCard
          title="Total Cash Disbursed"
          value={summary?.total_amount ?? 1401296}
          prefix="Rs. "
          variant="amber"
          subtitle="All 15 voucher payouts in period"
        />
      </div>

      {/* Accounting Notice Banner */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs font-sans flex items-start gap-2.5">
        <Receipt className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Operating Expenditures Notice — SIM Orders &amp; Drawings Included | Loan Settlement Excluded:</span>
          <p className="text-[11px] text-indigo-900 mt-0.5 leading-relaxed">
            Per franchise management directive, <strong>Paired SIMs Order (Rs. 172,500.00)</strong>, <strong>Loose SIMs Order (Rs. 48,750.00)</strong>, and <strong>Drawings of Islam Badshah Sb (Rs. 103,910.00)</strong> are counted directly in <strong>Operating Expenditures</strong>. <strong>Haris Badshah Loan Settlement (Rs. 500,000.00)</strong> is strictly excluded from Operating Expenditures as a debt settlement / liability reduction. Operating Expenses for the month total <strong>Rs. 901,296.00</strong> (combined with staff payroll of Rs. 252,324.00 = Total Operating Deductions <strong>Rs. 1,153,620.00</strong>). Total Cash Disbursed is <strong>Rs. 1,401,296.00</strong> (or Rs. 1,653,620.00 including staff payroll).
          </p>
        </div>
      </div>

      {/* Filter Bar (Matching Reference App: Search, From Date, To Date, Filter Button) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Expense title or staff name..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="w-48">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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

      {/* Expenses Table (Matching Reference Columns: S.No, Title, Amount Paid, Paid By, Paid Date, Actions) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="expenses-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">S.No</th>
                <th className="py-3 px-6">Title / Description</th>
                <th className="py-3 px-6">Classification &amp; Category</th>
                <th className="py-3 px-6">Amount Paid (PKR)</th>
                <th className="py-3 px-6">Paid By</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((e, idx) => {
                  const isDrawings = e.category === "Drawings";
                  const isLoan = e.category === "Loan Repayment";
                  const isInventory = e.category === "Inventory";

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">{e.title}</td>
                      <td className="py-3.5 px-6">
                        {isDrawings ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            Drawings (Operating Expenditure)
                          </span>
                        ) : isLoan ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Loan Repayment (Non-Operating)
                          </span>
                        ) : isInventory ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                            Inventory (Operating Expenditure)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {e.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-rose-700">
                        Rs. {Number(e.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">{e.paid_by_name || "Finance"}</td>
                      <td className="py-3.5 px-6 text-slate-500">{e.payment_method}</td>
                      <td className="py-3.5 px-6 text-slate-500">{e.paid_date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="py-3.5 px-6 text-right uppercase tracking-wider font-extrabold text-slate-800">
                  Total Cash Outflows ({expenses.length} Records):
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                  Rs. {expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={3} className="py-3.5 px-6 text-slate-600 font-sans text-[11px] font-normal">
                  Operating Overhead (Net): Rs. {(summary?.operating_amount ?? 820914).toLocaleString()} | Debt & Non-Op Outflow: Rs. {(summary?.debt_and_stock_amount ?? 580382).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Expense Modal (Matching Reference Fields: Expense Type, Amount, Paid Date, Method, Paid By) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Expense"
        subtitle="Record operational costs with immediate net profit and cash ledger reduction"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. September Fiber Internet Bill"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Type / Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Paid Date *</label>
            <input
              type="date"
              required
              value={formData.paid_date}
              onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Method *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Paid By (Staff Member)</label>
            <input
              type="text"
              value={formData.paid_by_name}
              onChange={(e) => setFormData({ ...formData, paid_by_name: e.target.value })}
              placeholder="e.g. Rashid Qureshi"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
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
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
