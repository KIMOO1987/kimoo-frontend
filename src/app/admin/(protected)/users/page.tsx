"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, User, ChevronRight, Loader2, Filter, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { removeUserAction } from './actions';

export default function FreeUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null); // State to track which user is being removed

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

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      return;
    }
    setRemovingUserId(userId);
    try {
      // Call the server action to remove user from both profiles and auth.users
      await removeUserAction(userId);

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error: any) {
      console.error('Error removing user:', error.message);
      alert(`Failed to remove user: ${error.message}`);
    } finally {
      setRemovingUserId(null);
    }
  };

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
          <div key={user.id} className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.03] hover:border-blue-500/20 transition-all group">
            <Link href={`/admin/users/${user.id}`} className="flex items-center gap-5 flex-grow"> {/* Make Link wrap the main content */}
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">{user.full_name || 'TRADER'}</p>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{user.email}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent Link navigation
                  handleRemoveUser(user.id);
                }}
                className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 border border-red-500/10 px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                disabled={removingUserId === user.id}
              >
                {removingUserId === user.id ? (
                  <Loader2 className="animate-spin" size={10} />
                ) : (
                  <Trash2 size={10} />
                )}
                Remove
              </button>
              <ChevronRight size={18} className="text-zinc-800 group-hover:text-blue-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}