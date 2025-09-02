// 피드 관련 Mock Data

export interface User {
  id: number;
  nickname: string;
  profile_img: string;
}

export interface ContentBlock {
  type: 'text' | 'image';
  value: string;
  sequence: number;
}

export interface Feed {
  id: number;
  created_at: string;
  user: User;
  content_blocks: ContentBlock[];
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  location?: string; // 위치 정보 (선택사항)
}

export interface FeedResponse {
  feeds: Feed[];
  pagination: {
    next_cursor: number | null;
    has_next: boolean;
  };
}

// Mock 사용자 데이터
const mockUsers: User[] = [
  {
    id: 1,
    nickname: "엄마짱",
    profile_img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 2,
    nickname: "육아맘",
    profile_img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 3,
    nickname: "새내기맘",
    profile_img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 4,
    nickname: "워킹맘",
    profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 5,
    nickname: "다둥이맘",
    profile_img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
  }
];

// Mock 피드 데이터
export const mockFeeds: Feed[] = [
  {
    id: 15,
    created_at: "2024-01-15T12:30:00.000Z",
    user: mockUsers[0],
    content_blocks: [
      {
        type: "text",
        value: "오늘 아이와 함께 만든 쿠키! 너무 맛있게 나왔어요 😊 아이가 직접 반죽도 하고 모양도 만들어서 더욱 뜻깊은 시간이었답니다. 집에서 아이와 함께 할 수 있는 간단한 베이킹 활동 추천해요!",
        sequence: 0
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop",
        sequence: 1
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=400&fit=crop",
        sequence: 2
      }
    ],
    like_count: 24,
    bookmark_count: 8,
    comment_count: 12,
    is_liked: false,
    is_bookmarked: true,
    location: "서울시 강남구"
  },
  {
    id: 14,
    created_at: "2024-01-15T10:15:00.000Z",
    user: mockUsers[1],
    content_blocks: [
      {
        type: "text",
        value: "첫 이유식 도전! 우리 아기가 처음으로 당근죽을 먹어봤는데 반응이 너무 귀여워요 ㅎㅎ 처음엔 이상한 표정을 짓더니 점점 맛있게 먹네요",
        sequence: 0
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop",
        sequence: 1
      }
    ],
    like_count: 18,
    bookmark_count: 5,
    comment_count: 8,
    is_liked: true,
    is_bookmarked: false,
    location: "부산시 해운대구"
  },
  {
    id: 13,
    created_at: "2024-01-14T16:45:00.000Z",
    user: mockUsers[2],
    content_blocks: [
      {
        type: "text",
        value: "공원에서 아이와 함께 한 피크닉! 날씨도 좋고 아이도 너무 좋아해서 행복한 하루였어요. 요즘 같은 날씨에 야외활동 정말 추천합니다 🌸",
        sequence: 0
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop",
        sequence: 1
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop",
        sequence: 2
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
        sequence: 3
      }
    ],
    like_count: 32,
    bookmark_count: 12,
    comment_count: 15,
    is_liked: true,
    is_bookmarked: true,
    location: "서울시 한강공원"
  },
  {
    id: 12,
    created_at: "2024-01-14T14:20:00.000Z",
    user: mockUsers[3],
    content_blocks: [
      {
        type: "text",
        value: "워킹맘의 일상... 퇴근 후 아이와 함께하는 저녁시간이 가장 소중해요. 오늘은 아이가 좋아하는 파스타를 만들어줬어요!",
        sequence: 0
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=400&fit=crop",
        sequence: 1
      }
    ],
    like_count: 15,
    bookmark_count: 3,
    comment_count: 6,
    is_liked: false,
    is_bookmarked: false,
    location: "인천시 연수구"
  },
  {
    id: 11,
    created_at: "2024-01-14T11:30:00.000Z",
    user: mockUsers[4],
    content_blocks: [
      {
        type: "text",
        value: "세 아이와 함께하는 주말! 정신없지만 행복한 우리집 풍경입니다 😅 큰 아이는 숙제하고, 둘째는 그림그리고, 막내는 장난감 가지고 놀고... 다둥이맘의 현실이에요",
        sequence: 0
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop",
        sequence: 1
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop",
        sequence: 2
      }
    ],
    like_count: 28,
    bookmark_count: 7,
    comment_count: 11,
    is_liked: true,
    is_bookmarked: false,
    location: "경기도 수원시"
  }
];

// 무한 스크롤을 위한 함수
export const getFeedPage = (cursor?: number, limit: number = 20): FeedResponse => {
  const startIndex = cursor ? mockFeeds.findIndex(feed => feed.id === cursor) + 1 : 0;
  const endIndex = Math.min(startIndex + limit, mockFeeds.length);
  const pageFeeds = mockFeeds.slice(startIndex, endIndex);
  
  return {
    feeds: pageFeeds,
    pagination: {
      next_cursor: endIndex < mockFeeds.length ? mockFeeds[endIndex - 1].id : null,
      has_next: endIndex < mockFeeds.length
    }
  };
};
