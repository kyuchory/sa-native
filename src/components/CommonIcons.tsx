import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, G, Line } from 'react-native-svg';
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

// 수정 아이콘 (연필모양 - 단순하고 깔끔한 선으로)
const EditIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
    </Svg>
  </View>
);

// 신고 아이콘 (! 느낌표 모양)
const ReportIcon = ({ size = 24, color = COLORS.ERROR }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
      />
      <Path
        d="M12 8V13"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="17" r="1.5" fill={color} />
    </Svg>
  </View>
);

// 공지사항 아이콘 (메가폰/알림)
const NoticeIcon: React.FC<IconProps> = ({ 
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

// 차단용 아이콘 (눈 + 슬래쉬)
const ReportEyeSlashIcon = ({ size = 24, color = COLORS.ERROR }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
        fill={color}
      />
      <Circle cx="12" cy="12" r="3" fill="white" />
      <Line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  </View>
);

// 2. 방패 아이콘 (보호/프라이버시)
const FollowersOnlyIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 손잡이 - 좀 더 위로 */}
      <Circle
        cx="12"
        cy="7"
        r="3"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* 열쇠 몸통 - 훨씬 길게 */}
      <Rect
        x="11"
        y="10"
        width="2"
        height="10"
        fill={color}
        rx="1"
      />
      {/* 톱니 부분 - 간격 조정 */}
      <Rect x="13" y="13.5" width="2.5" height="1.2" fill={color} rx="0.5" />
      {/* <Rect x="13" y="16.2" width="3.5" height="1.2" fill={color} rx="0.5" /> */}
      <Rect x="13" y="17.1" width="2" height="1.2" fill={color} rx="0.5" />
    </Svg>
  </View>
);

// 카메라 아이콘 (채팅 첨부파일용)
const CameraIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 카메라 본체 */}
      <Rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* 렌즈 */}
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* 카메라 렌즈 내부 */}
      <Circle
        cx="12"
        cy="12"
        r="1"
        fill={color}
      />
      {/* 플래시 */}
      <Rect
        x="3"
        y="4"
        width="4"
        height="2"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  </View>
);

const ChatIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H12L8 20V16H6C4.89543 16 4 15.1046 4 14V6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </View>
);

// 저장 아이콘 (디스크/플로피 디스크 모양)
const SaveIcon = ({ size = 24, color = COLORS.GRAY_700 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 디스크 본체 */}
      <Rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* 디스크 내부 원 */}
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* 디스크 중앙 점 */}
      <Circle
        cx="12"
        cy="12"
        r="0.5"
        fill={color}
      />
    </Svg>
  </View>
);

export { BackIcon, AddTextIcon, AddImageIcon, AddVideoIcon, DragHandleIcon, CreateFeedIcon, EditIcon, DeleteIcon, CheckIcon, MenuIcon, ReportIcon, NoticeIcon, ReportEyeSlashIcon, FollowersOnlyIcon, CameraIcon, ChatIcon, SaveIcon };
