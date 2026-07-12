import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLogOut, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
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
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`lux-nav ${scrolled ? 'scrolled' : ''}`}
    >
      <Link to="/dashboard" className="lux-brand">
        <span className="lux-mark">MB</span>
        <span>Money<span>Bag</span></span>
      </Link>

      <div className="lux-nav-right">
        {currentUser ? (
          <>
            <div className="lux-user">
              <span><FiShield /> Authorized</span>
              <strong>{currentUser.email?.split('@')[0]}</strong>
            </div>
            <button type="button" className="lux-exit" onClick={handleLogout}>
              <FiLogOut />
              Sign out
            </button>
          </>
        ) : (
          <Link to="/" className="lux-exit">
            Sign in
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
