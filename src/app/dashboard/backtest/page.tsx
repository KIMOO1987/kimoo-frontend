"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AccessGuard from '@/components/AccessGuard'; // Added AccessGuard
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, RotateCcw, TrendingUp, Target, BarChart3, 
  Settings2, Activity, History, DollarSign,
  TrendingDown, Layers, Wallet, Percent, ArrowUpRight
} from 'lucide-react';

export default function BacktestPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  // --- INPUT STATES ---
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [rrRatio, setRrRatio] = useState(3);
  const [accountSize, setAccountSize] = useState(100000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Load cached inputs and results to instantly restore the last backtest
    const cachedInputs = sessionStorage.getItem('backtest_inputs_cache');
    const cachedResults = sessionStorage.getItem('backtest_results_cache');

    if (cachedInputs) {
      try {
        const inputs = JSON.parse(cachedInputs);
        setSelectedSymbol(inputs.selectedSymbol || 'ALL');
        setRrRatio(inputs.rrRatio || 3);
        setAccountSize(inputs.accountSize || 100000);
        setRiskPercent(inputs.riskPercent || 1);
        setStartDate(inputs.startDate || '');
        setEndDate(inputs.endDate || '');
      } catch (e) {}
    }

    if (cachedResults) {
      try {
        const res = JSON.parse(cachedResults);
        setResults(res.results);
        setEquityCurve(res.equityCurve || []);
      } catch (e) {}
    }
  }, []);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    let query = supabase.from('signals').select('*').order('created_at', { ascending: true });
    
    if (selectedSymbol !== 'ALL') query = query.eq('symbol', selectedSymbol);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    
    const { data } = await query;

    setTimeout(() => {
      if (data && data.length > 0) {
        let runningR = 0;
        let peakR = 0;
        let maxDD = 0;
        const curve: number[] = [0]; 
        
        const wins = data.filter(s => s.status === 'TP2').length;
        const partials = data.filter(s => s.status === 'TP1 + SL (BE)').length;
        const losses = data.filter(s => s.status === 'SL').length;

        data.forEach((signal) => {
          if (signal.status === 'TP2') runningR += rrRatio;
          else if (signal.status === 'TP1 + SL (BE)') runningR += 0.5;
          else if (signal.status === 'SL') runningR -= 1;
          
          if (runningR > peakR) peakR = runningR;
          const currentDD = peakR - runningR;
          if (currentDD > maxDD) maxDD = currentDD;
          
          curve.push(runningR);
        });

        const riskAmount = accountSize * (riskPercent / 100);
        
        const generatedResults = {
          winRate: ((wins + partials) / data.length * 100).toFixed(1),
          profitFactor: ((wins * rrRatio + partials * 0.5) / Math.abs(losses || 1)).toFixed(2),
          totalSignals: data.length,
          equityGain: runningR.toFixed(2),
          maxDrawdown: maxDD.toFixed(1),
          cashProfit: (runningR * riskAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          wins, losses, partials,
          avgTrade: (runningR / data.length).toFixed(2)
        };

        setEquityCurve(curve);
        setResults(generatedResults);

        // Cache the latest simulation so it survives a refresh
        sessionStorage.setItem('backtest_inputs_cache', JSON.stringify({
          selectedSymbol, rrRatio, accountSize, riskPercent, startDate, endDate
        }));
        sessionStorage.setItem('backtest_results_cache', JSON.stringify({
          results: generatedResults,
          equityCurve: curve
        }));
      }
      setIsSimulating(false);
    }, 1200);
  };


  return (
    <AccessGuard requiredTier={2} tierName="PRO">
      <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
        
        {/* Ambient Glowing Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
                Strategy<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Backtest</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
                • REAL-TIME EQUITY SIMULATION • KIMOO CRT ENGINE •
              </p>
            </div>
            
            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className={`w-full xl:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] border ${
                isSimulating 
                  ? 'bg-white/[0.05] border-white/10 text-zinc-500 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-blue-500/30 text-white'
              }`}
            >
              {isSimulating ? <RotateCcw className="animate-spin text-zinc-400" size={16} /> : <Play size={16} className="text-blue-200" />}
              {isSimulating ? "COMPUTING..." : "GENERATE GROWTH GRAPH"}
            </button>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Sidebar Inputs */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] space-y-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 text-zinc-400 border-b border-white/5 pb-6 mb-6">
                <Settings2 size={14} />
                <h3 className="text-[11px] font-black uppercase tracking-widest">Test Parameters</h3>
              </div>
              
              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><Layers size={10} /> Instrument</label>
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer appearance-none">
                  <option value="ALL">ALL PAIRS</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="USDJPY">USDJPY</option>
                  <option value="GBPJPY">GBPJPY</option>
                  <option value="AUDUSD">AUDUSD</option>
                  <option value="EURJPY">EURJPY</option>
                  <option value="NZDUSD">NZDUSD</option>
                  <option value="CHFJPY">CHFJPY</option>
                  <option value="XAUUSD">XAUUSD</option>
                  <option value="XAGUSD">XAGUSD</option>
                  <option value="XPTUSD">XPTUSD</option>
                  <option value="XCUUSD">XCUUSD</option>
                  <option value="US100">US100</option>
                  <option value="US500">US500</option>
                  <option value="US30">US30</option>
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="SOLUSDT">SOLUSDT</option>
                  <option value="XRPUSDT">XRPUSDT</option>
                  <option value="BNBUSDT">BNBUSDT</option>
                  <option value="ETHUSDT">ETHUSDT</option>
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
                  <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-1.5"><Wallet size={10}/> Capital ($)</label>
                  <input type="number" value={accountSize} onChange={(e)=>setAccountSize(Number(e.target.value))} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-blue-400 outline-none focus:border-blue-500/50 hover:border-white/20 transition-all"/>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-1.5"><Percent size={10}/> Risk (%)</label>
                  <input type="number" step="0.1" value={riskPercent} onChange={(e)=>setRiskPercent(Number(e.target.value))} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-blue-400 outline-none focus:border-blue-500/50 hover:border-white/20 transition-all"/>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><Target size={10}/> Reward Ratio ({rrRatio}:1)</label>
                <input type="range" min="1" max="10" step="0.5" value={rrRatio} onChange={(e) => setRrRatio(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
              </div>

              <div className="space-y-2 pt-2">
                 <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Date Range</label>
                 <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-zinc-400 outline-none focus:border-blue-500/50 hover:border-white/20 transition-all mb-3 cursor-pointer"/>
                 <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono text-zinc-400 outline-none focus:border-blue-500/50 hover:border-white/20 transition-all cursor-pointer"/>
              </div>
            </div>
          </div>

          {/* Results & Real-Time Graph */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <ResultCard label="Profit Factor" value={results ? results.profitFactor : "0.00"} icon={<TrendingUp size={20}/>} color="text-emerald-400" />
                <ResultCard label="Realized P/L" value={results ? results.cashProfit : "$0.00"} icon={<DollarSign size={20}/>} color="text-blue-400" />
                <ResultCard label="Accuracy" value={results ? `${results.winRate}%` : "0%"} icon={<Target size={20}/>} color="text-indigo-400" />
                <ResultCard label="Max Drawdown" value={results ? `-${results.maxDrawdown}R` : "0.0R"} icon={<TrendingDown size={20}/>} color="text-red-400" />
            </div>

            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] shadow-2xl backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 min-h-[500px] flex flex-col justify-between overflow-hidden relative">
              <div className="flex justify-between items-start mb-8">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white italic drop-shadow-md">Equity Growth Curve</h4>
                {results && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Avg Expectancy</p>
                    <p className="text-sm font-black text-blue-400">+{results.avgTrade}R / Trade</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex items-end gap-1 min-h-[300px] relative mt-4">
                <AnimatePresence mode="wait">
                  {isSimulating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <BarChart3 size={40} className="text-zinc-600 animate-bounce mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Processing Timeline...</p>
                    </div>
                  ) : results && equityCurve.length > 0 ? (
                    <div 
                      className="w-full h-full relative"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const idx = Math.floor((x / rect.width) * (equityCurve.length - 1));
                        setHoverIndex(Math.max(0, Math.min(idx, equityCurve.length - 1)));
                      }}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid Lines */}
                        {[0, 100, 200, 300, 400].map(y => (
                          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="white" strokeOpacity="0.03" strokeWidth="1" />
                        ))}
                        {/* Path Logic */}
                        {(() => {
                          const max = Math.max(...equityCurve, 1);
                          const min = Math.min(...equityCurve, -1);
                          const range = max - min;
                          const getX = (i: number) => (i / (equityCurve.length - 1)) * 1000;
                          const getY = (v: number) => 400 - (((v - min) / range) * 350 + 25);
                          
                          const pathData = equityCurve.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
                          const areaData = `${pathData} L 1000 400 L 0 400 Z`;

                          return (
                            <>
                              <path d={areaData} fill="url(#curveGradient)" />
                              <motion.path 
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                d={pathData} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                              />
                              {hoverIndex !== null && (
                                <g>
                                  <line x1={getX(hoverIndex)} y1="0" x2={getX(hoverIndex)} y2="400" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" />
                                  <circle cx={getX(hoverIndex)} cy={getY(equityCurve[hoverIndex])} r="6" fill="#3b82f6" />
                                  <foreignObject x={getX(hoverIndex) > 800 ? getX(hoverIndex)-120 : getX(hoverIndex)+10} y={getY(equityCurve[hoverIndex])-60} width="120" height="50">
                                    <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-2 backdrop-blur-md shadow-xl">
                                      <p className="text-[9px] font-black text-zinc-500 uppercase">Trade #{hoverIndex}</p>
                                      <p className="text-xs font-black text-blue-400 italic">{equityCurve[hoverIndex].toFixed(2)}R</p>
                                    </div>
                                  </foreignObject>
                                </g>
                              )}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <History size={48} className="text-zinc-700 mb-6" />
                      <p className="text-sm font-bold uppercase tracking-widest text-center leading-relaxed text-zinc-600">No Simulation Data.<br/>Adjust Parameters and Run Backtest.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {results && (
                <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-4 gap-4 text-center">
                  <StatItem label="Trades" val={results.totalSignals} />
                  <StatItem label="Wins" val={results.wins} color="text-emerald-400" />
                  <StatItem label="Partials" val={results.partials} color="text-yellow-400" />
                  <StatItem label="Losses" val={results.losses} color="text-red-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AccessGuard>
  );
}

// Sub-components
function ResultCard({ label, value, icon, color }: any) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-300 group shadow-2xl flex items-center justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-2xl md:text-3xl font-black tracking-tighter italic drop-shadow-md ${color}`}>{value}</p>
      </div>
      <div className={`relative z-10 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] ${color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>{icon}</div>
    </div>
  );
}

function StatItem({ label, val, color = "text-zinc-400" }: any) {
  return (
    <div>
      <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-xl md:text-2xl font-black italic ${color} drop-shadow-sm`}>{val}</p>
    </div>
  );
}
