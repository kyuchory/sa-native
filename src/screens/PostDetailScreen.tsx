import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { PostDetail, PostDetailContentBlock, PostTag } from '../types/post';
import { useThemeStore } from '../stores/themeStore';
import usePostStore from '../stores/postStore';

// Components
import CommonHeader from '../components/CommonHeader';
import LoadingOverlay from '../components/LoadingOverlay';
import UserAvatar from '../components/UserAvatar';
import { ImageViewerModal } from '../components/ImageViewerModal';

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
import CustomAlertModal from '../components/CustomAlertModal';
import ReportModal from '../components/ReportModal';
import { MenuIcon, ReportIcon, EditIcon, DeleteIcon, MuteIcon, UnmuteIcon } from '../components/CommonIcons';

import { Comment } from '../types/post';
import { ReportTargetType } from '../types/report';
import { useAuthStore } from '../stores/authStore';
import useProfileStore from '../stores/profileStore';
import { ReportService } from '../services/reportService';
import { useNetworkState, shouldAutoPlayVideo } from '../hooks/useNetworkState';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';

type PostDetailRouteProp = RouteProp<AuthStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'PostDetail'>;

type ImageBlockProps = {
  imageUri: string;
  colors: Record<string, string>;
  styles: ReturnType<typeof createStyles>;
  onPress?: () => void;
};

const ImageBlock: React.FC<ImageBlockProps> = React.memo(({ imageUri, colors, styles, onPress }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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
    </TouchableOpacity>
  );
});

// Enhanced VideoBlock 컴포넌트 - FeedCard와 동일하게 수정
interface EnhancedVideoBlockProps {
  videoUri: string;
  thumbnailUri?: string;
  postId: number;
  styles: any;
  isVisible?: boolean;
}

