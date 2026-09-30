import React, { useState, useEffect } from "react";
import { DollarSign, Plus, Search, Calendar, UserCheck, Eye } from "lucide-react";
import { api } from "../../api/client";
import { Salary, Staff, RSOSalary } from "../../types";
import { MetricCard } from "../../components/common/MetricCard";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";
import { useAuth } from "../../context/AuthContext";

export const SalariesList: React.FC = () => {
  const { user } = useAuth();
  const isViewer = user?.role?.toLowerCase() === "viewer";
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [rsoSalaries, setRsoSalaries] = useState<RSOSalary[]>([]);
  const [activeTab, setActiveTab] = useState<'rso_sheet' | 'all'>('rso_sheet');
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add Salary Form State (Matching reference /shop/salaries/create)
  const [formData, setFormData] = useState({
    staff_id: "",
    month: "September 2026",
    basic_salary: "30000",
    allowances: "0",
    deductions: "0",
    bonus: "0",
    commission: "0",
    salary_given: "30000",
    paid_on: new Date().toISOString().split("T")[0],
    paid_by: "Shahid Khan",
    payment_method: "Cash",
    remarks: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sals, sum, staff, rsoSals] = await Promise.all([
        api.getSalaries({ search, date_from: dateFrom, date_to: dateTo }),
        api.getSalariesSummary({ date_from: dateFrom, date_to: dateTo }),
        api.getStaff(),
        api.getRsoSalaries()
      ]);
      setSalaries(sals);
      setSummary(sum);
      setStaffList(staff);
      setRsoSalaries(rsoSals);
    } catch (err) {
      console.error("Salaries load error:", err);
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
  }, [search, dateFrom, dateTo]);

  const handleStaffSelect = (staffId: string) => {
    const st = staffList.find(s => s.id.toString() === staffId);
    setFormData(prev => ({
      ...prev,
      staff_id: staffId,
      basic_salary: st ? st.salary_amount.toString() : prev.basic_salary,
      salary_given: st ? st.salary_amount.toString() : prev.salary_given
    }));
  };

  const basic = Number(formData.basic_salary) || 0;
  const allow = Number(formData.allowances) || 0;
  const ded = Number(formData.deductions) || 0;
  const bon = Number(formData.bonus) || 0;
  const comm = Number(formData.commission) || 0;
  const net = basic + allow - ded + bon + comm;
  const given = Number(formData.salary_given) || 0;
  const remaining = Math.max(0, net - given);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_id) {
      alert("Please select staff member");
      return;
    }

    try {
      await api.createSalary({
        staff_id: Number(formData.staff_id),
        month: formData.month,
        basic_salary: basic,
        allowances: allow,
        deductions: ded,
        bonus: bon,
        commission: comm,
        salary_given: given,
        paid_on: formData.paid_on,
        paid_by: formData.paid_by,
        payment_method: formData.payment_method,
        remarks: formData.remarks
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record salary");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">Staff Salaries & Payroll</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage monthly salary disbursement, allowances, bonuses, and accrued payroll liabilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="salaries" title="Staff Salaries & Payroll" targetId="salaries-printable-area" />
          {!isViewer && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Disburse Salary</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards (Matching Reference App: Total Salary, Salary Given, Total Remaining, Total Records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Salary"
          value={summary?.total_salary ?? 0}
          prefix="Rs. "
          variant="indigo"
          subtitle="Net payroll obligations"
        />
        <MetricCard
          title="Salary Given"
          value={summary?.salary_given ?? 0}
          prefix="Rs. "
          variant="green"
          subtitle="Disbursed cash & bank"
        />
        <MetricCard
          title="Total Remaining"
          value={summary?.total_remaining ?? 0}
          prefix="Rs. "
          variant="red"
          subtitle="Accrued pending salary"
        />
        <MetricCard
          title="Total Records"
          value={summary?.total_records ?? 0}
          variant="blue"
          subtitle="Processed salary vouchers"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Search Staff / Month</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Staff name or month..."
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

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rso_sheet')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rso_sheet'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>RSO Salary Aug 26 (Audit Sheet)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">Rs. 108,024</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Payroll Vouchers (Office & RSO)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{salaries.length}</span>
        </button>
      </div>

      {/* Printable Area Wrapper */}
      <div id="salaries-printable-area" className="space-y-6">
        {/* RSO SALARY SHEET (Exact Monthly Audit View from August.xlsx) */}
        {activeTab === 'rso_sheet' ? (
        <div id="rso-salary-sheet" className="rounded-2xl bg-white border border-slate-300 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-200 text-slate-900 py-3.5 px-6 border-b border-slate-300 text-center font-bold text-base sm:text-lg tracking-wide uppercase font-serif">
            RSO Salary Aug 26
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
                  <th className="py-3 px-4 border-r border-slate-300 text-left font-bold">Salesman</th>
                  <th className="py-3 px-3 border-r border-slate-300">Basic Salary</th>
                  <th className="py-3 px-3 border-r border-slate-300">Fuel Amount</th>
                  <th className="py-3 px-3 border-r border-slate-300">KPI Comm</th>
                  <th className="py-3 px-3 border-r border-slate-300">EVC Comm</th>
                  <th className="py-3 px-3 border-r border-slate-300">B-Cards Comm</th>
                  <th className="py-3 px-3 border-r border-slate-300">FCA Comm</th>
                  <th className="py-3 px-3 border-r border-slate-300">Bonus</th>
                  <th className="py-3 px-4 font-black text-slate-900 text-sm">G -Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {rsoSalaries.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-300 text-left font-bold text-slate-900">
                      {idx + 1}- {row.rso_name}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono font-semibold">
                      {Number(row.basic_salary).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono">
                      {Number(row.fuel_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono">
                      {Number(row.kpi_comm).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono font-semibold text-indigo-700">
                      {Number(row.evc_comm).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono text-slate-400">
                      {Number(row.bcards_comm).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono">
                      {Number(row.fca_comm).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-300 font-mono text-slate-400">
                      {Number(row.bonus).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm bg-slate-50/60">
                      {Number(row.gross_total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-black text-slate-900 text-xs border-t-2 border-slate-400">
                  <td className="py-3.5 px-4 border-r border-slate-300 text-left font-bold text-sm">Total</td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.basic_salary), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.fuel_amount), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.kpi_comm), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold text-indigo-900">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.evc_comm), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.bcards_comm), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.fca_comm), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 font-mono font-bold">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.bonus), 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-slate-950 text-base bg-slate-300/80">
                    {rsoSalaries.reduce((acc, r) => acc + Number(r.gross_total), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Salaries Table */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">S.No</th>
                <th className="py-3 px-6">Staff Name</th>
                <th className="py-3 px-6">Month</th>
                <th className="py-3 px-6">Net Salary (PKR)</th>
                <th className="py-3 px-6">Salary Given (PKR)</th>
                <th className="py-3 px-6">Remaining (PKR)</th>
                <th className="py-3 px-6">Paid On</th>
                <th className="py-3 px-6">Paid By</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No salary disbursements found.
                  </td>
                </tr>
              ) : (
                salaries.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">{s.staff_name || `Staff #${s.staff_id}`}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">{s.month}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      Rs. {Number(s.net_salary).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                      Rs. {Number(s.salary_given).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-700">
                      Rs. {Number(s.remaining).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{s.paid_on}</td>
                    <td className="py-3.5 px-6 text-slate-600">{s.paid_by || "Finance"}</td>
                    <td className="py-3.5 px-6 text-slate-500">{s.payment_method}</td>
                    <td className="py-3.5 px-6 text-right">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="py-3.5 px-6 text-right uppercase tracking-wider font-extrabold text-slate-800">
                  Total Staff Payroll ({salaries.length} records):
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                  Rs. {salaries.reduce((acc, s) => acc + Number(s.net_salary || 0), 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                  Rs. {salaries.reduce((acc, s) => acc + Number(s.salary_given || 0), 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-6 font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                  Rs. {salaries.reduce((acc, s) => acc + Number(s.remaining || 0), 0).toLocaleString()}
                </td>
                <td colSpan={4} className="py-3.5 px-6 text-slate-500 font-normal">
                  Disbursed by Shahid Khan & Finance
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      )}
      </div>

      {/* Add Salary Modal (Matching Reference Fields: Staff Name, Salary, Salary Given, Paid On, Paid By, Payment Method, Remaining) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Disburse Staff Salary"
        subtitle="Automatic salary expense posting to P&L and ledger"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Staff Member *</label>
              <select
                required
                value={formData.staff_id}
                onChange={(e) => handleStaffSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Staff</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>{st.name} - {st.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Month / Period *</label>
              <input
                type="text"
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                placeholder="e.g. September 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Basic Salary (PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Salary Given (Disbursed) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.salary_given}
                onChange={(e) => setFormData({ ...formData, salary_given: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Paid On (Date) *</label>
              <input
                type="date"
                required
                value={formData.paid_on}
                onChange={(e) => setFormData({ ...formData, paid_on: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Cash">Cash Handover</option>
                <option value="Bank Transfer">Bank Transfer (Direct Payroll)</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>
          </div>

          {/* Real-time Display: Remaining */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
            <div>
              <p className="text-slate-500 font-sans text-[11px]">Net Salary:</p>
              <p className="text-base font-bold text-slate-900">Rs. {net.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-sans text-[11px]">Remaining Due:</p>
              <p className={`text-base font-bold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                Rs. {remaining.toLocaleString()}
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
              Save Salary
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
