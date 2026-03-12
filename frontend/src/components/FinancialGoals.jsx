/**
 * @fileoverview Financial Goals Component
 *
 * Provides full CRUD management for financial savings goals.
 * Users can create goals with a target amount, deadline, category, and
 * priority level, then contribute funds from their wallet over time.
 *
 * Key features:
 *  - Create, edit, and delete savings goals
 *  - Contribute wallet funds toward a goal
 *  - Circular progress indicator per goal
 *  - Priority-based color coding (High = Red, Medium = Yellow, Low = Green)
 *  - AI-powered predictions: required monthly savings, on-track status,
 *    and estimated completion date
 *  - Overdue detection for goals past their deadline
 *  - Confetti celebration when a goal reaches 100%
 *  - Empty-state placeholder encouraging goal creation
 *
 * @module components/FinancialGoals
 */

// ── Core React Hooks ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

// ── Animation Libraries ──────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';

// ── Auth & API ────────────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';

// ── Reusable Components ──────────────────────────────────────────────────────
import CircularProgress from './CircularProgress';

// ── Icon Library (Font Awesome) ──────────────────────────────────────────────
import {
    FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaFlag,
    FaTrophy, FaCalendar, FaDollarSign, FaChartLine, FaMoneyBillWave
} from 'react-icons/fa';

// ── Third-Party UI Utilities ─────────────────────────────────────────────────
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

/**
 * Available goal categories
 *
 * Each category has a value key, human-readable label, and emoji icon
 * used in the form dropdown and displayed on goal cards.
 */
const GOAL_CATEGORIES = [
    { value: 'vacation', label: 'Vacation', icon: '✈️' },
    { value: 'emergency', label: 'Emergency Fund', icon: '🆘' },
    { value: 'purchase', label: 'Major Purchase', icon: '🛒' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'investment', label: 'Investment', icon: '📈' },
    { value: 'home', label: 'Home/Property', icon: '🏠' },
    { value: 'car', label: 'Vehicle', icon: '🚗' },
    { value: 'other', label: 'Other', icon: '🎯' }
];

/**
 * Priority-to-color mapping
 *
 * Used for the goal card left border, circular progress ring,
 * and the animated progress bar fill.
 */
const PRIORITY_COLORS = {
    high: '#F44336',    // Red — urgent goals
    medium: '#FFC107',  // Yellow — normal priority
    low: '#4CAF50'      // Green — low priority / aspirational
};

/**
 * FinancialGoals Component
 *
 * Full lifecycle management for financial savings goals.
 * Supports create, edit, delete, contribute, and mark-complete flows.
 * Displays prediction data (monthly savings needed, on-track status,
 * predicted completion date) from the backend.
 *
 * @returns {JSX.Element} The rendered goals management page
 */
