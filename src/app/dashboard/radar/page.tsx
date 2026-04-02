"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard'; // Added AccessGuard
import { Compass, Shield, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadarPage() {
  const { loading: authLoading } = useAuth(); 
  const [liveSignals, setLiveSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRadarData();

    const heartbeat = setInterval(() => {
      setLiveSignals(prev => [...prev]);
    }, 60000);

    const channel = supabase.channel('radar_updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'signals'
        }, 
      (payload) => {
        setLiveSignals(prev => [payload.new, ...prev].slice(0, 10));
      }).subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(heartbeat);
    };
  }, []);

  const fetchRadarData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('signals')
      .select('id, symbol, category, side, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) console.error("Radar Fetch Error:", error.message);
    if (data) setLiveSignals(data);
    setIsLoading(false);
  };

  const getConfidence = (timestamp: string) => {
    const minutesAgo = (Date.now() - new Date(timestamp).getTime()) / 60000;
    if (minutesAgo < 15) return { val: 98, label: 'PRIME' };
    if (minutesAgo < 60) return { val: 85, label: 'STABLE' };
    if (minutesAgo < 240) return { val: 62, label: 'DECAY' };
    return { val: 30, label: 'EXPIRED' };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Pro Member">
      <div className="p-4 md:p-8 lg:p-12 bg-[#05070a] min-h-screen text-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic flex items-center gap-3">
              ALPHA <span className="text-blue-500">RADAR</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-1" />
            </h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-zinc-600 font-bold mt-2 leading-none">
              Institutional Liquidity Scanner • Global Signal Stream
            </p>
          </div>
          <div className="flex gap-4">
            <RadarStat label="Live Feed" value="ACTIVE" color="text-green-500" />
            <RadarStat label="Signals" value={liveSignals.length.toString()} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Live Signal Stream */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50">
              <div className="p-5 md:p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scanner Stream</h3>
                <div className="flex items-center gap-2">
                  <Radio size={12} className="text-blue-500 animate-pulse" />
                  <span className="text-[8px] font-black text-blue-500 uppercase">Real-time Injection</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-zinc-700 uppercase tracking-widest bg-black/40">
                      <th className="px-6 py-4">Instrument</th>
                      <th className="hidden md:table-cell py-4">Category</th>
                      <th className="py-4 text-center md:text-left">CRT Confidence</th>
                      <th className="py-4">Bias</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    <AnimatePresence mode='popLayout'>
                      {liveSignals.map((signal) => {
                        const conf = getConfidence(signal.created_at);
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={signal.id} 
                            className="hover:bg-blue-500/[0.02] transition-colors group"
                          >
                            <td className="px-6 py-5 font-black text-sm tracking-tighter text-white uppercase">
                              {signal.symbol}
                            </td>
                            
                            <td className="hidden md:table-cell py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {signal.category || 'Global'}
                            </td>

                            <td className="py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-12 md:w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${conf.val}%` }}
                                    transition={{ duration: 1 }}
                                    className={`h-full ${conf.val > 80 ? 'bg-blue-500' : conf.val > 60 ? 'bg-zinc-500' : 'bg-red-900/50'}`} 
                                  />
                                </div>
                                <span className="text-[9px] md:text-[10px] font-bold text-zinc-500">{conf.val}%</span>
                              </div>
                            </td>
                            <td className="py-5">
                              <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded border ${
                                signal.side === 'BUY' 
                                  ? 'text-green-500 border-green-500/20 bg-green-500/10' 
                                  : 'text-red-500 border-red-500/20 bg-red-500/10'
                              }`}>
                                {signal.side}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${conf.val > 80 ? 'bg-blue-500 animate-ping' : 'bg-zinc-800'}`} />
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${conf.val > 80 ? 'text-blue-500' : 'text-zinc-600'}`}>
                                   {conf.label}
                                 </span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {liveSignals.length === 0 && !isLoading && (
                  <div className="p-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                    No active scans found in database
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Visual Radar Circle */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col items-center justify-center aspect-square relative rounded-2xl md:rounded-[2rem] overflow-hidden">
              <div className="absolute inset-4 border border-blue-500/5 rounded-full" />
              <div className="absolute inset-12 border border-blue-500/10 rounded-full" />
              <div className="absolute inset-0 border border-blue-500/5 rounded-full animate-[spin_6s_linear_infinite] pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-gradient-to-t from-transparent to-blue-500/40" />
              </div>
              
              <Compass size={40} className="text-blue-500 opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Scanning</p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase mt-2 text-center px-4">Aggregating Global CRT Liquidity</p>
            </div>

            <div className="bg-green-500/[0.02] border border-green-500/10 p-6 rounded-2xl md:rounded-[2rem]">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={16} className="text-green-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500">Signal Integrity</h4>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-bold italic">
                "KIMOO Alpha Radar identifies institutional price delivery arrays. Signals older than 4 hours are automatically marked as DECAYED."
              </p>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}

function RadarStat({ label, value, color = "text-zinc-400" }: { label: string, value: string, color?: string }) {
  return (
    <div className="text-right">
      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-none">{label}</p>
      <p className={`text-xs font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}
