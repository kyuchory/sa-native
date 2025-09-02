// 댓글 모의 데이터
import { CommentItem, CommentUser, MentionUser } from '../types/feed';

// 현재 사용자 ID (테스트용)
const currentUserId = 100;

// 사용자 목록
const users: CommentUser[] = [
  {
    id: 1,
    nickname: '다른사용자1',
    profile_img: 'https://picsum.photos/id/238/400/400',
  },
  {
    id: 2,
    nickname: '다른사용자2',
    profile_img: 'https://picsum.photos/id/239/400/400',
  },
  {
    id: 101,
    nickname: '내사용자',
    profile_img: 'https://picsum.photos/id/240/400/400',
  },
];

// 멘션 사용자
const mentionUser: MentionUser = {
  id: 2,
  nickname: '다른사용자2',
};

// 대댓글 목록
const replies: CommentItem[] = [
  {
    id: 101,
    content: '동감합니다!',
    created_at: '2024-01-15T11:30:00.000Z',
    updated_at: '2024-01-15T11:30:00.000Z',
    user: users[1], // 다른사용자2
    parent_comment_id: 5,
    mention_user: mentionUser,
    like_count: 1,
    is_liked: false,
    is_author: false,
    is_deleted: false,
  },
];

// 주 댓글 목록
export const mockComments: CommentItem[] = [
  {
    id: 5,
    content: '정말 멋진 글이네요!',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
    user: users[0], // 다른사용자1
    parent_comment_id: null,
    mention_user: null,
    like_count: 3,
    is_liked: true,
    is_author: false,
    is_deleted: false,
    replies: replies,
  },
  {
    id: 6,
    content: '사진이 정말 예쁘네요.',
    created_at: '2024-01-15T10:45:00.000Z',
    updated_at: '2024-01-15T10:45:00.000Z',
    user: users[2], // 내사용자
    parent_comment_id: null,
    mention_user: null,
    like_count: 2,
    is_liked: false,
    is_author: true, // 자신의 댓글
    is_deleted: false,
  },
  {
    id: 7,
    content: '어디에서 찍으셨나요?',
    created_at: '2024-01-15T11:00:00.000Z',
    updated_at: '2024-01-15T11:00:00.000Z',
    user: users[1], // 다른사용자2
    parent_comment_id: null,
    mention_user: null,
    like_count: 0,
    is_liked: false,
    is_author: false,
    is_deleted: false,
  },
];