const EnhancedVideoBlock = React.memo(({
  videoUri,
  thumbnailUri: serverThumbnailUri,
  postId,
  styles,
  isVisible = true
}: EnhancedVideoBlockProps) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(serverThumbnailUri || null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // ✅ 상태 추가
  const playerRef = useRef<any>(null);

  // ✅ 네트워크 상태 고려
  const networkState = useNetworkState();
  const { autoPlayMode } = useVideoSettingsStore();
  const shouldAutoPlay = shouldAutoPlayVideo(networkState.type, autoPlayMode);

  useEffect(() => {
    // 서버 썸네일이 있으면 즉시 사용
    if (serverThumbnailUri) {
      setThumbnailUri(serverThumbnailUri);
      return;
    }

    // 서버 썸네일이 없으면 클라이언트에서 생성 (폴백)
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
  }, [videoUri, serverThumbnailUri]);

  // ✅ videoUri 직접 사용 + shouldAutoPlay 고려
  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    player.muted = true;
    if (isVisible && shouldAutoPlay) { // ✅ shouldAutoPlay 추가
      player.play();
    }
    setIsPlayerReady(true);
    playerRef.current = player;
  });

  // ✅ shouldAutoPlay 의존성 추가
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const shouldPlay = isVisible && shouldAutoPlay;
    if (shouldPlay && player.playing === false) {
      player.play();
    } else if (!shouldPlay && player.playing === true) {
      player.pause();
    }
  }, [isVisible, shouldAutoPlay, player, isPlayerReady]);

  // ✅ 음소거 토글 핸들러
  const handleToggleMute = () => {
    if (player) {
      player.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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
        nativeControls={false} // ✅ false로 변경
        contentFit="contain"
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
      />

      {/* ✅ 음소거 토글 버튼 수정 */}
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

  // Custom Alert Modal 상태
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 신고 모달 상태
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // ImageViewerModal 상태
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  const { user } = useAuthStore();
  const { setShouldRefreshPosts, animalTypes } = usePostStore();
  const { setShouldRefreshProfilePosts } = useProfileStore();

  // ✅ ImageViewer용 mediaItems - 이미지와 비디오 모두 포함
  const mediaItems = useMemo(() => {
    if (!post) return [];
    return post.content_blocks
      .filter(block => block.type === 'image' || block.type === 'video')
      .sort((a, b) => a.sequence - b.sequence)
      .map(block => ({
        type: block.type as 'image' | 'video',
        url: block.value || '',
        thumbnailUrl: block.type === 'video' ? block.thumbnail_path : undefined,
      }));
  }, [post]);

  // 동물 타입 라벨 가져오기
  const animalTypeLabel = useMemo(() => {
    if (!post?.animal_type || post.animal_type === 'other') return null;
    const animalTypeOption = animalTypes.find(type => type.value === post.animal_type);
    return animalTypeOption?.label || null;
  }, [post?.animal_type, animalTypes]);

  useFocusEffect(
    useCallback(() => {
      loadPostDetail();
    }, [postId])
  );

  // 게시물 상세 로드
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
      setAlertModal({
        visible: true,
        title: '오류',
        message: '게시물을 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => { setAlertModal(null); navigation.goBack(); } }]
      });
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

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (isLikeLoading) return;

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;

    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);

    try {
      const response = await PostService.togglePostLike(postId);
      setIsLiked(response.is_liked);
      setLikeCount(response.like_count);
      setShouldRefreshPosts(true);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '좋아요 처리에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  // 북마크 토글
  const handleBookmarkToggle = async () => {
    if (isBookmarkLoading) return;

    const originalIsBookmarked = isBookmarked;
    const originalBookmarkCount = bookmarkCount;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setBookmarkCount(prev => newBookmarkState ? prev + 1 : Math.max(0, prev - 1));
    setIsBookmarkLoading(true);

    try {
      const response = await PostService.togglePostBookmark(postId);
      setIsBookmarked(response.is_bookmarked);
      setBookmarkCount(response.bookmark_count);
      setShouldRefreshPosts(true);
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      setIsBookmarked(originalIsBookmarked);
      setBookmarkCount(originalBookmarkCount);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '북마크 처리에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // 댓글 좋아요 토글
  const handleCommentLike = useCallback(async (commentId: number) => {
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
      const response = await PostService.toggleCommentLike(commentId);
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
      setComments(originalComments);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '좋아요 처리에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('댓글 좋아요 토글 실패:', error);
    }
  }, [comments, postId]);

  // 댓글 작성
  const handleSendComment = useCallback(async (text: string) => {
    if (!text.trim() || isCommentLoading) return;

    try {
      setIsCommentLoading(true);
      await PostService.createComment(postId, text);
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);
      setShouldRefreshPosts(true);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '댓글 작성에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  }, [isCommentLoading, postId, setShouldRefreshPosts]);

  // 답글 작성
  const handleReplyPress = (comment: Comment) => {
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

      const mentionUserId = comments
        .flatMap(c => [c, ...(c.replies || [])])
        .find(c => c.user.nickname === replyingTo.userName)?.user.id;

      await PostService.createComment(postId, text, replyingTo.commentId, mentionUserId);

      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);
      setShouldRefreshPosts(true);
      setReplyingTo(null);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '답글 작성에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
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
      await PostService.updateComment(editingComment.commentId, text);
      const updatedComments = await PostService.getComments(postId);
      setComments(updatedComments.items);
      setNextCursor(updatedComments.next_cursor);
      setEditingComment(null);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '댓글 수정에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      console.error('댓글 수정 실패:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    const performDelete = async () => {
      try {
        setIsCommentLoading(true);
        await PostService.deleteComment(commentId);
        const updatedComments = await PostService.getComments(postId);
        setComments(updatedComments.items);
        setNextCursor(updatedComments.next_cursor);
        setAlertModal(null);
      } catch (error) {
        setAlertModal({
          visible: true,
          title: '오류',
          message: '댓글 삭제에 실패했습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        console.error('댓글 삭제 실패:', error);
      } finally {
        setIsCommentLoading(false);
      }
    };

    setAlertModal({
      visible: true,
      title: '댓글 삭제',
      message: '댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setAlertModal(null)
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: performDelete
        }
      ]
    });
  };

  // 신고 제출 핸들러
  const handleReportSubmit = async (reportData: any) => {
    try {
      await ReportService.createReport({
        target_type: reportData.targetType,
        target_id: reportData.targetId,
        category: reportData.category,
        reason: reportData.reason,
      });

      // 성공 메시지 표시
      setAlertModal({
        visible: true,
        title: '신고 완료',
        message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } catch (error) {
      // 에러는 ReportModal 내부에서 처리됨
      throw error;
    }
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    const performDelete = async () => {
      try {
        setIsLoading(true);
        await PostService.deletePost(postId);
        setShouldRefreshPosts(true);

        if (post?.is_author) {
          setShouldRefreshProfilePosts(true);
        }

        setAlertModal({
          visible: true,
          title: '삭제 완료',
          message: '게시물이 삭제되었습니다.',
          buttons: [{ text: '확인', onPress: () => { navigation.goBack(); setAlertModal(null); } }]
        });
      } catch (error) {
        setAlertModal({
          visible: true,
          title: '오류',
          message: '게시물 삭제에 실패했습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        console.error('게시물 삭제 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setAlertModal({
      visible: true,
      title: '게시물 삭제',
      message: '게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다.',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setAlertModal(null)
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: performDelete
        }
      ]
    });
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
  const renderContentBlock = (block: PostDetailContentBlock, blockIndex: number, post: PostDetail) => {
    // 미디어 블록들 중 현재 블록의 인덱스 계산 (이미지 + 비디오)
    const mediaBlocks = post.content_blocks
      .filter(b => b.type === 'image' || b.type === 'video')
      .sort((a, b) => a.sequence - b.sequence);
    const mediaIndex = mediaBlocks.findIndex(b => b.sequence === block.sequence);

    switch (block.type) {
      case 'text':
        return (
          <View key={blockIndex} style={styles.textBlock}>
            <Text style={styles.contentText}>{block.value}</Text>
          </View>
        );
      case 'image':
        return (
          <ImageBlock
            key={blockIndex}
            imageUri={block.value || ''}
            colors={colors}
            styles={styles}
            onPress={() => {
              setImageViewerInitialIndex(mediaIndex);
              setIsImageViewerVisible(true);
            }}
          />
        );
      case 'video':
        // ✅ TouchableOpacity로 감싸서 ImageViewer로 이동
        return (
          <TouchableOpacity
            key={blockIndex}
            onPress={() => {
              setImageViewerInitialIndex(mediaIndex);
              setIsImageViewerVisible(true);
            }}
            activeOpacity={0.9}
          >
            <EnhancedVideoBlock
              videoUri={block.value || ''}
              thumbnailUri={block.thumbnail_path}
              postId={postId}
              styles={{
                videoBlock: styles.videoBlock,
                videoPlayer: styles.videoPlayer
              }}
              isVisible={true}
            />
          </TouchableOpacity>
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
              <View style={styles.metaRow}>
                <Text style={styles.categoryText}>
                  {post.sub_category.category.name} {'>'} {post.sub_category.name}
                </Text>
                {animalTypeLabel && (
                  <>
                    <Text style={styles.metaSeparator}> · </Text>
                    <Text style={styles.animalTypeText}>{animalTypeLabel}</Text>
                  </>
                )}
              </View>
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
              .map((block, index) => renderContentBlock(block, index, post))}
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
                // 댓글 섹션으로 스크롤
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
            {
              id: 'report',
              title: '게시물 신고',
              icon: <ReportIcon size={20} color={colors.ERROR} />,
              color: colors.ERROR,
              onPress: () => {
                setMenuActionSheetVisible(false);
                setReportModalVisible(true);
              },
            },
          ]}
        />

        {/* Custom Alert Modal */}
        {alertModal && (
          <CustomAlertModal
            visible={alertModal.visible}
            title={alertModal.title}
            message={alertModal.message}
            buttons={alertModal.buttons}
            onClose={() => setAlertModal(null)}
          />
        )}

        {/* Image Viewer Modal */}
        <ImageViewerModal
          visible={isImageViewerVisible}
          mediaItems={mediaItems}
          initialIndex={imageViewerInitialIndex}
          title={post.title}
          onClose={() => setIsImageViewerVisible(false)}
        />

        {/* 신고 모달 */}
        <ReportModal
          visible={reportModalVisible}
          targetType={ReportTargetType.POST}
          targetId={postId}
          onSubmit={handleReportSubmit}
          onClose={() => setReportModalVisible(false)}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
  },
  commentInputWrapper: {
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
  },
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  metaSeparator: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    marginHorizontal: 2,
  },
  animalTypeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.SECONDARY || colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
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
  contentSection: {
    backgroundColor: colors.WHITE,
  },
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
    backgroundColor: colors.GRAY_200,
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
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.MD,
  },
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
  menuButton: {
    padding: SPACING.SM,
  },
});

// 비디오 컴포넌트용 스타일
const videoStyles = StyleSheet.create({
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
