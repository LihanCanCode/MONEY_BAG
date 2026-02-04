import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import CircularProgress from './CircularProgress';
import BudgetChart from './BudgetChart';
import {
    FaPlus, FaEdit, FaTrash, FaPowerOff, FaCheck, FaTimes,
    FaChartBar, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';

const CATEGORIES = [
    { value: 'food', label: 'Food & Dining', icon: '🍔' },
    { value: 'transport', label: 'Transportation', icon: '🚗' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { value: 'bills', label: 'Bills & Utilities', icon: '📱' },
    { value: 'health', label: 'Health & Fitness', icon: '💪' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📦' }
];

const BudgetManagement = () => {
    const { currentUser } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [budgetAnalytics, setBudgetAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        period: 'monthly',
        alertThreshold: 80
    });

    useEffect(() => {
        if (currentUser) {
            fetchBudgets();
            fetchBudgetAnalytics();
        }
    }, [currentUser]);

    const fetchBudgets = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGETS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBudgets(data);
            }
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBudgetAnalytics = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGET_ANALYTICS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBudgetAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching budget analytics:', error);
        }
    };

    const handleCreateBudget = async (e) => {
        e.preventDefault();

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGETS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowCreateForm(false);
                setFormData({ category: '', amount: '', period: 'monthly', alertThreshold: 80 });
                fetchBudgets();
                fetchBudgetAnalytics();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create budget');
            }
        } catch (error) {
            console.error('Error creating budget:', error);
            alert('Failed to create budget');
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGET_BY_ID(editingBudget._id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setEditingBudget(null);
                setFormData({ category: '', amount: '', period: 'monthly', alertThreshold: 80 });
                fetchBudgets();
                fetchBudgetAnalytics();
            }
        } catch (error) {
            console.error('Error updating budget:', error);
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGET_BY_ID(budgetId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchBudgets();
                fetchBudgetAnalytics();
            }
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    const handleToggleBudget = async (budgetId) => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.BUDGET_TOGGLE(budgetId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchBudgets();
            }
        } catch (error) {
            console.error('Error toggling budget:', error);
        }
    };

    const startEditBudget = (budget) => {
        setEditingBudget(budget);
        setFormData({
            category: budget.category,
            amount: budget.amount,
            period: budget.period,
            alertThreshold: budget.alertThreshold
        });
        setShowCreateForm(true);
    };

    const cancelEdit = () => {
        setEditingBudget(null);
        setShowCreateForm(false);
        setFormData({ category: '', amount: '', period: 'monthly', alertThreshold: 80 });
    };

    const getDaysRemainingInMonth = () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return Math.ceil((lastDay - now) / (1000 * 60 * 60 * 24));
    };

    const getCategoryInfo = (category) => {
        return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading budgets...</p>
            </div>
        );
    }

    return (
        <div className="budget-management">
            <div className="budget-header">
                <h2>💰 Budget Management</h2>
                <motion.button
                    className="create-budget-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FaPlus /> {showCreateForm ? 'Cancel' : 'Create Budget'}
                </motion.button>
            </div>

            {/* Create/Edit Budget Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        className="budget-form-container"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget} className="budget-form">
                            <h3>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h3>

                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                    disabled={editingBudget !== null}
                                >
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Budget Amount ($)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="500"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Period</label>
                                <select
                                    value={formData.period}
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Alert Threshold ({formData.alertThreshold}%)</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={formData.alertThreshold}
                                    onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                                />
                                <small>Get alerts when you reach {formData.alertThreshold}% of your budget</small>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    <FaCheck /> {editingBudget ? 'Update' : 'Create'} Budget
                                </button>
                                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Budget List */}
            <div className="budgets-grid">
                {budgets.length === 0 ? (
                    <div className="empty-state">
                        <FaChartBar size={64} />
                        <h3>No budgets yet</h3>
                        <p>Create your first budget to start tracking your spending!</p>
                    </div>
                ) : (
                    budgets.map((budget) => {
                        const categoryInfo = getCategoryInfo(budget.category);
                        const { percentage, status } = budget.status;
                        const daysRemaining = getDaysRemainingInMonth();

                        return (
                            <motion.div
                                key={budget._id}
                                className={`budget-card ${status} ${!budget.isActive ? 'inactive' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="budget-card-header">
                                    <div className="category-info">
                                        <span className="category-icon">{categoryInfo.icon}</span>
                                        <h3>{categoryInfo.label}</h3>
                                    </div>
                                    <div className="budget-actions">
                                        <button onClick={() => startEditBudget(budget)} title="Edit">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleToggleBudget(budget._id)} title={budget.isActive ? 'Deactivate' : 'Activate'}>
                                            <FaPowerOff className={budget.isActive ? 'active' : ''} />
                                        </button>
                                        <button onClick={() => handleDeleteBudget(budget._id)} title="Delete" className="delete-btn">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="budget-visual">
                                    <CircularProgress
                                        percentage={percentage}
                                        size={140}
                                    />
                                </div>

                                <div className="budget-details">
                                    <div className="budget-amounts">
                                        <div className="amount-item">
                                            <span className="label">Spent</span>
                                            <span className="value">${budget.currentSpending.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-item">
                                            <span className="label">Budget</span>
                                            <span className="value">${budget.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-item">
                                            <span className="label">Remaining</span>
                                            <span className={`value ${budget.status.remaining < 0 ? 'negative' : 'positive'}`}>
                                                ${Math.abs(budget.status.remaining).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="progress-bar">
                                        <motion.div
                                            className={`progress-fill ${status}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>

                                    <div className="budget-footer">
                                        <span className="days-remaining">{daysRemaining} days remaining</span>
                                        {status === 'exceeded' && (
                                            <span className="status-badge exceeded">
                                                <FaExclamationTriangle /> Over Budget
                                            </span>
                                        )}
                                        {status === 'warning' && (
                                            <span className="status-badge warning">
                                                <FaExclamationTriangle /> Alert
                                            </span>
                                        )}
                                        {status === 'good' && (
                                            <span className="status-badge good">
                                                <FaCheckCircle /> On Track
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Budget vs Actual Chart */}
            {budgetAnalytics.length > 0 && (
                <motion.div
                    className="budget-analytics-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <h3>📊 Budget vs Actual Spending</h3>
                    <BudgetChart data={budgetAnalytics} />
                </motion.div>
            )}
        </div>
    );
};

export default BudgetManagement;
