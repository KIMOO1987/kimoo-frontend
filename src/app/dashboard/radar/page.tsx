"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SignalMedia from '@/components/SignalMedia';
import { Radar, Zap, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

export default function SignalRadar() {
  const [activeSignals, setActiveSignals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    winrate: 0,
    dailyVol: 0
  });

  useEffect(() => {
    const fetchActive = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setActiveSignals(data);
    };

    fetchActive();

    const channel = supabase
      .channel('radar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => fetchActive())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-6 md:p-10 min-h-screen text-white">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Radar size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Active Matrix</span>
          </div>
          <p className="text-3xl font-black italic">{activeSignals.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Signal Grade Avg</span>
          </div>
          <p className="text-3xl font-black italic text-green-400">A++</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Avg RR Ratio</span>
          </div>
          <p className="text-3xl font-black italic">1:3.2</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-3 text-orange-400 mb-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Confirmation</span>
          </div>
          <p className="text-3xl font-black italic">Active</p>
        </div>
      </div>

      {/* Grid of Active Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeSignals.map((signal) => (
          <div key={signal.id} className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-6 hover:bg-white/10 transition-all duration-500 overflow-hidden shadow-2xl">
            {/* Top Info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">{signal.symbol}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">CRT PATTERN DETECTED</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-widest shadow-lg ${signal.side === 'BUY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {signal.side} EXECUTION
              </div>
            </div>

            {/* Live Chart / Media Component */}
            <SignalMedia 
              symbol={signal.symbol} 
              screenshotUrl={signal.screenshot_url} 
              status={signal.status} 
            />

            {/* Bottom Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-center">Entry</p>
                <p className="text-sm font-black italic font-mono">{signal.entry_price}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-center">SL Zone</p>
                <p className="text-sm font-black italic text-red-400 font-mono">{signal.sl}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-center">Target TP</p>
                <p className="text-sm font-black italic text-green-400 font-mono">{signal.tp}</p>
              </div>
            </div>

            {/* Grade Overlay */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black italic text-blue-400 uppercase tracking-widest">Grade:</span>
                <span className="text-base font-black italic text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{signal.grade}</span>
              </div>
              <button className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/10">
                Full Details
              </button>
            </div>
          </div>
        ))}

        {activeSignals.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white/2 backdrop-blur-3xl rounded-[3rem] border border-dashed border-white/10">
            <AlertCircle size={40} className="text-zinc-700 mb-4 animate-bounce" />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.4em]">Scanning Matrix for CRT Signals...</p>
          </div>
        )}
      </div>
    </div>
  );
}
