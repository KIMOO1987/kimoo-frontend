"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Sign out any existing "user" session to clear the cache
    await supabase.auth.signOut();

    // 2. Log in specifically for Admin access
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // 3. HARD REDIRECT to bypass any Next.js client-side state
      window.location.href = '/admin/payments';
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#05070a] text-white">
      <div className="w-full max-w-md p-10 border border-white/5 rounded-[40px] bg-white/[0.01] backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <ShieldCheck className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">KIMOO <span className="text-blue-500 text-sm not-italic ml-1">ADMIN</span></h1>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Secure Terminal Access</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Admin Email"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Authorize Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
