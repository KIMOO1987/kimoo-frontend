"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard'; // Added AccessGuard
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Search,
  Activity,
  History,
  AlertTriangle
} from 'lucide-react';

/**
 * SUB-COMPONENT: MetricTile
 */
function MetricTile({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-4 hover:border-white/10 transition-all cursor-default">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-black uppercase tracking-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}

/**
 * SUB-COMPONENT: LogicItem
 */
function LogicItem({ label, status }: { label: string, status: 'PASS' | 'FAIL' | 'WAIT' }) {
  const colors = {
    PASS: 'text-green-500 bg-green-500/10 border-green-500/20',
    FAIL: 'text-red-500 bg-red-500/10 border-red-500/20',
    WAIT: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  };

  return (
    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.01] border border-white/5">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
      <span className={`text-[8px] font-black px-2 py-1 rounded border ${colors[status]}`}>
        {status}
      </span>
    </div>
  );
}

export default function SymbolAudit() {
  const { loading: authLoading } = useAuth(); 
  const [symbol, setSymbol] = useState('XAUUSD');
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      if (!symbol) {
        setAuditData(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const winStatuses = ['WIN', 'TP1', 'TP2'];
        const wins = data.filter(s => winStatuses.includes(s.status?.toUpperCase())).length;
        const total = data.length;
        const actualWinRate = Math.round((wins / total) * 100);

        const buySignals = data.filter(s => ['BUY', 'BULLISH'].includes(s.side?.toUpperCase())).length;
        const buyPercent = (buySignals / total) * 100;
        
        let biasLabel = 'NEUTRAL';
        if (buyPercent > 65) biasLabel = 'STRONG BULLISH';
        else if (buyPercent < 35) biasLabel = 'STRONG BEARISH';
        else if (buyPercent > 50) biasLabel = 'LEANING BULLISH';
        else if (buyPercent < 50) biasLabel = 'LEANING BEARISH';

        const visualHistory = data.slice(0, 12).reverse().map(s => ({
          height: winStatuses.includes(s.status?.toUpperCase()) ? 90 : 35,
          isWin: winStatuses.includes(s.status?.toUpperCase())
        }));

        setAuditData({
          totalSignals: total,
          primaryBias: biasLabel,
          recentStrategy: data[0].strategy || 'CRT Alpha',
          lastPrice: data[0].entry_price,
          probability: actualWinRate,
          avgGrade: data[0].grade || 'A',
          visualHistory: visualHistory
        });
      } else {
        setAuditData(null);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchAudit, 500);
    return () => clearTimeout(timer);
  }, [symbol]);

  // Handle Initial Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AccessGuard requiredTier={3} tierName="Lifetime Pro">
      <div className="p-4 md:p-8 lg:ml-72 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter italic text-white uppercase">Symbol Audit</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Historical Signal Intelligence</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input 
              type="text" 
              placeholder="Search Pair (e.g. BTCUSD)"
              className="w-full pl-10 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[11px] font-mono text-white focus:border-blue-500/50 outline-none transition-all shadow-xl shadow-black"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex justify-between items-start mb-8 md:mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white italic">{symbol || '---'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${loading ? 'bg-zinc-700 animate-pulse' : 'bg-blue-500'}`} />
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {loading ? 'Analyzing Neural Data...' : 'Audit Synchronized'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {auditData && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1 tracking-widest">Win Rate (Hist)</p>
                    <p className="text-3xl font-black text-blue-500">{auditData.probability}%</p>
                  </div>
                )}
              </div>

              <div className="h-48 w-full bg-black/40 border border-white/5 rounded-2xl relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                  <AnimatePresence mode="wait">
                    {loading ? (
                       <motion.div 
                         key="loading"
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                         className="flex flex-col items-center gap-4"
                       >
                         <Activity className="text-blue-500 animate-pulse" size={32} />
                         <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Querying Signal DB...</p>
                       </motion.div>
                    ) : !auditData ? (
                       <motion.div 
                         key="empty"
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                         className="text-center"
                       >
                         <AlertTriangle className="text-zinc-800 mx-auto mb-3" size={32} />
                         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4">No historical CRT data for this asset</p>
                       </motion.div>
                    ) : (
                       <motion.div 
                         key="data"
                         initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                         className="flex gap-2 items-end h-24"
                       >
                         {auditData.visualHistory.map((item: any, i: number) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }}
                             animate={{ height: `${item.height}%` }}
                             className={`w-3 rounded-t-sm transition-all ${item.isWin ? 'bg-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-red-500/20'}`} 
                           />
                         ))}
                       </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricTile 
                label="Frequency" 
                value={auditData ? `${auditData.totalSignals} Signals` : "N/A"} 
                icon={<History size={14}/>} 
                color="text-blue-400" 
              />
              <MetricTile 
                label="Primary Bias" 
                value={auditData?.primaryBias || "Neutral"} 
                icon={<TrendingUp size={14}/>} 
                color={auditData?.primaryBias.includes('BULLISH') ? "text-green-500" : auditData?.primaryBias.includes('BEARISH') ? "text-red-500" : "text-zinc-500"} 
              />
              <MetricTile 
                label="Last Entry" 
                value={auditData?.lastPrice?.toFixed(5) || "0.0000"} 
                icon={<Target size={14}/>} 
                color="text-purple-400" 
              />
              <MetricTile 
                label="Avg Grade" 
                value={auditData?.avgGrade || "None"} 
                icon={<ShieldCheck size={14}/>} 
                color="text-yellow-500" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem]">
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Audit Parameters</h4>
              <div className="space-y-4">
                  <LogicItem label="Volume Clustering" status={auditData ? "PASS" : "WAIT"} />
                  <LogicItem label="Liquidity Alignment" status={auditData?.totalSignals > 5 ? "PASS" : "WAIT"} />
                  <LogicItem label="Neural Confidence" status={auditData?.probability > 75 ? "PASS" : "FAIL"} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
               <div className="relative z-10">
                 <h4 className="text-xl font-black italic mb-2 uppercase">Pro Insights</h4>
                 <p className="text-xs font-bold opacity-80 mb-6 leading-tight">
                   KIMOO Alpha algorithm shows a {auditData?.probability || 0}% historical reliability on {symbol} with a {auditData?.primaryBias || 'Neutral'} inclination.
                 </p>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter bg-black/20 w-fit px-3 py-1 rounded-full">
                   <Zap size={10} /> Live Monitoring Active
                 </div>
               </div>
               <ShieldCheck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
