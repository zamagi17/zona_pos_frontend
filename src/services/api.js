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

  // Shifts & Cash Movements (Petty Cash)
  openShift: (data) => request('/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (id, data) => request(`/shifts/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
  getActiveShift: () => request('/shifts/active'),
  getShiftsByOutlet: (outletId) => request(`/shifts/outlet/${outletId}`),
  createCashMovement: (data) => request('/shifts/movements', { method: 'POST', body: JSON.stringify(data) }),
  getCashMovements: (shiftId) => request(`/shifts/${shiftId}/movements`),
  getActiveShiftMovements: () => request('/shifts/active/movements'),

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
  getCustomerUnpaidBills: (customerId) => request(`/customers/${customerId}/unpaid-bills`),
  settleCustomerDebt: (customerId, data) => request(`/customers/${customerId}/settle-debt`, { method: 'POST', body: JSON.stringify(data) }),

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

  // Promotions & Vouchers (Klaster 3)
  getActivePromotions: (outletId) => request(`/promotions${outletId ? `?outletId=${outletId}` : ''}`),
  validatePromotion: (data) => request('/promotions/validate', { method: 'POST', body: JSON.stringify(data) }),
  getAllPromotions: () => request('/promotions/all'),
  createPromotion: (data) => request('/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updatePromotion: (id, data) => request(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePromotion: (id) => request(`/promotions/${id}`, { method: 'DELETE' }),
  togglePromotionStatus: (id) => request(`/promotions/${id}/toggle-status`, { method: 'PATCH' }),

  // Receipt & Store Settings (Klaster 4)
  getReceiptSetting: (outletId) => request(`/receipt-settings${outletId ? `?outletId=${outletId}` : ''}`),
  saveReceiptSetting: (data) => request('/receipt-settings', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers & Purchase Orders (Klaster 6)
  getSuppliers: (onlyActive) => request(`/suppliers${onlyActive !== undefined ? `?onlyActive=${onlyActive}` : ''}`),
  getSupplierById: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  toggleSupplierStatus: (id) => request(`/suppliers/${id}/toggle-status`, { method: 'PATCH' }),
  getPurchaseHistory: (productId, variantId) => request(`/suppliers/history?productId=${productId}${variantId ? `&variantId=${variantId}` : ''}`),
  getLastPurchasePrice: (productId, variantId) => request(`/suppliers/last-price?productId=${productId}${variantId ? `&variantId=${variantId}` : ''}`),
  getAllPurchaseOrders: (params = {}) => {
    const query = [];
    if (params.supplierId) query.push(`supplierId=${params.supplierId}`);
    if (params.storageId) query.push(`storageId=${params.storageId}`);
    if (params.outletId) query.push(`outletId=${params.outletId}`);
    if (params.startDate) query.push(`startDate=${params.startDate}`);
    if (params.endDate) query.push(`endDate=${params.endDate}`);
    if (params.search) query.push(`search=${encodeURIComponent(params.search)}`);
    return request(`/suppliers/purchase-orders${query.length ? `?${query.join('&')}` : ''}`);
  },
};
