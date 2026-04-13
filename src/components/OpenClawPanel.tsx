'use client';
import React, { useState } from 'react';
import { BrainCircuit, Activity, Target, AlertTriangle } from 'lucide-react';

export default function OpenClawPanel({ logs }: { logs: any[] }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const runAnalysis = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    
    try {
      // Snapshot the last 100 logs to provide better context for the AI
      const logsSnapshot = [...logs].slice(-100); 

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsSnapshot })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/20 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
          <BrainCircuit size={14} /> OpenClaw AI
        </h2>
        <button 
          onClick={runAnalysis}
          className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition-all"
        >
          {loading ? 'Analyzing...' : 'Run Diagnostics'}
        </button>
      </div>

      {insights && (
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] border-b border-white/5 pb-2">
            <span className="text-zinc-500">Execution Rate</span>
            <span className="text-emerald-400 font-bold">{insights.executionRate}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-zinc-500 block mb-1 uppercase text-[9px]">Primary Blocker</span>
            <p className="text-white leading-relaxed">{insights.primaryBlocker}</p>
          </div>
          <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
            <span className="text-yellow-500 block mb-1 uppercase text-[9px] font-bold">AI Recommendation</span>
            <p className="text-white text-[11px] font-bold">{insights.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
