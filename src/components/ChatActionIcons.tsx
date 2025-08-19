import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// 읽음 표시 아이콘 (체크마크)
export const CheckIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 알림 끄기 아이콘 (벨 + 슬래시)
export const MuteIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      {/* 벨 모양 */}
      <Path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 슬래시 */}
      <Line
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 삭제 아이콘 (쓰레기통)
export const DeleteIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="10"
        y1="11"
        x2="10"
        y2="17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="14"
        y1="11"
        x2="14"
        y2="17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 더 많은 옵션 아이콘 (점 3개)
export const MoreIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="6" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  </View>
);

// 고정 아이콘 (핀)
export const PinIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 2.5L14.5 7.5L16 6L18 8L14 12L12 14L8 10L10 8L8.5 6.5L7 8L5 6L6.5 4.5L9.5 2.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 14L8 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 숨기기 아이콘 (눈 + 슬래시)
export const HideIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 체크박스 아이콘 (비어있음)
export const CheckboxEmptyIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  </View>
);

// 체크박스 아이콘 (선택됨)
export const CheckboxFilledIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);
