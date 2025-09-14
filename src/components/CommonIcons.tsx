import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

// 뒤로가기 아이콘 - 재사용 가능한 < 모양
const BackIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 텍스트 추가 아이콘
const AddTextIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
        fill={color}
      />
      <Path
        d="M14 2V8H20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12H16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M8 16H16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 이미지 추가 아이콘
const AddImageIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        fill={color}
      />
      <Path
        d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
        fill="white"
      />
      <Path
        d="M21 15L16 10L5 21H19C20.1046 21 21 20.1046 21 19V15Z"
        fill="white"
      />
    </Svg>
  </View>
);

// 비디오 추가 아이콘
const AddVideoIcon = ({ size = 24, color = COLORS.GRAY_600 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 7L16 12L23 17V7Z"
        fill={color}
      />
      <Path
        d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z"
        fill={color}
      />
      <Path
        d="M6 9L10 12L6 15V9Z"
        fill="white"
      />
    </Svg>
  </View>
);

// 드래그 핸들 아이콘 (블록 순서 변경용)
const DragHandleIcon = ({ size = 24, color = COLORS.GRAY_400 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G fill={color}>
        <Path d="M8 6C8.55228 6 9 5.55228 9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5C7 5.55228 7.44772 6 8 6Z" />
        <Path d="M16 6C16.5523 6 17 5.55228 17 5C17 4.44772 16.5523 4 16 4C15.4477 4 15 4.44772 15 5C15 5.55228 15.4477 6 16 6Z" />
        <Path d="M8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13Z" />
        <Path d="M16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z" />
        <Path d="M8 20C8.55228 20 9 19.5523 9 19C9 18.4477 8.55228 18 8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20Z" />
        <Path d="M16 20C16.5523 20 17 19.5523 17 19C17 18.4477 16.5523 18 16 18C15.4477 18 15 18.4477 15 19C15 19.5523 15.4477 20 16 20Z" />
      </G>
    </Svg>
  </View>
);

// 피드 작성 아이콘
const CreateFeedIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8V16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M8 12H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 수정 아이콘 (연필모양 - 단순하고 깔끔한 선으로)
const EditIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a4 4 0 004 4h14a4 4 0 004-4v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 삭제 아이콘 (쓰레기통 캔 모양 - 단순하고 깔끔한 선으로)
const DeleteIcon = ({ size = 24, color = COLORS.ERROR }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 쓰레기통 바닥 */}
      <Path
        d="M3 6h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 쓰레기통 본체 */}
      <Path
        d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 윗부분 손잡이형 */}
      <Path
        d="M10 11v6M14 11v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 체크 아이콘 (모두 읽음 기능)
const CheckIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 메뉴 아이콘 (점 세 개 - 더 넓은 간격으로 배치된 더보기 메뉴)
const MenuIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 26 24" fill="none">
      {/* 세로 중앙에 맞춘 원형 점들 */}
      <Path
        d="M3 12C3 13.3807 4.11929 14.5 5.5 14.5C6.88071 14.5 8 13.3807 8 12C8 10.6193 6.88071 9.5 5.5 9.5C4.11929 9.5 3 10.6193 3 12Z"
        fill={color}
      />
      <Path
        d="M10 12C10 13.3807 11.1193 14.5 12.5 14.5C13.8807 14.5 15 13.3807 15 12C15 10.6193 13.8807 9.5 12.5 9.5C11.1193 9.5 10 10.6193 10 12Z"
        fill={color}
      />
      <Path
        d="M17 12C17 13.3807 18.1193 14.5 19.5 14.5C20.8807 14.5 22 13.3807 22 12C22 10.6193 20.8807 9.5 19.5 9.5C18.1193 9.5 17 10.6193 17 12Z"
        fill={color}
      />
    </Svg>
  </View>
);

// 신고 아이콘 (! 느낌표 모양)
const ReportIcon = ({ size = 24, color = COLORS.ERROR }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 느낌표 세로줄 */}
      <Path
        d="M12 4V17"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 느낌표 점 */}
      <Path
        d="M12 20.5C12.2761 20.5 12.5 20.2761 12.5 20C12.5 19.7239 12.2761 19.5 12 19.5C11.7239 19.5 11.5 19.7239 11.5 20C11.5 20.2761 11.7239 20.5 12 20.5Z"
        fill={color}
      />
    </Svg>
  </View>
);

export { BackIcon, AddTextIcon, AddImageIcon, AddVideoIcon, DragHandleIcon, CreateFeedIcon, EditIcon, DeleteIcon, CheckIcon, MenuIcon, ReportIcon };
