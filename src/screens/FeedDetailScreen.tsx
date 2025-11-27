import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, TouchableOpacity, TouchableWithoutFeedback, Alert, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedScrollHandler, SharedValue } from 'react-native-reanimated';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY, COLORS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

import CommonHeader from '../components/CommonHeader';
import CommentList from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { CommentEditInput } from '../components/CommentEditInput';
import { ReplyInput } from '../components/ReplyInput';
import LoadingOverlay from '../components/LoadingOverlay';
import UserAvatar from '../components/UserAvatar';
import { CommentItem, FeedDetailResponse } from '../types/feed';
import { AuthStackParamList } from '../types/navigation';
import MenuActionSheet from '../components/MenuActionSheet';
import { MenuIcon, EditIcon, DeleteIcon, ReportIcon, MuteIcon, UnmuteIcon } from '../components/CommonIcons';

// 불필요한 mock import는 제거됨

// 아이콘 imports
import { HeartIcon, CommentIcon, BookmarkIcon } from '../components/FeedCardIcons';

// 서비스 imports
import { FeedService } from '../services/feedService';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import { useNetworkState, shouldAutoPlayVideo } from '../hooks/useNetworkState';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';

const { width: screenWidth } = Dimensions.get('window');

// 네비게이션 타입 정의
type FeedDetailRouteProp = RouteProp<AuthStackParamList, 'FeedDetail'>;
type FeedDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'FeedDetail'>;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// 애니메이션 페이지 인디케이터 - 스크롤 오프셋 기반
const AnimatedPageIndicator: React.FC<{
  index: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  colors: Record<string, string>;
}> = ({ index, totalPages, scrollX, colors }) => {

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    // 현재 페이지와의 거리 계산
    const distance = Math.abs(scrollX.value / screenWidth - index);

    // 거리에 따라 표시 여부 결정 (현재 기준 앞뒤 2개만)
    if (distance > 2) {
      return {
        width: 0,
        opacity: 0,
        transform: [{ scale: 0 }],
      };
    }

    // 너비 애니메이션 (active일 때 12, 나머지 6)
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 12, 6],
      Extrapolation.CLAMP
    );

    // 투명도 애니메이션
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    // 스케일 애니메이션
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
      transform: [{ scale }],
    };
  });

  // active 판단용 (렌더링용)
  const isActiveStyle = useAnimatedStyle(() => {
    'worklet';
    const currentPage = Math.round(scrollX.value / screenWidth);
    const isActive = currentPage === index;

    return {
      backgroundColor: isActive ? colors.PRIMARY : colors.GRAY_400,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
        },
        isActiveStyle,
        animatedStyle,
      ]}
    />
  );
};

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

// Enhanced VideoBlock 컴포넌트 - FeedCard의 최적화된 비디오 컴포넌트 적용
interface EnhancedVideoBlockProps {
  videoUri: string;
  feedId: number;
  styles: any;
  isVisible?: boolean;
}

const EnhancedVideoBlock = React.memo(({
  videoUri,
  feedId,
  styles,
  isVisible = true
}: EnhancedVideoBlockProps) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  const videoSource = useMemo<VideoSource>(() => ({
    uri: videoUri,
    useCaching: true,
    headers: Platform.OS === 'ios' && videoUri.includes('.m3u8') ? undefined : {}
  }), [videoUri]);

  useEffect(() => {
    const preloadThumbnail = async () => {
      try {
        const thumbnail = await getThumbnailAsync(videoUri, {
          time: 0.0,
          quality: 0.5
        });
        setThumbnailUri(thumbnail.uri);
      } catch (error) {
        console.warn('썸네일 생성 실패:', error);
      }
    };

    preloadThumbnail();
  }, [videoUri]);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    if (isVisible) {
      player.play();
    }
    setIsPlayerReady(true);
    playerRef.current = player;
  });

  useEffect(() => {
    if (!player || !isPlayerReady) return;

    if (isVisible && player.playing === false) {
      player.play();
    } else if (!isVisible && player.playing === true) {
      player.pause();
    }
  }, [isVisible, player, isPlayerReady]);

  return (
    <View style={styles.videoContainer}>
      {!isPlayerReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.mainImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      <VideoView
        player={player}
        style={styles.mainImage}
        nativeControls={false}
        contentFit="contain"
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
        onFirstFrameRender={() => setThumbnailUri(null)}
      />

      {/* 음소거 토글 버튼 */}
      <TouchableOpacity
        onPress={() => {
          if (player) {
            player.muted = !player.muted;
          }
        }}
        activeOpacity={0.9}
        style={videoStyles.muteButton}
      >
        {
          player?.muted ? (
            <MuteIcon size={20} color="#FFFFFF" />
          ) : (
            <UnmuteIcon size={20} color="#FFFFFF" />
          )
        }
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.feedId === nextProps.feedId &&
         prevProps.videoUri === nextProps.videoUri &&
         prevProps.isVisible === nextProps.isVisible;
});

