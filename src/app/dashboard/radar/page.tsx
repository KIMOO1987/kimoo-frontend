"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AccessGuard from '@/components/AccessGuard'; // Added AccessGuard
import { Compass, Shield, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadarPage() {
  const [liveSignals, setLiveSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<{ [key: string]: number }>({});

  // --- SYMBOL CATEGORIZATION HELPER ---
  const getSymbolData = (symbol: string) => {
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Metal: OANDA
    if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) {
      return { category: 'METALS', provider: 'OANDA', clean: upper };
    }
    // Indices: CAPITALCOM
    if (['US100', 'US30', 'US500', 'NAS100', 'DJI', 'SPX', 'GER40'].includes(upper)) {
      return { category: 'INDICES', provider: 'CAPITALCOM', clean: upper };
    }
    // Forex: FOREXCOM
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
    if (forexPairs.includes(upper)) {
      return { category: 'FOREX', provider: 'FOREXCOM', clean: upper };
    }
    // Default to Crypto: BINANCE
    return { category: 'CRYPTO', provider: 'BINANCE', clean: upper };
  };

  useEffect(() => {
    // 1. Optimistic Cache Load: Instantly show previous radar data
    const cached = sessionStorage.getItem('radar_signals_cache');
    if (cached) {
      try {
        setLiveSignals(JSON.parse(cached));
        setIsLoading(false); // Instantly hide loader
      } catch (e) {}
    } else {
      setIsLoading(true);
    }

    fetchRadarData();

    // Heartbeat logic
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

  // --- REAL-TIME PRICE UPDATES (WebSocket + Polling) ---
  useEffect(() => {
    if (liveSignals.length === 0) return;

    // A. Crypto WebSocket
    const cryptoPairs = liveSignals.filter(s => getSymbolData(s.symbol).category === 'CRYPTO');
    let socket: WebSocket | null = null;
    if (cryptoPairs.length > 0) {
      const streams = cryptoPairs.map(s => `${getSymbolData(s.symbol).clean.toLowerCase()}@ticker`).join('/');
      socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.s && data.c) {
          setLivePrices(prev => ({ ...prev, [data.s.toUpperCase()]: parseFloat(data.c) }));
        }
      };
    }

    // B. Finnhub Polling
    const otherSignals = liveSignals.filter(s => getSymbolData(s.symbol).category !== 'CRYPTO');
    const pollInterval = setInterval(async () => {
      if (otherSignals.length === 0) return;
      const FINNHUB_KEY = 'd78oc2pr01qp0fl5vgi0d78oc2pr01qp0fl5vgig';
      for (const s of otherSignals) {
        const { category, provider, clean } = getSymbolData(s.symbol);
        let finnhubSymbol = clean;
        if (category === 'FOREX') finnhubSymbol = `OANDA:${clean.replace(/(USD|JPY|GBP|AUD|NZD|EUR|CHF)/, '$1_').replace(/_$/, '')}`; 
        if (category === 'FOREX' && provider === 'FOREXCOM') finnhubSymbol = `FX:${clean}`;
        if (category === 'METALS') finnhubSymbol = `OANDA:${clean.replace('USD', '_USD')}`;
        if (category === 'INDICES') finnhubSymbol = `${provider}:${clean}`;

        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`);
          const data = await response.json();
          if (data.c) setLivePrices(prev => ({ ...prev, [clean]: parseFloat(data.c) }));
        } catch (err) { console.error("Finnhub Error:", err); }
      }
    }, 10000);

    return () => {
      if (socket) socket.close();
      clearInterval(pollInterval);
    };
  }, [liveSignals]);

  const fetchRadarData = async () => {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) console.error("Radar Fetch Error:", error.message);
    if (data) {
      setLiveSignals(data);
      sessionStorage.setItem('radar_signals_cache', JSON.stringify(data));
    }
    setIsLoading(false);
  };

  const calculateLiveRR = (signal: any) => {
    const entry = Number(signal.entry_price || 0);
    const sl = Number(signal.sl || 0);
    const clean = signal.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const current = livePrices[clean] ?? Number(signal.current_price || entry);
    const risk = Math.abs(entry - sl);
    if (!risk) return 0;
    const isBuy = signal.side === 'BUY' || signal.side === 'BULLISH';
    return (isBuy ? (current - entry) : (entry - current)) / risk;
  };

  const getConfidence = (signal: any) => {
    const minutesAgo = (Date.now() - new Date(signal.created_at).getTime()) / 60000;
    const rr = calculateLiveRR(signal);
    
    // 1. Time Component (Max 40)
    let timeScore = Math.max(0, 40 - (minutesAgo / 6));
    
    // 2. Confluence Component (Max 30)
    const confCount = signal.confluences ? signal.confluences.split(',').length : 1;
    let confluenceScore = Math.min(30, confCount * 10);

    // 3. Performance Component (Max 30)
    let performanceScore = rr > 0 ? Math.min(30, rr * 15) : 0;

    const total = Math.round(timeScore + confluenceScore + performanceScore);
    
    if (total > 85) return { val: total, label: 'PRIME' };
    if (total > 60) return { val: total, label: 'STABLE' };
    if (total > 40) return { val: total, label: 'DECAY' };
    return { val: 30, label: 'EXPIRED' };
  };

  // Filter for high probability (PRIME) signals
  const highProbabilitySignals = liveSignals.filter(signal => getConfidence(signal).label === 'PRIME');


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="p-4 md:p-8 lg:ml-72 lg:p-12 bg-[#05070a] min-h-screen text-white">
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
            <RadarStat label="Live Feed" value="ACTIVE" color="text-green-500" /> {/* This stat should probably reflect the filtered count */}
            <RadarStat label="Signals" value={liveSignals.length.toString()} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Live Signal Stream */}
          <div className="lg:col-span-3 space-y-6">
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
                    <tr className="text-[10px] font-black text-zinc-700 uppercase tracking-widest bg-black/40">
                      <th className="px-6 py-4">Instrument</th>
                      <th className="hidden md:table-cell py-4">Category</th>
                      <th className="py-4">CRT Confidence</th>
                      <th className="py-4">Bias</th>
                      <th className="px-6 py-4">Live Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    <AnimatePresence>
                      {highProbabilitySignals.map((signal) => {
                        const conf = getConfidence(signal);
                        const rr = calculateLiveRR(signal);
                        const asset = getSymbolData(signal.symbol);
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={signal.id} 
                            className="hover:bg-blue-500/[0.02] transition-colors group"
                          >
                            <td className="px-6 py-5 font-black text-base tracking-tighter text-white uppercase italic">
                              {signal.symbol}
                            </td>
                            
                            <td className="hidden md:table-cell py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {asset.category}
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
                                <div className={`w-1.5 h-1.5 rounded-full ${rr >= 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${rr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {rr >= 0 ? `PROFIT ${rr.toFixed(2)}R` : `DRAWDOWN ${rr.toFixed(2)}R`}
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {highProbabilitySignals.length === 0 && !isLoading && (
                  <div className="p-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                    No high probability signals currently detected.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signal Integrity moved to bottom */}
          <div className="lg:col-span-3 mt-8">
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
