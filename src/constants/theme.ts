// 앱 전체 테마 색상 시스템
export const COLORS = {
  // 기본 색상
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  
  // 회색 계열
  GRAY_50: '#FAFAFA',   // 가장 연한 회색 (배경용)
  GRAY_100: '#F5F5F5',  // 연한 회색 (카드 배경)
  GRAY_200: '#EEEEEE',  // 회색 (구분선)
  GRAY_300: '#E0E0E0',  // 회색 (비활성)
  GRAY_400: '#BDBDBD',  // 중간 회색
  GRAY_500: '#9E9E9E',  // 진한 회색 (보조 텍스트)
  GRAY_600: '#757575',  // 더 진한 회색
  GRAY_700: '#616161',  // 진한 회색 (서브 텍스트)
  GRAY_800: '#424242',  // 매우 진한 회색
  GRAY_900: '#212121',  // 거의 검정 (메인 텍스트)
  
  // 대표 색상 - 추후 변경 가능
  // PRIMARY: '#9C27B0',      // 보라색 (현재 사용 중)
  PRIMARY: '#c03525',      // 메이플스토리 색상 (현재 사용 중)
  PRIMARY_LIGHT: '#BA68C8', // 연한 보라색
  PRIMARY_DARK: '#7B1FA2',  // 진한 보라색
  
  // 액센트 색상
  ACCENT: '#FF4081',       // 핑크 (좋아요, 하트 등)
  SUCCESS: '#4CAF50',      // 초록 (성공)
  WARNING: '#FF9800',      // 주황 (경고)
  ERROR: '#F44336',        // 빨강 (에러)
  
  // 반투명
  BLACK_10: 'rgba(0, 0, 0, 0.1)',
  BLACK_20: 'rgba(0, 0, 0, 0.2)',
  BLACK_30: 'rgba(0, 0, 0, 0.3)',
  BLACK_50: 'rgba(0, 0, 0, 0.5)',
  WHITE_10: 'rgba(255, 255, 255, 0.1)',
  WHITE_20: 'rgba(255, 255, 255, 0.2)',
  WHITE_50: 'rgba(255, 255, 255, 0.5)',
} as const;

// 대표 색상 쉽게 변경하기 위한 함수
export const updatePrimaryColor = (newColor: string) => {
  // 추후 필요시 구현 (앱 재시작 필요)
  console.log('Primary color updated to:', newColor);
};

// 텍스트 색상 시스템
export const TEXT_COLORS = {
  PRIMARY: COLORS.GRAY_900,    // 메인 텍스트
  SECONDARY: COLORS.GRAY_700,  // 서브 텍스트
  DISABLED: COLORS.GRAY_500,   // 비활성 텍스트
  INVERSE: COLORS.WHITE,       // 역방향 (다크 배경용)
  ACCENT: COLORS.PRIMARY,      // 강조 텍스트
} as const;

// 배경 색상 시스템
export const BG_COLORS = {
  PRIMARY: COLORS.WHITE,       // 기본 배경
  SECONDARY: COLORS.GRAY_50,   // 보조 배경
  CARD: COLORS.WHITE,          // 카드 배경
  OVERLAY: COLORS.BLACK_50,    // 오버레이
} as const;

// 그림자 스타일
export const SHADOWS = {
  SMALL: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  LARGE: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// 폰트 시스템
export const TYPOGRAPHY = {
  // 크기
  SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
  // 굵기
  WEIGHT: {
    LIGHT: '300' as const,
    REGULAR: '400' as const,
    MEDIUM: '500' as const,
    SEMIBOLD: '600' as const,
    BOLD: '700' as const,
  },
} as const;

// 간격 시스템
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// 테두리 반경
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 999,
} as const;
