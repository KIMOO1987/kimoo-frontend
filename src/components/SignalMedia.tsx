"use client";
import { useEffect, useRef, useState } from 'react';
import { Camera, Activity, Maximize2 } from 'lucide-react';

interface SignalMediaProps {
  symbol: string;
  screenshotUrl?: string;
  status: string;
}

const getTradingViewSymbol = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase();
  if (upperSymbol.endsWith('USD') || upperSymbol.endsWith('USDT') || upperSymbol.startsWith('BTC') || upperSymbol.startsWith('ETH')) return `BINANCE:${upperSymbol}`;
  if (upperSymbol.startsWith('XAU') || upperSymbol.startsWith('XAG')) return `OANDA:${upperSymbol}`;
  if (['US100', 'US30', 'US500'].includes(upperSymbol)) return `CAPITALCOM:${upperSymbol}`;
  return `FOREXCOM:${upperSymbol}`;
};

export default function SignalMedia({ symbol, screenshotUrl, status }: SignalMediaProps) {
  const container = useRef<HTMLDivElement>(null);
  const [showLive, setShowLive] = useState(status === 'ENTRY' || status === 'ACTIVE');

  useEffect(() => {
    if (showLive && container.current) {
      container.current.innerHTML = '';
      const widgetConfig = {
        "autosize": true,
        "symbol": getTradingViewSymbol(symbol),
        "interval": "15",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "hide_top_toolbar": true,
        "hide_side_toolbar": true,
        "backgroundColor": "rgba(0, 0, 0, 1)",
      };
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify(widgetConfig);
      container.current.appendChild(script);
    }
  }, [symbol, showLive]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 group">
      {/* Media Content */}
      {showLive ? (
        <div ref={container} className="w-full h-full" />
      ) : (
        screenshotUrl ? (
          <img 
            src={screenshotUrl.startsWith('http') ? screenshotUrl : `https://www.tradingview.com/x/${screenshotUrl}/`} 
            className="w-full h-full object-cover" 
            alt="Trade Result" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 italic text-[10px] uppercase tracking-widest font-black">
            <Camera size={40} className="mb-4 opacity-20" />
            No Result Captured
          </div>
        )
      )}

      {/* Overlay Controls */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {screenshotUrl && (
          <button 
            onClick={() => setShowLive(!showLive)}
            className={`p-2 rounded-xl border border-white/10 backdrop-blur-md transition-all ${showLive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white'}`}
          >
            {showLive ? <Camera size={16} /> : <Activity size={16} />}
          </button>
        )}
        <button className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-white">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
          <div className={`w-1.5 h-1.5 rounded-full ${showLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-white">
            {showLive ? 'Live Analysis' : 'Archived Result'}
          </span>
        </div>
      </div>
    </div>
  );
}
