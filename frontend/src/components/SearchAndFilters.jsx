/**
 * @fileoverview Search & Filters Component
 *
 * Reusable advanced search and filtering toolbar for the Transactions page.
 * Provides:
 *  - Real-time text search (filters as-you-type)
 *  - Expandable advanced filters panel with:
 *    • Category dropdown
 *    • Transaction type (Income / Expense)
 *    • Min / Max amount range
 *    • Start / End date range
 *  - Active filter badge count
 *  - Apply / Clear all filter actions
 *  - Responsive layout for mobile
 *
 * @module components/SearchAndFilters
 */

// ── Core React Hooks ──────────────────────────────────────────────────────────
import { useState } from 'react';

// ── Animation Libraries ──────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';

// ── Icon Libraries ─────────────────────────────────────────────────────────────
import { FaSearch, FaFilter, FaTimes, FaCalendar, FaDollarSign } from 'react-icons/fa';

/**
 * Transaction category options for the filter dropdown.
 * Each entry maps an internal value to a user-friendly emoji label.
 */
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: '🍔 Food & Dining' },
  { value: 'transport', label: '🚗 Transportation' },
  { value: 'shopping', label: '🛒️ Shopping' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'bills', label: '💡 Bills & Utilities' },
  { value: 'health', label: '💊 Health & Fitness' },
  { value: 'education', label: '📚 Education' },
  { value: 'salary', label: '💰 Salary' },
  { value: 'other', label: '📦 Other' }
];

/**
 * SearchAndFilters Component
 *
 * Provides a search bar with an expandable advanced-filter panel.
 * All filter state is managed locally and pushed to the parent via
 * the onFilterChange callback.
 *
 * @param {Object}   props
 * @param {Function} props.onFilterChange  - Callback invoked with the current filter object
 * @param {Object}   [props.activeFilters] - Optional initial filter values
 * @returns {JSX.Element}
 */
const SearchAndFilters = ({ onFilterChange, activeFilters }) => {
  // ── Local Filter State ──────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);  // Advanced panel visibility
  const [filters, setFilters] = useState(activeFilters || {
    search: '',      // Free-text search term
    category: '',    // Category filter key
    type: '',        // Transaction type ('ADD' | 'SPEND' | '')
    minAmount: '',   // Minimum amount (inclusive)
    maxAmount: '',   // Maximum amount (inclusive)
    startDate: '',   // Start date (YYYY-MM-DD)
    endDate: ''      // End date (YYYY-MM-DD)
  });

  /** Update search text and immediately notify parent (live search) */
  const handleSearchChange = (value) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  /** Update a specific filter field locally (deferred until "Apply") */
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  /** Apply all current filters and close the panel */
  const applyFilters = () => {
    onFilterChange(filters);
    setShowFilters(false);
  };

  /** Reset all filters to empty and notify parent */
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      category: '',
      type: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setShowFilters(false);
  };

  /** Count non-empty filter fields for the badge indicator */
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="search-and-filters">
      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions... (e.g., Starbucks, Uber, Netflix)"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="clear-search-btn"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
        >
          <FaFilter className="mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="filters-panel"
          >
            <div className="filters-grid">
              {/* Category Filter */}
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="filter-group">
                <label>Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  <option value="ADD">💰 Income</option>
                  <option value="SPEND">💸 Expenses</option>
                </select>
              </div>

              {/* Amount Range */}
              <div className="filter-group">
                <label>
                  <FaDollarSign className="inline mr-1" />
                  Min Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>
                  <FaDollarSign className="inline mr-1" />
                  Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="999999"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="filter-input"
                />
              </div>

              {/* Date Range */}
              <div className="filter-group">
                <label>
                  <FaCalendar className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>
                  <FaCalendar className="inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                  min={filters.startDate}
                />
              </div>
            </div>

            <div className="filters-actions">
              <button onClick={clearFilters} className="btn-clear">
                Clear All Filters
              </button>
              <button onClick={applyFilters} className="btn-apply">
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .search-and-filters {
          margin-bottom: 2rem;
        }

        .search-bar-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          font-size: 1.1rem;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .clear-search-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .clear-search-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .filter-toggle-btn:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .filter-toggle-btn.has-filters {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-color: #3b82f6;
        }

        .filter-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .filters-panel {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          overflow: hidden;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          color: #475569;
          font-size: 0.9rem;
        }

        .filter-input,
        .filter-select {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .filters-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-clear,
        .btn-apply {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-clear:hover {
          background: #e2e8f0;
        }

        .btn-apply {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .btn-apply:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .search-bar-container {
            flex-direction: column;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

/* Export the SearchAndFilters component as the default module export */
export default SearchAndFilters;
