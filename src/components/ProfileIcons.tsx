import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G, Line} from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

// 설정 아이콘 - 깔끔한 톱니바퀴 (가운데 구멍)
const SettingsIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="translate(12, 12)">
        {/* 8개의 톱니 */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
          <G key={index} transform={`rotate(${angle})`}>
            <Rect x="-1.5" y="-9" width="3" height="3" rx="1" fill={color} />
          </G>
        ))}
        {/* 메인 원형 몸체 (가운데가 뚫린 도넛 형태) */}
        <Path
          d="M 0,-6.5 A 6.5,6.5 0 1,1 0,6.5 A 6.5,6.5 0 1,1 0,-6.5 Z M 0,-3 A 3,3 0 1,0 0,3 A 3,3 0 1,0 0,-3 Z"
          fill={color}
          fillRule="evenodd"
        />
      </G>
    </Svg>
  </View>
);

// 피드 그리드 아이콘
const GridIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
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
const ListIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
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
const VideoIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="18" rx="2" fill={color} />
      <Path d="M10 8L16 12L10 16V8Z" fill="white" />
    </Svg>
  </View>
);

// 캐릭터 아이콘
const CharacterIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
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

// 프로필 수정 아이콘 (연필)
const ProfileEditIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 메뉴 아이콘 (점 세 개 - 가로로)
const MenuIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="18" cy="12" r="2" fill={color} />
    </Svg>
  </View>
);

// 팔로우 아이콘 (사람 + 플러스)
const FollowIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 7C16 9.21 14.21 11 12 11C9.79 11 8 9.21 8 7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7Z" fill={color} />
      <Path d="M12 14C8.13 14 5 16.13 5 19C5 19.552 4.552 20 4 20S3 19.552 3 19C3 15.13 6.13 12 10 12H14C17.87 12 21 15.13 21 19C21 19.552 20.552 20 20 20S19 19.552 19 19C19 16.13 15.87 14 12 14Z" fill={color} />
      <Path d="M20 5H22V3H20V1H18V3H16V5H18V7H20V5Z" fill={color} />
    </Svg>
  </View>
);

// 채팅 아이콘 (메시지 버블)
const ChatIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H6V24H9L12 21H20C21.1 21 22 20.1 22 19V4C22 2.9 21.1 2 20 2Z" fill={color} />
      <Path d="M7 9H17V11H7V9Z" fill="white" />
      <Path d="M7 12H15V14H7V12Z" fill="white" />
    </Svg>
  </View>
);

export { SettingsIcon, GridIcon, ListIcon, VideoIcon, CharacterIcon, ProfileEditIcon, MenuIcon, FollowIcon, ChatIcon };
