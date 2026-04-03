"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Check, 
  ExternalLink, 
  Loader2, 
  RefreshCcw, 
  Trash2, 
  Zap, 
  Crown, 
  Star, 
  Search, 
  Clock,
  DollarSign,
  ShieldAlert
} from 'lucide-react';

export default function AdminPayments() {
  const [requests, setRequests] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]); // Dynamic prices from DB
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `Just now`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch current plan prices for earnings calculation
    const { data: plansData } = await supabase.from('plans').select('id, price');
    if (plansData) setDbPlans(plansData);

    // 2. Fetch all profiles
    const { data: profileData, error } = await supabase.from('profiles').select('*');
    
    if (!error && profileData) {
      setAllProfiles(profileData);
      setRequests(profileData.filter(p => p.pending_crypto_hash !== null));
    }
    setLoading(false);
  }, []);

  // Use the database plan prices to calculate revenue
  const totalEarnings = useMemo(() => {
    const priceMap = dbPlans.reduce((acc, plan) => {
      acc[plan.id] = plan.price;
      return acc;
    }, {} as Record<string, number>);

    return allProfiles.reduce((acc, curr) => {
      const price = priceMap[curr.subscription_status] || 0;
      return acc + price;
    }, 0);
  }, [allProfiles, dbPlans]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.pending_crypto_hash?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [requests, searchQuery]);

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }
      
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (data?.role === 'admin') {
        setRole('admin');
        fetchData();
      } else {
        setRole('unauthorized');
      }
    };
    verifyAccess();
  }, [fetchData]);

  async function approveUser(userId: string, requestedPlan: string) {
    const planToAssign = requestedPlan?.toLowerCase() || 'pro';
    
    // Map IDs to Tier numbers
    const tierMap: Record<string, number> = { 'alpha': 1, 'pro': 2, 'ultimate': 3 };
    const tierLevel = tierMap[planToAssign] || 2;

    if (!confirm(`Authorize [${planToAssign.toUpperCase()}] Access (Tier ${tierLevel})?`)) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days extension

    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: planToAssign, // This is for your plans display
        tier: tierLevel,                   // This is for actual access
        expiry_date: expiryDate.toISOString(),
        pending_crypto_hash: null, 
        pending_plan_id: null,
        last_payment_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (!error) fetchData();
  }

  async function kickHash(userId: string) {
    if (!confirm("KICK HASH: This will delete the TxID. Proceed?")) return;
    const { error } = await supabase
      .from('profiles')
      .update({ pending_crypto_hash: null, pending_plan_id: null })
      .eq('id', userId);
    if (!error) fetchData();
  }

  if (role === null) return <div className="h-screen bg-[#05070a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  
  if (role === 'unauthorized') return (
    <div className="h-screen bg-[#05070a] flex flex-col items-center justify-center text-red-500 gap-4">
      <ShieldAlert size={48} />
      <h1 className="font-black italic uppercase tracking-tighter text-2xl">Unauthorized Access</h1>
      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">Contact Super Admin for terminal clearance</p>
    </div>
  );

  return (
    <div className="p-4 md:p-12 bg-[#05070a] min-h-screen text-white">
      
      {/* Top Stats Bar */}
      <div className="max-w-6xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl md:rounded-[32px] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Verified Revenue</p>
            <h2 className="text-3xl font-black italic text-white">${totalEarnings} <span className="text-sm not-italic text-zinc-600 ml-2">USDT</span></h2>
          </div>
          <div className="bg-blue-500/20 p-4 rounded-2xl">
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl md:rounded-[32px] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Active Queue</p>
            <h2 className="text-3xl font-black italic text-white">{requests.length} <span className="text-sm not-italic text-zinc-600 ml-2">Pending</span></h2>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl">
            <Clock className="text-zinc-400" size={24} />
          </div>
        </div>
      </div>

      {/* Header & Search */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-6 max-w-6xl mx-auto">
        <div className="px-2">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Terminal <span className="text-blue-500 text-2xl not-italic">Hashes</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text"
              placeholder="Search by email or hash..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-blue-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-zinc-500 border border-white/5">
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-6xl mx-auto">
        {loading && requests.length === 0 ? (
          <Loader2 className="animate-spin mx-auto text-zinc-800" size={32} />
        ) : filteredRequests.length === 0 ? (
          <div className="py-24 border border-dashed border-white/5 rounded-[40px] text-center">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                {searchQuery ? "No results match your search" : "The queue is empty"}
              </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((req) => {
              const isultimate = req.pending_plan_id === 'ultimate';
              const isAlpha = req.pending_plan_id === 'alpha';
              
              return (
                <div key={req.id} className="bg-white/[0.01] border border-white/5 p-6 md:p-8 rounded-3xl md:rounded-[32px] flex flex-col lg:flex-row items-start lg:items-center justify-between group hover:border-blue-500/20 transition-all gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">{req.email}</span>
                      
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                        <Clock size={12} className="text-zinc-600" />
                        {getTimeAgo(req.updated_at)}
                      </span>

                      <span className={`
                        flex items-center gap-1.5 text-[8px] font-black px-3 py-1 rounded-full uppercase border
                        ${isultimate ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          isAlpha ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                      `}>
                        {isultimate ? <Crown size={10} /> : isAlpha ? <Zap size={10} /> : <Star size={10} />}
                        {req.pending_plan_id?.toUpperCase() || "PRO"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                      <code className="text-[10px] font-mono text-zinc-500 truncate max-w-[250px] sm:max-w-md">
                        {req.pending_crypto_hash}
                      </code>
                      <a href={`https://tronscan.org/#/transaction/${req.pending_crypto_hash}`} target="_blank" className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button onClick={() => kickHash(req.id)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-red-500/20">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => approveUser(req.id, req.pending_plan_id)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-900/20">
                      <Check size={18} />
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
