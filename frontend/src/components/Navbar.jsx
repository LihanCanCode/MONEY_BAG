import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiMenu, FiX, FiLogOut, FiHome, FiUser, FiFileText, FiMail, FiGrid } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
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
      className="sticky top-0 z-50 bg-[#111827] border-b border-[#1F2937] transition-all duration-300 shadow-none"
      style={{ fontFamily: 'Inter, Plus Jakarta Sans, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-3xl text-[#4F46E5]">💰</span>
            <span className="text-2xl font-bold text-[#E5E7EB] tracking-tight">MoneyBag</span>
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-[#E5E7EB] font-semibold bg-[#4F46E5] hover:bg-[#3730A3] transition"
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
                    className="ml-2 px-5 py-2 bg-[#4F46E5] text-[#E5E7EB] rounded-xl font-semibold hover:bg-[#3730A3] transition"
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Search Icon */}
          <div className="hidden md:flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl text-[#9CA3AF] hover:bg-[#1F2937] transition"
            >
              <FiSearch className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#9CA3AF] hover:bg-[#1F2937] transition"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#111827] border-t border-[#1F2937]"
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
                    className="w-full flex items-center gap-2 px-5 py-3 text-[#E5E7EB] font-semibold bg-[#4F46E5] rounded-xl hover:bg-[#3730A3] transition"
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
      className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all ${accent ? 'text-[#4F46E5]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'} hover:bg-[#1F2937]`}
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
      className="flex items-center gap-2 px-5 py-3 text-[#9CA3AF] hover:text-[#E5E7EB] font-medium rounded-xl hover:bg-[#1F2937] transition"
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </motion.div>
  </Link>
);

export default Navbar;

