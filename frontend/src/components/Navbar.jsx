/**
 * @fileoverview Navigation Bar Component
 * 
 * Sticky navigation header with:
 * - Responsive design (desktop and mobile layouts)
 * - User authentication display
 * - Theme toggle (dark/light mode)
 * - Smooth scroll effects
 * - Animated mobile menu
 * - Logo and branding
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSearch, FiMenu, FiX, FiLogOut, FiHome, FiUser, FiFileText, FiMail, FiGrid, FiSun, FiMoon, FiDollarSign, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navbar Component
 * 
 * Sticky navigation header that adapts based on authentication state.
 * Features:
 * - Animated entrance on mount
 * - Background blur effect on scroll
 * - User info display when authenticated
 * - Logout functionality
 * - Responsive mobile menu
 * - Theme toggle button
 * - Smooth transitions and hover effects
 * 
 * @returns {JSX.Element} Navigation bar component
 */
const Navbar = () => {
  // Access authentication and theme contexts
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Local UI state
  const [scrolled, setScrolled] = useState(false); // Track scroll position for styling
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Control mobile menu visibility

  /**
   * Effect: Monitor scroll position
   * Updates navbar styling when user scrolls past threshold
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup: Remove scroll listener on unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Handle user logout
   * Signs out user and redirects to home page
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }} // Start above viewport
      animate={{ y: 0 }}     // Slide down to position
      className={`sticky top-0 z-50 transition-all duration-300 border-b border-white/5 ${
        scrolled
          ? 'bg-[#020617]/90 backdrop-blur-xl shadow-2xl' // Enhanced styling when scrolled
          : 'bg-[#020617]' // Default styling
        }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* ==========================================
              LOGO/BRAND - Left side
              ========================================== */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Icon with gradient background */}
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <FiDollarSign size={24} className="stroke-[3px]" />
            </div>
            {/* Brand name with gradient text */}
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Money<span className="text-cyan-400">Bag</span>
            </span>
          </Link>

          {/* ==========================================
              DESKTOP NAVIGATION - Right side (hidden on mobile)
              ========================================== */}
          <div className="hidden md:flex items-center gap-4">
            {/* Vertical divider */}
            <div className="h-8 w-px bg-white/10 mx-2"></div>

            {currentUser ? (
              // AUTHENTICATED USER DISPLAY
              <div className="flex items-center gap-4">
                {/* User information display */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white tracking-tight uppercase opacity-50">Authorized User</span>
                  <span className="text-xs font-mono text-cyan-400">{currentUser.email?.split('@')[0]}</span>
                </div>
                
                {/* Logout button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all"
                >
                  <FiLogOut />
                  <span>Exit Session</span>
                </motion.button>
              </div>
            ) : (
              // NON-AUTHENTICATED USER DISPLAY
              <div className="flex items-center gap-4">
                <NavLink to="/">Sign In</NavLink>
                <Link to="/">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-cyan-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          {/* ==========================================
              MOBILE MENU BUTTON - Visible only on mobile
              ========================================== */}
          <div className="md:hidden flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/5 border border-white/5 transition"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ==========================================
          MOBILE MENU - Animated dropdown (mobile only)
          ========================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}    // Start hidden and collapsed
            animate={{ opacity: 1, height: 'auto' }} // Expand smoothly
            exit={{ opacity: 0, height: 0 }}          // Collapse on close
            className="md:hidden bg-[#020617] border-t border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-8 space-y-4">
              {currentUser ? (
                // AUTHENTICATED USER - Show logout button
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false); // Close menu after logout
                  }}
                  className="w-full flex items-center gap-2 px-5 py-4 text-white font-bold bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all"
                >
                  <FiLogOut />
                  <span>Exit Session</span>
                </button>
              ) : (
                // NON-AUTHENTICATED USER - Show sign in/get started
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold">
                    Sign In / Get Started
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/**
 * NavLink Component
 * 
 * Reusable navigation link with hover animations for desktop menu
 * 
 * @param {Object} props - Component props
 * @param {string} props.to - Route path to navigate to
 * @param {ReactNode} props.children - Link text content
 * @param {ReactNode} props.icon - Optional icon to display before text
 * @returns {JSX.Element} Animated navigation link
 */
const NavLink = ({ to, children, icon }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all text-slate-400 hover:text-white hover:bg-white/5"
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </motion.div>
  </Link>
);

/**
 * MobileNavLink Component
 * 
 * Reusable navigation link for mobile menu with tap animations
 * 
 * @param {Object} props - Component props
 * @param {string} props.to - Route path to navigate to
 * @param {ReactNode} props.children - Link text content
 * @param {ReactNode} props.icon - Optional icon to display before text
 * @param {Function} props.onClick - Click handler (typically closes mobile menu)
 * @returns {JSX.Element} Animated mobile navigation link
 */
const MobileNavLink = ({ to, children, icon, onClick }) => (
  <Link to={to} onClick={onClick}>
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-white font-bold rounded-2xl hover:bg-white/5 transition-all"
    >
      {icon && <span className="text-xl">{icon}</span>}
      <span>{children}</span>
    </motion.div>
  </Link>
);

export default Navbar;

