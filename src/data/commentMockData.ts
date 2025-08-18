import { Comment } from '../types/post';

// 댓글 mock 데이터
export const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    content: '정말 유용한 스킨케어 정보네요! 저도 겨울철에 피부가 건조해져서 고민이었는데 따라해봐야겠어요 ✨',
    created_at: '2024-01-15T10:35:00.000Z',
    updated_at: '2024-01-15T10:35:00.000Z',
    user: {
      id: 2,
      nickname: '뷰티초보',
      profile_img: 'https://picsum.photos/40/40?random=11'
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 12,
    is_liked: false,
    replies: [
      {
        id: 4,
        content: '@뷰티초보 도움이 되셨다니 기뻐요! 꾸준히 하시면 효과 보실 거예요 😊',
        created_at: '2024-01-15T11:20:00.000Z',
        updated_at: '2024-01-15T11:20:00.000Z',
        user: {
          id: 1,
          nickname: '뷰티러버',
          profile_img: 'https://picsum.photos/40/40?random=1'
        },
        parent_comment_id: 1,
        mention_user: {
          id: 2,
          nickname: '뷰티초보'
        },
        like_count: 3,
        is_liked: true
      },
      {
        id: 7,
        content: '@뷰티초보 저도 같은 고민이었어요! 특히 세럼 추천 부분이 도움됐어요',
        created_at: '2024-01-15T14:15:00.000Z',
        updated_at: '2024-01-15T14:15:00.000Z',
        user: {
          id: 5,
          nickname: '건성피부언니',
          profile_img: null
        },
        parent_comment_id: 1,
        mention_user: {
          id: 2,
          nickname: '뷰티초보'
        },
        like_count: 1,
        is_liked: false
      }
    ]
  },
  {
    id: 2,
    content: '혹시 어떤 브랜드 제품 사용하시는지 알 수 있을까요? 제품 추천도 해주시면 감사하겠습니다!',
    created_at: '2024-01-15T12:45:00.000Z',
    updated_at: '2024-01-15T12:45:00.000Z',
    user: {
      id: 3,
      nickname: '궁금이',
      profile_img: 'https://picsum.photos/40/40?random=12'
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 8,
    is_liked: true,
    replies: [
      {
        id: 5,
        content: '@궁금이 저는 주로 국내 브랜드 위주로 써요! DM으로 자세히 알려드릴게요',
        created_at: '2024-01-15T13:30:00.000Z',
        updated_at: '2024-01-15T13:30:00.000Z',
        user: {
          id: 1,
          nickname: '뷰티러버',
          profile_img: 'https://picsum.photos/40/40?random=1'
        },
        parent_comment_id: 2,
        mention_user: {
          id: 3,
          nickname: '궁금이'
        },
        like_count: 5,
        is_liked: false
      }
    ]
  },
  {
    id: 3,
    content: '저도 비슷한 루틴으로 관리하고 있는데, 아침에 비타민C 세럼 바르고 나서 선크림까지의 텀은 얼마나 두시나요?',
    created_at: '2024-01-15T16:20:00.000Z',
    updated_at: '2024-01-15T16:20:00.000Z',
    user: {
      id: 4,
      nickname: '스킨케어덕후',
      profile_img: 'https://picsum.photos/40/40?random=13'
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 4,
    is_liked: false,
    replies: []
  },
  {
    id: 6,
    content: '와 정말 꼼꼼하게 관리하시네요! 저는 게을러서 이렇게 못하겠어요 ㅠㅠ 간단한 버전도 알려주세요~',
    created_at: '2024-01-15T18:05:00.000Z',
    updated_at: '2024-01-15T18:05:00.000Z',
    user: {
      id: 6,
      nickname: '게으른미녀',
      profile_img: null
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 15,
    is_liked: true,
    replies: []
  }
];

// 아이템 스타일 게시물용 댓글
export const MOCK_ITEM_COMMENTS: Comment[] = [
  {
    id: 8,
    content: '와 대박!! 200렙 축하드려요! 템셋도 진짜 사기네요 👍',
    created_at: '2024-01-16T15:30:00.000Z',
    updated_at: '2024-01-16T15:30:00.000Z',
    user: {
      id: 7,
      nickname: '메이플러버',
      profile_img: 'https://picsum.photos/40/40?random=14'
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 23,
    is_liked: false,
    replies: [
      {
        id: 10,
        content: '@메이플러버 감사합니다! 오랜 시간 투자한 보람이 있네요 ㅎㅎ',
        created_at: '2024-01-16T16:45:00.000Z',
        updated_at: '2024-01-16T16:45:00.000Z',
        user: {
          id: 2,
          nickname: '메이플마스터',
          profile_img: null
        },
        parent_comment_id: 8,
        mention_user: {
          id: 7,
          nickname: '메이플러버'
        },
        like_count: 8,
        is_liked: true
      }
    ]
  },
  {
    id: 9,
    content: '혹시 무기 잠재능력 조합이 어떻게 되나요? 저도 아크 키우고 있어서 참고하고 싶어요!',
    created_at: '2024-01-16T17:20:00.000Z',
    updated_at: '2024-01-16T17:20:00.000Z',
    user: {
      id: 8,
      nickname: '아크뉴비',
      profile_img: 'https://picsum.photos/40/40?random=15'
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 12,
    is_liked: true,
    replies: []
  },
  {
    id: 11,
    content: '500만원... 부럽네요 ㅠㅠ 저는 무과금으로 어디까지 갈 수 있을까요?',
    created_at: '2024-01-16T19:10:00.000Z',
    updated_at: '2024-01-16T19:10:00.000Z',
    user: {
      id: 9,
      nickname: '무과금전사',
      profile_img: null
    },
    parent_comment_id: null,
    mention_user: null,
    like_count: 31,
    is_liked: false,
    replies: [
      {
        id: 12,
        content: '@무과금전사 무과금도 충분히 강해질 수 있어요! 시간 투자만 하시면 됩니다',
        created_at: '2024-01-16T20:30:00.000Z',
        updated_at: '2024-01-16T20:30:00.000Z',
        user: {
          id: 2,
          nickname: '메이플마스터',
          profile_img: null
        },
        parent_comment_id: 11,
        mention_user: {
          id: 9,
          nickname: '무과금전사'
        },
        like_count: 18,
        is_liked: false
      }
    ]
  }
];
