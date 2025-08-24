import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// 돋보기 아이콘
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} fill="none"/>
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// 햄버거 메뉴 아이콘
export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 6h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3 18h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// 플러스 아이콘 (동그라미 안에)
export const PlusCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none"/>
    <Path d="M12 8v8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// 전송 아이콘 (종이비행기)
export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M22 2L11 13" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Path 
      d="M22 2L15 22L11 13L2 9L22 2Z" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);
