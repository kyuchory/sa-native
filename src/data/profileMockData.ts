import type { FeedItem, VideoItem, CharacterItem } from '../components/ProfileContentGrid';
import type { Post } from '../components/PostCard';

// 프로필 유저 목 데이터
export const MOCK_PROFILE_USER = {
  nickname: '스타일러버',
  profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  postsCount: 127,
  feedsCount: 89,
  followersCount: 12500,
  followingCount: 432,
};

// 피드 목 데이터 (3x8 그리드용, 24개)
export const MOCK_FEED_DATA: FeedItem[] = [
  {
    id: 'feed1',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed2',
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed3',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed4',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed5',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed6',
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d6101f?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed7',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed8',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed9',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed10',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed11',
    imageUrl: 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed12',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed13',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed14',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed15',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed16',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed17',
    imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed18',
    imageUrl: 'https://images.unsplash.com/photo-1525562723174-e3a9556e8830?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed19',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed20',
    imageUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed21',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    type: 'video',
  },
  {
    id: 'feed22',
    imageUrl: 'https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed23',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop',
    type: 'image',
  },
  {
    id: 'feed24',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
    type: 'video',
  },
];

// 프로필 게시물 목 데이터
export const MOCK_PROFILE_POSTS: Post[] = [
  {
    id: 'profile_post1',
    title: '오늘의 OOTD 💄',
    content: '새로 산 립스틱이랑 아이섀도우로 메이크업해봤어요! 어떤가요?',
    author: {
      id: 'profile_user',
      nickname: '스타일러버',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
    likeCount: 256,
    commentCount: 43,
    viewCount: 1520,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    categoryId: 'beauty',
    subcategoryId: 'makeup',
  },
  {
    id: 'profile_post2',
    title: '겨울 코디 추천 ❄️',
    content: '요즘 같은 날씨에 입기 좋은 따뜻하면서도 스타일리시한 코디 공유해요!',
    author: {
      id: 'profile_user',
      nickname: '스타일러버',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop',
    likeCount: 189,
    commentCount: 32,
    viewCount: 892,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    categoryId: 'fashion',
    subcategoryId: 'daily',
  },
  {
    id: 'profile_post3',
    title: '홈 카페 세팅 ☕',
    content: '집에서 카페 분위기 내려고 소품들 새로 샀어요. 분위기 어때요?',
    author: {
      id: 'profile_user',
      nickname: '스타일러버',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    likeCount: 312,
    commentCount: 67,
    viewCount: 1456,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    categoryId: 'lifestyle',
    subcategoryId: 'home',
  },
];

// 비디오 목 데이터
export const MOCK_VIDEOS_DATA: VideoItem[] = [
  {
    id: 'video1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop',
    duration: '0:45',
    viewCount: 15600,
    title: '15분 홈트 루틴',
  },
  {
    id: 'video2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d6101f?w=300&h=400&fit=crop',
    duration: '1:23',
    viewCount: 28900,
    title: '제주도 여행 브이로그',
  },
  {
    id: 'video3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=400&fit=crop',
    duration: '0:32',
    viewCount: 8400,
    title: '다이어트 도시락 만들기',
  },
  {
    id: 'video4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=400&fit=crop',
    duration: '2:15',
    viewCount: 34500,
    title: '겨울 스킨케어 루틴',
  },
  {
    id: 'video5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop',
    duration: '1:08',
    viewCount: 19200,
    title: 'Y2K 패션 하울',
  },
  {
    id: 'video6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=400&fit=crop',
    duration: '0:58',
    viewCount: 12800,
    title: '아이폰 케이스 리뷰',
  },
];

// 캐릭터 목 데이터
export const MOCK_CHARACTERS_DATA: CharacterItem[] = [
  {
    id: 'char1',
    name: '루나',
    level: 85,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop',
    rarity: 'legendary',
  },
  {
    id: 'char2',
    name: '아리아',
    level: 72,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
    rarity: 'epic',
  },
  {
    id: 'char3',
    name: '세라',
    level: 68,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
    rarity: 'rare',
  },
  {
    id: 'char4',
    name: '니나',
    level: 45,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    rarity: 'rare',
  },
  {
    id: 'char5',
    name: '엘라',
    level: 32,
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
    rarity: 'common',
  },
  {
    id: 'char6',
    name: '조이',
    level: 28,
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop',
    rarity: 'common',
  },
];
