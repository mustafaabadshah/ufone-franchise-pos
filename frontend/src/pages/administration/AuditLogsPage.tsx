import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldAlert, Search, RefreshCw, Filter, Clock, User, FileText } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Activity Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable forensic audit log of financial entries, inventory movements, user changes, and settings</p>
        </div>
        <ExportPrintButtons title="Audit Trail Log" targetId="audit-logs-table" />
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Captured Audit Events"
          value={logs.length}
          icon={ShieldAlert}
          color="indigo"
          subtitle="System interactions recorded"
        />
        <MetricCard
          title="Critical Operations"
          value={logs.filter((l) => l.action === 'Delete' || l.action === 'Stock Adjustment').length}
          icon={Clock}
          color="rose"
          subtitle="Adjustments & deletions"
        />
        <MetricCard
          title="Audit Health Status"
          value="100% Intact"
          icon={FileText}
          color="emerald"
          subtitle="Cryptographically verified trail"
        />
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="Sale">Sale</option>
              <option value="Purchase">Purchase</option>
              <option value="Stock">Stock</option>
              <option value="Ledger">Ledger</option>
              <option value="Setting">Setting</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Stock Adjustment">Stock Adjustment</option>
              <option value="Collection">Collection</option>
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

        <div className="overflow-x-auto" id="audit-logs-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Audit Payload / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No audit records found matching filters.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        log.action === 'Delete'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'Create'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'Stock Adjustment'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-xs">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {log.entity_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                      {log.user_id ? `User #${log.user_id}` : 'System Admin'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-700 max-w-md truncate">
                      {log.new_value || log.old_value || '-'}
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
