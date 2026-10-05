import React, { useState, useEffect } from "react";
import {
  CalendarDays, Plus, Search, Printer, CheckCircle2,
  AlertTriangle, Users, Calculator, ArrowRight, ShieldCheck, FileText
} from "lucide-react";
import { api } from "../../api/client";
import { RSO, RSODailyReport, RSOItem } from "../../types";
import { Modal } from "../../components/common/Modal";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ExportPrintButtons, printTargetContent } from "../../components/common/ExportPrintButtons";

export const RSODailyReportForm: React.FC = () => {
  const [reports, setReports] = useState<RSODailyReport[]>([]);
  const [rsos, setRsos] = useState<RSO[]>([]);
  const [selectedRso, setSelectedRso] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<RSODailyReport | null>(null);

  // New Report State with 9 Standard Telecom items
  const [reportForm, setReportForm] = useState({
    rso_id: "",
    date: new Date().toISOString().split("T")[0],
    route: "",
    easyload_opening: "45000",
    easyload_issuance: "20000",
    easyload_retailer_transfer: "18000",
    easyload_closing: "47000",
    finance_remarks: "",
    rso_signature: "",
    sd_signature: "",
    finance_signature: ""
  });

  const [items, setItems] = useState<any[]>([
    { item_name: "Pre Paid SIM", opening_balance: 50, new_issue: 20, sale: 15, closing_in_hand: 55, rate: 100, total_amount: 1500, remarks: "" },
    { item_name: "SC 100", opening_balance: 100, new_issue: 50, sale: 40, closing_in_hand: 110, rate: 100, total_amount: 4000, remarks: "" },
    { item_name: "EC 350", opening_balance: 60, new_issue: 30, sale: 25, closing_in_hand: 65, rate: 350, total_amount: 8750, remarks: "" },
    { item_name: "Rep SIM", opening_balance: 20, new_issue: 10, sale: 5, closing_in_hand: 25, rate: 50, total_amount: 250, remarks: "" },
    { item_name: "Eload SIM", opening_balance: 15, new_issue: 5, sale: 3, closing_in_hand: 17, rate: 100, total_amount: 300, remarks: "" },
    { item_name: "EC 600", opening_balance: 30, new_issue: 15, sale: 10, closing_in_hand: 35, rate: 600, total_amount: 6000, remarks: "" },
    { item_name: "Wingle", opening_balance: 5, new_issue: 2, sale: 0, closing_in_hand: 7, rate: 2500, total_amount: 0, remarks: "" },
    { item_name: "MIFI", opening_balance: 4, new_issue: 2, sale: 0, closing_in_hand: 6, rate: 4500, total_amount: 0, remarks: "" },
    { item_name: "Hand Set", opening_balance: 3, new_issue: 2, sale: 1, closing_in_hand: 4, rate: 3200, total_amount: 3200, remarks: "" },
  ]);

  // Cash Denominations (5000, 1000, 500, 100, 50, 20, 10)
  const [denominations, setDenominations] = useState<Record<number, number>>({
    5000: 3,
    1000: 5,
    500: 4,
    100: 5,
    50: 0,
    20: 0,
    10: 0
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reps, rsoList] = await Promise.all([
        api.getRsoDailyReports({
          rso_id: selectedRso !== "All" ? Number(selectedRso) : undefined,
          date_from: dateFilter || undefined
        }),
        api.getRsos()
      ]);
      setReports(reps);
      setRsos(rsoList);
    } catch (err) {
      console.error("RSO reports load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRso, dateFilter]);

  const handleItemChange = (index: number, field: string, val: number) => {
    const updated = [...items];
    updated[index][field] = val;

    // Automatic calculation: Closing = Opening + New Issue - Sale
    if (field === "opening_balance" || field === "new_issue" || field === "sale") {
      const op = Number(updated[index].opening_balance) || 0;
      const ni = Number(updated[index].new_issue) || 0;
      const sl = Number(updated[index].sale) || 0;
      updated[index].closing_in_hand = Math.max(0, op + ni - sl);
    }

    if (field === "sale" || field === "rate") {
      const sl = Number(updated[index].sale) || 0;
      const rt = Number(updated[index].rate) || 0;
      updated[index].total_amount = sl * rt;
    }

    setItems(updated);
  };

  // Denominations calculation
  const totalPhysicalCash = Object.entries(denominations).reduce((acc, [denom, qty]) => {
    return acc + Number(denom) * Number(qty);
  }, 0);

  const totalProductSales = items.reduce((acc, it) => acc + (Number(it.total_amount) || 0), 0);
  const expectedCash = totalProductSales;
  const cashDifference = totalPhysicalCash - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.rso_id) {
      alert("Please select an RSO");
      return;
    }

    try {
      const denomArray = Object.entries(denominations).map(([denom, qty]) => ({
        denomination: Number(denom),
        quantity: Number(qty)
      }));

      await api.createRsoDailyReport({
        rso_id: Number(reportForm.rso_id),
        date: reportForm.date,
        route: reportForm.route,
        items,
        easyload_opening: Number(reportForm.easyload_opening) || 0,
        easyload_issuance: Number(reportForm.easyload_issuance) || 0,
        easyload_retailer_transfer: Number(reportForm.easyload_retailer_transfer) || 0,
        easyload_closing: Number(reportForm.easyload_closing) || 0,
        expected_cash: expectedCash,
        cash_received: totalPhysicalCash,
        denominations: denomArray,
        finance_remarks: reportForm.finance_remarks,
        rso_signature: reportForm.rso_signature,
        sd_signature: reportForm.sd_signature,
        finance_signature: reportForm.finance_signature
      });

      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create RSO daily report");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">RSO Daily Sales Reports</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Digital physical distribution sheets with SIM/Card inventory, EasyLoad reconciliations, and cash denomination envelopes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="rso" title="RSO Daily Sales Reports" targetId="rso-reports-table" />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Daily Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-56">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">RSO Officer</label>
          <select
            value={selectedRso}
            onChange={(e) => setSelectedRso(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="All">All RSO Officers</option>
            {rsos.map(r => (
              <option key={r.id} value={r.id.toString()}>{r.name} ({r.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          />
        </div>

        <div className="self-end">
          <button
            onClick={loadData}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden" id="rso-reports-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Report Code</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">RSO Name</th>
                <th className="py-3 px-6">Route</th>
                <th className="py-3 px-6">Total Sales (PKR)</th>
                <th className="py-3 px-6">Cash Received (PKR)</th>
                <th className="py-3 px-6">Cash Difference</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No RSO reports recorded yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{r.report_code}</td>
                    <td className="py-3.5 px-6 text-slate-500">{r.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">{r.rso_name || `RSO #${r.rso_id}`}</td>
                    <td className="py-3.5 px-6 text-slate-600 truncate max-w-[150px]">{r.route}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      Rs. {Number(r.total_sale_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                      Rs. {Number(r.cash_received).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold">
                      {Number(r.cash_difference) === 0 ? (
                        <span className="text-emerald-600">Matched (0)</span>
                      ) : Number(r.cash_difference) > 0 ? (
                        <span className="text-indigo-600">+Rs. {Number(r.cash_difference)} (Excess)</span>
                      ) : (
                        <span className="text-rose-600">Rs. {Number(r.cash_difference)} (Shortage)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCurrentReport(r);
                          setIsViewOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                      >
                        Print Sheet
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Digital Physical RSO Report Form Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Daily RSO Sales Report"
        subtitle="Complete digital equivalent of the physical Ufone franchise field report"
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">RSO Officer *</label>
              <select
                required
                value={reportForm.rso_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const r = rsos.find(x => x.id.toString() === id);
                  setReportForm(prev => ({
                    ...prev,
                    rso_id: id,
                    route: r ? r.route : prev.route,
                    rso_signature: r ? r.name : ""
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select RSO</option>
                {rsos.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={reportForm.date}
                onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Route</label>
              <input
                type="text"
                value={reportForm.route}
                onChange={(e) => setReportForm({ ...reportForm, route: e.target.value })}
                placeholder="e.g. Route A - Jamrud Road"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Product Items Table (Instruction 15) */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-2">Product Distribution & Sales Table</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Opening</th>
                    <th className="py-2 px-3 text-center">New Issue</th>
                    <th className="py-2 px-3 text-center">Sale</th>
                    <th className="py-2 px-3 text-center">Closing In Hand</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{it.item_name}</td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          value={it.opening_balance}
                          onChange={(e) => handleItemChange(idx, "opening_balance", Number(e.target.value))}
                          className="w-16 px-1.5 py-1 text-center rounded border border-slate-200 font-mono"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          value={it.new_issue}
                          onChange={(e) => handleItemChange(idx, "new_issue", Number(e.target.value))}
                          className="w-16 px-1.5 py-1 text-center rounded border border-slate-200 font-mono text-indigo-700 font-bold"
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <input
                          type="number"
                          value={it.sale}
                          onChange={(e) => handleItemChange(idx, "sale", Number(e.target.value))}
                          className="w-16 px-1.5 py-1 text-center rounded border border-slate-200 font-mono text-emerald-700 font-bold"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                        {it.closing_in_hand}
                      </td>
                      <td className="py-1 px-2 text-right font-mono">
                        Rs. {it.rate}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        Rs. {Number(it.total_amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={6} className="py-2 px-3 text-right text-slate-600">Total Product Sales:</td>
                    <td className="py-2 px-3 text-right font-mono text-sm text-indigo-700">
                      Rs. {totalProductSales.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Easyload & Cash Denomination Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EasyLoad Section (Instruction 16) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">EasyLoad Balance Tracking</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">EasyLoad Opening</label>
                  <input
                    type="number"
                    value={reportForm.easyload_opening}
                    onChange={(e) => setReportForm({ ...reportForm, easyload_opening: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Issuance</label>
                  <input
                    type="number"
                    value={reportForm.easyload_issuance}
                    onChange={(e) => setReportForm({ ...reportForm, easyload_issuance: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sent to Retailers</label>
                  <input
                    type="number"
                    value={reportForm.easyload_retailer_transfer}
                    onChange={(e) => setReportForm({ ...reportForm, easyload_retailer_transfer: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Eload Closing</label>
                  <input
                    type="number"
                    value={reportForm.easyload_closing}
                    onChange={(e) => setReportForm({ ...reportForm, easyload_closing: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono bg-white font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Cash Denominations (Instruction 19) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">Cash Denomination Breakdown</h4>
                <span className="font-mono font-bold text-emerald-700">
                  Total: Rs. {totalPhysicalCash.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[5000, 1000, 500, 100, 50, 20, 10].map(val => (
                  <div key={val} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-slate-700 font-mono">Rs. {val} &times;</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[val]}
                      onChange={(e) => setDenominations({ ...denominations, [val]: Number(e.target.value) || 0 })}
                      className="w-14 px-1.5 py-0.5 text-center border border-slate-200 rounded font-mono"
                    />
                    <span className="font-mono text-slate-600 text-right w-16">
                      = {(val * (denominations[val] || 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Difference Status */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-slate-500">Expected: Rs. {expectedCash.toLocaleString()}</span>
                  <span className="mx-2">&bull;</span>
                  <span className="text-slate-800">Physical: Rs. {totalPhysicalCash.toLocaleString()}</span>
                </div>
                <div className={`font-bold ${cashDifference === 0 ? "text-emerald-600" : (cashDifference > 0 ? "text-indigo-600" : "text-rose-600")}`}>
                  {cashDifference === 0 ? "Balanced" : (cashDifference > 0 ? `+Rs. ${cashDifference} (Excess)` : `Rs. ${cashDifference} (Shortage)`)}
                </div>
              </div>
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
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Submit Daily RSO Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Physical Sheet Modal (Instruction 27) */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Physical RSO Sales Report Print Preview"
        subtitle={currentReport?.report_code}
        maxWidth="3xl"
      >
        {currentReport && (
          <div className="space-y-4 print-container text-xs" id="rso-voucher-printable">
            {/* Physical Report Header */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">Ufone 4G Authorized Franchise</h2>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Daily RSO Sales & Distribution Report</h3>
              <div className="flex justify-between items-center text-xs mt-3 font-semibold">
                <p>RSO Name: <span className="underline">{currentReport.rso_name || "N/A"}</span></p>
                <p>Route: <span className="underline">{currentReport.route}</span></p>
                <p>Date: <span className="underline">{currentReport.date}</span></p>
              </div>
            </div>

            {/* Product Table */}
            <table className="w-full text-left border-collapse border border-slate-900 text-xs">
              <thead className="bg-slate-100 font-bold border-b border-slate-900">
                <tr>
                  <th className="border border-slate-900 p-1.5">Item</th>
                  <th className="border border-slate-900 p-1.5 text-center">Opening</th>
                  <th className="border border-slate-900 p-1.5 text-center">New Issue</th>
                  <th className="border border-slate-900 p-1.5 text-center">Sale</th>
                  <th className="border border-slate-900 p-1.5 text-center">Closing In Hand</th>
                  <th className="border border-slate-900 p-1.5 text-right">Rate</th>
                  <th className="border border-slate-900 p-1.5 text-right">Total (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {currentReport.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-900 p-1.5 font-bold">{it.item_name}</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">{it.opening_balance}</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">{it.new_issue}</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{it.sale}</td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{it.closing_in_hand}</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono">{it.rate}</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono font-bold">{Number(it.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                  <td colSpan={6} className="border border-slate-900 p-1.5 text-right">Total Product Sale:</td>
                  <td className="border border-slate-900 p-1.5 text-right font-mono">
                    Rs. {Number(currentReport.total_sale_amount).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* EasyLoad & Cash Envelope Breakdown */}
            <div className="grid grid-cols-2 gap-4 border border-slate-900 p-3">
              <div>
                <h5 className="font-bold underline mb-1 uppercase text-[11px]">EasyLoad Account Summary</h5>
                <p>Opening Balance: <span className="font-mono">Rs. {Number(currentReport.easyload_opening).toLocaleString()}</span></p>
                <p>New Issuance: <span className="font-mono">Rs. {Number(currentReport.easyload_issuance).toLocaleString()}</span></p>
                <p>Sent to Retailers: <span className="font-mono">Rs. {Number(currentReport.easyload_retailer_transfer).toLocaleString()}</span></p>
                <p className="font-bold">Eload Closing: <span className="font-mono">Rs. {Number(currentReport.easyload_closing).toLocaleString()}</span></p>
              </div>

              <div>
                <h5 className="font-bold underline mb-1 uppercase text-[11px]">Physical Cash Envelope</h5>
                <p>Expected Cash: <span className="font-mono">Rs. {Number(currentReport.expected_cash).toLocaleString()}</span></p>
                <p>Physical Cash: <span className="font-mono">Rs. {Number(currentReport.cash_received).toLocaleString()}</span></p>
                <p className="font-bold">
                  Difference:{" "}
                  <span className="font-mono">
                    {Number(currentReport.cash_difference) === 0 ? "Matched (0)" : `Rs. ${Number(currentReport.cash_difference)}`}
                  </span>
                </p>
              </div>
            </div>

            {/* Signatures Block (Instruction 27) */}
            <div className="pt-8 pb-4 grid grid-cols-3 gap-8 text-center text-xs">
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">{currentReport.rso_signature || currentReport.rso_name || "RSO"}</p>
                <p className="text-[10px] text-slate-500 uppercase">RSO Signature</p>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">{currentReport.sd_signature || "Islam Badshah"}</p>
                <p className="text-[10px] text-slate-500 uppercase">Franchise Owner / S&D Signature</p>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <p className="font-bold">{currentReport.finance_signature || "Shahid Khan"}</p>
                <p className="text-[10px] text-slate-500 uppercase">Finance Officer Signature</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 no-print">
              <button
                onClick={() => printTargetContent('rso-voucher-printable', `RSO Daily Report - ${currentReport?.report_code || ''}`)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Sheet</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
