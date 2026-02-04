const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  // Wallet Management
  WALLET: `${API_BASE_URL}/api/wallet`,
  WALLET_ADD: `${API_BASE_URL}/api/wallet/add`,
  WALLET_SPEND: `${API_BASE_URL}/api/wallet/spend`,
  WALLET_RESET: `${API_BASE_URL}/api/wallet/reset`,

  // Transaction Management
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
  TRANSACTION_BY_ID: (transactionId) => `${API_BASE_URL}/api/transactions/${transactionId}`,
  TRANSACTION_PARSE_AI: `${API_BASE_URL}/api/transactions/parse-ai`,
  TRANSACTION_PARSE_RECEIPT: `${API_BASE_URL}/api/transactions/parse-receipt`,
  TRANSACTION_FANCY: `${API_BASE_URL}/api/transactions/fancy-popup`,

  // Recurring Transactions
  RECURRING: `${API_BASE_URL}/api/recurring`,
  RECURRING_BY_ID: (id) => `${API_BASE_URL}/api/recurring/${id}`,
  RECURRING_TOGGLE: (id) => `${API_BASE_URL}/api/recurring/${id}/toggle`,
  RECURRING_PROCESS: `${API_BASE_URL}/api/recurring/process`,

  // Analytics & Exports
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
  ANALYTICS_HEATMAP: `${API_BASE_URL}/api/analytics/heatmap`,
  EXPORT_CSV: `${API_BASE_URL}/api/analytics/export/csv`,
  EXPORT_PDF: `${API_BASE_URL}/api/analytics/export/pdf`,

  // Budget Management
  BUDGETS: `${API_BASE_URL}/api/budgets`,
  BUDGET_BY_ID: (id) => `${API_BASE_URL}/api/budgets/${id}`,
  BUDGET_TOGGLE: (id) => `${API_BASE_URL}/api/budgets/${id}/toggle`,
  BUDGET_STATUS: `${API_BASE_URL}/api/budgets/status`,
  BUDGET_ANALYTICS: `${API_BASE_URL}/api/budgets/analytics`,

  // Financial Goals
  GOALS: `${API_BASE_URL}/api/goals`,
  GOAL_BY_ID: (id) => `${API_BASE_URL}/api/goals/${id}`,
  GOAL_CONTRIBUTE: (id) => `${API_BASE_URL}/api/goals/${id}/contribute`,
  GOAL_COMPLETE: (id) => `${API_BASE_URL}/api/goals/${id}/complete`,
  GOAL_PREDICTIONS: (id) => `${API_BASE_URL}/api/goals/${id}/predictions`,

  // User Management
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}/profile`,
  UPDATE_USER_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}/profile`,
  USER_REGISTER: `${API_BASE_URL}/api/users/register`,
};

export default API_BASE_URL;

