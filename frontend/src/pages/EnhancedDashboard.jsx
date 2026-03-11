import { useState } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './Dashboard';
import RecurringTransactions from '../components/RecurringTransactions';
import ExportReports from '../components/ExportReports';
import SpendingHeatmap from '../components/SpendingHeatmap';
import BudgetManagement from '../components/BudgetManagement';
import FinancialGoals from '../components/FinancialGoals';
import DebtTracker from '../components/DebtTracker';
import FinancialCalendar from '../components/FinancialCalendar';
import Transactions from './Transactions';
import { FiHome, FiRepeat, FiDownload, FiTrendingUp, FiDollarSign, FiTarget, FiActivity, FiUsers, FiCalendar } from 'react-icons/fi';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'budgets', label: 'Budgets', icon: FiDollarSign },
  { id: 'goals', label: 'Goals', icon: FiTarget },
  { id: 'debts', label: 'Debts', icon: FiUsers },
  { id: 'recurring', label: 'Recurring', icon: FiRepeat },
  { id: 'calendar', label: 'Calendar', icon: FiCalendar },
  { id: 'analytics', label: 'Analytics', icon: FiTrendingUp },
  { id: 'export', label: 'Export', icon: FiDownload },
  { id: 'transactions', label: 'Transactions', icon: FiActivity }
];

const EnhancedDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="enhanced-dashboard">
      {/* Tab Navigation */}
      <div className="tabs-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="tab-icon" />
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="tab-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="tab-content"
      >
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'budgets' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <BudgetManagement />
          </div>
        )}
        {activeTab === 'goals' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <FinancialGoals />
          </div>
        )}
        {activeTab === 'debts' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <DebtTracker />
          </div>
        )}
        {activeTab === 'recurring' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <RecurringTransactions />
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <FinancialCalendar />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="min-h-screen bg-[#0B0F1A] pt-6">
            <SpendingHeatmap />
          </div>
        )}
        {activeTab === 'export' && (
          <div className="min-h-screen bg-[#020617] pt-6">
            <ExportReports />
          </div>
        )}
        {activeTab === 'transactions' && (
          <div className="min-h-screen bg-[#020617]">
            <Transactions />
          </div>
        )}
      </motion.div>

      <style>{`
        .enhanced-dashboard {
          min-height: 100vh;
          background: #020617;
        }

        .tabs-container {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 2rem;
          padding-bottom: 0.5rem;
          background: #0B1121;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow-x: auto;
          position: sticky;
          top: 0;
          z-index: 30;
          backdrop-blur-md;
        }

        .tab-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          padding-bottom: 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #9CA3AF;
          font-weight: 600;
          white-space: nowrap;
        }

        .tab-button:hover {
          background: #1A233A;
          color: #E5E7EB;
        }

        .tab-button.active {
          color: white;
          background: #1A233A;
        }

        .tab-icon {
          font-size: 1.25rem;
        }

        .tab-label {
          font-size: 0.95rem;
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #10B981, #34D399);
          border-radius: 2px 2px 0 0;
        }

        .tab-content {
          min-height: calc(100vh - 80px);
        }

        @media (max-width: 768px) {
          .tabs-container {
            padding: 1rem;
            gap: 0.25rem;
          }

          .tab-button {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }

          .tab-label {
            display: none;
          }

          .tab-icon {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedDashboard;
