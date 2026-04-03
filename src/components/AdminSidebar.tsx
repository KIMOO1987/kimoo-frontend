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
      fixed inset-y-0 left-0 w-72 bg-[#05070a] border-r border-white/5 flex flex-col overflow-hidden
      transition-transform duration-300 ease-in-out z-[9998]
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
    `}>
      <div className="flex flex-col h-full w-full p-6">
        <div className="mb-10 px-2 shrink-0">
          <h1 className="text-xl font-black tracking-tighter text-white italic">
            KIMOO <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-4">(+Console)</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md w-fit">
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
                <p className="text-[9px] font-black text-zinc-500 tracking-[0.2em] mb-4 px-2 uppercase">{group.label}</p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                          isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}>
                          <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span className="text-[12px] font-bold tracking-tight">{item.name}</span>
                          </div>
                          {isActive && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
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
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 transition-all rounded-xl w-full group">
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">SIGN OUT</span>
          </button>
        </div>
      </div>
    </aside>
  );
}