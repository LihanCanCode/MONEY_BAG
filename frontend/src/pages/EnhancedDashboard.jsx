/**
 * @fileoverview Enhanced Dashboard Page Component
 *
 * Acts as the main tabbed navigation shell for the entire application dashboard.
 * Wraps all major feature modules under a single sticky tab bar, providing:
 *  - Dashboard          → Primary financial overview (balance, transactions, charts)
 *  - Budgets            → Budget creation, tracking, and analytics
 *  - Goals              → Savings goal management and progress tracking
 *  - Debts              → Debt tracking (money owed to/by the user)
 *  - Recurring          → Automated recurring transaction management
 *  - Calendar           → Unified financial calendar with event overlays
 *  - Analytics          → Spending heatmap and trend analysis
 *  - Export             → CSV / PDF report generation and download
 *  - Transactions       → Full transaction history with search & filters
 *
 * Uses Framer Motion for smooth tab-switch animations and an animated
 * underline indicator on the active tab.
 *
 * @module pages/EnhancedDashboard
 */

// ── Core React Hooks ──────────────────────────────────────────────────────────
import { useState } from 'react';

// ── Animation Libraries ──────────────────────────────────────────────────────
import { motion } from 'framer-motion';

// ── Feature Module Components ────────────────────────────────────────────────
import Dashboard from './Dashboard';
import RecurringTransactions from '../components/RecurringTransactions';
import ExportReports from '../components/ExportReports';
import SpendingHeatmap from '../components/SpendingHeatmap';
import BudgetManagement from '../components/BudgetManagement';
import FinancialGoals from '../components/FinancialGoals';
import DebtTracker from '../components/DebtTracker';
import FinancialCalendar from '../components/FinancialCalendar';
import SplitBills from '../components/SplitBills';
import Transactions from './Transactions';

// ── Icon Library (Feather Icons) ─────────────────────────────────────────────
import { FiHome, FiRepeat, FiDownload, FiTrendingUp, FiDollarSign, FiTarget, FiActivity, FiUsers, FiCalendar } from 'react-icons/fi';

/**
 * Tab configuration array
 *
 * Each entry defines a navigation tab with:
 *  - id    : Unique key used for state matching and conditional rendering
 *  - label : Human-readable text shown on the tab button
 *  - icon  : Feather icon component rendered beside the label
 *
 * The order of entries determines the display order in the tab bar.
 */
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

/**
 * EnhancedDashboard Component
 *
 * Top-level tabbed container that lazy-renders the selected feature module.
 * The tab bar sticks to the top of the viewport and is horizontally scrollable
 * on mobile. Each tab switch triggers a Framer Motion fade + slide animation.
 *
 * @returns {JSX.Element} The tabbed dashboard shell with the active feature module
 */
const EnhancedDashboard = () => {
  // Currently active tab ID — defaults to 'dashboard' on first load
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="enhanced-dashboard">

      {/* ─── Sticky Tab Navigation Bar ─── */}
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

              {/* Animated underline indicator — shared layout animation via layoutId */}
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

      {/* ─── Tab Content Area ─── */}
      {/* Each tab switch triggers a fade + slide animation via Framer Motion */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="tab-content"
      >
        {/* Conditionally render the appropriate feature module based on activeTab */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'budgets' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <BudgetManagement />
          </div>
        )}
        {activeTab === 'goals' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <FinancialGoals />
          </div>
        )}
        {activeTab === 'debts' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <DebtTracker />
          </div>
        )}
        {activeTab === 'splits' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <SplitBills />
          </div>
        )}
        {activeTab === 'recurring' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <RecurringTransactions />
          </div>
        )}
        {activeTab === 'calendar' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <FinancialCalendar />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <SpendingHeatmap />
          </div>
        )}
        {activeTab === 'export' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A', paddingTop: '1.5rem' }}>
            <ExportReports />
          </div>
        )}
        {activeTab === 'transactions' && (
          <div style={{ minHeight: '100vh', background: '#0B0F1A' }}>
            <Transactions />
          </div>
        )}
      </motion.div>

      {/* ─── Scoped Component Styles ─── */}
      <style>{`
        /* Root container — full viewport dark background */
        .enhanced-dashboard {
          min-height: 100vh;
          background: #0B0F1A;
        }

        /* Sticky horizontal tab bar with scrollable overflow on mobile */
        .tabs-container {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 2rem;
          padding-bottom: 0.5rem;
          background: #111827;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow-x: auto;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        /* Individual tab button — relative for the animated indicator */
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

        /* Hover state for inactive tabs */
        .tab-button:hover {
          background: rgba(255,255,255,0.05);
          color: #E5E7EB;
        }

        /* Active tab style — brighter text and background */
        .tab-button.active {
          color: white;
          background: rgba(255,255,255,0.05);
        }

        .tab-icon {
          font-size: 1.125rem;
        }

        .tab-label {
          font-size: 0.95rem;
        }

        /* Animated green underline indicator beneath the active tab */
        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #10B981, #34D399);
          border-radius: 2px 2px 0 0;
        }

        /* Content area takes at least the remaining viewport height */
        .tab-content {
          min-height: calc(100vh - 80px);
        }

        /* Responsive: collapse labels on mobile, enlarge icons */
        @media (max-width: 768px) {
          .tabs-container {
            padding: 1rem;
            gap: 0.25rem;
          }

          .tab-button {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }

          /* Hide text labels on small screens — icon-only mode */
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

/* Export the EnhancedDashboard component as the default module export */
export default EnhancedDashboard;
