"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SignalChart from '@/components/SignalChart';

export default function CapturePage({ params }: { params: { id: string } }) {
  const [signal, setSignal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    const fetchSignal = async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('id', params.id)
        .single();
        
      if (error) {
        setError(error.message);
      } else {
        setSignal(data);
      }
    };
    fetchSignal();
  }, [params.id]);

  if (error) {
    return <div className="text-white text-center mt-20 text-3xl font-bold bg-red-500/20 p-10">{error}</div>;
  }

  if (!signal) {
    return <div className="text-white text-center mt-20 text-xl font-mono animate-pulse">Initializing Capture Protocol...</div>;
  }

  const isBuy = signal.side?.toUpperCase() === 'BUY' || signal.side?.toUpperCase() === 'BULLISH';

  return (
    <div className="w-[1200px] h-[800px] bg-[#05070a] relative overflow-hidden flex flex-col">
      {/* Visual background elements for aesthetics */}
      <div className={`absolute top-0 left-0 w-full h-[300px] blur-[150px] opacity-20 pointer-events-none ${isBuy ? 'bg-emerald-500' : 'bg-red-500'}`} />
      
      {/* Header Info */}
      <div className="relative z-10 px-8 py-6 border-b border-white/[0.05] flex justify-between items-center bg-[#05070a]/50 backdrop-blur-md">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg flex items-center gap-4">
            {signal.symbol} 
            <span className={`px-4 py-1.5 rounded-xl text-[14px] font-black tracking-widest ${isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {isBuy ? 'LONG' : 'SHORT'}
            </span>
          </h1>
          <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">
            KIMOO CRT PRO • {signal.tf_alignment || '5M'} • {signal.status}
          </p>
        </div>
        
        {/* Signal Metrics */}
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">ENTRY</p>
            <p className="text-xl font-mono font-black text-blue-400">{signal.entry_price}</p>
          </div>
          <div className="w-px h-10 bg-white/[0.1] self-center"></div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">TARGET</p>
            <p className="text-xl font-mono font-black text-emerald-400">{signal.tp}</p>
          </div>
          <div className="w-px h-10 bg-white/[0.1] self-center"></div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">INVALIDATION</p>
            <p className="text-xl font-mono font-black text-red-400">{signal.sl}</p>
          </div>
        </div>
      </div>

      {/* The Chart */}
      <div className="flex-grow relative z-10 p-6 pt-2">
        <SignalChart 
          symbol={signal.symbol} 
          signal={signal} 
          onLoaded={() => setChartLoaded(true)} 
        />
      </div>

      {/* The trigger for the python bot */}
      {chartLoaded && <div id="screenshot-ready" style={{ display: 'none' }}></div>}
    </div>
  );
}
