import { useColorScheme } from 'react-native';

const light = {
  bg: '#EEF0EC',
  surface: '#FFFFFF',
  fg: '#1B1F1D',
  muted: '#5F6862',
  line: '#D3D8D2',
  drum: '#161A18',
  drumFg: '#F3F2EA',
  cell: '#1E2321',
  accent: '#E8A21A',
  accentDeep: '#A86F0A',
  accentFg: '#1B1F1D',
  danger: '#B93A27',
  ok: '#2E7A4C',
  dark: false,
};

const dark: typeof light = {
  bg: '#111413',
  surface: '#1B1F1D',
  fg: '#E9ECE8',
  muted: '#97A19A',
  line: '#2E3431',
  drum: '#050606',
  drumFg: '#F3F2EA',
  cell: '#1E2321',
  accent: '#F0AE2C',
  accentDeep: '#9A6408',
  accentFg: '#141614',
  danger: '#E4664F',
  ok: '#5DC08A',
  dark: true,
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

export const font = {
  ui: 'Archivo_500Medium',
  uiSemi: 'Archivo_600SemiBold',
  uiBold: 'Archivo_700Bold',
  num: 'ChivoMono_700Bold',
};
