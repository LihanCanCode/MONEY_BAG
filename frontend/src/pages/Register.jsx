/**
 * @fileoverview User Registration Page Component
 * 
 * Modern, dark-themed registration interface with:
 * - Email and password registration
 * - Password confirmation validation
 * - Password visibility toggles
 * - Loading states during registration
 * - Toast notifications for user feedback
 * - Animated entrance effects
 * - Responsive design
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiTwoCoins, GiWallet, GiMoneyStack, GiPiggyBank } from 'react-icons/gi';
import toast from 'react-hot-toast';

/**
 * Register Component
 * 
 * Full-featured registration page with modern dark aesthetic
 * Features animated elements and smooth transitions
 * 
 * @returns {JSX.Element} Registration page component
 */
const Register = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state management
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Authentication and navigation hooks
  const { registerUser, signInWithGoogle } = useAuth();
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

  /**
   * Handle registration form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!', {
        duration: 4000,
        style: {
          background: '#7F1D1D',
          color: '#FEF2F2',
          border: '2px solid #EF4444'
        }
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters!', {
        duration: 4000,
        style: {
          background: '#7F1D1D',
          color: '#FEF2F2',
          border: '2px solid #EF4444'
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(email, password);
      toast.success("Account created successfully! 🎉", {
        duration: 3000,
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #10B981'
        }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Registration failed: " + (error.message || "Please check your details"), {
        duration: 4000,
        style: {
          background: '#7F1D1D',
          color: '#FEF2F2',
          border: '2px solid #EF4444'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Google OAuth sign-up
   */
  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      toast.success("Account created with Google! 🎉", {
        duration: 3000,
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #10B981'
        }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-up failed", {
        duration: 4000,
        style: {
          background: '#7F1D1D',
          color: '#FEF2F2',
          border: '2px solid #EF4444'
        }
      });
    }
  };

  // Floating icons animation variants
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
    <div className="register-page">
      {/* Background decorative elements */}
      <div className="bg-gradient-blob bg-blob-1"></div>
      <div className="bg-gradient-blob bg-blob-2"></div>
      <div className="bg-gradient-blob bg-blob-3"></div>

      {/* Floating decorative icons */}
      <motion.div 
        className="floating-icon icon-1"
        variants={floatingAnimation}
        animate="animate"
      >
        <GiPiggyBank />
      </motion.div>
      <motion.div 
        className="floating-icon icon-2"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '1s' }}
      >
        <GiTwoCoins />
      </motion.div>
      <motion.div 
        className="floating-icon icon-3"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      >
        <GiMoneyStack />
      </motion.div>
      <motion.div 
        className="floating-icon icon-4"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '0.5s' }}
      >
        <GiWallet />
      </motion.div>

      {/* Main registration card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="register-card"
      >
        {/* Header Section */}
        <div className="card-header">
          <motion.div 
            className="logo-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="logo-icon">
              <FiUserPlus />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="subtitle"
          >
            Start your journey to financial freedom
          </motion.p>
        </div>

        {/* Features highlight */}
        <motion.div 
          className="features-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="feature-item">
            <FiShield className="feature-icon" />
            <span>Secure</span>
          </div>
          <div className="feature-item">
            <GiPiggyBank className="feature-icon" />
            <span>Free</span>
          </div>
          <div className="feature-item">
            <FiCheckCircle className="feature-icon" />
            <span>Easy</span>
          </div>
        </motion.div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Email Field */}
          <motion.div 
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <FiMail />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="you@example.com"
              />
            </div>
          </motion.div>

          {/* Password Fields Row */}
          <motion.div 
            className="form-row"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <FiLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
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

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <FiLock />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`form-input ${confirmPassword ? (passwordsMatch ? 'match' : 'no-match') : ''}`}
                  placeholder="Repeat password"
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
            </div>
          </motion.div>

          {/* Create Account Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="submit-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="loading-text">Creating account...</span>
            ) : (
              <>
                Create Free Account <FiArrowRight className="btn-icon" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <motion.div 
            className="divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span>or sign up with</span>
          </motion.div>

          {/* Google Sign-Up Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignUp}
            className="google-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FcGoogle className="google-icon" />
            <span>Sign up with Google</span>
          </motion.button>
        </form>

        {/* Footer - Login Link */}
        <motion.div 
          className="card-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>

      <style>{`
        .register-page {
          min-height: 100vh;
          background: #0B0F1A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
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
          left: -10%;
          width: 40%;
          height: 40%;
          background: rgba(139, 92, 246, 0.15);
        }

        .bg-blob-2 {
          bottom: -15%;
          right: -10%;
          width: 45%;
          height: 45%;
          background: rgba(16, 185, 129, 0.12);
        }

        .bg-blob-3 {
          top: 50%;
          right: 20%;
          width: 30%;
          height: 30%;
          background: rgba(59, 130, 246, 0.08);
        }

        /* Floating icons */
        .floating-icon {
          position: absolute;
          font-size: 3rem;
          opacity: 0.15;
          color: #8B5CF6;
          pointer-events: none;
        }

        .icon-1 {
          top: 10%;
          left: 8%;
        }

        .icon-2 {
          top: 20%;
          right: 12%;
          color: #10B981;
        }

        .icon-3 {
          bottom: 15%;
          left: 12%;
          color: #3B82F6;
        }

        .icon-4 {
          bottom: 25%;
          right: 8%;
          color: #F59E0B;
        }

        /* Registration card */
        .register-card {
          width: 100%;
          max-width: 650px;
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
          margin-bottom: 2rem;
        }

        .logo-container {
          display: inline-block;
          margin-bottom: 1.75rem;
        }

        .logo-icon {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          color: white;
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.35);
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
          font-size: 1.15rem;
          margin: 0;
          font-weight: 500;
        }

        /* Features row */
        .features-row {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-bottom: 2.5rem;
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #94A3B8;
          font-size: 1rem;
          font-weight: 600;
        }

        .feature-icon {
          color: #10B981;
          font-size: 1.3rem;
        }

        /* Form */
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-left: 0.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.35rem;
          color: #64748B;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          transition: color 0.3s;
        }

        .input-wrapper:focus-within .input-icon {
          color: #8B5CF6;
        }

        .form-input {
          width: 100%;
          padding: 1.2rem 1.25rem 1.2rem 3.75rem;
          background: rgba(11, 15, 26, 0.7);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.15rem;
          color: white;
          font-size: 1.05rem;
          font-weight: 500;
          transition: all 0.3s;
        }

        .form-input::placeholder {
          color: #475569;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
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
          right: 1rem;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          padding: 0.75rem;
          transition: color 0.3s;
        }

        .toggle-password:hover {
          color: #8B5CF6;
        }

        /* Password strength indicator */
        .password-strength {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.75rem;
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
          margin-top: 0.75rem;
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
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
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
          box-shadow: 0 12px 35px rgba(139, 92, 246, 0.3);
          margin-top: 0.75rem;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 18px 45px rgba(139, 92, 246, 0.4);
          transform: translateY(-2px);
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
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Google button */
        .google-btn {
          width: 100%;
          padding: 1.2rem 2rem;
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

        /* Footer */
        .card-footer {
          text-align: center;
          margin-top: 2.25rem;
          padding-top: 2.25rem;
          border-top: 2px solid rgba(255, 255, 255, 0.06);
        }

        .card-footer p {
          color: #94A3B8;
          font-size: 1.1rem;
          margin: 0;
        }

        .login-link {
          color: #8B5CF6;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.3s;
        }

        .login-link:hover {
          color: #A78BFA;
        }

        /* Responsive */
        @media (max-width: 700px) {
          .register-page {
            padding: 1.5rem;
          }

          .register-card {
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

          .form-row {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .form-input {
            padding: 1.1rem 1.25rem 1.1rem 3.5rem;
            font-size: 1rem;
          }

          .input-icon {
            left: 1.25rem;
            font-size: 1.2rem;
          }

          .submit-btn, .google-btn {
            padding: 1.1rem 1.5rem;
            font-size: 1.05rem;
          }

          .features-row {
            gap: 1.5rem;
            flex-wrap: wrap;
            justify-content: center;
          }

          .floating-icon {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
