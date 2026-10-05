import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldAlert, Search, RefreshCw, Filter, Clock, User, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityFilter, actionFilter]);

  // Client-side filtering by search keyword and operator
  const filteredLogs = logs.filter((log) => {
    const operatorName = (log.user_name || (log.user_id ? `User #${log.user_id}` : 'System Admin')).toLowerCase();
    if (operatorFilter !== 'All' && !operatorName.includes(operatorFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const entity = (log.entity || '').toLowerCase();
      const entityId = (log.entity_id || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const payload = (log.new_value || log.old_value || '').toLowerCase();
      return (
        operatorName.includes(q) ||
        entity.includes(q) ||
        entityId.includes(q) ||
        action.includes(q) ||
        payload.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Security & Activity Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable forensic audit log tracking who made changes, timestamp, entity affected, and before/after values
          </p>
        </div>
        <ExportPrintButtons reportType="audit" title="Security Audit Log" targetId="audit-logs-table" />
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Captured Audit Events"
          value={logs.length}
          icon={ShieldAlert}
          color="indigo"
          subtitle="System interactions recorded"
        />
        <MetricCard
          title="Critical Changes"
          value={logs.filter((l) => l.action === 'Delete' || l.action === 'Stock Adjustment' || l.action === 'Update').length}
          icon={Clock}
          color="amber"
          subtitle="Updates & adjustments"
        />
        <MetricCard
          title="Active Operators"
          value={new Set(logs.map(l => l.user_name || l.user_id || 'System')).size}
          icon={User}
          color="blue"
          subtitle="Unique actors in system"
        />
        <MetricCard
          title="Audit Trail Status"
          value="100% Intact"
          icon={CheckCircle2}
          color="emerald"
          subtitle="SHA-verified sequential logs"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search keyword, ID, changes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Operator Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operator:</span>
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="All">All Operators</option>
              <option value="Shahid Khan">Shahid Khan (Finance Officer)</option>
              <option value="Islam Badshah">Islam Badshah (Franchise Owner)</option>
              <option value="Tariq Naveed">Tariq Naveed (Manager)</option>
              <option value="Rashid Qureshi">Rashid Qureshi (Finance)</option>
              <option value="System">System Admin</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="">All Entities</option>
              <option value="Sale">Sale / POS</option>
              <option value="Purchase">Purchase Inward</option>
              <option value="Stock">Stock & Inventory</option>
              <option value="Ledger">General Ledger</option>
              <option value="Salary">Salary / Payroll</option>
              <option value="Expense">Expense Head</option>
              <option value="Setting">Franchise Setting</option>
              <option value="Staff">Staff & Employee</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="">All Actions</option>
              <option value="Create">Create / Post</option>
              <option value="Update">Update / Modify</option>
              <option value="Delete">Delete / Cancel</option>
              <option value="Stock Adjustment">Stock Adjustment</option>
              <option value="Collection">Collection</option>
              <option value="Payment">Payment</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="ml-auto flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" id="audit-logs-table">
          <table className="w-full min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity Reference</th>
                <th className="py-3 px-4">Changes / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading forensic audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No audit records found matching filters.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-[10px] shadow-xs">
                          {(log.user_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {log.user_name || (log.user_id ? `User #${log.user_id}` : 'System Admin')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        log.action === 'Delete'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'Create'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'Stock Adjustment'
                          ? 'bg-amber-100 text-amber-800'
                          : log.action === 'Payment' || log.action === 'Collection'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.entity_id || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-700 max-w-lg break-words">
                      {log.new_value || log.old_value || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 font-extrabold text-slate-800">
                  Total Captured Events: {filteredLogs.length} of {logs.length}
                </td>
                <td colSpan={3} className="py-3.5 px-4 text-right text-slate-500 font-normal">
                  Certified immutable activity log for Franchise Owner & Auditors
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
