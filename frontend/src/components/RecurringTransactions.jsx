import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import toast from 'react-hot-toast';
import {
    FaPlus, FaCalendarAlt, FaToggleOn, FaToggleOff, FaTrash, FaEdit,
    FaMoneyBillWave, FaReceipt, FaClock
} from 'react-icons/fa';

const CATEGORIES = [
    { value: 'food', label: 'Food & Dining', icon: '🍔' },
    { value: 'transport', label: 'Transportation', icon: '🚗' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'bills', label: 'Bills & Utilities', icon: '💡' },
    { value: 'health', label: 'Health & Fitness', icon: '💊' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'salary', label: 'Salary', icon: '💰' },
    { value: 'other', label: 'Other', icon: '📦' }
];

const FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
];

const RecurringTransactions = () => {
    const { currentUser } = useAuth();
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editFormData, setEditFormData] = useState({
        type: 'SPEND',
        category: 'bills',
        amount: '',
        message: '',
        frequency: 'monthly',
        startDate: '',
        endDate: ''
    });
    const [formData, setFormData] = useState({
        type: 'SPEND',
        category: 'bills',
        amount: '',
        message: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    useEffect(() => {
        fetchRecurringTransactions();
    }, []);

    const fetchRecurringTransactions = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setRecurringTransactions(data.data);
            }
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
            toast.error('Failed to load recurring transactions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Recurring transaction created!');
                setShowAddModal(false);
                setFormData({
                    type: 'SPEND',
                    category: 'bills',
                    amount: '',
                    message: '',
                    frequency: 'monthly',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                });
                fetchRecurringTransactions();
            } else {
                toast.error(data.message || 'Failed to create recurring transaction');
            }
        } catch (error) {
            console.error('Error creating recurring transaction:', error);
            toast.error('Failed to create recurring transaction');
        }
    };

    const handleToggle = async (id) => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING_TOGGLE(id), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchRecurringTransactions();
            }
        } catch (error) {
            console.error('Error toggling recurring transaction:', error);
            toast.error('Failed to toggle recurring transaction');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this recurring transaction?')) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING_BY_ID(id), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Recurring transaction deleted');
                fetchRecurringTransactions();
            }
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            toast.error('Failed to delete recurring transaction');
        }
    };

    const handleProcessDue = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING_PROCESS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Processed ${data.data.length} recurring transactions`);
                fetchRecurringTransactions();
            }
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            toast.error('Failed to process recurring transactions');
        }
    };

    const handleEdit = (recurring) => {
        setEditingTransaction(recurring);
        setEditFormData({
            type: recurring.type,
            category: recurring.category || 'bills',
            amount: recurring.amount.toString(),
            message: recurring.message || '',
            frequency: recurring.frequency,
            startDate: new Date(recurring.startDate).toISOString().split('T')[0],
            endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingTransaction) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.RECURRING_BY_ID(editingTransaction._id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editFormData,
                    amount: parseFloat(editFormData.amount)
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Recurring transaction updated!');
                setShowEditModal(false);
                setEditingTransaction(null);
                fetchRecurringTransactions();
            } else {
                toast.error(data.message || 'Failed to update recurring transaction');
            }
        } catch (error) {
            console.error('Error updating recurring transaction:', error);
            toast.error('Failed to update recurring transaction');
        }
    };

    return (
        <div className="recurring-transactions-container">
            {/* Header */}
            <div className="recurring-header">
                <div>
                    <h2 className="recurring-title">
                        <FaReceipt className="inline-block mr-2" />
                        Recurring Transactions
                    </h2>
                    <p className="recurring-subtitle">
                        Automatic transactions for bills, subscriptions, and salary
                    </p>
                </div>
                <div className="recurring-actions">
                    <button onClick={handleProcessDue} className="btn-process">
                        <FaClock className="mr-2" />
                        Process Due
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn-add">
                        <FaPlus className="mr-2" />
                        Add Recurring
                    </button>
                </div>
            </div>

            {/* Recurring Transactions List */}
            {isLoading ? (
                <div className="loading-state">Loading...</div>
            ) : recurringTransactions.length === 0 ? (
                <div className="empty-state">
                    <FaCalendarAlt size={64} className="empty-icon" />
                    <h3>No Recurring Transactions</h3>
                    <p>Set up automatic transactions for bills, subscriptions, or salary</p>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        Create Your First Recurring Transaction
                    </button>
                </div>
            ) : (
                <div className="recurring-list">
                    {recurringTransactions.map((recurring) => (
                        <motion.div
                            key={recurring._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`recurring-card ${recurring.isActive ? 'active' : 'inactive'}`}
                        >
                            <div className="recurring-card-header">
                                <div className="recurring-info">
                                    <span className="recurring-icon">
                                        {CATEGORIES.find(c => c.value === recurring.category)?.icon || '📦'}
                                    </span>
                                    <div>
                                        <h3 className="recurring-message">
                                            {recurring.message || `${recurring.type === 'ADD' ? 'Income' : 'Expense'} - ${recurring.category}`}
                                        </h3>
                                        <p className="recurring-details">
                                            {recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)} •
                                            Next due: {new Date(recurring.nextDueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="recurring-amount" style={{ color: recurring.type === 'ADD' ? '#22c55e' : '#ef4444' }}>
                                    {recurring.type === 'ADD' ? '+' : '-'}${recurring.amount.toFixed(2)}
                                </div>
                            </div>

                            <div className="recurring-card-actions">
                                <button
                                    onClick={() => handleToggle(recurring._id)}
                                    className={`btn-toggle ${recurring.isActive ? 'active' : 'inactive'}`}
                                >
                                    {recurring.isActive ? (
                                        <>
                                            <FaToggleOn className="mr-1" /> Active
                                        </>
                                    ) : (
                                        <>
                                            <FaToggleOff className="mr-1" /> Paused
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleEdit(recurring)}
                                    className="btn-edit"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(recurring._id)}
                                    className="btn-delete"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Recurring Transaction Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="modal-title">Add Recurring Transaction</h2>

                            <form onSubmit={handleSubmit} className="recurring-form">
                                <div className="form-group">
                                    <label>Type</label>
                                    <div className="type-toggle">
                                        <button
                                            type="button"
                                            className={formData.type === 'SPEND' ? 'active' : ''}
                                            onClick={() => setFormData({ ...formData, type: 'SPEND', category: 'bills' })}
                                        >
                                            💸 Expense
                                        </button>
                                        <button
                                            type="button"
                                            className={formData.type === 'ADD' ? 'active' : ''}
                                            onClick={() => setFormData({ ...formData, type: 'ADD', category: 'salary' })}
                                        >
                                            💰 Income
                                        </button>
                                    </div>
                                </div>

                                {formData.type === 'SPEND' && (
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.icon} {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="e.g., Netflix Subscription, Monthly Rent"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        required
                                    >
                                        {FREQUENCIES.map(freq => (
                                            <option key={freq.value} value={freq.value}>
                                                {freq.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            min={formData.startDate}
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Create Recurring Transaction
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Recurring Transaction Modal */}
            <AnimatePresence>
                {showEditModal && editingTransaction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="modal-title">Edit Recurring Transaction</h2>

                            <form onSubmit={handleEditSubmit} className="recurring-form">
                                <div className="form-group">
                                    <label>Type</label>
                                    <div className="type-toggle">
                                        <button
                                            type="button"
                                            className={editFormData.type === 'SPEND' ? 'active' : ''}
                                            onClick={() => setEditFormData({ ...editFormData, type: 'SPEND', category: 'bills' })}
                                        >
                                            💸 Expense
                                        </button>
                                        <button
                                            type="button"
                                            className={editFormData.type === 'ADD' ? 'active' : ''}
                                            onClick={() => setEditFormData({ ...editFormData, type: 'ADD', category: 'salary' })}
                                        >
                                            💰 Income
                                        </button>
                                    </div>
                                </div>

                                {editFormData.type === 'SPEND' && (
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={editFormData.category}
                                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                            required
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.icon} {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editFormData.amount}
                                        onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={editFormData.message}
                                        onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                                        placeholder="e.g., Netflix Subscription, Monthly Rent"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Frequency</label>
                                    <select
                                        value={editFormData.frequency}
                                        onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                                        required
                                    >
                                        {FREQUENCIES.map(freq => (
                                            <option key={freq.value} value={freq.value}>
                                                {freq.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={editFormData.startDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={editFormData.endDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                            min={editFormData.startDate}
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Update Recurring Transaction
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

                        <style>{`
        .recurring-transactions-container {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: #0B0F1A;
        }

        .recurring-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .recurring-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .recurring-subtitle {
          color: #9CA3AF;
          margin-top: 0.25rem;
        }

        .recurring-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-process, .btn-add {
          display: flex;
          align-items: center;
          padding: 0.625rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          color: white;
        }

        .btn-process {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .btn-add {
          background: linear-gradient(135deg, #10B981, #059669);
        }

        .btn-process:hover, .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .recurring-list {
          display: grid;
          gap: 1rem;
        }

        .recurring-card {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }

        .recurring-card.inactive {
          opacity: 0.5;
          background: #111827;
        }

        .recurring-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }

        .recurring-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .recurring-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .recurring-icon {
          font-size: 2rem;
        }

        .recurring-message {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .recurring-details {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .recurring-amount {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .recurring-card-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn-toggle {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-toggle.active {
          background: #22c55e;
          color: white;
        }

        .btn-toggle.inactive {
          background: rgba(255,255,255,0.1);
          color: #9CA3AF;
        }

        .btn-delete {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          background: #ef4444;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .btn-edit {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          background: #3b82f6;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-edit:hover {
          background: #2563eb;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          color: #64748B;
        }

        .empty-state svg {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: #9CA3AF;
        }

        .empty-state p {
          color: #64748B;
        }

        .empty-state .btn-primary {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .empty-icon {
          color: #64748B;
          margin-bottom: 1rem;
        }

        /* ─── Modal (dark theme matching Debt module) ─── */
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
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1.5rem;
        }

        .recurring-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          font-size: 0.875rem;
          color: #9CA3AF;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-group input::placeholder {
          color: #64748B;
        }

        .form-group input::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #10B981;
        }

        .form-group select option {
          background: #0F172A;
          color: #ffffff;
        }

        .type-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .type-toggle button {
          padding: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .type-toggle button.active {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border-color: #10B981;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-cancel, .btn-submit {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel {
          background: rgba(255,255,255,0.05);
          color: #9CA3AF;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .btn-cancel:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .btn-submit {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }

        .loading-state {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #9CA3AF;
        }

        @media (max-width: 768px) {
          .recurring-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
            `}</style>
        </div>
    );
};

export default RecurringTransactions;
