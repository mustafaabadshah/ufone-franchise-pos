const API_BASE = (import.meta as any).env?.VITE_API_BASE || 
  (typeof window !== "undefined" && window.location.port === "5173" 
    ? "http://localhost:8000/api/v1" 
    : "/api/v1");

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-logout"));
    throw new Error("Session expired, please log in again.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => apiFetch<{ access_token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch<any>("/auth/me"),

  // Dashboard
  getDashboardMetrics: () => apiFetch<any>("/dashboard/metrics"),
  getDashboardCharts: (period: string = "30_days", startDate?: string, endDate?: string) => {
    let url = `/dashboard/charts?period=${period}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return apiFetch<any>(url);
  },
  getLowStockAlerts: () => apiFetch<any[]>("/dashboard/low-stock-alerts"),

  // Products
  getProducts: (params?: { search?: string; category_id?: number; status_filter?: string; low_stock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category_id) query.append("category_id", params.category_id.toString());
    if (params?.status_filter) query.append("status_filter", params.status_filter);
    if (params?.low_stock) query.append("low_stock", "true");
    return apiFetch<any[]>(`/products?${query.toString()}`);
  },
  createProduct: (data: any) => apiFetch<any>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) => apiFetch<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => apiFetch<any>(`/products/${id}`, { method: "DELETE" }),
  getProductAnalysis: (id: number) => apiFetch<any>(`/products/${id}/analysis`),
  getProductStockHistory: (id: number) => apiFetch<any[]>(`/products/${id}/stock-history`),
  getCategories: () => apiFetch<any[]>("/products/categories"),
  createCategory: (data: any) => apiFetch<any>("/products/categories", { method: "POST", body: JSON.stringify(data) }),

  // Stock
  getStockSummary: () => apiFetch<any>("/stock/summary"),
  getStockItems: (params?: { search?: string; status_filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status_filter) query.append("status_filter", params.status_filter);
    return apiFetch<any[]>(`/stock/items?${query.toString()}`);
  },
  getStockMovements: (params?: { product_id?: number; movement_type?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.product_id) query.append("product_id", params.product_id.toString());
    if (params?.movement_type) query.append("movement_type", params.movement_type);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/stock/movements?${query.toString()}`);
  },
  createStockAdjustment: (data: any) => apiFetch<any>("/stock/adjustments", { method: "POST", body: JSON.stringify(data) }),

  // Purchases
  getPurchases: (params?: { search?: string; date_from?: string; date_to?: string; payment_status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    if (params?.payment_status) query.append("payment_status", params.payment_status);
    return apiFetch<any[]>(`/purchases?${query.toString()}`);
  },
  getPurchasesSummary: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/purchases/summary?${query.toString()}`);
  },
  createPurchase: (data: any) => apiFetch<any>("/purchases", { method: "POST", body: JSON.stringify(data) }),

  // Sales
  getSales: (params?: { search?: string; staff_id?: number; retailer_id?: number; rso_id?: number; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.staff_id) query.append("staff_id", params.staff_id.toString());
    if (params?.retailer_id) query.append("retailer_id", params.retailer_id.toString());
    if (params?.rso_id) query.append("rso_id", params.rso_id.toString());
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/sales?${query.toString()}`);
  },
  getSalesSummary: (params?: { staff_id?: number; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.staff_id) query.append("staff_id", params.staff_id.toString());
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/sales/summary?${query.toString()}`);
  },
  createSale: (data: any) => apiFetch<any>("/sales", { method: "POST", body: JSON.stringify(data) }),

  // Returns
  getReturns: () => apiFetch<any[]>("/returns"),
  createReturn: (data: any) => apiFetch<any>("/returns", { method: "POST", body: JSON.stringify(data) }),

  // RSO
  getRsos: () => apiFetch<any[]>("/rso"),
  createRso: (data: any) => apiFetch<any>("/rso", { method: "POST", body: JSON.stringify(data) }),
  updateRso: (id: number, data: any) => apiFetch<any>(`/rso/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getStandardRsoItems: () => apiFetch<any[]>("/rso/standard-items"),
  getRsoDailyReports: (params?: { rso_id?: number; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.rso_id) query.append("rso_id", params.rso_id.toString());
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/rso/reports/daily?${query.toString()}`);
  },
  createRsoDailyReport: (data: any) => apiFetch<any>("/rso/reports/daily", { method: "POST", body: JSON.stringify(data) }),
  getRsoDailyReport: (id: number) => apiFetch<any>(`/rso/reports/daily/${id}`),
  getRsoSalaries: (month?: string) => apiFetch<any[]>(`/rso/salaries/all${month ? `?month=${month}` : ''}`),
  createRsoSalary: (data: any) => apiFetch<any>("/rso/salaries", { method: "POST", body: JSON.stringify(data) }),

  // EasyLoad
  getEasyloadTransactions: (params?: { msisdn?: string; retailer_id?: number; rso_id?: number; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.msisdn) query.append("msisdn", params.msisdn);
    if (params?.retailer_id) query.append("retailer_id", params.retailer_id.toString());
    if (params?.rso_id) query.append("rso_id", params.rso_id.toString());
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/easyload?${query.toString()}`);
  },
  getEasyloadSummary: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/easyload/summary?${query.toString()}`);
  },
  createEasyloadTransaction: (data: any) => apiFetch<any>("/easyload", { method: "POST", body: JSON.stringify(data) }),

  // Retailers
  getRetailers: (search?: string) => apiFetch<any[]>(`/retailers${search ? `?search=${search}` : ''}`),
  createRetailer: (data: any) => apiFetch<any>("/retailers", { method: "POST", body: JSON.stringify(data) }),
  getRetailerCollections: (params?: { retailer_id?: number; collection_type?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.retailer_id) query.append("retailer_id", params.retailer_id.toString());
    if (params?.collection_type) query.append("collection_type", params.collection_type);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/retailers/collections/all?${query.toString()}`);
  },
  getRetailerCollectionsSummary: () => apiFetch<any>("/retailers/collections/summary"),
  createRetailerCollection: (data: any) => apiFetch<any>("/retailers/collections", { method: "POST", body: JSON.stringify(data) }),

  // Staff & Salaries
  getStaff: () => apiFetch<any[]>("/staff"),
  createStaff: (data: any) => apiFetch<any>("/staff", { method: "POST", body: JSON.stringify(data) }),
  updateStaff: (id: number, data: any) => apiFetch<any>(`/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStaff: (id: number) => apiFetch<any>(`/staff/${id}`, { method: "DELETE" }),

  getSalaries: (params?: { search?: string; month?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.month) query.append("month", params.month);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/salaries?${query.toString()}`);
  },
  getSalariesSummary: (params?: { month?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.month) query.append("month", params.month);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/salaries/summary?${query.toString()}`);
  },
  createSalary: (data: any) => apiFetch<any>("/salaries", { method: "POST", body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params?: { search?: string; category?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/expenses?${query.toString()}`);
  },
  getExpensesSummary: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/expenses/summary?${query.toString()}`);
  },
  getExpenseCategories: () => apiFetch<string[]>("/expenses/categories"),
  createExpense: (data: any) => apiFetch<any>("/expenses", { method: "POST", body: JSON.stringify(data) }),

  // Finance
  getProfitAndLoss: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/finance/profit-and-loss?${query.toString()}`);
  },
  getLedgerAccounts: () => apiFetch<any[]>("/finance/ledger/accounts"),
  getLedgerTransactions: (params?: { reference_type?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.reference_type) query.append("reference_type", params.reference_type);
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any[]>(`/finance/ledger/transactions?${query.toString()}`);
  },
  getCompanyCreditAccounts: () => apiFetch<any[]>("/finance/company-credit/accounts"),
  getCompanyCreditSummary: () => apiFetch<any>("/finance/company-credit/summary"),
  createCompanyCreditPayment: (data: any) => apiFetch<any>("/finance/company-credit/payments", { method: "POST", body: JSON.stringify(data) }),
  getCompanyStatement: (accountId: number) => apiFetch<any>(`/finance/company-credit/${accountId}/statement`),
  verifyCashDenominations: (data: any) => apiFetch<any>("/finance/cash/verify-denominations", { method: "POST", body: JSON.stringify(data) }),
  getInvestments: () => apiFetch<any[]>("/finance/investments"),
  createInvestment: (data: any) => apiFetch<any>("/finance/investments", { method: "POST", body: JSON.stringify(data) }),
  getCommissions: (commission_type?: string) => apiFetch<any[]>(`/finance/commissions${commission_type ? `?commission_type=${commission_type}` : ''}`),
  createCommission: (data: any) => apiFetch<any>("/finance/commissions", { method: "POST", body: JSON.stringify(data) }),

  // Reports
  getDailyReport: (params?: { target_date?: string; rso_id?: number; retailer_id?: number; staff_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.target_date) query.append("target_date", params.target_date);
    if (params?.rso_id) query.append("rso_id", params.rso_id.toString());
    if (params?.retailer_id) query.append("retailer_id", params.retailer_id.toString());
    if (params?.staff_id) query.append("staff_id", params.staff_id.toString());
    return apiFetch<any>(`/reports/daily?${query.toString()}`);
  },
  getWeeklyReport: (params?: { date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    return apiFetch<any>(`/reports/weekly?${query.toString()}`);
  },
  getMonthlyReport: (year: number, month: number) => apiFetch<any>(`/reports/monthly?year=${year}&month=${month}`),
  getYearlyReport: (year: number) => apiFetch<any>(`/reports/yearly?year=${year}`),
  getExcelExportUrl: (reportType: string) => `${API_BASE}/reports/export/excel?report_type=${reportType}`,
  getCsvExportUrl: (reportType: string) => `${API_BASE}/reports/export/csv?report_type=${reportType}`,

  // Settings & Admin
  getSettings: () => apiFetch<any[]>("/settings"),
  updateSetting: (key: string, value: string) => apiFetch<any>(`/settings/${key}`, { method: "PUT", body: JSON.stringify({ key, value }) }),
  getAuditLogs: (params?: { entity?: string; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.entity) query.append("entity", params.entity);
    if (params?.action) query.append("action", params.action);
    return apiFetch<any[]>(`/admin/audit-logs?${query.toString()}`);
  },
  getUsers: () => apiFetch<any[]>("/admin/users"),
  getRoles: () => apiFetch<any[]>("/admin/roles"),
};
