// 채팅 관련 Mock 데이터

import { ChatRoom, ChatUser, Message, ChatRequest } from '../types/chat';

// Mock 사용자 데이터
export const MOCK_CHAT_USERS: ChatUser[] = [
  {
    id: 1,
    nickname: '메이플러버',
    profile_img: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=M',
  },
  {
    id: 2,
    nickname: '스타포스왕',
    profile_img: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=S',
  },
  {
    id: 3,
    nickname: '큐브마스터',
    profile_img: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=C',
  },
  {
    id: 4,
    nickname: '보스헌터',
    profile_img: 'https://via.placeholder.com/40x40/F44336/FFFFFF?text=B',
  },
  {
    id: 5,
    nickname: '길드장',
    profile_img: 'https://via.placeholder.com/40x40/9C27B0/FFFFFF?text=G',
  },
  {
    id: 6,
    nickname: '아케인마법사',
    profile_img: null,
  },
  {
    id: 7,
    nickname: '카루타하는누나',
    profile_img: 'https://via.placeholder.com/40x40/E91E63/FFFFFF?text=K',
  },
  {
    id: 8,
    nickname: '리부트서버주민',
    profile_img: 'https://via.placeholder.com/40x40/795548/FFFFFF?text=R',
  },
];

// Mock 메시지 데이터
const createMockMessage = (
  id: number,
  content: string,
  senderId: number,
  minutesAgo: number = 0
): Message => {
  const sender = MOCK_CHAT_USERS.find(user => user.id === senderId) || MOCK_CHAT_USERS[0];
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
  
  return {
    id,
    content,
    message_type: 'text',
    created_at: timestamp.toISOString(),
    updated_at: timestamp.toISOString(),
    sender,
    is_read: minutesAgo > 10, // 10분 이전 메시지는 읽음 처리
  };
};

