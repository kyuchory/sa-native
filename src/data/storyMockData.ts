// 스토리 관련 Mock Data

export interface StoryUser {
  id: number;
  nickname: string;
  profile_img: string;
  has_story: boolean;
  is_viewed: boolean; // 스토리를 봤는지 여부
}

export interface Story {
  id: number;
  user_id: number;
  image_url: string;
  created_at: string;
  expires_at: string;
}

// 내 프로필 (스토리 추가용)
export const myProfile: StoryUser = {
  id: 0,
  nickname: "나",
  profile_img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  has_story: false,
  is_viewed: false
};

// Mock 스토리 사용자들
export const mockStoryUsers: StoryUser[] = [
  {
    id: 1,
    nickname: "엄마짱",
    profile_img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: false
  },
  {
    id: 2,
    nickname: "육아맘",
    profile_img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: true
  },
  {
    id: 3,
    nickname: "새내기맘",
    profile_img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: false
  },
  {
    id: 4,
    nickname: "워킹맘",
    profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: true
  },
  {
    id: 5,
    nickname: "다둥이맘",
    profile_img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: false
  },
  {
    id: 6,
    nickname: "신혼맘",
    profile_img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: true
  },
  {
    id: 7,
    nickname: "베테랑맘",
    profile_img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    has_story: true,
    is_viewed: false
  }
];

// Mock 스토리 데이터
export const mockStories: Story[] = [
  {
    id: 1,
    user_id: 1,
    image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=600&fit=crop",
    created_at: "2024-01-15T10:30:00.000Z",
    expires_at: "2024-01-16T10:30:00.000Z"
  },
  {
    id: 2,
    user_id: 2,
    image_url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=600&fit=crop",
    created_at: "2024-01-15T09:15:00.000Z",
    expires_at: "2024-01-16T09:15:00.000Z"
  },
  {
    id: 3,
    user_id: 3,
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop",
    created_at: "2024-01-15T08:45:00.000Z",
    expires_at: "2024-01-16T08:45:00.000Z"
  },
  {
    id: 4,
    user_id: 4,
    image_url: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=600&fit=crop",
    created_at: "2024-01-15T07:20:00.000Z",
    expires_at: "2024-01-16T07:20:00.000Z"
  },
  {
    id: 5,
    user_id: 5,
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=600&fit=crop",
    created_at: "2024-01-15T06:30:00.000Z",
    expires_at: "2024-01-16T06:30:00.000Z"
  }
];

// 스토리 데이터 조회 함수
export const getStoriesForUser = (userId: number): Story[] => {
  return mockStories.filter(story => story.user_id === userId);
};

// 모든 스토리 사용자 조회 (내 프로필 포함)
export const getAllStoryUsers = (): StoryUser[] => {
  return [myProfile, ...mockStoryUsers];
};
