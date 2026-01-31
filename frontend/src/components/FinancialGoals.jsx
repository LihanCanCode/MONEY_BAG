import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import CircularProgress from './CircularProgress';
import {
    FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaFlag,
    FaTrophy, FaCalendar, FaDollarSign, FaChartLine, FaMoneyBillWave
} from 'react-icons/fa';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

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

const PRIORITY_COLORS = {
    high: '#F44336',
    medium: '#FFC107',
    low: '#4CAF50'
};

const FinancialGoals = () => {
    const { currentUser } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [showContributeModal, setShowContributeModal] = useState(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        category: 'other',
        priority: 'medium'
    });

    useEffect(() => {
        if (currentUser) {
            fetchGoals();
        }
    }, [currentUser]);

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

    const handleContribute = async (goalId) => {
        if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
            alert('Please enter a valid amount');
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

    const triggerConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    };

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

    const getCategoryInfo = (category) => {
        return GOAL_CATEGORIES.find(c => c.value === category) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
    };

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
                <h2>🎯 Financial Goals</h2>
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
                                    <label>Target Amount ($)</label>
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
                                    <label>Current Amount ($)</label>
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
                                            <span className="value">${goal.currentAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-row">
                                            <span className="label">Target</span>
                                            <span className="value">${goal.targetAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="amount-row highlight">
                                            <span className="label">Remaining</span>
                                            <span className="value">${remaining.toFixed(2)}</span>
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
                                                    <strong>${requiredMonthlySavings.toFixed(2)}</strong>
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
                                                    <FaDollarSign /> Contribute
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

export default FinancialGoals;
