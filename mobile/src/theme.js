export const colors = {
  background: '#F3EFE6',
  backgroundSoft: '#FBF8F1',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F2E8',
  surfaceMuted: '#EEF5EF',
  text: '#17231C',
  textSoft: '#566258',
  textMuted: '#7A857C',
  border: '#E5DCCB',
  primary: '#1E6B4B',
  primaryDark: '#143F2D',
  primarySoft: '#DDEDDC',
  accent: '#D38B2C',
  accentSoft: '#F3D7A8',
  success: '#2E8B57',
  warning: '#D97917',
  danger: '#CB4A34',
  info: '#3273DC',
  tabBar: '#12261B',
  tabBarBorder: '#284333',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#132119',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#132119',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const formatPrice = (value) => {
  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    });
  }

  return value ?? '0';
};
