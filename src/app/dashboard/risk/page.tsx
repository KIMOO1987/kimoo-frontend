"use client";

import { useKimoo } from '@/context/KimooContext';
import { ShieldCheck, Target, TrendingDown, DollarSign } from 'lucide-react';

export default function RiskPage() {
  const { risk, setRisk } = useKimoo();

  const updateRisk = (key: string, val: string | number) => {
    setRisk((prev: any) => ({ ...prev, [key]: Number(val) }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter">Institutional Risk Rules</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Hard-coded protection for your equity</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Drawdown Rule */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] hover:border-red-500/20 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <TrendingDown size={24} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs">Max Daily Loss</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-zinc-600 font-black text-2xl">$</span>
            <input 
              type="number" 
              value={risk.lossLimit}
              onChange={(e) => updateRisk('lossLimit', e.target.value)}
              className="bg-transparent text-5xl font-black text-white outline-none w-full"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-bold tracking-tighter">Terminal will block entries after this limit is hit.</p>
        </div>

        {/* Per Trade Risk */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] hover:border-blue-500/20 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs">Risk Per Trade</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <input 
              type="number" 
              step="0.1"
              value={risk.riskPerTrade}
              onChange={(e) => updateRisk('riskPerTrade', e.target.value)}
              className="bg-transparent text-5xl font-black text-white outline-none w-full"
            />
            <span className="text-zinc-600 font-black text-2xl">%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-bold tracking-tighter">Lot size is automatically calculated based on this %.</p>
        </div>

        {/* Target R:R */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] hover:border-green-500/20 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
              <Target size={24} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs">Standard R:R Ratio</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-zinc-600 font-black text-2xl">1 :</span>
            <input 
              type="number" 
              step="0.5"
              value={risk.rrRatio}
              onChange={(e) => updateRisk('rrRatio', e.target.value)}
              className="bg-transparent text-5xl font-black text-white outline-none w-full"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-bold tracking-tighter">Minimum acceptable CRT trade structure.</p>
        </div>

        {/* Profit Target */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] hover:border-zinc-500/20 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-zinc-500/10 rounded-2xl text-zinc-300">
              <DollarSign size={24} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs">Daily Profit Goal</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-zinc-600 font-black text-2xl">$</span>
            <input 
              type="number" 
              value={risk.profitLimit}
              onChange={(e) => updateRisk('profitLimit', e.target.value)}
              className="bg-transparent text-5xl font-black text-white outline-none w-full"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-bold tracking-tighter">Psychological target for session closure.</p>
        </div>
      </div>
    </div>
  );
}