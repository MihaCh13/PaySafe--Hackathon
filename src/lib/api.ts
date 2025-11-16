import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth-storage');
      
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  uploadProfilePhoto: (photo: string) => api.post('/auth/profile/photo', { photo }),
  deleteProfilePhoto: () => api.delete('/auth/profile/photo'),
  setPin: (pin: string) => api.post('/auth/set-pin', { pin }),
  verifyPin: (pin: string) => api.post('/auth/verify-pin', { pin }),
  changePin: (password: string, new_pin: string, confirm_pin: string) => 
    api.post('/auth/change-pin', { password, new_pin, confirm_pin }),
  checkDefaultPin: () => api.get('/auth/check-default-pin'),
};

export const walletAPI = {
  getWallet: () => api.get('/wallet/'),
  topup: (amount: number, method: string) => api.post('/wallet/topup', { amount, method }),
  transfer: (receiver_username: string, amount: number, description?: string) => 
    api.post('/wallet/transfer', { receiver_username, amount, description }),
  generateQRToken: () => api.get('/wallet/qr-payment-token'),
  verifyQRToken: (token: string) => api.post('/wallet/verify-qr-token', { token }),
};

export const transactionsAPI = {
  getTransactions: (page: number = 1, per_page: number = 20, type?: string) => 
    api.get('/transactions', { params: { page, per_page, type } }),
  getTransaction: (id: number) => api.get(`/transactions/${id}`),
  getStats: (period: string = 'last_12_months', date_from?: string, date_to?: string) => 
    api.get('/transactions/stats', { params: { period, date_from, date_to } }),
};

export const cardsAPI = {
  getCards: () => api.get('/cards'),
  createCard: (data: any) => api.post('/cards', data),
  getCard: (id: number) => api.get(`/cards/${id}`),
  freezeCard: (id: number) => api.post(`/cards/${id}/freeze`),
  unfreezeCard: (id: number) => api.post(`/cards/${id}/unfreeze`),
  getSubscriptions: (cardId: number) => api.get(`/cards/${cardId}/subscriptions`),
  addSubscriptionToCard: (cardId: number, data: any) => api.post(`/cards/${cardId}/subscriptions`, data),
  updateSubscription: (cardId: number, subId: number, data: any) => api.put(`/cards/${cardId}/subscriptions/${subId}`, data),
  deleteSubscription: (cardId: number, subId: number) => api.delete(`/cards/${cardId}/subscriptions/${subId}`),
  pauseSubscription: (cardId: number, subId: number) => api.post(`/cards/${cardId}/subscriptions/${subId}/pause`),
  resumeSubscription: (cardId: number, subId: number) => api.post(`/cards/${cardId}/subscriptions/${subId}/resume`),
  // Budget card operations
  allocateFunds: (cardId: number, amount: number) => api.post(`/cards/${cardId}/allocate`, { amount }),
  spendFromCard: (cardId: number, amount: number, description?: string) => 
    api.post(`/cards/${cardId}/spend`, { amount, description }),
  withdrawFromCard: (cardId: number, amount: number) => api.post(`/cards/${cardId}/withdraw`, { amount }),
  getCategories: () => api.get('/cards/categories'),
  // Subscription card operations
  getSubscriptionCard: () => api.get('/cards/subscription-card'),
  getCardCatalog: (cardId: number, category?: string) => api.get(`/cards/${cardId}/catalog`, { params: { category } }),
  // Default payment cards
  getDefaultCards: () => api.get('/cards/default-cards'),
};

