import { ColorSchemeName } from 'react-native'

export const COLLECTION_COLORS = [
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#0891B2',
  '#65A30D',
  '#9333EA',
  '#EA580C',
  '#0F766E',
  '#E11D48',
  '#B45309',
  '#BE185D',
  '#1D4ED8',
  '#15803D',
  '#C2410C',
  '#6D28D9',
  '#0369A1',
  '#166534',
]

export const COLLECTION_ICONS = [
  'folder',
  'book',
  'star',
  'heart',
  'briefcase',
  'code-slash',
  'film',
  'musical-notes',
  'camera',
  'game-controller',
  'globe',
  'school',
  'fitness',
  'cart',
  'airplane',
  'restaurant',
  'flask',
  'leaf',
  'car',
  'home',
  'people',
  'newspaper',
  'trophy',
  'hammer',
  'wallet',
  'paint-brush',
  'planet',
  'headset',
  'medkit',
  'paw',
]

const lightColors = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryContainer: '#EDE9FE',
  onPrimaryContainer: '#4C1D95',
  secondary: '#6366F1',

  background: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F0FF',
  card: '#FFFFFF',
  cardBorder: '#E9E3FF',

  text: '#09090B',
  textSecondary: '#52525B',
  textTertiary: '#A1A1AA',
  textOnPrimary: '#FFFFFF',

  border: '#E4E0F0',
  divider: '#F0EEF8',

  error: '#DC2626',
  errorContainer: '#FEE2E2',
  success: '#16A34A',
  successContainer: '#DCFCE7',
  warning: '#D97706',
  warningContainer: '#FEF3C7',

  fab: '#7C3AED',
  fabText: '#FFFFFF',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E4E0F0',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',

  inputBg: '#FAFAFA',
  inputBorder: '#D1D5DB',
  inputFocusBorder: '#7C3AED',

  chip: '#EDE9FE',
  chipText: '#5B21B6',
  chipActive: '#7C3AED',
  chipActiveText: '#FFFFFF',

  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(124,58,237,0.12)',
}

const darkColors: typeof lightColors = {
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryContainer: '#4C1D95',
  onPrimaryContainer: '#EDE9FE',
  secondary: '#818CF8',

  background: '#0F0D16',
  surface: '#1A1625',
  surfaceVariant: '#211C30',
  card: '#1A1625',
  cardBorder: '#2D2640',

  text: '#F5F3FF',
  textSecondary: '#BDB8D4',
  textTertiary: '#6B6585',
  textOnPrimary: '#FFFFFF',

  border: '#2D2640',
  divider: '#211C30',

  error: '#F87171',
  errorContainer: '#450A0A',
  success: '#4ADE80',
  successContainer: '#052E16',
  warning: '#FCD34D',
  warningContainer: '#451A03',

  fab: '#A78BFA',
  fabText: '#1A1625',

  tabBar: '#1A1625',
  tabBarBorder: '#2D2640',
  tabBarActive: '#A78BFA',
  tabBarInactive: '#6B6585',

  inputBg: '#211C30',
  inputBorder: '#3D3558',
  inputFocusBorder: '#A78BFA',

  chip: '#2D2640',
  chipText: '#C4B5FD',
  chipActive: '#A78BFA',
  chipActiveText: '#1A1625',

  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.4)',
}

export function getColors(scheme: ColorSchemeName) {
  return scheme === 'dark' ? darkColors : lightColors
}

export type AppColors = typeof lightColors

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const typography = {
  displayLarge: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold' as const, lineHeight: 40 },
  displayMedium: { fontSize: 28, fontFamily: 'SpaceGrotesk_700Bold' as const, lineHeight: 36 },
  headlineLarge: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' as const, lineHeight: 32 },
  headlineMedium: { fontSize: 20, fontFamily: 'SpaceGrotesk_600SemiBold' as const, lineHeight: 28 },
  headlineSmall: { fontSize: 18, fontFamily: 'SpaceGrotesk_600SemiBold' as const, lineHeight: 24 },
  titleLarge: { fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' as const, lineHeight: 22 },
  titleMedium: { fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' as const, lineHeight: 20 },
  titleSmall: { fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' as const, lineHeight: 18 },
  bodyLarge: { fontSize: 16, fontFamily: 'SpaceGrotesk_400Regular' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontFamily: 'SpaceGrotesk_400Regular' as const, lineHeight: 16 },
  labelLarge: { fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' as const, lineHeight: 18 },
  labelMedium: { fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' as const, lineHeight: 16 },
  labelSmall: { fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium' as const, lineHeight: 14 },
}
