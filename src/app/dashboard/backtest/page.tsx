"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, RotateCcw, TrendingUp, Target, BarChart3, 
  Settings2, Activity, History, DollarSign, Calendar,
  TrendingDown
} from 'lucide-react';

export default function BacktestPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  
  // --- INPUT STATES ---
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [rrRatio, setRrRatio] = useState(3);
  const [accountSize, setAccountSize] = useState(100000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const runSimulation = async () => {
    setIsSimulating(true);
    
    let query = supabase.from('signals').select('*').order('created_at', { ascending: true });
    
    if (selectedSymbol !== 'ALL') query = query.eq('symbol', selectedSymbol);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    
    const { data } = await query;

    setTimeout(() => {
      if (data && data.length > 0) {
        let currentBalance = accountSize;
        let runningR = 0;
        const curve: number[] = [0]; // Start at 0 gain
        
        const wins = data.filter(s => s.status === 'TP2').length;
        const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
        const losses = data.filter(s => s.status === 'SL').length;

        // --- REAL-TIME CALCULATION LOOP ---
        data.forEach((signal) => {
          if (signal.status === 'TP2') runningR += rrRatio;
          else if (signal.status === 'TP1 + SL (BE)') runningR += 0.5;
          else if (signal.status === 'SL') runningR -= 1;
          
          curve.push(runningR);
        });

        const riskAmount = accountSize * (riskPercent / 100);
        
        setEquityCurve(curve);
        setResults({
          winRate: ((wins + partials) / data.length * 100).toFixed(1),
          profitFactor: ((wins * rrRatio + partials * 0.5) / (losses || 1)).toFixed(2),
          totalSignals: data.length,
          equityGain: runningR.toFixed(2),
          cashProfit: (runningR * riskAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          wins, losses, partials
        });
      }
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="p-8 lg:p-12 bg-[#05070a] min-h-screen text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
            Strategy <span className="text-blue-500">Backtester</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-3">
            Real-Time Equity Simulation • KIMOO CRT Engine
          </p>
        </div>
        <button 
          onClick={runSimulation}
          disabled={isSimulating}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black italic tracking-widest transition-all"
        >
          {isSimulating ? <RotateCcw className="animate-spin" size={16} /> : <Play size={16} />}
          {isSimulating ? "COMPUTING..." : "GENERATE GROWTH GRAPH"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Inputs */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-zinc-500 border-b border-white/5 pb-4">
              <Settings2 size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Parameters</h3>
            </div>
            
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Instrument</label>
              <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-white outline-none">
                <option value="ALL">ALL PAIRS</option>
                <option value="EURUSD">EURUSD</option>
                <option value="GBPUSD">GBPUSD</option>
                <option value="USDJPY">USDJPY</option>
                <option value="GBPJPY">GBPJPY</option>
                <option value="AUDUSD">AUDUSD</option>
                <option value="EURJPY">EURJPY</option>
                <option value="NZDUSD">NZDUSD</option>
                <option value="CHFJPY">CHFJPY</option>
                <option value="US100">US100</option>
                <option value="US500">US500</option>
                <option value="US30">US30</option>
                <option value="XAUUSD">XAUUSD</option>
                <option value="XAGUSD">XAGUSD</option>
                <option value="XPTUSD">XPTUSD</option>
                <option value="XCUUSD">XCUUSD</option>
                <option value="SOLUSDT">SOLUSDT</option>
                <option value="XRPUSDT">XRPUSDT</option>
                <option value="BNBUSDT">BNBUSDT</option>
                <option value="ETHUSDT">ETHUSDT</option>
                <option value="BTCUSDT">BTCUSDT</option>
                <option value="TAOUSDT">TAOUSDT</option>
                <option value="ADAUSDT">ADAUSDT</option>
                <option value="DOGEUSDT">DOGEUSDT</option>
                <option value="AVAXUSDT">AVAXUSDT</option>
                <option value="DOTUSDT">DOTUSDT</option>
                <option value="NEARUSDT">NEARUSDT</option>
                <option value="LTCUSDT">LTCUSDT</option>
                <option value="TRXUSDT">TRXUSDT</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Capital ($)</label>
                <input type="number" value={accountSize} onChange={(e)=>setAccountSize(Number(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-mono text-blue-500 outline-none"/>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Risk (%)</label>
                <input type="number" step="0.1" value={riskPercent} onChange={(e)=>setRiskPercent(Number(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-mono text-blue-500 outline-none"/>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Reward Ratio ({rrRatio}:1)</label>
              <input type="range" min="1" max="10" step="0.5" value={rrRatio} onChange={(e) => setRrRatio(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Date Range</label>
               <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-mono text-zinc-500 outline-none mb-2"/>
               <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-mono text-zinc-500 outline-none"/>
            </div>
          </div>
        </div>

        {/* Results & Real-Time Graph */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ResultCard label="Profit Factor" value={results ? results.profitFactor : "0.00"} icon={<TrendingUp size={20}/>} color="text-green-500" />
              <ResultCard label="Realized P/L" value={results ? results.cashProfit : "$0.00"} icon={<DollarSign size={20}/>} color="text-blue-500" />
              <ResultCard label="Strategy Accuracy" value={results ? `${results.winRate}%` : "0%"} icon={<Target size={20}/>} color="text-purple-500" />
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-12 min-h-[500px] flex flex-col justify-between overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-12">Equity Growth Curve (Real-Time)</h4>
            
            <div className="flex-1 flex items-end gap-1 min-h-[250px]">
              <AnimatePresence mode="wait">
                {isSimulating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <BarChart3 size={40} className="text-blue-500 animate-bounce mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Processing Trade History...</p>
                  </div>
                ) : results ? (
                  <div className="w-full h-full flex items-end justify-between gap-[2px]">
                    {equityCurve.map((val, i) => {
                      // Calculate height based on min/max of the curve
                      const maxR = Math.max(...equityCurve, 1);
                      const minR = Math.min(...equityCurve, -1);
                      const range = maxR - minR;
                      const heightPercent = ((val - minR) / range) * 100;
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPercent, 2)}%` }}
                          transition={{ delay: i * 0.01, duration: 0.5 }}
                          className={`flex-1 rounded-t-sm transition-all ${val >= equityCurve[i-1] ? 'bg-blue-500/40 border-t border-blue-400' : 'bg-red-500/20 border-t border-red-400/30'}`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                    <History size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">No Simulation Data.<br/>Adjust Parameters and Run Backtest.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {results && (
              <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-4 gap-4 text-center">
                <StatItem label="Trades" val={results.totalSignals} />
                <StatItem label="Wins" val={results.wins} color="text-green-500" />
                <StatItem label="Partials" val={results.partials} color="text-yellow-500" />
                <StatItem label="Losses" val={results.losses} color="text-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function ResultCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] flex items-center justify-between group">
      <div>
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className={`text-3xl font-black tracking-tighter italic ${color}`}>{value}</p>
      </div>
      <div className={`${color} opacity-20`}>{icon}</div>
    </div>
  );
}

function StatItem({ label, val, color = "text-zinc-400" }: any) {
  return (
    <div>
      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black italic ${color}`}>{val}</p>
    </div>
  );
}
