// 다크 모드 색상 정의
export const DARK_COLORS = {
  // 기본 색상 (기존과 반전)
  BLACK: '#FFFFFF',
  WHITE: '#1C1C1E',

  // 회색 계열 - 다크에 맞춰 조정
  GRAY_50: '#2C2C2E',
  GRAY_100: '#3A3A3C',
  GRAY_200: '#48484A',
  GRAY_300: '#636366',
  GRAY_400: '#8E8E93',
  GRAY_500: '#AEAEB2',
  GRAY_600: '#C7C7CC',
  GRAY_700: '#D1D1D6',
  GRAY_800: '#E5E5EA',
  GRAY_900: '#F2F2F7',

  // 대표 색상 - 다크에 맞춰 조정
  PRIMARY: '#5C6B21', // 더 밝은 퍼플
  PRIMARY_LIGHT: '#7A8A29',
  PRIMARY_DARK: '#475418',

  // 액센트 색상 (다크용 조정)
  ACCENT: '#FF5573',
  SUCCESS: '#32D74B',
  WARNING: '#FF9500',
  ERROR: '#FF453A',

  // 반투명 (다크용)
  BLACK_10: 'rgba(255, 255, 255, 0.1)',
  BLACK_20: 'rgba(255, 255, 255, 0.2)',
  BLACK_30: 'rgba(255, 255, 255, 0.3)',
  BLACK_50: 'rgba(255, 255, 255, 0.5)',
  WHITE_10: 'rgba(255, 255, 255, 0.1)',
  WHITE_20: 'rgba(255, 255, 255, 0.2)',
  WHITE_50: 'rgba(255, 255, 255, 0.5)',
} as const;
