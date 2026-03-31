"use client";
import React, { createContext, useContext, useState } from 'react';

// Define the shape of our Global Signal & Preference State
interface KimooContextType {
  // --- SIGNAL FILTERING ---
  risk: any;
  setRisk: any;
  watchlist: string[];
  setWatchlist: React.Dispatch<React.SetStateAction<string[]>>;

  // --- PREFERENCE PARAMETERS (For UI Calculations) ---
  preferences: {
    riskPerTrade: number;
    defaultRR: number;
    targetDailyGoal: number;
  };
  setPreferences: React.Dispatch<React.SetStateAction<{
    riskPerTrade: number;
    defaultRR: number;
    targetDailyGoal: number;
  }>>;
}

const KimooContext = createContext<KimooContextType | null>(null);

export function KimooProvider({ children }: { children: React.ReactNode }) {
  // 1. Asset Watchlist (Used to filter the Signal Feed)
  const [watchlist, setWatchlist] = useState(['XAUUSD', 'NAS100', 'US30']);
  
  // 2. User Preferences (Used for UI-side profit/risk math)
  const [preferences, setPreferences] = useState({
    riskPerTrade: 1,      // percentage %
    defaultRR: 3.0,       // Risk:Reward Ratio
    targetDailyGoal: 500  // USD or local currency
  });

  return (
    <KimooContext.Provider value={{ 
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
