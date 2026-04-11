"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { motion, AnimatePresence } from 'framer-motion';
import SignalChart from '@/components/SignalChart';
import { 
  Search, 
  Activity, 
  Target, 
  Shield, 
  Clock, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Layout,
  X,
  AlertCircle
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

// --- 1. HELPER COMPONENTS ---
const DetailBox = ({ label, value, color = "text-white", highlight = false }: any) => (
  <div className={`p-4 rounded-2xl border border-white/5 bg-white/[0.01] ${highlight ? 'border-blue-500/20 bg-blue-500/[0.02]' : ''}`}>
    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className={`text-[11px] font-bold truncate tracking-tight ${color}`}>{value}</p>
  </div>
);

const PriceRow = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={`font-mono text-sm font-black ${color}`}>{Number(value || 0).toFixed(5)}</span>
  </div>
);

// --- 1.5 HELPERS (Synced with Active Signals) ---
function TradeDataRow({ icon, label, value, valueClass = "text-white" }: any) {
  return (
    <div className="flex justify-between items-center py-2.5 hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
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
  if (hrs < 24) return `${hrs}H ${diff % 60}M AGO`;
  return new Date(timestamp).toLocaleDateString();
}

function getDisplayStatus(status: string) {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'In Progress';
    case 'TP1': return 'TP1 Hit';
    case 'TP1 + SL (BE)': return 'Partial TP1';
    case 'SL': return 'Stopped Out';
    case 'TP2': return 'TP1 / TP2';
    case 'WIN': return 'Take Profit';
    default: return 'Active';
  }
}

function calculateTargetRR(target: any, entry: any, sl: any) {
  const t = Number(target);
  const e = Number(entry);
  const s = Number(sl);
  if (!t || !e || !s || e === s) return "0.0R";
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  return `+${(reward / risk).toFixed(1)}R`;
}

function getDynamicRR(signal: any) {
  const entry = Number(signal.entry_price || 0);
  const sl = Number(signal.sl || 0);
  const tp2 = Number(signal.tp_secondary || 0);
  const tp1 = Number(signal.tp || 0);

  if (!entry || !sl || entry === sl) return '0.0R';
  const risk = Math.abs(entry - sl);
  
  const status = signal.status?.toUpperCase();
  if (status === 'SL') return '-1.0R';
  if (status === 'TP2' && tp2) {
    return `+${(Math.abs(tp2 - entry) / risk).toFixed(1)}R`;
  }
  if ((status === 'TP1' || status === 'TP1 + SL (BE)') && tp1) {
    return `+${(Math.abs(tp1 - entry) / risk).toFixed(1)}R`;
  }

  const targetTp = tp2 || tp1;
  return `1:${(Math.abs(targetTp - entry) / risk).toFixed(1)}`;
}