export const savingsAPI = {
  getPockets: () => api.get('/savings/pockets'),
  createPocket: (data: any) => api.post('/savings/pockets', data),
  depositToPocket: (pocketId: number, data: { amount: number; pin: string }) => 
    api.post(`/savings/pockets/${pocketId}/deposit`, data),
  withdrawFromPocket: (pocketId: number, data: { amount: number; pin: string; emergencyData?: any }) => 
    api.post(`/savings/pockets/${pocketId}/withdraw`, data),
  updateAutoSave: (pocketId: number, config: any) => 
    api.put(`/savings/pockets/${pocketId}/auto-save`, config),
  getGoals: () => api.get('/savings/goals'),
  createGoal: (data: any) => api.post('/savings/goals', data),
  contributeToGoal: (goalId: number, amount: number) => 
    api.post(`/savings/goals/${goalId}/contribute`, { amount }),
};

export const marketplaceAPI = {
  getListings: (page: number = 1, category?: string, university?: string) => 
    api.get('/marketplace/listings', { params: { page, category, university } }),
  createListing: (data: any) => api.post('/marketplace/listings', data),
  getListing: (id: number) => api.get(`/marketplace/listings/${id}`),
  createOrder: (listingId: number) => api.post('/marketplace/orders', { listing_id: listingId }),
};

export const loansAPI = {
  getLoans: () => api.get('/loans'),
  getAvailableUsers: () => api.get('/loans/available-users'),
  createLoanRequest: (data: any) => api.post('/loans', data),
  approveLoan: (loanId: number) => api.post(`/loans/${loanId}/approve`),
  declineLoan: (loanId: number) => api.post(`/loans/${loanId}/decline`),
  repayLoan: (loanId: number, amount: number) => api.post(`/loans/${loanId}/repay`, { amount }),
  cancelLoan: (loanId: number) => api.post(`/loans/${loanId}/cancel`),
};

export const subscriptionsAPI = {
  getCatalog: (category?: string) => api.get('/subscriptions/catalog', { params: { category } }),
  getSubscriptions: (status?: string) => api.get('/subscriptions', { params: { status } }),
  createSubscription: (data: any) => api.post('/subscriptions', data),
  updateSubscription: (id: number, data: any) => api.put(`/subscriptions/${id}`, data),
  cancelSubscription: (id: number) => api.delete(`/subscriptions/${id}`),
  processPayment: (id: number) => api.post(`/subscriptions/${id}/process-payment`),
  getStatistics: () => api.get('/subscriptions/statistics'),
};

export const isicAPI = {
  linkProfile: (data: any) => api.post('/isic/profile', data),
  getProfile: () => api.get('/isic/profile'),
  updateProfile: (data: any) => api.put('/isic/profile', data),
  unlinkProfile: () => api.delete('/isic/profile'),
  getMerchants: (category?: string) => api.get('/isic/merchants', { params: { category } }),
  getMerchant: (id: number) => api.get(`/isic/merchants/${id}`),
  detectOnlineMerchant: (url: string, domain: string) => api.post('/isic/merchants/detect-online', { url, domain }),
  detectPhysicalMerchant: (merchantId?: string, merchantName?: string) => api.post('/isic/merchants/detect-physical', { merchant_id: merchantId, merchant_name: merchantName }),
  checkDiscount: (merchantId: number, amount: number) => api.post('/isic/discounts/check', { merchant_id: merchantId, amount }),
  applyDiscount: (merchantId: number, amount: number, detectionMethod: string, transactionId?: number) => api.post('/isic/discounts/apply', { merchant_id: merchantId, amount, detection_method: detectionMethod, transaction_id: transactionId }),
  getDiscountHistory: () => api.get('/isic/discounts/history'),
  getSavingsStats: () => api.get('/isic/discounts/savings'),
  getUploadedCardMetadata: () => api.get('/isic/metadata'),
};

export const expectedPaymentsAPI = {
  create: (data: any) => api.post('/expected-payments', data),
  update: (id: number, data: any) => api.put(`/expected-payments/${id}`, data),
  delete: (id: number) => api.delete(`/expected-payments/${id}`),
  generateRecurring: (paymentId: number, months: number = 3) => 
    api.post('/expected-payments/generate-recurring', { payment_id: paymentId, months }),
};
