import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSearch, FiMenu, FiX, FiLogOut, FiHome, FiUser, FiFileText, FiMail, FiGrid, FiSun, FiMoon } from 'react-icons/fi';
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
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md shadow-sm border-slate-200 dark:border-[#1F2937]'
          : 'bg-white dark:bg-[#111827] border-transparent dark:border-[#1F2937]'
        }`}
      style={{ fontFamily: 'Inter, Plus Jakarta Sans, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-3xl">💰</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-[#E5E7EB] tracking-tight">MoneyBag</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" icon={<FiHome />} accent>Home</NavLink>
            <NavLink to="/blog" icon={<FiFileText />}>Blog</NavLink>
            <NavLink to="/about" icon={<FiUser />}>About</NavLink>
            <NavLink to="/contact" icon={<FiMail />}>Contact</NavLink>

            {currentUser ? (
              <>
                <NavLink to="/dashboard" icon={<FiGrid />}>Dashboard</NavLink>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </motion.button>
              </>
            ) : (
              <>
                <NavLink to="/">Sign In</NavLink>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="ml-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </>
            )}

            {/* Theme Toggle Desktop */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="ml-2 p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </motion.button>
          </div>

          {/* Search Icon */}
          <div className="hidden md:flex items-center">
            {/* Removed standalone search icon as it was redundant or placeholder */}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {/* Theme Toggle Mobile */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isDarkMode ? <FiSun className="w-6 h-6" /> : <FiMoon className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
            className="md:hidden bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-[#1F2937] overflow-hidden shadow-xl"
          >
            <div className="px-8 py-6 space-y-2">
              <MobileNavLink to="/" icon={<FiHome />} onClick={() => setMobileMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/blog" icon={<FiFileText />} onClick={() => setMobileMenuOpen(false)}>
                Blog
              </MobileNavLink>
              <MobileNavLink to="/about" icon={<FiUser />} onClick={() => setMobileMenuOpen(false)}>
                About
              </MobileNavLink>
              <MobileNavLink to="/contact" icon={<FiMail />} onClick={() => setMobileMenuOpen(false)}>
                Contact
              </MobileNavLink>

              {currentUser ? (
                <>
                  <MobileNavLink to="/dashboard" icon={<FiGrid />} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-5 py-3 text-white font-semibold bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-lg"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </MobileNavLink>
                  <MobileNavLink to="/register" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </MobileNavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// NavLink component for desktop
const NavLink = ({ to, children, icon, accent }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        } hover:bg-slate-100 dark:hover:bg-slate-800`}
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
      className="flex items-center gap-2 px-5 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </motion.div>
  </Link>
);

export default Navbar;

