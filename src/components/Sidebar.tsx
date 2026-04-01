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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Internal state for mobile toggle

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);
    };
    getUser();
  }, []);

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
      {/* --- MOBILE FLOATING ACTION BUTTON (BOTTOM LEFT) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-8 left-6 z-[200] p-4 bg-indigo-600 rounded-full text-white shadow-2xl shadow-indigo-500/40 active:scale-90 transition-all border border-white/10"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- MOBILE OVERLAY DIMMER --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR PANEL --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] w-72 bg-[#05070a] border-r border-white/5 flex flex-col p-6 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Brand Logo */}
        <div className="mb-10 px-2">
          <h1 className="text-xl font-black tracking-tighter text-white italic">
            KIMOO CRT<span className="text-blue-500 underline decoration-blue-500/30 underline-offset-4">(+Pro)</span>
          </h1>
          <p className="text-[7px] uppercase tracking-[0.5em] text-zinc-600 font-bold mt-1 leading-none">
            Candle Range Theory
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[9px] font-black text-zinc-700 tracking-[0.2em] mb-4 px-2 uppercase">
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
                    >
                      <motion.div
                        whileHover={!isLocked ? { x: 4 } : {}}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                          isActive 
                            ? 'bg-blue-600/10 text-blue-500 border border-blue-500/10' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        } ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                            {item.name}
                          </span>
                        </div>
                        {isLocked ? <Lock size={11} className="text-zinc-800" /> : isActive && (
                          <motion.div layoutId="active-indicator" className="w-1 h-3 bg-blue-500 rounded-full" />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-xl w-full group"
          >
            <LogOut size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
