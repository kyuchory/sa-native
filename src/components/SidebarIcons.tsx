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

// 수정 아이콘 (연필)
export const EditIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#666666'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 연필 몸체 */}
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* 연필촉 */}
    <Path
      d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 채팅방 기본 아바타 아이콘 (말풍선)
export const ChatRoomIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#666666'
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 말풍선 본체 */}
    <Path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* 말풍선 꼬리 */}
    <Path
      d="M8 12H16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M8 8H16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
