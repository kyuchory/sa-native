import { PostDetail } from '../types/post';

// 게시물 상세 mock 데이터
export const MOCK_POST_DETAIL: PostDetail = {
  id: 1,
  title: '겨울철 건조한 피부를 위한 스킨케어 루틴 💧',
  created_at: '2024-01-15T10:30:00.000Z',
  updated_at: '2024-01-15T10:30:00.000Z',
  user: {
    id: 1,
    nickname: '뷰티러버',
    profile_img: 'https://picsum.photos/100/100?random=1'
  },
  sub_category: {
    id: 1,
    name: '스킨케어',
    category: {
      id: 1,
      name: '뷰티'
    }
  },
  content_blocks: [
    {
      type: 'text',
      value: '안녕하세요! 겨울이 되면서 피부가 정말 건조해져서 새로운 스킨케어 루틴을 정착시켰어요. 특히 세럼과 크림 위주로 바꿔봤는데 효과가 좋아서 공유드려요!',
      sequence: 0
    },
    {
      type: 'image',
      value: 'https://picsum.photos/400/300?random=2',
      sequence: 1
    },
    {
      type: 'text',
      value: '📌 아침 루틴:\n1. 폼클렌징 (순하게!)\n2. 토너 - 수분 공급\n3. 비타민C 세럼\n4. 보습크림\n5. 선크림',
      sequence: 2
    },
    {
      type: 'text',
      value: '🌙 저녁 루틴:\n1. 클렌징오일\n2. 폼클렌징\n3. 토너\n4. 나이아신아마이드 세럼\n5. 보습크림 (아침보다 진한 제형)\n6. 페이스오일 (특히 건조한 날)',
      sequence: 3
    },
    {
      type: 'text',
      value: '가장 중요한 건 꾸준함인 것 같아요! 처음엔 귀찮아도 2-3주 정도 지나니까 확실히 피부가 촉촉해진 게 느껴져요. 혹시 추천하고 싶은 제품이 있으시면 댓글로 알려주세요! 💕',
      sequence: 4
    }
  ],
  tags: [
    { id: 1, name: '스킨케어' },
    { id: 2, name: '겨울뷰티' },
    { id: 3, name: '건성피부' }
  ],
  like_count: 234,
  bookmark_count: 67,
  comment_count: 45,
  is_liked: false,
  is_bookmarked: true
};

// 아이템 스타일 게시물 mock 데이터
export const MOCK_ITEM_POST_DETAIL: PostDetail = {
  id: 2,
  title: '200레벨 아크메이지 템셋 공유 🔥',
  created_at: '2024-01-16T14:20:00.000Z',
  updated_at: '2024-01-16T14:20:00.000Z',
  user: {
    id: 2,
    nickname: '메이플마스터',
    profile_img: null
  },
  sub_category: {
    id: 5,
    name: '템셋공유',
    category: {
      id: 3,
      name: '메이플스토리'
    }
  },
  content_blocks: [
    {
      type: 'text',
      value: '드디어 200레벨 달성했습니다! 🎉\n아크메이지 템셋 정리해서 공유드려요. 스탯이 궁금하신 분들 참고하세요!',
      sequence: 0
    },
    {
      type: 'text',
      value: '⚔️ 주요 스탯:\n- 최소 공격력: 1,234,567\n- 최대 공격력: 1,456,789\n- 보스 데미지: 350%\n- 데미지: 89%\n- 크리티컬 확률: 100%',
      sequence: 1
    },
    {
      type: 'text',
      value: '투자 비용은 대략 500만원 정도 들어간 것 같아요. 무과금으로는 힘들지만 천천히 모으면 가능해요!\nF2P 분들을 위한 팁도 댓글에서 공유할게요 💪',
      sequence: 2
    }
  ],
  tags: [
    { id: 4, name: '메이플스토리' },
    { id: 5, name: '아크메이지' },
    { id: 6, name: '템셋' },
    { id: 7, name: '200레벨' }
  ],
  like_count: 892,
  bookmark_count: 234,
  comment_count: 156,
  is_liked: true,
  is_bookmarked: false
};
