/**
 * @fileoverview User Registration Page Component
 * 
 * Modern registration interface with:
 * - Email and password registration
 * - Password confirmation validation
 * - Password visibility toggles
 * - Loading states during registration
 * - Toast notifications for user feedback
 * - Animated entrance effects
 * - Responsive dark-themed design
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * Register Component
 * 
 * Provides user registration functionality with comprehensive form validation.
 * Features:
 * - Email/password account creation
 * - Password confirmation matching
 * - Toggle password visibility for both fields
 * - Loading state during submission
 * - Toast notifications for success/error feedback
 * - Smooth animations and transitions
 * - Dark, modern aesthetic design
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
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle registration form submission
   * 
   * Validates password match and creates new user account.
   * Shows appropriate feedback and redirects on success.
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password confirmation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(email, password);
      toast.success("Account created successfully!");
      navigate("/dashboard"); // Redirect to dashboard after successful registration
    } catch (error) {
      toast.error("Registration failed: " + (error.message || "Please check your details"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* ==========================================
          BACKGROUND DECORATIVE ELEMENTS
          Gradient blobs for visual interest
          ========================================== */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* ==========================================
          REGISTRATION CARD - Animated entrance
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-[#141B2D]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative">
          
          {/* ==========================================
              HEADER SECTION
              ========================================== */}
          <div className="flex flex-col items-center mb-10">
            {/* Icon container with gradient background */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
              <FiUserPlus className="text-white" size={32} />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-3 text-center">Create Your Account</h2>
            <p className="text-slate-400 font-medium">Start your journey to financial freedom</p>
          </div>

          {/* ==========================================
              REGISTRATION FORM
              ========================================== */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              
              {/* ==========================================
                  EMAIL INPUT FIELD
                  ========================================== */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Email Address</label>
                <div className="relative group">
                  {/* Mail icon that changes color on focus */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-slate-600 transition-all font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* ==========================================
                  PASSWORD FIELDS ROW - Side by side on desktop
                  ========================================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PASSWORD FIELD */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Password</label>
                  <div className="relative group">
                    {/* Lock icon that changes color on focus */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-slate-600 transition-all font-medium text-sm"
                      placeholder="Min. 8 chars"
                    />
                    {/* Toggle password visibility button */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD FIELD */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Confirm</label>
                  <div className="relative group">
                    {/* Lock icon that changes color on focus */}
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-slate-600 transition-all font-medium text-sm"
                      placeholder="Repeat password"
                    />
                    {/* Toggle confirm password visibility button */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SUBMIT BUTTON - With loading state
                ========================================== */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
            >
              {isLoading ? 'Creating account...' : (
                <>
                  Create Free Account <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* ==========================================
              FOOTER - Link to login page
              ========================================== */}
          <div className="mt-10 text-center text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
