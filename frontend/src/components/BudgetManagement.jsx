/**
 * @fileoverview Budget Management Component
 * 
 * Comprehensive budget tracking and management interface with:
 * - Create, read, update, delete (CRUD) operations for budgets
 * - Visual budget progress indicators with circular charts
 * - Budget status tracking (good/warning/exceeded)
 * - Category-based budget organization
 * - Budget vs actual spending analytics
 * - Alert threshold configuration
 * - Budget activation/deactivation toggle
 * - Animated UI elements for better UX
 */

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

/**
 * Budget Categories Configuration
 * 
 * Predefined categories for budget organization.
 * Each category includes:
 * - value: Internal identifier for API/database
 * - label: User-friendly display name
 * - icon: Emoji icon for visual identification
 */
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

/**
 * BudgetManagement Component
 * 
 * Main component for managing user budgets.
 * Provides complete budget lifecycle management with visual feedback.
 * 
 * Features:
 * - Create new budgets with customizable categories, amounts, and alert thresholds
 * - View all budgets with current spending and progress visualization
 * - Edit existing budgets (except category which is locked after creation)
 * - Delete budgets with confirmation
 * - Toggle budget active/inactive status
 * - Real-time budget status indicators (good/warning/exceeded)
 * - Analytics chart comparing budget vs actual spending
 * 
 * @returns {JSX.Element} Budget management interface
 */
const BudgetManagement = () => {
    const { currentUser } = useAuth();
    
    // Data state
    const [budgets, setBudgets] = useState([]);                   // All user budgets
    const [budgetAnalytics, setBudgetAnalytics] = useState([]);   // Budget vs actual data for charts
    const [loading, setLoading] = useState(true);                 // Initial data loading state
    
    // UI state
    const [showCreateForm, setShowCreateForm] = useState(false);  // Toggle create/edit form visibility
    const [editingBudget, setEditingBudget] = useState(null);     // Budget currently being edited (null if creating)

    /**
     * Form data state
     * Manages all form field values for create/edit operations
     */
    const [formData, setFormData] = useState({
        category: '',          // Budget category (food, transport, etc.)
        amount: '',            // Budget limit amount in dollars
        period: 'monthly',     // Budget period (monthly or yearly)
        alertThreshold: 80     // Percentage at which to trigger alerts (50-100)
    });

    /**
     * Effect: Load budgets and analytics on mount or user change
     * Fetches both budget list and analytics data when user is authenticated
     */
    useEffect(() => {
        if (currentUser) {
            fetchBudgets();
            fetchBudgetAnalytics();
        }
    }, [currentUser]);

    /**
     * Fetch all budgets for the current user
     * 
     * Retrieves the complete list of budgets from the backend API.
     * Each budget includes current spending, status, and configuration.
     * Updates the budgets state and clears loading flag.
     */
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

    /**
     * Fetch budget analytics data
     * 
     * Retrieves aggregated data comparing budget limits to actual spending.
     * Used to populate the budget vs actual spending chart.
     * This data helps users visualize their spending patterns.
     */
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

    /**
     * Create a new budget
     * 
     * Submits form data to create a new budget for the selected category.
     * On success:
     * - Closes the form
     * - Resets form data
     * - Refreshes budget list and analytics
     * 
     * @param {Event} e - Form submit event
     */
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

    /**
     * Update an existing budget
     * 
     * Saves changes to a budget being edited.
     * Note: Category cannot be changed once budget is created.
     * On success:
     * - Clears editing state
     * - Resets form data
     * - Refreshes budget list and analytics
     * 
     * @param {Event} e - Form submit event
     */
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

    /**
     * Delete a budget
     * 
     * Removes a budget permanently after user confirmation.
     * Refreshes both budget list and analytics after successful deletion.
     * 
     * @param {string} budgetId - ID of the budget to delete
     */
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

    /**
     * Toggle budget active/inactive status
     * 
     * Enables or disables budget tracking without deleting the budget.
     * Useful for temporarily pausing budget monitoring.
     * 
     * @param {string} budgetId - ID of the budget to toggle
     */
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
                <h2 style={{ color: '#ffffff' }}>💰 Budget Management</h2>
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
