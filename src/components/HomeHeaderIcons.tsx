
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

// 알림 아이콘 - 깔끔한 종 모양
export const NotificationIcon = ({
  size = 24,
  color = COLORS.GRAY_600,
}: IconProps) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 종 모양 - 테두리만 */}
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 종 아래 진동 표시 */}
      <Path
        d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 글쓰기 아이콘 - 깔끔한 펜 모양
export const WriteIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 펜 몸체 */}
      <Path
        d="M17 3C17.2652 2.73478 17.5196 2.52039 17.7071 2.33289C18.0976 1.94237 18.5858 1.72386 19.0962 1.72386C19.6066 1.72386 20.0948 1.94237 20.4853 2.33289C20.8758 2.72342 21.0943 3.21162 21.0943 3.722C21.0943 4.23238 20.8758 4.72058 20.4853 5.11111L19.4 6.2L17.8 4.6L17 3Z"
        fill={color}
      />
      {/* 펜 끝 */}
      <Path
        d="M16.4 5L18 6.6L8.6 16H7V14.4L16.4 5Z"
        fill={color}
      />
      {/* 밑줄 */}
      <Path
        d="M19 15V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H5C4.46957 20 3.96086 19.7893 3.58579 19.4142C3.21071 19.0391 3 18.5304 3 18V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </View>
);