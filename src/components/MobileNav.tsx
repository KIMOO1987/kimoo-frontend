"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X, Menu 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const menuGroups = [
  { 
    label: 'TERMINAL', 
    items: [
      { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard', pro: false },
      { name: 'Active Trades', icon: Clock, path: '/dashboard/active', pro: true },
      { name: 'Trade History', icon: History, path: '/dashboard/history', pro: true },
    ]
  },
  { 
    label: 'RADAR & ANALYSIS', 
    items: [
      { name: 'All Signals', icon: Zap, path: '/dashboard/signals', pro: false },
      { name: 'Alpha Radar', icon: Compass, path: '/dashboard/radar', pro: false },
      { name: 'Symbol Audit', icon: BarChart3, path: '/dashboard/audit', pro: false },
    ]
  },
  { 
    label: 'STRATEGY LAB', 
    items: [
      { name: 'Backtest Simulator', icon: CheckSquare, path: '/dashboard/backtest', pro: false },
      { name: 'Performance', icon: LineChart, path: '/dashboard/performance', pro: true },
    ]
  },
  { 
    label: 'ACCOUNT & SETTINGS', 
    items: [
      { name: 'Profile', icon: User, path: '/dashboard/profile', pro: false },
      { name: 'Payments', icon: CreditCard, path: '/dashboard/payments', pro: false },
    ]
  }
];

export default function MobileNav({ isPro }: { isPro: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent background scrolling when menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="lg:hidden">
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-6 z-[999] p-4 bg-indigo-600 rounded-full text-white shadow-2xl border border-white/20 active:scale-95 transition-all"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-[#05070a] flex flex-col p-8 w-full h-full"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-10 shrink-0">
              <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter">
                  KIMOO CRT<span className="text-indigo-500">(+Pro)</span>
                </h1>
                <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-1 leading-none">
                  Candle Range Theory
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            {/* Navigation Scroll Area */}
            <nav className="flex-1 overflow-y-auto space-y-10 no-scrollbar pb-20">
              {menuGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-black text-zinc-700 tracking-[0.2em] mb-4 px-2 uppercase">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.path;
                      const locked = item.pro && !isPro;
                      
                      return (
                        <Link 
                          key={item.name} 
                          href={locked ? "#" : item.path} 
                          onClick={() => !locked && setIsOpen(false)}
                        >
                          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-400/20 shadow-lg' 
                              : 'text-zinc-400 bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                          } ${locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex items-center gap-4">
                              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                              <span className="font-bold text-sm tracking-tight">{item.name}</span>
                            </div>
                            {locked ? (
                              <Lock size={14} className="text-zinc-800" />
                            ) : isActive && (
                              <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout Footer */}
            <div className="mt-auto pt-6 border-t border-white/5 bg-[#05070a] shrink-0">
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 w-full p-4 text-zinc-500 hover:text-red-500 transition-colors font-black uppercase text-[10px] tracking-widest group"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                Terminate Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
