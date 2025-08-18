import React from 'react';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

// 홈 아이콘 - 미니멀한 집 모양
export const HomeIcon = ({ size = 24, color = COLORS.GRAY_500, focused = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
  </Svg>
);

// 피드 아이콘 - 격자 모양 (인스타그램 스타일)
export const FeedIcon = ({ size = 24, color = COLORS.GRAY_500, focused = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
    <Rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
    <Rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
    <Rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
  </Svg>
);

// 검색 아이콘 - 돋보기
export const SearchIcon = ({ size = 24, color = COLORS.GRAY_500, focused = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="11"
      cy="11"
      r="8"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '10' : 'none'}
    />
    <Path
      d="M21 21L16.5 16.5"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
    />
  </Svg>
);

// 컷 아이콘 - 인스타 릴스 스타일 (비디오 카메라 + 플레이 버튼)
export const CutIcon = ({ size = 24, color = COLORS.GRAY_500, focused = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 외부 프레임 */}
    <Rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="3"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '10' : 'none'}
    />
    {/* 플레이 버튼 */}
    <Polygon
      points="10,8 10,16 16,12"
      fill={focused ? COLORS.PRIMARY : color}
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={0.5}
    />
    {/* 상단 녹화 표시 */}
    <Circle
      cx="6"
      cy="7"
      r="1.5"
      fill={focused ? COLORS.ERROR : COLORS.GRAY_400}
    />
  </Svg>
);

// 프로필 아이콘 - 깔끔한 사람 모양
export const ProfileIcon = ({ size = 24, color = COLORS.GRAY_500, focused = false }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 머리 */}
    <Circle
      cx="12"
      cy="8"
      r="4"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? COLORS.PRIMARY + '20' : 'none'}
    />
    {/* 몸 */}
    <Path
      d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21"
      stroke={focused ? COLORS.PRIMARY : color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      fill={focused ? COLORS.PRIMARY + '10' : 'none'}
    />
  </Svg>
);

// 아이콘 매핑 객체
export const TabIconComponents = {
  HomeTab: HomeIcon,
  FeedTab: FeedIcon,
  SearchTab: SearchIcon,
  CutTab: CutIcon,
  ProfileTab: ProfileIcon,
} as const;
