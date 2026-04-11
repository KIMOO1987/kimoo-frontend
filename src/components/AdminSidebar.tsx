"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CreditCard, 
  Settings, 
  LogOut, 
  ShieldCheck, 
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
      { name: 'New User', path: '/admin/new-user', icon: UserPlus, roles: ['admin', 'moderator'] },
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

export default function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    <aside className={`
      fixed inset-y-0 left-0 w-72 bg-[#030407] border-r border-white/[0.05] flex flex-col overflow-hidden
      transition-transform duration-300 ease-in-out z-[9998]
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
    `}>
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col h-full w-full p-6 relative z-10">
        <div className="mb-10 px-2 shrink-0">
          <h1 className="text-2xl font-black tracking-tighter text-white italic flex items-center gap-2 drop-shadow-md">
            KIMOO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CONSOLE</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <ShieldCheck size={10} className="text-blue-400" />
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{userRole} Access</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {adminMenuGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-8">
                <p className="text-[9px] font-black text-zinc-600 tracking-[0.25em] mb-4 px-3 uppercase">{group.label}</p>
                <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                            : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-white/[0.02] hover:border-white/[0.05]'
                        }`}>
                          <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                          </div>
                          {isActive && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.8)]" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
          <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-3.5 text-zinc-500 bg-white/[0.01] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 hover:text-red-400 transition-all rounded-xl w-full group hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">SIGN OUT</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
