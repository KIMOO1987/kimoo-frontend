"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // 2. Supabase Update Call
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data) {
      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting...' });
      // Optional: Redirect to login or dashboard after 2 seconds
      setTimeout(() => window.location.href = '/login', 2000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Reset <span className="text-blue-500">Security</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
            Enter your new credentials below
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* New Password Field */}
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase ml-2 tracking-widest">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-[8px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Confirm Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
              required
            />
          </div>

          {/* Message Feedback */}
          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-3 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </motion.div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase italic tracking-tighter shadow-[0_0_30px_rgba(37,99,235,0.2)]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Update Account Access"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-600 text-[9px] font-bold uppercase tracking-[0.2em]">
          KIMOO CRT Security Protocol v2.0
        </p>
      </motion.div>
    </div>
  );
}