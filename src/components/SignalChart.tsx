"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, CandlestickSeries } from 'lightweight-charts';

// Reuse the categorization logic to fetch from correct API
const getSymbolData = (symbol: string) => {
  const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper.startsWith('XAU') || upper.startsWith('XAG') || upper.startsWith('XPT') || upper.startsWith('XCU')) {
    return { category: 'METALS', provider: 'OANDA', clean: upper };
  }
  if (['US100', 'US30', 'US500', 'NAS100', 'DJI', 'SPX', 'GER40'].includes(upper)) {
    return { category: 'INDICES', provider: 'CAPITALCOM', clean: upper };
  }
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY'];
  if (forexPairs.includes(upper)) {
    return { category: 'FOREX', provider: 'FOREXCOM', clean: upper };
  }
  return { category: 'CRYPTO', provider: 'BINANCE', clean: upper };
};

export default function SignalChart({ symbol, signal, onLoaded }: { symbol: string, signal?: any, onLoaded?: () => void }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#05070a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      crosshair: {
        mode: 1, // Magnet
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // emerald-500
      downColor: '#ef4444', // red-500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const fetchData = async () => {
      setLoading(true);
      try {
        const { category, clean } = getSymbolData(symbol);
        let formattedData = [];

        if (category === 'CRYPTO') {
          // Binance public API
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${clean}&interval=5m&limit=500`);
          const data = await res.json();
          formattedData = data.map((d: any) => ({
            time: d[0] / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
        } else {
          // Finnhub API for non-crypto
          const FINNHUB_KEY = 'd78oc2pr01qp0fl5vgi0d78oc2pr01qp0fl5vgig'; // Extracted from active/page.tsx
          let finnhubSymbol = clean;
          if (category === 'FOREX') finnhubSymbol = `OANDA:${clean.replace(/(USD|JPY|GBP|AUD|NZD|EUR|CHF)/, '$1_').replace(/_$/, '')}`;
          if (category === 'METALS') finnhubSymbol = `OANDA:${clean.replace('USD', '_USD')}`;
          if (category === 'INDICES') finnhubSymbol = `OANDA:${clean}`; // Finnhub CFD is usually prefixed with OANDA or similar

          const to = Math.floor(Date.now() / 1000);
          const from = to - (500 * 5 * 60); // 500 candles of 5m
          const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=5&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
          const data = await res.json();

          if (data.s === 'ok') {
            formattedData = data.t.map((t: number, i: number) => ({
              time: t,
              open: data.o[i],
              high: data.h[i],
              low: data.l[i],
              close: data.c[i],
            }));
          }
        }

        if (formattedData.length > 0) {
          series.setData(formattedData);
        }

        // ADD PRICE LINES
        if (signal) {
          const entry = Number(signal.entry_price);
          const tp1 = Number(signal.tp);
          const tp2 = Number(signal.tp_secondary);
          let sl = Number(signal.sl);

          // Breakeven logic
          const isTp1Hit = signal.status === 'TP1' || signal.status === 'TP1 + SL (BE)' || signal.status === 'TP2' || signal.status === 'WIN';
          if (isTp1Hit && entry) {
            sl = entry;
          }

          if (entry) {
            series.createPriceLine({ price: entry, color: '#3b82f6', lineWidth: 2, lineStyle: LineStyle.Dotted, title: 'Entry', axisLabelVisible: true });
          }
          if (tp1) {
            series.createPriceLine({ price: tp1, color: '#10b981', lineWidth: 2, lineStyle: LineStyle.Dashed, title: 'TP1', axisLabelVisible: true });
          }
          if (tp2) {
            series.createPriceLine({ price: tp2, color: '#eab308', lineWidth: 2, lineStyle: LineStyle.Dashed, title: 'TP2', axisLabelVisible: true });
          }
          if (sl) {
            series.createPriceLine({ price: sl, color: '#ef4444', lineWidth: 2, lineStyle: LineStyle.Solid, title: isTp1Hit ? 'SL (BE)' : 'SL', axisLabelVisible: true });
          }
        }

      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
        if (onLoaded) onLoaded();
      }
    };

    fetchData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, signal]);

  return (
    <div className="w-full h-[400px] md:h-[500px] lg:h-full lg:min-h-[450px] relative bg-[#05070a]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#05070a]/50 backdrop-blur-sm">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}