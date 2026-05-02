'use client';
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Target, XCircle, ShieldCheck, Zap, Coins, Info } from 'lucide-react';

export default function ExecutionStats({ userId, exchange }: { userId: string, exchange: string }) {
  const [stats, setStats] = useState({ total: 0, win: 0, loss: 0, be: 0, skipped: 0, fees: 0 });
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchStats = async () => {
    const { data } = await supabase.from('user_executions')
      .select('*').eq('user_id', userId).eq('exchange_name', exchange);
    
    if (data) {
      setStats({
        total: data.filter(d => ['EXECUTED', 'WIN', 'LOSS', 'BE'].includes(d.status)).length,
        win: data.filter(d => d.status === 'WIN').length,
        loss: data.filter(d => d.status === 'LOSS').length,
        be: data.filter(d => d.status === 'BE').length,
        skipped: data.filter(d => d.status === 'SKIPPED').length,
        fees: data.reduce((acc, curr) => acc + (Number(curr.fee_usd) || 0), 0)
      });
    }
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase.channel('realtime-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_executions', filter: `user_id=eq.${userId}` }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, exchange]);

  const Card = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}><Icon size={20}/></div>
      <div>
        <p className="text-[9px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <Card title="Live Trades" value={stats.total} icon={Zap} color="yellow" />
      <Card title="Full TP" value={stats.win} icon={Target} color="emerald" />
      <Card title="Stop Loss" value={stats.loss} icon={XCircle} color="red" />
      <Card title="Breakeven" value={stats.be} icon={ShieldCheck} color="blue" />
      <Card title="Skipped" value={stats.skipped} icon={Info} color="zinc" />
      <Card title="Fees Paid" value={`$${stats.fees.toFixed(2)}`} icon={Coins} color="orange" />
    </div>
  );
}
