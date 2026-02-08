/**
 * @fileoverview API Configuration and Endpoint Definitions
 * 
 * Central configuration file that manages all backend API endpoints.
 * This provides a single source of truth for API URLs throughout the application,
 * making it easier to maintain and update API connections.
 */

/**
 * Base API URL Configuration
 * 
 * Reads from environment variables with fallback to localhost for development.
 * Priority: VITE_API_BASE_URL > VITE_API_URL > localhost:5000
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log API URL in development mode for debugging purposes
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

/**
 * API Endpoints Object
 * 
 * Centralized collection of all API endpoints used in the application.
 * Organized by feature domain for easy navigation and maintenance.
 */
export const API_ENDPOINTS = {
  // ==========================================
  // WALLET MANAGEMENT ENDPOINTS
  // ==========================================
  // Manage user wallet balance and transactions
  
  WALLET: `${API_BASE_URL}/api/wallet`, // Get wallet information
  WALLET_ADD: `${API_BASE_URL}/api/wallet/add`, // Add funds to wallet
  WALLET_SPEND: `${API_BASE_URL}/api/wallet/spend`, // Deduct funds from wallet
  WALLET_RESET: `${API_BASE_URL}/api/wallet/reset`, // Reset wallet balance

  // ==========================================
  // TRANSACTION MANAGEMENT ENDPOINTS
  // ==========================================
  // Track and manage financial transactions
  
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`, // Get all transactions or create new
  TRANSACTION_BY_ID: (transactionId) => `${API_BASE_URL}/api/transactions/${transactionId}`, // Get/update/delete specific transaction
  TRANSACTION_PARSE_AI: `${API_BASE_URL}/api/transactions/parse-ai`, // AI-powered transaction parsing
  TRANSACTION_PARSE_RECEIPT: `${API_BASE_URL}/api/transactions/parse-receipt`, // Parse receipt images
  TRANSACTION_FANCY: `${API_BASE_URL}/api/transactions/fancy-popup`, // Special transaction displays

  // ==========================================
  // RECURRING TRANSACTIONS ENDPOINTS
  // ==========================================
  // Manage automatic recurring payments
  
  RECURRING: `${API_BASE_URL}/api/recurring`, // Get all recurring transactions or create new
  RECURRING_BY_ID: (id) => `${API_BASE_URL}/api/recurring/${id}`, // Get/update/delete specific recurring transaction
  RECURRING_TOGGLE: (id) => `${API_BASE_URL}/api/recurring/${id}/toggle`, // Enable/disable recurring transaction
  RECURRING_PROCESS: `${API_BASE_URL}/api/recurring/process`, // Process due recurring transactions

  // ==========================================
  // ANALYTICS & EXPORT ENDPOINTS
  // ==========================================
  // Generate insights and export financial data
  
  ANALYTICS: `${API_BASE_URL}/api/analytics`, // Get financial analytics and insights
  ANALYTICS_HEATMAP: `${API_BASE_URL}/api/analytics/heatmap`, // Get spending heatmap data
  EXPORT_CSV: `${API_BASE_URL}/api/analytics/export/csv`, // Export data as CSV file
  EXPORT_PDF: `${API_BASE_URL}/api/analytics/export/pdf`, // Export data as PDF report

  // ==========================================
  // BUDGET MANAGEMENT ENDPOINTS
  // ==========================================
  // Create and monitor spending budgets
  
  BUDGETS: `${API_BASE_URL}/api/budgets`, // Get all budgets or create new
  BUDGET_BY_ID: (id) => `${API_BASE_URL}/api/budgets/${id}`, // Get/update/delete specific budget
  BUDGET_TOGGLE: (id) => `${API_BASE_URL}/api/budgets/${id}/toggle`, // Enable/disable budget tracking
  BUDGET_STATUS: `${API_BASE_URL}/api/budgets/status`, // Get budget status overview
  BUDGET_ANALYTICS: `${API_BASE_URL}/api/budgets/analytics`, // Get budget vs actual spending comparison

  // ==========================================
  // FINANCIAL GOALS ENDPOINTS
  // ==========================================
  // Set and track financial savings goals
  
  GOALS: `${API_BASE_URL}/api/goals`, // Get all goals or create new
  GOAL_BY_ID: (id) => `${API_BASE_URL}/api/goals/${id}`, // Get/update/delete specific goal
  GOAL_CONTRIBUTE: (id) => `${API_BASE_URL}/api/goals/${id}/contribute`, // Add contribution to goal
  GOAL_COMPLETE: (id) => `${API_BASE_URL}/api/goals/${id}/complete`, // Mark goal as completed
  GOAL_PREDICTIONS: (id) => `${API_BASE_URL}/api/goals/${id}/predictions`, // Get goal completion predictions

  // ==========================================
  // DEBT MANAGEMENT ENDPOINTS
  // ==========================================
  // Track money owed to/by the user with dramatic flair 🎭
  
  DEBTS: `${API_BASE_URL}/api/debts`,
  DEBT_BY_ID: (id) => `${API_BASE_URL}/api/debts/${id}`,
  DEBT_ADD: (id) => `${API_BASE_URL}/api/debts/${id}/add`,
  DEBT_SUBTRACT: (id) => `${API_BASE_URL}/api/debts/${id}/subtract`,
  DEBT_SUMMARY: `${API_BASE_URL}/api/debts/summary`,
  DEBT_DRAMATIC_MESSAGE: `${API_BASE_URL}/api/debts/dramatic-message`,

  // ==========================================
  // USER MANAGEMENT ENDPOINTS
  // ==========================================
  // Handle user accounts and profiles
  
  USERS: `${API_BASE_URL}/api/users`, // Get all users (admin)
  USER_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}/profile`, // Get user profile
  UPDATE_USER_PROFILE: (userId) => `${API_BASE_URL}/api/users/${userId}/profile`, // Update user profile
  USER_REGISTER: `${API_BASE_URL}/api/users/register`, // Register new user
};

// Export base URL for direct use if needed
export default API_BASE_URL;

