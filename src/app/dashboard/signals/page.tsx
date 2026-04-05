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
  X 
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
    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
        {icon} <span>{label}:</span>
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#0d0f14] border border-white/10 w-full max-w-6xl rounded-[2rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:w-[35%] p-8 overflow-y-auto max-h-[50vh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0a0c10]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{signal.symbol}</h2>
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
             <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest ${isBuy ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>{isBuy ? 'LONG' : 'SHORT'}</span>
             <span className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-2"><Activity size={12} /> LIVE SIGNAL</span>
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
      className="bg-[#0a0a0a] border border-white/5 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[520px] cursor-pointer"
    >
      <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity ${
        isBuy ? 'bg-green-500' : 'bg-red-500'
      }`} />

      <div>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">{signal.symbol}</h3>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
              {signal.strategy || 'KIMOO CRT PRO'} • {signal.tf_alignment || '5M'}
            </p>
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 ${
            isBuy ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isBuy ? 'BULLISH' : 'BEARISH'}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <TradeDataRow 
            icon={<Activity size={12} className="text-blue-500"/>} 
            label="Status" 
            value={getDisplayStatus(signal.status)} 
            valueClass="text-blue-400" 
          />
          
          <TradeDataRow 
            icon={<TrendingUp size={12} className="text-blue-400"/>} 
            label="Trade R:R" 
            value={getDynamicRR(signal)} 
            valueClass="text-blue-400" 
          />

          <TradeDataRow icon={<Zap size={12}/>} label="Entry Region" value={Number(signal.entry_price || 0).toFixed(5)} />
          
          <TradeDataRow 
            icon={<Target size={12} className="text-green-500"/>} 
            label="TP-1 (EQ)" 
            value={`${Number(signal.tp || 0).toFixed(5)} (${calculateTargetRR(signal.tp, signal.entry_price, signal.sl)})`} 
            valueClass="text-green-500" 
          />

          <TradeDataRow 
            icon={<Zap size={12} className="text-yellow-500"/>} 
            label="TP-2 (TARGET)" 
            value={signal.tp_secondary ? `${Number(signal.tp_secondary).toFixed(5)} (${calculateTargetRR(signal.tp_secondary, signal.entry_price, signal.sl)})` : 'N/A'} 
            valueClass="text-yellow-500" 
          />

          <TradeDataRow 
            icon={<Layout size={12} className="text-zinc-500"/>} 
            label="Confluences" 
            value={signal.confluences || 'Institutional Bias Confirmed'} 
            valueClass="text-zinc-400 text-xs italic" 
          />

          <TradeDataRow icon={<Shield size={12} className="text-red-500"/>} label="Invalidation" value={Number(signal.sl || 0).toFixed(5)} valueClass="text-red-500" />
          
          <div className="flex justify-between items-center py-3 border-t border-white/5 mt-4">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Signal Age</span>
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase flex items-center gap-2">
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
        className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/20"
      >
        <Layout size={16} /> Open Live Setup <ArrowUpRight size={16} />
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
      return symbolMatch && dateMatch;
    });
  }, [signals, searchTerm, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredSignals.length / ITEMS_PER_PAGE);
  const paginatedSignals = filteredSignals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFrom, dateTo]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={1} tierName="Active Member">
      <div className="p-4 md:p-8 lg:ml-72 min-h-screen bg-[#05070a] flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
          <div className="text-left">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic text-white uppercase">
              Alpha <span className="text-blue-500">Terminal</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 leading-none">
              CRT Protocol • Real-Time Institutional Signals
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-[#0a0a0a] border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-blue-500/40 transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-[#0a0a0a] border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-blue-500/40 transition-all" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="self-end mb-1 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><X size={14} /></button>
              )}
            </div>
            <div className="relative flex-grow md:w-64 self-end">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search symbol..." className="w-full bg-[#0a0a0a] border border-white/5 rounded-[1.2rem] pl-10 pr-4 py-3 text-[11px] font-mono text-white focus:border-blue-500/40 outline-none transition-all" />
            </div>
          </div>
        </div>

        {/* Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-grow">
          <AnimatePresence mode="popLayout">
            {paginatedSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} onClick={() => setSelectedSignal(signal)} />
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 mb-4 flex justify-center items-center gap-4">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 rounded-full bg-[#0a0a0a] border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[40px] h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === pageNum ? 'bg-blue-500 border-blue-500 text-black' : 'bg-[#0a0a0a] border-white/5 text-zinc-500'}`}>{pageNum.toString().padStart(2, '0')}</button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 rounded-full bg-[#0a0a0a] border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
          </div>
        )}

        {/* Modal Overlay */}
        <AnimatePresence>
          {selectedSignal && (
            <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
          )}
        </AnimatePresence>
      </div>
    </AccessGuard>
  );
}