export default function FeedDetailScreen() {
  const route = useRoute<FeedDetailRouteProp>();
  const navigation = useNavigation<FeedDetailNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();


  const feedId = route.params?.feedId || 15;

  // expand/collapse 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);

  // 스크롤 상태 관리
  const scrollX = useSharedValue(0);

  // 피드 데이터 및 상태 관리
  const [feed, setFeed] = useState<FeedDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 댓글 관련 상태 관리
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);

  // 좋아요/북마크 로딩 상태
  const [isFeedLikeLoading, setIsFeedLikeLoading] = useState(false);
  const [isFeedBookmarkLoading, setIsFeedBookmarkLoading] = useState(false);

  //Zustand
  const { setShouldRefreshFeeds } = useFeedStore(); // 피드 목록 새로고침 플래그 설정용
  const { setShouldRefreshProfileFeeds } = useProfileStore(); // 프로필 플래그 설정용

  // 데이터 필터링 및 메모이제이션
  const mediaBlocks = useMemo(() => feed ? feed.content_blocks.filter(block => block.type === 'image' || block.type === 'video') : [], [feed]);
  const textBlock = useMemo(() => feed ? feed.content_blocks.find(block => block.type === 'text') : null, [feed]);

  // 스크롤 핸들러
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // 키보드 높이 상태
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // 피드 focus 시 데이터 로드 (수정 후 최신 데이터 보장)
  useFocusEffect(
    useCallback(() => {
      loadFeedDetail();
    }, [feedId])
  );

  // 피드 상세 정보 로드
  const loadFeedDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const feedResponse = await FeedService.getFeed(feedId);
      setFeed(feedResponse);

      // 댓글 데이터 로드
      const commentsResponse = await FeedService.getComments(feedId);
      setComments(commentsResponse.items);
      setNextCursor(commentsResponse.next_cursor);
    } catch (error) {
      console.error('피드 상세 조회 실패:', error);
      setError('피드를 불러오는데 실패했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // 더 많은 댓글 로드
  const loadMoreComments = async () => {
    if (isLoadMoreLoading || !nextCursor) return;

    try {
      setIsLoadMoreLoading(true);
      const response = await FeedService.getComments(feedId, nextCursor);
      setComments(prev => [...prev, ...response.items]);
      setNextCursor(response.next_cursor);
    } catch (error) {
      console.error('댓글 더 불러오기 실패:', error);
    } finally {
      setIsLoadMoreLoading(false);
    }
  };

  // 피드 좋아요 토글
  const onFeedLikePress = async () => {
    if (isFeedLikeLoading || !feed) return; // 이미 요청 중이거나 피드가 없으면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsLiked = feed.is_liked;
    const originalLikeCount = feed.like_count;
    const newLikeState = !feed.is_liked;

    setFeed(prev => prev ? {
      ...prev,
      is_liked: newLikeState,
      like_count: newLikeState ? prev.like_count + 1 : Math.max(0, prev.like_count - 1)
    } : null);
    setIsFeedLikeLoading(true);

    try {
      // API 호출
      const response = await FeedService.toggleLike(feedId);

      // 서버 응답으로 최종 상태 동기화
      setFeed(prev => prev ? {
        ...prev,
        is_liked: response.is_liked,
        like_count: response.like_count
      } : null);

      // 피드 목록 새로고침 플래그 설정 (좋아요 변경 반영)
      setShouldRefreshFeeds(true);

    } catch (error) {
      console.error('피드 좋아요 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setFeed(prev => prev ? {
        ...prev,
        is_liked: originalIsLiked,
        like_count: originalLikeCount
      } : null);
    } finally {
      setIsFeedLikeLoading(false);
    }
  };

  // 피드 북마크 토글 (좋아요 토글과 동일한 패턴)
  const onFeedBookmarkToggle = async () => {
    if (isFeedBookmarkLoading || !feed) return; // 이미 요청 중이거나 피드가 없으면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsBookmarked = feed.is_bookmarked;
    const originalBookmarkCount = feed.bookmark_count;
    const newBookmarkState = !feed.is_bookmarked;

    setFeed(prev => prev ? {
      ...prev,
      is_bookmarked: newBookmarkState,
      bookmark_count: newBookmarkState ? prev.bookmark_count + 1 : Math.max(0, prev.bookmark_count - 1)
    } : null);
    setIsFeedBookmarkLoading(true);

    try {
      // API 호출
      const response = await FeedService.toggleBookmark(feedId);

      // 서버 응답으로 최종 상태 동기화
      setFeed(prev => prev ? {
        ...prev,
        is_bookmarked: response.is_bookmarked,
        bookmark_count: response.bookmark_count
      } : null);

      // 피드 목록 새로고침 플래그 설정 (북마크 변경 반영)
      setShouldRefreshFeeds(true);

    } catch (error) {
      console.error('피드 북마크 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setFeed(prev => prev ? {
        ...prev,
        is_bookmarked: originalIsBookmarked,
        bookmark_count: originalBookmarkCount
      } : null);
    } finally {
      setIsFeedBookmarkLoading(false);
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
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

      // 피드 목록 새로고침 플래그 설정 (댓글 작성 반영)
      setShouldRefreshFeeds(true);

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

      // 멘션된 사용자 ID 찾기
      const mentionUserId = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.user.nickname === replyingTo.userName)?.user.id;

      // API 호출
      await FeedService.createComment(feedId, {
        content: text,
        parent_comment_id: replyingTo.commentId,
        mention_user_id: mentionUserId || null
      });

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

      // 피드 목록 새로고침 플래그 설정 (답글 작성 반영)
      setShouldRefreshFeeds(true);

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
    // 해당 댓글 정보를 찾아 최상위 부모 ID로 몰아넣음 (Post 방식과 동일)
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

      // API 호출
      const response = await FeedService.updateComment(feedId, editingComment.commentId, { content: text });

      // 댓글 목록 새로고침
      const updatedComments = await FeedService.getComments(feedId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

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
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

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

              // 목록 새로고침 플래그 설정
              setShouldRefreshFeeds(true);

              // 자신이 작성한 게시물을 삭제하는 경우 프로필 목록도 새로고침
              if (feed?.is_author) {
                setShouldRefreshProfileFeeds(true); // 자신의 피드 목록 새로고침
              }

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
  
  // TapPauseVideo 컴포넌트 - 탭하면 재생/일시정지
  const TapPauseVideo = ({ videoUri }: { videoUri: string }) => {
    const networkState = useNetworkState();
    const { autoPlayMode } = useVideoSettingsStore();
    const shouldAutoPlay = shouldAutoPlayVideo(networkState.type, autoPlayMode);

    const player = useVideoPlayer(videoUri, (player) => {
      player.loop = true;
      player.muted = true; // 시작할 때 기본적으로 음소거 상태
      if (shouldAutoPlay) {
        player.play(); // 설정에 따라 자동 재생
      }
    });

    const [isPlaying, setIsPlaying] = useState(shouldAutoPlay);
    const [isMuted, setIsMuted] = useState(true); // 음소거 상태 관리

    useEffect(() => {
      if (!player) return;

      if (shouldAutoPlay && player.playing === false) {
        player.play();
        setIsPlaying(true);
      } else if (!shouldAutoPlay && player.playing === true) {
        player.pause();
        setIsPlaying(false);
      }
    }, [shouldAutoPlay, player]);

    const handleTogglePlay = () => {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    };

    const handleToggleMute = () => {
      player.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    return (
      <View style={videoStyles.container}>
        <VideoView
          player={player}
          style={videoStyles.videoView}
          contentFit="contain"
          nativeControls={false}
          surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
        />
        {/* 음소거 토글 버튼 - 우측 상단 */}
        <TouchableOpacity
          onPress={handleToggleMute}
          activeOpacity={0.9}
          style={videoStyles.muteButton}
        >
          {isMuted ? (
            <MuteIcon size={20} color="#FFFFFF" />
          ) : (
            <UnmuteIcon size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        {/* 터치 오버레이 - VideoView 위에 투명 레이어 */}
        <TouchableOpacity
          onPress={handleTogglePlay}
          activeOpacity={1}
          style={videoStyles.touchOverlay}
        />
      </View>
    );
  };

  // 텍스트 더보기/접기 처리 - useCallback으로 메모이제이션
  const renderContent = useCallback(() => {
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
  }, [textBlock, isExpanded, styles.contentText, styles.moreText]);

  // 로딩 상태 (PostDetailScreen과 같은 패턴으로 분리)
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="피드" showBackButton={true} />
        <LoadingOverlay visible={loading} message="피드 로딩 중..." />
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
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
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="피드" showBackButton={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>피드를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            <UserAvatar 
              profileImg={feed.user.profile_img} 
              nickname={feed.user.nickname}
              size={40}
            />
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{feed.user.nickname}</Text>
              <Text style={styles.location}>대한민국 서울시 (하드코딩)</Text>
            </View>
          </TouchableOpacity>

          {/* 미디어 스크롤 영역 (이미지 + 비디오) */}
          {mediaBlocks.length > 0 && (
            <>
              <AnimatedScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                decelerationRate="fast"
              >
                {mediaBlocks.map((block: any, index: number) => (
                  <View key={block.sequence} style={styles.carouselItem}>
                    {/* 첫 번째 미디어에만 총 개수 표시 */}
                    {index === 0 && mediaBlocks.length > 1 && (
                      <Text style={styles.moreImagesText}>
                        +{mediaBlocks.length}
                      </Text>
                    )}
                    {block.type === 'video' ? (
                      <EnhancedVideoBlock
                        videoUri={block.value}
                        feedId={feed.id}
                        styles={{ mainImage: styles.mainImage, videoContainer: videoStyles.container }}
                        isVisible={true}
                      />
                    ) : (
                      <Image
                        source={{ uri: block.value }}
                        style={styles.mainImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    )}
                  </View>
                ))}
              </AnimatedScrollView>

              {/* 애니메이션 페이지 인디케이터 - 스크롤 기반 */}
              {mediaBlocks.length > 1 && (
                <View style={styles.pageIndicatorContainer}>
                  {mediaBlocks.map((_, index) => (
                    <AnimatedPageIndicator
                      key={index}
                      index={index}
                      totalPages={mediaBlocks.length}
                      scrollX={scrollX}
                      colors={colors}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* 액션 버튼들 */}
          <View style={styles.actionsContainer}>
            <View style={styles.leftActions}>
              <Pressable
                style={styles.actionButton}
                onPress={onFeedLikePress}
                disabled={isFeedLikeLoading}
              >
                {isFeedLikeLoading ? (
                  <ActivityIndicator size="small" color={colors.ERROR} />
                ) : (
                  <HeartIcon
                    filled={feed.is_liked}
                    size={20}
                    color={feed.is_liked ? colors.ERROR : colors.GRAY_600}
                  />
                )}
              </Pressable>
              <Text style={[
                styles.actionCount,
                feed.is_liked && { color: colors.ERROR },
                isFeedLikeLoading && styles.loadingText
              ]}>
                {feed.like_count}
              </Text>

              {/* 댓글 버튼은 액션 없음 */}
              <TouchableOpacity style={styles.actionButton} onPress={()=>null}>
                <CommentIcon size={20} />
              </TouchableOpacity>
              <Text style={styles.actionCount}>{feed.comment_count}</Text>
            </View>

        <View style={styles.rightActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onFeedBookmarkToggle}
                disabled={isFeedBookmarkLoading}
              >
                {isFeedBookmarkLoading ? (
                  <ActivityIndicator size="small" color={colors.PRIMARY} />
                ) : (
                  <BookmarkIcon
                    filled={feed.is_bookmarked}
                    size={20}
                    color={feed.is_bookmarked ? colors.PRIMARY : colors.GRAY_600}
                  />
                )}
              </TouchableOpacity>
              <Text style={[
                styles.actionCount,
                styles.rightActionCount,
                feed.is_bookmarked && { color: colors.PRIMARY },
                isFeedBookmarkLoading && styles.loadingText
              ]}>
                {feed.bookmark_count}
              </Text>
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
          totalCount={feed.comment_count}
          hasNextPage={!!nextCursor}
          onCommentLike={onCommentLikePress}
          onReplyPress={(comment: any) => onReplyPress(comment.id, comment.user?.nickname || 'Unknown')}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onLoadMore={loadMoreComments}
        />
      </ScrollView>

        {/* 댓글 입력창 */}
        <View style={[
          styles.commentInputWrapper,
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
              placeholder="댓글을 작성해 보세요."
              isLoading={isCommentLoading}
            />
          )}
        </View>

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
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
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
  carouselItem: {
    position: 'relative',
    width: screenWidth,
    height: screenWidth,
  },
  imageContainer: {
    position: 'relative',
    width: screenWidth,
    height: screenWidth,
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.GRAY_200, // COLORS.GRAY_200
  },
  moreImagesText: {
    position: 'absolute',
    bottom: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: COLORS.WHITE,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    zIndex: 10,
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
  rightActionCount: {
    marginRight: 0,
  },
  loadingText: {
    opacity: 0.6,
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

  // 댓글 입력창 wrapper
  commentInputWrapper: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
  },

  // 메뉴 버튼
  menuButton: {
    padding: SPACING.SM,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    gap: SPACING.XS,
  },
  // 비디오 컨테이너
  videoContainer: {
    flex: 1,
  },
});

// 비디오 컴포넌트용 스타일
const videoStyles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative' as const,
  },
  videoView: {
    width: screenWidth,
    height: screenWidth,
  },
  touchOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  muteButton: {
    position: 'absolute' as const,
    top: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
