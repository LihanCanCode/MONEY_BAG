import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    try {
      await registerUser(email, password);
      alert("Registered successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error('Registration error:', error);
      alert("Please provide a valid email and password");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative w-full max-w-lg">
          {/* Decorative text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
            <h1 className="text-5xl font-bold mb-4 text-center">Join Event League</h1>
            <p className="text-lg text-center text-white/90 px-8">
              Create your account and start organizing or participating
              <br />
              in amazing events
            </p>
          </div>
          
          {/* Illustration Container */}
          <div className="relative opacity-40">
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
              <ellipse cx="180" cy="160" rx="25" ry="28" fill="#1e3a5f"/>
              <rect x="155" y="185" width="50" height="40" rx="5" fill="#1e3a5f"/>
              <ellipse cx="180" cy="130" rx="20" ry="22" fill="#d4a574"/>
              <ellipse cx="165" cy="125" rx="15" ry="18" fill="#2d2d2d"/>
              <circle cx="175" cy="135" r="2" fill="#2d2d2d"/>
              <path d="M 165,145 Q 175,148 180,145" stroke="#c47b5a" strokeWidth="2" fill="none"/>
              <rect x="155" y="160" width="15" height="35" rx="7" fill="#f4a460"/>
              <rect x="190" y="175" width="15" height="25" rx="7" fill="#f4a460"/>
              
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
                <text x="60" y="80" textAnchor="middle" fontSize="8" fill="#666">username@gmai</text>
                <rect x="30" y="90" width="60" height="8" rx="2" fill="#e5e7eb"/>
              </g>
              
              {/* User icon floating */}
              <circle cx="380" cy="180" r="25" fill="white" opacity="0.9"/>
              <circle cx="380" cy="175" r="8" fill="#9ca3af"/>
              <path d="M 365,195 Q 380,185 395,195" fill="#9ca3af"/>
              
              {/* Decorative asterisk */}
              <g transform="translate(360, 220)">
                <text fontSize="24" fill="white">✱</text>
              </g>
              
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.2"/>
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500">Choose your role and join our community</p>
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
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="Enter your email"
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="Enter your password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-600 transition duration-200 font-semibold text-lg mt-6"
            >
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
