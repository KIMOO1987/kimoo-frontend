"use client";
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, UserCheck, Lock, Loader2, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function IndicatorAccess() {
  const { user, tier, loading } = useAuth();
  const [tvUsername, setTvUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvUsername) return;

    setIsSubmitting(true);
    
    // 1. Log the invite request to Supabase
    const { error } = await supabase
      .from('indicator_invites')
      .upsert({
        user_id: user.id,
        tv_username: tvUsername,
        status: 'PENDING',
        requested_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Error submitting request: ' + error.message);
    } else {
      toast.success('Invite Request Sent! Our bot will process it shortly.');
      setHasAccess(true);
    }
    setIsSubmitting(false);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  // Strictly Tier 2 or Tier 3 (Pro/Ultimate)
  if (tier < 2) {
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10">
          <Lock size={60} className="mx-auto mb-6 text-zinc-700" />
          <h2 className="text-3xl font-black italic uppercase tracking-tight mb-4">Elite Access Only</h2>
          <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
            Invite-only indicator access is reserved for <span className="text-white">PRO (Tier 2)</span> and <span className="text-white">ULTIMATE (Tier 3)</span> operators.
          </p>
          <button className="w-full bg-zinc-800 text-white font-black italic py-4 rounded-2xl opacity-50 cursor-not-allowed">
            UPGRADE TO UNLOCK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 lg:p-20 min-h-screen text-white font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase mb-4">
            Indicator<span className="text-blue-500">Access</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold">
            • DIRECT TRADINGVIEW INVITE PROVISIONING •
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={120} />
          </div>

          {hasAccess ? (
            <div className="text-center py-10">
              <CheckCircle size={80} className="mx-auto text-green-500 mb-6 animate-bounce" />
              <h3 className="text-2xl font-black italic uppercase mb-2">Request Received!</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Your TradingView username <span className="text-white">@{tvUsername}</span> has been queued. You will receive a notification on TradingView once the invite is processed (usually within 15 mins).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase">Step 1: Provide Identity</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enter your TradingView username exactly</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="e.g. tradingview_master123"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm font-mono outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-700"
                    value={tvUsername}
                    onChange={(e) => setTvUsername(e.target.value)}
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                  <div className="shrink-0 text-blue-400"><ShieldCheck size={20} /></div>
                  <p className="text-[10px] font-bold text-blue-200/60 leading-normal uppercase tracking-wider">
                    Our automation bot will verify your <span className="text-white">TIER {tier}</span> status and instantly add you to the "KIMOO CRT PRO" invite list.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : (
                    <>
                      REQUEST ACCESS <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
            System Status: <span className="text-green-500/60 font-black italic">Invitation Bot Online</span>
          </p>
        </div>
      </div>
    </div>
  );
}
