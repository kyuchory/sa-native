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
