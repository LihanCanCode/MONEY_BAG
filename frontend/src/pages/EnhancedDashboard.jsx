import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiHome,
  FiRepeat,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import BudgetManagement from '../components/BudgetManagement';
import DebtTracker from '../components/DebtTracker';
import ExportReports from '../components/ExportReports';
import FinancialCalendar from '../components/FinancialCalendar';
import FinancialGoals from '../components/FinancialGoals';
import RecurringTransactions from '../components/RecurringTransactions';
import SpendingHeatmap from '../components/SpendingHeatmap';
import SplitBills from '../components/SplitBills';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'budgets', label: 'Budgets', icon: FiDollarSign },
  { id: 'goals', label: 'Goals', icon: FiTarget },
  { id: 'debts', label: 'Debts', icon: FiBriefcase },
  { id: 'splits', label: 'Split Bills', icon: FiUsers },
  { id: 'recurring', label: 'Recurring', icon: FiRepeat },
  { id: 'calendar', label: 'Calendar', icon: FiCalendar },
  { id: 'analytics', label: 'Analytics', icon: FiTrendingUp },
  { id: 'export', label: 'Export', icon: FiDownload },
  { id: 'transactions', label: 'Transactions', icon: FiActivity },
];

const tabContent = {
  dashboard: <Dashboard />,
  budgets: <BudgetManagement />,
  goals: <FinancialGoals />,
  debts: <DebtTracker />,
  splits: <SplitBills />,
  recurring: <RecurringTransactions />,
  calendar: <FinancialCalendar />,
  analytics: <SpendingHeatmap />,
  export: <ExportReports />,
  transactions: <Transactions />,
};

const EnhancedDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="enhanced-dashboard luxe-dashboard">
      <div className="luxe-dashboard-head">
        <div>
          <span>Portfolio command</span>
          <h1>MoneyBag Desk</h1>
        </div>
        <p>Track liquidity, commitments, goals, and daily decisions from one composed workspace.</p>
      </div>

      <div className="tabs-container luxe-tabs" aria-label="Dashboard sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="tab-content luxe-tab-content"
      >
        {tabContent[activeTab]}
      </motion.div>

      <style>{`
        .luxe-dashboard {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(circle at 12% 4%, rgba(214,180,109,0.12), transparent 28%),
            radial-gradient(circle at 88% 0%, rgba(70,109,98,0.14), transparent 32%),
            #0b0d0c;
          color: #f7ecd5;
        }

        .luxe-dashboard-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 24px;
          padding: 34px clamp(18px, 4vw, 48px) 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .luxe-dashboard-head span {
          color: #d6b46d;
          text-transform: uppercase;
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        .luxe-dashboard-head h1 {
          margin: 8px 0 0;
          color: #fff6df;
          font-size: clamp(2.2rem, 5vw, 4.5rem);
          letter-spacing: 0;
          line-height: 1;
        }

        .luxe-dashboard-head p {
          max-width: 520px;
          color: #a79f91;
          line-height: 1.65;
          margin: 0;
        }

        .luxe-tabs {
          display: flex;
          gap: 8px;
          padding: 14px clamp(14px, 4vw, 48px);
          background: rgba(8, 9, 8, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          overflow-x: auto;
          position: sticky;
          top: 0;
          z-index: 30;
          backdrop-filter: blur(18px);
        }

        .tab-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px 13px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #a79f91;
          background: rgba(255,255,255,0.035);
          font-weight: 800;
          white-space: nowrap;
        }

        .tab-button:hover,
        .tab-button.active {
          color: #fff6df;
          border-color: rgba(214,180,109,0.34);
          background: rgba(214,180,109,0.1);
        }

        .tab-icon {
          font-size: 1.05rem;
        }

        .tab-label {
          font-size: 0.9rem;
        }

        .tab-indicator {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 5px;
          height: 2px;
          background: #d6b46d;
          border-radius: 999px;
        }

        .luxe-tab-content {
          min-height: calc(100vh - 190px);
        }

        .luxe-tab-content > div {
          background-color: transparent !important;
        }

        @media (max-width: 760px) {
          .luxe-dashboard-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .tab-label {
            display: none;
          }

          .tab-icon {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedDashboard;
