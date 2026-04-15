"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X, Menu, ShieldCheck,
  Terminal, Activity, Cpu
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const menuGroups = [
  { 
    label: 'TERMINAL', 
    items: [
      { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard', minTier: 0 },
      { name: 'Active Trades', icon: Clock, path: '/dashboard/active', minTier: 1 },
      { name: 'Trade History', icon: History, path: '/dashboard/history', minTier: 1 },
    ]
  },
  { 
    label: 'RADAR & ANALYSIS',
    items: [
      { name: 'All Signals', icon: Zap, path: '/dashboard/signals', minTier: 1 },
      { name: 'Alpha Radar', icon: Compass, path: '/dashboard/radar', minTier: 2 },
      { name: 'Symbol Audit', icon: BarChart3, path: '/dashboard/audit', minTier: 2 },
    ]
  },
  { 
    label: 'STRATEGY LAB', 
    items: [
      { name: 'Backtest Simulator', icon: CheckSquare, path: '/dashboard/backtest', minTier: 3 },
      { name: 'Performance', icon: LineChart, path: '/dashboard/performance', minTier: 3 },
    ]
  },
  { 
    label: 'ACCOUNT & SETTINGS',
    items: [
      { name: 'Profile', icon: User, path: '/dashboard/profile', minTier: 0 },
      { name: 'Payments', icon: CreditCard, path: '/dashboard/payments', minTier: 0 },
    ]
  },
  { 
    label: 'AUTO EXECUATION PLATFORMS',
    items: [
      { name: 'MT5', icon: Terminal, path: '/dashboard/mt5', minTier: 0 },
      { name: 'cTrader', icon: (props: { size?: number }) => <img src="/ctrader-logo.png" alt="cTrader" width={props.size || 18} height={props.size || 18} className="object-contain" />, path: '/dashboard/ctrader', minTier: 3 },
      { name: 'Binance', icon: (props: { size?: number }) => <img src="/binance.png" alt="Binance" width={props.size || 18} height={props.size || 18} className="object-contain" />, path: '/dashboard/binance', minTier: 3 },
      { name: 'OKX', icon: (props: { size?: number }) => <img src="/okx.png" alt="OKX" width={props.size || 18} height={props.size || 18} className="object-contain" />, path: '/dashboard/okx', minTier: 3 },
      { name: 'MEXC', icon: (props: { size?: number }) => <img src="/mexc.png" alt="MEXC" width={props.size || 18} height={props.size || 18} className="object-contain" />, path: '/dashboard/mexc', minTier: 3 },
      { name: 'Kraken', icon: (props: { size?: number }) => <img src="/kraken.png" alt="Kraken" width={props.size || 18} height={props.size || 18} className="object-contain" />, path: '/dashboard/kraken', minTier: 3 },
    ]
  }
];

export default function MobileNav({ tier, role }: { tier: number; role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isStaff = role === 'admin' || role === 'moderator';

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  };

  return (
    <div className="lg:hidden">
      <button onClick={() => setIsOpen(true)} className="fixed bottom-8 left-6 z-[999] p-4 bg-blue-600 rounded-full text-white shadow-2xl border border-white/20 active:scale-95 transition-all">
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-0 z-[1000] bg-[#030407] flex flex-col p-8 w-full h-full">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/10 blur-[120px] pointer-events-none" />
            
            <div className="flex justify-between items-center mb-10 shrink-0 relative z-10">
              <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-md">KIMOO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">PRO</span></h1>
                {isStaff && (
                  <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <ShieldCheck size={10} className="text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{role} Mode</span>
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={32} /></button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-10 no-scrollbar pb-20 relative z-10">
              {menuGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-black text-zinc-600 tracking-[0.25em] mb-4 px-3 uppercase">{group.label}</p>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.path;
                      const isLocked = !isStaff && tier < item.minTier;
                      
                      return (
                        <Link key={item.name} href={isLocked ? "#" : item.path} onClick={() => !isLocked && setIsOpen(false)}>
                          <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 border ${
                            isActive ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-zinc-500 bg-white/[0.02] border-white/[0.05] hover:text-zinc-200 hover:bg-white/[0.04]'
                          } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex items-center gap-4">
                              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                              <span className="font-bold text-sm tracking-tight">{item.name}</span>
                            </div>
                            {isLocked ? <Lock size={14} className="text-zinc-700" /> : isActive && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.8)]" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 shrink-0 relative z-10">
              <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-4 text-zinc-500 bg-white/[0.01] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 hover:text-red-400 transition-all rounded-xl w-full group hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">SIGN OUT</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
