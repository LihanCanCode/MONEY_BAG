import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSearch, FiMenu, FiX, FiLogOut, FiHome, FiUser, FiFileText, FiMail, FiGrid, FiSun, FiMoon, FiDollarSign, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-300 border-b border-white/5 ${scrolled
        ? 'bg-[#020617]/90 backdrop-blur-xl shadow-2xl'
        : 'bg-[#020617]'
        }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              <FiDollarSign size={24} className="stroke-[3px]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Money<span className="text-cyan-400">Bag</span>
            </span>
          </Link>

          {/* Desktop Navigation - Simplified to Global Only */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-8 w-px bg-white/10 mx-2"></div>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white tracking-tight uppercase opacity-50">Authorized User</span>
                  <span className="text-xs font-mono text-cyan-400">{currentUser.email?.split('@')[0]}</span>
                </div>
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

          {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#020617] border-t border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-8 space-y-4">
              {currentUser ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-5 py-4 text-white font-bold bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all"
                >
                  <FiLogOut />
                  <span>Exit Session</span>
                </button>
              ) : (
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

// NavLink component for desktop
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

// MobileNavLink component
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

