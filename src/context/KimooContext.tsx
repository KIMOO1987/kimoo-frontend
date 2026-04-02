"use client";
import React, { createContext, useContext, useState } from 'react';

// 1. Define specific shapes for better stability
interface Preferences {
  riskPerTrade: number;
  defaultRR: number;
  targetDailyGoal: number;
}

interface KimooContextType {
  // --- SIGNAL FILTERING ---
  risk: number; // Changed from any to number
  setRisk: React.Dispatch<React.SetStateAction<number>>;
  watchlist: string[];
  setWatchlist: React.Dispatch<React.SetStateAction<string[]>>;

  // --- PREFERENCE PARAMETERS ---
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

const KimooContext = createContext<KimooContextType | null>(null);

export function KimooProvider({ children }: { children: React.ReactNode }) {
  // 1. Missing Risk State (Added this to fix the error)
  const [risk, setRisk] = useState<number>(1); // Default 1% risk

  // 2. Asset Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(['XAUUSD', 'NAS100', 'US30', 'EURUSD']);
  
  // 3. User Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    riskPerTrade: 1,      
    defaultRR: 3.0,       
    targetDailyGoal: 500  
  });

  return (
    <KimooContext.Provider value={{ 
      risk,
      setRisk,
      watchlist, 
      setWatchlist, 
      preferences, 
      setPreferences
    }}>
      {children}
    </KimooContext.Provider>
  );
}

export const useKimoo = () => {
  const context = useContext(KimooContext);
  if (!context) {
    throw new Error("useKimoo must be used within a KimooProvider");
  }
  return context;
};
