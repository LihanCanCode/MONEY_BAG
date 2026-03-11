import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiArrowRight, FiUserPlus, FiLogIn, FiDollarSign } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiTwoCoins, GiWallet, GiMoneyStack, GiPiggyBank } from 'react-icons/gi';
import toast from 'react-hot-toast';

const getFirebaseErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/missing-password': 'Please enter your password.',
    'auth/missing-email': 'Please enter your email address.',
  };
  return messages[code] || 'Authentication failed. Please try again.';
};

const Home = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, registerUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Password strength checker
  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, text: '', color: '' };
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    
    const levels = [
      { level: 0, text: '', color: '' },
      { level: 1, text: 'Weak', color: '#EF4444' },
      { level: 2, text: 'Fair', color: '#F59E0B' },
      { level: 3, text: 'Good', color: '#3B82F6' },
      { level: 4, text: 'Strong', color: '#10B981' }
    ];
    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword && password === confirmPassword;

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading(activeTab === 'signin' ? 'Authenticating...' : 'Creating account...');

    try {
      if (activeTab === 'signin') {
        await loginUser(email, password);
        toast.success("Welcome back! 🎉", { id: toastId });
      } else {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match!", { id: toastId });
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters!", { id: toastId });
          setIsLoading(false);
          return;
        }
        await registerUser(email, password);
        toast.success("Account created successfully! 🚀", { id: toastId });
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Auth error details:", error.code, error.message);
      const msg = getFirebaseErrorMessage(error.code);
      toast.error(msg, { id: toastId, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const toastId = toast.loading('Connecting to Google...');
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google! 🎉", { id: toastId, duration: 3000 });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-in failed", { id: toastId });
    }
  };

  // Floating animation
  const floatingAnimation = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="home-page">
      {/* Top Navbar */}
      <nav className="top-navbar">
        <Link to="/" className="navbar-brand">
          {/* Icon with gradient background - same as Navbar.jsx */}
          <div className="brand-icon-box">
            <FiDollarSign size={24} strokeWidth={3} />
          </div>
          {/* Brand name with gradient text - same as Navbar.jsx */}
          <span className="brand-text">Money<span className="brand-accent">Bag</span></span>
        </Link>
        <div className="navbar-buttons">
          <button
            onClick={() => setActiveTab('signin')}
            className={`nav-btn signin-btn ${activeTab === 'signin' ? 'active' : ''}`}
          >
            <FiLogIn />
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`nav-btn signup-btn ${activeTab === 'signup' ? 'active' : ''}`}
          >
            <FiUserPlus />
            Sign Up
          </button>
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="bg-gradient-blob bg-blob-1"></div>
      <div className="bg-gradient-blob bg-blob-2"></div>
      <div className="bg-gradient-blob bg-blob-3"></div>

      {/* Floating decorative icons */}
      <motion.div className="floating-icon icon-1" variants={floatingAnimation} animate="animate">
        <GiTwoCoins />
      </motion.div>
      <motion.div className="floating-icon icon-2" variants={floatingAnimation} animate="animate">
        <GiWallet />
      </motion.div>
      <motion.div className="floating-icon icon-3" variants={floatingAnimation} animate="animate">
        <GiMoneyStack />
      </motion.div>
      <motion.div className="floating-icon icon-4" variants={floatingAnimation} animate="animate">
        <GiPiggyBank />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        {/* Header */}
        <div className="card-header">
          <motion.div
            className="logo-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="logo-icon">💰</div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {activeTab === 'signin' ? 'Welcome Back!' : 'Create Account'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="subtitle"
          >
            {activeTab === 'signin' 
              ? 'Sign in to continue managing your finances' 
              : 'Start your journey to financial freedom'}
          </motion.p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="auth-form">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'signin' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'signin' ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="form-fields"
            >
              {/* Email Field */}
              <div className="auth-form-group">
                <span className="auth-label">Email Address</span>
                <div className="input-wrapper">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-form-group">
                <div className="label-row">
                  <span className="auth-label">Password</span>
                  {activeTab === 'signin' && (
                    <a href="#" className="forgot-link">Forgot password?</a>
                  )}
                </div>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'signin' ? "Enter your password" : "Min. 6 characters"}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {/* Password strength indicator for signup */}
                {activeTab === 'signup' && password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <div 
                          key={level}
                          className={`strength-bar ${passwordStrength.level >= level ? 'active' : ''}`}
                          style={{ backgroundColor: passwordStrength.level >= level ? passwordStrength.color : '' }}
                        />
                      ))}
                    </div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field (Sign Up only) */}
              {activeTab === 'signup' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="auth-form-group"
                >
                  <span className="auth-label">Confirm Password</span>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      className={`form-input ${confirmPassword ? (passwordsMatch ? 'match' : 'no-match') : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="toggle-password"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {/* Password match indicator */}
                  {confirmPassword && (
                    <div className="match-indicator">
                      {passwordsMatch ? (
                        <span className="match">✓ Passwords match</span>
                      ) : (
                        <span className="no-match">✗ Passwords don't match</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`submit-btn ${activeTab === 'signup' ? 'signup' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="loading-text">
                {activeTab === 'signin' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <>
                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                <FiArrowRight className="btn-icon" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="divider">
            <span>or continue with</span>
          </div>

          {/* Google Sign-In Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FcGoogle className="google-icon" />
            <span>Continue with Google</span>
          </motion.button>
        </form>

        {/* Security Badge */}
        <div className="security-badge">
          <div className="badge-dot"></div>
          <span>Secured with End-to-End Encryption</span>
        </div>
      </motion.div>

      <style>{`
        .home-page {
          min-height: 100vh;
          width: 100%;
          background: #0B0F1A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          padding-top: 6rem;
          position: relative;
          overflow: hidden;
        }

        /* Top Navbar */
        .top-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 3rem;
          background: rgba(11, 15, 26, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 100;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-icon-box {
          width: 40px;
          height: 40px;
          background: linear-gradient(to top right, #06B6D4, #2563EB);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
          transition: transform 0.3s;
        }

        .navbar-brand:hover .brand-icon-box {
          transform: scale(1.1);
        }

        .brand-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.025em;
          transition: color 0.3s;
        }

        .navbar-brand:hover .brand-text {
          color: #22D3EE;
        }

        .brand-accent {
          color: #22D3EE;
        }

        .navbar-buttons {
          display: flex;
          gap: 1rem;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .signin-btn {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.15);
          color: #E2E8F0;
        }

        .signin-btn:hover {
          border-color: rgba(99, 102, 241, 0.5);
          color: white;
        }

        .signin-btn.active {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366F1;
          color: white;
        }

        .signup-btn {
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          border: 2px solid transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .signup-btn:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .signup-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        /* Background gradient blobs */
        .bg-gradient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        .bg-blob-1 {
          top: -15%;
          right: -10%;
          width: 45%;
          height: 45%;
          background: rgba(99, 102, 241, 0.15);
        }

        .bg-blob-2 {
          bottom: -15%;
          left: -10%;
          width: 45%;
          height: 45%;
          background: rgba(6, 182, 212, 0.12);
        }

        .bg-blob-3 {
          top: 40%;
          left: 50%;
          width: 30%;
          height: 30%;
          background: rgba(139, 92, 246, 0.08);
        }

        /* Floating icons */
        .floating-icon {
          position: absolute;
          font-size: 3rem;
          opacity: 0.12;
          pointer-events: none;
        }

        .icon-1 {
          top: 12%;
          left: 8%;
          color: #6366F1;
        }

        .icon-2 {
          top: 20%;
          right: 10%;
          color: #06B6D4;
        }

        .icon-3 {
          bottom: 18%;
          left: 12%;
          color: #8B5CF6;
        }

        .icon-4 {
          bottom: 25%;
          right: 8%;
          color: #10B981;
        }

        /* Auth Card */
        .auth-card {
          width: 100%;
          max-width: 580px;
          background: rgba(20, 27, 45, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2.5rem;
          padding: 3.5rem 4rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        /* Header */
        .card-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-container {
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #6366F1, #06B6D4);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.75rem;
          box-shadow: 0 15px 40px rgba(99, 102, 241, 0.35);
        }

        .card-header h1 {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: #94A3B8;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 500;
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .auth-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .auth-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #E2E8F0;
          letter-spacing: 0.02em;
          margin-left: 0.25rem;
          background: transparent;
          padding: 0;
          display: inline;
        }

        .forgot-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6366F1;
          text-decoration: none;
          transition: color 0.3s;
          background: transparent;
        }

        .forgot-link:hover {
          color: #818CF8;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 1.25rem 1.5rem;
          background: rgba(11, 15, 26, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.25rem;
          color: white;
          font-size: 1.1rem;
          font-weight: 500;
          transition: all 0.3s;
        }

        .form-input::placeholder {
          color: #475569;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
          background: rgba(11, 15, 26, 0.9);
        }

        .form-input.match {
          border-color: rgba(16, 185, 129, 0.6);
        }

        .form-input.no-match {
          border-color: rgba(239, 68, 68, 0.6);
        }

        .toggle-password {
          position: absolute;
          right: 1.25rem;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          padding: 0.75rem;
          transition: color 0.3s;
        }

        .toggle-password:hover {
          color: #6366F1;
        }

        /* Password strength indicator */
        .password-strength {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
          padding: 0 0.25rem;
        }

        .strength-bars {
          display: flex;
          gap: 6px;
          flex: 1;
        }

        .strength-bar {
          height: 6px;
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          transition: all 0.3s;
        }

        .strength-bar.active {
          background: #10B981;
        }

        .strength-text {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Match indicator */
        .match-indicator {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          padding-left: 0.25rem;
        }

        .match-indicator .match {
          color: #10B981;
        }

        .match-indicator .no-match {
          color: #EF4444;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 1.35rem 2rem;
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: white;
          border: none;
          border-radius: 1.25rem;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.3s;
          box-shadow: 0 12px 35px rgba(99, 102, 241, 0.3);
          margin-top: 0.5rem;
        }

        .submit-btn.signup {
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          box-shadow: 0 12px 35px rgba(139, 92, 246, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 18px 45px rgba(99, 102, 241, 0.4);
          transform: translateY(-2px);
        }

        .submit-btn.signup:hover:not(:disabled) {
          box-shadow: 0 18px 45px rgba(139, 92, 246, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 1.4rem;
          transition: transform 0.3s;
        }

        .submit-btn:hover .btn-icon {
          transform: translateX(5px);
        }

        .loading-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin: 0.75rem 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 2px;
          background: rgba(255, 255, 255, 0.08);
        }

        .divider span {
          color: #64748B;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Google button */
        .google-btn {
          width: 100%;
          padding: 1.25rem 2rem;
          background: rgba(255, 255, 255, 0.04);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          transition: all 0.3s;
        }

        .google-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .google-icon {
          font-size: 1.75rem;
        }

        /* Security Badge */
        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 2.5rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #06B6D4;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .security-badge span {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .home-page {
            padding: 1.5rem;
            padding-top: 5.5rem;
          }

          .top-navbar {
            padding: 0.75rem 1.25rem;
          }

          .brand-text {
            font-size: 1.2rem;
          }

          .brand-icon-box {
            width: 30px;
            height: 30px;
          }

          .nav-btn {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }

          .navbar-buttons {
            gap: 0.5rem;
          }

          .auth-card {
            padding: 2.5rem 2rem;
            border-radius: 2rem;
          }

          .card-header h1 {
            font-size: 2rem;
          }

          .logo-icon {
            width: 70px;
            height: 70px;
            font-size: 2rem;
          }

          .form-input {
            padding: 1.1rem 1.25rem;
            font-size: 1rem;
          }

          .submit-btn, .google-btn {
            padding: 1.1rem 1.5rem;
            font-size: 1.05rem;
          }

          .floating-icon {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
