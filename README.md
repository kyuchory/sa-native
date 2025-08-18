# React Native 네비게이션 테스트 프로젝트

이 프로젝트는 React Native의 네비게이션과 라우팅을 이해하기 위한 테스트 프로젝트입니다.

## 🏗️ 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── screens/       # 화면 컴포넌트들
│   ├── HomeScreen.tsx      # 홈 화면
│   ├── ProfileScreen.tsx   # 프로필 화면
│   └── SettingsScreen.tsx  # 설정 화면
├── navigation/    # 네비게이션 설정
│   └── AppNavigator.tsx    # 메인 네비게이터
├── types/         # TypeScript 타입 정의
│   └── navigation.ts       # 네비게이션 타입
└── utils/         # 유틸리티 함수들
```

## 🚀 주요 기능

### 1. 홈 화면 (HomeScreen)
- 다른 화면으로 이동할 수 있는 버튼들
- 프로필 화면으로 이동 (파라미터 전달)
- 설정 화면으로 이동

### 2. 프로필 화면 (ProfileScreen)
- 라우트 파라미터를 받아서 사용자 ID 표시
- 뒤로 가기 기능
- 설정 화면으로 이동

### 3. 설정 화면 (SettingsScreen)
- 다크 모드 토글 스위치
- 알림 설정 토글 스위치
- 뒤로 가기 및 홈으로 이동

## 🧭 네비게이션 개념

### Stack Navigator
- 화면을 스택처럼 쌓아서 관리
- `navigation.navigate()`: 새 화면으로 이동
- `navigation.goBack()`: 이전 화면으로 돌아가기
- `navigation.push()`: 같은 화면을 다시 쌓기

### 라우트 파라미터
- 화면 간 데이터 전달
- TypeScript로 타입 안전성 보장

## 📱 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# Android 에뮬레이터에서 실행
npm run android

# iOS 시뮬레이터에서 실행
npm run ios
```

## 🔧 사용된 주요 라이브러리

- `@react-navigation/native`: React Navigation 핵심
- `@react-navigation/stack`: 스택 네비게이션
- `react-native-screens`: 네이티브 화면 최적화
- `react-native-safe-area-context`: 안전 영역 관리

## 💡 학습 포인트

1. **네비게이션 구조**: Stack Navigator의 기본 개념
2. **화면 간 이동**: navigate, goBack 등의 사용법
3. **파라미터 전달**: 화면 간 데이터 전달 방법
4. **TypeScript 통합**: 타입 안전한 네비게이션 구현
5. **실무 디렉토리 구조**: 확장 가능한 프로젝트 구조

## 🎯 다음 단계

- Bottom Tab Navigator 추가
- Drawer Navigator 추가
- 중첩 네비게이션 구현
- 딥링킹 설정
- 네비게이션 상태 관리
