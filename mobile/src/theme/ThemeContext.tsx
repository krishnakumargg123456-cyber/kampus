import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ColorTokens, LightColors, DarkColors } from './tokens';

interface ThemeContextType {
  isDark: boolean;
  themeMode: 'light' | 'dark';
  colors: ColorTokens;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  updateAdminColors: (adminColors: Partial<ColorTokens>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');
  const [adminColorOverrides, setAdminColorOverrides] = useState<Partial<ColorTokens>>({});

  const isDark = themeMode === 'dark';
  const baseColors = isDark ? DarkColors : LightColors;
  const colors: ColorTokens = {
    ...baseColors,
    ...adminColorOverrides,
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateAdminColors = (custom: Partial<ColorTokens>) => {
    setAdminColorOverrides(custom);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themeMode,
        colors,
        toggleTheme,
        setThemeMode,
        updateAdminColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
