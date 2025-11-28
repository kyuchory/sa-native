import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { useEventListener } from 'expo';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { PostDetail, PostDetailContentBlock, PostTag } from '../types/post';
import { useThemeStore } from '../stores/themeStore';

// Components
import CommonHeader from '../components/CommonHeader';
import LoadingOverlay from '../components/LoadingOverlay';
import UserAvatar from '../components/UserAvatar';

// Services
import { PostService } from '../services/postService';

// SVG Icons import
import { LikeIcon, CommentIcon, BookmarkIcon } from '../components/PostIcons';
// Comment component import
import CommentList from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import { ReplyInput } from '../components/ReplyInput';
import { CommentEditInput } from '../components/CommentEditInput';
import MenuActionSheet from '../components/MenuActionSheet';
import { CustomAlertModal } from '../components';
import { MenuIcon, ReportIcon, EditIcon, DeleteIcon, MuteIcon, UnmuteIcon } from '../components/CommonIcons';

import { Comment } from '../types/post';
import { useAuthStore } from '../stores/authStore';
import usePostStore from '../stores/postStore';
import useProfileStore from '../stores/profileStore';
import { useNetworkState, shouldAutoPlayVideo } from '../hooks/useNetworkState';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';

type PostDetailRouteProp = RouteProp<AuthStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'PostDetail'>;

type ImageBlockProps = {
  imageUri: string;
  colors: Record<string, string>;
  styles: ReturnType<typeof createStyles>;
};

const ImageBlock: React.FC<ImageBlockProps> = React.memo(({ imageUri, colors, styles }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={styles.imageBlock}>
      {isLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      )}
      <Image
        source={{ uri: imageUri }}
        cachePolicy="memory-disk"
        style={[
          styles.contentImage,
          aspectRatio ? { aspectRatio } : { height: 250 },
        ]}
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) setAspectRatio(width / height);
          setIsLoading(false);
        }}
        transition={200}
        contentFit="contain"
      />
    </View>
  );
});

type VideoBlockProps = {
  videoUri: string;
  styles: ReturnType<typeof createStyles>;
};

const VideoBlock: React.FC<VideoBlockProps> = React.memo(({ videoUri, styles }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const networkState = useNetworkState();
  const { autoPlayMode } = useVideoSettingsStore();
  const shouldAutoPlay = shouldAutoPlayVideo(networkState.type, autoPlayMode);

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = true;
    if (shouldAutoPlay) {
      player.play();
    }
  });

  useEventListener(player, 'videoTrackChange', ({ videoTrack }) => {
    if (videoTrack?.size) {
      const { width, height } = videoTrack.size;
      if (width && height) {
        setAspectRatio(width / height);
      }
    }
  });

  React.useEffect(() => {
    if (!player) return;
    if (shouldAutoPlay && player.playing === false) {
      player.play();
    } else if (!shouldAutoPlay && player.playing === true) {
      player.pause();
    }
  }, [shouldAutoPlay, player]);

  return (
    <View style={styles.videoBlock}>
      <VideoView
        player={player}
        style={[
          styles.videoPlayer,
          ...(aspectRatio && aspectRatio > 0 ? [{ aspectRatio }] : [])
        ]}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
});

// Enhanced VideoBlock 컴포넌트 - FeedCard의 최적화된 비디오 컴포넌트 적용
interface EnhancedVideoBlockProps {
  videoUri: string;
  postId: number;
  styles: any;
  isVisible?: boolean;
}

