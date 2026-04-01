"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X 
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

interface SidebarProps {
  isPro: boolean;
  isOpen: boolean;       // New prop to control visibility
  setIsOpen: (open: boolean) => void; // New prop to close sidebar
}

export default function Sidebar({ isPro, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
      {/* MOBILE OVERLAY DIMMER */}
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

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] w-72 bg-[#05070a] border-r border-white/5 flex flex-col p-6 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-6 right-6 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

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
                      onClick={() => setIsOpen(false)} // Close on click
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
                        
                        {isLocked ? (
                          <Lock size={11} className="text-zinc-800" />
                        ) : isActive && (
                          <motion.div 
                            layoutId="active-indicator" 
                            className="w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <div className="absolute top-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-[9px] font-black uppercase text-zinc-400 leading-none tracking-widest">
                {isPro ? 'Pro-Secure' : 'Live'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-xl w-full group border border-transparent hover:border-red-500/10"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
