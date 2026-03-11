import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiMinus, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiTrash2, FiEdit2,
  FiCheck, FiX, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiPieChart, FiActivity,
  FiDollarSign, FiCalendar, FiClock, FiArrowUpRight, FiArrowDownLeft, FiSmile, FiZap,
  FiCamera, FiList, FiPlusCircle, FiMinusCircle, FiChevronDown, FiRefreshCcw,
  FiArrowUp, FiArrowDown, FiBriefcase, FiTarget
} from 'react-icons/fi';
import AnimatedCounter from '../components/AnimatedCounter';
import DashboardSkeleton from '../components/LoadingSkeleton';
import SpendingChart from '../components/SpendingChart';
import SearchAndFilters from '../components/SearchAndFilters';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { Link } from 'react-router-dom';

// Categories available for spending
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
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSaveToGoalModal, setShowSaveToGoalModal] = useState(false);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [saveAmount, setSaveAmount] = useState('');

  const calculateFinancialHealth = () => {
    if (!wallet || wallet.totalIncome === 0) return { score: 0, message: 'Add income to calculate' };

    const savingsRate = ((wallet.totalIncome - wallet.totalExpense) / wallet.totalIncome) * 100;
    const score = Math.max(0, Math.min(100, Math.round(savingsRate)));

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
        // Only show active goals
        setGoals(data.filter(g => !g.isCompleted));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

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

  // Transaction Handlers

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

  // AI Quick Add Processing
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

  // Receipt Scanner Processing
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  const recentTransactions = wallet?.transactions || [];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 pb-24 relative overflow-x-hidden w-full flex justify-center">

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} colors={['#22d3ee', '#e879f9', '#ffffff']} />
      )}

      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #1e293b' },
      }} />

      {/* Main Content Container */}
      <div className="w-full max-w-7xl px-8 md:px-12 lg:px-16">
        {/* Hero Header Space */}
        <div className="h-6 w-full" />

        <div className="py-12">

          {/* HERO SECTION - Cockpit Style */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24">
            {/* Net Worth Display */}
            <div className="lg:col-span-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
              <div className="relative bg-[#0B1121] border border-white/10 rounded-2xl p-10 h-full flex flex-col justify-center overflow-hidden shadow-2xl">
                {/* Background texture */}
                <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(34, 211, 238, 0.15), transparent 40%)' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Live Balance</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl md:text-7xl font-black text-white tracking-tighter shadow-sm">
                        $<AnimatedCounter value={wallet?.currentBalance || 0} decimals={2} />
                      </span>
                      <span className="text-slate-400 text-xs font-medium ml-3 font-bold opacity-30 uppercase tracking-widest">Digital Assets</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => setShowSaveToGoalModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 hover:from-cyan-500/30 hover:to-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold text-xs transition-all active:scale-95 group shadow-lg shadow-cyan-500/10"
                    >
                      <FiTarget className="group-hover:rotate-12 transition-transform" />
                      Move to Savings
                    </button>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors shadow-xl group/refresh cursor-pointer" onClick={handleResetWallet}>
                      <FiRefreshCcw className="text-slate-400 group-hover/refresh:text-white transition-colors group-hover/refresh:rotate-180 duration-700" size={20} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-xl text-emerald-400 flex items-center justify-center shadow-inner"><FiTrendingUp size={28} /></div>
                    <div>
                      <span className="text-slate-300 font-mono text-[10px] uppercase tracking-widest block mb-1 font-black opacity-60">Inflow Growth</span>
                      <div className="text-2xl font-black text-white tracking-tight">
                        +$<AnimatedCounter value={wallet?.totalIncome || 0} decimals={2} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300">
                    <div className="w-14 h-14 bg-rose-500/10 rounded-xl text-rose-400 flex items-center justify-center shadow-inner"><FiTrendingDown size={28} /></div>
                    <div>
                      <span className="text-slate-300 font-mono text-[10px] uppercase tracking-widest block mb-1 font-black opacity-60">Outflow Velocity</span>
                      <div className="text-2xl font-black text-white tracking-tight">
                        -$<AnimatedCounter value={wallet?.totalExpense || 0} decimals={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex-1 bg-[#0B1121] border border-white/10 rounded-2xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-[#161e31] transition-all cursor-pointer shadow-xl active:scale-[0.98]" onClick={() => setShowTransactionModal(true)}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <FiPlus size={32} />
                </div>
                <h3 className="text-xl font-black mb-2 relative z-10" style={{ color: '#ffffff' }}>Manual Entry</h3>
                <p className="text-slate-300 text-[10px] relative z-10 font-black tracking-widest uppercase opacity-60">Precision Ledger Tracking</p>
              </div>

              <div className="flex-1 bg-[#0B1121] border border-white/10 rounded-2xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-[#161e31] transition-all cursor-pointer shadow-xl active:scale-[0.98]" onClick={() => setShowAIInput(true)}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-4 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <FiZap size={32} />
                </div>
                <h3 className="text-xl font-black mb-2 relative z-10" style={{ color: '#ffffff' }}>AI Quick Add</h3>
                <p className="text-slate-300 text-[10px] relative z-10 font-black tracking-widest uppercase opacity-60">Cognitive Pattern Auto-fill</p>
              </div>

              <div className="flex-1 bg-[#0B1121] border border-white/10 rounded-2xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-[#161e31] transition-all cursor-pointer shadow-xl active:scale-[0.98]" onClick={() => setShowReceiptScanner(true)}>
                <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20 mb-4 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                  <FiCamera size={32} />
                </div>
                <h3 className="text-xl font-black mb-2 relative z-10" style={{ color: '#ffffff' }}>Scan Receipt</h3>
                <p className="text-slate-300 text-[10px] relative z-10 font-black tracking-widest uppercase opacity-60">OCR Computer Vision Engine</p>
              </div>
            </div>
          </div>

          {/* SECTION DIVIDER */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-24 opacity-30 mt-24"></div>

          {/* GRAPHS SECTION */}
          <div className="mb-24 px-4">
            <SpendingChart wallet={wallet} />
          </div>

          {/* FINANCIAL HEALTH GAUGE */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="bg-[#0B1121] border border-white/5 rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-1 tracking-tight" style={{ color: '#ffffff' }}>Financial Health Gauge</h3>
                <p className="text-slate-300 font-medium">{health.message}</p>
              </div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="text-right">
                  <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest block mb-1 font-mono">Efficiency Score</span>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{health.score}%</div>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-white/5 flex items-center justify-center relative shadow-inner">
                  <div className="absolute inset-0 bg-cyan-400 rounded-full scale-[0.1] blur-md opacity-30"></div>
                  <FiTrendingUp className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODALS SECTION - Re-styled for Elite Perfection */}
        <AnimatePresence>
          {showTransactionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setShowTransactionModal(false)} />
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-xl relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.6)]">

                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative rounded-t-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                  <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">Add Ledger Entry</h3>
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">Manual Financial Transaction Log</p>
                  </div>
                  <button onClick={() => setShowTransactionModal(false)} className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <FiX size={24} />
                  </button>
                </div>

                <div className="p-12">
                  <form onSubmit={handleTransactionSubmit} className="space-y-12">
                    {/* Type Toggle - Obsidian Style */}
                    <div className="flex p-2 bg-[#020617] rounded-lg border border-white/5 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setTransactionType('expense')}
                        className={`flex-1 py-4 rounded text-xs font-bold transition-all duration-300 ${transactionType === 'expense'
                          ? 'bg-white text-[#020617] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                          : 'text-slate-300 hover:text-white'
                          }`}
                      >
                        EXPENSE
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType('income')}
                        className={`flex-1 py-4 rounded text-xs font-bold transition-all duration-300 ${transactionType === 'income'
                          ? 'bg-white text-[#020617] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                          : 'text-slate-300 hover:text-white'
                          }`}
                      >
                        INCOME
                      </button>
                    </div>

                    <div className="space-y-10">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-1">Value Amount ($)</label>
                        <div className="relative group">
                          <div className="absolute inset-0 bg-white/5 rounded-lg blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="relative w-full bg-[#020617] border border-white/10 text-white p-8 rounded-lg focus:border-white/30 outline-none text-6xl font-bold placeholder-slate-500 transition-all text-center"
                            autoFocus
                          />
                        </div>
                      </div>

                      {transactionType === 'expense' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-1">Classification Category</label>
                          <div className="relative">
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full bg-[#020617] border border-white/10 text-white p-6 rounded-lg focus:border-white/30 outline-none appearance-none font-semibold cursor-pointer hover:bg-white/5 transition-all text-base"
                            >
                              {categories.map(cat => <option key={cat.value} value={cat.value} className="bg-[#0f172a]">{cat.label}</option>)}
                            </select>
                            <FiChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                          </div>
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-1">Detailed Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide transaction context..."
                          className="w-full bg-[#020617] border border-white/10 text-white p-6 rounded-lg focus:border-white/30 outline-none resize-none placeholder-slate-500 min-h-[140px] font-medium text-base transition-all leading-relaxed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 rounded-lg font-bold text-[#020617] bg-white hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all text-xl tracking-wide uppercase mt-6"
                    >
                      {isSubmitting ? 'PROCESSING...' : `COMMIT ${transactionType.toUpperCase()} ENTRY`}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence >

        <AnimatePresence>
          {showFancyPopup && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 right-8 z-50 max-w-sm w-full">
              <div className="bg-[#1E293B]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl text-white shadow-lg">
                    <FiZap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">AI Insight</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">"{fancyMessage}"</p>
                  </div>
                  <button onClick={() => setShowFancyPopup(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAIInput && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setShowAIInput(false)} />
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f172a] border border-purple-500/20 rounded-xl w-full max-w-xl relative z-10 shadow-[0_0_80px_rgba(168,85,247,0.2)]">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-purple-500/[0.03] relative rounded-t-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                      <FiZap size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">AI Wisdom Engine</h3>
                      <p className="text-purple-400/60 text-[10px] font-bold uppercase tracking-widest mt-2">Natural Language Cognitive Processing</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAIInput(false)} className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <FiX size={24} />
                  </button>
                </div>
                <div className="p-12">
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="e.g., 'Spent $45 on organic groceries today'..."
                    className="w-full bg-[#020617] border border-white/10 text-white p-8 rounded-lg focus:border-purple-500/40 outline-none resize-none min-h-[220px] text-xl font-medium placeholder-slate-500 transition-all leading-relaxed"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={handleAIProcessing}
                    disabled={aiLoading || !aiText.trim()}
                    className="w-full mt-10 py-6 rounded-lg font-bold text-[#020617] bg-white hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all flex items-center justify-center gap-4 uppercase tracking-wide text-xl"
                  >
                    {aiLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                    {aiLoading ? 'TRANSCRIBING...' : 'DECODER & COMMIT TO LEDGER'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReceiptScanner && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setShowReceiptScanner(false)} />
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f172a] border border-sky-500/20 rounded-xl w-full max-w-2xl relative z-10 shadow-[0_0_80px_rgba(14,165,233,0.2)]">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-sky-500/[0.03] relative rounded-t-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-sky-500/20 rounded-lg flex items-center justify-center text-sky-400">
                      <FiCamera size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">Vision Scanner</h3>
                      <p className="text-sky-400/60 text-[10px] font-bold uppercase tracking-widest mt-2">Precision OCR Data Extraction</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReceiptScanner(false)} className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <FiX size={24} />
                  </button>
                </div>
                <div className="p-12">
                  {!receiptPreview ? (
                    <label className="border-2 border-dashed border-white/10 rounded-lg p-20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-sky-500/40 transition-all group">
                      <div className="w-24 h-24 bg-sky-500/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <FiDownload className="text-sky-400" size={40} />
                      </div>
                      <p className="text-white font-bold text-2xl mb-3">Upload Financial Receipt</p>
                      <p className="text-slate-300 text-base font-semibold">Securely analyze JPG, PNG or high-res PDF</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </label>
                  ) : (
                    <div className="space-y-12">
                      <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-video bg-[#020617] group">
                        <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-contain" />
                        <button onClick={() => { setReceiptPreview(null); setSelectedReceipt(null); }} className="absolute top-6 right-6 bg-rose-500 text-white p-4 rounded-lg hover:bg-rose-600 transition-all shadow-2xl opacity-0 group-hover:opacity-100">
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                      <button
                        onClick={handleReceiptScan}
                        disabled={receiptLoading}
                        className="w-full py-6 rounded-lg font-bold text-[#020617] bg-white hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all flex items-center justify-center gap-4 uppercase tracking-wide text-xl"
                      >
                        {receiptLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                        {receiptLoading ? 'ANALYZING DOCUMENT...' : 'EXECUTE VISION SCAN'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSaveToGoalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setShowSaveToGoalModal(false)} />
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0f172a] border border-cyan-500/20 rounded-xl w-full max-w-xl relative z-10 shadow-[0_0_80px_rgba(34,211,238,0.2)]">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-cyan-500/[0.03] relative rounded-t-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                      <FiTarget size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">Smart Transfer</h3>
                      <p className="text-cyan-400/60 text-[10px] font-bold uppercase tracking-widest mt-2">Strategic Savings Injection Pipeline</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSaveToGoalModal(false)} className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <FiX size={24} />
                  </button>
                </div>

                <div className="p-12">
                  {goals.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <FiTarget className="text-slate-600" size={40} />
                      </div>
                      <p className="text-white font-bold text-2xl mb-3">No Active Targets</p>
                      <p className="text-slate-300 text-lg mb-10 font-semibold">Initialize a financial milestone before allocating funds.</p>
                      <button
                        onClick={() => setShowSaveToGoalModal(false)}
                        className="px-10 py-4 bg-white text-[#020617] rounded-lg font-bold uppercase tracking-wide text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                        NAVIGATE TO GOALS
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveToGoal} className="space-y-12">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-1">Destination Milestone</label>
                        <div className="relative">
                          <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 text-white p-6 rounded-lg focus:border-white/30 outline-none appearance-none font-semibold cursor-pointer hover:bg-white/5 transition-all text-base"
                            required
                          >
                            <option value="" className="bg-[#0f172a]">Select Financial Destination...</option>
                            {goals.map(goal => (
                              <option key={goal._id} value={goal._id} className="bg-[#0f172a] text-white">
                                {goal.name} (${goal.targetAmount.toLocaleString()})
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-1">Allocated Capital ($)</label>
                        <input
                          type="number"
                          value={saveAmount}
                          onChange={(e) => setSaveAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#020617] border border-white/10 text-white p-8 rounded-lg focus:border-white/30 outline-none text-6xl font-bold placeholder-slate-500 transition-all text-center"
                          required
                          min="0.01"
                          step="0.01"
                        />
                        <div className="mt-6 flex items-center justify-between px-2">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Liquid Assets Pool</span>
                          <span className="text-lg font-bold text-cyan-400">${wallet?.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                        </div>
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-lg font-bold text-[#020617] bg-white hover:bg-slate-200 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-4 uppercase tracking-wide text-xl mt-6">
                        {isSubmitting ? 'TRANSFERRING...' : 'EXECUTE CAPITAL MIGRATION'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default Dashboard;
