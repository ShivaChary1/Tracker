import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  bg: '#FFFBF0',
  card: '#FFFFFF',
  border: '#0a0a0a',
  text: '#0a0a0a',
  textSub: '#6B7280',
  grayLight: '#F3F4F6',
  red: '#FF5E5E',
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  mint: '#e8f5e9',
  peach: '#fff3e0',
  lavender: '#f3e5f5',
  sky: '#e3f2fd',
  tabActiveBg: '#FFE4E4',
  priorityHigh: '#FF5E5E',
  priorityMedium: '#F59E0B',
  priorityLow: '#10B981',
};

export const darkColors: typeof lightColors = {
  bg: '#0F0F0F',
  card: '#1A1A1A',
  border: '#3A3A3A',
  text: '#F0F0F0',
  textSub: '#9CA3AF',
  grayLight: '#252525',
  red: '#FF5E5E',
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  mint: '#0F2010',
  peach: '#201408',
  lavender: '#160D20',
  sky: '#0A1521',
  tabActiveBg: '#2D1212',
  priorityHigh: '#FF5E5E',
  priorityMedium: '#F59E0B',
  priorityLow: '#10B981',
};

export type AppColors = typeof lightColors;

interface ThemeCtx {
  colors: AppColors;
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ colors: lightColors, isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('compass_theme').then(v => {
      if (v === 'dark') setIsDark(true);
    });
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem('compass_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
