const API_BASE = '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('zona_pos_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || 'Terjadi kesalahan sistem';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerTenant: (payload) => request('/auth/register-tenant', { method: 'POST', body: JSON.stringify(payload) }),
  getCurrentUser: () => request('/auth/me'),

  // Outlets
  getOutlets: () => request('/outlets'),
  createOutlet: (data) => request('/outlets', { method: 'POST', body: JSON.stringify(data) }),
  updateOutlet: (id, data) => request(`/outlets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users
  getUsers: (outletId) => request(`/users${outletId ? `?outletId=${outletId}` : ''}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id, data) => request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
  toggleUserStatus: (id) => request(`/users/${id}/toggle-status`, { method: 'PATCH' }),

  // Master
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  getUnits: () => request('/units'),
  createUnit: (data) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
  getStorages: () => request('/storages'),
  createStorage: (data) => request('/storages', { method: 'POST', body: JSON.stringify(data) }),

  // Products & Prices
  getProducts: (outletId) => request(`/products${outletId ? `?outletId=${outletId}` : ''}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  addVariant: (productId, data) => request(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),
  setPrice: (data) => request('/prices', { method: 'POST', body: JSON.stringify(data) }),
  getPriceHistory: (priceId) => request(`/prices/history/${priceId}`),

  // Stocks
  getStocksByOutlet: (outletId) => request(`/stocks/outlet/${outletId}`),
  getStocksByStorage: (storageId) => request(`/stocks/storage/${storageId}`),
  getLowStockAlert: (outletId) => request(`/stocks/low-stock/${outletId}`),
  adjustStock: (data) => request('/stocks/adjustment', { method: 'POST', body: JSON.stringify(data) }),
  purchaseStock: (data) => request('/stocks/purchase', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data) => request('/stocks/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getStockHistory: (stockId) => request(`/stocks/history/${stockId}`),

  // Shifts
  openShift: (data) => request('/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (id, data) => request(`/shifts/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
  getActiveShift: () => request('/shifts/active'),
  getShiftsByOutlet: (outletId) => request(`/shifts/outlet/${outletId}`),

  // Transactions
  holdOrder: (data) => request('/transactions/hold', { method: 'POST', body: JSON.stringify(data) }),
  checkout: (data) => request('/transactions/checkout', { method: 'POST', body: JSON.stringify(data) }),
  refund: (id, data) => request(`/transactions/${id}/refund`, { method: 'POST', body: JSON.stringify(data) }),
  getTransactions: (outletId, status) => request(`/transactions?outletId=${outletId}${status ? `&status=${status}` : ''}`),
  getTransactionDetail: (id) => request(`/transactions/${id}`),

  // Customers
  getCustomers: () => request('/customers'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerTransactions: (customerId) => request(`/customers/${customerId}/transactions`),

  // Reports
  getSalesReport: (outletId, startDate, endDate) => {
    let query = [];
    if (outletId) query.push(`outletId=${outletId}`);
    if (startDate) query.push(`startDate=${startDate}`);
    if (endDate) query.push(`endDate=${endDate}`);
    return request(`/reports/sales${query.length ? `?${query.join('&')}` : ''}`);
  },
  getGrossProfitReport: (outletId, startDate, endDate) => {
    let query = [];
    if (outletId) query.push(`outletId=${outletId}`);
    if (startDate) query.push(`startDate=${startDate}`);
    if (endDate) query.push(`endDate=${endDate}`);
    return request(`/reports/gross-profit${query.length ? `?${query.join('&')}` : ''}`);
  },
};
