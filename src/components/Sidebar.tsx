"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X, Menu 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

const menuGroups = [
  { 
    label: 'TERMINAL', 
    items: [
      { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard', proRequired: false },
      { name: 'Active Trades', icon: Clock, path: '/dashboard/active', proRequired: true },
      { name: 'Trade History', icon: History, path: '/dashboard/history', proRequired: true },
    ]
  },
  { 
    label: 'RADAR & ANALYSIS', 
    items: [
      { name: 'All Signals', icon: Zap, path: '/dashboard/signals', proRequired: false },
      { name: 'Alpha Radar', icon: Compass, path: '/dashboard/radar', proRequired: false },
      { name: 'Symbol Audit', icon: BarChart3, path: '/dashboard/audit', proRequired: false },
    ]
  },
  { 
    label: 'STRATEGY LAB', 
    items: [
      { name: 'Backtest Simulator', icon: CheckSquare, path: '/dashboard/backtest', proRequired: false },
      { name: 'Performance', icon: LineChart, path: '/dashboard/performance', proRequired: true },
    ]
  },
  { 
    label: 'ACCOUNT & SETTINGS', 
    items: [
      { name: 'Profile', icon: User, path: '/dashboard/profile', proRequired: false },
      { name: 'Payments', icon: CreditCard, path: '/dashboard/payments', proRequired: false },
    ]
  }
];

export default function Sidebar({ isPro }: { isPro: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force scroll lock on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
      router.refresh();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* 1. TRIGGER BUTTON - ALWAYS TOP LAYER */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-8 left-6 z-[9999] p-4 bg-indigo-600 rounded-full text-white shadow-2xl active:scale-90 transition-transform border border-white/20"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 2. MOBILE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9997] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 3. SIDEBAR PANEL */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#05070a] border-r border-white/5 flex flex-col
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        z-[9998] 
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        <div className="flex flex-col h-full w-full p-6">
          {/* Logo */}
          <div className="mb-10 px-2 shrink-0">
            <h1 className="text-xl font-black tracking-tighter text-white italic">
              KIMOO CRT<span className="text-blue-500 underline decoration-blue-500/30 underline-offset-4">(+Pro)</span>
            </h1>
            <p className="text-[7px] uppercase tracking-[0.5em] text-zinc-600 font-bold mt-1 leading-none">
              Candle Range Theory
            </p>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.label} className="mb-8">
                <p className="text-[9px] font-black text-zinc-500 tracking-[0.2em] mb-4 px-2 uppercase">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    const isLocked = item.proRequired && !isPro;

                    return (
                      <Link 
                        key={item.name} 
                        href={isLocked ? "#" : item.path}
                        onClick={() => setIsOpen(false)}
                        className="block w-full"
                      >
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                        } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                          </div>
                          {isLocked ? <Lock size={11} /> : isActive && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Bar */}
          <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 transition-all rounded-xl w-full"
            >
              <LogOut size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}