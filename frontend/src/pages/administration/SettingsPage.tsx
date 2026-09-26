import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2, Shield, Building, Printer, Tag } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      await api.updateSetting(key, value);
      setSuccessMessage(`Updated "${key}" successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating setting');
    } finally {
      setSavingKey(null);
    }
  };

  const handleLocalChange = (key: string, newVal: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: newVal } : s))
    );
  };

  const categories = Array.from(new Set(settings.map((s) => s.category || 'general')));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Configure telecom franchise credentials, printing layout headers, thresholds, and operational rules</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Settings
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading configurations...</div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const groupSettings = settings.filter((s) => (s.category || 'general') === cat);
            return (
              <div key={cat} className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                  {cat === 'print' ? (
                    <Printer className="w-4 h-4 text-indigo-600" />
                  ) : cat === 'finance' ? (
                    <Tag className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Building className="w-4 h-4 text-indigo-600" />
                  )}
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider capitalize">
                    {cat} Configuration
                  </h3>
                </div>

                <div className="p-5 space-y-4 divide-y divide-slate-100">
                  {groupSettings.map((item) => (
                    <div key={item.key} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="sm:w-1/3">
                        <div className="font-semibold text-slate-900 text-sm capitalize">
                          {item.key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.description || item.key}</div>
                      </div>
                      <div className="flex items-center gap-3 sm:w-2/3">
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleLocalChange(item.key, e.target.value)}
                          className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        />
                        <button
                          onClick={() => handleUpdate(item.key, item.value)}
                          disabled={savingKey === item.key}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingKey === item.key ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
