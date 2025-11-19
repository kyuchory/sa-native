import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { ShortItem, ShortComment, ShortCommentsResponse } from '../types/cut';
import { CutService } from '../services/cutService';
import { formatRelativeTime } from '../utils/timeUtils';
import UserAvatar from './UserAvatar';
import CommentList from './CommentList';
import { CommentInput } from './CommentInput';
import { CommentEditInput } from './CommentEditInput';
import { ReplyInput } from './ReplyInput';

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CutCommentActionSheetProps {
  visible: boolean;
  onClose: () => void;
  short: ShortItem;
  onCommentCountUpdate?: (shortId: number, newCount: number) => void;
}

export default function CutCommentActionSheet({
  visible,
  onClose,
  short,
  onCommentCountUpdate,
}: CutCommentActionSheetProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  // 애니메이션 값들
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 상태 관리
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 애니메이션 효과
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      loadComments(); // 시트가 열릴 때 댓글 로드
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      // 시트가 닫힐 때 상태 초기화
      setComments([]);
      setReplyingTo(null);
      setEditingComment(null);
    }
  }, [visible, slideAnim, overlayOpacity]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // 댓글 로드
  const loadComments = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await CutService.getShortComments(short.id);
      console.log('로드된 댓글:', response.data.items);
      setComments(response.data.items);
      setNextCursor(response.data.next_cursor);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 더 많은 댓글 로드
  const loadMoreComments = async () => {
    if (isLoadMoreLoading || !nextCursor) return;

    try {
      setIsLoadMoreLoading(true);
      const response = await CutService.getShortComments(short.id, nextCursor);
      setComments(prev => [...prev, ...response.data.items]);
      setNextCursor(response.data.next_cursor);
    } catch (error) {
      console.error('댓글 더 불러오기 실패:', error);
    } finally {
      setIsLoadMoreLoading(false);
    }
  };

  // 댓글 좋아요 토글
  const onCommentLikePress = useCallback(async (commentId: number) => {
    // 낙관적 UI 업데이트
    const originalComments = [...comments];

    setComments(prev => {
      const updateComment = (comment: ShortComment): ShortComment => {
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
      // TODO: 쇼츠 댓글 좋아요 API 호출
      // await CutService.toggleShortCommentLike(short.id, commentId);

      // 성공했다고 가정하고 로그만 출력
      console.log('쇼츠 댓글 좋아요 TO DO:', commentId);
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      // 실패 시 원래 상태로 롤백
      setComments(originalComments);
    }
  }, [comments, short.id]);

  // 댓글 작성
  const onSendComment = async (text: string) => {
    if (!text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // 쇼츠 댓글 작성 API 호출
      await CutService.createShortComment(short.id, { content: text });

      // 댓글 목록 새로고침
      const updatedComments = await CutService.getShortComments(short.id);
      setComments(updatedComments.data.items);
      setNextCursor(updatedComments.data.next_cursor);

      // 부모에게 댓글 수 업데이트 알림
      onCommentCountUpdate?.(short.id, comments.length + 1);

    } catch (error) {
      console.error('댓글 작성 실패:', error);
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 답글 작성
  const onSendReply = async (text: string) => {
    if (!replyingTo || !text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // 멘션된 사용자 ID 찾기
      const mentionUserId = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.user.nickname === replyingTo.userName)?.user.id;

      // 쇼츠 답글 작성 API 호출
      await CutService.createShortComment(short.id, {
        content: text,
        parent_comment_id: replyingTo.commentId,
        mention_user_id: mentionUserId || null
      });

      // 댓글 목록 새로고침
      const updatedComments = await CutService.getShortComments(short.id);
      setComments(updatedComments.data.items);
      setNextCursor(updatedComments.data.next_cursor);

      // 답글 입력 모드 종료
      setReplyingTo(null);

      // 부모에게 댓글 수 업데이트 알림
      onCommentCountUpdate?.(short.id, comments.length + 1);

    } catch (error) {
      console.error('답글 작성 실패:', error);
      Alert.alert('오류', '답글 작성에 실패했습니다.');
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 답글 입력 시작
  const onReplyPress = (commentId: number, userName: string) => {
    // 해당 댓글 정보를 찾아 최상위 부모 ID로 몰아넣음
    const targetComment = comments.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === commentId);
    const parentCommentId = targetComment?.parent_comment_id || commentId;

    setReplyingTo({
      commentId: parentCommentId,
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

      // 쇼츠 댓글 수정 API 호출
      await CutService.updateShortComment(short.id, editingComment.commentId, { content: text });

      // 댓글 목록 새로고침
      const updatedComments = await CutService.getShortComments(short.id);
      setComments(updatedComments.data.items);
      setNextCursor(updatedComments.data.next_cursor);

      // 수정 모드 종료
      setEditingComment(null);

    } catch (error) {
      console.error('댓글 수정 실패:', error);
      Alert.alert('오류', '댓글 수정에 실패했습니다.');
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 삭제
  const onDeleteComment = async (commentId: number) => {
    Alert.alert(
      '댓글 삭제',
      '댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCommentLoading(true);

              // TODO: 쇼츠 댓글 삭제 API 호출
              // await CutService.deleteShortComment(short.id, commentId);

              // 성공했다고 가정하고 로그만 출력 + 목록 새로고침
              console.log('쇼츠 댓글 삭제 TO DO:', commentId);
              const updatedComments = await CutService.getShortComments(short.id);
              setComments(updatedComments.data.items);
              setNextCursor(updatedComments.data.next_cursor);

            } catch (error) {
              console.error('댓글 삭제 실패:', error);
            } finally {
              setIsCommentLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
        {/* 오버레이 */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}/>
        </TouchableOpacity>

        {/* 액션시트 */}
        <Animated.View style={[
          styles.actionSheet,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom // 하단 safe area
          }
        ]}>
          {/* 핸들 바 */}
          <View style={styles.handle} />

          {/* 쇼츠 미리보기 헤더 */}
          <View style={styles.feedPreview}>
            <UserAvatar
              profileImg={short.profile_img}
              nickname={short.username}
              size={40}
            />
            <View style={styles.feedContent}>
              <Text style={styles.feedUsername}>{short.username}</Text>
              <Text style={styles.feedTime}>{formatRelativeTime(short.created_at)}</Text>
              {short.description && (
                <Text style={styles.feedText} numberOfLines={2}>
                  {short.description}
                </Text>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
                <Text style={styles.loadingText}>댓글 로드 중...</Text>
              </View>
            ) : (
              <CommentList
                comments={comments}
                totalCount={short.comment_count}
                hasNextPage={!!nextCursor}
                onCommentLike={onCommentLikePress}
                onReplyPress={(comment: any) => onReplyPress(comment.id, comment.user?.nickname || 'Unknown')}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onLoadMore={loadMoreComments}
              />
            )}
          </ScrollView>

          {/* 댓글 입력 영역 */}
          <View style={[
            styles.inputContainer,
            {
              marginBottom: Platform.OS === 'ios'
                ? Math.max(0, keyboardHeight - insets.bottom)
                : keyboardHeight
            }
          ]}>
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
                placeholder="댓글을 작성하세요..."
                isLoading={isCommentLoading}
              />
            )}
          </View>
        </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.8, // 화면 80% 높이
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    ...SHADOWS.LARGE,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.GRAY_300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  feedPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_100,
  },
  feedContent: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  feedUsername: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  feedTime: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    marginTop: 2,
  },
  feedText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900,
    lineHeight: 16,
    marginTop: SPACING.XS,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
    marginTop: SPACING.SM,
  },
  inputContainer: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
  },
});
