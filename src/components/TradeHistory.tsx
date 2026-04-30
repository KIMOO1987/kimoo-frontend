'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function TradeHistory() {
  const [signals, setSignals] = useState<any[]>([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSignals = async () => {
      const { data } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setSignals(data);
    };

    fetchSignals();

    // Listen for new signals as they arrive
    const channel = supabase
      .channel('history-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, 
      (payload) => {
        setSignals((prev) => [payload.new, ...prev].slice(0, 10));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <table className="w-full text-left text-sm text-zinc-900/70 dark:text-white/70">
        <thead className="bg-white/10 text-[9px] uppercase text-zinc-900/50 dark:text-white/50">
          <tr>
            <th className="px-6 py-3">Symbol</th>
            <th className="px-6 py-3">Side</th>
            <th className="px-6 py-3">Entry</th>
            <th className="px-6 py-3">R:R</th>
            <th className="px-6 py-3">Align</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {signals.map((signal) => (
            <tr key={signal.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{signal.symbol}</td>
              <td className={`px-6 py-4 font-medium ${signal.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {signal.side}
              </td>
              <td className="px-6 py-4">${signal.entry_price}</td>
              <td className="px-6 py-4 font-mono text-indigo-400">{signal.rr ? signal.rr + 'R' : '---'}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] font-bold ${signal.alignment === 'Aligned' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {signal.alignment === 'Aligned' ? '✅' : '⚠️'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-blue-500/20 px-2 py-1 text-[10px] text-blue-300 border border-blue-500/30">
                  {signal.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
