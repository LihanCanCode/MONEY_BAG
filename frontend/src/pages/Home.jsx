import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast, { Toaster } from 'react-hot-toast';

const Home = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loginUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Signing in...');
    try {
      await loginUser(email, password);
      toast.success("Login successful! 🎉", { id: toastId });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Login failed: " + (error.message || "Please try again"), { id: toastId });
    }
  };

  const handleGoogleSignIn = async () => {
    const toastId = toast.loading('Signing in with Google...');
    try {
      await signInWithGoogle();
      toast.success("Google sign-in successful! 🎉", { id: toastId });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google sign-in failed: " + (error.message || "Please try again"), { id: toastId });
    }
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4 font-sans text-[#E5E7EB]">

        <div className="w-full max-w-md w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#141B2D] border border-[#1F2937] rounded-3xl shadow-xl p-8 md:p-10"
          >
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">💰</div>
              <h1 className="text-3xl font-bold font-outfit text-white tracking-tight mb-2">
                Money Bag
              </h1>
              <p className="text-[#9CA3AF]">
                {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
              </p>
            </div>

            {/* Tab Buttons */}
            <div className="flex bg-[#0B0F1A] p-1 rounded-xl mb-8 border border-[#1F2937]">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'signin'
                  ? 'bg-[#141B2D] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'signup'
                  ? 'bg-[#141B2D] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
                  }`}
              >
                Sign Up
              </button>
            </div>

            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-[#0B0F1A] border border-[#1F2937] rounded-xl text-white placeholder-[#4B5563] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-[#0B0F1A] border border-[#1F2937] rounded-xl text-white placeholder-[#4B5563] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-white"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-[#9CA3AF]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#374151] bg-[#0B0F1A] text-[#4F46E5] focus:ring-offset-[#111827]"
                    />
                    Remember me
                  </label>
                  <a href="#" className="text-[#4F46E5] hover:text-indigo-400 font-medium">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  Sign In
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1F2937]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#141B2D] text-[#6B7280]">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-[#1F2937] hover:bg-[#374151] text-white border border-[#374151] py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
                >
                  <FcGoogle className="text-xl" />
                  Google
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#9CA3AF] mb-6">Join us to manage your finance smarter.</p>
                <button
                  onClick={handleSignUp}
                  className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  Create Account
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Home;
