/**
 * @fileoverview Spending Heatmap & Analytics Component
 *
 * Visual analytics dashboard featuring:
 *  - Summary cards (Total Income, Expenses, Net Balance)
 *  - Day-of-week spending bar chart with insight text
 *  - 90-day calendar heatmap grid (GitHub-style)
 *  - Period selector (30 Days, 3 Months, 6 Months, 1 Year)
 *
 * @module components/SpendingHeatmap
 */

// ── Core React Hooks ─────────────────────────────────────────
import { useState, useEffect } from 'react';
// ── Animation ───────────────────────────────────────────────
import { motion } from 'framer-motion';
// ── Auth & API ──────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
// ── Utilities & Icons ───────────────────────────────────────
import toast from 'react-hot-toast';
import { FaFire, FaCalendar, FaSync, FaArrowUp, FaArrowDown, FaWallet } from 'react-icons/fa';

/** Day-of-week labels for the bar chart X-axis */
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * SpendingHeatmap Component
 *
 * Analytics dashboard with summary cards, day-of-week bars,
 * and a calendar heatmap grid.
 *
 * @returns {JSX.Element}
 */
const SpendingHeatmap = () => {
  const { currentUser } = useAuth();
  const [heatmapData, setHeatmapData] = useState(null);         // Calendar + day-of-week data
  const [summaryData, setSummaryData] = useState(null);         // Income/expense/balance totals
  const [isLoading, setIsLoading] = useState(true);             // Loading flag
  const [selectedPeriod, setSelectedPeriod] = useState('3months'); // Time range selector

  /** Effect: Re-fetch data when the selected period changes */
  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  /** Fetch both heatmap and summary data in parallel */
  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchHeatmapData(), fetchSummaryData()]);
    setIsLoading(false);
  };

  /** Convert Date to local YYYY-MM-DD (avoids timezone offset issues) */
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /** Calculate start/end Date objects based on selectedPeriod */
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'last30days': startDate.setDate(endDate.getDate() - 30); break;
      case '3months': startDate.setMonth(endDate.getMonth() - 3); break;
      case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
      case 'year': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setMonth(endDate.getMonth() - 3);
    }
    return { startDate, endDate };
  };

  /** Fetch income/expense/balance summary from the analytics API */
  const fetchSummaryData = async () => {
    try {
      const token = await currentUser.getIdToken();
      const { startDate, endDate } = getDateRange();

      const params = new URLSearchParams({
        startDate: getLocalDateString(startDate),
        endDate: getLocalDateString(endDate)
      });

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSummaryData(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  /** Fetch per-day spending data for the heatmap calendar grid */
  const fetchHeatmapData = async () => {
    try {
      const token = await currentUser.getIdToken();
      const { startDate, endDate } = getDateRange();

      const params = new URLSearchParams({
        startDate: getLocalDateString(startDate),
        endDate: getLocalDateString(endDate)
      });

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS_HEATMAP}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setHeatmapData(data.data);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      toast.error('Failed to load heatmap data');
    }
  };

  /**
   * Map a spending amount to a heatmap color intensity
   * Darker blue = higher relative spending
   */
  const getHeatmapColor = (amount, maxAmount) => {
    if (!amount || amount === 0) return '#f1f5f9';
    const intensity = amount / maxAmount;
    if (intensity < 0.2) return '#dbeafe';
    if (intensity < 0.4) return '#93c5fd';
    if (intensity < 0.6) return '#60a5fa';
    if (intensity < 0.8) return '#3b82f6';
    return '#1e40af';
  };

  /** Generate 90 days of calendar data for the heatmap grid */
  const generateCalendarDays = () => {
    if (!heatmapData) return [];
    const days = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 90);

    const calendarData = heatmapData.calendar || {};
    const amounts = Object.values(calendarData).map(d => d.amount);
    const maxAmount = Math.max(...amounts, 1);

    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = calendarData[dateKey] || { amount: 0, count: 0 };

      days.push({
        date: currentDate,
        dateKey,
        amount: dayData.amount,
        count: dayData.count,
        color: getHeatmapColor(dayData.amount, maxAmount)
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="heatmap-container">
      {/* Header */}
      <div className="heatmap-header">
        <div>
          <h2 className="heatmap-title">
            <FaFire className="inline-block mr-2 text-orange-500" />
            Analytics & Trends
          </h2>
          <p className="heatmap-subtitle">
            Visualize your financial activity and spending patterns
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={fetchData} className="refresh-btn">
            <FaSync className={isLoading ? 'animate-spin' : ''} />
          </button>

          <div className="period-selector">
            {['last30days', '3months', '6months', 'year'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={selectedPeriod === period ? 'active' : ''}
              >
                {period === 'last30days' ? '30 Days' :
                  period === '3months' ? '3 Months' :
                    period === '6months' ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && !heatmapData ? (
        <div className="loading-state">Loading analytics...</div>
      ) : (
        <>
          {/* Summary Cards */}
          {summaryData && (
            <div className="summary-grid">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="summary-card income"
              >
                <div className="card-icon income-icon"><FaArrowUp /></div>
                <div>
                  <h3>Total Income</h3>
                  <p>৳{summaryData.totalIncome.toFixed(2)}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="summary-card expense"
              >
                <div className="card-icon expense-icon"><FaArrowDown /></div>
                <div>
                  <h3>Total Expenses</h3>
                  <p>৳{summaryData.totalExpenses.toFixed(2)}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="summary-card balance"
              >
                <div className="card-icon balance-icon"><FaWallet /></div>
                <div>
                  <h3>Net Balance</h3>
                  <p>৳{summaryData.netBalance.toFixed(2)}</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Day of Week Analysis (Spending Only) */}
          {heatmapData && heatmapData.dayOfWeek && (
            <div className="day-of-week-section">
              <h3 className="section-title">
                <FaCalendar className="inline mr-2" />
                Spending by Day of Week
              </h3>
              <div className="day-of-week-bars">
                {DAYS_OF_WEEK.map((day, index) => {
                  const amount = heatmapData.dayOfWeek[index] || 0;
                  const maxAmount = Math.max(...heatmapData.dayOfWeek, 1);
                  const percentage = (amount / maxAmount) * 100;

                  return (
                    <div key={day} className="day-bar-container">
                      <div className="day-label">{day}</div>
                      <motion.div
                        className="day-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <span className="day-amount">৳{amount.toFixed(0)}</span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              <p className="insight-text">
                {(() => {
                  const maxIndex = heatmapData.dayOfWeek.indexOf(Math.max(...heatmapData.dayOfWeek));
                  const hasData = heatmapData.dayOfWeek.some(amt => amt > 0);
                  return hasData
                    ? `💡 You spend the most on ${DAYS_OF_WEEK[maxIndex]}s`
                    : '💡 No spending data for this period';
                })()}
              </p>
            </div>
          )}

          {/* Calendar Heatmap (Spending Only) */}
          <div className="calendar-heatmap-section">
            <h3 className="section-title">Spending Intensity (Last 90 Days)</h3>
            <div className="calendar-grid">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={day.dateKey}
                  className="calendar-day"
                  style={{ backgroundColor: day.color }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.002 }}
                  title={`${day.date.toLocaleDateString()}: ৳${day.amount.toFixed(2)} (${day.count} txns)`}
                >
                  {day.count > 0 && <div className="day-indicator">{day.count}</div>}
                </motion.div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="legend-boxes">
                {['#f1f5f9', '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1e40af'].map((color, i) => (
                  <div key={i} className="legend-box" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </>
      )}

      <style>{`
                .heatmap-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
                .heatmap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
                .heatmap-title { font-size: 2rem; font-weight: 700; color: white; margin: 0; }
                .heatmap-subtitle { color: #94a3b8; margin-top: 0.5rem; }
                
                .refresh-btn {
                    padding: 0.75rem;
                    background: #1e293b;
                    color: #94a3b8;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .refresh-btn:hover { background: #334155; color: white; }

                .period-selector { display: flex; gap: 0.5rem; background: #1e293b; padding: 0.25rem; border-radius: 12px; border: 1px solid #334155; }
                .period-selector button { padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #94a3b8; }
                .period-selector button.active { background: #3b82f6; color: white; }
                
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .summary-card {
                    background: #1e293b;
                    padding: 1.5rem;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid #334155;
                }
                
                .card-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }
                
                .income-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .expense-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .balance-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                
                .summary-card h3 { color: #94a3b8; font-size: 0.9rem; margin: 0 0 0.25rem 0; }
                .summary-card p { color: white; font-size: 1.5rem; font-weight: 700; margin: 0; }

                .day-of-week-section { background: #1e293b; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; border: 1px solid #334155; }
                .section-title { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 1.5rem; }
                .day-of-week-bars { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
                .day-bar-container { display: flex; align-items: center; gap: 1rem; }
                .day-label { width: 50px; font-weight: 600; color: #94a3b8; }
                .day-bar { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding: 0 1rem; min-width: 80px; position: relative; }
                .day-amount { color: white; font-weight: 700; white-space: nowrap; }
                .insight-text { margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px; color: #60a5fa; font-weight: 600; }

                .calendar-heatmap-section { background: #1e293b; border-radius: 16px; padding: 2rem; border: 1px solid #334155; }
                .calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(24px, 1fr)); gap: 4px; margin-bottom: 1rem; }
                .calendar-day { aspect-ratio: 1; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; position: relative; display: flex; align-items: center; justify-content: center; }
                .calendar-day:hover { transform: scale(1.2); z-index: 10; border: 2px solid white; }
                .day-indicator { font-size: 0.6rem; font-weight: 700; color: white; }
                .heatmap-legend { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; color: #94a3b8; font-size: 0.875rem; }
                .legend-boxes { display: flex; gap: 4px; }
                .legend-box { width: 16px; height: 16px; border-radius: 3px; }
                .loading-state { text-align: center; padding: 4rem; font-size: 1.2rem; color: #94a3b8; }

                @media (max-width: 768px) {
                    .heatmap-header { flex-direction: column; align-items: flex-start; }
                    .calendar-grid { grid-template-columns: repeat(auto-fill, minmax(16px, 1fr)); gap: 2px; }
                    .day-bar-container { flex-direction: column; align-items: flex-start; }
                    .day-bar { width: 100%; }
                }
            `}</style>
    </div>
  );
};

/* Export the SpendingHeatmap component as the default module export */
export default SpendingHeatmap;
