import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiDollarSign,
  FiRepeat,
  FiTarget,
  FiUsers,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight,
  FiAlertTriangle
} from 'react-icons/fi';

// ─── Event type config ───
const EVENT_CONFIG = {
  transaction:          { icon: FiCreditCard,   label: 'Transaction' },
  recurring:            { icon: FiRepeat,       label: 'Recurring' },
  recurring_projected:  { icon: FiRepeat,       label: 'Upcoming Recurring' },
  debt:                 { icon: FiUsers,        label: 'Debt Due' },
  goal:                 { icon: FiTarget,       label: 'Goal Deadline' },
  budget_reset:         { icon: FiDollarSign,   label: 'Budget Reset' },
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

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-2xl text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Financial Calendar</h2>
        </div>
        <button
          onClick={goToday}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
        >
          Today
        </button>
      </div>

      {/* ─── Month Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={<FiArrowUpRight />} label="Income" value={`₹${monthSummary.income.toLocaleString()}`} color="emerald" />
        <SummaryCard icon={<FiArrowDownRight />} label="Expenses" value={`₹${monthSummary.expenses.toLocaleString()}`} color="red" />
        <SummaryCard icon={<FiUsers />} label="Debts Due" value={monthSummary.debtsDue} color="orange" />
        <SummaryCard icon={<FiTarget />} label="Goal Deadlines" value={monthSummary.goalsCount} color="blue" />
      </div>

      {/* ─── Filter Chips ─── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(EVENT_CONFIG).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition border ${
              filterTypes[key]
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent border-white/5 text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Calendar + Detail Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/5 p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <FiChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-white">
              {monthNames[month]} {year}
            </h3>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`blank-${idx}`} />;

                const dots = getDayDots(day);
                const count = (eventsByDay[day] || []).length;
                const selected = selectedDay === day;

                return (
                  <motion.button
                    key={day}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl p-2 min-h-15 transition-all
                      ${selected
                        ? 'bg-emerald-500/20 border border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'hover:bg-white/5 border border-transparent'}
                      ${isToday(day) && !selected ? 'border border-emerald-500/30' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium ${
                      isToday(day) ? 'text-emerald-400' :
                      selected ? 'text-white' : 'text-gray-300'
                    }`}>
                      {day}
                    </span>

                    {/* Event dots */}
                    {dots.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dots.map((c, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    )}

                    {/* Event count badge */}
                    {count > 0 && (
                      <span className="absolute top-1 right-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 rounded-full w-4 h-4 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Day Detail Panel ─── */}
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-5 max-h-150 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDay != null
              ? `${monthNames[month]} ${selectedDay}, ${year}`
              : 'Select a day'}
          </h3>

          <AnimatePresence mode="wait">
            {selectedDay == null ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-sm"
              >
                Click on a day to see its events.
              </motion.p>
            ) : selectedDayEvents.length === 0 ? (
              <motion.p
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-sm"
              >
                No events on this day.
              </motion.p>
            ) : (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
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
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-400">
        <LegendItem color="#10B981" label="Income" />
        <LegendItem color="#EF4444" label="Expense" />
        <LegendItem color="#8B5CF6" label="Recurring" />
        <LegendItem color="#F97316" label="Debt" />
        <LegendItem color="#3B82F6" label="Goal" />
        <LegendItem color="#06B6D4" label="Budget Reset" />
      </div>
    </div>
  );
};

// ─── Sub-components ───

const SummaryCard = ({ icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:     'bg-red-500/10 text-red-400 border-red-500/20',
    orange:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1 text-lg">{icon}</div>
      <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
};

const EventCard = ({ event }) => {
  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.transaction;
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border transition hover:bg-white/5"
      style={{ borderColor: event.color + '33' }}
    >
      <div
        className="p-2 rounded-lg mt-0.5"
        style={{ backgroundColor: event.color + '22' }}
      >
        <Icon style={{ color: event.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>

        {event.isOverdue && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-400">
            <FiAlertTriangle size={10} /> Overdue
          </span>
        )}

        {event.frequency && (
          <span className="text-[10px] text-gray-500 mt-1 block capitalize">{event.frequency}</span>
        )}
      </div>
      {event.type !== 'goal' && event.type !== 'budget_reset' && (
        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: event.color }}>
          {event.subType === 'ADD' || event.subType === 'owed_to_me' ? '+' : '−'}₹{event.amount?.toLocaleString()}
        </span>
      )}
      {event.type === 'goal' && (
        <span className="text-sm font-semibold whitespace-nowrap text-blue-400">
          ₹{event.amount?.toLocaleString()}
        </span>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </div>
);

export default FinancialCalendar;
