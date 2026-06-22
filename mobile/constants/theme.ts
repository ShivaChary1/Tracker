import { StyleSheet } from 'react-native';
import { type AppColors } from '@/lib/theme';

// Static layout-only shared styles (no colours — add colours inline per screen)
export const S = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' as const },
  between: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  h1: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15 },
});

// Colour-aware helpers — call with colors from useTheme()
export function card(colors: AppColors, extra?: object) {
  return {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1 as const,
    shadowRadius: 0,
    elevation: 4,
    ...extra,
  };
}

export function cardSm(colors: AppColors, extra?: object) {
  return {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1 as const,
    shadowRadius: 0,
    elevation: 3,
    ...extra,
  };
}

export function btn(colors: AppColors) {
  return {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1 as const,
    shadowRadius: 0,
    elevation: 3,
  };
}

export function input(colors: AppColors) {
  return {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.text,
  };
}

// Legacy static export for files that haven't migrated yet
export const C = {
  bg: '#FFFBF0',
  black: '#0a0a0a',
  white: '#FFFFFF',
  red: '#FF5E5E',
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  mint: '#e8f5e9',
  peach: '#fff3e0',
  lavender: '#f3e5f5',
  sky: '#e3f2fd',
};

export const shadow = {
  shadowColor: '#0a0a0a',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1 as const,
  shadowRadius: 0,
  elevation: 4,
};

export const shadowSm = {
  shadowColor: '#0a0a0a',
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1 as const,
  shadowRadius: 0,
  elevation: 3,
};

// Re-export Colors for any legacy consumers
export const Colors = {
  light: { text: C.black, background: C.bg, tint: C.red, icon: C.gray, tabIconDefault: C.gray, tabIconSelected: C.red },
  dark:  { text: '#F0F0F0', background: '#0F0F0F', tint: C.red, icon: '#9CA3AF', tabIconDefault: '#9CA3AF', tabIconSelected: C.red },
};
