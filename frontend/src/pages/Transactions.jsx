import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiFilter, FiDownload, FiArrowUpRight, FiArrowDownLeft,
    FiCalendar, FiChevronDown, FiActivity, FiArrowLeft, FiTag, FiClock, FiDollarSign
} from 'react-icons/fi';
import SearchAndFilters from '../components/SearchAndFilters';
import DashboardSkeleton from '../components/LoadingSkeleton';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Transactions = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        type: '',
        minAmount: '',
        maxAmount: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (currentUser) {
            fetchTransactions();
        }
    }, [currentUser, filters]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = await currentUser.getIdToken();
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`${API_ENDPOINTS.TRANSACTIONS}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTransactions(data.transactions || []);
            } else {
                toast.error('Failed to fetch transactions');
            }
        } catch (err) {
            toast.error('Error fetching transactions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && transactions.length === 0) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="text-slate-200 font-sans pb-12 relative pt-8 w-full min-h-screen flex justify-center">
            <Toaster position="bottom-center" />

            <div className="w-full max-w-7xl px-8 md:px-16 lg:px-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2" style={{ color: '#ffffff' }}>
                            Transaction <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Ledger</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Audit every digital footprint and financial movement</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Records</span>
                            <span className="text-xl font-mono font-bold text-white">{transactions.length}</span>
                        </div>
                        <button className="p-4 bg-cyan-500 text-white rounded-2xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
                            <FiDownload size={24} />
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-12">
                    <div className="bg-[#0B1121] border border-white/5 rounded-3xl p-6 shadow-2xl">
                        <SearchAndFilters onFilterChange={setFilters} activeFilters={filters} />
                    </div>
                </div>

                {/* Transactions list */}
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {transactions.map((tx, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    key={tx._id || idx}
                                    className="bg-[#0B1121] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-[#161e31] hover:border-white/10 transition-all duration-300 shadow-xl group"
                                >
                                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${(tx.type === 'income' || tx.type === 'ADD')
                                            ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                                            : 'bg-rose-500/10 text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]'}`}>
                                            {(tx.type === 'income' || tx.type === 'ADD') ? <FiArrowDownLeft size={28} /> : <FiArrowUpRight size={28} />}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-xl text-slate-100 group-hover:text-white transition-colors mb-1">{tx.message || tx.category}</p>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5 ${(tx.type === 'income' || tx.type === 'ADD') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                                                    <FiTag size={10} /> {tx.category}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5 italic">
                                                    <FiCalendar size={12} />
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5 italic">
                                                    <FiClock size={12} />
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-8">
                                        <div className={`font-mono font-black text-3xl tracking-tighter ${(tx.type === 'income' || tx.type === 'ADD') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(tx.type === 'income' || tx.type === 'ADD') ? '+' : '-'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0B1121] border border-white/5 border-dashed rounded-[3rem] p-24 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                                <FiSearch size={48} className="opacity-20" />
                            </div>
                            <p className="text-2xl font-bold text-slate-400">No transactions found</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-sm text-center">Try adjusting your filters or search terms to find what you're looking for.</p>
                            <button
                                onClick={() => setFilters({ search: '', category: '', type: '', minAmount: '', maxAmount: '', startDate: '', endDate: '' })}
                                className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 font-bold"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;