const EnhancedVideoBlock = React.memo(({
  videoUri,
  postId,
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

  const videoStyle = [
    styles.videoPlayer,
    { height: 250 },
  ];

  return (
    <View style={styles.videoBlock}>
      {!isPlayerReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={videoStyle}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      )}

      <VideoView
        player={player}
        style={videoStyle}
        nativeControls
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
  return prevProps.postId === nextProps.postId &&
         prevProps.videoUri === nextProps.videoUri &&
         prevProps.isVisible === nextProps.isVisible;
});

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<PostDetailNavigationProp>();
  const insets = useSafeAreaInsets();

  const { postId } = route.params;
  const { colors } = useThemeStore();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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




  // 상태 관리
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userName: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ commentId: number; content: string } | null>(null);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSuccessModalVisible, setReportSuccessModalVisible] = useState(false);
  const { user } = useAuthStore();
  const { setShouldRefreshPosts } = usePostStore();
  const { setShouldRefreshProfilePosts } = useProfileStore(); 

  useFocusEffect(
    useCallback(() => {
      loadPostDetail();
    }, [postId])
  );

















  const loadPostDetail = async () => {
    try {
      setIsLoading(true);
      const postData = await PostService.getPostDetail(postId);
      setPost(postData);
      setIsLiked(postData.is_liked || false);
      setIsBookmarked(postData.is_bookmarked || false);
      setLikeCount(postData.like_count);
      setBookmarkCount(postData.bookmark_count);
      const commentsData = await PostService.getComments(postId);
      setComments(commentsData.items);
      setNextCursor(commentsData.next_cursor);
    } catch (error) {
      Alert.alert('오류', '게시물을 불러오는데 실패했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // 더 많은 댓글 로드
  const loadMoreComments = async () => {
    if (isLoadMoreLoading || !nextCursor) return;

    try {
      setIsLoadMoreLoading(true);
      const response = await PostService.getComments(postId, nextCursor);
      setComments(prev => [...prev, ...response.items]);
      setNextCursor(response.next_cursor);
    } catch (error) {
      console.error('댓글 더 불러오기 실패:', error);
    } finally {
      setIsLoadMoreLoading(false);
    }
  };

  // 좋아요 토글 (PostCard와 동일한 낙관적 UI 적용)
  const handleLikeToggle = async () => {
    if (isLikeLoading) return; // 이미 요청 중이면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;

    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);

    try {
      // API 호출
      const response = await PostService.togglePostLike(postId);

      // 서버 응답으로 최종 상태 동기화
      setIsLiked(response.is_liked);
      setLikeCount(response.like_count);

      // 게시물 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);

    } catch (error) {
      console.error('좋아요 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);

      Alert.alert('오류', '좋아요 처리에 실패했습니다.');

    } finally {
      setIsLikeLoading(false);
    }
  };

  // 북마크 토글 (좋아요 토글과 동일한 패턴 적용)
  const handleBookmarkToggle = async () => {
    if (isBookmarkLoading) return; // 이미 요청 중이면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsBookmarked = isBookmarked;
    const originalBookmarkCount = bookmarkCount;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setBookmarkCount(prev => newBookmarkState ? prev + 1 : Math.max(0, prev - 1));
    setIsBookmarkLoading(true);

    try {
      // API 호출
      const response = await PostService.togglePostBookmark(postId);

      // 서버 응답으로 최종 상태 동기화
      setIsBookmarked(response.is_bookmarked);
      setBookmarkCount(response.bookmark_count);

      // 게시물 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);

    } catch (error) {
      console.error('북마크 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setIsBookmarked(originalIsBookmarked);
      setBookmarkCount(originalBookmarkCount);

      Alert.alert('오류', '북마크 처리에 실패했습니다.');

    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // 댓글 좋아요 토글 - useCallback 메모이제이션
  const handleCommentLike = useCallback(async (commentId: number) => {
    // 낙관적 UI 업데이트
    const originalComments = [...comments];

    setComments(prev => {
      const updateComment = (comment: Comment): Comment => {
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
      const response = await PostService.toggleCommentLike(commentId);

      // 서버 응답으로 최종 동기화
      setComments(prev => {
        const updateComment = (comment: Comment): Comment => {
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
      // 실패 시 원래 상태로 롤백
      setComments(originalComments);
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
      console.error('댓글 좋아요 토글 실패:', error);
    }
  }, [comments, postId]); // comments와 postId가 바뀔 때만 재생성

  // 댓글 작성 - useCallback 메모이제이션
  const handleSendComment = useCallback(async (text: string) => {
    if (!text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // API 호출
      await PostService.createComment(postId, text);

      // 댓글 목록 새로고침
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

      // 게시물 목록 새로고침 플래그 설정
      setShouldRefreshPosts(true);

    } catch (error) {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  }, [isCommentLoading, postId, setShouldRefreshPosts]);

  // 답글 작성
  const handleReplyPress = (comment: Comment) => {
    // 대댓글에 답글을 다는 경우 최상위 부모 댓글의 ID를 사용
    const parentCommentId = comment.parent_comment_id || comment.id;

    setReplyingTo({
      commentId: parentCommentId,
      userName: comment.user.nickname
    });
  };

  // 답글 전송
  const handleSendReply = async (text: string) => {
    if (!replyingTo || !text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // 멘션된 사용자 ID 찾기 (실제로는 사용자 검색 API 필요)
      const mentionUserId = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.user.nickname === replyingTo.userName)?.user.id;

      // API 호출
      await PostService.createComment(postId, text, replyingTo.commentId, mentionUserId);

      // 댓글 목록 새로고침
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

      // 답글 입력 모드 종료
      setReplyingTo(null);

    } catch (error) {
      Alert.alert('오류', '답글 작성에 실패했습니다.');
      console.error('답글 작성 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 수정
  const handleEditComment = (commentId: number) => {
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
  const handleSaveEdit = async (text: string) => {
    if (!editingComment || !text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);

      // API 호출
      await PostService.updateComment(editingComment.commentId, text);

      // 댓글 목록 새로고침
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);

      // 수정 모드 종료
      setEditingComment(null);

    } catch (error) {
      Alert.alert('오류', '댓글 수정에 실패했습니다.');
      console.error('댓글 수정 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      '댓글 삭제',
      '댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.',
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
              setIsCommentLoading(true);

              // API 호출
              await PostService.deleteComment(commentId);

              // 댓글 목록 새로고침
              const updatedComments = await PostService.getComments(postId);
              setComments(updatedComments.items);
              setNextCursor(updatedComments.next_cursor);

            } catch (error) {
              Alert.alert('오류', '댓글 삭제에 실패했습니다.');
              console.error('댓글 삭제 실패:', error);
            } finally {
              setIsCommentLoading(false);
            }
          },
        },
      ]
    );
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    Alert.alert(
      '게시물 삭제',
      '게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다.',
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
              setIsLoading(true);

              // API 호출
              await PostService.deletePost(postId);

              // 목록 새로고침 플래그 설정
              setShouldRefreshPosts(true);

              // 자신이 작성한 게시물을 삭제하는 경우 프로필 목록도 새로고침
              if (post?.is_author) {
                setShouldRefreshProfilePosts(true); // 자신의 게시물 목록 새로고침
              }

              // 삭제 성공 시 이전 화면으로 돌아가기
              Alert.alert('삭제 완료', '게시물이 삭제되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('오류', '게시물 삭제에 실패했습니다.');
              console.error('게시물 삭제 실패:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };


  // 콘텐츠 블록 렌더링
  const renderContentBlock = (block: PostDetailContentBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <View key={index} style={styles.textBlock}>
            <Text style={styles.contentText}>{block.value}</Text>
          </View>
        );
      case 'image':
        return (
          <ImageBlock
            key={index}
            imageUri={block.value || ''}
            colors={colors}
            styles={styles}
          />
        );
      case 'video':
        return (
          <EnhancedVideoBlock
            key={index}
            videoUri={block.value || ''}
            postId={postId}
            styles={{
              videoBlock: styles.videoBlock,
              videoPlayer: styles.videoPlayer
            }}
            isVisible={true}
          />
        );
      default:
        return null;
    }
  };

  // 태그 렌더링
  const renderTags = (tags: PostTag[]) => {
    if (tags.length === 0) return null;

    return (
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tag}>
            <Text style={styles.tagText}>#{tag.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="게시물" />
        <LoadingOverlay visible={true} message="게시물 로딩 중..."/>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="게시물" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        {/* 상단 고정 헤더 */}
        <CommonHeader
          title="게시물"
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

        {/* 스크롤 가능한 컨텐츠 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 0 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 게시물 내용 */}
          {/* 작성자 정보 */}
          <View style={styles.authorSection}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => navigation.navigate('UserProfile', { userId: String(post.user.id) })}
              activeOpacity={0.7}
            >
              <UserAvatar 
                profileImg={post.user.profile_img} 
                nickname={post.user.nickname}
                size={40}
              />
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{post.user.nickname}</Text>
                <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryText}>
                {post.sub_category.category.name} {'>'} {post.sub_category.name}
              </Text>
            </View>
          </View>

          {/* 제목 */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{post.title}</Text>
          </View>

          {/* 콘텐츠 블록들 */}
          <View style={styles.contentSection}>
            {post.content_blocks
              .sort((a, b) => a.sequence - b.sequence)
              .map((block, index) => renderContentBlock(block, index))}
          </View>

          {/* 태그 */}
          {renderTags(post.tags)}

          {/* 통계 - 작은 버튼들을 왼쪽에 배치 */}
          <View style={styles.compactStatsSection}>
            <TouchableOpacity
              style={styles.compactStatButton}
              onPress={handleLikeToggle}
              activeOpacity={0.7}
              disabled={isLikeLoading}
            >
              <View style={styles.iconContainer}>
                {isLikeLoading ? (
                  <ActivityIndicator size="small" color={colors.ERROR} />
                ) : (
                  <LikeIcon
                    size={18}
                    filled={isLiked}
                    color={isLiked ? colors.ERROR : colors.GRAY_500}
                  />
                )}
              </View>
              <Text style={[styles.compactStatText, isLiked && styles.likedText, isLikeLoading && styles.loadingText]}>
                {likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compactStatButton}
              onPress={() => {
                // 댓글 섹션으로 스크롤 (추후 구현 가능)
                console.log('댓글로 이동');
              }}
              activeOpacity={0.7}
            >
              <CommentIcon
                size={18}
                color={colors.GRAY_500}
              />
              <Text style={styles.compactStatText}>{comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compactStatButton}
              onPress={handleBookmarkToggle}
              activeOpacity={0.7}
              disabled={isBookmarkLoading}
            >
              <View style={styles.iconContainer}>
                {isBookmarkLoading ? (
                  <ActivityIndicator size="small" color={colors.PRIMARY} />
                ) : (
                  <BookmarkIcon
                    size={18}
                    filled={isBookmarked}
                    color={isBookmarked ? colors.PRIMARY : colors.GRAY_500}
                  />
                )}
              </View>
              <Text style={[styles.compactStatText, isBookmarked && styles.bookmarkedText, isBookmarkLoading && styles.loadingText]}>
                {bookmarkCount}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 댓글 목록 */}
          <CommentList
            comments={comments}
            totalCount={post.comment_count}
            hasNextPage={!!nextCursor}
            onCommentLike={handleCommentLike}
            onReplyPress={handleReplyPress}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
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
          {replyingTo ? (
            <ReplyInput
              onSendReply={handleSendReply}
              onCancel={() => setReplyingTo(null)}
              replyToUser={replyingTo.userName}
              isLoading={isCommentLoading}
            />
          ) : editingComment ? (
            <CommentEditInput
              initialText={editingComment.content}
              onSave={handleSaveEdit}
              onCancel={() => setEditingComment(null)}
              isLoading={isCommentLoading}
            />
          ) : (
            <CommentInput
              onSendComment={handleSendComment}
              isLoading={isCommentLoading}
            />
          )}
        </View>

        {/* 메뉴 액션 시트 */}
        <MenuActionSheet
          visible={menuActionSheetVisible}
          onClose={() => setMenuActionSheetVisible(false)}
          title="게시물"
          actions={[
            // 작성자의 게시물인 경우 수정/삭제 메뉴 추가
            ...(post?.is_author ? [
              {
                id: 'edit',
                title: '게시물 수정',
                icon: <EditIcon size={20} color={colors.GRAY_700} />,
                color: colors.GRAY_700,
                onPress: () => {
                  navigation.navigate('EditPost', { postId: postId });
                },
              },
              {
                id: 'delete',
                title: '게시물 삭제',
                icon: <DeleteIcon size={20} color={colors.GRAY_700} />,
                color: colors.GRAY_700,
                onPress: handleDeletePost,
              },
            ] : []),
            // 신고는 모든 사용자에게 표시
            {
              id: 'report',
              title: '게시물 신고',
              icon: <ReportIcon size={20} color={colors.ERROR} />,
              color: colors.ERROR,
              onPress: () => {
                setReportModalVisible(true);
              },
            },
          ]}
        />

        {/* 게시물 신고 모달 */}
        <CustomAlertModal
          visible={reportModalVisible}
          title="게시물 신고"
          message="이 게시물을 신고하시겠습니까? 신고된 게시물은 관리자가 검토 후 조치됩니다."
          buttons={[
            {
              text: "취소",
              onPress: () => setReportModalVisible(false),
              style: "cancel"
            },
            {
              text: "신고하기",
              onPress: () => {
                // TODO: 신고 API 호출
                setReportModalVisible(false);
                setReportSuccessModalVisible(true);
              },
              style: "destructive"
            }
          ]}
          onClose={() => setReportModalVisible(false)}
        />

        {/* 신고 완료 모달 */}
        <CustomAlertModal
          visible={reportSuccessModalVisible}
          title="신고 완료"
          message="신고가 접수되었습니다."
          buttons={[
            {
              text: "확인",
              onPress: () => setReportSuccessModalVisible(false),
              style: "default"
            }
          ]}
          onClose={() => setReportSuccessModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50
  },

  // 로딩 및 에러
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY 대신
    textAlign: 'center',
  },

  // 댓글 입력창 wrapper
  commentInputWrapper: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
  },

  // 작성자 섹션
  authorSection: {
    backgroundColor: colors.WHITE,
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  authorDetails: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
  },
  postTime: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
  },
  categoryInfo: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 제목 섹션
  titleSection: {
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
    lineHeight: 28,
  },

  // 콘텐츠 섹션
  contentSection: {
    backgroundColor: colors.WHITE,
  },

  // 콘텐츠 블록
  textBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    lineHeight: 24,
  },
  imageBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  contentImage: {
    width: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_200, // 로딩 시 배경색 표시 최적화
  },
  imageLoadingContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
  },
  videoBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  videoPlayer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.MD,
  },

  // 태그
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.MD,
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    gap: SPACING.SM,
  },
  tag: {
    backgroundColor: colors.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  tagText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 컴팩트한 통계 섹션
  compactStatsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
  compactStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.XS,
    gap: SPACING.XS,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  likedText: {
    color: colors.ERROR,
  },
  bookmarkedText: {
    color: colors.PRIMARY,
  },
  loadingText: {
    opacity: 0.6,
  },

  // 메뉴 버튼
  menuButton: {
    padding: SPACING.SM,
  },
});

// 비디오 컴포넌트용 스타일
const videoStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 'auto',
    position: 'relative' as const,
  },
  videoView: {
    width: '100%',
    height: 'auto',
  },
  muteButton: {
    position: 'absolute',
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
