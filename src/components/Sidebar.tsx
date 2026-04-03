"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, History, Zap, Compass, BarChart3, 
  CheckSquare, LineChart, User, CreditCard, 
  LogOut, Lock, X, Menu, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

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

export default function Sidebar({ tier, role }: { tier: number; role?: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Staff check: Admin and Moderator get full access
  const isStaff = role === 'admin' || role === 'moderator';

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

  if (!mounted) return null;

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#05070a] border-r border-white/5 flex flex-col overflow-hidden
        transition-transform duration-300 ease-in-out z-[9998]
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full w-full p-6">
          <div className="mb-10 px-2 shrink-0">
            <h1 className="text-xl font-black tracking-tighter text-white italic">
              KIMOO CRT<span className="text-blue-500 underline decoration-blue-500/30 underline-offset-4">(+Pro)</span>
            </h1>
            {isStaff && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit">
                <ShieldCheck size={10} className="text-blue-400" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{role} Access</span>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.label} className="mb-8">
                <p className="text-[9px] font-black text-zinc-500 tracking-[0.2em] mb-4 px-2 uppercase">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    // Staff never locked, others locked by tier
                    const isLocked = !isStaff && tier < item.minTier;

                    return (
                      <Link key={item.name} href={isLocked ? "#" : item.path} onClick={() => !isLocked && setIsOpen(false)}>
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        } ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                          </div>
                          {isLocked ? <Lock size={12} className="text-zinc-600" /> : isActive && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 transition-all rounded-xl w-full group">
              <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">SIGN OUT</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
