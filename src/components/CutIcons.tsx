import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

// 좋아요 아이콘 (하트)
export const HeartIcon = ({ size = 24, color = '#000', filled = false }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  </View>
);

// 댓글 아이콘
export const CommentIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 공유 아이콘
export const ShareIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polygon
        points="16,6 12,2 8,6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Line
        x1="12"
        y1="2"
        x2="12"
        y2="15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 뒤로가기 아이콘
export const BackIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 더보기 아이콘 (점 3개 세로)
export const MoreVerticalIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.6} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="6" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  </View>
);

// 재생 아이콘 (추후 영상용)
export const PlayIcon = ({ size = 24, color = '#000', filled = true }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="5,3 19,12 5,21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  </View>
);

// 일시정지 아이콘 (추후 영상용)
export const PauseIcon = ({ size = 24, color = '#000', filled = true }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.7} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Line
        x1="6"
        y1="4"
        x2="6"
        y2="20"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1="18"
        y1="4"
        x2="18"
        y2="20"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 음소거 아이콘
export const VolumeOffIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="11,5 6,9 2,9 2,15 6,15 11,19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Line
        x1="23"
        y1="9"
        x2="17"
        y2="15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="17"
        y1="9"
        x2="23"
        y2="15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 음량 아이콘
export const VolumeOnIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="11,5 6,9 2,9 2,15 6,15 11,19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.54 8.46a5 5 0 0 1 0 7.07"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);
