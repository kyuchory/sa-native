// 피드 상세 조회용 모의 데이터
import { FeedDetailResponse, FeedContentBlock, FeedUser } from '../types/feed';

// 작성자 정보
const feedUser: FeedUser = {
  id: 1,
  nickname: '테스트사용자',
  profile_img: 'https://picsum.photos/id/238/400/400',
};

// 콘텐츠 블록들 (모든 이미지 포함)
const contentBlocks: FeedContentBlock[] = [
  {
    type: 'text',
    value: '피드 상세 조회용 모의 콘텐츠입니다. 인스타그램 스타일로 깔끔하게 디자인되었습니다. 더 할말이 없지만, 좀 텍스트를 많이 만들어서 더보기, 접기 버튼을 활성화 시켜보도록 하겠습니다. 이쯤 넘어가면 딱 되는것 같네요 ㅎㅎ',
    sequence: 0,
  },
  {
    type: 'image',
    value: 'https://picsum.photos/id/1/800/800',
    sequence: 1,
  },
  {
    type: 'image',
    value: 'https://picsum.photos/id/2/800/800',
    sequence: 2,
  },
  {
    type: 'image',
    value: 'https://picsum.photos/id/3/800/800',
    sequence: 3,
  },
  {
    type: 'image',
    value: 'https://picsum.photos/id/4/800/800',
    sequence: 4,
  },
];

// 피드 상세 데이터
export const mockFeedDetail: FeedDetailResponse = {
  feed: {
    id: 15,
    created_at: '2024-01-15T12:30:00.000Z',
    user: feedUser,
    content_blocks: contentBlocks,
    media_count: 4,
    like_count: 8,
    bookmark_count: 2,
    comment_count: 3,
    is_liked: false,
    is_bookmarked: true,
    // TODO: 필요에 따라 추가 필드 확장 가능
  },
};
