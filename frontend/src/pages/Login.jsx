import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      alert("Login successful");
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed: " + (error.message || "Please try again"));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      alert("Google sign-in successful");
      navigate("/dashboard");
    } catch (error) {
      alert("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-400 items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          {/* Illustration Container */}
          <div className="relative">
            {/* Person sitting with laptop */}
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-auto">
                {/* Decorative plant */}
                <g transform="translate(320, 280)">
                  <ellipse cx="0" cy="20" rx="25" ry="8" fill="#8B4513"/>
                  <path d="M -15,-20 Q -15,-40 -5,-50 Q 0,-55 5,-50 Q 15,-40 15,-20" fill="#2d5016"/>
                  <path d="M -10,-25 Q -8,-38 0,-42 Q 8,-38 10,-25" fill="#3d6b1f"/>
                </g>
                
                {/* Desk */}
                <rect x="80" y="280" width="180" height="15" rx="5" fill="#5a3a31"/>
                <rect x="75" y="295" width="190" height="10" rx="3" fill="#4a2a21"/>
                
                {/* Chair */}
                <rect x="140" y="200" width="80" height="100" rx="10" fill="#7d4e57"/>
                <rect x="135" y="195" width="90" height="15" rx="7" fill="#6d3e47"/>
                
                {/* Person */}
                <ellipse cx="180" cy="160" rx="25" ry="28" fill="#1e3a5f"/> {/* Body */}
                <rect x="155" y="185" width="50" height="40" rx="5" fill="#1e3a5f"/> {/* Lower body */}
                <ellipse cx="180" cy="130" rx="20" ry="22" fill="#d4a574"/> {/* Head */}
                <ellipse cx="165" cy="125" rx="15" ry="18" fill="#2d2d2d"/> {/* Hair */}
                <circle cx="175" cy="135" r="2" fill="#2d2d2d"/> {/* Eye */}
                <path d="M 165,145 Q 175,148 180,145" stroke="#c47b5a" strokeWidth="2" fill="none"/> {/* Smile */}
                <rect x="155" y="160" width="15" height="35" rx="7" fill="#f4a460"/> {/* Arm */}
                <rect x="190" y="175" width="15" height="25" rx="7" fill="#f4a460"/> {/* Arm */}
                
                {/* Laptop */}
                <rect x="165" y="190" width="50" height="35" rx="3" fill="#9ca3af"/>
                <rect x="167" y="192" width="46" height="30" rx="2" fill="#1f2937"/>
                
                {/* Login window floating */}
                <g transform="translate(240, 120)">
                  <rect x="0" y="0" width="120" height="140" rx="8" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="0" width="120" height="25" rx="8" fill="#e5e7eb"/>
                  <circle cx="10" cy="12" r="3" fill="#ef4444"/>
                  <circle cx="20" cy="12" r="3" fill="#fbbf24"/>
                  <circle cx="30" cy="12" r="3" fill="#10b981"/>
                  
                  {/* Lock icon */}
                  <rect x="50" y="45" width="20" height="25" rx="3" fill="#dc2626"/>
                  <circle cx="60" cy="42" r="8" fill="none" stroke="#dc2626" strokeWidth="3"/>
                  <text x="60" y="80" textAnchor="middle" fontSize="8" fill="#666">username@gmail</text>
                  <rect x="30" y="90" width="60" height="8" rx="2" fill="#e5e7eb"/>
                </g>
                
                {/* User icon floating */}
                <circle cx="380" cy="180" r="25" fill="white" opacity="0.9"/>
                <circle cx="380" cy="175" r="8" fill="#9ca3af"/>
                <path d="M 365,195 Q 380,185 395,195" fill="#9ca3af"/>
                
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.2"/>
                  </filter>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="multazam@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-500 transition duration-200 font-semibold text-lg"
            >
              Sign In
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-200 font-medium flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
