import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Key, AlertCircle, Info, X, Check } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BrandLogo } from '../../components/BrandLogo';
import { useStore } from '../../context/StoreContext';
import { MASTER_ADMIN_UID } from '../../services/firebaseConfig';

interface AdminLoginProps {
  defaultError?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ defaultError }) => {
  const { login, resetPassword, error: authError, clearError } = useAdminAuth();
  const { showToast, navigateTo } = useStore();

  const [email, setEmail] = useState('daniyalqasmi5327@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(defaultError || null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Authenticate strictly with Firebase Authentication
      const result = await login(email.trim(), password);

      if (result.success) {
        showToast('Successfully authenticated as Administrator');
        navigateTo('admin');
      } else {
        setLocalError(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotSuccess('');

    const res = await resetPassword(forgotEmail || email);
    if (res.success) {
      setForgotSuccess(res.message);
      showToast(res.message, 'success');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess('');
      }, 3000);
    } else {
      showToast(res.message, 'error');
    }
    setForgotLoading(false);
  };

  const activeErrorMessage = localError || authError;

  return (
    <div className="w-full min-h-screen bg-[#111111] text-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-[#D4AF37]/40 shadow-2xl rounded-sm p-8 sm:p-10 relative overflow-hidden">
        {/* Decorative gold accent header line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006B5B] via-[#D4AF37] to-[#01453D]" />

        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <BrandLogo variant="light" size="lg" />
          <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] mt-3 font-semibold">
            Restricted Atelier Portal (/admin)
          </span>
          <span className="text-[11px] text-neutral-400 mt-1">
            Protected by Firebase Authentication
          </span>
        </div>

        {/* Security badge and master admin identifier */}
        <div className="mb-6 p-3 bg-[#01453D]/40 border border-[#D4AF37]/40 rounded text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Firebase Role-Based Security</span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
            Zero password storage. Passwords are mathematically hashed and validated exclusively by Firebase Authentication.
          </p>
        </div>

        {/* Error notification banner */}
        {activeErrorMessage && (
          <div className="mb-6 p-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs rounded flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{activeErrorMessage}</div>
            <button
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-rose-400 hover:text-rose-200 text-xs"
            >
              ×
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (activeErrorMessage) {
                    setLocalError(null);
                    clearError();
                  }
                }}
                placeholder="admin@emeraldhaya.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-3 py-3 text-xs bg-neutral-800 border border-neutral-700 text-white rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (activeErrorMessage) {
                    setLocalError(null);
                    clearError();
                  }
                }}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3 py-3 text-xs bg-neutral-800 border border-neutral-700 text-white rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#006B5B] hover:bg-[#01453D] text-white text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow border border-[#D4AF37]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Authenticating with Firebase...</span>
            ) : (
              <>
                <span>Sign In to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </>
            )}
          </button>
        </form>

        {/* First Time Admin Setup Guide Accordion */}
        <div className="mt-6 pt-5 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="w-full py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors border border-neutral-700/80 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{showSetupGuide ? 'Hide First Admin Setup Guide' : 'First Time Setup / Firebase Account Info'}</span>
          </button>

          {showSetupGuide && (
            <div className="mt-3 p-4 bg-neutral-950/90 border border-neutral-800 rounded text-[11px] text-neutral-300 space-y-2.5 animate-fade-in">
              <div className="font-semibold text-[#D4AF37] uppercase tracking-wider text-[10px]">
                Firebase Admin Registration:
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
                <li>
                  Open your <strong className="text-white">Firebase Console</strong> (<span className="text-[#D4AF37] font-mono">emeraldhaya-e01cb</span>).
                </li>
                <li>
                  Go to <strong className="text-white">Authentication &gt; Users &gt; Add User</strong>.
                </li>
                <li>
                  Create user with email <strong className="text-white font-mono">daniyalqasmi5327@gmail.com</strong> (or your desired email) and set a secure password.
                </li>
                <li>
                  Upon signing in here, our security system automatically validates and links the profile in the Firestore <strong className="text-white font-mono">/admins</strong> collection with <strong className="text-emerald-400 font-mono">role: "admin"</strong>.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Exit to Public Storefront */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-neutral-400 hover:text-[#D4AF37] transition-colors underline cursor-pointer"
          >
            Return to Public Boutique Storefront
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-[#D4AF37] rounded p-6 relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess('');
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#D4AF37]" />
              Reset Administrator Password
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Enter your registered administrator email to receive a secure Firebase password reset link.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs rounded flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@emeraldhaya.com"
                  required
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 text-white rounded focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2 bg-[#006B5B] hover:bg-[#01453D] text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Password Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
