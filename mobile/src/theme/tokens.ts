export interface ColorTokens {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  card: string;
  cardBorder: string;
}

export const LightColors: ColorTokens = {
  primary: '#2563eb', // Royal Blue
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  secondary: '#0f172a', // Deep Navy
  accent: '#f59e0b', // Amber Gold
  background: '#f8fafc', // Slate 50
  surface: '#ffffff',
  surfaceElevated: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
};

export const DarkColors: ColorTokens = {
  primary: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryLight: '#1e293b',
  secondary: '#38bdf8',
  accent: '#fbbf24',
  background: '#090d16',
  surface: '#0f172a',
  surfaceElevated: '#1e293b',
  border: '#334155',
  borderLight: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textInverse: '#0f172a',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  card: '#0f172a',
  cardBorder: '#1e293b',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  titleLarge: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  titleMedium: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  button: { fontSize: 15, fontWeight: '600' as const },
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  modal: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};
