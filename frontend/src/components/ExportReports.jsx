import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';
import toast from 'react-hot-toast';
import { FaFilePdf, FaFileCsv, FaDownload, FaCalendar, FaChartBar, FaArrowUp, FaArrowDown, FaWallet } from 'react-icons/fa';

const ExportReports = () => {
  const { currentUser } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Helper to get local YYYY-MM-DD string
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with "This Month" on mount
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();
    setDateRange({
      startDate: getLocalDateString(start),
      endDate: getLocalDateString(end)
    });
  }, []);

  // Fetch stats whenever dateRange changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchStats();
    }
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const token = await currentUser.getIdToken();
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadCurrentReport = async () => {
    await exportPDF(
      dateRange.startDate,
      dateRange.endDate,
      `MoneyBag_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`
    );
  };

  const exportPDF = async (start = dateRange.startDate, end = dateRange.endDate, filename = `MoneyBag_Report_${Date.now()}.pdf`) => {
    try {
      setIsExporting(true);
      const token = await currentUser.getIdToken();

      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const response = await fetch(`${API_ENDPOINTS.EXPORT_PDF}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      downloadFile(blob, filename);
      toast.success('PDF exported successfully! 📄');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async () => {
    try {
      setIsExporting(true);
      const token = await currentUser.getIdToken();

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(`${API_ENDPOINTS.EXPORT_CSV}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      downloadFile(blob, `MoneyBag_Transactions_${Date.now()}.csv`);
      toast.success('CSV exported successfully! 📊');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const quickDateRanges = [
    {
      label: 'Last 7 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
      }
    },
    {
      label: 'Last 30 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date();
        return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
      }
    },
    {
      label: 'This Year',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date();
        return { startDate: getLocalDateString(start), endDate: getLocalDateString(end) };
      }
    }
  ];

  return (
    <div className="export-reports-container">
      <div className="export-header">
        <div>
          <h2 className="export-title">
            <FaChartBar className="inline-block mr-2 text-indigo-500" />
            Summaries & Reports
          </h2>
          <p className="export-subtitle">
            Track your progress and download detailed transaction reports
          </p>
        </div>
      </div>

      <div className="export-content">
        {/* Dynamic Report Summary Section */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="monthly-report-card"
          >
            <div className="monthly-header">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Report Summary
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {dateRange.startDate === dateRange.endDate
                    ? `Date: ${dateRange.startDate}`
                    : `${dateRange.startDate} to ${dateRange.endDate}`}
                </p>
              </div>
              <button
                onClick={downloadCurrentReport}
                disabled={isExporting}
                className="download-monthly-btn"
              >
                <FaFilePdf className="mr-2" />
                {isExporting ? 'Generating...' : 'Download Report'}
              </button>
            </div>

            <div className="monthly-stats-grid">
              <div className="stat-item income">
                <div className="stat-icon"><FaArrowUp /></div>
                <div>
                  <span className="stat-label">Income</span>
                  <span className="stat-value text-green-600">
                    ${stats.totalIncome.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="stat-item expense">
                <div className="stat-icon"><FaArrowDown /></div>
                <div>
                  <span className="stat-label">Expenses</span>
                  <span className="stat-value text-red-500">
                    ${stats.totalExpenses.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="stat-item balance">
                <div className="stat-icon"><FaWallet /></div>
                <div>
                  <span className="stat-label">Net Balance</span>
                  <span className="stat-value text-blue-600">
                    ${stats.netBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Date Range Selection */}
        <div className="date-range-section">
          <h3 className="section-title">
            <FaCalendar className="inline mr-2" />
            Select Date Range
          </h3>

          <div className="quick-ranges">
            {quickDateRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => setDateRange(range.getValue())}
                className="quick-range-btn"
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="custom-range">
            <div className="date-input-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                min={dateRange.startDate}
                className="date-input"
              />
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="export-options">
          <motion.div
            className="export-card pdf-card"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-icon pdf-icon">
              <FaFilePdf size={48} />
            </div>
            <h3>PDF Report</h3>
            <p>
              Download the currently viewed report as a PDF provided above.
            </p>
            <ul className="features-list">
              <li>✓ Professional layout</li>
              <li>✓ Summary statistics</li>
              <li>✓ Detailed transactions</li>
            </ul>
            <button
              onClick={() => downloadCurrentReport()}
              disabled={isExporting}
              className="export-btn pdf-btn"
            >
              <FaDownload className="mr-2" />
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </button>
          </motion.div>

          <motion.div
            className="export-card csv-card"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-icon csv-icon">
              <FaFileCsv size={48} />
            </div>
            <h3>CSV Export</h3>
            <p>
              Download raw data for the selected range as a CSV file.
            </p>
            <ul className="features-list">
              <li>✓ Excel compatible</li>
              <li>✓ All details included</li>
              <li>✓ Easy to analyze</li>
            </ul>
            <button
              onClick={exportCSV}
              disabled={isExporting}
              className="export-btn csv-btn"
            >
              <FaDownload className="mr-2" />
              {isExporting ? 'Exporting...' : 'Download CSV'}
            </button>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .export-reports-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .export-header {
          margin-bottom: 2rem;
        }

        .export-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .export-subtitle {
          color: #64748b;
          margin-top: 0.5rem;
        }

        .export-content {
          display: grid;
          gap: 2rem;
        }

        .monthly-report-card {
            background: linear-gradient(to right, #ffffff, #f8fafc);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }

        .monthly-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .download-monthly-btn {
            background: #2563eb;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            display: flex;
            align-items: center;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }

        .download-monthly-btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .monthly-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
        }

        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .stat-item.income .stat-icon { background: #dcfce7; color: #16a34a; }
        .stat-item.expense .stat-icon { background: #fee2e2; color: #dc2626; }
        .stat-item.balance .stat-icon { background: #dbeafe; color: #2563eb; }

        .stat-label {
            display: block;
            font-size: 0.875rem;
            color: #64748b;
            margin-bottom: 0.25rem;
        }

        .stat-value {
            font-size: 1.25rem;
            font-weight: 700;
        }

        .date-range-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
        }

        .quick-ranges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .quick-range-btn {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s ease;
        }

        .quick-range-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .custom-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .date-input-group label {
          font-weight: 600;
          color: #475569;
        }

        .date-input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .export-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .export-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          text-align: center;
        }

        .card-icon {
          margin: 0 auto 1.5rem;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pdf-icon {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .csv-icon {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .export-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .export-card p {
          color: #64748b;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
          text-align: left;
        }

        .features-list li {
          padding: 0.5rem 0;
          color: #475569;
          font-weight: 500;
        }

        .export-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .pdf-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .csv-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        .export-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .custom-range {
            grid-template-columns: 1fr;
          }

          .export-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ExportReports;
