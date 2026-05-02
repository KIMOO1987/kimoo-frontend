'use client';
import { useEffect, useRef } from 'react';

const getTradingViewSymbol = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase();

  // Crypto: BINANCE
  if (upperSymbol.endsWith('USD') || upperSymbol.endsWith('USDT') || upperSymbol.startsWith('BTC') || upperSymbol.startsWith('ETH')) {
    return `BINANCE:${upperSymbol}`;
  }
  // Metal: OANDA
  if (upperSymbol.startsWith('XAU') || upperSymbol.startsWith('XAG') || upperSymbol.startsWith('XPT') || upperSymbol.startsWith('XCU')) {
    return `OANDA:${upperSymbol}`;
  }
  // Indices: CAPITALCOM
  if (['US100', 'US30', 'US500'].includes(upperSymbol)) {
    return `CAPITALCOM:${upperSymbol}`;
  }
  // Forex: FX_IDC (Forex.com)
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
  if (forexPairs.includes(upperSymbol)) {
    return `FOREXCOM:${upperSymbol}`;
  }

  // Default to original symbol if no specific mapping is found
  return upperSymbol;
};

export default function SignalChart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up previous script if symbol changes
    if (container.current) container.current.innerHTML = '';
    
    const tradingViewSymbol = getTradingViewSymbol(symbol);
    const widgetConfig = {
      "autosize": true,
      "symbol": tradingViewSymbol,
      "interval": "5",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": true,
      "allow_symbol_change": false,
      "container_id": "tv_chart_container",
      "hide_side_toolbar": true,
      "save_image": false,
      "backgroundColor": "rgba(5, 7, 10, 1)",
      "gridColor": "rgba(255, 255, 255, 0.02)",
    };

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(widgetConfig);
    container.current?.appendChild(script);
  }, [symbol]);

  return (
    <div className="w-full h-[400px] md:h-[500px] lg:h-full lg:min-h-[450px] bg-[#05070a]" id="tv_chart_container" ref={container} />
  );
}