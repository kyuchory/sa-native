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
  Keyboard,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
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
import CustomAlertModal from './CustomAlertModal';

const { width: screenWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CutCommentActionSheetProps {
  visible: boolean;
  onClose: () => void;
  short: ShortItem;
  onCommentCountUpdate?: (shortId: number, newCount: number) => void;
  onAuthorPress?: () => void;
}

export default function CutCommentActionSheet({
  visible,
  onClose,
  short,
  onCommentCountUpdate,
  onAuthorPress,
}: CutCommentActionSheetProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  // 애니메이션 값들
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 드래그에 따라 배경 투명도 조절 (선택적)
  const dragOpacity = dragAnim.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const combinedOverlayOpacity = Animated.multiply(overlayOpacity, dragOpacity);

  // 상태 관리
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [commentLikeLoading, setCommentLikeLoading] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; nickname: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 댓글 로드와 같은 기존 함수들 유지...

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
    // 이미 로딩 중인 경우 중복 호출 방지
    if (commentLikeLoading.has(commentId)) return;

    // 로딩 상태 시작
    setCommentLikeLoading(prev => new Set(prev).add(commentId));

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
      // 쇼츠 댓글 좋아요 토글 API 호출
      await CutService.toggleShortCommentLike(commentId);

      // 서버 응답은 내부로 처리하고 UI는 낙관적 업데이트로 반영되므로
      // 별도 처리 불필요
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      // 실패 시 원래 상태로 롤백
      setComments(originalComments);
    } finally {
      // 로딩 상태 해제
      setCommentLikeLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  }, [commentLikeLoading, short.id]);

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
      setAlertModal({ visible: true, title: '오류', message: '댓글 작성에 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
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
        .find(c => c.user.nickname === replyingTo.nickname)?.user.id;

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
      setAlertModal({ visible: true, title: '오류', message: '답글 작성에 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 답글 입력 시작
  const onReplyPress = (commentId: number, nickname: string) => {
    // 해당 댓글 정보를 찾아 최상위 부모 ID로 몰아넣음
    const targetComment = comments.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === commentId);
    const parentCommentId = targetComment?.parent_comment_id || commentId;

    setReplyingTo({
      commentId: parentCommentId,
      nickname
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
      setAlertModal({ visible: true, title: '오류', message: '댓글 수정에 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 삭제
  const onDeleteComment = async (commentId: number) => {
    setAlertModal({
      visible: true,
      title: '댓글 삭제',
      message: '댓글을 삭제하시겠습니까?',
      buttons: [
        { text: '취소', onPress: () => setAlertModal(null), style: 'cancel' },
        {
          text: '삭제',
          onPress: async () => {
            try {
              setIsCommentLoading(true);
              setAlertModal(null); // Close modal first
              // 쇼츠 댓글 삭제 API 호출
              await CutService.deleteShortComment(commentId);

              // 댓글 목록 새로고침
              const updatedComments = await CutService.getShortComments(short.id);
              setComments(updatedComments.data.items);
              setNextCursor(updatedComments.data.next_cursor);

              // 부모에게 댓글 수 업데이트 알림
              onCommentCountUpdate?.(short.id, comments.length - 1);

            } catch (error) {
              console.error('댓글 삭제 실패:', error);
              setAlertModal({ visible: true, title: '오류', message: '댓글 삭제에 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
            } finally {
              setIsCommentLoading(false);
            }
          },
          style: 'destructive'
        },
      ]
    });
  };

  // 드래그 제스처 핸들러
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragAnim } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      const dragThreshold = SCREEN_HEIGHT * 0.2; // 20% 화면 높이
      const velocityThreshold = 500; // 빠른 속도 임계값

      // 아래로 드래그한 경우에만 체크 (양수 값)
      if (translationY > 0) {
        // 닫힘 조건: 드래그 거리가 임계값 이상 또는 빠른 속도로 드래그
        const shouldClose = translationY > dragThreshold || velocityY > velocityThreshold;

        if (shouldClose) {
          // Modal을 먼저 닫아서 뒤의 화면이 즉시 터치 가능하도록
          onClose();

          // 닫힘 애니메이션 - 빠른 닫힘 (시각적 효과만)
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: SCREEN_HEIGHT,
              velocity: velocityY,
              useNativeDriver: true,
            }),
            Animated.spring(dragAnim, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 150, // 빠른 페이드아웃
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // 원위치 복귀
          Animated.spring(dragAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // 위로 드래그한 경우는 그대로 복귀
        Animated.spring(dragAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* 오버레이: TouchableOpacity 자체는 투명. 실제 반투명 배경은 Animated.View에서 제어 */}
        <TouchableOpacity
          style={[styles.overlayTouchable]}
          activeOpacity={1}
          onPress={onClose}
        >
          {/* 실제 보이는 오버레이: opacity는 애니메이션 값으로 제어 */}
          <Animated.View
            pointerEvents="none" // 터치 이벤트는 바깥 TouchableOpacity가 처리
            style={[
              styles.overlay,
              { opacity: combinedOverlayOpacity }
            ]}
          />
        </TouchableOpacity>

        {/* 액션시트 */}
        <Animated.View style={[
          styles.actionSheet,
          {
            transform: [{ translateY: Animated.add(slideAnim, dragAnim) }],
            paddingBottom: insets.bottom // 하단 safe area
          }
        ]}>
          {/* 핸들 바 + 피드 미리보기 헤더 전체를 드래그 영역으로 */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            activeOffsetY={10} // 위아래 10px 이동까지는 취소되지 않음
            failOffsetY={-10}
            minPointers={1}
            maxPointers={1}
          >
            <View>
              {/* 핸들 바 */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* 쇼츠 미리보기 헤더 */}
              <View style={styles.feedPreview}>
                <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.7}>
                  <UserAvatar
                    profileImg={short.profile_img}
                    nickname={short.nickname}
                    size={40}
                  />
                </TouchableOpacity>
                <View style={styles.feedContent}>
                  <TouchableOpacity activeOpacity={0.7} onPress={onAuthorPress}>
                    <Text style={styles.feednickname}>{short.nickname}</Text>
                  </TouchableOpacity>
                  <Text style={styles.feedTime}>{formatRelativeTime(short.created_at)}</Text>
                  {short.description && (
                    <Text style={styles.feedText} numberOfLines={2}>
                      {short.description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </PanGestureHandler>

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
                commentLikeLoading={commentLikeLoading}
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
                replyToUser={replyingTo.nickname}
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

          {/* Alert Modal */}
          {alertModal && (
            <CustomAlertModal
              visible={alertModal.visible}
              title={alertModal.title}
              message={alertModal.message}
              buttons={alertModal.buttons}
              onClose={() => setAlertModal(null)}
            />
          )}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  // TouchableOpacity는 투명하게 덮기만 함
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  // 기존 overlay 스타일(배경색 있는 것)은 AnimatedView 용으로 유지
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 실제 반투명 색상은 여기
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.725, // 화면 80% 높이
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    ...SHADOWS.LARGE,
  },
  handleContainer: {
    width: screenWidth,
    height: 50, // 충분한 터치 높이
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 100,
    height: 8,
    backgroundColor: colors.GRAY_300,
    borderRadius: 4,
    alignSelf: 'center',
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
  feednickname: {
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
