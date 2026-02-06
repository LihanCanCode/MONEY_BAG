import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUserPlus, FiLogIn } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

const Home = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, registerUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
        await registerUser(email, password);
        toast.success("Account created successfully! 🚀", { id: toastId });
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Authentication failed. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const toastId = toast.loading('Connecting to Google...');
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google! 🎉", { id: toastId });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-in failed", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-[#141B2D]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl p-8 md:p-12 relative"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6 text-4xl"
            >
              💰
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-3">Money Bag</h1>
            <p className="text-slate-400 font-medium">Smart AI-Powered Financial Tracking</p>
          </div>

          {/* Custom Tabs */}
          <div className="flex bg-[#0B0F1A]/80 p-1.5 rounded-2xl mb-10 border border-white/5 relative">
            <motion.div
              layout
              className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-xl shadow-lg ring-1 ring-white/10"
              animate={{ x: activeTab === 'signin' ? '0%' : '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'signin' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'signup' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'signin' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === 'signin' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Email address */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative group">
                    <FiMail className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-14 pr-4 py-4 md:py-5 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Password</label>
                    {activeTab === 'signin' && (
                      <a href="#" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot?</a>
                    )}
                  </div>
                  <div className="relative group">
                    <FiLock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full pl-14 pr-14 py-4 md:py-5 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field (SignUp Only) */}
                {activeTab === 'signup' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-3"
                  >
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                    <div className="relative group">
                      <FiLock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" size={20} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        required
                        className="w-full pl-14 pr-4 py-4 md:py-5 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-fuchsia-500/50 outline-none transition-all font-medium"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Auth Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 ${activeTab === 'signin'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-indigo-600/20'
                : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white shadow-fuchsia-600/20'}`}
            >
              {activeTab === 'signin' ? (
                <>Sign In Now <FiLogIn size={22} /></>
              ) : (
                <>Get Started <FiUserPlus size={22} /></>
              )}
            </button>

            {/* Google Authentication */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-6 bg-[#141B2D] text-slate-500 font-black uppercase tracking-[0.4em]">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-[#0B0F1A]/60 border border-white/10 text-white py-5 rounded-2xl font-black transition-all hover:bg-[#0B0F1A] hover:border-white/20 flex items-center justify-center gap-4 group"
            >
              <FcGoogle className="text-2xl group-hover:scale-125 transition-transform" />
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Feature Badge */}
          <div className="mt-12 flex justify-center">
            <div className="px-6 py-2.5 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encryption Included</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
