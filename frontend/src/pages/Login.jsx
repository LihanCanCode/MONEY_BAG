/**
 * @fileoverview Login Page Component
 * 
 * Modern, dark-themed authentication interface with:
 * - Email/password login form
 * - Google OAuth sign-in option
 * - Password visibility toggle
 * - Animated entrance effects
 * - Responsive design
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GiTwoCoins, GiWallet, GiMoneyStack } from 'react-icons/gi';
import toast from 'react-hot-toast';

/**
 * Login Component
 * 
 * Full-featured login page with modern dark aesthetic
 * Features animated elements and smooth transitions
 * 
 * @returns {JSX.Element} Login page component
 */
const Login = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Authentication and navigation hooks
  const { loginUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle email/password login form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginUser(email, password);
      toast.success("Welcome back! 🎉", {
        duration: 3000,
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #10B981'
        }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Login failed: " + (error.message || "Please try again"), {
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
   * Handle Google OAuth sign-in
   */
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Google sign-in successful! 🎉", {
        duration: 3000,
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #10B981'
        }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-in failed", {
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
    <div className="login-page">
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
        <GiTwoCoins />
      </motion.div>
      <motion.div 
        className="floating-icon icon-2"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '1s' }}
      >
        <GiWallet />
      </motion.div>
      <motion.div 
        className="floating-icon icon-3"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: '2s' }}
      >
        <GiMoneyStack />
      </motion.div>

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card"
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
              <FiLogIn />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome Back!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="subtitle"
          >
            Sign in to continue managing your finances
          </motion.p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
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

          {/* Password Field */}
          <motion.div 
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
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
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </motion.div>

          {/* Forgot Password Link */}
          <motion.div 
            className="forgot-password"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <a href="#">Forgot password?</a>
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="submit-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <span className="loading-text">Signing in...</span>
            ) : (
              <>
                Sign In <FiArrowRight className="btn-icon" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <motion.div 
            className="divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span>or continue with</span>
          </motion.div>

          {/* Google Sign-In Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FcGoogle className="google-icon" />
            <span>Sign in with Google</span>
          </motion.button>
        </form>

        {/* Footer - Registration Link */}
        <motion.div 
          className="card-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Create one now
            </Link>
          </p>
        </motion.div>
      </motion.div>

      <style>{`
        .login-page {
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
          right: -10%;
          width: 40%;
          height: 40%;
          background: rgba(16, 185, 129, 0.15);
        }

        .bg-blob-2 {
          bottom: -15%;
          left: -10%;
          width: 45%;
          height: 45%;
          background: rgba(59, 130, 246, 0.12);
        }

        .bg-blob-3 {
          top: 40%;
          left: 30%;
          width: 30%;
          height: 30%;
          background: rgba(139, 92, 246, 0.08);
        }

        /* Floating icons */
        .floating-icon {
          position: absolute;
          font-size: 3rem;
          opacity: 0.15;
          color: #10B981;
          pointer-events: none;
        }

        .icon-1 {
          top: 15%;
          left: 10%;
        }

        .icon-2 {
          top: 25%;
          right: 15%;
          color: #3B82F6;
        }

        .icon-3 {
          bottom: 20%;
          left: 15%;
          color: #8B5CF6;
        }

        /* Login card */
        .login-card {
          width: 100%;
          max-width: 580px;
          background: rgba(20, 27, 45, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2.5rem;
          padding: 4rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        /* Header */
        .card-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .logo-container {
          display: inline-block;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #10B981, #059669);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          color: white;
          box-shadow: 0 15px 40px rgba(16, 185, 129, 0.35);
        }

        .card-header h1 {
          font-size: 2.75rem;
          font-weight: 800;
          color: white;
          margin: 0 0 1rem;
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: #94A3B8;
          font-size: 1.15rem;
          margin: 0;
          font-weight: 500;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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
          left: 1.5rem;
          color: #64748B;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          transition: color 0.3s;
        }

        .input-wrapper:focus-within .input-icon {
          color: #10B981;
        }

        .form-input {
          width: 100%;
          padding: 1.25rem 1.5rem 1.25rem 4rem;
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
          border-color: rgba(16, 185, 129, 0.6);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
          background: rgba(11, 15, 26, 0.9);
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
          color: #10B981;
        }

        .forgot-password {
          text-align: right;
          margin-top: -0.5rem;
        }

        .forgot-password a {
          color: #10B981;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.3s;
        }

        .forgot-password a:hover {
          color: #34D399;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 1.35rem 2rem;
          background: linear-gradient(135deg, #10B981, #059669);
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
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.3);
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 18px 45px rgba(16, 185, 129, 0.4);
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
          margin: 1rem 0;
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

        /* Footer */
        .card-footer {
          text-align: center;
          margin-top: 2.5rem;
          padding-top: 2.5rem;
          border-top: 2px solid rgba(255, 255, 255, 0.06);
        }

        .card-footer p {
          color: #94A3B8;
          font-size: 1.1rem;
          margin: 0;
        }

        .register-link {
          color: #10B981;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.3s;
        }

        .register-link:hover {
          color: #34D399;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .login-page {
            padding: 1.5rem;
          }

          .login-card {
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
            padding: 1.1rem 1.25rem 1.1rem 3.5rem;
            font-size: 1rem;
          }

          .input-icon {
            left: 1.25rem;
            font-size: 1.25rem;
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

export default Login;
