import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import {
  FaPlus, FaMinus, FaTimes, FaCheck, FaTrash, FaEdit, FaUsers,
  FaGift, FaReceipt, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining', icon: '🍕' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'bills', label: 'Bills & Utilities', icon: '💡' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '📦' }
];

const SPLIT_METHODS = [
  { value: 'equal', label: 'Equal Split' },
  { value: 'custom', label: 'Custom Amounts' }
];

const SplitBills = () => {
  const { currentUser } = useAuth();
  const [splits, setSplits] = useState([]);
  const [summary, setSummary] = useState({ totalOwed: 0, activeSplits: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSplit, setEditingSplit] = useState(null);
  const [expandedSplitId, setExpandedSplitId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [partialPayTarget, setPartialPayTarget] = useState(null); // { splitId, participantId }
  const [partialAmount, setPartialAmount] = useState('');
  const [partialError, setPartialError] = useState('');

  // Fancy AI popup state
  const [showFancyPopup, setShowFancyPopup] = useState(false);
  const [fancyMessage, setFancyMessage] = useState('');
  const [fancyIcon, setFancyIcon] = useState('🍕');

  const showFancyAIMessage = (message, icon = '🍕') => {
    if (!message) return;
    setFancyMessage(message);
    setFancyIcon(icon);
    setShowFancyPopup(true);
    setTimeout(() => setShowFancyPopup(false), 8000);
  };

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    totalAmount: '',
    category: 'food',
    splitMethod: 'equal',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [participantName, setParticipantName] = useState('');
  const [participants, setParticipants] = useState([]);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'food',
    date: '',
    note: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchSplits();
      fetchSummary();
    }
  }, [currentUser]);

  const fetchSplits = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLITS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSplits(data.data);
    } catch (error) {
      console.error('Error fetching splits:', error);
      toast.error('Failed to load splits');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_SUMMARY, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSummary(data.data);
    } catch (error) {
      console.error('Error fetching split summary:', error);
    }
  };

  // ─── Participant Management ───
  const addParticipant = () => {
    const name = participantName.trim();
    if (!name) return;
    if (participants.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('This person is already added');
      return;
    }
    setParticipants([...participants, { name, amount: 0 }]);
    setParticipantName('');
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipantAmount = (index, amount) => {
    const updated = [...participants];
    updated[index].amount = parseFloat(amount) || 0;
    setParticipants(updated);
  };

  // Recalculate equal splits: divide by (participants + 1) to include the user
  const getParticipantsWithAmounts = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    if (formData.splitMethod === 'equal' && participants.length > 0) {
      const headCount = participants.length + 1; // +1 = you, the payer
      const share = Math.round((total / headCount) * 100) / 100;
      // Last person gets the remainder after all other participants + user take their share
      return participants.map((p, i) => ({
        ...p,
        amount: i === participants.length - 1
          ? Math.round((total - share * participants.length) * 100) / 100
          : share
      }));
    }
    return participants;
  };

  // Compute user's own share and validation info for the preview
  const getUserShare = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    if (total === 0 || participants.length === 0) return { userShare: 0, participantTotal: 0, exceeds: false };
    const computed = getParticipantsWithAmounts();
    const participantTotal = computed.reduce((s, p) => s + p.amount, 0);
    const userShare = Math.round((total - participantTotal) * 100) / 100;
    return { userShare, participantTotal, exceeds: participantTotal > total + 0.01 };
  };

  // ─── Create Split ───
  const handleCreate = async (e) => {
    e.preventDefault();

    if (participants.length === 0) {
      toast.error('Add at least one participant');
      return;
    }

    const finalParticipants = getParticipantsWithAmounts();

    // For custom: validate no individual amount exceeds total and sum doesn't exceed total
    if (formData.splitMethod === 'custom') {
      const total = parseFloat(formData.totalAmount);
      const overParticipant = finalParticipants.find(p => p.amount > total);
      if (overParticipant) {
        toast.error(`${overParticipant.name}'s amount ($${overParticipant.amount.toFixed(2)}) exceeds the total ($${total.toFixed(2)})`);
        return;
      }
      const sum = finalParticipants.reduce((s, p) => s + p.amount, 0);
      if (sum > total + 0.01) {
        toast.error(`Participants' total ($${sum.toFixed(2)}) exceeds the bill ($${total.toFixed(2)})`);
        return;
      }
      if (sum < 0.01) {
        toast.error('Enter amounts for at least one participant');
        return;
      }
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLITS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          participants: finalParticipants
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show dramatic AI popup
        if (data.dramaticMessage) {
          showFancyAIMessage(data.dramaticMessage, '🍕');
        } else {
          toast.success('Split created!');
        }
        resetForm();
        fetchSplits();
        fetchSummary();
      } else {
        toast.error(data.message || 'Failed to create split');
      }
    } catch (error) {
      console.error('Error creating split:', error);
      toast.error('Failed to create split');
    }
  };

  // ─── Settle Participant ───
  const handleSettle = async (splitId, participantId, participantName) => {
    if (!confirm(`Mark ${participantName} as paid?`)) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_SETTLE(splitId, participantId), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        // Show dramatic AI popup
        if (data.dramaticMessage) {
          showFancyAIMessage(data.dramaticMessage, data.allSettled ? '🏆' : '✅');
        }

        if (data.allSettled) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        fetchSplits();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error settling participant:', error);
      toast.error('Failed to mark as paid');
    }
  };

  // ─── Partial Payment ───
  const openPartialPay = (splitId, participantId) => {
    setPartialPayTarget({ splitId, participantId });
    setPartialAmount('');
    setPartialError('');
  };

  const closePartialPay = () => {
    setPartialPayTarget(null);
    setPartialAmount('');
    setPartialError('');
  };

  // ─── Treat ───
  const handleTreat = async (splitId, participantId, participantName, amount) => {
    if (!confirm(`Treat ${participantName}? You'll cover their $${amount.toFixed(2)} share — no payback expected! 🎁`)) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_TREAT(splitId, participantId), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showFancyAIMessage(data.dramaticMessage || `You treated ${participantName}! 🎁`, '🎁');

        if (data.allSettled) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        fetchSplits();
        fetchSummary();
      } else {
        toast.error(data.message || 'Failed to process treat');
      }
    } catch (error) {
      console.error('Error treating participant:', error);
      toast.error('Failed to process treat');
    }
  };

  const handlePartialPay = async (splitId, participantId, owedAmount) => {
    const amount = parseFloat(partialAmount);
    if (!amount || amount <= 0) {
      setPartialError('Enter a valid amount');
      return;
    }
    if (amount > owedAmount + 0.01) {
      setPartialError(`Exceeds owed amount ($${owedAmount.toFixed(2)})`);
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_PARTIAL(splitId, participantId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (data.success) {
        showFancyAIMessage(data.dramaticMessage || 'Partial payment recorded!', '💸');

        if (data.allSettled) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        closePartialPay();
        fetchSplits();
        fetchSummary();
      } else {
        setPartialError(data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing partial payment:', error);
      setPartialError('Failed to process payment');
    }
  };

  // ─── Delete Split ───
  const handleDelete = async (id) => {
    if (!confirm('Delete this split? Un-recovered money will be refunded to your wallet.')) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_BY_ID(id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Split deleted');
        fetchSplits();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error deleting split:', error);
      toast.error('Failed to delete split');
    }
  };

  // ─── Edit Split ───
  const openEditModal = (split) => {
    setEditingSplit(split);
    setEditFormData({
      title: split.title,
      category: split.category,
      date: new Date(split.date).toISOString().split('T')[0],
      note: split.note || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingSplit) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(API_ENDPOINTS.SPLIT_BY_ID(editingSplit._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Split updated!');
        setShowEditModal(false);
        setEditingSplit(null);
        fetchSplits();
      } else {
        toast.error(data.message || 'Failed to update split');
      }
    } catch (error) {
      console.error('Error updating split:', error);
      toast.error('Failed to update split');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      totalAmount: '',
      category: 'food',
      splitMethod: 'equal',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setParticipants([]);
    setParticipantName('');
    setShowCreateModal(false);
  };

  const getProgressInfo = (split) => {
    if (!split.participants || split.participants.length === 0) return { paid: 0, treated: 0, total: 0, percent: 0 };
    const paidCount = split.participants.filter(p => p.isPaid && !p.isTreated).length;
    const treatedCount = split.participants.filter(p => p.isTreated).length;
    const total = split.participants.length;
    const percent = Math.round(((paidCount + treatedCount) / total) * 100);
    return { paid: paidCount, treated: treatedCount, total, percent };
  };

  const getDaysAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  if (loading) {
    return (
      <div className="split-loading">
        <GiReceiveMoney className="loading-icon" />
        <p>Loading split bills...</p>
      </div>
    );
  }

  return (
    <div className="split-tracker">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <div className="split-header">
        <div className="header-title">
          <FaReceipt className="header-icon" />
          <div>
            <h1>Split Bills</h1>
            <p className="header-subtitle">Split expenses with friends — track who owes what! 🍕💸</p>
          </div>
        </div>
        <motion.button
          className="add-btn"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus /> Create Split
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <motion.div
          className="summary-card owed"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="summary-icon"><GiReceiveMoney /></div>
          <div className="summary-content">
            <span className="summary-label">Total Owed to You</span>
            <span className="summary-amount">${summary.totalOwed?.toFixed(2) || '0.00'}</span>
          </div>
        </motion.div>

        <motion.div
          className="summary-card active"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <span className="summary-label">Active Splits</span>
            <span className="summary-amount">{summary.activeSplits || 0}</span>
          </div>
        </motion.div>
      </div>

      {/* Splits List */}
      {splits.length === 0 ? (
        <div className="empty-state">
          <FaReceipt size={64} className="empty-icon" />
          <h3>No Split Bills Yet</h3>
          <p>Split a dinner bill, rent, or group expense with friends!</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary-standalone">
            Create Your First Split
          </button>
        </div>
      ) : (
        <div className="splits-list">
          {splits.map((split) => {
            const progressInfo = getProgressInfo(split);
            const isExpanded = expandedSplitId === split._id;
            const categoryObj = CATEGORIES.find(c => c.value === split.category);
            const unpaidCount = split.participants.filter(p => !p.isPaid).length;
            const owedAmount = split.participants.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0);
            const paidPercent = split.participants.length > 0 ? Math.round((progressInfo.paid / progressInfo.total) * 100) : 0;
            const treatedPercent = split.participants.length > 0 ? Math.round((progressInfo.treated / progressInfo.total) * 100) : 0;

            return (
              <motion.div
                key={split._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`split-card ${split.isSettled ? 'settled' : ''}`}
              >
                {/* Card Header */}
                <div
                  className="split-card-header"
                  onClick={() => setExpandedSplitId(isExpanded ? null : split._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="split-info">
                    <span className="split-icon">{categoryObj?.icon || '📦'}</span>
                    <div>
                      <h3 className="split-title">{split.title}</h3>
                      <p className="split-meta">
                        {getDaysAgo(split.date)} • {split.participants.length} people
                        {split.note && ` • ${split.note}`}
                      </p>
                    </div>
                  </div>
                  <div className="split-right">
                    <div className="split-amount">${split.totalAmount.toFixed(2)}</div>
                    <div className={`split-status ${split.isSettled ? 'settled' : unpaidCount > 0 ? 'pending' : 'settled'}`}>
                      {split.isSettled ? '✅ Settled' : `⏳ ${unpaidCount} unpaid`}
                    </div>
                    {isExpanded ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
                  </div>
                </div>

                {/* Progress Bar — green for paid, purple for treated */}
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${paidPercent}%` }}
                  />
                  <div
                    className="progress-bar-fill treated"
                    style={{ width: `${treatedPercent}%` }}
                  />
                </div>
                <div className="progress-text">
                  {progressInfo.paid} paid{progressInfo.treated > 0 && `, ${progressInfo.treated} treated`} of {progressInfo.total}
                  {!split.isSettled && owedAmount > 0 && ` • $${owedAmount.toFixed(2)} remaining`}
                  {split.userShare > 0 && ` • Your share: $${split.userShare.toFixed(2)}`}
                </div>

                {/* Expanded: Participant Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="split-details"
                    >
                      <div className="participants-list">
                        {split.participants.map((p) => (
                          <div key={p._id} className={`participant-row ${p.isPaid ? 'paid' : 'unpaid'}`}>
                            <div className="participant-info">
                              <span className="participant-avatar">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <span className="participant-name">{p.name}</span>
                                <span className="participant-amount">${p.amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="participant-status">
                              {p.isPaid ? (
                                <span className={`badge-paid ${p.isTreated ? 'treated' : ''}`}>
                                  {p.isTreated ? <><FaGift /> Treat 🎁</> : <><FaCheck /> Paid</>}
                                  {p.paidAt && <span className="paid-date">{new Date(p.paidAt).toLocaleDateString()}</span>}
                                </span>
                              ) : partialPayTarget && partialPayTarget.splitId === split._id && partialPayTarget.participantId === p._id ? (
                                <div className="partial-pay-inline">
                                  <input
                                    type="number"
                                    className={`partial-pay-input ${partialError ? 'input-error' : ''}`}
                                    value={partialAmount}
                                    onChange={(e) => {
                                      setPartialAmount(e.target.value);
                                      const val = parseFloat(e.target.value);
                                      if (val > p.amount + 0.01) {
                                        setPartialError(`Exceeds $${p.amount.toFixed(2)}`);
                                      } else {
                                        setPartialError('');
                                      }
                                    }}
                                    placeholder={`Max $${p.amount.toFixed(2)}`}
                                    min="0.01"
                                    step="0.01"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handlePartialPay(split._id, p._id, p.amount);
                                      }
                                      if (e.key === 'Escape') closePartialPay();
                                    }}
                                  />
                                  {partialError && <span className="partial-error-text">{partialError}</span>}
                                  <div className="partial-pay-actions">
                                    <button
                                      type="button"
                                      className="btn-partial-confirm"
                                      onClick={() => handlePartialPay(split._id, p._id, p.amount)}
                                    >
                                      <FaCheck />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-partial-cancel"
                                      onClick={closePartialPay}
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="settle-buttons">
                                  <motion.button
                                    className="btn-partial"
                                    onClick={() => openPartialPay(split._id, p._id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Record partial payment"
                                  >
                                    <FaMinus /> Partial
                                  </motion.button>
                                  <motion.button
                                    className="btn-settle"
                                    onClick={() => handleSettle(split._id, p._id, p.name)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <FaCheck /> Full Pay
                                  </motion.button>
                                  <motion.button
                                    className="btn-treat"
                                    onClick={() => handleTreat(split._id, p._id, p.name, p.amount)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Treat — cover their share"
                                  >
                                    <FaGift /> Treat
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="split-card-actions">
                        {!split.isSettled && (
                          <button onClick={() => openEditModal(split)} className="btn-action edit">
                            <FaEdit /> Edit
                          </button>
                        )}
                        <button onClick={() => handleDelete(split._id)} className="btn-action delete">
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Create Split Modal ─── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => resetForm()}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3><FaReceipt /> Create a Split</h3>

              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Friday Night Dinner, Rent March"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Total Amount ($)</label>
                    <input
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Split Method</label>
                    <select
                      value={formData.splitMethod}
                      onChange={(e) => setFormData({ ...formData, splitMethod: e.target.value })}
                    >
                      {SPLIT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Note (Optional)</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Any details about this expense..."
                  />
                </div>

                {/* Participant Adder */}
                <div className="form-group">
                  <label><FaUsers style={{ marginRight: '0.5rem' }} /> Participants (who owes you)</label>
                  <div className="participant-adder">
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addParticipant();
                        }
                      }}
                      placeholder="Type a name and press Enter"
                    />
                    <button type="button" className="btn-add-person" onClick={addParticipant}>
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {/* Participant Chips / Custom Amounts */}
                {participants.length > 0 && (
                  <div className="participants-preview">
                    {(() => {
                      const computed = getParticipantsWithAmounts();
                      const total = parseFloat(formData.totalAmount) || 0;
                      return computed.map((p, i) => {
                        const isOverTotal = formData.splitMethod === 'custom' && p.amount > total && total > 0;
                        return (
                          <div key={i} className={`participant-chip ${isOverTotal ? 'chip-error' : ''}`}>
                            <span className="chip-avatar">{p.name.charAt(0).toUpperCase()}</span>
                            <span className="chip-name">{p.name}</span>
                            {formData.splitMethod === 'custom' ? (
                              <input
                                type="number"
                                className={`chip-amount-input ${isOverTotal ? 'input-error' : ''}`}
                                value={participants[i].amount || ''}
                                onChange={(e) => updateParticipantAmount(i, e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              <span className="chip-amount">${p.amount.toFixed(2)}</span>
                            )}
                            <button type="button" className="chip-remove" onClick={() => removeParticipant(i)}>
                              <FaTimes />
                            </button>
                            {isOverTotal && (
                              <span className="chip-warning">Exceeds total!</span>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Your share + totals summary */}
                    {(() => {
                      const { userShare, participantTotal, exceeds } = getUserShare();
                      const total = parseFloat(formData.totalAmount) || 0;
                      if (total === 0) return null;
                      return (
                        <div className="split-summary-box">
                          <div className="summary-row">
                            <span>👥 {participants.length} {participants.length === 1 ? 'person' : 'people'} owe you</span>
                            <span className={exceeds ? 'text-red' : 'text-green'}>${participantTotal.toFixed(2)}</span>
                          </div>
                          <div className="summary-row">
                            <span>🧑 Your share</span>
                            <span className={userShare < 0 ? 'text-red' : 'text-white'}>${userShare.toFixed(2)}</span>
                          </div>
                          <div className="summary-row total-row">
                            <span>💰 Total bill</span>
                            <span className="text-white">${total.toFixed(2)}</span>
                          </div>
                          {exceeds && (
                            <div className="split-warning-banner">
                              ⚠️ Participants' shares exceed the total bill!
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="modal-actions">
                  <motion.button
                    type="submit"
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaCheck /> Split It!
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

      {/* ─── Edit Split Modal ─── */}
      <AnimatePresence>
        {showEditModal && editingSplit && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3><FaEdit /> Edit Split</h3>

              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Note</label>
                  <input
                    type="text"
                    value={editFormData.note}
                    onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                    placeholder="Any details..."
                  />
                </div>

                <div className="modal-actions">
                  <motion.button
                    type="submit"
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaCheck /> Save Changes
                  </motion.button>
                  <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fancy AI Message Popup ─── */}
      <AnimatePresence>
        {showFancyPopup && (
          <motion.div
            className="fancy-popup"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="fancy-popup-accent" />
            <div className="fancy-popup-body">
              <div className="fancy-popup-icon">
                <span>{fancyIcon}</span>
              </div>
              <div className="fancy-popup-text">
                <h4>AI Insight</h4>
                <p>"{fancyMessage}"</p>
              </div>
              <button className="fancy-popup-close" onClick={() => setShowFancyPopup(false)}>
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .split-tracker {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: #0B0F1A;
        }

        .split-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: #9CA3AF;
        }

        .split-loading .loading-icon {
          font-size: 4rem;
          color: #10B981;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        /* Header */
        .split-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2.5rem;
          color: #10B981;
        }

        .split-header h1 {
          font-size: 2rem;
          color: white;
          margin: 0;
        }

        .header-subtitle {
          color: #9CA3AF;
          margin: 0.25rem 0 0;
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

        .summary-card.owed { border-left: 4px solid #10B981; }
        .summary-card.active { border-left: 4px solid #3B82F6; }

        .summary-icon {
          font-size: 2.5rem;
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
        }

        .owed .summary-icon { color: #10B981; }
        .active .summary-icon { color: #3B82F6; }

        .summary-content { display: flex; flex-direction: column; }
        .summary-label { color: #9CA3AF; font-size: 0.875rem; font-weight: 500; }
        .summary-amount { color: white; font-size: 1.75rem; font-weight: 700; }

        /* Splits List */
        .splits-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .split-card {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }

        .split-card.settled { opacity: 0.65; }
        .split-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.3); }

        .split-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .split-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .split-icon { font-size: 2rem; }

        .split-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .split-meta {
          color: #9CA3AF;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .split-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .split-amount {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
        }

        .split-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }

        .split-status.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #F59E0B;
        }

        .split-status.settled {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
        }

        .chevron { color: #64748B; font-size: 0.9rem; }

        /* Progress Bar */
        .progress-bar-container {
          display: flex;
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          margin-top: 1rem;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #34D399);
          transition: width 0.5s ease;
        }

        .progress-bar-fill.treated {
          background: linear-gradient(90deg, #8B5CF6, #A78BFA);
        }

        .progress-text {
          color: #64748B;
          font-size: 0.75rem;
          margin-top: 0.35rem;
        }

        /* Expanded Details */
        .split-details {
          overflow: hidden;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .participant-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
          border-left: 3px solid #64748B;
        }

        .participant-row.paid { border-left-color: #10B981; }
        .participant-row.unpaid { border-left-color: #F59E0B; }

        .participant-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .participant-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .participant-name {
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          display: block;
        }

        .participant-amount {
          color: #9CA3AF;
          font-size: 0.8rem;
        }

        .participant-status { display: flex; align-items: center; }

        .badge-paid {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #10B981;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .paid-date {
          color: #64748B;
          font-size: 0.7rem;
          margin-left: 0.25rem;
        }

        .settle-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-settle {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .btn-partial {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .btn-treat {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, #A855F7, #7C3AED);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .badge-paid.treated {
          color: #A855F7;
        }

        /* Partial Payment Inline Input */
        .partial-pay-inline {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          align-items: flex-end;
        }

        .partial-pay-input {
          width: 140px;
          padding: 0.45rem 0.6rem;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          color: #F59E0B;
          font-weight: 700;
          font-size: 0.85rem;
          text-align: right;
        }

        .partial-pay-input:focus {
          outline: none;
          border-color: #F59E0B;
        }

        .partial-pay-input.input-error {
          border-color: #EF4444;
          color: #EF4444;
        }

        .partial-pay-input::placeholder {
          color: #64748B;
          font-weight: 400;
        }

        .partial-error-text {
          color: #EF4444;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .partial-pay-actions {
          display: flex;
          gap: 0.35rem;
        }

        .btn-partial-confirm {
          padding: 0.35rem 0.6rem;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
        }

        .btn-partial-confirm:hover { background: #059669; }

        .btn-partial-cancel {
          padding: 0.35rem 0.6rem;
          background: rgba(255,255,255,0.1);
          color: #9CA3AF;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
        }

        .btn-partial-cancel:hover { background: rgba(255,255,255,0.2); color: white; }

        .split-card-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          justify-content: flex-end;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          color: white;
        }

        .btn-action.edit { background: #3B82F6; }
        .btn-action.edit:hover { background: #2563EB; }
        .btn-action.delete { background: #EF4444; }
        .btn-action.delete:hover { background: #DC2626; }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 2rem;
          color: #64748B;
        }

        .empty-state svg { margin-bottom: 1rem; opacity: 0.5; }
        .empty-state h3 { color: #9CA3AF; margin-bottom: 0.5rem; }

        .btn-primary-standalone {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        /* ─── Modals (dark theme matching Debt module) ─── */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
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
          max-width: 550px;
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

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          color: #9CA3AF;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
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

        .form-group input::placeholder { color: #64748B; }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #10B981;
        }

        .form-group select option {
          background: #0F172A;
          color: #ffffff;
        }

        .form-group input::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        /* Participant Adder */
        .participant-adder {
          display: flex;
          gap: 0.5rem;
        }

        .participant-adder input { flex: 1; }

        .btn-add-person {
          padding: 0.75rem 1rem;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .btn-add-person:hover { background: #059669; }

        /* Participant Chips */
        .participants-preview {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .participant-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .chip-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .chip-name {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          flex: 1;
        }

        .chip-amount {
          color: #10B981;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .chip-amount-input {
          width: 80px !important;
          padding: 0.4rem 0.5rem !important;
          background: #0F172A !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 6px !important;
          color: #10B981 !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          text-align: right;
        }

        .chip-remove {
          background: transparent;
          border: none;
          color: #EF4444;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          font-size: 0.8rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .chip-remove:hover { opacity: 1; }

        /* Validation error states */
        .participant-chip.chip-error {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .chip-amount-input.input-error {
          border-color: #EF4444 !important;
          color: #EF4444 !important;
        }

        .chip-warning {
          color: #EF4444;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Your Share / Summary Box */
        .split-summary-box {
          margin-top: 0.75rem;
          padding: 0.875rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.35rem 0;
          font-size: 0.85rem;
          color: #9CA3AF;
        }

        .summary-row.total-row {
          margin-top: 0.35rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-weight: 700;
          font-size: 0.9rem;
        }

        .text-green { color: #10B981; font-weight: 700; }
        .text-red { color: #EF4444; font-weight: 700; }
        .text-white { color: #ffffff; font-weight: 700; }

        .split-warning-banner {
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #EF4444;
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
        }

        /* Modal Actions */
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

        .btn-secondary:hover { background: rgba(255,255,255,0.1); color: white; }

        /* ─── Fancy AI Popup ─── */
        .fancy-popup {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1100;
          max-width: 400px;
          width: 100%;
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16, 185, 129, 0.1);
          overflow: hidden;
        }

        .fancy-popup-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, #06b6d4, #a855f7);
          border-radius: 16px 0 0 16px;
        }

        .fancy-popup-body {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          position: relative;
        }

        .fancy-popup-icon {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
          font-size: 1.25rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fancy-popup-text {
          flex: 1;
          min-width: 0;
        }

        .fancy-popup-text h4 {
          font-weight: 700;
          color: white;
          margin: 0 0 0.35rem;
          font-size: 0.9rem;
        }

        .fancy-popup-text p {
          color: #CBD5E1;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
          font-style: italic;
        }

        .fancy-popup-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.75rem;
          transition: color 0.2s;
        }

        .fancy-popup-close:hover { color: white; }

        @media (max-width: 768px) {
          .fancy-popup {
            right: 1rem;
            left: 1rem;
            bottom: 1rem;
            max-width: none;
          }
        }

        @media (max-width: 768px) {
          .split-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .split-right { flex-direction: column; align-items: flex-end; gap: 0.25rem; }
          .form-row { grid-template-columns: 1fr; }
          .split-card-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default SplitBills;
