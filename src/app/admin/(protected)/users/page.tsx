"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, User, ChevronRight, Loader2, Filter } from 'lucide-react';
import Link from 'next/link';

export default function FreeUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('tier', 0)
        .order('created_at', { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.email?.toLowerCase().includes(query.toLowerCase()) || u.full_name?.toLowerCase().includes(query.toLowerCase()));

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-4 md:p-12 bg-[#05070a] min-h-screen text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Free <span className="text-zinc-500">Tier</span></h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Trial Operators & Prospects</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            placeholder="Filter identity..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-blue-500/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 max-w-5xl mx-auto">
        {filtered.map(user => (
          <Link key={user.id} href={`/admin/users/${user.id}`}>
            <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.03] hover:border-blue-500/20 transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">{user.full_name || 'TRADER'}</p>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Promote Operator</span>
                <ChevronRight size={18} className="text-zinc-800 group-hover:text-blue-500" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}