import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Smartphone, Upload, Plus, Search, Filter, Download, Printer,
  FileSpreadsheet, CheckCircle2, AlertCircle, Edit3, X, Eye,
  TrendingUp, Users, MapPin, Award, ArrowUpDown, ChevronDown,
  RefreshCw, Layers, ShieldCheck, Lock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { ExportPrintButtons } from "../../components/common/ExportPrintButtons";

interface AgentMonthRecord {
  id: number;
  bvs_id: string;
  name: string;
  market: string;
  category: string;
  channel: string;
  status: string;
  months: Record<string, number>;
  total_sims: number;
  monthly_avg: number;
  active_months_count: number;
  latest_month_sales: number;
}

interface MonthMeta {
  key: string;
  label: string;
}

export const FCAPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentMonthRecord[]>([]);
  const [allMonths, setAllMonths] = useState<MonthMeta[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("category");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentMonthRecord | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [targetMonthKey, setTargetMonthKey] = useState("2026-09");
  const [targetMonthLabel, setTargetMonthLabel] = useState("Sep 2026");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add agent form state
  const [newBvsId, setNewBvsId] = useState("");
  const [newName, setNewName] = useState("");
  const [newMarket, setNewMarket] = useState("");
  const [newCategory, setNewCategory] = useState("SABIR RSO MARKET");
  const [newChannel, setNewChannel] = useState("Market FCA");

  // Check permissions:
  // Shakeel Ahmad has full editing & uploading privileges.
  // Shahid Khan (Admin) has full management privileges.
  // Islam Badshah (Viewer) has read-only view and print/export privileges.
  const isShakeel = user?.email?.toLowerCase().includes("shakeel") || user?.name?.toLowerCase().includes("shakeel") || user?.name?.toLowerCase().includes("shakil");
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const canEdit = isShakeel || isAdmin;
  const isViewer = user?.role?.toLowerCase() === "viewer" || user?.email?.toLowerCase().includes("islambadshah");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFCAAgents({
        search: search || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        sort_by: sortBy,
        sort_dir: sortDir
      });
      setAgents(data.agents || []);
      setAllMonths(data.all_months || []);
      setCategories(data.categories || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("Failed to load FCA agents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, sortBy, sortDir]);

  // Handle single month quick update
  const handleUpdateMonth = async (agentId: number, monthKey: string, newValue: number) => {
    if (!canEdit) return;
    try {
      await api.updateFCAAgentMonth(agentId, {
        month_key: monthKey,
        sims_sold: newValue
      });
      // update local state
      setAgents(prev => prev.map(a => {
        if (a.id === agentId) {
          const updatedMonths = { ...a.months, [monthKey]: newValue };
          const newTotal = Object.values(updatedMonths).reduce((acc, v) => acc + (v || 0), 0);
          return {
            ...a,
            months: updatedMonths,
            total_sims: newTotal,
            monthly_avg: Math.round((newTotal / Math.max(1, allMonths.length)) * 10) / 10
          };
        }
        return a;
      }));
    } catch (err) {
      alert("Failed to update month value: " + err);
    }
  };

  // Handle Excel Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select an Excel (.xlsx) file");
      return;
    }
    setIsUploading(true);
    setUploadError("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("month_key", targetMonthKey);
    formData.append("month_label", targetMonthLabel);

    try {
      const res = await api.uploadFCAMonthlyExcel(formData);
      setUploadResult(res);
      await loadData();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Create Agent Submit
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBvsId.trim()) return;
    try {
      await api.createFCAAgent({
        bvs_id: newBvsId.trim().toUpperCase(),
        name: newName.trim() || `Agent ${newBvsId}`,
        market: newMarket.trim() || "Dargai",
        category: newCategory,
        channel: newChannel,
        status: "Active"
      });
      setIsAddModalOpen(false);
      setNewBvsId("");
      setNewName("");
      setNewMarket("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create agent");
    }
  };

  // Handle Agent Details Update
  const handleSaveAgentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    try {
      await api.updateFCAAgent(editingAgent.id, {
        name: editingAgent.name,
        market: editingAgent.market,
        category: editingAgent.category,
        channel: editingAgent.channel,
        status: editingAgent.status,
        months: editingAgent.months
      });
      setEditingAgent(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update agent");
    }
  };

  // Compute column totals for table footer
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const m of allMonths) {
      totals[m.key] = 0;
    }
    let grandTotal = 0;
    for (const a of agents) {
      for (const m of allMonths) {
        totals[m.key] += (a.months[m.key] || 0);
      }
      grandTotal += a.total_sims;
    }
    return { months: totals, grandTotal };
  }, [agents, allMonths]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                FCA & BVS Monthly Progress Ledger
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Unified master tracking across all 3 sheets of FCA Table and dynamic monthly Excel uploads.
              </p>
            </div>
          </div>
        </div>

        {/* User Role & Permission Banner */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isShakeel ? "Shakeel Ahmad (FCA Master Editor)" : "Shahid Khan (Administrator)"}: Full Edit & Upload Active
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold shadow-2xs">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>
                {user?.name || "Viewer"} (Owner Audit Mode): Read-Only & Print View
              </span>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <>
              <button
                onClick={() => { setUploadResult(null); setUploadError(""); setIsUploadModalOpen(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Monthly Excel</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add BVS ID</span>
              </button>
            </>
          )}

          <a
            href={api.getFCAExportUrl()}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </a>

          <ExportPrintButtons
            reportType="rso"
            title="Ufone Franchise Dargai - FCA Monthly SIMs Ledger"
            targetId="fca-printable-area"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 no-print">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered BVS IDs</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {summary?.total_agents || agents.length}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> All active field devices
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All-Time SIMs Sold</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {(summary?.total_sims_all_time || columnTotals.grandTotal).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
            Across {allMonths.length} tracked months
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Month ({summary?.latest_month_label || 'Sep 2026'})</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-800 mt-1 font-mono">
            {(summary?.latest_month_total || (allMonths.length > 0 ? columnTotals.months[allMonths[allMonths.length - 1].key] : 0)).toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600 font-bold mt-0.5">
            BVS SEP 2026 FCA verified
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Categories</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-1 font-mono">
            {categories.length}
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">
            RSO Routes, DSOs, Office, BDO
          </span>
        </div>
      </div>

      {/* Filter and Search Bar (no-print) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by BVS ID (e.g. UMFDRG0197), Agent Name, or Market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills / Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories ({agents.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="category">Category (Default)</option>
            <option value="total">Total SIMs (High to Low)</option>
            <option value="latest">Latest Month Sales</option>
            <option value="bvs_id">BVS ID</option>
            <option value="name">Agent Name</option>
          </select>

          <button
            onClick={() => setSortDir(prev => prev === "asc" ? "desc" : "asc")}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Printable Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-4 print-container" id="fca-printable-area">
        {/* Printable Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200">
            Official Telecom Channel Performance Audit
          </span>
          <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900 mt-2">
            Ufone Franchise — Dargai Office
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Main Bazar, Dargai, Malakand, KP | Field Customer Agent (FCA) & BVS Master SIMs Ledger
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs font-bold text-slate-700">
            <span>Total Agents: {agents.length}</span>
            <span>•</span>
            <span>Total Tracked Months: {allMonths.length} ({allMonths[0]?.label || 'Jan 2026'} – {allMonths[allMonths.length - 1]?.label || 'Sep 2026'})</span>
            <span>•</span>
            <span className="text-emerald-700">All-Time Activations: {columnTotals.grandTotal.toLocaleString()} SIMs</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold">
              <tr>
                <th className="px-3 py-2.5 text-center">#</th>
                <th className="px-3 py-2.5">BVS ID</th>
                <th className="px-3 py-2.5">Agent / Shop Name</th>
                <th className="px-3 py-2.5">Market / Route</th>
                <th className="px-3 py-2.5">Category</th>
                {allMonths.map((m) => (
                  <th key={m.key} className="px-2.5 py-2.5 text-right font-mono whitespace-nowrap bg-slate-800">
                    {m.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-mono bg-indigo-900 text-indigo-100">Total SIMs</th>
                <th className="px-3 py-2.5 text-right font-mono bg-indigo-950 text-indigo-200">Avg/Mo</th>
                {canEdit && <th className="px-3 py-2.5 text-center no-print">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={allMonths.length + 8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span>Loading FCA and BVS tracking records...</span>
                    </div>
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={allMonths.length + 8} className="py-12 text-center text-slate-500">
                    No FCA agents match your search filter.
                  </td>
                </tr>
              ) : (
                agents.map((agent, idx) => {
                  return (
                    <tr key={agent.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-indigo-900 text-[11px] whitespace-nowrap">
                        {agent.bvs_id}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 text-[11px] whitespace-nowrap">
                        {agent.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {agent.market}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          agent.category.includes("SABIR") ? "bg-amber-100 text-amber-900" :
                          agent.category.includes("RIAZ") ? "bg-blue-100 text-blue-900" :
                          agent.category.includes("KHIZAR") ? "bg-emerald-100 text-emerald-900" :
                          agent.category.includes("MAAZ") ? "bg-purple-100 text-purple-900" :
                          agent.category.includes("FRANCHISE") ? "bg-rose-100 text-rose-900" :
                          agent.category.includes("DSO") ? "bg-teal-100 text-teal-900" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {agent.category}
                        </span>
                      </td>

                      {/* Monthly Sales Cells */}
                      {allMonths.map((m) => {
                        const val = agent.months[m.key] || 0;
                        const isLatest = m.key === allMonths[allMonths.length - 1]?.key;
                        return (
                          <td
                            key={m.key}
                            className={`px-2.5 py-2 text-right font-mono text-[11px] font-semibold ${
                              isLatest ? "bg-amber-50/40 text-amber-950 font-bold" : "text-slate-700"
                            }`}
                          >
                            {canEdit ? (
                              <input
                                type="number"
                                defaultValue={val}
                                onBlur={(e) => {
                                  const newVal = parseInt(e.target.value) || 0;
                                  if (newVal !== val) {
                                    handleUpdateMonth(agent.id, m.key, newVal);
                                  }
                                }}
                                className="w-12 text-right px-1 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white bg-transparent no-print font-mono"
                              />
                            ) : (
                              <span>{val}</span>
                            )}
                            <span className="print-only hidden">{val}</span>
                          </td>
                        );
                      })}

                      {/* Total and Avg */}
                      <td className="px-3 py-2 text-right font-mono font-black text-indigo-950 bg-indigo-50/50 text-xs">
                        {agent.total_sims}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 bg-slate-50 text-[11px]">
                        {agent.monthly_avg}
                      </td>

                      {/* Edit Button */}
                      {canEdit && (
                        <td className="px-3 py-2 text-center no-print">
                          <button
                            onClick={() => setEditingAgent({ ...agent })}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Agent Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-950">
              <tr>
                <td colSpan={5} className="px-3 py-3 text-right uppercase tracking-wider font-sans">
                  TOTAL SIM ACTIVATIONS ({agents.length} AGENTS):
                </td>
                {allMonths.map((m) => (
                  <td key={m.key} className="px-2.5 py-3 text-right font-mono text-amber-300">
                    {(columnTotals.months[m.key] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-mono text-emerald-300 text-xs font-black">
                  {columnTotals.grandTotal.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-300">
                  {Math.round((columnTotals.grandTotal / Math.max(1, allMonths.length)) * 10) / 10}
                </td>
                {canEdit && <td className="no-print"></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Audit Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-10 text-center font-sans print-only">
          <div className="border-t-2 border-slate-800 pt-2">
            <p className="font-bold text-sm text-slate-900">Shakeel Ahmad</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Prepared by Operations Officer</p>
          </div>
          <div className="border-t-2 border-slate-800 pt-2">
            <p className="font-bold text-sm text-slate-900">Islam Badshah / Shahid Khan</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Approved by Franchise Incharge</p>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: UPLOAD MONTHLY EXCEL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Upload Monthly BVS Excel</h3>
                  <p className="text-xs text-slate-500">Auto-matches BVS IDs and appends new month column</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Target Month */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Month Key</label>
                  <input
                    type="text"
                    value={targetMonthKey}
                    onChange={(e) => {
                      setTargetMonthKey(e.target.value);
                      const parts = e.target.value.split("-");
                      if (parts.length === 2) {
                        try {
                          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                          setTargetMonthLabel(dt.toLocaleString('default', { month: 'short', year: 'numeric' }));
                        } catch {}
                      }
                    }}
                    placeholder="e.g. 2026-09"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Format: YYYY-MM</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Month Column Label</label>
                  <input
                    type="text"
                    value={targetMonthLabel}
                    onChange={(e) => setTargetMonthLabel(e.target.value)}
                    placeholder="e.g. Sep 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Header in table</span>
                </div>
              </div>

              {/* File Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Excel File (.xlsx)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl bg-indigo-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                  <p className="text-xs font-bold text-slate-800">
                    {uploadFile ? uploadFile.name : "Click to select Excel file (e.g. BVS SEP 2026 FCA.xlsx)"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Expected columns: Column 1 = BVS ID, Column 2 = Monthly Count
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.xlsm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Success Report */}
              {uploadResult && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{uploadResult.message}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div>Matched: <strong>{uploadResult.matched_count}</strong></div>
                    <div>New Added: <strong>{uploadResult.new_agents_count}</strong></div>
                    <div>Total SIMs: <strong>{uploadResult.total_sims_recorded}</strong></div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? "Processing..." : "Upload & Apply"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD NEW BVS AGENT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Register New BVS Agent</h3>
                  <p className="text-xs text-slate-500">Add a new field agent to the master ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">BVS Device ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UMFDRG0220"
                  value={newBvsId}
                  onChange={(e) => setNewBvsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agent / Shop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bilal Telecom"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Market / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Dargai Main Bazar, Kot, Sakhakot"
                  value={newMarket}
                  onChange={(e) => setNewMarket(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RSO Route / Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="SABIR RSO MARKET">SABIR RSO MARKET (Kot)</option>
                  <option value="RIAZ RSO MARKET">RIAZ RSO MARKET (Haryankot)</option>
                  <option value="KHIZAR ALI RSO MARKET">KHIZAR ALI RSO MARKET (Sakhakot)</option>
                  <option value="MAAZ RSO MARKET">MAAZ RSO MARKET (Dargai Bazar)</option>
                  <option value="FRANCHISE OFFICE">FRANCHISE OFFICE</option>
                  <option value="DSO s">DSO s</option>
                  <option value="BDO">BDO</option>
                  <option value="TKB FCA">TKB FCA</option>
                  <option value="MARKET FCA">MARKET FCA (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Channel Type</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Market FCA">Market FCA</option>
                  <option value="DSO">DSO</option>
                  <option value="Office">Office</option>
                  <option value="BDO">BDO</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT AGENT DETAILS --- */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit BVS Agent</h3>
                <p className="text-xs text-slate-500 font-mono font-bold text-indigo-700">{editingAgent.bvs_id}</p>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgentDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agent / Shop Name</label>
                <input
                  type="text"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Market / Location</label>
                <input
                  type="text"
                  value={editingAgent.market}
                  onChange={(e) => setEditingAgent({ ...editingAgent, market: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category / Group</label>
                <input
                  type="text"
                  value={editingAgent.category}
                  onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Channel</label>
                <select
                  value={editingAgent.channel}
                  onChange={(e) => setEditingAgent({ ...editingAgent, channel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Market FCA">Market FCA</option>
                  <option value="DSO">DSO</option>
                  <option value="Office">Office</option>
                  <option value="BDO">BDO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={editingAgent.status}
                  onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
