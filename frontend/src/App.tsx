import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './pages/auth/Login';

// Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProductsList } from './pages/products/ProductsList';
import { StockOverview } from './pages/stock/StockOverview';
import { PurchasesList } from './pages/purchases/PurchasesList';
import { SalesList } from './pages/sales/SalesList';
import ReturnsList from './pages/returns/ReturnsList';
import { RSODailyReportForm } from './pages/rso/RSODailyReportForm';
import EasyLoadList from './pages/easyload/EasyLoadList';
import RetailersList from './pages/retailers/RetailersList';
import RetailerCollections from './pages/retailers/RetailerCollections';
import StaffList from './pages/staff/StaffList';
import { SalariesList } from './pages/salaries/SalariesList';
import { ExpensesList } from './pages/expenses/ExpensesList';
import { ProfitLoss } from './pages/finance/ProfitLoss';
import { CompanyCredit } from './pages/finance/CompanyCredit';
import { Ledger } from './pages/finance/Ledger';
import { CashManagement } from './pages/finance/CashManagement';
import Investments from './pages/finance/Investments';
import Commissions from './pages/finance/Commissions';
import ReportCenter from './pages/reports/ReportCenter';
import UsersList from './pages/administration/UsersList';
import SettingsPage from './pages/administration/SettingsPage';
import AuditLogsPage from './pages/administration/AuditLogsPage';
import { FCAPerformancePage } from './pages/fca/FCAPerformancePage';

import { api } from './api/client';

const TAB_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Overview', subtitle: 'Live telecom shop KPIs, financial health, and stock monitoring' },
  products: { title: 'Product Catalog', subtitle: 'Manage telecom handsets, SIM cards, scratch cards, and accessories' },
  categories: { title: 'Product Categories', subtitle: 'Organize inventory into SIMs, scratch cards, handsets, and services' },
  stock: { title: 'Stock & Inventory', subtitle: 'Real-time stock on hand, valuation, reorder alerts, and physical adjustments' },
  purchases: { title: 'Purchases & Inward Stock', subtitle: 'Record inventory vendor purchases with cash or telecom company credit' },
  sales: { title: 'POS Sales & Counter Billing', subtitle: 'Quick cash sales, barcode scanning, thermal receipt printing, and invoices' },
  returns: { title: 'Returns & Reversals', subtitle: 'Defective SIM/handset customer returns and investor capital return vouchers' },
  rso: { title: 'RSO Field Distribution', subtitle: 'Retail Sales Officers daily route dispatching, stock movement, and reconciliation' },
  'rso-daily': { title: 'RSO Daily Sales & Recovery Report', subtitle: 'Official 9-item denomination verified digital sales voucher with physical signature slip' },
  'rso-weekly': { title: 'RSO Weekly Performance Audit', subtitle: 'Cumulative weekly field recoveries and retailer distribution quotas' },
  'rso-monthly': { title: 'RSO Monthly Route Analysis', subtitle: 'Monthly commission calculations and target reconciliations' },
  'fca-performance': { title: 'FCA & BVS Monthly Progress Ledger', subtitle: 'Unified master tracking across all 3 sheets of FCA Table and dynamic monthly Excel uploads' },
  easyload: { title: 'EasyLoad Management', subtitle: 'Direct subscriber e-load, retailer balance dispatching, and 2.5% franchise margins' },
  'retailer-collections': { title: 'Retailer Collections History', subtitle: 'Audit log of all recovered credit payments and deposits from partner shops' },
  retailers: { title: 'Retailer Distribution Network', subtitle: 'Authorized shop accounts, credit balances, and collections' },
  staff: { title: 'Staff & Team Directory', subtitle: 'Franchise managers, sales representatives, RSOs, and cashier staff' },
  salaries: { title: 'Staff Payroll & Salaries', subtitle: 'Monthly salary disbursements, payment methods, and pending dues' },
  expenses: { title: 'Franchise Expenses', subtitle: 'Daily petty cash, utilities, logistics, maintenance, and operational overhead' },
  pnl: { title: 'Profit & Loss Statement', subtitle: 'Weighted Average Cost COGS, gross margin, operating expenses, and net net profit' },
  'company-credit': { title: 'Company Credit & Payables', subtitle: 'PTCL / Ufone credit line tracking, inward invoice settlements without false cash leakage' },
  ledger: { title: 'General Accounting Ledger', subtitle: 'Double-entry balanced audit transactions for asset, liability, equity, and expense' },
  'cash-management': { title: 'Cash Drawer & Denominations', subtitle: 'Daily physical cash audit from Rs. 5000 down to Rs. 10 notes' },
  investments: { title: 'Investor Capital Portfolios', subtitle: 'External financing tracking, capital utilization in purchases, and dividend returns' },
  commissions: { title: 'Telecom Commissions & Targets', subtitle: 'Ufone activation incentives, MNP targets, e-load commissions, and payout audit' },
  reports: { title: 'Executive Reporting Hub', subtitle: 'Multi-dimensional daily, monthly, and yearly audits with Excel and PDF export' },
  users: { title: 'Users & Access Control', subtitle: 'Security permissions, role-based access control, and operator accounts' },
  settings: { title: 'Franchise Configuration', subtitle: 'Franchise legal name, branch address, contact details, tax, and print headers' },
  'audit-logs': { title: 'Security & Audit Trail', subtitle: 'Immutable forensic ledger of all system modifications, deletes, and entries' },
};

