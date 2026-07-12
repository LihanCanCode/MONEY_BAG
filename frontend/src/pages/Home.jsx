import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogIn,
  FiPieChart,
  FiShield,
  FiTrendingUp,
  FiUserPlus,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

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

const marketSignals = [
  { label: 'Monthly surplus', value: '+18.4%', trend: 'above plan' },
  { label: 'Runway', value: '9.7 mo', trend: 'stable' },
  { label: 'Goal velocity', value: '72%', trend: 'on pace' },
];

const deskRows = [
  ['Dining', 'BDT 12,840', '-7.2%'],
  ['Income', 'BDT 86,000', '+12.6%'],
  ['Savings', 'BDT 24,500', '+18.0%'],
  ['Bills', 'BDT 18,210', '-2.4%'],
];

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

  const passwordScore = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const passwordsMatch = confirmPassword && password === confirmPassword;

  const handleAuth = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading(activeTab === 'signin' ? 'Opening your desk...' : 'Preparing your account...');

    try {
      if (activeTab === 'signin') {
        await loginUser(email, password);
        toast.success('Welcome back.', { id: toastId });
      } else {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match.', { id: toastId });
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error('Password must be at least 6 characters.', { id: toastId });
          setIsLoading(false);
          return;
        }

        await registerUser(email, password);
        toast.success('Your portfolio desk is ready.', { id: toastId });
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error.code), { id: toastId, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const toastId = toast.loading('Connecting securely...');

    try {
      await signInWithGoogle();
      toast.success('Signed in with Google.', { id: toastId });
      navigate('/dashboard');
    } catch {
      toast.error('Google sign-in failed.', { id: toastId });
    }
  };

  return (
    <div className="atelier-home">
      <nav className="atelier-nav">
        <Link to="/" className="atelier-brand" aria-label="MoneyBag home">
          <span className="atelier-mark">MB</span>
          <span>
            Money<span>Bag</span>
          </span>
        </Link>
        <div className="atelier-nav-actions">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={activeTab === 'signin' ? 'is-active' : ''}
          >
            <FiLogIn />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={activeTab === 'signup' ? 'is-active primary' : 'primary'}
          >
            <FiUserPlus />
            Join
          </button>
        </div>
      </nav>

      <main className="atelier-shell">
        <section className="atelier-copy">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
            Private money cockpit
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            MoneyBag
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lede">
            A polished personal finance desk for budgets, goals, debts, recurring spends, and the small decisions that quietly compound.
          </motion.p>

          <motion.div className="signal-grid" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            {marketSignals.map((signal) => (
              <div className="signal-card" key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <small>{signal.trend}</small>
              </div>
            ))}
          </motion.div>

          <div className="atelier-proof">
            <span><FiShield /> Bank-grade auth flow</span>
            <span><FiPieChart /> Decision-ready views</span>
            <span><FiTrendingUp /> Goal-first tracking</span>
          </div>
        </section>

        <motion.section
          className="portfolio-board"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="board-topline">
            <span>July portfolio</span>
            <span className="live-pill">Live</span>
          </div>
          <div className="board-balance">
            <span>Available balance</span>
            <strong>BDT 142,680</strong>
          </div>
          <div className="board-chart" aria-hidden="true">
            <span style={{ height: '42%' }} />
            <span style={{ height: '64%' }} />
            <span style={{ height: '51%' }} />
            <span style={{ height: '78%' }} />
            <span style={{ height: '58%' }} />
            <span style={{ height: '88%' }} />
            <span style={{ height: '72%' }} />
          </div>
          <div className="board-table">
            {deskRows.map(([name, amount, delta]) => (
              <div className="board-row" key={name}>
                <span>{name}</span>
                <strong>{amount}</strong>
                <em className={delta.startsWith('+') ? 'up' : 'down'}>{delta}</em>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="atelier-auth"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="auth-heading">
            <span><FiLock /> Secure access</span>
            <h2>{activeTab === 'signin' ? 'Return to your desk' : 'Create your desk'}</h2>
            <p>{activeTab === 'signin' ? 'Sign in to review your current money position.' : 'Start with a clean, focused finance command center.'}</p>
          </div>

          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button type="button" onClick={() => setActiveTab('signin')} className={activeTab === 'signin' ? 'active' : ''}>
              Sign in
            </button>
            <button type="button" onClick={() => setActiveTab('signup')} className={activeTab === 'signup' ? 'active' : ''}>
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth} className="atelier-form">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="form-stack"
              >
                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label>
                  <span>Password</span>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={activeTab === 'signin' ? 'Enter password' : 'Minimum 6 characters'}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                {activeTab === 'signup' && (
                  <>
                    <div className="strength-meter">
                      {[1, 2, 3, 4].map((level) => (
                        <span key={level} className={passwordScore >= level ? 'filled' : ''} />
                      ))}
                    </div>
                    <label>
                      <span>Confirm password</span>
                      <div className="password-field">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Repeat password"
                          required
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label="Toggle confirm password visibility">
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <small className={passwordsMatch ? 'match' : 'mismatch'}>
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </small>
                      )}
                    </label>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? 'Please wait...' : activeTab === 'signin' ? 'Enter MoneyBag' : 'Create account'}
              {!isLoading && <FiArrowRight />}
            </button>

            <button type="button" onClick={handleGoogleSignIn} className="google-submit">
              <FcGoogle />
              Continue with Google
            </button>
          </form>

          <div className="auth-note">
            <FiCheckCircle />
            Encrypted login, focused workspace, no visual clutter.
          </div>
        </motion.section>
      </main>

      <style>{`
        .atelier-home {
          min-height: 100vh;
          color: #f5f1e8;
          background:
            radial-gradient(circle at 8% 12%, rgba(198, 167, 104, 0.16), transparent 28%),
            radial-gradient(circle at 86% 6%, rgba(68, 105, 95, 0.18), transparent 30%),
            linear-gradient(135deg, #090b0d 0%, #11140f 46%, #19150f 100%);
          position: relative;
          overflow: hidden;
        }

        .atelier-home::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.85), transparent 88%);
          pointer-events: none;
        }

        .atelier-nav {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px clamp(20px, 4vw, 64px);
        }

        .atelier-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #fff8e8;
          font-weight: 800;
          font-size: 1.05rem;
        }

        .atelier-brand span span {
          color: #d6b46d;
        }

        .atelier-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214, 180, 109, 0.55);
          background: linear-gradient(145deg, rgba(214,180,109,0.24), rgba(255,255,255,0.05));
          color: #f8df9d;
          border-radius: 8px;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
        }

        .atelier-nav-actions,
        .auth-switch {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .atelier-nav-actions button,
        .auth-switch button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: #d8d2c4;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .atelier-nav-actions button.is-active,
        .auth-switch button.active {
          color: #fff8e8;
          border-color: rgba(214,180,109,0.45);
          background: rgba(214,180,109,0.12);
        }

        .atelier-nav-actions .primary {
          background: #d6b46d;
          color: #12100b;
          border-color: #d6b46d;
        }

        .atelier-shell {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.75fr) minmax(340px, 0.72fr);
          gap: clamp(20px, 3vw, 34px);
          align-items: center;
          padding: clamp(24px, 4vw, 58px) clamp(20px, 4vw, 64px) 56px;
        }

        .atelier-copy h1 {
          font-size: clamp(4rem, 9vw, 8.4rem);
          line-height: 0.88;
          letter-spacing: 0;
          color: #fff9e8;
          margin: 0 0 28px;
        }

        .eyebrow,
        .auth-heading span {
          color: #d6b46d;
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        .lede {
          max-width: 680px;
          color: #b8b0a0;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          line-height: 1.8;
          margin-bottom: 28px;
        }

        .signal-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          max-width: 700px;
        }

        .signal-card,
        .portfolio-board,
        .atelier-auth {
          border: 1px solid rgba(255,255,255,0.11);
          background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035));
          box-shadow: 0 28px 80px rgba(0,0,0,0.36);
          backdrop-filter: blur(22px);
          border-radius: 8px;
        }

        .signal-card {
          padding: 16px;
        }

        .signal-card span,
        .board-topline,
        .board-row span,
        .board-balance span {
          color: #948b7d;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .signal-card strong {
          display: block;
          color: #fff6df;
          font-size: 1.45rem;
          margin: 10px 0 2px;
        }

        .signal-card small {
          color: #9ac4a4;
          font-weight: 700;
        }

        .atelier-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
          color: #c9c0b1;
          font-weight: 700;
        }

        .atelier-proof span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .portfolio-board {
          padding: 22px;
          min-height: 520px;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .board-topline,
        .board-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .live-pill {
          color: #12100b;
          background: #d6b46d;
          padding: 5px 9px;
          border-radius: 6px;
        }

        .board-balance strong {
          display: block;
          margin-top: 10px;
          font-size: clamp(2.2rem, 4vw, 3.4rem);
          color: #fff6df;
          line-height: 1;
        }

        .board-chart {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          align-items: end;
          gap: 9px;
          height: 180px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .board-chart span {
          display: block;
          border-radius: 6px 6px 0 0;
          background: linear-gradient(180deg, #e6c983, #466d62);
        }

        .board-table {
          display: grid;
          gap: 10px;
        }

        .board-row {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .board-row strong {
          color: #f7ecd5;
        }

        .board-row em {
          font-style: normal;
          font-weight: 900;
          font-size: 0.82rem;
        }

        .board-row em.up {
          color: #93caa1;
        }

        .board-row em.down {
          color: #d8907b;
        }

        .atelier-auth {
          padding: clamp(22px, 3vw, 34px);
        }

        .auth-heading span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .auth-heading h2 {
          margin: 14px 0 8px;
          color: #fff6df;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
        }

        .auth-heading p,
        .auth-note {
          color: #a9a092;
          line-height: 1.6;
        }

        .auth-switch {
          background: rgba(0,0,0,0.22);
          padding: 6px;
          margin: 24px 0;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
        }

        .auth-switch button {
          flex: 1;
          border: 0;
        }

        .atelier-form,
        .form-stack {
          display: grid;
          gap: 16px;
        }

        .atelier-form label {
          display: grid;
          gap: 8px;
          color: #ded6c5;
          font-weight: 800;
          font-size: 0.86rem;
        }

        .atelier-form input {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(0,0,0,0.28);
          color: #fff6df;
          border-radius: 8px;
          padding: 14px 14px;
          font-size: 1rem;
          outline: none;
        }

        .atelier-form input:focus {
          border-color: rgba(214,180,109,0.7);
          box-shadow: 0 0 0 3px rgba(214,180,109,0.13);
        }

        .password-field {
          position: relative;
        }

        .password-field input {
          padding-right: 48px;
        }

        .password-field button {
          position: absolute;
          right: 7px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          color: #d6b46d;
          background: transparent;
          cursor: pointer;
        }

        .strength-meter {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
        }

        .strength-meter span {
          height: 5px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
        }

        .strength-meter span.filled {
          background: #d6b46d;
        }

        small.match {
          color: #93caa1;
        }

        small.mismatch {
          color: #e49a84;
        }

        .auth-submit,
        .google-submit {
          min-height: 52px;
          border: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .auth-submit {
          background: #d6b46d;
          color: #11100d;
          margin-top: 6px;
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .google-submit {
          background: rgba(255,255,255,0.06);
          color: #fff7e5;
          border: 1px solid rgba(255,255,255,0.11);
        }

        .google-submit svg {
          font-size: 1.35rem;
        }

        .auth-note {
          margin-top: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
        }

        @media (max-width: 1180px) {
          .atelier-shell {
            grid-template-columns: 1fr 0.82fr;
          }

          .portfolio-board {
            display: none;
          }
        }

        @media (max-width: 820px) {
          .atelier-shell {
            grid-template-columns: 1fr;
          }

          .atelier-nav {
            gap: 18px;
            align-items: flex-start;
          }

          .signal-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .atelier-nav {
            flex-direction: column;
          }

          .atelier-nav-actions {
            width: 100%;
          }

          .atelier-nav-actions button {
            flex: 1;
          }

          .atelier-copy h1 {
            font-size: 3.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
