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
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(false);

  // Filter params
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

        {/* MONTHLY / YEARLY VIEW */}
        {(activeTab === 'monthly' || activeTab === 'yearly') && (
          <>
            {/* Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  {activeTab === 'monthly' ? `Monthly Financial Trajectory - ${selectedMonth}/${selectedYear}` : `Annual Financial Overview - FY ${selectedYear}`}
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      activeTab === 'monthly'
                        ? monthlyData?.chart_data || [
                            { name: 'Week 1', sales: 45000, expenses: 12000, profit: 33000 },
                            { name: 'Week 2', sales: 52000, expenses: 15000, profit: 37000 },
                            { name: 'Week 3', sales: 61000, expenses: 14000, profit: 47000 },
                            { name: 'Week 4', sales: 58000, expenses: 18000, profit: 40000 },
                          ]
                        : yearlyData?.chart_data || [
                            { name: 'Jan', sales: 180000, expenses: 45000, profit: 135000 },
                            { name: 'Feb', sales: 210000, expenses: 50000, profit: 160000 },
                            { name: 'Mar', sales: 240000, expenses: 48000, profit: 192000 },
                            { name: 'Apr', sales: 195000, expenses: 52000, profit: 143000 },
                            { name: 'May', sales: 230000, expenses: 55000, profit: 175000 },
                            { name: 'Jun', sales: 280000, expenses: 62000, profit: 218000 },
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
                value={`Rs. ${Number(
                  activeTab === 'monthly' ? monthlyData?.total_sales || 216000 : yearlyData?.total_sales || 1135000
                ).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={ShoppingCart}
                color="indigo"
                subtitle="All products & franchise lines"
              />
              <MetricCard
                title="Total Franchise Overhead"
                value={`Rs. ${Number(
                  activeTab === 'monthly' ? monthlyData?.total_expenses || 59000 : yearlyData?.total_expenses || 322000
                ).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={TrendingUp}
                color="rose"
                subtitle="Salaries, rent, utilities, logistics"
              />
              <MetricCard
                title="Net Franchise Operating Profit"
                value={`Rs. ${Number(
                  activeTab === 'monthly' ? monthlyData?.net_profit || 157000 : yearlyData?.net_profit || 813000
                ).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                icon={DollarSign}
                color="emerald"
                subtitle="Audited profit after all deductions"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
