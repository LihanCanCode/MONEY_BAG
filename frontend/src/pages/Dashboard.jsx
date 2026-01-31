import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiMinus, FiRefreshCw, FiSearch, FiFilter, FiDownload, FiTrash2, FiEdit2,
  FiCheck, FiX, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiPieChart, FiActivity,
  FiDollarSign, FiCalendar, FiClock, FiArrowUpRight, FiArrowDownLeft, FiSmile, FiZap,
  FiCamera, FiList, FiPlusCircle, FiMinusCircle, FiChevronDown, FiRefreshCcw,
  FiArrowUp, FiArrowDown, FiBriefcase
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
  const [showTransactionModal, setShowTransactionModal] = useState(false);

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
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 pb-24 relative overflow-x-hidden">

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

      {/* Navigation / Command Bar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-[#020617]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <FiDollarSign size={24} className="stroke-[3px]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Money<span className="text-cyan-400">Bag</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {['Overview', 'Analytics', 'Reports'].map(item => (
                <button key={item} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${item === 'Overview' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <button onClick={() => setShowTransactionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-cyan-50 rounded-lg font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95">
                <FiPlus size={18} /> <span className="hidden sm:inline">Add New</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white font-bold ring-2 ring-transparent hover:ring-cyan-500/50 transition-all cursor-pointer">
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-8 md:px-12 py-12">

        {/* HERO SECTION - Cockpit Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-40">
          {/* Net Worth Display */}
          <div className="lg:col-span-8 relative group mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div className="relative bg-[#0B1121] border border-white/10 rounded-[2rem] py-3 px-8 h-full flex flex-col justify-between overflow-hidden shadow-2xl">
              {/* Background texture */}
              <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(34, 211, 238, 0.15), transparent 40%)' }}></div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"></span>
                    LIVE BALANCE
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-0.5 drop-shadow-xl">
                    $<AnimatedCounter value={wallet?.currentBalance || 0} decimals={2} />
                  </h1>
                  <p className="text-slate-400 font-medium text-xs tracking-wide">Total liquid assets available</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors shadow-lg group/refresh cursor-pointer" onClick={handleResetWallet}>
                  <FiRefreshCcw className="text-slate-400 group-hover/refresh:text-white transition-colors group-hover/refresh:rotate-180 duration-700" size={20} />
                </div>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]"><FiArrowDownLeft size={20} /></div>
                  <div>
                    <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-widest block mb-0.5 font-bold opacity-80">Income</span>
                    <div className="text-xl font-bold text-white tracking-tight">
                      +$<AnimatedCounter value={wallet?.totalIncome || 0} decimals={2} />
                    </div>
                  </div>
                </div>
                <div className="bg-fuchsia-500/5 hover:bg-fuchsia-500/10 border border-fuchsia-500/10 hover:border-fuchsia-500/30 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 bg-fuchsia-500/20 rounded-xl text-fuchsia-400 flex items-center justify-center shadow-[0_0_15px_rgba(232,121,249,0.2)]"><FiArrowUpRight size={20} /></div>
                  <div>
                    <span className="text-fuchsia-400 font-mono text-[9px] uppercase tracking-widest block mb-0.5 font-bold opacity-80">Expense</span>
                    <div className="text-xl font-bold text-white tracking-tight">
                      -$<AnimatedCounter value={wallet?.totalExpense || 0} decimals={2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <button className="w-full bg-[#1e293b]/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:border-purple-500/30 hover:bg-[#1e293b]/60 transition-all cursor-pointer shadow-xl appearance-none" onClick={() => setShowAIInput(true)}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-4 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative z-10">
                <FiZap size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">AI Quick Add</h3>
              <p className="text-slate-400 text-xs relative z-10 leading-relaxed font-medium">Auto-categorize transactions<br />from natural text</p>
            </button>

            <button className="w-full bg-[#1e293b]/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:border-sky-500/30 hover:bg-[#1e293b]/60 transition-all cursor-pointer shadow-xl appearance-none" onClick={() => setShowReceiptScanner(true)}>
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 bg-sky-500/10 rounded-3xl flex items-center justify-center text-sky-400 border border-sky-500/20 mb-4 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(14,165,233,0.15)] relative z-10">
                <FiCamera size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Scan Receipt</h3>
              <p className="text-slate-400 text-xs relative z-10 leading-relaxed font-medium">Extract details instantly<br />from photos</p>
            </button>
          </div>
        </div>

        {/* ANALYTICS & LIST GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-20">

          {/* Transaction Feed */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex items-center gap-3">
                <FiList className="text-cyan-500" size={24} />
                <h3 className="font-bold text-2xl text-white">Recent Activity</h3>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowAllTransactions(true); }} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 text-sm font-bold transition-all border border-white/5 hover:border-white/10 cursor-pointer relative z-50">
                View All
              </button>
            </div>

            <div className="flex-1">
              {recentTransactions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {recentTransactions.slice(0, 7).map((tx, idx) => (
                    <div key={idx} className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-[#1e293b]/60 hover:border-white/10 hover:scale-[1.01] transition-all duration-300 shadow-sm cursor-default group">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${(tx.type === 'income' || tx.type === 'ADD')
                          ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]'
                          : 'bg-rose-500/10 text-rose-400 shadow-[inset_0_0_15px_rgba(244,63,94,0.1)]'}`}>
                          {(tx.type === 'income' || tx.type === 'ADD') ? <FiArrowDownLeft size={24} /> : <FiArrowUpRight size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors mb-1">{tx.message || tx.category}</p>
                          <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-black/20 border border-white/5 uppercase text-[10px] tracking-wider">{tx.category}</span>
                            {tx.date ? new Date(tx.date).toLocaleDateString() : 'Today'}
                          </p>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-xl ${(tx.type === 'income' || tx.type === 'ADD') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(tx.type === 'income' || tx.type === 'ADD') ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1e293b]/30 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-500">
                  <FiActivity size={48} className="mb-4 opacity-30" />
                  <p className="text-lg">No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Analytics Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#0B1121] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="font-bold text-lg text-white">Focus Category</h3>
                <select className="bg-white/5 border border-white/10 rounded-lg text-xs p-2 text-slate-300 outline-none">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>

              {/* Styled Chart Container */}
              <div className="w-full h-[300px] relative z-10">
                <SpendingChart wallet={wallet} />
              </div>

              {/* Decorative Glow */}
              {/* Decorative Glow */}
              <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-[#0B1121] border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
              <h3 className="text-xl font-bold text-white mb-2">Financial Health</h3>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">94%</div>
              <p className="text-sm text-indigo-200/60">Excellent! Your spending is well optimized.</p>
            </div>

          </div>

        </div>
      </div>

      {/* MODALS SECTION - Re-styled for consistency */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTransactionModal(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl shadow-black/50">

              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white">Add Transaction</h3>
                <button onClick={() => setShowTransactionModal(false)} className="text-slate-400 hover:text-white transition-colors"><FiX size={24} /></button>
              </div>

              <div className="p-8">
                <form onSubmit={handleTransactionSubmit} className="space-y-6">

                  <div className="grid grid-cols-2 gap-2 bg-[#020617] p-1 rounded-xl border border-white/5">
                    <button type="button" onClick={() => setTransactionType('expense')} className={`py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${transactionType === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                      Expense
                    </button>
                    <button type="button" onClick={() => setTransactionType('income')} className={`py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${transactionType === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                      Income
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-light">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#020617] border border-white/10 text-white p-4 pl-10 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-3xl font-bold placeholder-slate-700 transition-all font-mono"
                        autoFocus
                      />
                    </div>
                  </div>

                  {transactionType === 'expense' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Category</label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-[#020617] border border-white/10 text-white p-4 rounded-xl focus:border-cyan-500 outline-none appearance-none font-medium cursor-pointer hover:border-white/20 transition-all"
                        >
                          {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this for?"
                      className="w-full bg-[#020617] border border-white/10 text-white p-4 rounded-xl focus:border-cyan-500 outline-none resize-none placeholder-slate-700 min-h-[100px]"
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg ${transactionType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                    {isSubmitting ? 'Processing...' : `Confirm ${transactionType === 'income' ? 'Income' : 'Expense'}`}
                  </button>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fancy AI Popup (Preserved Logic) */}
      <AnimatePresence>
        {showFancyPopup && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 right-8 z-50 max-w-sm w-full">
            <div className="bg-[#1E293B]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl text-white shadow-lg"><FiZap size={20} /></div>
                <div>
                  <h4 className="font-bold text-white mb-1">AI Insight</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">"{fancyMessage}"</p>
                </div>
                <button onClick={() => setShowFancyPopup(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><FiX size={16} /></button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* AI Quick Add Modal */}
      <AnimatePresence>
        {showAIInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAIInput(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-purple-500/20 rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl shadow-purple-500/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-purple-500/5">
                <div className="flex items-center gap-2">
                  <FiZap className="text-purple-400" size={24} />
                  <h3 className="text-xl font-bold text-white">AI Wisdom Add</h3>
                </div>
                <button onClick={() => setShowAIInput(false)} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
              </div>
              <div className="p-8">
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="e.g., 'I spent 50 dollars on sushi today' or 'Got 2000 salary from work'"
                  className="w-full bg-[#020617] border border-white/10 text-white p-6 rounded-2xl focus:border-purple-500 outline-none resize-none min-h-[160px] text-lg placeholder-slate-600"
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAIProcessing}
                  disabled={aiLoading || !aiText.trim()}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                >
                  {aiLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                  {aiLoading ? 'AI is Thinking...' : 'Analyze & Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showReceiptScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowReceiptScanner(false)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-sky-500/20 rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl shadow-sky-500/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-sky-500/5">
                <div className="flex items-center gap-2">
                  <FiCamera className="text-sky-400" size={24} />
                  <h3 className="text-xl font-bold text-white">Optical Receipt Scanner</h3>
                </div>
                <button onClick={() => setShowReceiptScanner(false)} className="text-slate-400 hover:text-white"><FiX size={24} /></button>
              </div>
              <div className="p-8">
                {!receiptPreview ? (
                  <label className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-sky-500/30 transition-all">
                    <FiDownload className="text-slate-500 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">Drop receipt or click to upload</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>
                ) : (
                  <div className="space-y-6">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black">
                      <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-contain" />
                      <button onClick={() => { setReceiptPreview(null); setSelectedReceipt(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <button
                      onClick={handleReceiptScan}
                      disabled={receiptLoading}
                      className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      {receiptLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                      {receiptLoading ? 'Scanning Pixels...' : 'Start Extraction'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full History Modal */}
      <AnimatePresence>
        {showAllTransactions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAllTransactions(false)} />
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[85vh] relative z-20 flex flex-col overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.1)]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Full Ledger</h3>
                  <p className="text-slate-400 text-sm mt-1">Audit and filter every digital footprint</p>
                </div>
                <button onClick={() => setShowAllTransactions(false)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all">
                  <FiX size={28} />
                </button>
              </div>

              <div className="p-6 bg-white/[0.01] border-b border-white/5">
                <SearchAndFilters onFilterChange={setFilters} activeFilters={filters} />
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {wallet?.transactions?.length > 0 ? (
                    wallet.transactions.map((tx, idx) => (
                      <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${(tx.type === 'income' || tx.type === 'ADD')
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'}`}>
                            {(tx.type === 'income' || tx.type === 'ADD') ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{tx.message || tx.category}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 uppercase text-[10px] text-slate-400 tracking-wider ">{tx.category}</span>
                              <span className="text-xs text-slate-500 font-mono">{new Date(tx.date).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`font-mono font-black text-xl ${(tx.type === 'income' || tx.type === 'ADD') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(tx.type === 'income' || tx.type === 'ADD') ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <FiSearch size={48} className="mb-4 opacity-20" />
                      <p className="text-xl font-medium">No transactions found for the current filters</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