// Mock 1:1 채팅방 데이터
export const MOCK_DIRECT_CHATS: ChatRoom[] = [
  {
    id: 1,
    name: '메이플러버',
    chat_type: 'direct',
    profile_img: MOCK_CHAT_USERS[0].profile_img,
    participants: [MOCK_CHAT_USERS[0], MOCK_CHAT_USERS[7]], // 현재 사용자와 메이플러버
    last_message: createMockMessage(1, '스타포스 이벤트 언제까지인지 아세요?', 1, 5),
    unread_count: 2,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T15:25:00Z',
  },
  {
    id: 2,
    name: '스타포스왕',
    chat_type: 'direct',
    profile_img: MOCK_CHAT_USERS[1].profile_img,
    participants: [MOCK_CHAT_USERS[1], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(2, '22성 만들기 성공했어요! 🎉', 2, 30),
    unread_count: 0,
    created_at: '2024-01-14T08:20:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  {
    id: 3,
    name: '큐브마스터',
    chat_type: 'direct',
    profile_img: MOCK_CHAT_USERS[2].profile_img,
    participants: [MOCK_CHAT_USERS[2], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(3, '레드큐브 vs 블랙큐브 뭐가 더 나을까요?', 3, 120),
    unread_count: 1,
    created_at: '2024-01-13T16:45:00Z',
    updated_at: '2024-01-15T13:00:00Z',
  },
  {
    id: 4,
    name: '아케인마법사',
    chat_type: 'direct',
    profile_img: MOCK_CHAT_USERS[5].profile_img,
    participants: [MOCK_CHAT_USERS[5], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(4, '안녕하세요!', 6, 1440), // 하루 전
    unread_count: 0,
    created_at: '2024-01-12T20:15:00Z',
    updated_at: '2024-01-14T15:25:00Z',
  },
  {
    id: 5,
    name: '카루타하는누나',
    chat_type: 'direct',
    profile_img: MOCK_CHAT_USERS[6].profile_img,
    participants: [MOCK_CHAT_USERS[6], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(5, '오늘 카루타 하실래요?', 7, 180),
    unread_count: 3,
    created_at: '2024-01-10T12:30:00Z',
    updated_at: '2024-01-15T12:45:00Z',
  },
];

// Mock 그룹 채팅방 데이터
export const MOCK_GROUP_CHATS: ChatRoom[] = [
  {
    id: 6,
    name: '🛡️ 보스레이드 팀',
    chat_type: 'group',
    profile_img: 'https://via.placeholder.com/40x40/FF5722/FFFFFF?text=보스',
    participants: [MOCK_CHAT_USERS[0], MOCK_CHAT_USERS[1], MOCK_CHAT_USERS[3], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(6, '내일 루시드 몇시에 할까요?', 4, 15),
    unread_count: 5,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-15T15:10:00Z',
  },
  {
    id: 7,
    name: '⚔️ 길드 운영진',
    chat_type: 'group',
    profile_img: 'https://via.placeholder.com/40x40/3F51B5/FFFFFF?text=길드',
    participants: [MOCK_CHAT_USERS[4], MOCK_CHAT_USERS[1], MOCK_CHAT_USERS[2], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(7, '이번 주 길드전 참여하실 분들 체크 부탁드립니다', 5, 60),
    unread_count: 12,
    created_at: '2024-01-08T14:20:00Z',
    updated_at: '2024-01-15T14:25:00Z',
  },
  {
    id: 8,
    name: '💰 메소 파밍 정보방',
    chat_type: 'group',
    profile_img: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=💰',
    participants: [
      MOCK_CHAT_USERS[0], 
      MOCK_CHAT_USERS[2], 
      MOCK_CHAT_USERS[5], 
      MOCK_CHAT_USERS[6], 
      MOCK_CHAT_USERS[7]
    ],
    last_message: createMockMessage(8, '츄츄 파밍 vs 라체 파밍 뭐가 더 좋을까요?', 6, 240),
    unread_count: 0,
    created_at: '2024-01-05T11:10:00Z',
    updated_at: '2024-01-15T11:25:00Z',
  },
  {
    id: 9,
    name: '🎮 게임 친구들',
    chat_type: 'group',
    profile_img: 'https://via.placeholder.com/40x40/E91E63/FFFFFF?text=친구',
    participants: [MOCK_CHAT_USERS[6], MOCK_CHAT_USERS[7]],
    last_message: createMockMessage(9, '오늘 저녁에 같이 놀아요!', 7, 300),
    unread_count: 1,
    created_at: '2024-01-03T18:40:00Z',
    updated_at: '2024-01-15T10:40:00Z',
  },
];

// 전체 채팅방 목록 (1:1 + 그룹)
export const MOCK_ALL_CHATS: ChatRoom[] = [
  ...MOCK_DIRECT_CHATS,
  ...MOCK_GROUP_CHATS,
].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); // 최신 업데이트 순으로 정렬

// 추가 Mock 사용자들 (팔로우하지 않은 사용자들)
const MOCK_NON_FOLLOWER_USERS: ChatUser[] = [
  {
    id: 9,
    nickname: '신규유저123',
    profile_img: 'https://via.placeholder.com/40x40/607D8B/FFFFFF?text=신',
  },
  {
    id: 10,
    nickname: '메이플초보',
    profile_img: null,
  },
  {
    id: 11,
    nickname: '베라서버주민',
    profile_img: 'https://via.placeholder.com/40x40/FF5722/FFFFFF?text=베',
  },
  {
    id: 12,
    nickname: '아델전용계정',
    profile_img: 'https://via.placeholder.com/40x40/8BC34A/FFFFFF?text=아',
  },
  {
    id: 13,
    nickname: '랜덤닉네임',
    profile_img: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=랜',
  },
];

// Mock 채팅 요청 데이터 생성 함수
const createChatRequest = (
  id: number,
  senderId: number,
  message: string,
  hoursAgo: number = 0,
  isFollower: boolean = false
): ChatRequest => {
  const sender = MOCK_NON_FOLLOWER_USERS.find(user => user.id === senderId) || MOCK_NON_FOLLOWER_USERS[0];
  const receiver = MOCK_CHAT_USERS[7]; // 현재 사용자
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - hoursAgo);
  
  return {
    id,
    sender,
    receiver,
    message,
    status: 'pending',
    created_at: timestamp.toISOString(),
    updated_at: timestamp.toISOString(),
    is_follower: isFollower,
  };
};

// Mock 채팅 요청 데이터
export const MOCK_CHAT_REQUESTS: ChatRequest[] = [
  createChatRequest(1, 9, '안녕하세요! 스타포스 관련해서 궁금한 게 있어서 연락드렸어요.', 2),
  createChatRequest(2, 10, '메이플 처음 시작했는데 조언 좀 구할 수 있을까요?', 6),
  createChatRequest(3, 11, '같은 서버 주민인데 길드 추천해주실 수 있나요?', 12),
  createChatRequest(4, 12, '아델 키우는 팁 좀 알려주세요!', 18),
  createChatRequest(5, 13, '혹시 파티 플레이 하실래요?', 24),
].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // 최신 순으로 정렬