const FinancialGoals = () => {
    // ── Authentication ────────────────────────────────────────────────────
    const { currentUser } = useAuth();

    // ── Goals Data & UI State ─────────────────────────────────────────────
    const [goals, setGoals] = useState([]);                // Array of goal objects from API
    const [loading, setLoading] = useState(true);          // Initial fetch loading flag
    const [showCreateForm, setShowCreateForm] = useState(false);   // Toggle create/edit form
    const [editingGoal, setEditingGoal] = useState(null);          // Goal being edited (or null)
    const [showContributeModal, setShowContributeModal] = useState(null); // Goal ID for contribution modal
    const [contributeAmount, setContributeAmount] = useState('');  // Dollar amount to contribute
    const [walletBalance, setWalletBalance] = useState(null);      // User's current wallet balance
    const [showConfetti, setShowConfetti] = useState(false);       // Celebration animation toggle

    // ── Create / Edit Form State ──────────────────────────────────────────
    const [formData, setFormData] = useState({
        name: '',           // Goal display name
        targetAmount: '',   // Target savings amount ($)
        currentAmount: '',  // Amount already saved ($)
        deadline: '',       // Target completion date (YYYY-MM-DD)
        category: 'other',  // Goal category key (from GOAL_CATEGORIES)
        priority: 'medium'  // Priority level: 'high' | 'medium' | 'low'
    });

    /**
     * Effect: Fetch goals and wallet balance on component mount
     * Re-runs when the authenticated user changes.
     */
    useEffect(() => {
        if (currentUser) {
            fetchGoals();
            fetchWalletBalance();
        }
    }, [currentUser]);

    /**
     * Fetch the user's current wallet balance
     *
     * Used to validate that the user has sufficient funds
     * before making a goal contribution.
     */
    const fetchWalletBalance = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.WALLET, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWalletBalance(data.wallet?.currentBalance || 0);
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
        }
    };

    /**
     * Fetch all financial goals from the backend
     *
     * Retrieves both active and completed goals.
     * Each goal includes server-computed prediction data.
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
                setGoals(data);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new financial goal
     *
     * Posts the form data to the goals API endpoint.
     * On success, hides the form, resets fields, and refreshes the goals list.
     *
     * @param {Event} e - Form submit event
     */
    const handleCreateGoal = async (e) => {
        e.preventDefault();

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.GOALS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    targetAmount: parseFloat(formData.targetAmount),
                    currentAmount: parseFloat(formData.currentAmount || 0)
                })
            });

            if (response.ok) {
                setShowCreateForm(false);
                resetForm();
                fetchGoals();
            }
        } catch (error) {
            console.error('Error creating goal:', error);
        }
    };

    /**
     * Update an existing goal with new form values
     *
     * Sends a PUT request to the goal endpoint. If the update causes
     * the goal to become completed (currentAmount >= targetAmount),
     * triggers a confetti celebration.
     *
     * @param {Event} e - Form submit event
     */
    const handleUpdateGoal = async (e) => {
        e.preventDefault();

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.GOAL_BY_ID(editingGoal._id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    targetAmount: parseFloat(formData.targetAmount),
                    currentAmount: parseFloat(formData.currentAmount)
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Trigger celebration if the goal just got completed via edit
                if (data.goal.isCompleted && !editingGoal.isCompleted) {
                    triggerConfetti();
                }
                setEditingGoal(null);
                resetForm();
                fetchGoals();
            }
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    /**
     * Delete a financial goal permanently
     *
     * Prompts the user for confirmation before sending a DELETE request.
     * Refreshes the goals list on success.
     *
     * @param {string} goalId - MongoDB ObjectId of the goal to delete
     */
    const handleDeleteGoal = async (goalId) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        try {
            const token = await currentUser.getIdToken();
            await fetch(API_ENDPOINTS.GOAL_BY_ID(goalId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    /**
     * Contribute wallet funds toward a savings goal
     *
     * Validates the amount, fetches the latest wallet balance for a
     * client-side sufficiency check, then posts the contribution.
     * Triggers confetti if the contribution completes the goal.
     *
     * @param {string} goalId - MongoDB ObjectId of the target goal
     */
    const handleContribute = async (goalId) => {
        const amount = parseFloat(contributeAmount);
        if (!contributeAmount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        // Re-fetch the latest wallet balance for accurate client-side validation
        let currentBalance = walletBalance;
        try {
            const token = await currentUser.getIdToken();
            const walletRes = await fetch(API_ENDPOINTS.WALLET, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                currentBalance = walletData.wallet?.currentBalance ?? 0;
                setWalletBalance(currentBalance);
            }
        } catch (err) {
            // Continue — backend will still reject if balance is insufficient
        }

        // Client-side insufficient balance guard
        if (currentBalance !== null && amount > currentBalance) {
            toast.error(`Insufficient balance! Your wallet has ৳${currentBalance.toLocaleString()}. You cannot contribute more than your available balance.`, { duration: 5000 });
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(API_ENDPOINTS.GOAL_CONTRIBUTE(goalId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: parseFloat(contributeAmount) })
            });

            if (response.ok) {
                const data = await response.json();
                // Trigger celebration if the goal reached 100%
                if (data.goal.isCompleted) {
                    triggerConfetti();
                }
                setShowContributeModal(null);
                setContributeAmount('');
                fetchGoals();
                toast.success(data.message || 'Contribution added successfully');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to contribute to goal');
            }
        } catch (error) {
            console.error('Error contributing to goal:', error);
            toast.error('An error occurred while contributing to the goal');
        }
    };

    /**
     * Manually mark a goal as completed
     *
     * Called when the user clicks "Mark Complete" on a goal that has
     * reached or exceeded its target amount.
     *
     * @param {string} goalId - MongoDB ObjectId of the goal
     */
    const handleCompleteGoal = async (goalId) => {
        try {
            const token = await currentUser.getIdToken();
            await fetch(API_ENDPOINTS.GOAL_COMPLETE(goalId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            triggerConfetti();
            fetchGoals();
        } catch (error) {
            console.error('Error completing goal:', error);
        }
    };

    /** Show confetti animation for 5 seconds to celebrate a milestone */
    const triggerConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    };

    /**
     * Populate the form with an existing goal's data for editing
     *
     * @param {Object} goal - The goal object to edit
     */
    const startEditGoal = (goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            deadline: new Date(goal.deadline).toISOString().split('T')[0],
            category: goal.category,
            priority: goal.priority
        });
        setShowCreateForm(true);
    };

    /** Reset the form fields and close the create/edit form */
    const resetForm = () => {
        setFormData({
            name: '',
            targetAmount: '',
            currentAmount: '',
            deadline: '',
            category: 'other',
            priority: 'medium'
        });
        setShowCreateForm(false);
        setEditingGoal(null);
    };

    /**
     * Look up category display info (icon + label) by value key
     *
     * @param {string} category - Category value key
     * @returns {Object} Category object with value, label, and icon
     */
    const getCategoryInfo = (category) => {
        return GOAL_CATEGORIES.find(c => c.value === category) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
    };

    /**
     * Format an ISO date string into a human-readable short date
     *
     * @param {string} dateString - ISO date string (e.g. "2026-06-15T00:00:00Z")
     * @returns {string} Formatted date (e.g. "Jun 15, 2026")
     */
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading goals...</p>
            </div>
        );
    }

    return (
        <div className="financial-goals">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <div className="goals-header">
                <h2 style={{ color: '#ffffff' }}>🎯 Financial Goals</h2>
                <motion.button
                    className="create-goal-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FaPlus /> {showCreateForm ? 'Cancel' : 'Create Goal'}
                </motion.button>
            </div>

            {/* Create/Edit Goal Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        className="goal-form-container"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <form onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal} className="goal-form">
                            <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Goal Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Vacation to Bali"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {GOAL_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Amount (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.targetAmount}
                                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                        placeholder="2000"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Current Amount (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.currentAmount}
                                        onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="high">🔴 High</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="low">🟢 Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    <FaCheck /> {editingGoal ? 'Update' : 'Create'} Goal
                                </button>
                                <button type="button" className="btn-secondary" onClick={resetForm}>
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goals List */}
            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="empty-state">
                        <FaTrophy size={64} />
                        <h3>No goals yet</h3>
                        <p>Create your first financial goal to start saving!</p>
                    </div>
                ) : (
                    goals.map((goal) => {
                        const categoryInfo = getCategoryInfo(goal.category);
                        const { progress, remaining, daysRemaining, isOnTrack, predictedCompletion, requiredMonthlySavings } = goal.prediction;
                        const isOverdue = daysRemaining < 0 && !goal.isCompleted;

                        return (
                            <motion.div
                                key={goal._id}
                                className={`goal-card ${goal.isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                style={{ borderLeft: `4px solid ${PRIORITY_COLORS[goal.priority]}` }}
                            >
                                {goal.isCompleted && (
                                    <div className="completed-badge">
                                        <FaTrophy /> Completed!
                                    </div>
                                )}

                                <div className="goal-card-header">
                                    <div className="goal-info">
                                        <span className="goal-icon">{categoryInfo.icon}</span>
                                        <div>
                                            <h3>{goal.name}</h3>
                                            <span className="goal-category">{categoryInfo.label}</span>
                                        </div>
                                    </div>
                                    {!goal.isCompleted && (
                                        <div className="goal-actions">
                                            <button onClick={() => startEditGoal(goal)} title="Edit">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDeleteGoal(goal._id)} title="Delete" className="delete-btn">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="goal-visual">
                                    <CircularProgress
                                        percentage={progress}
                                        size={120}
                                        color={PRIORITY_COLORS[goal.priority]}
                                    />
                                </div>

                                <div className="goal-details">
                                    <div className="goal-amounts">
                                        <div className="amount-row">
                                            <span className="label">Current</span>
                                            <span className="value">৳{goal.currentAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-row">
                                            <span className="label">Target</span>
                                            <span className="value">৳{goal.targetAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-row highlight">
                                            <span className="label">Remaining</span>
                                            <span className="value">৳{remaining.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="progress-bar-container">
                                        <motion.div
                                            className="progress-bar-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progress, 100)}%` }}
                                            transition={{ duration: 0.5 }}
                                            style={{ backgroundColor: PRIORITY_COLORS[goal.priority] }}
                                        />
                                    </div>

                                    <div className="goal-timeline">
                                        <div className="timeline-item">
                                            <FaCalendar />
                                            <span>Deadline: {formatDate(goal.deadline)}</span>
                                        </div>
                                        <div className="timeline-item">
                                            <FaFlag />
                                            <span className={isOverdue ? 'overdue-text' : ''}>
                                                {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                                            </span>
                                        </div>
                                    </div>

                                    {!goal.isCompleted && (
                                        <>
                                            <div className="goal-predictions">
                                                <h4><FaChartLine /> Predictions</h4>
                                                <div className="prediction-item">
                                                    <span>Required Monthly Savings:</span>
                                                    <strong>৳{requiredMonthlySavings.toFixed(2)}</strong>
                                                </div>
                                                <div className="prediction-item">
                                                    <span>Status:</span>
                                                    <strong className={isOnTrack ? 'on-track' : 'off-track'}>
                                                        {isOnTrack ? '✅ On Track' : '⚠️ Behind Schedule'}
                                                    </strong>
                                                </div>
                                                {predictedCompletion && (
                                                    <div className="prediction-item">
                                                        <span>Predicted Completion:</span>
                                                        <strong>{formatDate(predictedCompletion)}</strong>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="goal-footer-actions">
                                                <motion.button
                                                    className="contribute-btn"
                                                    onClick={() => setShowContributeModal(goal._id)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <FaMoneyBillWave /> Contribute
                                                </motion.button>
                                                {progress >= 100 && (
                                                    <motion.button
                                                        className="complete-btn"
                                                        onClick={() => handleCompleteGoal(goal._id)}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <FaTrophy /> Mark Complete
                                                    </motion.button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Contribute Modal */}
            <AnimatePresence>
                {showContributeModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowContributeModal(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3><FaMoneyBillWave /> Contribute to Goal</h3>
                            <div className="modal-body">
                                <input
                                    type="number"
                                    value={contributeAmount}
                                    onChange={(e) => setContributeAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => handleContribute(showContributeModal)} className="btn-primary">
                                    <FaCheck /> Contribute
                                </button>
                                <button onClick={() => setShowContributeModal(null)} className="btn-secondary">
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* Export the FinancialGoals component as the default module export */
export default FinancialGoals;
