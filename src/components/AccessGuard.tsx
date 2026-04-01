"use client";
import { Lock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccessGuard({ tierName }: { tierName: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="relative group max-w-md w-full">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center">
          <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock size={36} className="text-blue-500" />
          </div>
          
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-4">
             {tierName} <span className="text-blue-500">Required</span>
          </h2>
          
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-10 leading-relaxed">
            Please buy a subscription to <br /> access this page.
          </p>

          <button 
            onClick={() => router.push('/dashboard/payments')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            UPGRADE NOW <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
