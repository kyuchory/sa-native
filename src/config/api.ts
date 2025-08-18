// API 설정
export const API_CONFIG = {
  // 개발 환경
  development: {
    // React Native에서는 localhost 대신 실제 IP 주소 사용
    baseURL: 'http://10.0.2.2:3001', // Android 에뮬레이터
    // baseURL: 'http://localhost:3001', // iOS 시뮬레이터 
    // baseURL: 'http://211.217.175.23:3001', // 실제 기기용 (주인님 컴퓨터의 IP)
    timeout: 10000,
  },
  // 프로덕션 환경
  production: {
    baseURL: 'https://your-production-api.com', // 실제 프로덕션 URL로 변경
    timeout: 15000,
  },
};

// 현재 환경에 따른 설정 반환
export const getApiConfig = () => {
  // __DEV__는 React Native에서 제공하는 개발 환경 플래그
  const isDevelopment = __DEV__;
  return isDevelopment ? API_CONFIG.development : API_CONFIG.production;
};

// API 엔드포인트
export const API_ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    checkEmail: '/auth/check-email',
    checkNickname: '/auth/check-nickname',
  },
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
  },
  // 추가 도메인별 엔드포인트들...
};
