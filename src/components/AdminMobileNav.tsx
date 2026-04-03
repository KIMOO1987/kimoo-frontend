"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CreditCard, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Menu,
  X,
  UserPlus,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const adminMenuGroups = [
  {
    label: 'SYSTEM CONTROL',
    items: [
      { name: 'Plans Editor', path: '/admin/plans', icon: Settings, roles: ['admin', 'moderator'] },
      { name: 'Staff Manager', path: '/admin/staff', icon: UserPlus, roles: ['admin'] },
    ]
  },
  {
    label: 'USER MANAGEMENT',
    items: [
      { name: 'Premium Members', path: '/admin/premium', icon: UserPlus, roles: ['admin', 'moderator'] },
      { name: 'Free Members', path: '/admin/users', icon: UserPlus, roles: ['admin', 'moderator'] },
      { name: 'Reset Requests', path: '/admin/resets', icon: UserPlus, roles: ['admin', 'moderator'] },
    ]
  },
  {
    label: 'FINANCIAL',
    items: [
      { name: 'Payment Terminal', path: '/admin/payments', icon: CreditCard, roles: ['admin'] },
    ]
  }
];

export default function AdminMobileNav({ userRole }: { userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

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

  if (!mounted) return null;

  return (
    <div className="lg:hidden">
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-8 left-6 z-[999] p-4 bg-blue-600 rounded-full text-white shadow-2xl border border-white/20 active:scale-95 transition-all"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '-100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '-100%' }} 
            className="fixed inset-0 z-[1000] bg-[#05070a] flex flex-col p-8 w-full h-full"
          >
            <div className="flex justify-between items-center mb-10 shrink-0">
              <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter">
                  KIMOO <span className="text-blue-500">(+Console)</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit">
                  <ShieldCheck size={10} className="text-blue-400" />
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{userRole} Access</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-10 no-scrollbar pb-20">
              {adminMenuGroups.map((group) => {
                const visibleItems = group.items.filter(item => item.roles.includes(userRole));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.label}>
                    <p className="text-[10px] font-black text-zinc-700 tracking-[0.2em] mb-4 px-2 uppercase">{group.label}</p>
                    <div className="space-y-2">
                      {visibleItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                          <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all border cursor-pointer ${
                              isActive ? 'bg-blue-600 text-white border-blue-400/20 shadow-lg' : 'text-zinc-400 bg-white/[0.02] border-transparent'
                            }`}>
                              <div className="flex items-center gap-4">
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                              </div>
                              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
