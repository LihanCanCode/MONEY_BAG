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
import { FiMenu, FiX, FiLogOut, FiDollarSign } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';

/**
 * Navbar Component
 */
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

  // Sign Out button styled exactly like Sign In button in Home.jsx
  const signOutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    color: '#E2E8F0'
  };

  const userInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: '1rem'
  };

  const userLabelStyle = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const userEmailStyle = {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    color: '#22D3EE'
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-300 border-b border-white/5 ${
        scrolled
          ? 'bg-[#020617]/90 backdrop-blur-xl shadow-2xl'
          : 'bg-[#020617]'
      }`}
      style={{ padding: '1rem 3rem' }}
    >
      <div className="flex items-center justify-between">
        {/* Logo/Brand - New Logo Image + Text (Points to Dashboard) */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <motion.img 
            src={logoImg} 
            alt="MoneyBag Logo" 
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            Money<span className="text-cyan-400">Bag</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser ? (
            <>
              {/* User Info */}
              <div style={userInfoStyle}>
                <span style={userLabelStyle}>Authorized User</span>
                <span style={userEmailStyle}>{currentUser.email?.split('@')[0]}</span>
              </div>
              
              {/* Sign Out Button - exactly like Sign In in Home.jsx */}
              <motion.button
                whileHover={{ scale: 1.02, borderColor: 'rgba(239, 68, 68, 0.5)', color: '#F87171' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                style={signOutBtnStyle}
              >
                <FiLogOut />
                Sign Out
              </motion.button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/">
                <button style={signOutBtnStyle}>
                  <FiLogOut />
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

