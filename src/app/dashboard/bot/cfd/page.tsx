'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Zap, Cpu, ArrowRight, 
  Target, Activity, Terminal, AlertCircle,
  BarChart3, Settings2, Lock, CheckCircle2,
  Database, Radio, Layers, ZapIcon,
  Download, ExternalLink, HelpCircle,
  ArrowUpRight, Info, BookOpen, Globe,
  TrendingUp, Shield, MousePointer2,
  ListFilter, ZapOff
} from 'lucide-react';
import AccessGuard from '@/components/AccessGuard';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function CFDBotDocumentation() {
  return (
    <AccessGuard requiredTier={2} tierName="PRO">
      <div className="min-h-screen lg:ml-72 bg-transparent text-zinc-900 dark:text-zinc-100 pb-20 overflow-x-hidden">
        
        {/* Dynamic Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 blur-[120px] rounded-full" />
        </div>

        {/* Hero Section */}
        <div className="relative pt-16 pb-24 px-8 lg:px-16 border-b border-[var(--glass-border)] mb-16 z-10">
          <div className="max-w-[1600px] mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-8">
                <ShieldCheck size={12} />
                Kimoo Guardian Ecosystem
              </div>
              <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase mb-6 leading-tight">
                Kimoo Guardian <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Professional Documentation</span>
              </h1>
              <p className="text-zinc-500 text-sm md:text-base font-medium max-w-3xl leading-relaxed">
                Welcome to the Kimoo Guardian ecosystem. This document provides a deep-dive into the operational flow, technical architecture, and strategic configurations of our tiered trading bots.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-8 lg:px-16 relative z-10">
          <div className="space-y-32">
            
            {/* 1. BOT TIERS */}
            <section id="bot-tiers">
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Layers className="text-blue-500" size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">1. Bot Tiers: Pro vs. Ultimate</h2>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* PRO */}
                <motion.div {...fadeInUp} className="glass-panel p-10 rounded-[2.5rem] border border-[var(--glass-border)] relative overflow-hidden group">
                  <div className="flex flex-col gap-10 relative z-10">
                    <div>
                      <div className="p-5 bg-zinc-500/10 rounded-[2rem] border border-zinc-500/20 w-fit mb-8">
                        <Zap className="text-zinc-500" size={32} />
                      </div>
                      <h3 className="text-4xl font-black italic uppercase mb-2 tracking-tighter">Guardian <span className="text-zinc-500">PRO</span></h3>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-8 italic">Efficiency & Speed</p>
                    </div>
                    <div className="border-t border-[var(--glass-border)] pt-8 space-y-6">
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest italic leading-relaxed">Designed for high-speed trend following and efficient execution.</p>
                      <ul className="space-y-5">
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Execution:</strong> Pure Market Orders for instant participation.</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Safety:</strong> Built-in "Trend Alignment" gate (blocks Counter-trend signals).</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Ideal For:</strong> Traders who want to capture momentum as soon as it is confirmed by the SaaS engine.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                {/* ULTIMATE */}
                <motion.div {...fadeInUp} className="glass-panel p-10 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden group">
                  <div className="flex flex-col gap-10 relative z-10">
                    <div>
                      <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 w-fit mb-8">
                        <Cpu className="text-blue-500" size={32} />
                      </div>
                      <h3 className="text-4xl font-black italic uppercase mb-2 tracking-tighter">Guardian <span className="text-blue-500">ULTIMATE</span></h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8 italic">Institutional Standard</p>
                    </div>
                    <div className="border-t border-blue-500/10 pt-8 space-y-6">
                      <p className="text-sm font-bold text-blue-400 uppercase tracking-widest italic leading-relaxed">The institutional standard, offering granular control over entry and market context.</p>
                      <ul className="space-y-5">
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Execution:</strong> Supports <strong>OTE (Optimal Trade Entry)</strong> Limit Orders. Allows you to "snipe" the best price within a liquidity sweep zone.</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Market Regime Filter:</strong> Granular selection of Trending, Ranging, or Both market conditions.</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Sweep Quality Filter:</strong> Differentiates between Normal and High-impact liquidity grabs.</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <div className="mt-1 p-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <CheckCircle2 size={12} className="text-blue-500" />
                          </div>
                          <span className="text-[13px] leading-relaxed"><strong>Ideal For:</strong> Professional fund managers and high-capital traders requiring maximum precision.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* 2. THE PROCESS FLOW */}
            <section id="process">
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Radio className="text-blue-500" size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">2. The Process Flow (Cloud-to-Broker)</h2>
              </div>
              
              <p className="text-zinc-500 text-sm mb-12 font-medium tracking-wide">The Kimoo Guardian follows a strict 5-stage pipeline to ensure capital protection:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { stage: "Stage 1", title: "Authentication & Tier Sync", desc: "The bot connects to Datebase. It checks your email/license and retrieves your tier (Pro/Ultimate).", icon: Lock },
                  { stage: "Stage 2", title: "Signal Acquisition", desc: "The bot polls the SaaS signal stream every second. It checks for new IDs that haven't been processed.", icon: Radio },
                  { stage: "Stage 3", title: "Symbol Mapping (Auto-Sync)", desc: "The bot automatically detects your broker's specific naming convention. Example: US100 -> NAS100.", icon: Database },
                  { stage: "Stage 4", title: "The Filter Gate (The \"No-Trade\" Zone)", desc: "It checks Market Regime (Trend/Range/Both), HTF Alignment, RR minimums, and Exposure limits.", icon: ShieldCheck },
                  { stage: "Stage 5", title: "Execution & Management", desc: "Pro fires market orders. Ultimate places OTE Limit Orders. Runner management to Breakeven.", icon: Activity }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-panel p-8 rounded-[2rem] border border-[var(--glass-border)] flex flex-col gap-6 group hover:border-blue-500/20 transition-all duration-500"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-all">
                      <item.icon className="text-blue-500" size={28} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2 block">{item.stage}</span>
                      <h4 className="text-xl font-black uppercase tracking-tighter mb-2 italic">{item.title}</h4>
                      <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 3. HIGH PROBABILITY SETUPS */}
            <section id="setups">
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Target className="text-blue-500" size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">3. High-Probability Combinations</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* SETUP A */}
                <div className="glass-panel p-10 rounded-[2.5rem] border border-blue-500/20 bg-blue-500/[0.01]">
                  <h4 className="text-xl font-black uppercase tracking-tighter italic mb-4">A. Institutional Trend Snipe</h4>
                  <p className="text-[11px] text-zinc-500 italic mb-10 font-medium uppercase tracking-widest">High Accuracy Strategy</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { l: "Market Regime", v: "Trending" },
                      { l: "Allow Counter-Trend", v: "False" },
                      { l: "Min Sweep Quality", v: "High" },
                      { l: "Entry Mode", v: "OTE_Mid" },
                      { l: "Min RR", v: "1.5" }
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.l}</span>
                        <span className="text-xs font-black text-blue-500 uppercase tracking-tighter">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SETUP B */}
                <div className="glass-panel p-10 rounded-[2.5rem] border border-zinc-500/20">
                  <h4 className="text-xl font-black uppercase tracking-tighter italic mb-4">B. Range Boundary Reversal</h4>
                  <p className="text-[11px] text-zinc-500 italic mb-10 font-medium uppercase tracking-widest">Mean Reversion Play</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { l: "Market Regime", v: "Ranging" },
                      { l: "Allow Counter-Trend", v: "True" },
                      { l: "Min Sweep Quality", v: "Normal" },
                      { l: "Entry Mode", v: "OTE_Top" },
                      { l: "Min RR", v: "1.2" }
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.l}</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 uppercase tracking-tighter">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. PARAMETERS */}
            <section id="settings">
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Settings2 className="text-blue-500" size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">4. Control Panel Reference</h2>
              </div>

              <div className="overflow-hidden rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-zinc-500/5 border-b border-[var(--glass-border)]">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Parameter</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Type</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)] bg-zinc-500/[0.01]">
                    {[
                      { p: "Market Regime", t: "Dropdown", d: "Choose Trending for trend following or Ranging for mean reversion." },
                      { p: "Allow Counter-Trend", t: "Boolean", d: "Set to False to only trade signals moving with the HTF Trend." },
                      { p: "Min Sweep Quality", t: "Dropdown", d: "High filters for the most violent and clear liquidity grabs." },
                      { p: "Entry Execution", t: "Dropdown", d: "OTE_Mid is the institutional sweet spot for limit orders." },
                      { p: "Daily Risk Wallet", t: "Currency", d: "Total $ amount you are willing to lose in one day before the Kill-Switch activates." },
                      { p: "Max Concurrent", t: "Integer", d: "Limits active symbols to prevent over-exposure." },
                      { p: "Signal Cooldown", t: "Minutes", d: "Minimum time between signals for the same symbol." }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-blue-500/[0.02] transition-colors">
                        <td className="px-8 py-6 font-black uppercase italic tracking-tighter text-blue-500 text-lg">{row.p}</td>
                        <td className="px-8 py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{row.t}</td>
                        <td className="px-8 py-6 text-sm text-zinc-500 leading-relaxed font-medium">{row.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. TROUBLESHOOTING */}
            <section id="troubleshooting" className="pb-32">
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Terminal className="text-blue-500" size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">5. Troubleshooting & Logs</h2>
              </div>

              <div className="bg-[#0a0c10] rounded-[3rem] p-12 border border-zinc-800 shadow-2xl">
                <p className="text-zinc-500 text-[11px] mb-12 font-bold uppercase tracking-[0.2em] italic">Check Experts Tab (MT5) or Algo (cTrader) for indicators:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 font-mono">
                  {[
                    { code: "✅ EXECUTED", desc: "Trade successful.", color: "green" },
                    { code: "🔄 SYNC", desc: "Symbol mapped successfully.", color: "blue" },
                    { code: "⏭️ SKIP", desc: "Filter rejected the trade.", color: "orange" },
                    { code: "🔴 KILL-SWITCH", desc: "Daily loss limit hit.", color: "red" }
                  ].map((item, i) => (
                    <div key={i} className="space-y-3">
                      <p className={`text-[11px] font-bold uppercase tracking-widest text-${item.color}-500`}>{item.code}</p>
                      <p className="text-[10px] text-zinc-600 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="max-w-[1600px] mx-auto px-16 mt-32 opacity-30 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent mb-8" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">
            © 2026 Kimoo SaaS Guardian. Institutional Documentation.
          </p>
        </div>
      </div>
    </AccessGuard>
  );
}
