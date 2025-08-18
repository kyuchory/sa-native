import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, Defs, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  focused?: boolean;
}

// 홈 아이콘 - 깔끔한 단색
export const HomeIcon = ({ size = 24, focused = false }: IconProps) => {
  const color = focused ? COLORS.PRIMARY : COLORS.GRAY_500;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V9Z"
          fill={color}
        />
      </Svg>
    </View>
  );
};

// 피드 아이콘 - 격자 단색
export const FeedIcon = ({ size = 24, focused = false }: IconProps) => {
  const color = focused ? COLORS.PRIMARY : COLORS.GRAY_500;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G fill={color}>
          <Rect x="3" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="3" width="7" height="7" rx="1" />
          <Rect x="3" y="14" width="7" height="7" rx="1" />
          <Rect x="14" y="14" width="7" height="7" rx="1" />
        </G>
      </Svg>
    </View>
  );
};

// 검색 아이콘 - 돋보기 단색
export const SearchIcon = ({ size = 24, focused = false }: IconProps) => {
  const color = focused ? COLORS.PRIMARY : COLORS.GRAY_500;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
          fill={color}
        />
        <Path
          d="M16.5 16.5L21 21"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 컷 아이콘 - 비디오 플레이 단색 (인스타 릴스 스타일)
export const CutIcon = ({ size = 24, focused = false }: IconProps) => {
  const color = focused ? COLORS.PRIMARY : COLORS.GRAY_500;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="3"
          fill={color}
        />
        <Polygon
          points="10,8 16,12 10,16"
          fill="white"
        />
      </Svg>
    </View>
  );
};

// 프로필 아이콘 - 사람 단색
export const ProfileIcon = ({ size = 24, focused = false }: IconProps) => {
  const color = focused ? COLORS.PRIMARY : COLORS.GRAY_500;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" fill={color} />
        <Path
          d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21"
          fill={color}
        />
      </Svg>
    </View>
  );
};

// 아이콘 매핑 객체
export const CleanTabIconComponents = {
  HomeTab: HomeIcon,
  FeedTab: FeedIcon,
  SearchTab: SearchIcon,
  CutTab: CutIcon,
  ProfileTab: ProfileIcon,
} as const;
