// 컷(세로형 쇼츠) Mock 데이터

import { Cut, CutUser, CutComment } from '../types/cut';

// Mock 컷 사용자 데이터
export const MOCK_CUT_USERS: CutUser[] = [
  {
    id: 1,
    nickname: '메이플마스터',
    profile_img: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=메',
  },
  {
    id: 2,
    nickname: '아케인세이지',
    profile_img: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=아',
  },
  {
    id: 3,
    nickname: '히어로전사',
    profile_img: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=히',
  },
  {
    id: 4,
    nickname: '나이트로드',
    profile_img: 'https://via.placeholder.com/40x40/9C27B0/FFFFFF?text=나',
  },
  {
    id: 5,
    nickname: '비숍힐러',
    profile_img: 'https://via.placeholder.com/40x40/F44336/FFFFFF?text=비',
  },
  {
    id: 6,
    nickname: '카데나체인',
    profile_img: null,
  },
  {
    id: 7,
    nickname: '제로알파',
    profile_img: 'https://via.placeholder.com/40x40/795548/FFFFFF?text=제',
  },
  {
    id: 8,
    nickname: '아델소드',
    profile_img: 'https://via.placeholder.com/40x40/607D8B/FFFFFF?text=아',
  },
];

// Mock 컷 데이터 생성 함수
const createMockCut = (
  id: number,
  title: string,
  description: string,
  userId: number,
  imageUrl: string,
  hoursAgo: number = 0
): Cut => {
  const user = MOCK_CUT_USERS.find(u => u.id === userId) || MOCK_CUT_USERS[0];
  const timestamp = new Date();
  timestamp.setHours(timestamp.getHours() - hoursAgo);
  
  return {
    id,
    title,
    description,
    image_url: imageUrl,
    created_at: timestamp.toISOString(),
    updated_at: timestamp.toISOString(),
    user,
    like_count: Math.floor(Math.random() * 10000) + 100,
    comment_count: Math.floor(Math.random() * 1000) + 10,
    share_count: Math.floor(Math.random() * 500) + 5,
    view_count: Math.floor(Math.random() * 50000) + 1000,
    is_liked: Math.random() > 0.7,
    duration: Math.floor(Math.random() * 120) + 15, // 15-135초
    tags: ['메이플스토리', '게임플레이', 'MMORPG'],
  };
};

