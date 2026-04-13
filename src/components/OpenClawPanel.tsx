'use client';
import React, { useState } from 'react';
import { BrainCircuit, Activity, Target, AlertTriangle } from 'lucide-react';

interface OpenClawPanelProps {
  logs: string[];
}

export default function OpenClawPanel({ logs }: OpenClawPanelProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const runAnalysis = async () => {
      // 1. Take a static "Snapshot" of the logs currently in memory
      const logsSnapshot = [...logs].slice(-50); 
      
      if (logsSnapshot.length === 0) {
          alert("Wait for at least one log to appear in the terminal.");
          return;
      }
  
      setLoading(true);
      try {
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsSnapshot }) // Send the snapshot
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setInsights(data);
      } catch (err: any) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[11px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-3">
          <BrainCircuit size={16} /> OpenClaw Engine
        </h2>
        <button 
          onClick={runAnalysis}
          disabled={loading || logs.length === 0}
          className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Run Diagnostics'}
        </button>
      </div>

      {!insights && !loading && (
        <div className="text-zinc-500 text-[11px] font-mono leading-relaxed text-center py-6">
          System idle. Awaiting command to analyze telemetry data.
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 text-yellow-500 animate-pulse gap-3">
          <Activity size={24} className="animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest">Processing Data...</span>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-4 font-mono text-[11px]">
          <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex gap-3">
            <Activity className="text-emerald-400 shrink-0" size={16} />
            <div>
              <span className="text-zinc-500 uppercase font-black tracking-widest text-[9px] block mb-1">Execution Rate</span>
              <span className="text-white">{insights.executionRate}</span>
            </div>
          </div>
          
          <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex gap-3">
            <AlertTriangle className="text-red-400 shrink-0" size={16} />
            <div>
              <span className="text-zinc-500 uppercase font-black tracking-widest text-[9px] block mb-1">Primary Blocker</span>
              <span className="text-zinc-300 leading-relaxed">{insights.primaryBlocker}</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-yellow-500/20 p-4 rounded-xl flex gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-yellow-500/5 blur-[20px]" />
            <Target className="text-yellow-400 shrink-0 relative z-10" size={16} />
            <div className="relative z-10">
              <span className="text-yellow-500 uppercase font-black tracking-widest text-[9px] block mb-1">AI Recommendation</span>
              <span className="text-white font-bold leading-relaxed">{insights.recommendation}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
