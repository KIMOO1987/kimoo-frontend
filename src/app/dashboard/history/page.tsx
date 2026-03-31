"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  History as HistoryIcon, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle 
} from 'lucide-react';

export default function SignalHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      // UPDATED LOGIC: Now fetching SL, TP2, and the partial 'TP1 + SL (BE)' status
      const { data } = await supabase
        .from('signals')
        .select('*')
        .in('status', ['SL', 'TP2', 'TP1 + SL (BE)']) 
        .order('created_at', { ascending: false });

      if (data) setHistory(data);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic text-white uppercase">
            Signal <span className="text-blue-500">Archive</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Historical CRT Data & Outcome Logs
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            type="text" 
            placeholder="Search History (e.g. BTCUSD)..."
            className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl text-[11px] font-mono text-white focus:border-blue-500/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                <th className="px-8 py-6">Timestamp</th>
                <th className="py-6">Instrument</th>
                <th className="py-6">Side</th>
                <th className="py-6">Entry</th>
                <th className="py-6">Strategy</th>
                <th className="py-6">Result</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((signal) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={signal.id} 
                    className="group hover:bg-blue-500/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5 text-[11px] font-mono text-zinc-500">
                      {new Date(signal.created_at).toLocaleDateString()}
                      <span className="block opacity-40 text-[9px]">
                        {new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className="text-sm font-black text-white uppercase tracking-tighter italic">
                        {signal.symbol}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        signal.side === 'BUY' 
                          ? 'text-green-500 border-green-500/10 bg-green-500/5' 
                          : 'text-red-500 border-red-500/10 bg-red-500/5'
                      }`}>
                        {signal.side}
                      </span>
                    </td>
                    <td className="py-5 text-sm font-mono font-bold text-zinc-300">
                      {signal.entry_price}
                    </td>
                    <td className="py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {signal.strategy || 'CRT Alpha'}
                    </td>
                    <td className="py-5">
                      <ResultBadge status={signal.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 rounded-xl hover:bg-white/5 text-zinc-600 hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <HistoryIcon size={48} className="mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Completed Logs</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ status }: { status: string }) {
  // FULL WIN
  if (status === 'TP2') return (
    <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase">
      <CheckCircle2 size={12} /> Hit TP2 (Full)
    </div>
  );

  // PARTIAL WIN / BREAKEVEN
  if (status === 'TP1 + SL (BE)') return (
    <div className="flex items-center gap-1.5 text-yellow-500 text-[10px] font-black uppercase">
      <AlertTriangle size={12} /> TP1 Hit + SL (Partial)
    </div>
  );

  // FULL LOSS
  if (status === 'SL') return (
    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase">
      <XCircle size={12} /> Hit SL
    </div>
  );

  // FALLBACK
  return (
    <div className="flex items-center gap-1.5 text-zinc-600 text-[10px] font-black uppercase">
      <Clock size={12} /> {status}
    </div>
  );
}