// --- 2. MODAL COMPONENT ---
const SignalModal = ({ signal, onClose }: { signal: any, onClose: () => void }) => {
  if (!signal) return null;
  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#030407]/80 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-[#0a0c10] to-[#030407] border border-white/[0.08] w-full max-w-6xl rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:w-[35%] p-8 overflow-y-auto max-h-[50vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-white/[0.05] relative">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none" />
          <div className="flex justify-between items-start mb-8">
            <div className="relative z-10">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-md">{signal.symbol}</h2>
              <p className="text-[10px] text-blue-500 font-bold tracking-[0.2em] mt-1">CRT NEURAL SETUP</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="text-zinc-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <DetailBox label="Setup Time" value={new Date(signal.created_at).toLocaleTimeString()} />
            <DetailBox label="confluences" value={signal.confluences || 'Institutional Bias Confirmed'} />
          </div>
          <div className="space-y-3">
            <PriceRow label="ENTRY ZONE" value={signal.entry_price} color="text-blue-400" />
            <PriceRow label="STOP LOSS" value={signal.sl} color="text-red-400" />
            <PriceRow label="TP 1 (EQ)" value={signal.tp} color="text-green-400" />
            <PriceRow label="TP 2 (TARGET)" value={signal.tp_secondary} color="text-green-400" />
          </div>
        </div>
        <div className="lg:w-[65%] bg-black relative flex flex-col min-h-[450px]">
          <div className="absolute top-6 left-6 z-10 flex gap-2">
             <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest shadow-lg ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{isBuy ? 'LONG' : 'SHORT'}</span>
             <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-2 shadow-lg"><Activity size={12} /> LIVE SIGNAL</span>
          </div>
          <SignalChart symbol={signal.symbol} />
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- 3. SIGNAL CARD COMPONENT ---
const SignalCard = ({ signal, onClick }: { signal: any, onClick: () => void }) => {
  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';
  
  return (
    <motion.div 
      layout
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-500 group shadow-2xl flex flex-col justify-between min-h-[500px] cursor-pointer"
    >
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700 ${
        isBuy ? 'bg-emerald-500' : 'bg-red-500'
      }`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase drop-shadow-md">{signal.symbol}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 flex items-center gap-2">
              {signal.strategy || 'KIMOO CRT PRO'} • {signal.tf_alignment || '5M'}
            </p>
          </div>
          <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ${
            isBuy 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
              : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          }`}>
            {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isBuy ? 'BULLISH' : 'BEARISH'}
          </div>
        </div>

        <div className="space-y-1.5 mb-8">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 mb-4 flex justify-between items-center group-hover:border-white/[0.1] transition-colors">
            <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <Activity size={14} className="text-blue-400 animate-pulse"/> Status
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">{getDisplayStatus(signal.status)}</span>
          </div>
          
          <TradeDataRow 
            icon={<TrendingUp size={12} className="text-indigo-400"/>} 
            label="Trade R:R" 
            value={getDynamicRR(signal)} 
            valueClass="text-indigo-400" 
          />

          <TradeDataRow icon={<Zap size={12} className="text-amber-400"/>} label="Entry Region" value={Number(signal.entry_price || 0).toFixed(5)} />
          <TradeDataRow icon={<Shield size={12} className="text-red-400"/>} label="Invalidation" value={Number(signal.sl || 0).toFixed(5)} valueClass="text-red-400" />
          
          <div className="my-2 border-t border-white/[0.05]" />

          <TradeDataRow 
            icon={<Target size={12} className="text-emerald-400"/>} 
            label="TP-1 (EQ)" 
            value={`${Number(signal.tp || 0).toFixed(5)} (${calculateTargetRR(signal.tp, signal.entry_price, signal.sl)})`} 
            valueClass="text-emerald-400" 
          />

          <TradeDataRow 
            icon={<Zap size={12} className="text-yellow-500"/>} 
            label="TP-2 (TARGET)" 
            value={signal.tp_secondary ? `${Number(signal.tp_secondary).toFixed(5)} (${calculateTargetRR(signal.tp_secondary, signal.entry_price, signal.sl)})` : '---'} 
            valueClass="text-yellow-500" 
          />

          <div className="my-2 border-t border-white/[0.05]" />

          <TradeDataRow 
            icon={<Layout size={12} className="text-zinc-500"/>} 
            label="Confluences" 
            value={signal.confluences || 'Institutional Bias Confirmed'} 
            valueClass="text-zinc-400 text-[11px] italic" 
          />

          
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Time Elapsed</span>
            <span className="text-[10px] font-mono text-zinc-400 font-black uppercase flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
              <Clock size={12} /> {getTimeAgo(signal.created_at)}
            </span>
          </div>
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-95 flex items-center justify-center gap-3 border border-blue-500/30 group/btn mt-4"
      >
        <Layout size={16} className="text-blue-200 group-hover/btn:text-white transition-colors" /> 
        Open Live Setup 
        <ArrowUpRight size={16} className="text-blue-200 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>
    </motion.div>
  );
};

