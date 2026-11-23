import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTokens, LightColors, DarkColors } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDark: boolean;
  themePreference: ThemePreference;
  themeMode: 'light' | 'dark'; // for backward compatibility
  colors: ColorTokens;
  toggleTheme: () => void;
  setThemePreference: (pref: ThemePreference) => void;
  setThemeMode: (mode: 'light' | 'dark') => void; // for backward compatibility
  updateAdminColors: (adminColors: Partial<ColorTokens>) => void;
}

const THEME_STORAGE_KEY = '@kampus_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [adminColorOverrides, setAdminColorOverrides] = useState<Partial<ColorTokens>>({});

  useEffect(() => {
    // Load persisted theme preference on launch
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      })
      .catch((err) => console.warn('[ThemeContext] Failed to load theme preference:', err));
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref).catch(() => {});
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemePreference(mode);
  };

  // Determine actual theme (light or dark)
  const isDark =
    themePreference === 'system'
      ? systemScheme === 'dark'
      : themePreference === 'dark';

  const baseColors = isDark ? DarkColors : LightColors;
  const colors: ColorTokens = {
    ...baseColors,
    ...adminColorOverrides,
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setThemePreference(next);
  };

  const updateAdminColors = (custom: Partial<ColorTokens>) => {
    setAdminColorOverrides(custom);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themePreference,
        themeMode: isDark ? 'dark' : 'light',
        colors,
        toggleTheme,
        setThemePreference,
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
