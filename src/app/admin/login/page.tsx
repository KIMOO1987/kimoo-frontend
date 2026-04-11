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
    <div className="relative min-h-screen bg-[#030407] flex items-center justify-center p-4 md:p-6 text-white font-sans overflow-hidden">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md p-10 md:p-12 border border-white/[0.08] rounded-[2.5rem] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <ShieldCheck className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" size={32} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-2 drop-shadow-md">
              KIMOO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CONSOLE</span>
            </h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Secure Terminal Access</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <input 
              type="email" 
              placeholder="Admin Email"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-5 py-4 text-xs font-mono font-bold outline-none focus:border-blue-500/50 hover:border-white/20 transition-all placeholder:text-zinc-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-5 py-4 text-xs font-mono font-bold outline-none focus:border-blue-500/50 hover:border-white/20 transition-all placeholder:text-zinc-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-400 text-[10px] font-black uppercase text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl shadow-lg">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 mt-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 ${
                loading 
                  ? 'bg-white/[0.05] border border-white/5 text-zinc-500 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]'
              }`}
            >
              {loading ? <Loader2 className="animate-spin text-blue-200" size={18} /> : "Authorize Entry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
