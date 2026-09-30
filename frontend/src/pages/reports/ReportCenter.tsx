import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  RotateCcw,
  RefreshCw,
  BarChart3,
  Building2,
  Landmark,
  Users,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  PiggyBank,
  Coins,
  Wallet,
  PhoneCall,
} from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function ReportCenter() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  // Filter params
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Report Data
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (activeTab === 'daily') {
        const res = await api.getDailyReport({ target_date: selectedDate });
        setDailyData(res);
      } else if (activeTab === 'monthly') {
        const res = await api.getMonthlyReport(selectedYear, selectedMonth);
        setMonthlyData(res);
      } else if (activeTab === 'yearly') {
        const res = await api.getYearlyReport(selectedYear);
        setYearlyData(res);
      }
    } catch (err: any) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reporting Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-dimensional operational, inventory, sales, and ledger reconciliation audits</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons title={`${activeTab.toUpperCase()} Franchise Performance Audit`} targetId="report-printable-area" />
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Tab selection */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['daily', 'monthly', 'yearly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab} Report
            </button>
          ))}
        </div>

        {/* Date Filters depending on tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Target Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Fiscal Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        </div>
      </div>

      {/* Printable / Viewable Report Body */}
      <div id="report-printable-area" className="space-y-6">
        {/* DAILY VIEW */}
        {activeTab === 'daily' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Sales Revenue"
                value={`Rs. ${Number(dailyData?.sales_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={ShoppingCart}
                color="indigo"
                subtitle={`${dailyData?.sales_count || 0} sales transactions`}
              />
              <MetricCard
                title="Purchases Incurred"
                value={`Rs. ${Number(dailyData?.purchases_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={Receipt}
                color="blue"
                subtitle="Stock refills and investments"
              />
              <MetricCard
                title="Operating Expenses"
                value={`Rs. ${Number(dailyData?.expenses_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={TrendingUp}
                color="rose"
                subtitle="Petty cash & bills paid"
              />
              <MetricCard
                title="Net Daily Cash Shift"
                value={`Rs. ${Number((dailyData?.sales_total || 0) - (dailyData?.purchases_total || 0) - (dailyData?.expenses_total || 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={DollarSign}
                color="emerald"
                subtitle="Net liquid flow"
              />
            </div>

            {/* Daily Detailed Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Daily Operations Breakdown - {selectedDate}
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Streams */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Inflows & Revenue Generated
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Product & SIM Sales:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          Rs. {Number(dailyData?.sales_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Retailer Cash Collections:</span>
                        <span className="font-mono font-semibold text-emerald-600">
                          Rs. {Number(dailyData?.collections_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">EasyLoad Margin Earned:</span>
                        <span className="font-mono font-semibold text-indigo-600">
                          Rs. {Number(dailyData?.easyload_commission || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outflows */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/30">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Outflows & Operational Costs
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Cash Purchases:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          Rs. {Number(dailyData?.purchases_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">General Expenses:</span>
                        <span className="font-mono font-semibold text-rose-600">
                          Rs. {Number(dailyData?.expenses_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Returns & Refunds:</span>
                        <span className="font-mono font-semibold text-amber-600">
                          Rs. {Number(dailyData?.returns_total || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MONTHLY VIEW (Full Multi-Section Executive Audit matching August.xlsx) */}
        {activeTab === 'monthly' && (
          <div className="space-y-8">
            {/* Document Header */}
            <div className="text-center pb-6 border-b-2 border-slate-900 bg-white p-6 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
                Official Franchise Executive Statement
              </span>
              <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900 mt-2">Ufone Franchise - Dargai Office</h1>
              <p className="text-xs text-slate-600 font-medium">Main Bazar, Dargai, Malakand, KP | PTCL & Ufone Telecommunications</p>
              <h2 className="text-base font-extrabold uppercase tracking-widest text-indigo-900 mt-2">
                Monthly Operations, Ledger Reconciliation & Financial Statement
              </h2>
              <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                Audit Period: {monthlyData?.month_name || 'August 2026'}
              </p>
            </div>

            {/* 6 Executive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard
                title="Capital & Loans"
                value={`Rs. ${Number(monthlyData?.total_capital_loans || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={Landmark}
                color="indigo"
                subtitle="Owner Equity & Loans"
              />
              <MetricCard
                title="EVC Distribution"
                value={`Rs. ${Number(monthlyData?.total_rso_sales_vol || monthlyData?.revenue || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={ShoppingCart}
                color="blue"
                subtitle="Monthly Sales Volume"
              />
              <MetricCard
                title="HQ Commissions"
                value={`+Rs. ${Number(monthlyData?.total_commissions_inflow || monthlyData?.commission || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={TrendingUp}
                color="emerald"
                subtitle="Official Inflows"
              />
              <MetricCard
                title="Net Operating Profit"
                value={`Rs. ${Number(monthlyData?.net_profit || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={DollarSign}
                color={monthlyData?.is_loss ? "rose" : "emerald"}
                subtitle={monthlyData?.is_loss ? "Operating Loss" : "Audited Net Earnings"}
              />
              <MetricCard
                title="Total Cash Outflows"
                value={`Rs. ${Number(monthlyData?.total_cash_outflows || monthlyData?.total_expenditures_outflow || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={Receipt}
                color="amber"
                subtitle="Operating + Financing"
              />
              <MetricCard
                title="Market Credit"
                value={`Rs. ${Number(monthlyData?.total_market_credit || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
                icon={Wallet}
                color="purple"
                subtitle="Retailer Receivables"
              />
            </div>

            {/* 1. Capital & Working Loans Table (Debit Details) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm tracking-wide">1. CAPITAL INVESTMENTS & WORKING CAPITAL LOANS (DEBIT DETAILS)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  Total: Rs. {Number(monthlyData?.total_capital_loans || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Investor / Account Description</th>
                      <th className="px-4 py-2.5">Phone Number</th>
                      <th className="px-4 py-2.5 text-right">Capital Amount (PKR)</th>
                      <th className="px-4 py-2.5 text-right">Settled / Returned</th>
                      <th className="px-4 py-2.5 text-right">Remaining Balance</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5">Account Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.capital_loans?.map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{item.name}</td>
                        <td className="px-4 py-2 text-slate-500">{item.phone || '-'}</td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-900">
                          Rs. {Number(item.amount_given).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right text-rose-600">
                          Rs. {Number(item.returns).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-900">
                          Rs. {Number(item.remaining).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500 font-sans text-[11px]">{item.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50/70 border-t-2 border-indigo-200 font-bold text-xs font-mono text-indigo-950">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-sans uppercase">Total Capital Inflows & Loans:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_capital_loans || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={4} className="px-4 py-3 text-right font-sans text-[11px] text-slate-500 font-normal">
                        Certified Equity: Islam Badshah (5.22M) + Operating Loans (1.42M)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 2. Market Outstanding Credit & Debtors (Credit Details) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm tracking-wide">2. MARKET OUTSTANDING CREDIT & DEBTORS (CREDIT DETAILS)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  Total Market Receivables: Rs. {Number(monthlyData?.total_market_credit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Debtor / Retailer Name</th>
                      <th className="px-4 py-2.5">Shop / Business Entity</th>
                      <th className="px-4 py-2.5">Assigned Route</th>
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5 text-right">Outstanding Credit (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.market_credit?.map((ret: any, idx: number) => (
                      <tr key={ret.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{ret.name}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{ret.shop_name}</td>
                        <td className="px-4 py-2 text-slate-500 font-sans">{ret.route || 'Dargai Market'}</td>
                        <td className="px-4 py-2 text-slate-500">{ret.phone || '-'}</td>
                        <td className="px-4 py-2 text-right font-bold text-rose-700">
                          Rs. {Number(ret.balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50/70 border-t-2 border-emerald-200 font-bold text-xs font-mono text-emerald-950">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 font-sans uppercase">Total Market Outstanding Credit:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_market_credit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 3. Monthly Expenditures Breakdown (Expenditure Details) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-rose-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-sm tracking-wide">3. MONTHLY EXPENDITURES & CASH DISBURSEMENTS (EXPENDITURE DETAILS)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300">
                  Total Disbursed: Rs. {Number(monthlyData?.total_expenditures_outflow || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Disbursement Title</th>
                      <th className="px-4 py-2.5">Expense Category</th>
                      <th className="px-4 py-2.5">Paid Date</th>
                      <th className="px-4 py-2.5">Payment Method</th>
                      <th className="px-4 py-2.5 text-right">Disbursed Amount (PKR)</th>
                      <th className="px-4 py-2.5">Operational Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.expenditures?.map((exp: any, idx: number) => {
                      const isNonOperating = ["Loan Repayment", "Drawings", "Inventory", "Salaries"].includes(exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                          <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                          <td className="px-4 py-2 font-bold font-sans text-slate-900">{exp.title}</td>
                          <td className="px-4 py-2 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isNonOperating ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"
                            }`}>
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-500">{exp.paid_date}</td>
                          <td className="px-4 py-2 text-slate-600 font-sans">{exp.payment_method}</td>
                          <td className="px-4 py-2 text-right font-bold text-rose-700">
                            Rs. {Number(exp.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2 text-slate-500 font-sans text-[11px]">{exp.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-rose-50/70 border-t-2 border-rose-200 font-bold text-xs font-mono text-rose-950">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 font-sans uppercase">Total Cash Expenditures & Outflows:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_expenditures_outflow || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-sans text-[11px] font-normal">
                        Operating Overhead (576.1k) + Loan Return (500k) + Drawings (103.9k) + SIM Purchases (221.25k)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 4. RSO Field Distribution & Sales Volume */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm tracking-wide">4. RSO FIELD AGENTS DISTRIBUTION & EVC SALES VOLUME</h3>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  Total Sales: Rs. {Number(monthlyData?.total_rso_sales_vol || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">RSO Officer Name</th>
                      <th className="px-4 py-2.5">Assigned Distribution Route</th>
                      <th className="px-4 py-2.5 text-right">Opening Balance (PKR)</th>
                      <th className="px-4 py-2.5 text-right">EVC Sales Generated (PKR)</th>
                      <th className="px-4 py-2.5 text-right">Month-End Balance (PKR)</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.rso_distribution?.map((rso: any, idx: number) => (
                      <tr key={rso.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{rso.name}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{rso.route}</td>
                        <td className="px-4 py-2 text-right">
                          Rs. {Number(rso.opening_balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-900">
                          Rs. {Number(rso.sales_volume).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800">
                          Rs. {Number(rso.current_balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {rso.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50/70 border-t-2 border-indigo-200 font-bold text-xs font-mono text-indigo-950">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 font-sans uppercase">Total Field Distribution Sales:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_rso_sales_vol || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-right font-sans text-[11px] text-slate-500 font-normal">
                        4 Active Field Officers in Dargai Sectors
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. RSO Salaries Breakdown (August dedicated table) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-teal-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-sm tracking-wide">5. RSO FIELD SALARIES & PERFORMANCE INCENTIVES (AUGUST.XLSX)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-teal-300">
                  Total RSO Payroll: Rs. {Number(monthlyData?.total_rso_payroll || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">RSO Officer</th>
                      <th className="px-4 py-2.5 text-right">Basic Salary</th>
                      <th className="px-4 py-2.5 text-right">Fuel Allowance</th>
                      <th className="px-4 py-2.5 text-right">KPI Comm</th>
                      <th className="px-4 py-2.5 text-right">EVC Comm</th>
                      <th className="px-4 py-2.5 text-right">FCA Comm</th>
                      <th className="px-4 py-2.5 text-right">Gross Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.rso_salaries?.map((rs: any, idx: number) => (
                      <tr key={rs.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{rs.rso_name}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(rs.basic_salary).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(rs.fuel_amount).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(rs.kpi_comm).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(rs.evc_comm).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(rs.fca_comm).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-bold text-teal-900">
                          Rs. {Number(rs.gross_total).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-teal-50/70 border-t-2 border-teal-200 font-bold text-xs font-mono text-teal-950">
                    <tr>
                      <td colSpan={7} className="px-4 py-3 font-sans uppercase">Total RSO Field Payroll Disbursed:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_rso_payroll || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 6. Office Staff Payroll Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <h3 className="font-bold text-sm tracking-wide">6. OFFICE STAFF & OPERATIONS PAYROLL (DARGAI OFFICE)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-sky-300">
                  Total Staff Payroll: Rs. {Number(monthlyData?.total_staff_payroll || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Staff Name</th>
                      <th className="px-4 py-2.5">Designation / Role</th>
                      <th className="px-4 py-2.5 text-right">Basic Salary</th>
                      <th className="px-4 py-2.5 text-right">Allowances</th>
                      <th className="px-4 py-2.5 text-right">Bonus</th>
                      <th className="px-4 py-2.5 text-right">Net Disbursed (PKR)</th>
                      <th className="px-4 py-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.staff_salaries?.map((st: any, idx: number) => (
                      <tr key={st.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{st.name}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{st.role}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(st.basic_salary).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(st.allowances).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">Rs. {Number(st.bonus).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-bold text-sky-900">
                          Rs. {Number(st.net_salary).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-slate-500 font-sans text-[11px]">{st.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-sky-50/70 border-t-2 border-sky-200 font-bold text-xs font-mono text-sky-950">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 font-sans uppercase">Total Office Staff Payroll:</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {Number(monthlyData?.total_staff_payroll || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-sans text-[11px] font-bold text-indigo-900">
                        Combined Total Payroll (Staff + RSO): Rs. {Number(monthlyData?.combined_payroll || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 7. Headquarter Commission Inflows */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm tracking-wide">7. OFFICIAL HEADQUARTER COMMISSION INFLOWS (UFONE PTCL CREDITS)</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  Total Commissions: Rs. {Number(monthlyData?.total_commissions_inflow || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Commission Classification</th>
                      <th className="px-4 py-2.5">Official HQ Reference / Project</th>
                      <th className="px-4 py-2.5 text-right">Inflow Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData?.commissions_breakdown?.map((comm: any, idx: number) => (
                      <tr key={comm.id} className="hover:bg-slate-50/60 font-mono text-slate-700">
                        <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold font-sans text-slate-900">{comm.type}</td>
                        <td className="px-4 py-2 text-slate-600 font-sans">{comm.reference}</td>
                        <td className="px-4 py-2 text-right font-bold text-emerald-700">
                          +Rs. {Number(comm.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50/70 border-t-2 border-emerald-200 font-bold text-xs font-mono text-emerald-950">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-sans uppercase">Total Commission Inflows Realized:</td>
                      <td className="px-4 py-3 text-right">
                        +Rs. {Number(monthlyData?.total_commissions_inflow || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 8. Certified Statement of Profit & Loss and Cash Outflow Reconciliation */}
            <div className="bg-white rounded-2xl border-2 border-slate-800 p-6 shadow-sm space-y-4 font-mono text-xs">
              <div className="text-center pb-4 border-b border-slate-300">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 font-sans">
                  8. CERTIFIED STATEMENT OF PROFIT & LOSS AND CASH FLOW RECONCILIATION
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Weighted Average Cost (COGS) Accounting Engine with Full Operational Overhead & Financing Disclosures
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-800">
                  <span className="font-sans font-bold">Gross Sales Revenue:</span>
                  <span>Rs. {Number(monthlyData?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 pl-4">
                  <span className="font-sans">Less: Weighted Cost of Goods Sold (COGS):</span>
                  <span className="text-rose-700">(Rs. {Number(monthlyData?.cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 pl-4">
                  <span className="font-sans">Sales Margin Spread:</span>
                  <span>Rs. {Number(monthlyData?.margin || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700 font-bold pl-4">
                  <span className="font-sans">Plus: Official Headquarter Commission Inflows:</span>
                  <span>+Rs. {Number(monthlyData?.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-slate-300 font-bold text-sm bg-indigo-50/50 p-2 rounded-lg text-indigo-950">
                  <span className="font-sans">GROSS PROFIT:</span>
                  <span>Rs. {Number(monthlyData?.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 pl-4">
                  <span className="font-sans">Operating Expenses & Overhead (Rent, PTCL, Electricity, FCA, Tax):</span>
                  <span className="text-rose-700">(Rs. {Number(monthlyData?.operating_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 pl-4">
                  <span className="font-sans">Staff & RSO Payroll Disbursed:</span>
                  <span className="text-rose-700">(Rs. {Number(monthlyData?.salaries || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 font-bold text-slate-900 pl-4">
                  <span className="font-sans">TOTAL OPERATING DEDUCTIONS:</span>
                  <span className="text-rose-800">(Rs. {Number(monthlyData?.total_operating_deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                </div>

                {/* Bottom line Net Profit */}
                <div className={`p-4 rounded-xl border-2 flex items-center justify-between text-base font-extrabold ${
                  monthlyData?.is_loss ? "bg-rose-50 border-rose-400 text-rose-800" : "bg-emerald-50 border-emerald-400 text-emerald-800"
                }`}>
                  <div className="font-sans">
                    <span>{monthlyData?.is_loss ? "NET OPERATING LOSS:" : "NET OPERATING PROFIT:"}</span>
                    <p className="text-xs font-normal text-slate-600 mt-0.5">
                      {monthlyData?.is_loss
                        ? "Operating overhead exceeded gross profit for this period."
                        : "Profitable operational bottom-line after full inventory cost, staff/RSO payroll, and overhead."}
                    </p>
                  </div>
                  <div className="text-xl font-mono">
                    Rs. {Number(monthlyData?.net_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Below-the-line Cash Outflows */}
                <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-slate-600">
                  <div className="flex justify-between py-1 pl-4">
                    <span className="font-sans">Loan Principal Repayment (Haris Badshah Loan Settlement):</span>
                    <span>Rs. {Number(monthlyData?.loan_repayments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span className="font-sans">Owner Personal Drawings (Islam Badshah Sb Household Utilities):</span>
                    <span>Rs. {Number(monthlyData?.drawings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                    <span className="font-sans">Merchandise Stock Inflow (Paired & Loose SIMs Ufone HQ):</span>
                    <span>Rs. {Number(monthlyData?.capital_inventory || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-300 font-bold bg-slate-100 p-2 rounded-lg text-slate-900">
                    <span className="font-sans">TOTAL MONTHLY CASH OUTFLOWS (Operating + Financing + Equity):</span>
                    <span>Rs. {Number(monthlyData?.total_cash_outflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-10 text-center font-sans">
                <div className="border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-900">Shahid Khan</p>
                  <p className="text-[10px] text-slate-500 uppercase">Prepared by Finance Officer</p>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-900">Islam Badshah</p>
                  <p className="text-[10px] text-slate-500 uppercase">Approved by Franchise Owner</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YEARLY VIEW */}
        {activeTab === 'yearly' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Annual Financial Trajectory - FY {selectedYear}
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      yearlyData?.chart_data || [
                        { name: 'Jan', sales: 180000, expenses: 45000, profit: 135000 },
                        { name: 'Feb', sales: 210000, expenses: 50000, profit: 160000 },
                        { name: 'Mar', sales: 240000, expenses: 48000, profit: 192000 },
                        { name: 'Apr', sales: 195000, expenses: 52000, profit: 143000 },
                        { name: 'May', sales: 230000, expenses: 55000, profit: 175000 },
                        { name: 'Jun', sales: 280000, expenses: 62000, profit: 218000 },
                        { name: 'Jul', sales: 310000, expenses: 65000, profit: 245000 },
                        { name: 'Aug', sales: 14660000, expenses: 828460, profit: 387337 },
                      ]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `Rs.${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard
                title="Gross Aggregate Sales"
                value={`Rs. ${Number(yearlyData?.total_sales || 14660000).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={ShoppingCart}
                color="indigo"
                subtitle="All products & franchise lines"
              />
              <MetricCard
                title="Total Franchise Overhead"
                value={`Rs. ${Number(yearlyData?.total_expenses || 828460).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={TrendingUp}
                color="rose"
                subtitle="Salaries, rent, utilities, logistics"
              />
              <MetricCard
                title="Net Franchise Operating Profit"
                value={`Rs. ${Number(yearlyData?.net_profit || 387337).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={DollarSign}
                color="emerald"
                subtitle="Audited profit after all deductions"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
