/**
 * @fileoverview Dashboard Page Component
 *
 * The primary financial dashboard that serves as the user's command center.
 * Provides a comprehensive overview of the user's financial state including:
 *  - Live wallet balance with animated counter
 *  - Income / Expense summary cards
 *  - Quick-action buttons for Manual Entry, AI Quick-Add, and Receipt Scanning
 *  - Spending chart analytics
 *  - Financial health gauge (savings rate based score)
 *  - Save-to-goal modal for transferring wallet funds to savings goals
 *  - AI-powered transaction parsing via natural language
 *  - Receipt OCR scanning for automatic expense logging
 *  - Confetti celebration on income additions
 *
 * @module pages/Dashboard
 */

// ── Core React Hooks ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';

// ── Animation Libraries ──────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';

// ── Icon Library (Feather Icons) ─────────────────────────────────────────────
import {
  FiPlus, FiMinus, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiTrash2, FiEdit2,
  FiCheck, FiX, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiPieChart, FiActivity,
  FiDollarSign, FiCalendar, FiClock, FiArrowUpRight, FiArrowDownLeft, FiSmile, FiZap,
  FiCamera, FiList, FiPlusCircle, FiMinusCircle, FiChevronDown, FiRefreshCcw,
  FiArrowUp, FiArrowDown, FiBriefcase, FiTarget
} from 'react-icons/fi';

// ── Reusable Components ──────────────────────────────────────────────────────
import AnimatedCounter from '../components/AnimatedCounter';
import DashboardSkeleton from '../components/LoadingSkeleton';
import SpendingChart from '../components/SpendingChart';
import SearchAndFilters from '../components/SearchAndFilters';

// ── Third-Party UI Utilities ─────────────────────────────────────────────────
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { Link } from 'react-router-dom';

/**
 * Spending category options
 *
 * Used in the transaction form dropdown to classify expenses.
 * Each entry maps an internal value key to a human-readable label.
 */
const categories = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'education', label: 'Education' },
  { value: 'savings', label: 'Savings & Goals' },
  { value: 'other', label: 'Other' }
];

/**
 * Dashboard Component
 *
 * Main financial dashboard that displays wallet data, spending analytics,
 * and provides quick-action modals for adding transactions manually,
 * via AI natural-language parsing, or receipt OCR scanning.
 *
 * @returns {JSX.Element} The rendered dashboard page
 */
