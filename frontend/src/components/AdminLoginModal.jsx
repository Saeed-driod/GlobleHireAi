import React, { useState } from 'react';
import { X, Lock, Key, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default admin secret password / PIN
    if (password === 'admin123' || password === '1234' || password === 'globalhire') {
      sessionStorage.setItem('globalhire_admin_auth', 'true');
      setError('');
      setPassword('');
      onLoginSuccess();
    } else {
      setError('Invalid admin credentials. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-sm bg-white border border-black/[0.08] rounded-[32px] p-6 sm:p-8 shadow-2xl text-[#17261F]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#F4F6F2] hover:bg-slate-200 text-[#57685E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#0A241B] text-[#00DF81] flex items-center justify-center mx-auto mb-4 shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-[#17261F]">Admin Portal Access</h3>
          <p className="text-xs text-[#6C7A72] mt-1">
            Restricted to GlobalHire AI administrators
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#3D4D43] block mb-1.5">
              Admin Password / PIN
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#8C9B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="password"
                placeholder="Enter password (default: admin123)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.06] text-xs font-semibold text-[#17261F] placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81]"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-[#0A241B] hover:bg-[#12382B] text-[#00DF81] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[10px] text-center text-[#8C9B92] font-mono mt-4">
          Default Key: <strong className="text-[#0A5734]">admin123</strong>
        </p>
      </div>
    </div>
  );
}