function MainApp() {
  const { user, isLoading } = useAuth();
  const isViewer = user?.role?.toLowerCase() === 'viewer';
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Default routing based on user identity and role
  useEffect(() => {
    if (user) {
      if (user.email?.toLowerCase().includes('shakeel') || user.name?.toLowerCase().includes('shakil') || user.name?.toLowerCase().includes('shakeel')) {
        setCurrentTab('fca-performance');
      } else if (user.role?.toLowerCase() === 'viewer') {
        setCurrentTab('reports');
      } else {
        setCurrentTab('dashboard');
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && !isViewer) {
      api.getLowStockAlerts()
        .then((alerts) => setLowStockCount(alerts.length))
        .catch(() => {});
    }
  }, [user, isViewer]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Initializing Ufone Franchise POS System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const allowedViewerTabs = [
    'reports', 'dashboard', 'pnl', 'ledger', 'audit-logs',
    'rso-daily', 'rso-weekly', 'rso-monthly',
    'expenses', 'salaries', 'retailers', 'sales', 'purchases', 'stock', 'company-credit'
  ];

  const handleNavigate = (tabId: string) => {
    if (isViewer && !allowedViewerTabs.includes(tabId)) {
      setCurrentTab('reports');
      return;
    }
    setCurrentTab(tabId);
  };

  const tabMeta = TAB_CONFIG[currentTab] || { title: 'Franchise Management', subtitle: '' };

  const renderContent = () => {
    if (isViewer && !allowedViewerTabs.includes(currentTab)) {
      return (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center justify-between">
            <span>Logged in as <strong>Islam Badshah (Franchise Owner - Executive Audit & Reports View)</strong>. Operational counter transactions are restricted. You can view all financial reports, statements, security audit logs, and download/print documents.</span>
          </div>
          <ReportCenter />
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'products':
      case 'categories':
        return <ProductsList />;
      case 'stock':
        return <StockOverview />;
      case 'purchases':
        return <PurchasesList />;
      case 'sales':
        return <SalesList />;
      case 'returns':
        return <ReturnsList />;
      case 'rso':
      case 'rso-daily':
      case 'rso-weekly':
      case 'rso-monthly':
        return <RSODailyReportForm />;
      case 'fca-performance':
        return <FCAPerformancePage />;
      case 'easyload':
        return <EasyLoadList />;
      case 'retailer-collections':
        return <RetailerCollections />;
      case 'retailers':
        return <RetailersList />;
      case 'staff':
        return <StaffList />;
      case 'salaries':
        return <SalariesList />;
      case 'expenses':
        return <ExpensesList />;
      case 'pnl':
        return <ProfitLoss />;
      case 'company-credit':
        return <CompanyCredit />;
      case 'ledger':
        return <Ledger />;
      case 'cash-management':
        return <CashManagement />;
      case 'investments':
        return <Investments />;
      case 'commissions':
        return <Commissions />;
      case 'reports':
        return <ReportCenter />;
      case 'users':
        return <UsersList />;
      case 'settings':
        return <SettingsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Dark Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={tabMeta.title}
          subtitle={tabMeta.subtitle}
          onOpenPos={() => handleNavigate('sales')}
          lowStockCount={lowStockCount}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100/70">
          <div className="max-w-7xl mx-auto">
            {isViewer && (
              <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-900">
                    Logged in as <strong>Islam Badshah</strong> (Role: Franchise Owner - Audit & Reports View). You have full access to view all reports, financial summaries, security logs, and print or download documents.
                  </span>
                </div>
                <button
                  onClick={() => handleNavigate('reports')}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Go to Report Center
                </button>
              </div>
            )}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
