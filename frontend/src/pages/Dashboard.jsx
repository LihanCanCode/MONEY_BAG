import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlusCircle, FiMinusCircle,
  FiCamera, FiZap, FiCheck, FiX, FiActivity, FiArrowUpRight, FiArrowDownLeft, FiMenu, FiSmile, FiChevronDown, FiCalendar, FiPieChart, FiList, FiRefreshCcw
} from 'react-icons/fi';
import AnimatedCounter from '../components/AnimatedCounter';
import DashboardSkeleton from '../components/LoadingSkeleton';
import SpendingChart from '../components/SpendingChart';
import SearchAndFilters from '../components/SearchAndFilters';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';

// Categories available for spending
const categories = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transaction Form State
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fancy AI Message State
  const [showFancyPopup, setShowFancyPopup] = useState(false);
  const [fancyMessage, setFancyMessage] = useState('');
  const [fancyLoading, setFancyLoading] = useState(false);

  // Confetti State
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Modals for Advanced Features
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [showAllTransactions, setShowAllTransactions] = useState(false);

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
    }
  }, [currentUser, filters]);

  const fetchWallet = async () => {
    try {
      const token = await currentUser.getIdToken();

      // Build query params for filtering
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Fetch wallet summary
      const walletResponse = await fetch(API_ENDPOINTS.WALLET, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const walletData = await walletResponse.json();

      // Fetch filtered transactions
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
        // Combine wallet data with filtered transactions
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
        category: transactionType === 'expense' ? category : 'salary' // Default to salary for income if generic
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

        // Reset Form
        setAmount('');
        setDescription('');
        setCategory('food');
      } else {
        toast.error(data.message || 'Failed to record transaction', { id: toastId });
      }
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!selectedReceipt) {
      toast.error('Please select a receipt image');
      return;
    }

    setReceiptLoading(true);
    const toastId = toast.loading('Scanning receipt...');
    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('receipt', selectedReceipt);

      const response = await fetch(API_ENDPOINTS.TRANSACTION_PARSE_RECEIPT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { data } = result;
        setTransactionType(data.type === 'income' ? 'income' : 'expense');
        setAmount(data.amount || '');
        setCategory(data.category || 'food');
        setDescription(data.description || '');

        setShowReceiptScanner(false);
        setSelectedReceipt(null);
        setReceiptPreview(null);

        toast.success('Receipt scanned! Form auto-filled.', { id: toastId });
      } else {
        toast.error(result.message || 'Failed to scan receipt', { id: toastId });
      }
    } catch (err) {
      toast.error('Error scanning receipt: ' + err.message, { id: toastId });
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleAIProcess = async () => {
    if (!aiText.trim()) return;

    setAiLoading(true);
    const toastId = toast.loading('Processing...');
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

      const result = await response.json();

      if (response.ok && result.success) {
        const { data } = result;
        setTransactionType(data.type === 'income' ? 'income' : 'expense');
        setAmount(data.amount || '');
        setCategory(data.category || 'food');
        setDescription(data.description || '');

        setShowAIInput(false);
        setAiText('');

        toast.success('AI processed! Form auto-filled.', { id: toastId });
      } else {
        toast.error(result.message || 'Failed to parse', { id: toastId });
      }
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  const recentTransactions = wallet?.transactions || [];

  return (
    <div className="min-h-screen bg-[#0B0F1A] pb-20 relative font-sans text-[#E5E7EB]">

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}

      {/* Fancy AI Message Popup */}
      <AnimatePresence>
        {showFancyPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 max-w-sm w-full"
          >
            <div className="bg-[#141B2D] border border-[#10B981]/30 rounded-lg shadow-2xl p-6 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-start gap-4 relative z-10">
                <div className="bg-[#10B981]/20 p-3 rounded-md text-[#34D399]">
                  <FiSmile size={24} />
                </div>
                <div>
                  <h4 className="font-bold !text-white mb-1">Feedback</h4>
                  <p className="!text-[#D1D5DB] text-sm leading-relaxed">"{fancyMessage}"</p>
                </div>
                <button onClick={() => setShowFancyPopup(false)} className="absolute top-0 right-0 !text-[#9CA3AF] hover:text-white">
                  <FiX size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />

      {/* Navbar */}
      <div className="bg-[#0B0F1A]/90 backdrop-blur-xl sticky top-0 z-40 border-b border-[#1F2937]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-[#10B981] text-white p-2.5 rounded-lg shadow-lg">
                <FiDollarSign size={22} />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">MoneyBag</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#374151] rounded-full flex items-center justify-center text-white text-sm font-bold border border-[#4B5563]">
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl font-bold !text-white mb-1">Dashboard</h1>
            <p className="!text-[#9CA3AF]">Overview of your finances</p>
          </div>
          <button
            onClick={handleResetWallet}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A233A] border border-[#2D3748] rounded-lg text-sm font-medium !text-[#9CA3AF] hover:!text-[#F87171] hover:border-[#F87171]/50 transition-all group"
          >
            <FiRefreshCcw className="group-hover:rotate-180 transition-transform duration-500" />
            Reset Data
          </button>
        </div>

        {/* Stats Cards Row - CHANGED GRID to be wider (2 cols on md, 4 on xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-4">
          {/* Total Balance - Solid Green */}
          <div className="bg-[#10B981] rounded-[10px] p-8 shadow-lg !text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <FiDollarSign size={48} />
            </div>
            <p className="!text-[#D1FAE5] text-sm font-medium mb-1 relative z-10">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight relative z-10">
              $<AnimatedCounter value={wallet?.currentBalance || 0} decimals={2} />
            </h2>
          </div>

          {/* Income */}
          <div className="bg-[#141B2D] rounded-[10px] p-8 border border-[#2D3748] shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="!text-[#9CA3AF] text-sm font-medium">Total Income</p>
              <span className="!text-[#10B981] bg-[#10B981]/10 p-1.5 rounded text-xs"><FiArrowDownLeft size={16} /></span>
            </div>
            <h3 className="text-2xl font-bold !text-[#34D399]">
              $<AnimatedCounter value={wallet?.totalIncome || 0} decimals={2} />
            </h3>
          </div>

          {/* Expenses */}
          <div className="bg-[#141B2D] rounded-[10px] p-8 border border-[#2D3748] shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="!text-[#9CA3AF] text-sm font-medium">Total Expenses</p>
              <span className="!text-[#F43F5E] bg-[#F43F5E]/10 p-1.5 rounded text-xs"><FiArrowUpRight size={16} /></span>
            </div>
            <h3 className="text-2xl font-bold !text-[#FB7185]">
              $<AnimatedCounter value={wallet?.totalExpense || 0} decimals={2} />
            </h3>
          </div>

          {/* Transactions Count */}
          <div className="bg-[#141B2D] rounded-[10px] p-8 border border-[#2D3748] shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="!text-[#9CA3AF] text-sm font-medium">Transactions</p>
              <span className="!text-[#818CF8] bg-[#6366F1]/10 p-1.5 rounded text-xs"><FiActivity size={16} /></span>
            </div>
            <h3 className="text-2xl font-bold !text-white">
              {wallet?.transactions?.length || 0}
            </h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: New Transaction Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#141B2D] rounded-[10px] border border-[#2D3748] overflow-hidden shadow-lg sticky top-24">
              <div className="p-4 border-b border-[#2D3748] bg-[#1A233A]">
                <h3 className="font-bold !text-white">New Transaction</h3>
              </div>

              {/* Tabs - FORCED HEX COLORS */}
              <div className="flex p-2 bg-[#141B2D] gap-2">
                <button
                  onClick={() => setTransactionType('expense')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${transactionType === 'expense'
                    ? '!bg-[#F43F5E] !text-white shadow-lg'
                    : '!text-[#9CA3AF] hover:bg-[#1A233A]'
                    }`}
                >
                  <FiMinusCircle /> Expense
                </button>
                <button
                  onClick={() => setTransactionType('income')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${transactionType === 'income'
                    ? '!bg-[#10B981] !text-white shadow-lg'
                    : '!text-[#9CA3AF] hover:bg-[#1A233A]'
                    }`}
                >
                  <FiPlusCircle /> Income
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold !text-[#9CA3AF] uppercase tracking-wider mb-2">Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0B0F1A] border border-[#2D3748] !text-white p-3 rounded-lg focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all font-bold text-lg placeholder-[#4B5563]"
                    step="0.01"
                  />
                </div>

                {transactionType === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold !text-[#9CA3AF] uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0B0F1A] border border-[#2D3748] !text-white p-3 rounded-lg focus:border-[#6366F1] outline-none appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold !text-[#9CA3AF] uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this for?"
                    className="w-full bg-[#0B0F1A] border border-[#2D3748] !text-[#D1D5DB] p-3 rounded-lg focus:border-[#6366F1] outline-none resize-none placeholder-[#4B5563]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-lg font-bold !text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${transactionType === 'income'
                    ? '!bg-[#10B981] hover:bg-[#059669]'
                    : '!bg-[#F43F5E] hover:bg-[#E11D48]'
                    }`}
                >
                  {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <FiCheck />}
                  {transactionType === 'income' ? 'Add Income' : 'Record Expense'}
                </button>

                {/* Quick Tools */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptScanner(true)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1A233A] !text-[#38BDF8] text-sm font-medium hover:bg-[#252f48] border border-[#2D3748] transition-colors"
                  >
                    <FiCamera /> Scan Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAIInput(true)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1A233A] !text-[#A855F7] text-sm font-medium hover:bg-[#252f48] border border-[#2D3748] transition-colors"
                  >
                    <FiZap /> AI Quick Add
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Recent Transactions & Charts */}
          <div className="lg:col-span-2 flex flex-col" style={{ gap: '32px' }}>

            {/* Search and Filters */}
            <SearchAndFilters onFilterChange={setFilters} activeFilters={filters} />

            {/* Recent Transactions List */}
            <div className="bg-[#141B2D] rounded-[10px] border border-[#2D3748] overflow-hidden shadow-lg">
              <div className="p-5 border-b border-[#2D3748] flex justify-between items-center bg-[#1A233A]">
                <h3 className="font-bold !text-white">Recent Transactions</h3>
                <button
                  onClick={() => setShowAllTransactions(true)}
                  className="text-xs !text-[#9CA3AF] hover:text-white flex items-center gap-1"
                >
                  View All <FiArrowUpRight />
                </button>
              </div>
              <div className="divide-y divide-[#2D3748]">
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="p-4 hover:bg-[#1A233A] transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(tx.type === 'income' || tx.type === 'ADD')
                          ? 'bg-[#10B981]/10 !text-[#10B981]'
                          : 'bg-[#F43F5E]/10 !text-[#F43F5E]'
                          }`}>
                          {(tx.type === 'income' || tx.type === 'ADD') ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                        </div>
                        <div>
                          <p className="font-medium !text-white">{tx.message || tx.category}</p>
                          <p className="text-xs !text-[#9CA3AF] capitalize">{tx.category} • {tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Today')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono font-bold ${(tx.type === 'income' || tx.type === 'ADD') ? '!text-[#34D399]' : '!text-[#FB7185]'
                          }`}>
                          {(tx.type === 'income' || tx.type === 'ADD') ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                        <button className="!text-[#9CA3AF] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-[#1A233A] rounded-full flex items-center justify-center mx-auto mb-3 !text-[#4B5563]">
                      <FiList size={24} />
                    </div>
                    <p className="!text-[#6B7280] text-sm">No transactions yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Smaller Chart */}
            <SpendingChart wallet={wallet} />
          </div>
        </div>

        <AnimatePresence>
          {(showAIInput || showReceiptScanner || showAllTransactions) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  setShowAIInput(false);
                  setShowReceiptScanner(false);
                  setShowAllTransactions(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`${showAllTransactions ? 'max-w-2xl' : 'max-w-md'} bg-[#141B2D] rounded-[10px] w-full p-6 relative z-10 border border-[#2D3748] shadow-2xl overflow-hidden`}
              >
                <button
                  onClick={() => {
                    setShowAIInput(false);
                    setShowReceiptScanner(false);
                    setShowAllTransactions(false);
                  }}
                  className="absolute top-4 right-4 !text-[#9CA3AF] hover:text-white z-20"
                >
                  <FiX size={20} />
                </button>

                {showAIInput && (
                  <>
                    <h3 className="text-lg font-bold !text-white mb-4 flex items-center gap-2"><FiZap className="!text-[#A855F7]" /> AI Quick Add</h3>
                    <textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="e.g. Spent $25 on Coffee at Starbucks"
                      className="w-full bg-[#0B0F1A] border border-[#2D3748] rounded-lg p-4 !text-white min-h-[120px] focus:border-[#A855F7] outline-none resize-none mb-4 placeholder-[#4B5563]"
                      autoFocus
                    />
                    <button
                      onClick={handleAIProcess}
                      disabled={!aiText.trim() || aiLoading}
                      className="w-full !bg-[#9333EA] hover:bg-[#7E22CE] !text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Process Transaction'}
                    </button>
                  </>
                )}

                {showReceiptScanner && (
                  <>
                    <h3 className="text-lg font-bold !text-white mb-4 flex items-center gap-2"><FiCamera className="!text-[#0EA5E9]" /> Scan Receipt</h3>
                    <div className="border-2 border-dashed border-[#2D3748] rounded-lg p-8 bg-[#0B0F1A] text-center relative hover:border-[#0EA5E9] transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setSelectedReceipt(e.target.files[0]);
                            setReceiptPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                      {receiptPreview ? (
                        <img src={receiptPreview} className="max-h-48 mx-auto rounded shadow-md" />
                      ) : (
                        <div className="!text-[#9CA3AF]">
                          <FiCamera size={32} className="mx-auto mb-2" />
                          <p className="text-sm">Click to upload receipt</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleReceiptUpload}
                      disabled={!selectedReceipt || receiptLoading}
                      className="w-full !bg-[#0284C7] hover:bg-[#0369A1] !text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      {receiptLoading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Extract Data'}
                    </button>
                  </>
                )}

                {showAllTransactions && (
                  <div className="flex flex-col max-h-[70vh]">
                    <h3 className="text-xl font-bold !text-white mb-6 flex items-center gap-2">
                      <FiList className="!text-[#6366F1]" /> Full Transaction History
                    </h3>
                    <div className="overflow-y-auto pr-2 custom-scrollbar divide-y divide-[#2D3748]">
                      {recentTransactions.map((tx, idx) => (
                        <div key={idx} className="py-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(tx.type === 'income' || tx.type === 'ADD')
                              ? 'bg-[#10B981]/10 !text-[#10B981]'
                              : 'bg-[#F43F5E]/10 !text-[#F43F5E]'
                              }`}>
                              {(tx.type === 'income' || tx.type === 'ADD') ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                            </div>
                            <div>
                              <p className="font-medium !text-white">{tx.message || tx.category}</p>
                              <p className="text-xs !text-[#9CA3AF] capitalize">
                                {tx.category} • {tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'Today')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-mono font-bold ${(tx.type === 'income' || tx.type === 'ADD') ? '!text-[#34D399]' : '!text-[#FB7185]'
                              }`}>
                              {(tx.type === 'income' || tx.type === 'ADD') ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Dashboard;
