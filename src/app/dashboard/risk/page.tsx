"use client";

import { useKimoo } from '@/context/KimooContext';
import { ShieldCheck, Target, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RiskPage() {
  const { risk, setRisk } = useKimoo();

  const updateRisk = (key: string, val: string | number) => {
    setRisk((prev: any) => ({ ...prev, [key]: Number(val) }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <header>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase text-white">
          Risk <span className="text-blue-500">Parameters</span>
        </h1>
        <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold mt-2">
          Institutional Safety Protocols & Equity Protection
        </p>
      </header>

      {/* Settings Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Daily Drawdown Rule */}
        <motion.div 
          variants={cardVariants}
          className="group bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-red-500/20 transition-all duration-500 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
              <TrendingDown size={28} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-400 leading-none">Max Daily Loss</h3>
              <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">Hard Terminal Stop</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-3 border-b border-white/5 pb-4 focus-within:border-red-500/30 transition-colors">
            <span className="text-zinc-700 font-black text-3xl italic">$</span>
            <input 
              type="number" 
              value={risk.lossLimit}
              onChange={(e) => updateRisk('lossLimit', e.target.value)}
              className="bg-transparent text-5xl md:text-6xl font-black text-white outline-none w-full tracking-tighter"
              placeholder="0"
            />
          </div>
          <p className="text-[9px] text-zinc-500 mt-6 uppercase font-black tracking-[0.2em] opacity-50">
            The terminal will automatically disable execution once this threshold is breached.
          </p>
        </motion.div>

        {/* Per Trade Risk */}
        <motion.div 
          variants={cardVariants}
          className="group bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/20 transition-all duration-500 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-400 leading-none">Risk Per Trade</h3>
              <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">Auto-Lot Calculation</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-b border-white/5 pb-4 focus-within:border-blue-500/30 transition-colors">
            <input 
              type="number" 
              step="0.1"
              value={risk.riskPerTrade}
              onChange={(e) => updateRisk('riskPerTrade', e.target.value)}
              className="bg-transparent text-5xl md:text-6xl font-black text-white outline-none w-full tracking-tighter"
              placeholder="0.5"
            />
            <span className="text-zinc-700 font-black text-3xl italic">%</span>
          </div>
          <p className="text-[9px] text-zinc-500 mt-6 uppercase font-black tracking-[0.2em] opacity-50">
            Smart lot sizing adjusts based on entry distance and current equity.
          </p>
        </motion.div>

        {/* Target R:R */}
        <motion.div 
          variants={cardVariants}
          className="group bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-green-500/20 transition-all duration-500 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
              <Target size={28} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-400 leading-none">Standard R:R Ratio</h3>
              <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">Execution Filter</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-b border-white/5 pb-4 focus-within:border-green-500/30 transition-colors">
            <span className="text-zinc-700 font-black text-3xl italic">1 :</span>
            <input 
              type="number" 
              step="0.5"
              value={risk.rrRatio}
              onChange={(e) => updateRisk('rrRatio', e.target.value)}
              className="bg-transparent text-5xl md:text-6xl font-black text-white outline-none w-full tracking-tighter"
              placeholder="2.0"
            />
          </div>
          <p className="text-[9px] text-zinc-500 mt-6 uppercase font-black tracking-[0.2em] opacity-50">
            Minimum risk-to-reward ratio required to validate a CRT structure.
          </p>
        </motion.div>

        {/* Profit Target */}
        <motion.div 
          variants={cardVariants}
          className="group bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-zinc-500/20 transition-all duration-500 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-zinc-500/10 rounded-2xl text-zinc-300 group-hover:scale-110 transition-transform">
              <DollarSign size={28} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-400 leading-none">Daily Profit Goal</h3>
              <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">Session Target</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-b border-white/5 pb-4 focus-within:border-zinc-500/30 transition-colors">
            <span className="text-zinc-700 font-black text-3xl italic">$</span>
            <input 
              type="number" 
              value={risk.profitLimit}
              onChange={(e) => updateRisk('profitLimit', e.target.value)}
              className="bg-transparent text-5xl md:text-6xl font-black text-white outline-none w-full tracking-tighter"
              placeholder="0"
            />
          </div>
          <p className="text-[9px] text-zinc-500 mt-6 uppercase font-black tracking-[0.2em] opacity-50">
            Psychological exit point. Helps prevent over-trading after a successful session.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}