// 안정적인 이미지 URL을 사용하는 Mock 데이터

import type { Post } from '../components/PostCard';
import { Category } from '../types/post';

// 카테고리 목 데이터
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: '뷰티',
    subCategories: [
      { id: 1, name: '스킨케어' },
      { id: 2, name: '메이크업' },
      { id: 3, name: '헤어케어' },
    ]
  },
  {
    id: 2,
    name: '패션',
    subCategories: [
      { id: 4, name: '데일리룩' },
      { id: 5, name: '아우터' },
      { id: 6, name: '슈즈' },
    ]
  },
  {
    id: 3,
    name: '건강',
    subCategories: [
      { id: 7, name: '운동' },
      { id: 8, name: '다이어트' },
      { id: 9, name: '영양' },
    ]
  },
  {
    id: 4,
    name: '요리',
    subCategories: [
      { id: 10, name: '한식' },
      { id: 11, name: '양식' },
      { id: 12, name: '디저트' },
    ]
  },
  {
    id: 5,
    name: '테크',
    subCategories: [
      { id: 13, name: '스마트폰' },
      { id: 14, name: '게임' },
      { id: 15, name: '앱추천' },
    ]
  },
];

// 게시물 목 데이터 (안정적인 이미지 URL 사용)
export const STABLE_MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: '겨울철 건조한 피부를 위한 스킨케어 루틴 💧',
    content: '겨울이 되면서 피부가 정말 건조해져서 새로운 스킨케어 제품들을 찾아보고 있어요. 특히 세럼과 크림 추천 부탁드려요!',
    author: {
      id: 'user1',
      nickname: '뷰티러버',
      profileImage: 'https://picsum.photos/100/100?random=1'
    },
    imageUrl: 'https://picsum.photos/400/300?random=2',
    likeCount: 234,
    commentCount: 45,
    viewCount: 1203,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    categoryId: 'beauty',
    subcategoryId: 'skincare'
  },
  {
    id: '2',
    title: '요즘 핫한 Y2K 패션 스타일링 👗',
    content: '2000년대 패션이 다시 유행이라고 하던데, 어떻게 스타일링하면 촌스럽지 않고 트렌디하게 입을 수 있을까요?',
    author: {
      id: 'user2',
      nickname: '패션피플',
    },
    imageUrl: 'https://picsum.photos/400/300?random=3',
    likeCount: 189,
    commentCount: 32,
    viewCount: 892,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    categoryId: 'fashion',
    subcategoryId: 'daily'
  },
  {
    id: '3',
    title: '홈트레이닝 3개월 후기 💪',
    content: '헬스장 못 가는 상황에서 집에서 홈트 시작한지 벌써 3개월! 변화된 몸과 운동 루틴 공유해드릴게요.',
    author: {
      id: 'user3',
      nickname: '홈트마스터',
      profileImage: 'https://picsum.photos/100/100?random=4'
    },
    imageUrl: 'https://picsum.photos/400/300?random=5',
    likeCount: 567,
    commentCount: 89,
    viewCount: 2341,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    categoryId: 'health',
    subcategoryId: 'exercise'
  },
  {
    id: '4',
    title: '간단한 브런치 레시피 🥞',
    content: '주말 아침에 만들어 먹기 좋은 간단한 브런치 메뉴들을 소개해드릴게요. 재료도 간단하고 맛도 좋아요!',
    author: {
      id: 'user4',
      nickname: '요리초보',
    },
    imageUrl: 'https://picsum.photos/400/300?random=6',
    likeCount: 123,
    commentCount: 28,
    viewCount: 456,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    categoryId: 'cooking',
    subcategoryId: 'western'
  },
  {
    id: '5',
    title: '새로 나온 스마트폰 리뷰 📱',
    content: '최신 출시된 스마트폰을 1주일 동안 사용해본 솔직한 후기입니다. 장단점 모두 말씀드려요!',
    author: {
      id: 'user5',
      nickname: '테크리뷰어',
      profileImage: 'https://picsum.photos/100/100?random=7'
    },
    imageUrl: 'https://picsum.photos/400/300?random=8',
    likeCount: 892,
    commentCount: 156,
    viewCount: 3421,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    categoryId: 'tech',
    subcategoryId: 'smartphone'
  },
  {
    id: '6',
    title: '집에서 만드는 카페 라떼 ☕',
    content: '집에서도 카페처럼 맛있는 라떼를 만들 수 있어요. 필요한 도구와 만드는 방법을 알려드릴게요!',
    author: {
      id: 'user6',
      nickname: '홈카페',
      profileImage: 'https://picsum.photos/100/100?random=9'
    },
    imageUrl: 'https://picsum.photos/400/300?random=10',
    likeCount: 345,
    commentCount: 67,
    viewCount: 1234,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    categoryId: 'cooking',
    subcategoryId: 'dessert'
  }
];

// 필터링 및 정렬 함수들
export const filterPostsByCategory = (
  posts: Post[], 
  categoryId: number, 
  subcategoryId: number = 0
): Post[] => {
  if (!categoryId) return posts;
  
  // Mock 데이터는 string ID를 사용하므로 임시로 변환
  const categoryIdStr = categoryId.toString();
  const subcategoryIdStr = subcategoryId ? subcategoryId.toString() : '';
  
  return posts.filter(post => {
    const matchesCategory = post.categoryId === categoryIdStr || categoryId === 1; // 임시: 뷰티 카테고리
    const matchesSubcategory = !subcategoryIdStr || post.subcategoryId === subcategoryIdStr;
    return matchesCategory && matchesSubcategory;
  });
};

export const sortPostsByLatest = (posts: Post[]): Post[] => {
  return [...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