// --- 4. MAIN PAGE ---
export default function SignalsPage() {
  const { loading: authLoading } = useAuth(); 
  const [signals, setSignals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assetClass, setAssetClass] = useState('ALL');

  // --- SYMBOL CATEGORY HELPER ---
  const getSymbolCategory = (symbol: string) => {
    if (!symbol) return 'CRYPTO';
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) return 'METALS';
    if (['US100', 'US30', 'US500', 'NAS100', 'DJI', 'SPX', 'GER40'].includes(upper)) return 'INDICES';
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
    if (forexPairs.includes(upper)) return 'FOREX';
    return 'CRYPTO';
  };

  useEffect(() => {
    const fetchSignals = async () => {
      const { data } = await supabase.from('signals').select('*').order('created_at', { ascending: false });
      if (data) setSignals(data);
      setLoading(false);
    };
    fetchSignals();

    const channel = supabase.channel('terminal_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
        setSignals(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'signals' }, (payload) => {
        setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter(s => {
      const symbolMatch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const signalDate = new Date(s.created_at).toISOString().split('T')[0];
      const dateMatch = (!dateFrom || signalDate >= dateFrom) && (!dateTo || signalDate <= dateTo);
      const assetMatch = assetClass === 'ALL' || getSymbolCategory(s.symbol) === assetClass;
      return symbolMatch && dateMatch && assetMatch;
    });
  }, [signals, searchTerm, dateFrom, dateTo, assetClass]);

  const totalPages = Math.ceil(filteredSignals.length / ITEMS_PER_PAGE);
  const paginatedSignals = filteredSignals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFrom, dateTo, assetClass]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <Activity size={40} className="text-zinc-700 mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Intelligence...</p>
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

        <div className="max-w-[1700px] mx-auto relative z-10 flex flex-col min-h-screen space-y-8">
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                Alpha<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Terminal</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • CRT PROTOCOL • REAL-TIME INSTITUTIONAL SIGNALS •
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              {/* Date Filters */}
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer" />
                </div>
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="self-end mb-1 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"><X size={16} /></button>
                )}
              </div>

              {/* Asset Class Filter */}
              <div className="flex flex-col gap-1 w-full md:w-48">
                <label className="text-[9px] font-black text-zinc-500 uppercase ml-2 tracking-widest">Asset Class</label>
                <select 
                  value={assetClass} 
                  onChange={(e) => setAssetClass(e.target.value)}
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer appearance-none w-full"
                >
                  <option value="ALL" className="bg-[#05070a]">ALL ASSETS</option>
                  <option value="CRYPTO" className="bg-[#05070a]">CRYPTO</option>
                  <option value="FOREX" className="bg-[#05070a]">FOREX</option>
                  <option value="INDICES" className="bg-[#05070a]">INDICES</option>
                  <option value="METALS" className="bg-[#05070a]">METALS</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative flex-grow md:w-64 self-end h-[42px] mb-0.5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search symbol..." className="w-full h-full pl-12 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-mono text-white focus:border-blue-500/50 hover:border-white/20 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Signals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 flex-grow">
            <AnimatePresence mode="popLayout">
              {paginatedSignals.length > 0 ? (
                paginatedSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} onClick={() => setSelectedSignal(signal)} />
                ))
              ) : (
                <div className="col-span-full w-full flex flex-col items-center justify-center py-40 border border-dashed border-white/[0.1] rounded-[2.5rem] bg-white/[0.01]">
                  <AlertCircle size={48} className="text-zinc-700 mb-6" />
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">No Intelligence Found</h3>
                  <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Adjust filters or timeframe.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 mb-4 flex justify-center items-center gap-4">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[40px] h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/[0.02] border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white'}`}>{pageNum.toString().padStart(2, '0')}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-zinc-500 hover:bg-white/[0.05] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={20} /></button>
            </div>
          )}

          {/* Modal Overlay */}
          <AnimatePresence>
            {selectedSignal && (
              <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AccessGuard>
  );
}