// Mock 컷 데이터
export const MOCK_CUTS: Cut[] = [
  createMockCut(
    1, 
    '22성 도전!', 
    '마침내 22성 도전해봤는데... 결과가 대박이에요! 🔥 스타포스 이벤트 놓치지 마세요! #메이플스토리 #22성 #스타포스', 
    1, 
    'https://via.placeholder.com/400x800/FF6B6B/FFFFFF?text=22%EC%84%B1%20%EB%8F%84%EC%A0%84!',
    2
  ),
  createMockCut(
    2, 
    '아케인 보스솔로', 
    '아케인 보스 솔로 클리어 도전! 정말 어려웠지만 해냈어요 💪 노하우 공유합니다!', 
    2, 
    'https://via.placeholder.com/400x800/4ECDC4/FFFFFF?text=%EC%95%84%EC%BC%80%EC%9D%B8%20%EB%B3%B4%EC%8A%A4',
    5
  ),
  createMockCut(
    3, 
    '신규직업 플레이', 
    '새로 나온 직업 첫 플레이 후기! 정말 재밌더라구요~ 여러분도 해보세요! #신규직업 #첫플레이', 
    3, 
    'https://via.placeholder.com/400x800/45B7D1/FFFFFF?text=%EC%8B%A0%EA%B7%9C%EC%A7%81%EC%97%85',
    8
  ),
  createMockCut(
    4, 
    '길드전 하이라이트', 
    '어제 길드전에서 일어난 레전드급 상황들... 정말 손에 땀을 쥐게 하네요 ⚔️', 
    4, 
    'https://via.placeholder.com/400x800/F7B731/FFFFFF?text=%EA%B8%B8%EB%93%9C%EC%A0%84',
    12
  ),
  createMockCut(
    5, 
    '힐러의 일상', 
    '파티원들 살리느라 바쁜 힐러의 하루 😅 공감하는 힐러분들 있나요? #힐러 #파티플레이', 
    5, 
    'https://via.placeholder.com/400x800/A55EEA/FFFFFF?text=%ED%9E%90%EB%9F%AC',
    18
  ),
  createMockCut(
    6, 
    '카데나 콤보 영상', 
    '카데나 극딜 콤보 완성! 연습 엄청 했는데 드디어 성공했어요 🎯 튜토리얼도 곧 올릴게요', 
    6, 
    'https://via.placeholder.com/400x800/26C281/FFFFFF?text=%EC%B9%B4%EB%8D%B0%EB%82%98',
    24
  ),
  createMockCut(
    7, 
    '제로 스킬컷', 
    '제로 알파베타 스킬컷 모음! 이펙트가 정말 화려하죠? ✨ #제로 #스킬컷 #이펙트', 
    7, 
    'https://via.placeholder.com/400x800/FD7272/FFFFFF?text=%EC%A0%9C%EB%A1%9C',
    36
  ),
  createMockCut(
    8, 
    '아델 사냥영상', 
    '아델 신규 사냥터 효율 테스트! 예상보다 괜찮은 것 같아요 📈 레벨업 속도 체크!', 
    8, 
    'https://via.placeholder.com/400x800/74C0FC/FFFFFF?text=%EC%95%84%EB%8D%B8',
    48
  ),
  createMockCut(
    9, 
    '메소파밍 꿀팁', 
    '하루 100억 메소 벌기 가능할까? 실제로 해봤습니다! 💰 꿀팁 대방출', 
    1, 
    'https://via.placeholder.com/400x800/FFB84D/FFFFFF?text=%EB%A9%94%EC%86%8C%ED%8C%8C%EB%B0%8D',
    72
  ),
  createMockCut(
    10, 
    '보스레이드 실패모음', 
    '보스레이드 재미있는 실패 장면들 모음 😂 다들 이런 경험 있으시죠? #보스레이드 #실패모음', 
    2, 
    'https://via.placeholder.com/400x800/FF7979/FFFFFF?text=%EB%B3%B4%EC%8A%A4%EB%A0%88%EC%9D%B4%EB%93%9C',
    96
  ),
];

// 컷츠 카테고리 목데이터
export interface CutCategory {
  id: number;
  name: string;
}

export const CUT_CATEGORIES: CutCategory[] = [
  { id: 1, name: '동물' },
  { id: 2, name: '자연' },
  { id: 3, name: '여행' },
  { id: 4, name: '패션' },
];

// Mock 컷 댓글 데이터
export const MOCK_CUT_COMMENTS: { [cutId: number]: CutComment[] } = {
  1: [
    {
      id: 1,
      content: '와 22성 성공이네요! 축하드려요 🎉',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
      user: MOCK_CUT_USERS[1],
      like_count: 12,
      is_liked: false,
    },
    {
      id: 2,
      content: '저도 도전해봐야겠어요! 혹시 몇 번 만에 성공하셨나요?',
      created_at: '2024-01-15T14:45:00Z',
      updated_at: '2024-01-15T14:45:00Z',
      user: MOCK_CUT_USERS[2],
      like_count: 5,
      is_liked: true,
    },
  ],
  2: [
    {
      id: 3,
      content: '아케인 솔로는 정말 대단하시네요! 👏',
      created_at: '2024-01-15T13:20:00Z',
      updated_at: '2024-01-15T13:20:00Z',
      user: MOCK_CUT_USERS[3],
      like_count: 8,
      is_liked: false,
    },
  ],
};
