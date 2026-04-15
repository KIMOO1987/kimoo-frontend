"use client";

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  TrendingUp, Zap, Star, Activity, BarChart3, Target, Layers,
  Wallet, CheckCircle2, XCircle, MinusCircle, Percent, Save, Mail, TrendingDown,
  Info, AlertCircle, ChevronRight, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardClientProps {
  tier: number; expiryDate?: string | null; userProfile: any; 
}

export default function DashboardClient({ tier, expiryDate, userProfile }: DashboardClientProps) {
  const [accountSize, setAccountSize] = useState(userProfile?.account_size || 10000); 
  const [riskValue, setRiskValue] = useState(userProfile?.risk_value || 1.0); 
  const [rewardValue, setRewardValue] = useState(userProfile?.reward_value || 2.0); 
  const [timeframe, setTimeframe] = useState('all');
  const [assetClass, setAssetClass] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [realStats, setRealStats] = useState<any>({});

  const fetchData = useCallback(async (isSilent = false) => {
    if (!userProfile?.id) return;
    if (!isSilent) setIsInitialLoad(true);

    const { data } = await supabase.rpc('get_client_dashboard_data', {
      p_user_id: userProfile.id,
      p_account_size: accountSize,
      p_risk_percent: riskValue,
      p_reward_ratio: rewardValue,
      p_timeframe: timeframe,
      p_asset_class: assetClass
    });

    if (data) {
      setRealStats(data);
      setChartData(data.chartData || []);
      setRecentSignals(data.recentSignals || []);
    }
    setIsInitialLoad(false);
  }, [userProfile?.id, accountSize, riskValue, rewardValue, timeframe, assetClass]);

  useEffect(() => {
    const delay = setTimeout(fetchData, 500);
    const interval = setInterval(() => fetchData(true), 300000); // 5-minute safety
    return () => { clearTimeout(delay); clearInterval(interval); };
  }, [fetchData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await supabase.from('profiles').update({ account_size: accountSize, risk_value: riskValue, reward_value: rewardValue }).eq('id', userProfile.id);
    setIsSaving(false);
  };

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <h1 className="text-2xl md:text-4xl font-black italic uppercase">Client<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Dashboard</span></h1>
        </div>

        {/* SETTINGS CARD */}
        <div className="mb-10 p-6 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-2xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <InputBox label="Account Size" value={accountSize} onChange={setAccountSize} prefix="$" color="emerald" />
                <InputBox label="Risk per SL" value={riskValue} onChange={setRiskValue} suffix="R" color="red" />
                <InputBox label="Reward per TP" value={rewardValue} onChange={setRewardValue} suffix="R" color="blue" />
                <SelectBox label="Scope" value={timeframe} onChange={setTimeframe} options={[{v:'all', l:'All Time'}, {v:'daily', l:'Daily'}, {v:'weekly', l:'Weekly'}]} />
                <SelectBox label="Asset" value={assetClass} onChange={setAssetClass} options={[{v:'ALL', l:'All Assets'}, {v:'CRYPTO', l:'Crypto'}, {v:'FOREX', l:'Forex'}]} />
                <button onClick={handleSaveSettings} disabled={isSaving} className="h-[50px] self-end bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-lg border border-white/10">{isSaving ? 'Saving' : 'Save Config'}</button>
            </div>
        </div>

        {isInitialLoad ? (
           <div className="w-full py-24 flex flex-col items-center justify-center border border-white/5 rounded-[2.5rem] bg-white/[0.02] animate-pulse"><Activity size={40} className="text-zinc-700" /></div>
        ) : (
          <>
            {/* 16 METRIC CARDS RESTORED */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
               <StatCard label="Total Signals" value={realStats.total} icon={<Activity size={18}/>} />
               <StatCard label="Total Wins" value={realStats.totalWins} icon={<CheckCircle2 size={18}/>} color="text-emerald-400" />
               <StatCard label="Total Losses" value={realStats.totalLosses} icon={<XCircle size={18}/>} color="text-red-500" />
               <StatCard label="Total BE" value={realStats.totalBE} icon={<MinusCircle size={18}/>} color="text-zinc-400" />
               <StatCard label="Win Rate" value={realStats.winRate} icon={<TrendingUp size={18}/>} color="text-emerald-400" />
               <StatCard label="Total R:R" value={realStats.totalRR} icon={<Zap size={18}/>} color="text-indigo-400" />
               <StatCard label="Net Profit" value={realStats.profitUSD} icon={<Wallet size={18}/>} color="text-emerald-500" />
               <StatCard label="Profit Factor" value={realStats.profitFactor || "0.00"} icon={<Star size={18}/>} color="text-blue-400" />
               <StatCard label="Expectancy" value={realStats.expectancy || "0.00R"} icon={<Layers size={18}/>} />
               <StatCard label="Max Drawdown" value={realStats.maxDrawdown || "0.00R"} icon={<TrendingDown size={18}/>} color="text-red-400" />
               <StatCard label="Long WR" value={realStats.longWR || "0%"} sub="Buy Side" />
               <StatCard label="Short WR" value={realStats.shortWR || "0%"} sub="Sell Side" />
            </div>

            {/* GRAPHS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-8 rounded-[2.5rem] shadow-2xl">
                   <h3 className="text-xl font-black italic uppercase mb-6">Equity Curve</h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                            <defs><linearGradient id="colorRR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                            <XAxis dataKey="name" hide /><YAxis stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}R`} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', color: '#fff' }} />
                            <Area type="monotone" dataKey="rr" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRR)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center text-center">
                   <h3 className="text-xl font-black italic uppercase mb-6">Outcome Split</h3>
                   <div className="h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={[{ name: 'Wins', value: realStats.totalWins }, { name: 'Losses', value: realStats.totalLosses }, { name: 'BE', value: realStats.totalBE }]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                               <Cell fill="#34d399" /><Cell fill="#ef4444" /><Cell fill="#52525b" />
                            </Pie>
                            <RechartsTooltip />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
            </div>

            {/* RECENT ACTIVITY TABLE */}
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] rounded-[2.5rem] p-6 md:p-10 shadow-2xl mb-12">
               <h3 className="text-xl font-black italic uppercase text-white mb-6 border-b border-white/5 pb-4">Recent Signals</h3>
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/5">
                      <th className="pb-4">Asset</th><th>Side</th><th>Entry</th><th>Status</th><th>R:R</th><th>T.F.</th><th className="text-center">Grade</th><th className="text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentSignals.map((s, i) => (
                      <tr key={s.id || i} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-5 font-black italic text-white uppercase">{s.symbol}</td>
                        <td className={`py-5 font-black text-[11px] ${s.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{s.side}</td>
                        <td className="py-5 text-[11px] font-mono text-zinc-400">{Number(s.entry_price || 0).toFixed(5)}</td>
                        <td className="py-5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{s.status}</td>
                        <td className={`py-5 font-mono font-black ${s.trade_r > 0 ? 'text-emerald-400' : s.trade_r < 0 ? 'text-red-400' : 'text-zinc-500'}`}>{s.trade_r > 0 ? '+' : ''}{Number(s.trade_r || 0).toFixed(2)}R</td>
                        <td className="py-5 text-[11px] font-mono text-zinc-500">{s.tf_alignment || '5M'}</td>
                        <td className="py-5 text-center"><span className="px-2.5 py-1 border border-white/10 bg-white/5 rounded text-[9px] font-black">{s.grade || 'A'}</span></td>
                        <td className="py-5 text-center text-[10px] font-mono text-zinc-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// UI Components
function InputBox({ label, value, onChange, prefix, suffix, color }: any) {
  return (
    <div className="flex flex-col w-full group">
       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{label}</span>
       <div className={`flex items-center bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 transition-all group-hover:border-${color === 'emerald' ? 'emerald' : color === 'red' ? 'red' : 'blue'}-500/50`}>
          {prefix && <span className="text-zinc-500 font-black text-sm mr-2">{prefix}</span>}
          <input type="number" step="0.1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent text-white font-black text-lg w-full outline-none" />
          {suffix && <span className="text-zinc-500 font-black text-sm ml-2">{suffix}</span>}
       </div>
    </div>
  );
}

function SelectBox({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col w-full">
       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{label}</span>
       <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 hover:border-white/20">
          <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-white font-black text-lg w-full outline-none appearance-none">
            {options.map((o: any) => <option key={o.v} value={o.v} className="bg-[#05070a]">{o.l}</option>)}
          </select>
       </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-white", tooltip }: any) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 rounded-[2rem] hover:bg-white/[0.06] transition-all duration-300 shadow-xl group">
       <div className="flex justify-between items-start mb-6">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
          <div className={`${color} opacity-40 group-hover:opacity-100 transition-opacity`}>{icon}</div>
       </div>
       <p className={`text-2xl font-black tracking-tight ${color} drop-shadow-md`}>{value || '---'}</p>
       {sub && <p className="text-[8px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">{sub}</p>}
    </div>
  );
}
