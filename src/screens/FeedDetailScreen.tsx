import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, Image, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

import CommonHeader from '../components/CommonHeader';
import CommentList from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { CommentEditInput } from '../components/CommentEditInput';
import { ReplyInput } from '../components/ReplyInput';
import LoadingOverlay from '../components/LoadingOverlay';
import { CommentItem, FeedDetailResponse } from '../types/feed';
import { AuthStackParamList } from '../types/navigation';
import MenuActionSheet from '../components/MenuActionSheet';
import { MenuIcon, EditIcon, DeleteIcon, ReportIcon } from '../components/CommonIcons';

// 불필요한 mock import는 제거됨

// 아이콘 imports
import { HeartIcon, CommentIcon, BookmarkIcon } from '../components/FeedCardIcons';

// 서비스 imports
import { FeedService } from '../services/feedService';

const { width: screenWidth } = Dimensions.get('window');

// 네비게이션 타입 정의
type FeedDetailRouteProp = RouteProp<AuthStackParamList, 'FeedDetail'>;
type FeedDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'FeedDetail'>;

// 시간 포맷 함수
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}시간 전`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  }
};

export default function FeedDetailScreen() {
  const route = useRoute<FeedDetailRouteProp>();
  const navigation = useNavigation<FeedDetailNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const feedId = route.params?.feedId || 15;

  // expand/collapse 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);

  // 피드 데이터 및 상태 관리
  const [feed, setFeed] = useState<FeedDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 댓글 관련 상태 관리
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);

  // 데이터 필터링 (feed가 null일 수 있음)
  const imageBlocks = feed ? feed.content_blocks.filter(block => block.type === 'image') : [];
  const textBlock = feed ? feed.content_blocks.find(block => block.type === 'text') : null;

  // API 호출
  useEffect(() => {
    const fetchFeedDetailAndComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const feedResponse = await FeedService.getFeed(feedId);
        setFeed(feedResponse);

        
        const commentsResponse = await FeedService.getComments(feedId);
        setComments(commentsResponse);
      } catch (err) {
        console.error('데이터 조회 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedDetailAndComments();
  }, [feedId]);

  // 피드 좋아요 토글
  const onFeedLikePress = async () => {
    if (feed) {
      // 낙관적 UI 업데이트
      const originalIsLiked = feed.is_liked;
      const originalLikeCount = feed.like_count;

      setFeed(prev => prev ? {
        ...prev,
        is_liked: !prev.is_liked,
        like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1
      } : null);

      try {
        const response = await FeedService.toggleLike(feedId);
        // API 응답으로 최종 상태 동기화
        setFeed(prev => prev ? {
          ...prev,
          is_liked: response.is_liked,
          like_count: response.like_count
        } : null);
      } catch (error) {
        console.error('피드 좋아요 토글 실패:', error);
        // 실패 시 원래 상태로 롤백
        setFeed(prev => prev ? {
          ...prev,
          is_liked: originalIsLiked,
          like_count: originalLikeCount
        } : null);
      }
    }
  };

  // 댓글 좋아요 토글
  const onCommentLikePress = async (commentId: number) => {
    // 낙관적 UI 업데이트
    const originalComments = [...comments];

    setComments(prev => {
      const updateComment = (comment: CommentItem): CommentItem => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: !comment.is_liked,
            like_count: comment.is_liked ? comment.like_count - 1 : comment.like_count + 1
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment)
          };
        }
        return comment;
      };

      return prev.map(updateComment);
    });

    try {
      // API 호출
      const response = await FeedService.toggleCommentLike(feedId, commentId);

      // 서버 응답으로 최종 동기화
      setComments(prev => {
        const updateComment = (comment: CommentItem): CommentItem => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: response.is_liked,
              like_count: response.like_count
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(updateComment)
            };
          }
          return comment;
        };

        return prev.map(updateComment);
      });
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      // 실패 시 원래 상태로 롤백
      setComments(originalComments);
    }
  };

  // 댓글 작성
  const onSendComment = async (text: string) => {
    if (!text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // API 호출
      await FeedService.createComment(feedId, { content: text });

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments);

      console.log('댓글 작성 성공:', text);

    } catch (error) {
      console.error('댓글 작성 실패:', error);
      // TODO: 에러 알림
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 답글 작성
  const onSendReply = async (text: string) => {
    if (!replyingTo || !text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // API 호출
      await FeedService.createComment(feedId, {
        content: text,
        parent_comment_id: replyingTo.commentId
      });

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments);

      // 답글 입력 모드 종료
      setReplyingTo(null);

      console.log('답글 작성 성공:', text);

    } catch (error) {
      console.error('답글 작성 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 답글 입력 시작
  const onReplyPress = (commentId: number, userName: string) => {
    setReplyingTo({
      commentId,
      userName
    });
  };

  // 댓글 수정
  const onEditComment = (commentId: number) => {
    const comment = comments
      .flatMap(c => [c, ...(c.replies || [])])
      .find(c => c.id === commentId);

    if (comment) {
      setEditingComment({
        commentId: comment.id,
        content: comment.content
      });
    }
  };

  // 댓글 수정 저장
  const onSaveEdit = async (text: string) => {
    if (!editingComment || !text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // API 호출
      const response = await FeedService.updateComment(feedId, editingComment.commentId, { content: text });

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments);

      // 수정 모드 종료
      setEditingComment(null);

      console.log('댓글 수정 성공:', response);

    } catch (error) {
      console.error('댓글 수정 실패:', error);
      // TODO: 사용자에게 에러 알림 표시
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 삭제
  const onDeleteComment = async (commentId: number) => {
    try {
      setIsCommentLoading(true);

      // API 호출
      await FeedService.deleteComment(feedId, commentId);

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments);

      console.log('댓글 삭제 성공:', commentId);

    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      // TODO: 사용자에게 에러 알림 표시
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 피드 삭제
  const handleDeleteFeed = async () => {
    Alert.alert(
      '피드 삭제',
      '피드를 삭제하시겠습니까? 삭제된 피드는 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // API 호출
              await FeedService.deleteFeed(feedId);

              // 삭제 성공 시 이전 화면으로 돌아가기
              Alert.alert('삭제 완료', '피드가 삭제되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('오류', '피드 삭제에 실패했습니다.');
              console.error('피드 삭제 실패:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 텍스트 더보기/접기 처리
  const renderContent = () => {
    if (!textBlock) return null;

    const content = textBlock.value;
    const shouldTruncate = content.length > 100;

    if (!shouldTruncate) {
      return <Text style={styles.contentText}>{content}</Text>;
    }

    if (isExpanded) {
      return (
        <View>
          <Text style={styles.contentText}>{content}</Text>
          <TouchableOpacity onPress={() => setIsExpanded(false)}>
            <Text style={styles.moreText}>접기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.contentText}>
          {content.substring(0, 100)}...
        </Text>
        <TouchableOpacity onPress={() => setIsExpanded(true)}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 로딩 상태 (PostDetailScreen과 같은 패턴으로 분리)
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="피드" showBackButton={true} />
        <LoadingOverlay visible={loading} message="피드 로딩 중..." />
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="피드" showBackButton={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // feed가 로드되지 않은 경우 (언리치에이블)
  if (!feed) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="피드" showBackButton={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>피드를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="피드"
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuActionSheetVisible(true)}
            activeOpacity={0.7}
          >
            <MenuIcon size={20} color={colors.GRAY_700} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* 프로필 정보 */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => navigation.navigate('UserProfile', { userId: String(feed.user.id) })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: feed.user.profile_img ?? undefined }} style={styles.profileImage} />
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{feed.user.nickname}</Text>
              <Text style={styles.location}>대한민국 서울시 (하드코딩)</Text>
            </View>
          </TouchableOpacity>

          {/* 이미지 스크롤 영역 */}
          {imageBlocks.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={styles.imageScroll}
            >
              {imageBlocks.map((block: any, index: number) => (
                <View key={block.sequence} style={styles.imageContainer}>
                  <Text style={styles.imageCounter}>
                    {index + 1} / {imageBlocks.length}
                  </Text>
                  <Image
                    source={{ uri: block.value }}
                    style={styles.mainImage}
                  />
                </View>
              ))}
            </ScrollView>
          )}

          {/* 액션 버튼들 */}
          <View style={styles.actionsContainer}>
            <View style={styles.leftActions}>
              <Pressable style={styles.actionButton} onPress={onFeedLikePress}>
                <HeartIcon filled={feed.is_liked} size={20} color={feed.is_liked ? colors.ERROR : colors.GRAY_600} />
              </Pressable>
              <Text style={[styles.actionCount, feed.is_liked && { color: colors.ERROR }]}>
                {feed.like_count}
              </Text>

              {/* 댓글 버튼은 액션 없음 */}
              <TouchableOpacity style={styles.actionButton} onPress={()=>null}>
                <CommentIcon size={20} />
              </TouchableOpacity>
              <Text style={styles.actionCount}>{feed.comment_count}</Text>
            </View>

            <View style={styles.rightActions}>
              <Pressable style={styles.actionButton}>
                <BookmarkIcon size={20} />
              </Pressable>
              <Text style={styles.actionCount}>{feed.bookmark_count}</Text>
            </View>
          </View>

          {/* 콘텐츠 텍스트 */}
          {textBlock && (
            <View style={styles.contentTextContainer}>
              {renderContent()}
            </View>
          )}

          {/* 시간 정보 */}
          <Text style={styles.timeText}>{formatTimeAgo(feed.created_at)}</Text>
        </View>

        {/* 댓글 섹션 */}
        <CommentList
          comments={comments}
          onCommentLike={onCommentLikePress}
          onReplyPress={(comment: any) => onReplyPress(comment.id, comment.user?.nickname || 'Unknown')}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
        />
      </ScrollView>

      {/* 댓글 입력 또는 수정 입력 */}
      {editingComment ? (
        <CommentEditInput
          initialText={editingComment.content}
          onSave={onSaveEdit}
          onCancel={() => setEditingComment(null)}
          isLoading={isCommentLoading}
        />
      ) : replyingTo ? (
        <ReplyInput
          onSendReply={onSendReply}
          onCancel={() => setReplyingTo(null)}
          replyToUser={replyingTo.userName}
          isLoading={isCommentLoading}
        />
      ) : (
        <CommentInput
          onSendComment={onSendComment}
          placeholder="댓글을 작성해 보세요."
        />
      )}

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title="피드"
        actions={[
          // 작성자의 피드인 경우 수정/삭제 메뉴 추가
          ...(feed?.is_author ? [
            {
              id: 'edit',
              title: '피드 수정',
              icon: <EditIcon size={20} color={colors.GRAY_700} />,
              color: colors.GRAY_700,
              onPress: () => {
                navigation.navigate('EditFeed', { feedId: feedId });
              },
            },
            {
              id: 'delete',
              title: '피드 삭제',
              icon: <DeleteIcon size={20} color={colors.ERROR} />,
              color: colors.ERROR,
              onPress: handleDeleteFeed,
            },
          ] : []),
          // 신고는 모든 사용자에게 표시
          {
            id: 'report',
            title: '피드 신고',
            icon: <ReportIcon size={20} color={colors.ERROR} />,
            color: colors.ERROR,
            onPress: () => {
              Alert.alert('신고', '피드 신고 기능이 구현 예정입니다.');
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: colors.WHITE,
    marginBottom: SPACING.XS,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  location: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    marginTop: 2,
  },

  // 이미지 스크롤
  imageScroll: {
    height: screenWidth,
  },
  imageContainer: {
    position: 'relative',
    width: screenWidth,
    height: screenWidth,
  },
  imageCounter: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: colors.WHITE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.GRAY_200, // COLORS.GRAY_200
  },

  // 액션 버튼들
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: SPACING.XS,
  },
  actionCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },

  // 콘텐츠 텍스트
  contentTextContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    marginTop: SPACING.XS,
  },

  // 시간
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },

  // 에러 상태
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.XL,
    paddingHorizontal: SPACING.MD,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.ERROR,
    textAlign: 'center',
  },

  // 메뉴 버튼
  menuButton: {
    padding: SPACING.SM,
  },
});
