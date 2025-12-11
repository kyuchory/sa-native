import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, G } from 'react-native-svg';
import { useThemeStore } from '../stores/themeStore';

interface IconProps {
  size?: number;
}

// 게시물 아이콘 - 스퀘어와 텍스트 라인들
const PostsIcon = ({ size = 20 }: IconProps) => {
  const { colors } = useThemeStore();
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        {/* 문서 배경 */}
        <Path
          d="M5 3C5 2.44772 5.44772 2 6 2H11.5858C11.851 2 12.1054 2.10536 12.2929 2.29289L16.7071 6.70711C16.8946 6.89464 17 7.149 17 7.41421V17C17 17.5523 16.5523 18 16 18H6C5.44772 18 5 17.5523 5 17V3Z"
          fill={colors.PRIMARY}
        />
        {/* 텍스트 라인들 */}
        <Path
          d="M8 9H14"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <Path
          d="M8 12H14"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <Path
          d="M8 15H11"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 피드 아이콘 - 3x3 격자 패턴
const FeedsIcon = ({ size = 20 }: IconProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <G fill={colors.PRIMARY}>
          {/* 1행 */}
          <Rect x="2" y="2" width="4" height="4" rx="1" />
          <Rect x="8" y="2" width="4" height="4" rx="1" />
          <Rect x="14" y="2" width="4" height="4" rx="1" />
          {/* 2행 */}
          <Rect x="2" y="8" width="4" height="4" rx="1" />
          <Rect x="8" y="8" width="4" height="4" rx="1" />
          <Rect x="14" y="8" width="4" height="4" rx="1" />
          {/* 3행 */}
          <Rect x="2" y="14" width="4" height="4" rx="1" />
          <Rect x="8" y="14" width="4" height="4" rx="1" />
          <Rect x="14" y="14" width="4" height="4" rx="1" />
        </G>
      </Svg>
    </View>
  );
};

// 사용자 아이콘 - 사람 아이콘 (프로필과는 다른 스타일)
const UsersIcon = ({ size = 20 }: IconProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="7" r="3" fill={colors.PRIMARY} />
        <Path
          d="M4 18V16C4 13.7909 5.79086 12 8 12H12C14.2091 12 16 13.7909 16 16V18"
          fill={colors.PRIMARY}
        />
      </Svg>
    </View>
  );
};

// 컷츠 아이콘 - 바텀 탭 CutIcon을 primary 색상으로
const CutsIcon = ({ size = 20 }: IconProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="3"
          fill={colors.PRIMARY}
        />
        <Polygon
          points="10,8 16,12 10,16"
          fill="white"
        />
      </Svg>
    </View>
  );
};

// 아이콘 매핑 객체
export const PopularIcons = {
  PostsIcon,
  FeedsIcon,
  UsersIcon,
  CutsIcon,
} as const;
