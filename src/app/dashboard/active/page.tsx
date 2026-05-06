"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import AccessGuard from '@/components/AccessGuard'; // Switched to AccessGuard
import {
  Clock, Activity, Zap, ArrowUpRight, TrendingUp,
  TrendingDown, Layout, Target, Shield, AlertCircle
} from 'lucide-react';
import SignalModal from '@/components/SignalModal';

export default function ActiveSignalsPage() {
  const [activeSignals, setActiveSignals] = useState<any[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [livePrices, setLivePrices] = useState<{ [key: string]: number }>({});
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  // --- SYMBOL CATEGORIZATION HELPER ---
  const getSymbolData = (symbol: string) => {
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // METALS: OANDA
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

  // 1. SIGNAL DATA FETCHING & REALTIME
  useEffect(() => {
    const fetchActive = async () => {
      // 1. Optimistic Cache Load: Instantly show previous signals
      const cached = sessionStorage.getItem('active_signals_cache');
      if (cached) {
        try {
          const parsedSignals = JSON.parse(cached);
          setActiveSignals(parsedSignals);
          setLivePrices(prev => {
            const next = { ...prev };
            parsedSignals.forEach((s: any) => {
              const clean = s.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
              if (next[clean] === undefined) next[clean] = Number(s.entry_price || 0);
            });
            return next;
          });
          setLoadingSignals(false); // Instantly hide loader if cache is found
        } catch (e) { }
      } else {
        // Only show loading screen if there is no cache
        setLoadingSignals(true);
      }

      // 2. Fetch fresh data silently in the background
      // Fetches signals from the last 24 hours
      const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .gt('created_at', timeLimit)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Signal Fetch Error:", error.message);
      } else if (data) {
        setActiveSignals(data);
        // Save the fresh signals to cache for the next refresh
        sessionStorage.setItem('active_signals_cache', JSON.stringify(data));

        // Initialize live prices only for symbols we aren't tracking yet
        setLivePrices(prev => {
          const next = { ...prev };
          data.forEach(s => {
            const clean = s.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (next[clean] === undefined) next[clean] = Number(s.entry_price || 0);
          });
          return next;
        });
      }
      setLoadingSignals(false);
    };

    fetchActive();

    // Realtime subscription to keep the dashboard live
    const channel = supabase.channel('active_signals_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => {
        fetchActive();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. REAL-TIME PRICE UPDATES
  useEffect(() => {
    if (activeSignals.length === 0) return;

    // --- A. CRYPTO WEBSOCKET (BINANCE) ---
    const cryptoPairs = activeSignals.filter(s => getSymbolData(s.symbol).category === 'CRYPTO');
    let socket: WebSocket | null = null;

    if (cryptoPairs.length > 0) {
      const streams = cryptoPairs.map(s => `${getSymbolData(s.symbol).clean.toLowerCase()}@ticker`).join('/');
      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      
      socket = new WebSocket(url);
      socket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          // Combined streams wrap the data in a "data" property, single streams don't
          const data = rawData.data || rawData;
          if (data.s && data.c) {
            setLivePrices(prev => ({ ...prev, [data.s.toUpperCase()]: parseFloat(data.c) }));
          }
        } catch (err) {
          console.error("[Binance WS] Parse Error:", err);
        }
      };
    }

    // --- B. NON-CRYPTO POLLING (FOREX, METALS, INDICES) ---
    const otherSignals = activeSignals.filter(s => getSymbolData(s.symbol).category !== 'CRYPTO');

    const pollInterval = setInterval(async () => {
      if (otherSignals.length === 0) return;

      // Finnhub API Key integrated
      const FINNHUB_KEY = 'd78oc2pr01qp0fl5vgi0d78oc2pr01qp0fl5vgig';

      for (const s of otherSignals) {
        const { category, provider, clean } = getSymbolData(s.symbol);
        let finnhubSymbol = clean;

        // Format symbols for Finnhub according to provider logic
        if (category === 'FOREX') finnhubSymbol = `OANDA:${clean.replace(/(USD|JPY|GBP|AUD|NZD|EUR|CHF)/, '$1_').replace(/_$/, '')}`;
        if (category === 'FOREX' && provider === 'FOREXCOM') finnhubSymbol = `FX:${clean}`;
        if (category === 'METALS') finnhubSymbol = `OANDA:${clean.replace('USD', '_USD')}`;
        if (category === 'INDICES') finnhubSymbol = `${provider}:${clean}`;

        try {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`);
          const data = await response.json();

          if (data.c) { // 'c' is the current price in Finnhub
            setLivePrices(prev => ({
              ...prev,
              [clean]: parseFloat(data.c)
            }));
          }
        } catch (err) {
          console.error(`Finnhub Fetch Error for ${clean}:`, err);
        }
      }
    }, 10000); // Polling every 10 seconds to respect free tier limits

    return () => {
      if (socket) socket.close();
      clearInterval(pollInterval);
    };
  }, [activeSignals]);

  return (
    <AccessGuard requiredTier={1} tierName="PRO">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72  min-h-screen text-zinc-900 dark:text-white font-sans overflow-x-hidden">

        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">

          {/* Header Section */}
          <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-zinc-900 dark:text-white">
                Active<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Intelligence</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-500 font-bold mt-3 leading-none">
                • LIVE CRT MARKET EXPOSURE •
              </p>
            </div>
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Institutional Flow Active
              </span>
            </div>
          </div>

          {/* Signals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {activeSignals.length > 0 ? (
                activeSignals.map((signal) => (
                  <motion.div
                    key={signal.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-[var(--glass-border)] p-6 md:p-8 rounded-[2.5rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-500 group shadow-2xl flex flex-col justify-between min-h-[500px]"
                  >
                    {/* Internal Ambient Glow */}
                    <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700 ${signal.side === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8 border-b border-[var(--glass-border)] pb-6">
                        <div>
                          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic uppercase drop-shadow-md">{signal.symbol}</h3>
                          <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                            {signal.strategy || 'KIMOO CRT PRO'} • {signal.tf_alignment || '5M'}
                          </p>
                        </div>

                        <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ${signal.side === 'BUY'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                          : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          }`}>
                          {signal.side === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {signal.side}
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-8">
                        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 mb-4 flex justify-between items-center group-hover:border-white/[0.1] transition-colors">
                          <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">
                            <Activity size={14} className="text-blue-400 animate-pulse" /> Status
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest ${getDisplayStatus(signal.status, livePrices[getSymbolData(signal.symbol).clean], signal).includes('SL HIT')
                            ? 'text-red-500 animate-pulse'
                            : 'text-blue-400'
                            }`}>
                            {getDisplayStatus(signal.status, livePrices[getSymbolData(signal.symbol).clean], signal)}
                          </span>
                        </div>

                        <TradeDataRow icon={<TrendingUp size={12} className="text-indigo-400" />} label="Trade R:R" value={getDynamicRR(signal)} valueClass="text-indigo-400" />
                        <TradeDataRow icon={<Zap size={12} className="text-amber-400" />} label="Entry Region" value={Number(signal.entry_price || 0).toFixed(5)} />
                        <TradeDataRow icon={<Shield size={12} className="text-red-400" />} label="Invalidation" value={Number(signal.sl || 0).toFixed(5)} valueClass="text-red-400" />

                        <div className="my-2 border-t border-[var(--glass-border)]" />

                        <TradeDataRow
                          icon={<Target size={12} className="text-emerald-400" />}
                          label="TP-1 (EQ)"
                          value={`${Number(signal.tp || 0).toFixed(5)} (${calculateTargetRR(signal.tp, signal.entry_price, signal.sl)})`}
                          valueClass="text-emerald-400"
                        />

                        <TradeDataRow
                          icon={<Zap size={12} className="text-yellow-500" />}
                          label="TP-2 (TARGET)"
                          value={signal.tp_secondary ? `${Number(signal.tp_secondary).toFixed(5)} (${calculateTargetRR(signal.tp_secondary, signal.entry_price, signal.sl)})` : '---'}
                          valueClass="text-yellow-500"
                        />

                        <div className="my-2 border-t border-[var(--glass-border)]" />

                        <TradeDataRow
                          icon={<Layout size={12} className="text-zinc-600 dark:text-zinc-500" />}
                          label="Confluences"
                          value={signal.confluences || 'Institutional Bias Confirmed'}
                          valueClass="text-zinc-700 dark:text-zinc-400 text-[11px] italic"
                        />

                        {/* Live Realtime RR */}
                        {(() => {
                          const liveRRValue = calculateLiveRR(signal, livePrices);
                          const isProfit = parseFloat(liveRRValue) >= 0;
                          return (
                            <div className={`mt-4 p-4 rounded-2xl border flex justify-between items-center transition-colors duration-500 ${isProfit ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-400 flex items-center gap-2">
                                <Activity size={14} className={isProfit ? 'text-emerald-400' : 'text-red-400'} /> Live PnL
                              </div>
                              <span className={`text-lg font-black font-mono tracking-tight drop-shadow-md ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{liveRRValue}</span>
                            </div>
                          );
                        })()}

                        <div className="flex justify-between items-center pt-4 mt-2">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Time Elapsed</span>
                          <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-400 font-black uppercase flex items-center gap-2 bg-[var(--glass-bg)] px-3 py-1.5 rounded-lg border border-[var(--glass-border)]">
                            <Clock size={12} /> {getTimeAgo(signal.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {getSymbolData(signal.symbol).category === 'CRYPTO' && (
                      <button
                        onClick={() => setSelectedSignal(signal)}
                        className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-zinc-900 dark:text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-95 flex items-center justify-center gap-3 border border-blue-500/30 group/btn mt-4"
                      >
                        <Layout size={16} className="text-blue-200 group-hover/btn:text-zinc-900 dark:text-white transition-colors" />
                        Open Live Setup
                        <ArrowUpRight size={16} className="text-blue-200 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </button>
                    )}
                  </motion.div>
                ))
              ) : loadingSignals ? (
                <div className="col-span-full w-full flex flex-col items-center justify-center py-32 border border-[var(--glass-border)] rounded-[2.5rem] bg-[var(--glass-bg)] animate-pulse">
                  <Activity size={40} className="text-zinc-700 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Syncing Live Market Data...</p>
                </div>
              ) : !loadingSignals && (
                <div className="col-span-full w-full flex flex-col items-center justify-center py-40 border border-dashed border-white/[0.1] rounded-[2.5rem] bg-[var(--glass-bg)]">
                  <AlertCircle size={48} className="text-zinc-700 mb-6" />
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white mb-2">No Active Intelligence</h3>
                  <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Awaiting Order Block Displacement...</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
          </AnimatePresence>
        </div>
      </div>
    </AccessGuard>
  );
}

// --- HELPERS ---
function TradeDataRow({ icon, label, value, valueClass = "text-zinc-900 dark:text-white" }: any) {
  return (
    <div className="flex justify-between items-center py-2.5 hover:bg-[var(--glass-bg)] rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">
        {icon} <span>{label}</span>
      </div>
      <span className={`text-sm font-mono font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function getTimeAgo(timestamp: string) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff < 1) return 'JUST NOW';
  if (diff < 60) return `${diff}M AGO`;
  const hrs = Math.floor(diff / 60);
  return `${hrs}H ${diff % 60}M AGO`;
}

function getDisplayStatus(status: string, livePrice?: number, signal?: any) {
  // ORGANIC PROTECTION: If price hit SL/TP before webhook, override status
  if (livePrice && signal) {
    const entry = Number(signal.entry_price);
    const sl = Number(signal.sl);
    const isBuy = signal.side === 'BUY';

    // Check for Stop Loss hit
    if ((isBuy && livePrice <= sl) || (!isBuy && livePrice >= sl)) {
      return 'SL HIT (LIVE)';
    }

    // Check for TP1 hit
    const tp1 = Number(signal.tp);
    if ((isBuy && livePrice >= tp1) || (!isBuy && livePrice <= tp1)) {
      if (status === 'ENTRY') return 'TP1 TARGETED';
    }
  }

  switch (status?.toUpperCase()) {
    case 'PENDING': return 'In Progress';
    case 'ENTRY': return 'Active';
    case 'TP1': return 'Partial TP1';
    case 'TP1 + SL (BE)': return 'Secured BE';
    case 'SL': return 'Stopped Out';
    case 'TP2': return 'Final TP Hit';
    default: return status || 'Active';
  }
}

/**
 * Calculates the potential R:R for a specific target level
 */
function calculateTargetRR(target: any, entry: any, sl: any) {
  const t = Number(target);
  const e = Number(entry);
  const s = Number(sl);
  if (!t || !e || !s || e === s) return "0.0R";
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  return `+${(reward / risk).toFixed(1)}R`;
}

/**
 * Calculates the Dynamic RR based on current status (Ported from History Page)
 */
function getDynamicRR(signal: any) {
  const entry = Number(signal.entry_price || 0);
  const sl = Number(signal.sl || 0);
  const tp2 = Number(signal.tp_secondary || 0);
  const tp1 = Number(signal.tp || 0);

  if (!entry || !sl || entry === sl) return '0.0R';
  const risk = Math.abs(entry - sl);

  // Outcome-based results
  if (signal.status === 'SL') return '-1.0R';
  if (signal.status === 'TP2' && tp2) {
    return `+${(Math.abs(tp2 - entry) / risk).toFixed(1)}R`;
  }
  if ((signal.status === 'TP1' || signal.status === 'TP1 + SL (BE)') && tp1) {
    return `+${(Math.abs(tp1 - entry) / risk).toFixed(1)}R`;
  }

  // Setup fallback (Potential)
  const targetTp = tp2 || tp1;
  return `1:${(Math.abs(targetTp - entry) / risk).toFixed(1)}`;
}

/**
 * Calculates Realtime R:R based on current price vs entry and risk
 */
function calculateLiveRR(signal: any, livePrices: { [key: string]: number }) {
  const status = signal.status?.toUpperCase();
  const entry = Number(signal.entry_price || 0);
  const sl = Number(signal.sl || 0);
  const tp1 = Number(signal.tp || 0);
  const tp2 = Number(signal.tp_secondary || 0);
  const risk = Math.abs(entry - sl);

  if (!entry || !sl || risk === 0) return '0.00R';

  // --- SEALING LOGIC (Reference from Backup) ---
  // If trade is closed, use the known outcome instead of live price
  if (status === 'SL') return '-1.00R';
  if (status === 'TP2' && tp2) return `+${(Math.abs(tp2 - entry) / risk).toFixed(2)}R`;
  if ((status === 'TP1' || status === 'TP1 + SL (BE)') && tp1) return `+${(Math.abs(tp1 - entry) / risk).toFixed(2)}R`;

  // Normalize symbol to match WebSocket keys
  const cleanSymbol = signal.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Use the live price from state, fallback to signal's current_price (last known)
  const current = livePrices[cleanSymbol] ?? Number(signal.current_price || entry);
  const side = signal.side?.toUpperCase();

  const isBuy = side === 'BUY' || side === 'BULLISH';
  const reward = isBuy ? (current - entry) : (entry - current);
  const rr = reward / risk;

  return `${rr >= 0 ? '+' : ''}${rr.toFixed(2)}R`;
}
