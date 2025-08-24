import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// 사진/동영상 아이콘 (갤러리/미디어)
export const MediaIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = '#666666' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 배경 사각형 */}
    <Rect 
      x="3" 
      y="3" 
      width="18" 
      height="18" 
      rx="2" 
      ry="2" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
    {/* 이미지 표시를 위한 산 모양 */}
    <Path 
      d="M9 9L15 15L21 9" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    {/* 작은 원 (태양/조명) */}
    <Circle 
      cx="8.5" 
      cy="8.5" 
      r="1.5" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
  </Svg>
);

// 공지사항 아이콘 (메가폰/알림)
export const NoticeIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = '#666666' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 메가폰 본체 */}
    <Path 
      d="M3 11V13C3 13.55 3.45 14 4 14H5L9 18V6L5 10H4C3.45 10 3 10.45 3 11Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    {/* 소리 파장 */}
    <Path 
      d="M15.54 8.46C16.4709 9.39094 17.0043 10.6484 17.0043 11.96C17.0043 13.2716 16.4709 14.5291 15.54 15.46" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <Path 
      d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 대화상대 아이콘 (사람들)
export const MembersIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = '#666666' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 첫 번째 사람 */}
    <Path 
      d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <Circle 
      cx="9" 
      cy="7" 
      r="4" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
    {/* 두 번째 사람 (뒤쪽) */}
    <Path 
      d="M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <Path 
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 더보기 화살표 아이콘
export const ChevronRightIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = '#999999' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M9 18L15 12L9 6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
