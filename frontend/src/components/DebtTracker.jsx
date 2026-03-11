/**
 * DebtTracker Component
 * Track money owed to/by the user with DRAMATIC FLAIR! 🎭💰
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import {
    FaPlus, FaMinus, FaCheck, FaTimes, FaHandHoldingUsd,
    FaMoneyBillWave, FaUserFriends, FaExclamationTriangle,
    FaCalendarAlt, FaHistory, FaSkull, FaHeart, FaBriefcase,
    FaUsers, FaQuestionCircle, FaClock, FaUserSecret
} from 'react-icons/fa';
import { GiReceiveMoney, GiPayMoney, GiDramaMasks } from 'react-icons/gi';
import Confetti from 'react-confetti';
import toast, { Toaster } from 'react-hot-toast';

// Drama label configurations with emojis and colors
const DRAMA_LABELS = [
    { value: 'trustworthy', label: 'Trustworthy', emoji: '😇', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.2)' },
    { value: 'best_friend', label: 'Best Friend', emoji: '🤝', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.2)' },
    { value: 'family', label: 'Family', emoji: '👨‍👩‍👧', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.2)' },
    { value: 'colleague', label: 'Colleague', emoji: '💼', color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.2)' },
    { value: 'suspicious', label: 'Suspicious', emoji: '🤨', color: '#EAB308', bgColor: 'rgba(234, 179, 8, 0.2)' },
    { value: 'always_late', label: 'Always Late', emoji: '⏰', color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.2)' },
    { value: 'doubtful', label: 'Doubtful', emoji: '😬', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)' },
    { value: 'sworn_enemy', label: 'Sworn Enemy', emoji: '😈', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.2)' }
];

const getDramaLabel = (value) => {
    return DRAMA_LABELS.find(l => l.value === value) || DRAMA_LABELS[0];
};

const DebtTracker = () => {
    const { currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [summary, setSummary] = useState({ totalOwedToMe: 0, totalIOwe: 0, overdueCount: 0 });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState('owed_to_me');
    const [showAmountModal, setShowAmountModal] = useState(null);
    const [amountModalType, setAmountModalType] = useState('add');
    const [showConfetti, setShowConfetti] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        personName: '',
        amount: '',
        description: '',
        dueDate: '',
        dramaLabel: 'trustworthy'
    });

    const [amountInput, setAmountInput] = useState('');
    const [amountNote, setAmountNote] = useState('');

    useEffect(() => {
        if (currentUser) {
            fetchDebts();
            fetchSummary();
        }
    }, [currentUser]);

    const fetchDebts = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBTS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDebts(data);
            }
        } catch (error) {
            console.error('Error fetching debts:', error);
            toast.error('Failed to load debts');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBT_SUMMARY, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBTS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    type: createType,
                    dueDate: formData.dueDate || null
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(data.message, {
                    duration: 4000,
                    icon: '📜',
                    style: {
                        background: '#1E293B',
                        color: '#fff',
                        border: '1px solid #10B981'
                    }
                });
                resetForm();
                fetchDebts();
                fetchSummary();
            } else {
                // Show dramatic error toast for insufficient balance
                toast.error(data.error || 'Failed to create debt', {
                    duration: 5000,
                    icon: '🚫',
                    style: {
                        background: '#7F1D1D',
                        color: '#FEF2F2',
                        border: '2px solid #EF4444',
                        padding: '16px',
                        maxWidth: '500px',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        lineHeight: '1.5',
                        zIndex: 9999
                    }
                });
            }
        } catch (error) {
            console.error('Error creating debt:', error);
            toast.error('An error occurred', {
                duration: 4000,
                style: {
                    background: '#7F1D1D',
                    color: '#FEF2F2',
                    border: '2px solid #EF4444'
                }
            });
        }
    };

    const handleAddToDebt = async (debtId) => {
        if (!amountInput || parseFloat(amountInput) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBT_ADD(debtId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amountInput),
                    note: amountNote
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message, {
                    duration: 3000,
                    icon: '📈',
                    style: { background: '#1E293B', color: '#fff' }
                });
                setShowAmountModal(null);
                setAmountInput('');
                setAmountNote('');
                fetchDebts();
                fetchSummary();
            }
        } catch (error) {
            console.error('Error adding to debt:', error);
            toast.error('Failed to add to debt');
        }
    };

    const handleSubtractFromDebt = async (debtId) => {
        if (!amountInput || parseFloat(amountInput) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBT_SUBTRACT(debtId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amountInput),
                    note: amountNote
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message, {
                    duration: 3000,
                    icon: '💫',
                    style: { background: '#1E293B', color: '#fff' }
                });
                setShowAmountModal(null);
                setAmountInput('');
                setAmountNote('');
                fetchDebts();
                fetchSummary();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to subtract from debt');
            }
        } catch (error) {
            console.error('Error subtracting from debt:', error);
            toast.error('Failed to subtract from debt');
        }
    };

    const handleResolveDebt = async (debtId, personName) => {
        if (!confirm(`Are you sure you want to resolve the debt with ${personName}? This will mark it as fully paid.`)) {
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.DEBT_BY_ID(debtId), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
                toast.success(data.message, {
                    duration: 5000,
                    icon: '🎉',
                    style: {
                        background: '#1E293B',
                        color: '#fff',
                        border: '2px solid #10B981'
                    }
                });
                fetchDebts();
                fetchSummary();
            }
        } catch (error) {
            console.error('Error resolving debt:', error);
            toast.error('Failed to resolve debt');
        }
    };

    const resetForm = () => {
        setFormData({
            personName: '',
            amount: '',
            description: '',
            dueDate: '',
            dramaLabel: 'trustworthy'
        });
        setShowCreateModal(false);
    };

    const openCreateModal = (type) => {
        setCreateType(type);
        setShowCreateModal(true);
    };

    const openAmountModal = (debt, type) => {
        setShowAmountModal(debt);
        setAmountModalType(type);
        setAmountInput('');
        setAmountNote('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const owedToMe = debts.filter(d => d.type === 'owed_to_me');
    const iOwe = debts.filter(d => d.type === 'i_owe');

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                color: 'white',
                background: '#0B0F1A'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#10B981',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '1rem' }}>Loading debts...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="debt-tracker">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
            
            {/* Toast container with high z-index to appear above modals */}
            <Toaster 
                position="top-center"
                containerStyle={{
                    zIndex: 99999
                }}
                toastOptions={{
                    style: {
                        zIndex: 99999
                    }
                }}
            />

            {/* Header */}
            <div className="debt-header">
                <div className="header-title">
                    <GiDramaMasks className="header-icon" />
                    <div>
                        <h1>Debt Tracker</h1>
                        <p className="header-subtitle">Where fortunes are lent and friendships are tested! 🎭</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <motion.div 
                    className="summary-card owed-to-me"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="summary-icon">
                        <GiReceiveMoney />
                    </div>
                    <div className="summary-content">
                        <span className="summary-label">They Owe Me</span>
                        <span className="summary-amount">${summary.totalOwedToMe.toFixed(2)}</span>
                        <span className="summary-count">{summary.owedToMeCount || 0} {summary.owedToMeCount === 1 ? 'person' : 'people'}</span>
                    </div>
                </motion.div>

                <motion.div 
                    className="summary-card i-owe"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="summary-icon">
                        <GiPayMoney />
                    </div>
                    <div className="summary-content">
                        <span className="summary-label">I Owe Them</span>
                        <span className="summary-amount">${summary.totalIOwe.toFixed(2)}</span>
                        <span className="summary-count">{summary.iOweCount || 0} {summary.iOweCount === 1 ? 'person' : 'people'}</span>
                    </div>
                </motion.div>

                {summary.overdueCount > 0 && (
                    <motion.div 
                        className="summary-card overdue-alert"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <div className="summary-icon">
                            <FaExclamationTriangle />
                        </div>
                        <div className="summary-content">
                            <span className="summary-label">⚠️ OVERDUE!</span>
                            <span className="summary-amount">{summary.overdueCount}</span>
                            <span className="summary-count">debts past due date</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Two Sections */}
            <div className="debt-sections">
                {/* They Owe Me Section */}
                <div className="debt-section">
                    <div className="section-header owed-to-me">
                        <div className="section-title">
                            <GiReceiveMoney />
                            <h2>They Owe Me 💰</h2>
                        </div>
                        <motion.button
                            className="add-btn"
                            onClick={() => openCreateModal('owed_to_me')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaPlus /> Add Debtor
                        </motion.button>
                    </div>

                    <div className="debt-list">
                        {owedToMe.length === 0 ? (
                            <div className="empty-state">
                                <FaHandHoldingUsd />
                                <p>No one owes you money... yet! 💸</p>
                            </div>
                        ) : (
                            owedToMe.map((debt) => (
                                <DebtCard
                                    key={debt._id}
                                    debt={debt}
                                    onAdd={() => openAmountModal(debt, 'add')}
                                    onSubtract={() => openAmountModal(debt, 'subtract')}
                                    onResolve={() => handleResolveDebt(debt._id, debt.personName)}
                                    onShowHistory={() => setShowHistoryModal(debt)}
                                    formatDate={formatDate}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* I Owe Them Section */}
                <div className="debt-section">
                    <div className="section-header i-owe">
                        <div className="section-title">
                            <GiPayMoney />
                            <h2>I Owe Them 😅</h2>
                        </div>
                        <motion.button
                            className="add-btn"
                            onClick={() => openCreateModal('i_owe')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaPlus /> Add Creditor
                        </motion.button>
                    </div>

                    <div className="debt-list">
                        {iOwe.length === 0 ? (
                            <div className="empty-state">
                                <FaMoneyBillWave />
                                <p>You don't owe anyone! Freedom! 🎉</p>
                            </div>
                        ) : (
                            iOwe.map((debt) => (
                                <DebtCard
                                    key={debt._id}
                                    debt={debt}
                                    onAdd={() => openAmountModal(debt, 'add')}
                                    onSubtract={() => openAmountModal(debt, 'subtract')}
                                    onResolve={() => handleResolveDebt(debt._id, debt.personName)}
                                    onShowHistory={() => setShowHistoryModal(debt)}
                                    formatDate={formatDate}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Debt Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            className="modal-content create-modal"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>
                                {createType === 'owed_to_me' ? (
                                    <><GiReceiveMoney /> Lend Money (They Owe You)</>
                                ) : (
                                    <><GiPayMoney /> Borrow Money (You Owe Them)</>
                                )}
                            </h3>

                            <form onSubmit={handleCreateDebt}>
                                <div className="form-group">
                                    <label><FaUserFriends /> Person's Name</label>
                                    <input
                                        type="text"
                                        value={formData.personName}
                                        onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                                        placeholder="Who's involved in this sacred pact?"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label><FaMoneyBillWave /> Amount ($)</label>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaCalendarAlt /> Due Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label><GiDramaMasks /> Drama Label</label>
                                    <div className="drama-label-grid">
                                        {DRAMA_LABELS.map((label) => (
                                            <button
                                                key={label.value}
                                                type="button"
                                                className={`drama-label-btn ${formData.dramaLabel === label.value ? 'selected' : ''}`}
                                                style={{
                                                    '--label-color': label.color,
                                                    '--label-bg': label.bgColor
                                                }}
                                                onClick={() => setFormData({ ...formData, dramaLabel: label.value })}
                                            >
                                                <span className="emoji">{label.emoji}</span>
                                                <span className="label-text">{label.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>📝 Description (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What's the story behind this debt?"
                                        rows={3}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <motion.button
                                        type="submit"
                                        className="btn-primary"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <FaCheck /> Seal the Pact
                                    </motion.button>
                                    <button type="button" className="btn-secondary" onClick={resetForm}>
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Subtract Amount Modal */}
            <AnimatePresence>
                {showAmountModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAmountModal(null)}
                    >
                        <motion.div
                            className="modal-content amount-modal"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>
                                {amountModalType === 'add' ? (
                                    <><FaPlus /> Add to Debt</>
                                ) : (
                                    <><FaMinus /> Subtract from Debt</>
                                )}
                            </h3>
                            <p className="modal-subtitle">
                                {amountModalType === 'add'
                                    ? `Increase ${showAmountModal.personName}'s debt`
                                    : `Record a payment from/to ${showAmountModal.personName}`
                                }
                            </p>
                            <p className="current-amount">
                                Current debt: <strong>${showAmountModal.amount.toFixed(2)}</strong>
                            </p>

                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input
                                    type="number"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    placeholder="0.00"
                                    min="0.01"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Note (Optional)</label>
                                <input
                                    type="text"
                                    value={amountNote}
                                    onChange={(e) => setAmountNote(e.target.value)}
                                    placeholder="Reason for this change..."
                                />
                            </div>

                            <div className="modal-actions">
                                <motion.button
                                    className={`btn-primary ${amountModalType === 'subtract' ? 'subtract' : ''}`}
                                    onClick={() => amountModalType === 'add'
                                        ? handleAddToDebt(showAmountModal._id)
                                        : handleSubtractFromDebt(showAmountModal._id)
                                    }
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {amountModalType === 'add' ? <><FaPlus /> Add</> : <><FaMinus /> Subtract</>}
                                </motion.button>
                                <button className="btn-secondary" onClick={() => setShowAmountModal(null)}>
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHistoryModal(null)}
                    >
                        <motion.div
                            className="modal-content history-modal"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3><FaHistory /> Debt History with {showHistoryModal.personName}</h3>
                            
                            <div className="history-list">
                                {showHistoryModal.history && showHistoryModal.history.length > 0 ? (
                                    showHistoryModal.history.map((entry, index) => (
                                        <div key={index} className={`history-entry ${entry.action}`}>
                                            <div className="history-icon">
                                                {entry.action === 'created' && '📜'}
                                                {entry.action === 'added' && '📈'}
                                                {entry.action === 'subtracted' && '📉'}
                                                {entry.action === 'resolved' && '✅'}
                                            </div>
                                            <div className="history-details">
                                                <span className="history-action">
                                                    {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                                                </span>
                                                <span className="history-amount">
                                                    {entry.action === 'subtracted' ? '-' : '+'}${entry.amount.toFixed(2)}
                                                </span>
                                                {entry.note && <span className="history-note">{entry.note}</span>}
                                                <span className="history-date">{formatDate(entry.date)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No history yet</p>
                                )}
                            </div>

                            <button className="btn-secondary" onClick={() => setShowHistoryModal(null)}>
                                <FaTimes /> Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .debt-tracker {
                    padding: 1.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    min-height: 100vh;
                    background: #0B0F1A;
                }

                .debt-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    width: 100%;
                    color: white;
                }

                .debt-loading .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #10B981;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .debt-header {
                    margin-bottom: 2rem;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-icon {
                    font-size: 3rem;
                    color: #10B981;
                }

                .debt-header h1 {
                    font-size: 2rem;
                    color: white;
                    margin: 0;
                }

                .header-subtitle {
                    color: #9CA3AF;
                    margin: 0.25rem 0 0;
                }

                /* Summary Cards */
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .summary-card {
                    background: #1E293B;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .summary-card.owed-to-me {
                    border-left: 4px solid #10B981;
                }

                .summary-card.i-owe {
                    border-left: 4px solid #F59E0B;
                }

                .summary-card.overdue-alert {
                    border-left: 4px solid #EF4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                .summary-icon {
                    font-size: 2.5rem;
                    padding: 1rem;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.05);
                }

                .owed-to-me .summary-icon { color: #10B981; }
                .i-owe .summary-icon { color: #F59E0B; }
                .overdue-alert .summary-icon { color: #EF4444; }

                .summary-content {
                    display: flex;
                    flex-direction: column;
                }

                .summary-label {
                    color: #9CA3AF;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .summary-amount {
                    color: white;
                    font-size: 1.75rem;
                    font-weight: 700;
                }

                .summary-count {
                    color: #64748B;
                    font-size: 0.8rem;
                }

                /* Debt Sections */
                .debt-sections {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 2rem;
                }

                .debt-section {
                    background: #111827;
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    flex-direction: column;
                    max-height: 700px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }

                .section-header.owed-to-me .section-title {
                    color: #10B981;
                }

                .section-header.owed-to-me .section-title h2 {
                    color: white;
                }

                .section-header.i-owe .section-title {
                    color: #F59E0B;
                }

                .section-header.i-owe .section-title h2 {
                    color: white;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .section-title h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .section-title svg {
                    font-size: 1.5rem;
                }

                .add-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.875rem;
                    flex-shrink: 0;
                }

                .debt-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    overflow-y: auto;
                    flex: 1;
                    min-height: 0;
                    padding-right: 0.5rem;
                }

                /* Custom scrollbar for debt list */
                .debt-list::-webkit-scrollbar {
                    width: 6px;
                }

                .debt-list::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.05);
                    border-radius: 3px;
                }

                .debt-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 3px;
                }

                .debt-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.3);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 3rem;
                    color: #64748B;
                }

                .empty-state svg {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                /* Modals */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: #1E293B;
                    border-radius: 16px;
                    padding: 2rem;
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .modal-content h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: white;
                    margin: 0 0 1.5rem;
                    font-size: 1.25rem;
                }

                .modal-subtitle {
                    color: #9CA3AF;
                    margin: -1rem 0 1rem;
                    font-size: 0.9rem;
                }

                .current-amount {
                    color: #64748B;
                    margin-bottom: 1rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    color: #9CA3AF;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
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

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                /* Drama Label Grid */
                .drama-label-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                }

                .drama-label-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.75rem 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .drama-label-btn:hover {
                    background: var(--label-bg);
                    border-color: var(--label-color);
                }

                .drama-label-btn.selected {
                    background: var(--label-bg);
                    border-color: var(--label-color);
                    box-shadow: 0 0 12px var(--label-bg);
                }

                .drama-label-btn .emoji {
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                }

                .drama-label-btn .label-text {
                    font-size: 0.65rem;
                    color: #9CA3AF;
                    text-align: center;
                }

                .drama-label-btn.selected .label-text {
                    color: var(--label-color);
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .btn-primary {
                    flex: 1;
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
                }

                .btn-primary.subtract {
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                }

                .btn-secondary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    background: rgba(255,255,255,0.05);
                    color: #9CA3AF;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                /* History Modal */
                .history-modal {
                    max-width: 450px;
                }

                .history-list {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 1.5rem;
                }

                .history-entry {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255,255,255,0.02);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    border-left: 3px solid #64748B;
                }

                .history-entry.created { border-left-color: #3B82F6; }
                .history-entry.added { border-left-color: #10B981; }
                .history-entry.subtracted { border-left-color: #F59E0B; }
                .history-entry.resolved { border-left-color: #8B5CF6; }

                .history-icon {
                    font-size: 1.5rem;
                }

                .history-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .history-action {
                    color: white;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .history-amount {
                    color: #10B981;
                    font-weight: 700;
                }

                .history-entry.subtracted .history-amount {
                    color: #F59E0B;
                }

                .history-note {
                    color: #9CA3AF;
                    font-size: 0.8rem;
                    font-style: italic;
                }

                .history-date {
                    color: #64748B;
                    font-size: 0.75rem;
                }

                @media (max-width: 900px) {
                    .debt-sections {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .drama-label-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .summary-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

// Debt Card Component
const DebtCard = ({ debt, onAdd, onSubtract, onResolve, onShowHistory, formatDate }) => {
    const dramaLabel = getDramaLabel(debt.dramaLabel);
    const isOverdue = debt.isOverdue;

    return (
        <motion.div
            className={`debt-card ${isOverdue ? 'overdue' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            style={{
                '--drama-color': dramaLabel.color,
                '--drama-bg': dramaLabel.bgColor
            }}
        >
            {isOverdue && (
                <div className="overdue-badge">
                    <FaExclamationTriangle /> OVERDUE!
                </div>
            )}

            <div className="card-header">
                <div className="person-info">
                    <span className="person-name">{debt.personName}</span>
                    <span 
                        className="drama-badge"
                        style={{ 
                            background: dramaLabel.bgColor, 
                            color: dramaLabel.color,
                            border: `1px solid ${dramaLabel.color}`
                        }}
                    >
                        {dramaLabel.emoji} {dramaLabel.label}
                    </span>
                </div>
                <div className="debt-amount">
                    ${debt.amount.toFixed(2)}
                </div>
            </div>

            {debt.description && (
                <p className="debt-description">{debt.description}</p>
            )}

            <div className="card-footer">
                <div className="debt-meta">
                    {debt.dueDate && (
                        <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                            <FaCalendarAlt /> {formatDate(debt.dueDate)}
                        </span>
                    )}
                    <button className="history-btn" onClick={onShowHistory}>
                        <FaHistory /> History
                    </button>
                </div>

                <div className="card-actions">
                    <motion.button
                        className="action-btn add"
                        onClick={onAdd}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Add to debt"
                    >
                        <FaPlus />
                    </motion.button>
                    <motion.button
                        className="action-btn subtract"
                        onClick={onSubtract}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Subtract from debt"
                    >
                        <FaMinus />
                    </motion.button>
                    <motion.button
                        className="action-btn resolve"
                        onClick={onResolve}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Resolve debt"
                    >
                        <FaCheck />
                    </motion.button>
                </div>
            </div>

            <style>{`
                .debt-card {
                    background: #1E293B;
                    border-radius: 12px;
                    padding: 1.25rem;
                    border: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                    overflow: visible;
                    transition: all 0.3s;
                    flex-shrink: 0;
                    min-height: 140px;
                }

                .debt-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: var(--drama-color);
                    border-radius: 12px 0 0 12px;
                }

                .debt-card.overdue {
                    border-color: rgba(239, 68, 68, 0.5);
                    animation: overdueGlow 2s ease-in-out infinite;
                }

                @keyframes overdueGlow {
                    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
                }

                .overdue-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #EF4444;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    border-radius: 0 12px 0 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    animation: blink 1s ease-in-out infinite;
                    z-index: 1;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .person-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .person-name {
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .drama-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.25rem 0.625rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    width: fit-content;
                }

                .debt-amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #10B981;
                    flex-shrink: 0;
                }

                .debt-description {
                    color: #9CA3AF;
                    font-size: 0.875rem;
                    margin: 0.5rem 0;
                    line-height: 1.4;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    flex-wrap: nowrap;
                }

                .debt-meta {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-shrink: 1;
                    min-width: 0;
                }

                .due-date {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: #64748B;
                    font-size: 0.8rem;
                    white-space: nowrap;
                }

                .due-date.overdue {
                    color: #EF4444;
                    font-weight: 600;
                }

                .history-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    background: none;
                    border: none;
                    color: #64748B;
                    cursor: pointer;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .history-btn:hover {
                    color: #10B981;
                    background: rgba(16, 185, 129, 0.1);
                }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }

                .action-btn {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .action-btn.add {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10B981;
                }

                .action-btn.add:hover {
                    background: #10B981;
                    color: white;
                }

                .action-btn.subtract {
                    background: rgba(245, 158, 11, 0.15);
                    color: #F59E0B;
                }

                .action-btn.subtract:hover {
                    background: #F59E0B;
                    color: white;
                }

                .action-btn.resolve {
                    background: rgba(59, 130, 246, 0.15);
                    color: #3B82F6;
                }

                .action-btn.resolve:hover {
                    background: #3B82F6;
                    color: white;
                }
            `}</style>
        </motion.div>
    );
};

export default DebtTracker;
