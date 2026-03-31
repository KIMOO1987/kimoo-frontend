"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Added UserPlus icon for Staff Manager
import { 
  CreditCard, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  UserPlus 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  // Updated menuItems to include Staff Manager (Restricted to Admin only)
  const menuItems = [
    { 
      name: 'Plans Editor', 
      href: '/admin/plans', 
      icon: <Settings size={18} />, 
      roles: ['admin', 'moderator'] 
    },
    { 
      name: 'Payment Terminal', 
      href: '/admin/payments', 
      icon: <CreditCard size={18} />, 
      roles: ['admin'] 
    },
    { 
      name: 'Staff Manager', 
      href: '/admin/staff', 
      icon: <UserPlus size={18} />, 
      roles: ['admin'] 
    },
  ];

  return (
    <div className="w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">
          KIMOO <span className="text-blue-500 text-sm not-italic">Console</span>
        </h1>
        <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
          <ShieldCheck size={10} className="text-blue-500" />
          <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{userRole}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          // Permission Logic: Only show the link if the user's role is in the item's allowed roles
          if (!item.roles.includes(userRole)) return null;
          
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={async () => { 
            await supabase.auth.signOut(); 
            window.location.href = '/'; 
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}