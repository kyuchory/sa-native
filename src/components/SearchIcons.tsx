// 검색 관련 SVG 아이콘들

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// 검색(돋보기) 아이콘
export const SearchIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="11" 
        cy="11" 
        r="8" 
        stroke={color} 
        strokeWidth={2.5} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="m21 21-4.35-4.35" 
        stroke={color} 
        strokeWidth={2.5} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 검색 지우기(X) 아이콘
export const ClearSearchIcon = ({ size = 24, color = '#999' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.1} />
      <Path 
        d="m15 9-6 6" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="m9 9 6 6" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 사용자 프로필 아이콘 (프로필 없을 때 사용)
export const UserIcon = ({ size = 24, color = '#999' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Circle 
        cx="12" 
        cy="7" 
        r="4" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 체크 아이콘 (선택된 사용자 표시)
export const CheckCircleIcon = ({ size = 24, color = '#c03525' }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path 
        d="m9 12 2 2 4-4" 
        stroke="white" 
        strokeWidth={2.5} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);
