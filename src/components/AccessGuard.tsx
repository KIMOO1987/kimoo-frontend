import { Lock } from 'lucide-react';

export default function AccessGuard({ requiredTier }: { requiredTier: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] backdrop-blur-xl max-w-md border-indigo-500/20">
        <Lock size={48} className="text-indigo-500 mx-auto mb-6 animate-pulse" />
        <h2 className="text-3xl font-black italic uppercase text-white mb-4">
          {requiredTier} <span className="text-indigo-500">Required</span>
        </h2>
        <p className="text-zinc-500 text-sm mb-8">
          This institutional module is locked for your current plan. 
          Upgrade to {requiredTier} to unlock this CRT Intelligence.
        </p>
        <button 
          onClick={() => window.location.href = '/payment'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl uppercase italic transition-all"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
