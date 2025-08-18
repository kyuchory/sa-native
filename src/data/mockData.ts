import { Category, Subcategory } from '../components/CategorySelector';
import { Post } from '../components/PostCard';

// 카테고리 목 데이터
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'beauty',
    name: '뷰티',
    subcategories: [
      { id: 'skincare', name: '스킨케어', categoryId: 'beauty' },
      { id: 'makeup', name: '메이크업', categoryId: 'beauty' },
      { id: 'hair', name: '헤어', categoryId: 'beauty' },
      { id: 'nail', name: '네일', categoryId: 'beauty' },
    ]
  },
  {
    id: 'fashion',
    name: '패션',
    subcategories: [
      { id: 'daily', name: '데일리룩', categoryId: 'fashion' },
      { id: 'formal', name: '정장', categoryId: 'fashion' },
      { id: 'casual', name: '캐주얼', categoryId: 'fashion' },
      { id: 'accessories', name: '액세서리', categoryId: 'fashion' },
    ]
  },
  {
    id: 'lifestyle',
    name: '라이프',
    subcategories: [
      { id: 'food', name: '맛집', categoryId: 'lifestyle' },
      { id: 'travel', name: '여행', categoryId: 'lifestyle' },
      { id: 'home', name: '홈데코', categoryId: 'lifestyle' },
      { id: 'hobby', name: '취미', categoryId: 'lifestyle' },
    ]
  },
  {
    id: 'health',
    name: '건강',
    subcategories: [
      { id: 'fitness', name: '운동', categoryId: 'health' },
      { id: 'diet', name: '다이어트', categoryId: 'health' },
      { id: 'mental', name: '멘탈케어', categoryId: 'health' },
      { id: 'wellness', name: '웰니스', categoryId: 'health' },
    ]
  },
  {
    id: 'tech',
    name: '테크',
    subcategories: [
      { id: 'gadget', name: '가젯', categoryId: 'tech' },
      { id: 'app', name: '앱리뷰', categoryId: 'tech' },
      { id: 'tip', name: '꿀팁', categoryId: 'tech' },
    ]
  },
];

// 게시물 목 데이터
export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: '겨울철 건조한 피부를 위한 스킨케어 루틴 💧',
    content: '겨울이 되면서 피부가 정말 건조해져서 새로운 스킨케어 제품들을 찾아보고 있어요. 특히 세럼과 크림 추천 부탁드려요!',
    author: {
      id: 'user1',
      nickname: '뷰티러버',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
    likeCount: 234,
    commentCount: 45,
    viewCount: 1203,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
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
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop',
    likeCount: 189,
    commentCount: 32,
    viewCount: 892,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
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
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    likeCount: 567,
    commentCount: 89,
    viewCount: 2341,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
    categoryId: 'health',
    subcategoryId: 'fitness'
  },
  {
    id: '4',
    title: '강남 핫플 카페 투어 ☕️',
    content: '주말에 친구들이랑 강남 카페 투어했는데 정말 예쁘고 맛있는 곳들 발견했어요! 사진과 함께 후기 남겨요~',
    author: {
      id: 'user4',
      nickname: '카페탐험가',
    },
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    likeCount: 312,
    commentCount: 67,
    viewCount: 1456,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12시간 전
    categoryId: 'lifestyle',
    subcategoryId: 'food'
  },
  {
    id: '5',
    title: '아이폰 15 Pro 2주 사용 솔직후기 📱',
    content: '아이폰 15 Pro로 바꾼지 2주 정도 됐는데, 카메라 성능이나 배터리 등 실제 사용해본 후기 공유해요!',
    author: {
      id: 'user5',
      nickname: '테크리뷰어',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    likeCount: 445,
    commentCount: 123,
    viewCount: 3210,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    categoryId: 'tech',
    subcategoryId: 'gadget'
  },
  {
    id: '6',
    title: '겨울 네일 디자인 추천 💅',
    content: '겨울이니까 차분하면서도 세련된 네일 디자인 하고 싶은데, 요즘 트렌드가 뭔지 알려주세요!',
    author: {
      id: 'user6',
      nickname: '네일아티스트',
    },
    likeCount: 156,
    commentCount: 28,
    viewCount: 678,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
    categoryId: 'beauty',
    subcategoryId: 'nail'
  },
  {
    id: '7',
    title: '제주도 겨울 여행 코스 추천 🌴',
    content: '제주도에 겨울에도 갈 만한 곳들이 있을까요? 한라산 말고 다른 겨울 제주만의 매력을 느낄 수 있는 곳들 궁금해요!',
    author: {
      id: 'user7',
      nickname: '여행중독자',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d6101f?w=400&h=300&fit=crop',
    likeCount: 892,
    commentCount: 156,
    viewCount: 4532,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    categoryId: 'lifestyle',
    subcategoryId: 'travel'
  },
  {
    id: '8',
    title: '다이어트 도시락 레시피 🥗',
    content: '직장인 다이어트 도시락 만들어서 먹고 있는데, 맛있으면서도 칼로리 낮은 레시피들 공유해요!',
    author: {
      id: 'user8',
      nickname: '다이어터',
    },
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    likeCount: 278,
    commentCount: 54,
    viewCount: 1234,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4일 전
    categoryId: 'health',
    subcategoryId: 'diet'
  }
];

// 필터링 함수들
export const filterPostsByCategory = (posts: Post[], categoryId?: string, subcategoryId?: string): Post[] => {
  if (!categoryId) return posts;
  
  let filtered = posts.filter(post => post.categoryId === categoryId);
  
  if (subcategoryId) {
    filtered = filtered.filter(post => post.subcategoryId === subcategoryId);
  }
  
  return filtered;
};

// 최신 순으로 정렬
export const sortPostsByLatest = (posts: Post[]): Post[] => {
  return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
