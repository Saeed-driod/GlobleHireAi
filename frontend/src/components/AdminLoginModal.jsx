import React, { useState } from 'react';
import { X, Lock, Key, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { setAdminKey, verifyAdminCredentials } from '../api';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setError('Please enter your secret Admin API Key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyAdminCredentials(cleanKey);
      setAdminKey(cleanKey);
      setKeyInput('');
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid admin credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-[#11231C] border border-black/[0.08] dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl text-[#17261F] dark:text-[#E2E8E4]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[#57685E] dark:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81]/20 text-[#00DF81] flex items-center justify-center mx-auto mb-4 shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-[#17261F] dark:text-white">GlobalHire AI Admin</h3>
          <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-1">
            Enter authorized X-Admin-Key to access private dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#3D4D43] dark:text-slate-300 block mb-1.5">
              Admin API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#8C9B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="password"
                placeholder="Enter ADMIN_API_KEY..."
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setError('');
                }}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.06] dark:border-white/10 text-xs font-semibold text-[#17261F] dark:text-white placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81]"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[11px] flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81] hover:bg-[#12382B] dark:hover:bg-[#2EF8A0] text-[#00DF81] dark:text-[#0A241B] text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Key...</span>
              </>
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[10px] text-[#8C9B92] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00DF81]" />
            Protected with server-side API Key validation
          </p>
        </div>
      </div>
    </div>
  );
}
