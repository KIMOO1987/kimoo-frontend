"use client";
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { Lock, Crown, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewPro() {
  const { tier, loading } = useAuth();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tier >= 1 && container.current) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        if (typeof window.TradingView !== "undefined") {
          new window.TradingView.widget({
            width: "100%",
            height: "100%",
            symbol: "BINANCE:BTCUSDT",
            interval: "15",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: container.current?.id,
            // To add the indicator, we would normally use studies: ["INDICATOR_ID"]
            // For private indicators, the user must have access on their TV account
            // or we use the library to stream data. 
            // Here we provide the full terminal experience.
            studies: [
              // "STD;Relative_Strength_Index" // Example
            ],
          });
        }
      };
      document.head.appendChild(script);
    }
  }, [tier]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (tier < 1) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 text-center backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-500">
            <Crown size={40} className="text-blue-400" />
          </div>

          <h2 className="text-3xl font-black italic tracking-tight mb-4 uppercase">
            Pro<span className="text-blue-500">Terminal</span> Access
          </h2>
          
          <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
            The TradingView Pro terminal is reserved for <span className="text-white">ULTIMATE & PRO OPERATORS</span>. Unlock institutional-grade charts and the KIMOO CRT indicator matrix.
          </p>

          <Link 
            href="/dashboard/payments" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group/btn shadow-[0_10px_20px_rgba(37,99,235,0.3)]"
          >
            UPGRADE NOW
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-6 text-[9px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
            • TIER 1 MINIMUM REQUIRED •
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      <div className="h-12 bg-zinc-900 border-b border-white/5 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black italic uppercase tracking-widest">Master Terminal <span className="text-zinc-500">| Live</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-zinc-500">OPERATOR: {tier >= 3 ? 'ULTIMATE' : 'PRO'}</span>
        </div>
      </div>
      <div id="tv_chart_container" ref={container} className="flex-grow" />
    </div>
  );
}
