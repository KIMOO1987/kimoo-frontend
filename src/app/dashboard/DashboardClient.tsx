"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  ExternalLink, 
  RefreshCcw, 
  Calendar, 
  Zap, 
  Bell,
  ArrowRight,
  Target,
  Shield,
  TrendingUp,
  Star,
  Clock,
  X
} from 'lucide-react';
import ErrorModal from '@/components/ErrorModal';

interface DashboardClientProps {
  isPro: boolean;
  expiryDate?: string | null;
  userProfile: {
    fullName: string;
    country: string;
    address: string;
    email: string;
    subscriptionTier?: string; // Added to support your 3 specific tiers
  };
}

export default function DashboardClient({ 
  isPro, 
  expiryDate,
  userProfile 
}: DashboardClientProps) {
  const [signals, setSignals] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const router = useRouter();

  const [errorState, setErrorState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '' 
  });

  const daysLeft = (() => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  /**
   * UPDATED ACCESS LEVEL LOGIC
   * Maps precisely to: Alpha (Monthly), Pro (6-Month), Ultimate (Yearly)
   */
  const getAccessLevel = () => {
    if (!isPro) return "No Active License";
    
    // 1. Check if tier is explicitly provided in profile
    if (userProfile.subscriptionTier) {
      return `CRT+ ${userProfile.subscriptionTier.toUpperCase()} LICENSE`;
    }

    // 2. Fallback logic based on your 3 specific durations
    if (daysLeft !== null) {
      if (daysLeft > 200) return "CRT+ ULTIMATE (YEARLY)";
      if (daysLeft > 35)  return "CRT+ PRO (6-MONTHS)";
      return "CRT+ ALPHA (MONTHLY)";
    }

    return "CRT+ ACTIVE LICENSE";
  };

  useEffect(() => {
    fetchSignals();
    
    const channel = supabase.channel('live_signals')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'signals' 
      }, 
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setSignals((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('signals') 
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSignals(data);
  };

  const handleSync = () => {
    setIsRefreshing(true);
    router.refresh();
    fetchSignals();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <ErrorModal 
        isOpen={errorState.isOpen}
        onClose={() => setErrorState(prev => ({ ...prev, isOpen: false }))}
        title={errorState.title}
        message={errorState.message}
      />

      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic mb-1 text-white uppercase">
            Signal <span className="text-blue-500 text-2xl not-italic">Console</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            Institutional CRT Intelligence Active
          </p>
        </div>
        
        <button 
          onClick={handleSync}
          className="p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
        >
          <RefreshCcw size={14} className={`${isRefreshing ? "animate-spin text-blue-500" : "text-zinc-600 group-hover:text-zinc-400"}`} />
        </button>
      </div>

      {/* Subscription Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[1.5rem] flex justify-between items-center col-span-2 relative overflow-hidden group">
          <div className="flex items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Key size={10} className="text-zinc-600" />
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Access Level</p>
              </div>
              {/* Corrected Access Level Display */}
              <p className="text-xs font-black text-blue-400 uppercase italic tracking-tighter">
                {getAccessLevel()}
              </p>
            </div>

            {expiryDate && (
              <>
                <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={10} className="text-zinc-600" />
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Expiration</p>
                  </div>
                  <p className="text-[10px] font-black text-white">
                    {new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 relative z-10">
            <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase border bg-green-500/10 text-green-500 border-green-500/20">
              Verified
            </span>
            {daysLeft !== null && (
              <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">
                {daysLeft} Days Remaining
              </span>
            )}
          </div>
        </div>
        
        <a href="https://whop.com/hub/" target="_blank" rel="noopener noreferrer" className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[1.5rem] flex flex-col justify-center items-center group hover:bg-zinc-900 transition-all border-dashed text-center">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Billing</p>
          <div className="flex items-center gap-2 text-white font-black text-[10px]">
            MANAGE <ExternalLink size={10} />
          </div>
        </a>
      </div>

      {/* Signals Feed */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center px-8 py-6">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em] flex items-center gap-2">
            <Zap size={14} className="text-blue-500" /> Active CRT Stream
          </h3>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Monitoring
            </span>
          </div>
        </div>

        <div className="p-4 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {signals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                <Bell size={40} className="mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting New CRT Alerts...</p>
              </div>
            ) : (
              signals.map((signal) => (
                <motion.div 
                  key={signal.id} 
                  layout 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="flex items-center justify-between p-6 mb-4 bg-white/[0.02] border border-white/5 rounded-3xl group/item hover:bg-white/[0.04] transition-all cursor-pointer"
                  onClick={() => setSelectedSignal(signal)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-1.5 h-12 rounded-full ${signal.side === 'BUY' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl font-black tracking-tighter text-white uppercase">{signal.symbol}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${signal.side === 'BUY' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-red-500 border-red-500/20 bg-red-500/10'}`}>
                          {signal.side}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">
                        {signal.strategy || 'KIMOO CRT'} • {new Date(signal.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-8 px-4">
                     <div className="hidden md:block">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Entry Region</p>
                        <p className="text-xs font-mono text-white tracking-tighter">
                          {signal.entry_price ? Number(signal.entry_price).toFixed(4) : 'Market'}
                        </p>
                     </div>
                     <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                        <ArrowRight size={18} />
                     </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Unlocked Detail Modal */}
      <AnimatePresence>
        {selectedSignal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0f14] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${selectedSignal.side === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                        {selectedSignal.side} CRT SETUP | {selectedSignal.symbol}
                      </h3>
                    </div>
                    <div className="h-0.5 w-24 bg-blue-500" />
                  </div>
                  <button onClick={() => setSelectedSignal(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <DetailRow icon={<Clock size={16}/>} label="TF Alignment" value={selectedSignal.tf_alignment || '5m-1H'} />
                  <DetailRow icon={<Star size={16} className="text-yellow-500"/>} label="Grade" value={selectedSignal.grade || 'A+'} valueClass="text-yellow-500 font-bold" />
                  <DetailRow icon={<Zap size={16} className="text-purple-500"/>} label="Phase" value={selectedSignal.phase || 'Cont/Rev'} />
                  
                  <div className="h-px bg-white/5 my-4" />

                  <DetailRow icon={<TrendingUp size={16} className="text-blue-400"/>} label="Entry Zone" value={Number(selectedSignal.entry_price || 0).toFixed(4)} valueClass="font-mono text-blue-400" />
                  <DetailRow icon={<Shield size={16} className="text-red-400"/>} label="Stop Loss" value={Number(selectedSignal.sl || 0).toFixed(4)} valueClass="font-mono text-red-400" />
                  <DetailRow icon={<Target size={16} className="text-green-400"/>} label="TP 1 (EQ)" value={Number(selectedSignal.tp || 0).toFixed(4)} valueClass="font-mono text-green-400" />
                  <DetailRow icon={<Target size={16} className="text-green-400"/>} label="TP 2 (Target)" value={Number(selectedSignal.tp_secondary || 0).toFixed(4)} valueClass="font-mono text-green-400" />
                </div>

                <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                   <p className="text-[10px] text-zinc-500 italic flex gap-2">
                     <span className="not-italic">📝</span>
                     <span><strong>Confluences:</strong> {selectedSignal.confluences || 'Institutional Bias Confirmed'}</span>
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon, label, value, valueClass = "text-white" }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-zinc-400 font-bold uppercase text-[11px] tracking-tight">
        {icon} <span>{label}:</span>
      </div>
      <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}