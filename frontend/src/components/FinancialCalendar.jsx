import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaDollarSign,
  FaSync,
  FaBullseye,
  FaUsers,
  FaCreditCard,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle
} from 'react-icons/fa';

// ─── Event type config ───
const EVENT_CONFIG = {
  transaction:          { icon: FaCreditCard,   label: 'Transaction' },
  recurring:            { icon: FaSync,         label: 'Recurring' },
  recurring_projected:  { icon: FaSync,         label: 'Upcoming Recurring' },
  debt:                 { icon: FaUsers,        label: 'Debt Due' },
  goal:                 { icon: FaBullseye,     label: 'Goal Deadline' },
  budget_reset:         { icon: FaDollarSign,   label: 'Budget Reset' },
};

// ─── Helpers ───
const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const FinancialCalendar = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterTypes, setFilterTypes] = useState({
    transaction: true,
    recurring: true,
    recurring_projected: true,
    debt: true,
    goal: true,
    budget_reset: true,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      const params = new URLSearchParams({ startDate, endDate });

      const response = await fetch(`${API_ENDPOINTS.CALENDAR_EVENTS}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setEvents((result.data || []).map(e => ({ ...e, date: new Date(e.date) })));
      } else {
        toast.error('Failed to load calendar events');
      }
    } catch (err) {
      console.error('Calendar fetch error:', err);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [currentUser, year, month]);

  // Fetch events whenever month changes
  useEffect(() => {
    if (currentUser) fetchEvents();
  }, [currentUser, fetchEvents]);

  // ─── Build calendar grid ───
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // leading blanks
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [year, month]);

  // Group events by day number
  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!filterTypes[e.type]) continue;
      const day = e.date.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(e);
    }
    return map;
  }, [events, filterTypes]);

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (selectedDay == null) return [];
    return (eventsByDay[selectedDay] || []);
  }, [selectedDay, eventsByDay]);

  // ─── Navigation ───
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday   = () => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); };

  const today = new Date();
  const isToday = (day) =>
    day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  // ─── Summary stats for the month ───
  const monthSummary = useMemo(() => {
    let income = 0, expenses = 0, debtsDue = 0, goalsCount = 0;
    for (const e of events) {
      if (e.type === 'transaction' && e.subType === 'ADD') income += e.amount;
      if (e.type === 'transaction' && e.subType === 'SPEND') expenses += e.amount;
      if (e.type === 'debt') debtsDue++;
      if (e.type === 'goal') goalsCount++;
    }
    return { income, expenses, debtsDue, goalsCount };
  }, [events]);

  // ─── Toggle filter ───
  const toggleFilter = (type) => {
    setFilterTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Unique color dots for a day
  const getDayDots = (day) => {
    const dayEvents = eventsByDay[day] || [];
    const colors = [...new Set(dayEvents.map(e => e.color))];
    return colors.slice(0, 4);
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="cal-loading">
        <FaCalendarAlt className="loading-icon" />
        <p>Loading your financial calendar...</p>
        <style>{`
          .cal-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            color: #9CA3AF;
            background: #0B0F1A;
          }
          .cal-loading .loading-icon {
            font-size: 4rem;
            color: #10B981;
            animation: calPulse 1.5s ease-in-out infinite;
          }
          .cal-loading p {
            margin-top: 1rem;
            font-size: 1rem;
          }
          @keyframes calPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cal-tracker">

      {/* ─── Header ─── */}
      <div className="cal-header">
        <div className="header-title">
          <FaCalendarAlt className="header-icon" />
          <div>
            <h1>Financial Calendar</h1>
            <p className="header-subtitle">Track all your financial events in one place 📅💰</p>
          </div>
        </div>
        <motion.button
          className="today-btn"
          onClick={goToday}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCalendarAlt /> Today
        </motion.button>
      </div>

      {/* ─── Month Summary Cards ─── */}
      <div className="summary-cards">
        <SummaryCard icon={<FaArrowUp />} label="Income" value={`₹${monthSummary.income.toLocaleString()}`} colorClass="income" />
        <SummaryCard icon={<FaArrowDown />} label="Expenses" value={`₹${monthSummary.expenses.toLocaleString()}`} colorClass="expense" />
        <SummaryCard icon={<FaUsers />} label="Debts Due" value={monthSummary.debtsDue} colorClass="debt" />
        <SummaryCard icon={<FaBullseye />} label="Goal Deadlines" value={monthSummary.goalsCount} colorClass="goal" />
      </div>

      {/* ─── Filter Chips ─── */}
      <div className="filter-chips">
        {Object.entries(EVENT_CONFIG).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`filter-chip ${filterTypes[key] ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Calendar + Detail Panel ─── */}
      <div className="cal-layout">

        {/* Calendar Grid */}
        <div className="cal-grid-container">
          {/* Month nav */}
          <div className="month-nav">
            <motion.button
              onClick={prevMonth}
              className="nav-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronLeft />
            </motion.button>
            <h3 className="month-title">
              {monthNames[month]} {year}
            </h3>
            <motion.button
              onClick={nextMonth}
              className="nav-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronRight />
            </motion.button>
          </div>

          {/* Day-of-week header */}
          <div className="day-labels">
            {dayLabels.map(d => (
              <div key={d} className="day-label">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="day-grid">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} className="day-cell blank" />;

              const dots = getDayDots(day);
              const count = (eventsByDay[day] || []).length;
              const selected = selectedDay === day;

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(day)}
                  className={`day-cell ${selected ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
                >
                  <span className={`day-number ${isToday(day) ? 'today-num' : ''} ${selected ? 'selected-num' : ''}`}>
                    {day}
                  </span>

                  {/* Event dots */}
                  {dots.length > 0 && (
                    <div className="event-dots">
                      {dots.map((c, i) => (
                        <span key={i} className="dot" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}

                  {/* Event count badge */}
                  {count > 0 && (
                    <span className="count-badge">{count}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ─── Day Detail Panel ─── */}
        <div className="detail-panel">
          <h3 className="detail-title">
            {selectedDay != null
              ? `${monthNames[month]} ${selectedDay}, ${year}`
              : 'Select a day'}
          </h3>

          <AnimatePresence mode="wait">
            {selectedDay == null ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="detail-empty"
              >
                <FaCalendarAlt className="detail-empty-icon" />
                <p>Click on a day to see its events.</p>
              </motion.div>
            ) : selectedDayEvents.length === 0 ? (
              <motion.div
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="detail-empty"
              >
                <FaCalendarAlt className="detail-empty-icon" />
                <p>No events on this day.</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="event-list"
              >
                {selectedDayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Legend ─── */}
      <div className="legend-row">
        <LegendItem color="#10B981" label="Income" />
        <LegendItem color="#EF4444" label="Expense" />
        <LegendItem color="#8B5CF6" label="Recurring" />
        <LegendItem color="#F97316" label="Debt" />
        <LegendItem color="#3B82F6" label="Goal" />
        <LegendItem color="#06B6D4" label="Budget Reset" />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*                   STYLES                        */}
      {/* ═══════════════════════════════════════════════ */}
      <style>{`
        /* ─── Container ─── */
        .cal-tracker {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: #0B0F1A;
        }

        /* ─── Header ─── */
        .cal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .cal-header .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cal-header .header-icon {
          font-size: 2.5rem;
          color: #10B981;
          flex-shrink: 0;
        }

        .cal-header h1 {
          font-size: 2rem;
          color: white;
          margin: 0;
          font-weight: 700;
        }

        .cal-header .header-subtitle {
          color: #9CA3AF;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }

        .today-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: box-shadow 0.2s;
        }

        .today-btn:hover {
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        /* ─── Summary Cards ─── */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .summary-card-item {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .summary-card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }

        .summary-card-item.income  { border-left: 4px solid #10B981; }
        .summary-card-item.expense { border-left: 4px solid #EF4444; }
        .summary-card-item.debt    { border-left: 4px solid #F97316; }
        .summary-card-item.goal    { border-left: 4px solid #3B82F6; }

        .summary-card-icon {
          font-size: 1.75rem;
          padding: 0.875rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .income  .summary-card-icon { color: #10B981; }
        .expense .summary-card-icon { color: #EF4444; }
        .debt    .summary-card-icon { color: #F97316; }
        .goal    .summary-card-icon { color: #3B82F6; }

        .summary-card-content {
          display: flex;
          flex-direction: column;
        }

        .summary-card-label {
          color: #9CA3AF;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-card-value {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 0.15rem;
        }

        /* ─── Filter Chips ─── */
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
        }

        .filter-chip {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #64748B;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-chip:hover {
          background: rgba(255,255,255,0.06);
          color: #9CA3AF;
        }

        .filter-chip.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10B981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.08);
        }

        /* ─── Calendar Layout (grid + detail) ─── */
        .cal-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        /* ─── Calendar Grid Container ─── */
        .cal-grid-container {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        /* Month Navigation */
        .month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10B981;
        }

        .month-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin: 0;
          letter-spacing: 0.5px;
        }

        /* Day-of-week labels */
        .day-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 0.5rem;
        }

        .day-label {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          padding: 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Day Grid */
        .day-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .day-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 72px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: #0F172A;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.35rem;
        }

        .day-cell.blank {
          background: transparent;
          cursor: default;
        }

        .day-cell:not(.blank):hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08);
        }

        .day-cell.selected {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.12), inset 0 0 0 1px rgba(16, 185, 129, 0.15);
        }

        .day-cell.today:not(.selected) {
          border-color: rgba(16, 185, 129, 0.25);
          background: rgba(16, 185, 129, 0.05);
        }

        .day-number {
          font-size: 0.9rem;
          font-weight: 500;
          color: #CBD5E1;
          line-height: 1;
        }

        .day-number.today-num {
          color: #10B981;
          font-weight: 700;
        }

        .day-number.selected-num {
          color: white;
          font-weight: 700;
        }

        /* Event dots */
        .event-dots {
          display: flex;
          gap: 3px;
          margin-top: 6px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Count badge */
        .count-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 0.6rem;
          font-weight: 700;
          color: #10B981;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* ─── Day Detail Panel ─── */
        .detail-panel {
          background: #1E293B;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
          max-height: 620px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .detail-panel::-webkit-scrollbar {
          width: 6px;
        }
        .detail-panel::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          border-radius: 3px;
        }
        .detail-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 3px;
        }
        .detail-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }

        .detail-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: #64748B;
          text-align: center;
        }

        .detail-empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .detail-empty p {
          font-size: 0.9rem;
          margin: 0;
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ─── Event Card ─── */
        .event-card {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1rem;
          border-radius: 12px;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .event-card:hover {
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border-color: rgba(255,255,255,0.08);
        }

        .event-icon-wrap {
          padding: 0.6rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1rem;
        }

        .event-info {
          flex: 1;
          min-width: 0;
        }

        .event-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-type {
          font-size: 0.75rem;
          color: #9CA3AF;
          margin-top: 0.2rem;
        }

        .event-overdue {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: 0.35rem;
          font-size: 0.7rem;
          color: #FBBF24;
          font-weight: 600;
        }

        .event-frequency {
          font-size: 0.7rem;
          color: #64748B;
          margin-top: 0.25rem;
          text-transform: capitalize;
          display: block;
        }

        .event-amount {
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
          align-self: center;
        }

        /* ─── Legend ─── */
        .legend-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-top: 1.75rem;
          padding: 1.25rem 1.5rem;
          background: #1E293B;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #9CA3AF;
          font-weight: 500;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ─── Responsive ─── */
        @media (max-width: 900px) {
          .cal-layout {
            grid-template-columns: 1fr;
          }
          .detail-panel {
            max-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .cal-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          .day-cell {
            min-height: 56px;
          }
          .day-number {
            font-size: 0.8rem;
          }
          .count-badge {
            width: 15px;
            height: 15px;
            font-size: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .cal-tracker {
            padding: 1rem;
          }
          .summary-cards {
            grid-template-columns: 1fr;
          }
          .cal-header h1 {
            font-size: 1.5rem;
          }
          .day-cell {
            min-height: 48px;
            border-radius: 8px;
            padding: 0.25rem;
          }
          .dot {
            width: 4px;
            height: 4px;
          }
          .event-dots {
            margin-top: 4px;
            gap: 2px;
          }
          .filter-chips {
            gap: 0.35rem;
          }
          .filter-chip {
            padding: 0.4rem 0.75rem;
            font-size: 0.7rem;
          }
          .legend-row {
            gap: 0.75rem;
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

// ─── Sub-components ───

const SummaryCard = ({ icon, label, value, colorClass }) => {
  return (
    <motion.div
      className={`summary-card-item ${colorClass}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="summary-card-icon">{icon}</div>
      <div className="summary-card-content">
        <span className="summary-card-label">{label}</span>
        <span className="summary-card-value">{value}</span>
      </div>
    </motion.div>
  );
};

const EventCard = ({ event }) => {
  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.transaction;
  const Icon = cfg.icon;

  return (
    <div
      className="event-card"
      style={{ borderLeft: `3px solid ${event.color || '#64748B'}` }}
    >
      <div
        className="event-icon-wrap"
        style={{ backgroundColor: (event.color || '#64748B') + '18', color: event.color }}
      >
        <Icon />
      </div>
      <div className="event-info">
        <p className="event-title">{event.title}</p>
        <p className="event-type">{cfg.label}</p>

        {event.isOverdue && (
          <span className="event-overdue">
            <FaExclamationTriangle size={11} /> Overdue
          </span>
        )}

        {event.frequency && (
          <span className="event-frequency">{event.frequency}</span>
        )}
      </div>
      {event.type !== 'goal' && event.type !== 'budget_reset' && (
        <span className="event-amount" style={{ color: event.color }}>
          {event.subType === 'ADD' || event.subType === 'owed_to_me' ? '+' : '−'}₹{event.amount?.toLocaleString()}
        </span>
      )}
      {event.type === 'goal' && (
        <span className="event-amount" style={{ color: '#3B82F6' }}>
          ₹{event.amount?.toLocaleString()}
        </span>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="legend-item">
    <span className="legend-dot" style={{ backgroundColor: color }} />
    {label}
  </div>
);

export default FinancialCalendar;
