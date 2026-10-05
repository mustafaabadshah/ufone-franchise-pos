import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Search, Users, UserCheck, DollarSign, Phone, Mail, Calendar, Edit, Trash2, RefreshCw } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function StaffList() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'RSO Officer',
    salary: 35000,
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err: any) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? s.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const totalPayroll = staffList.reduce((acc, s) => acc + (s.is_active ? Number(s.salary || 0) : 0), 0);
  const activeCount = staffList.filter((s) => s.is_active).length;

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'RSO Officer',
      salary: 35000,
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingStaff(s);
    setForm({
      name: s.name,
      email: s.email || '',
      phone: s.phone || '',
      role: s.role || 'RSO Officer',
      salary: Number(s.salary || 0),
      hire_date: s.hire_date || new Date().toISOString().split('T')[0],
      is_active: s.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, form);
      } else {
        await api.createStaff(form);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving staff member');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this staff member?')) return;
    try {
      await api.deleteStaff(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting staff member');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage franchise personnel, RSO sales agents, base salaries, and roles</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="staff" title="Staff Directory" targetId="staff-table" />
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total Staff"
          value={staffList.length}
          icon={Users}
          color="indigo"
          subtitle="Enrolled franchise team"
        />
        <MetricCard
          title="Active Personnel"
          value={activeCount}
          icon={UserCheck}
          color="emerald"
          subtitle="Currently on active roster"
        />
        <MetricCard
          title="Monthly Payroll Commitment"
          value={`Rs. ${Number(totalPayroll).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="amber"
          subtitle="Base salaries committed"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700"
            >
              <option value="">All Roles</option>
              <option value="Franchise Manager">Franchise Manager</option>
              <option value="RSO Officer">RSO Officer</option>
              <option value="Cashier">Cashier</option>
              <option value="Customer Care">Customer Care</option>
              <option value="Inventory Officer">Inventory Officer</option>
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

        <div className="overflow-x-auto" id="staff-table">
          <table className="w-full min-w-[750px] text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role / Designation</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading staff records...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No staff members found.</td>
                </tr>
              ) : (
                filteredStaff.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400">ID: EMP-{String(s.id).padStart(4, '0')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {s.role || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs space-y-0.5">
                      <div className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {s.phone || 'N/A'}
                      </div>
                      {s.email && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Mail className="w-3 h-3" />
                          {s.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      Rs. {Number(s.salary || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {s.hire_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Staff Member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Delete / Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Staff */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? `Edit Staff - ${editingStaff.name}` : 'Register New Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Asad Ullah"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="03335551234"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="employee@ufone-pos.pk"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role / Title <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Franchise Manager">Franchise Manager</option>
                <option value="RSO Officer">RSO Officer</option>
                <option value="Cashier">Cashier</option>
                <option value="Customer Care">Customer Care</option>
                <option value="Inventory Officer">Inventory Officer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Monthly Salary (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Roster Status
              </label>
              <select
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="true">Active Personnel</option>
                <option value="false">Inactive / Resigned</option>
              </select>
            </div>
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
              {editingStaff ? 'Update Staff Member' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