const Dashboard = () => {
  // ── Authentication ──────────────────────────────────────────────────────
  const { currentUser } = useAuth();

  // ── Wallet Data & Loading ───────────────────────────────────────────────
  const [wallet, setWallet] = useState(null);    // Full wallet object from API
  const [loading, setLoading] = useState(true);  // Initial data fetch indicator

  // ── Transaction Form State ──────────────────────────────────────────────
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');           // Dollar amount input
  const [category, setCategory] = useState('food');   // Expense classification
  const [description, setDescription] = useState(''); // Optional transaction note
  const [isSubmitting, setIsSubmitting] = useState(false); // Submit-in-progress flag

  // ── AI Fancy Popup State (post-expense AI insight) ──────────────────────
  const [showFancyPopup, setShowFancyPopup] = useState(false); // Visibility toggle
  const [fancyMessage, setFancyMessage] = useState('');        // AI-generated message
  const [fancyLoading, setFancyLoading] = useState(false);     // Loading indicator

  // ── Confetti Celebration State ──────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // ── AI Quick-Add Modal State ────────────────────────────────────────────
  const [showAIInput, setShowAIInput] = useState(false); // Modal visibility
  const [aiText, setAiText] = useState('');               // Natural-language input
  const [aiLoading, setAiLoading] = useState(false);      // AI processing flag

  // ── Receipt Scanner Modal State ─────────────────────────────────────────
  const [showReceiptScanner, setShowReceiptScanner] = useState(false); // Modal visibility
  const [selectedReceipt, setSelectedReceipt] = useState(null);        // File object
  const [receiptPreview, setReceiptPreview] = useState(null);          // Base64 preview URL
  const [receiptLoading, setReceiptLoading] = useState(false);         // OCR processing flag

  // ── Transaction List & Save-to-Goal Modal State ─────────────────────────
  const [showAllTransactions, setShowAllTransactions] = useState(false);   // Expand transactions
  const [showTransactionModal, setShowTransactionModal] = useState(false); // Manual entry modal
  const [showSaveToGoalModal, setShowSaveToGoalModal] = useState(false);   // Goal transfer modal
  const [goals, setGoals] = useState([]);            // Active (non-completed) goals list
  const [selectedGoalId, setSelectedGoalId] = useState(''); // Target goal for transfer
  const [saveAmount, setSaveAmount] = useState('');         // Amount to transfer to goal

  /**
   * Calculate the user's financial health score (0-100)
   *
   * Score is derived from the savings rate:
   *   savingsRate = (totalIncome - totalExpense) / totalIncome × 100
   * A higher score indicates healthier spending habits.
   *
   * @returns {{ score: number, message: string }} Score and descriptive message
   */
  const calculateFinancialHealth = () => {
    if (!wallet || wallet.totalIncome === 0) return { score: 0, message: 'Add income to calculate' };

    const savingsRate = ((wallet.totalIncome - wallet.totalExpense) / wallet.totalIncome) * 100;
    const score = Math.max(0, Math.min(100, Math.round(savingsRate)));

    // Map score ranges to user-friendly advice
    let message = 'Keep tracking to see insights';
    if (score >= 80) message = 'Excellent! Your spending is well optimized.';
    else if (score >= 60) message = 'Great! You are maintaining a healthy balance.';
    else if (score >= 40) message = 'Good, but try to reduce unnecessary spending.';
    else if (score > 0) message = 'Focus on building your savings buffer.';
    else message = 'Caution: Expenses exceed your income.';

    return { score, message };
  };

  const health = calculateFinancialHealth();

  // Search and Filter State
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });

  // Window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch wallet data on component mount and when filters change
  useEffect(() => {
    if (currentUser) {
      fetchWallet();
      fetchGoals();
    }
  }, [currentUser, filters]);

  /**
   * Fetch the user's active (non-completed) financial goals
   *
   * Populates the goals dropdown inside the Save-to-Goal modal.
   * Silently logs errors since goal loading is non-critical.
   */
  const fetchGoals = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.GOALS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Only show active (not yet completed) goals
        setGoals(data.filter(g => !g.isCompleted));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  /**
   * Fetch wallet summary AND filtered transactions from the backend
   *
   * Makes two parallel API calls:
   *  1. GET /api/wallet          → balance, totalIncome, totalExpense
   *  2. GET /api/transactions?…  → list of transactions matching current filters
   *
   * The results are merged into a single `wallet` state object so the UI
   * can display both summary stats and the transaction list.
   */
  const fetchWallet = async () => {
    try {
      const token = await currentUser.getIdToken();

      // Build query params from active search/filter state
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // 1) Fetch wallet summary (balance, totals)
      const walletResponse = await fetch(API_ENDPOINTS.WALLET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const walletData = await walletResponse.json();

      // 2) Fetch filtered transactions list
      const transactionsResponse = await fetch(
        `${API_ENDPOINTS.TRANSACTIONS}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const transactionsData = await transactionsResponse.json();

      if (walletResponse.ok && transactionsResponse.ok) {
        // Merge wallet summary with transaction list into unified state
        setWallet({
          ...walletData.wallet,
          transactions: transactionsData.transactions || []
        });
      } else {
        toast.error('Failed to fetch wallet data');
      }
    } catch (err) {
      toast.error('Error fetching wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch an AI-generated "fancy" insight message after an expense is recorded
   *
   * Shows a toast-style popup in the bottom-right with a witty or helpful
   * comment about the expense. Auto-dismisses after 8 seconds.
   *
   * @param {number} amount  - The expense amount
   * @param {string} cat     - The expense category
   */
  const fetchFancyMessage = async (amount, cat) => {
    setFancyLoading(true);
    setFancyMessage('');
    setShowFancyPopup(true);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.TRANSACTION_FANCY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, category: cat })
      });

      const data = await response.json();
      if (response.ok && data.message) {
        setFancyMessage(data.message);
        // Auto-dismiss the popup after 8 seconds
        setTimeout(() => setShowFancyPopup(false), 8000);
      } else {
        setShowFancyPopup(false);
      }
    } catch (err) {
      console.error('Error fetching fancy message:', err);
      setShowFancyPopup(false);
    } finally {
      setFancyLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSACTION HANDLER FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Handle manual transaction form submission (income or expense)
   *
   * Validates the amount, checks sufficient balance for expenses,
   * posts the transaction to the API, and triggers:
   *  - Confetti animation on income
   *  - AI fancy popup message on expense
   *
   * @param {Event} e - Form submit event
   */
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (transactionType === 'expense' && parseFloat(amount) > (wallet?.currentBalance || 0)) {
      toast.error('Insufficient balance!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Recording ${transactionType}...`);

    try {
      const token = await currentUser.getIdToken();
      const payload = {
        type: transactionType === 'expense' ? 'SPEND' : 'ADD',
        amount: parseFloat(amount),
        message: description || (transactionType === 'expense' ? `Spent on ${category}` : 'Income Added'),
        category: transactionType === 'expense' ? category : 'salary'
      };

      const response = await fetch(API_ENDPOINTS.TRANSACTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
        toast.success(`${transactionType === 'income' ? 'Income added' : 'Expense recorded'} successfully!`, { id: toastId });

        if (transactionType === 'income') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        } else {
          fetchFancyMessage(parseFloat(amount), category);
        }

        // Reset Form & Close Modal
        setAmount('');
        setDescription('');
        setCategory('food');
        setShowTransactionModal(false);
      } else {
        toast.error(data.message || 'Failed to record transaction', { id: toastId });
      }
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle transferring wallet funds to a savings goal
   *
   * Validates the amount and selected goal, calls the goal contribution
   * endpoint, and optimistically updates the wallet state for instant UI
   * feedback. Falls back to a full wallet refetch if the API response
   * doesn't include the transaction data.
   *
   * @param {Event} e - Form submit event
   */
  const handleSaveToGoal = async (e) => {
    e.preventDefault();

    if (!saveAmount || parseFloat(saveAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedGoalId) {
      toast.error('Please select a goal');
      return;
    }

    if (parseFloat(saveAmount) > (wallet?.currentBalance || 0)) {
      toast.error('Insufficient balance in your wallet!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Transferring to savings goal...');

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.GOAL_CONTRIBUTE(selectedGoalId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(saveAmount) })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Successfully added to goal!', { id: toastId });

        // Update state directly for instant feedback
        if (wallet && data.transaction) {
          const newTransaction = {
            ...data.transaction,
            date: data.transaction.createdAt || new Date().toISOString(),
            category: 'savings'
          };

          setWallet(prev => ({
            ...prev,
            currentBalance: data.walletBalance !== undefined ? data.walletBalance : prev.currentBalance - parseFloat(saveAmount),
            totalExpense: prev.totalExpense + parseFloat(saveAmount),
            transactions: [newTransaction, ...prev.transactions]
          }));
        } else {
          // Fallback: search and fetch full wallet if transaction data is missing
          fetchWallet();
        }

        // Refresh goals in background
        fetchGoals();

        // Reset and close
        setSaveAmount('');
        setSelectedGoalId('');
        setShowSaveToGoalModal(false);

        // Show celebration!
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        toast.error(data.error || 'Failed to contribute to goal', { id: toastId });
      }
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset the entire wallet — clears all transactions and sets balance to zero
   *
   * ⚠️ DESTRUCTIVE ACTION: Prompts the user for confirmation before proceeding.
   * Performs two sequential API calls:
   *  1. DELETE /api/transactions  → wipe transaction history
   *  2. POST  /api/wallet/reset   → reset wallet balance to $0.00
   */
  const handleResetWallet = async () => {
    if (!window.confirm('WARNING: This will PERMANENTLY DELETE all your transactions and reset your balance to zero. This action cannot be undone. Are you sure?')) {
      return;
    }

    const toastId = toast.loading('Resetting all data...');
    try {
      const token = await currentUser.getIdToken();

      // 1. Clear all transactions
      const txResponse = await fetch(API_ENDPOINTS.TRANSACTIONS, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!txResponse.ok) {
        throw new Error('Failed to clear transactions');
      }

      // 2. Reset wallet balance
      const walletResponse = await fetch(API_ENDPOINTS.WALLET_RESET, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await walletResponse.json();
      if (walletResponse.ok) {
        setWallet(data.wallet);
        toast.success('All data cleared successfully!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to reset wallet', { id: toastId });
      }
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    }
  };

  /**
   * Process natural-language text input through the AI transaction parser
   *
   * Sends a free-text description (e.g. "Spent $45 on groceries") to the
   * backend AI endpoint, which extracts the amount, category, and type,
   * then creates the transaction automatically.
   */
  const handleAIProcessing = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    const toastId = toast.loading('AI is analyzing your transaction...');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.TRANSACTION_PARSE_AI, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: aiText })
      });

      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
        toast.success('AI successfully added the transaction!', { id: toastId });
        setAiText('');
        setShowAIInput(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        toast.error(data.message || 'AI failed to understand. Try being more specific.', { id: toastId });
      }
    } catch (err) {
      toast.error('AI Error: ' + err.message, { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RECEIPT SCANNER HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Handle receipt image file selection
   *
   * Reads the selected image and generates a base64 preview URL
   * for display inside the scanner modal.
   *
   * @param {Event} e - File input change event
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Upload the selected receipt image for OCR processing
   *
   * Sends the receipt as multipart/form-data to the backend OCR endpoint.
   * On success, the backend extracts the amount and category and creates
   * a transaction automatically.
   */
  const handleReceiptScan = async () => {
    if (!selectedReceipt) return;
    setReceiptLoading(true);
    const toastId = toast.loading('Extracting data from receipt...');

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('receipt', selectedReceipt);

      const response = await fetch(API_ENDPOINTS.TRANSACTION_PARSE_RECEIPT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setWallet(data.wallet);
        toast.success('Receipt scanned and recorded!', { id: toastId });
        setShowReceiptScanner(false);
        setSelectedReceipt(null);
        setReceiptPreview(null);
      } else {
        toast.error(data.message || 'Failed to scan receipt', { id: toastId });
      }
    } catch (err) {
      toast.error('Scanner Error: ' + err.message, { id: toastId });
    } finally {
      setReceiptLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  // Show skeleton loader while initial data is being fetched
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Extract transactions array for the list view (default to empty)
  const recentTransactions = wallet?.transactions || [];

  return (
    <div className="dashboard-root">
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} colors={['#10B981', '#3B82F6', '#A855F7']} />
      )}

      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#1E293B', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' },
      }} />

      <div className="dashboard-container">

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <div>
              <span className="balance-label"><span className="live-dot"></span> Current Balance</span>
              <div className="balance-value">
                <span className="currency-sign">$</span><AnimatedCounter value={wallet?.currentBalance || 0} decimals={2} />
              </div>
            </div>
            <div className="balance-actions">
              <button className="btn-outline" onClick={() => setShowSaveToGoalModal(true)}>
                <FaBullseye /> Move to Savings
              </button>
              <button className="btn-icon" onClick={handleResetWallet} title="Reset Wallet">
                <FaRedoAlt />
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-icon income-icon"><FaArrowUp /></div>
              <div>
                <span className="stat-label">Total Income</span>
                <span className="stat-value income">+$<AnimatedCounter value={wallet?.totalIncome || 0} decimals={2} /></span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon expense-icon"><FaArrowDown /></div>
              <div>
                <span className="stat-label">Total Expenses</span>
                <span className="stat-value expense">-$<AnimatedCounter value={wallet?.totalExpense || 0} decimals={2} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card" onClick={() => setShowTransactionModal(true)}>
            <div className="action-icon green"><FaPlus /></div>
            <h3>Manual Entry</h3>
            <p>Add income or expense</p>
          </div>
          <div className="action-card" onClick={() => setShowAIInput(true)}>
            <div className="action-icon purple"><FaBolt /></div>
            <h3>AI Quick Add</h3>
            <p>Describe your transaction</p>
          </div>
          <div className="action-card" onClick={() => setShowReceiptScanner(true)}>
            <div className="action-icon blue"><FaCamera /></div>
            <h3>Scan Receipt</h3>
            <p>Upload receipt image</p>
          </div>
        </div>

        {/* Charts */}
        <SpendingChart wallet={wallet} />

        {/* Financial Health */}
        <div className="health-card">
          <div className="health-top">
            <div className="health-info">
              <h3>Financial Health</h3>
              <p>{health.message}</p>
            </div>
            <div className="health-score">
              <span className="health-label">Score</span>
              <span className="health-value">{health.score}%</span>
            </div>
          </div>
          <div className="health-bar-container">
            <div className="health-bar-track">
              <div
                className="health-bar-fill"
                style={{ width: `${Math.min(health.score, 100)}%` }}
              />
            </div>
            <div className="health-bar-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowTransactionModal(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content">
              <div className="modal-header">
                <h3>Add Transaction</h3>
                <button className="modal-close" onClick={() => setShowTransactionModal(false)}><FaTimes /></button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="modal-body">
                {/* Type Toggle */}
                <div className="type-toggle">
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    className={`toggle-btn ${transactionType === 'expense' ? 'active expense' : ''}`}
                  >
                    <FaArrowDown /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    className={`toggle-btn ${transactionType === 'income' ? 'active income' : ''}`}
                  >
                    <FaArrowUp /> Income
                  </button>
                </div>

                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                {transactionType === 'expense' && (
                  <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this transaction for?"
                    rows={3}
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary full">
                  {isSubmitting ? 'Processing...' : `Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fancy AI Popup */}
      <AnimatePresence>
        {showFancyPopup && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fancy-popup">
            <div className="fancy-popup-inner">
              <div className="fancy-icon"><FaBolt /></div>
              <div className="fancy-content">
                <h4>AI Insight</h4>
                <p>"{fancyMessage}"</p>
              </div>
              <button onClick={() => setShowFancyPopup(false)} className="fancy-close"><FaTimes /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Input Modal */}
      <AnimatePresence>
        {showAIInput && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowAIInput(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content">
              <div className="modal-header">
                <div className="modal-header-row">
                  <div className="modal-header-icon purple"><FaBolt /></div>
                  <div>
                    <h3>AI Quick Add</h3>
                    <p className="modal-subtitle">Describe your transaction naturally</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowAIInput(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="e.g., 'Spent $45 on groceries today'..."
                  className="ai-textarea"
                  disabled={aiLoading}
                  rows={5}
                />
                <button
                  onClick={handleAIProcessing}
                  disabled={aiLoading || !aiText.trim()}
                  className="btn-primary full"
                >
                  {aiLoading ? <><FaSync className="spin-icon" /> Processing...</> : <><FaBolt /> Add Transaction</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showReceiptScanner && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowReceiptScanner(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content wide">
              <div className="modal-header">
                <div className="modal-header-row">
                  <div className="modal-header-icon blue"><FaCamera /></div>
                  <div>
                    <h3>Scan Receipt</h3>
                    <p className="modal-subtitle">Upload a receipt to auto-extract data</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowReceiptScanner(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                {!receiptPreview ? (
                  <label className="upload-zone">
                    <div className="upload-icon"><FaDownload /></div>
                    <p className="upload-title">Upload Receipt</p>
                    <p className="upload-subtitle">JPG, PNG or PDF</p>
                    <input type="file" className="hidden-input" accept="image/*" onChange={handleFileSelect} />
                  </label>
                ) : (
                  <div className="receipt-preview-area">
                    <div className="receipt-image-wrap">
                      <img src={receiptPreview} alt="Receipt Preview" />
                      <button onClick={() => { setReceiptPreview(null); setSelectedReceipt(null); }} className="remove-receipt"><FaTrash /></button>
                    </div>
                    <button
                      onClick={handleReceiptScan}
                      disabled={receiptLoading}
                      className="btn-primary full"
                    >
                      {receiptLoading ? <><FaSync className="spin-icon" /> Analyzing...</> : <><FaBolt /> Scan & Record</>}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save to Goal Modal */}
      <AnimatePresence>
        {showSaveToGoalModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowSaveToGoalModal(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content">
              <div className="modal-header">
                <div className="modal-header-row">
                  <div className="modal-header-icon cyan"><FaBullseye /></div>
                  <div>
                    <h3>Move to Savings</h3>
                    <p className="modal-subtitle">Transfer funds to a financial goal</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowSaveToGoalModal(false)}><FaTimes /></button>
              </div>

              <div className="modal-body">
                {goals.length === 0 ? (
                  <div className="empty-state">
                    <FaBullseye className="empty-icon" />
                    <p className="empty-title">No Active Goals</p>
                    <p className="empty-subtitle">Create a financial goal first before transferring funds.</p>
                    <button onClick={() => setShowSaveToGoalModal(false)} className="btn-secondary">
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveToGoal}>
                    <div className="form-group">
                      <label>Select Goal</label>
                      <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} required>
                        <option value="">Choose a goal...</option>
                        {goals.map(goal => (
                          <option key={goal._id} value={goal._id}>
                            {goal.name} (${goal.targetAmount.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Amount ($)</label>
                      <input
                        type="number"
                        value={saveAmount}
                        onChange={(e) => setSaveAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0.01"
                        step="0.01"
                      />
                      <span className="form-hint">
                        Available: ${wallet?.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-primary full">
                      {isSubmitting ? 'Transferring...' : 'Transfer to Goal'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .dashboard-root {
          min-height: 100vh;
          background: #0B0F1A;
          color: white;
          padding-bottom: 4rem;
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Balance Card */
        .balance-card {
          background: #1E293B;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .balance-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .balance-label {
          color: #9CA3AF;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          animation: livePulse 2s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .balance-value {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10B981, #34D399, #6EE7B7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .currency-sign {
          background: linear-gradient(135deg, #10B981, #34D399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .balance-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .btn-outline {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: rgba(255,255,255,0.05);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: rgba(16, 185, 129, 0.1);
        }

        .btn-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .stat-icon.income-icon {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
        }

        .stat-icon.expense-icon {
          background: rgba(239, 68, 68, 0.15);
          color: #EF4444;
        }

        .stat-label {
          display: block;
          color: #9CA3AF;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }

        .stat-value.income {
          color: #10B981;
        }

        .stat-value.expense {
          color: #EF4444;
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .action-card {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-card:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }

        .action-card h3 {
          color: white;
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0 0 0.375rem;
          transition: color 0.2s;
        }

        .action-card:hover h3 {
          color: #E2E8F0;
        }

        .action-card p {
          color: #64748B;
          font-size: 0.8rem;
          margin: 0;
          line-height: 1.4;
        }

        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.25rem;
          transition: all 0.2s;
        }

        .action-card:hover .action-icon {
          transform: scale(1.1);
        }

        .action-icon.green {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
        }

        .action-icon.purple {
          background: rgba(168, 85, 247, 0.15);
          color: #A855F7;
        }

        .action-icon.blue {
          background: rgba(59, 130, 246, 0.15);
          color: #3B82F6;
        }

        /* Health Card */
        .health-card {
          background: #1E293B;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .health-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .health-info h3 {
          color: white;
          font-size: 1.375rem;
          font-weight: 700;
          margin: 0 0 0.375rem;
        }

        .health-info p {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.5;
        }

        .health-score {
          text-align: right;
          padding: 0.75rem 1.25rem;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .health-label {
          display: block;
          color: #64748B;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.25rem;
        }

        .health-value {
          font-size: 2.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10B981, #34D399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .health-bar-container {
          width: 100%;
        }

        .health-bar-track {
          width: 100%;
          height: 12px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
        }

        .health-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #EF4444 0%, #F59E0B 35%, #10B981 65%, #10B981 100%);
          transition: width 1s ease;
          position: relative;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
        }

        .health-bar-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: #475569;
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
        }

        .modal-content {
          background: #1E293B;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          z-index: 10;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .modal-content.wide {
          max-width: 600px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .modal-header h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-header-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-header-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .modal-header-icon.purple {
          background: rgba(168, 85, 247, 0.2);
          color: #A855F7;
        }

        .modal-header-icon.blue {
          background: rgba(59, 130, 246, 0.2);
          color: #3B82F6;
        }

        .modal-header-icon.cyan {
          background: rgba(6, 182, 212, 0.2);
          color: #06B6D4;
        }

        .modal-subtitle {
          color: #64748B;
          font-size: 0.8rem;
          margin: 0.25rem 0 0;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 8px;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .modal-body {
          padding: 2rem;
        }

        /* Form Styles */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          color: #9CA3AF;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #10B981;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-hint {
          display: block;
          color: #64748B;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        /* Type Toggle */
        .type-toggle {
          display: flex;
          gap: 0.5rem;
          background: #0F172A;
          padding: 0.375rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          background: transparent;
          color: #64748B;
          transition: all 0.2s;
        }

        .toggle-btn.active.expense {
          background: rgba(239, 68, 68, 0.15);
          color: #EF4444;
        }

        .toggle-btn.active.income {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
        }

        /* Buttons */
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary.full {
          width: 100%;
          margin-top: 0.5rem;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.05);
          color: #9CA3AF;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        /* AI Textarea */
        .ai-textarea {
          width: 100%;
          padding: 1rem;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          resize: vertical;
          min-height: 140px;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }

        .ai-textarea:focus {
          outline: none;
          border-color: #A855F7;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Upload Zone */
        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-zone:hover {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.05);
        }

        .upload-icon {
          font-size: 2.5rem;
          color: #3B82F6;
          margin-bottom: 1rem;
        }

        .upload-title {
          color: white;
          font-weight: 700;
          font-size: 1.125rem;
          margin: 0 0 0.25rem;
        }

        .upload-subtitle {
          color: #64748B;
          font-size: 0.875rem;
          margin: 0;
        }

        .hidden-input {
          display: none;
        }

        .receipt-preview-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .receipt-image-wrap {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          background: #0F172A;
        }

        .receipt-image-wrap img {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
        }

        .remove-receipt {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EF4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .receipt-image-wrap:hover .remove-receipt {
          opacity: 1;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 2rem 0;
        }

        .empty-icon {
          font-size: 3rem;
          color: #64748B;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .empty-subtitle {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin: 0 0 1.5rem;
        }

        /* Fancy Popup */
        .fancy-popup {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 50;
          max-width: 360px;
          width: 100%;
        }

        .fancy-popup-inner {
          background: #1E293B;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
        }

        .fancy-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .fancy-content h4 {
          color: white;
          font-weight: 700;
          margin: 0 0 0.25rem;
          font-size: 0.9rem;
        }

        .fancy-content p {
          color: #9CA3AF;
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.5;
        }

        .fancy-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
        }

        .fancy-close:hover {
          color: white;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .quick-actions {
            grid-template-columns: 1fr;
          }

          .balance-header {
            flex-direction: column;
            gap: 1rem;
          }

          .balance-actions {
            align-self: flex-start;
          }

          .stats-row {
            grid-template-columns: 1fr;
          }

          .health-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .health-score {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 1rem;
          }

          .balance-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

/* Export the Dashboard component as the default module export */
export default Dashboard;
