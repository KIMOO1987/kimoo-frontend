"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AccessGuard from '@/components/AccessGuard'; // Added AccessGuard
import { Shield, Activity, Radio, Search, Layers, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function RadarPage() {
  const [liveSignals, setLiveSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [assetClass, setAssetClass] = useState('ALL');

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
  
  // Apply User Filters
  const filteredRadarSignals = highProbabilitySignals.filter(s => {
    const symbolMatch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const assetMatch = assetClass === 'ALL' || getSymbolData(s.symbol).category === assetClass;
    return symbolMatch && assetMatch;
  });


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-zinc-700 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Syncing Radar Frequencies...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="PRO">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
          {/* Header & Filters */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                Alpha<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Radar</span>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)] mt-1" />
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • INSTITUTIONAL LIQUIDITY SCANNER • GLOBAL STREAM •
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              {/* Asset Class Filter */}
              <div className="flex flex-col gap-1 w-full md:w-48">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Asset Class</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <select 
                    value={assetClass} 
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer appearance-none w-full"
                  >
                    <option value="ALL" className="bg-[#05070a]">ALL ASSETS</option>
                    <option value="CRYPTO" className="bg-[#05070a]">CRYPTO</option>
                    <option value="FOREX" className="bg-[#05070a]">FOREX</option>
                    <option value="INDICES" className="bg-[#05070a]">INDICES</option>
                    <option value="METALS" className="bg-[#05070a]">METALS</option>
                  </select>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative flex-grow md:w-64 self-end h-[42px] mb-0.5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search stream..."
                  className="w-full h-full pl-12 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-mono text-white focus:border-blue-500/50 hover:border-white/20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Live Signal Stream */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="p-5 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scanner Stream</h3>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Real-time Injection</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/[0.05]">
                      <th className="px-6 md:px-8 py-5">Instrument</th>
                      <th className="hidden md:table-cell py-5">Category</th>
                      <th className="py-5">Entry Price</th>
                      <th className="py-5 w-[20%]">CRT Confidence</th>
                      <th className="py-5 text-center">Bias</th>
                      <th className="px-6 py-5">Live Result</th>
                      <th className="px-6 py-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    <AnimatePresence>
                      {filteredRadarSignals.map((signal) => {
                        const conf = getConfidence(signal);
                        const rr = calculateLiveRR(signal);
                        const asset = getSymbolData(signal.symbol);
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={signal.id} 
                            className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                          >
                            <td className="px-6 md:px-8 py-6 font-black text-lg tracking-tighter text-white uppercase italic drop-shadow-sm">
                              {signal.symbol}
                            </td>
                            
                            <td className="hidden md:table-cell py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              {asset.category}
                            </td>

                            <td className="py-6 text-[13px] font-mono font-black text-zinc-300">
                              {Number(signal.entry_price || 0).toFixed(5)}
                            </td>

                            <td className="py-6 pr-6">
                              <div className="flex items-center gap-2">
                                <div className="w-12 md:w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${conf.val}%` }}
                                    transition={{ duration: 1 }}
                                    className={`h-full shadow-[0_0_10px_rgba(59,130,246,0.8)] ${conf.val > 80 ? 'bg-blue-500' : conf.val > 60 ? 'bg-zinc-500' : 'bg-red-900/50'}`} 
                                  />
                                </div>
                                <span className="text-[10px] font-bold font-mono text-zinc-400">{conf.val}%</span>
                              </div>
                            </td>
                            <td className="py-6 text-center">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border tracking-widest ${
                                signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH' 
                                  ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
                                  : 'text-red-400 border-red-500/20 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                              }`}>
                                {signal.side}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${rr >= 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-[11px] font-mono font-black ${rr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {rr >= 0 ? `PROFIT ${rr.toFixed(2)}R` : `DRAWDOWN ${rr.toFixed(2)}R`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <Link href="/dashboard/active" className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.08] hover:text-white transition-all group-hover:border-white/20 inline-flex">
                                <ChevronRight size={16} />
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filteredRadarSignals.length === 0 && !isLoading && (
                  <div className="w-full flex flex-col items-center justify-center py-24 border-dashed border-t border-white/[0.05] bg-white/[0.01]">
                    <AlertCircle size={40} className="text-zinc-700 mb-4" />
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">No Active Intelligence</h3>
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Awaiting scanner displacement...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Premium Integrity Footer */}
          <div className="w-full mt-4">
            <div className="bg-gradient-to-r from-emerald-500/[0.05] to-transparent border border-emerald-500/10 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center gap-6 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <Shield size={24} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Security Integrity Checked
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                  Alpha Radar actively identifies institutional price delivery arrays in real-time. Signals older than 4 hours are automatically classified as DECAYED and removed from the Prime interface to protect capital exposure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
