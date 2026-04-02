"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Define specific shapes for better stability
interface Preferences {
  riskPerTrade: number;
  defaultRR: number;
  targetDailyGoal: number;
}

interface KimooContextType {
  // --- SIGNAL FILTERING ---
  risk: number;
  setRisk: React.Dispatch<React.SetStateAction<number>>;
  watchlist: string[];
  setWatchlist: React.Dispatch<React.SetStateAction<string[]>>;

  // --- PREFERENCE PARAMETERS ---
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

const KimooContext = createContext<KimooContextType | null>(null);

export function KimooProvider({ children }: { children: React.ReactNode }) {
  // 1. Risk State - Default to 1%
  const [risk, setRisk] = useState<number>(1);

  // 2. Asset Watchlist - Expanded for testing all asset classes
  const [watchlist, setWatchlist] = useState<string[]>([
    'XAUUSD', 'NAS100', 'US30', 'EURUSD', 'BTCUSD', 'GBPUSD'
  ]);
  
  // 3. User Preferences - High-level defaults to ensure calculations work
  const [preferences, setPreferences] = useState<Preferences>({
    riskPerTrade: 1,      
    defaultRR: 3.0,       
    targetDailyGoal: 1000 // Higher goal for testing visibility
  });

  // DEBUG: Monitor context changes in console
  useEffect(() => {
    console.log("KIMOO CONTEXT ACTIVE: Watchlist & Preferences Initialized.");
  }, []);

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