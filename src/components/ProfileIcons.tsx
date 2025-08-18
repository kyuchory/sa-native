import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

// 설정 아이콘 - 깔끔한 톱니바퀴 (가운데 구멍)
export const SettingsIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 톱니바퀴 메인 몸체 */}
      <Path
        d="M10.5 1.5H13.5V4.5L15.5 5.5L17.5 3.5L19.5 5.5L17.5 7.5L18.5 9.5H21.5V12.5H18.5L17.5 14.5L19.5 16.5L17.5 18.5L15.5 16.5L13.5 17.5V20.5H10.5V17.5L8.5 16.5L6.5 18.5L4.5 16.5L6.5 14.5L5.5 12.5H2.5V9.5H5.5L6.5 7.5L4.5 5.5L6.5 3.5L8.5 5.5L10.5 4.5V1.5Z"
        fill={color}
      />
      {/* 가운데 원형 구멍 */}
      <Circle cx="12" cy="12" r="4.5" fill="white" />
    </Svg>
  </View>
);

// 피드 그리드 아이콘
export const GridIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G fill={color}>
        <Rect x="3" y="3" width="6" height="6" />
        <Rect x="11" y="3" width="6" height="6" />
        <Rect x="19" y="3" width="2" height="6" />
        <Rect x="3" y="11" width="6" height="6" />
        <Rect x="11" y="11" width="6" height="6" />
        <Rect x="19" y="11" width="2" height="6" />
        <Rect x="3" y="19" width="6" height="2" />
        <Rect x="11" y="19" width="6" height="2" />
        <Rect x="19" y="19" width="2" height="2" />
      </G>
    </Svg>
  </View>
);

// 게시물 리스트 아이콘
export const ListIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G fill={color}>
        <Rect x="3" y="4" width="18" height="3" />
        <Rect x="3" y="10" width="18" height="3" />
        <Rect x="3" y="16" width="18" height="3" />
      </G>
    </Svg>
  </View>
);

// 비디오/릴스 아이콘
export const VideoIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="18" rx="2" fill={color} />
      <Path d="M10 8L16 12L10 16V8Z" fill="white" />
    </Svg>
  </View>
);

// 캐릭터 아이콘
export const CharacterIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" fill={color} />
      <Path d="M12 14C8 14 5 16 5 18.5V20H19V18.5C19 16 16 14 12 14Z" fill={color} />
      <Circle cx="9" cy="6" r="1" fill="white" />
      <Circle cx="15" cy="6" r="1" fill="white" />
      <Path d="M10.5 8.5C10.5 9 11 9.5 12 9.5C13 9.5 13.5 9 13.5 8.5" stroke="white" strokeWidth="1" fill="none" />
    </Svg>
  </View>
);

export { SettingsIcon, GridIcon, ListIcon, VideoIcon, CharacterIcon };