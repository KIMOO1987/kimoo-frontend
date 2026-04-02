"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X, Menu, ShieldCheck 
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
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="lg:hidden">
      <button onClick={() => setIsOpen(true)} className="fixed bottom-8 left-6 z-[999] p-4 bg-blue-600 rounded-full text-white shadow-2xl border border-white/20 active:scale-95 transition-all">
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-0 z-[1000] bg-[#05070a] flex flex-col p-8 w-full h-full">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter">KIMOO CRT<span className="text-blue-500">(+Pro)</span></h1>
                {isStaff && <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mt-1">{role} Mode</span>}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={32} /></button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-10 no-scrollbar pb-20">
              {menuGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-black text-zinc-700 tracking-[0.2em] mb-4 px-2 uppercase">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.path;
                      const isLocked = !isStaff && tier < item.minTier;
                      
                      return (
                        <Link key={item.name} href={isLocked ? "#" : item.path} onClick={() => !isLocked && setIsOpen(false)}>
                          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                            isActive ? 'bg-blue-600 text-white border-blue-400/20 shadow-lg' : 'text-zinc-400 bg-white/[0.02] border-transparent'
                          } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex items-center gap-4">
                              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                              <span className="font-bold text-sm tracking-tight">{item.name}</span>
                            </div>
                            {isLocked ? <Lock size={14} className="text-zinc-800" /> : isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 bg-[#05070a] shrink-0">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full p-4 text-zinc-500 hover:text-red-500 transition-colors font-black uppercase text-[10px] tracking-widest">
                <LogOut size={18} /> Terminate Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
