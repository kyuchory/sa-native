import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TEXT_COLORS, BG_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { PostDetail, PostDetailContentBlock, PostTag, ItemSnapshot } from '../types/post';

// Components
import CommonHeader from '../components/CommonHeader';
import LoadingOverlay from '../components/LoadingOverlay';

// Services
import { PostService } from '../services/postService';

// SVG Icons import
import { LikeIcon, CommentIcon, BookmarkIcon } from '../components/PostIcons';
// Comment component import
import CommentList from '../components/CommentList';
// Comment mock data import
import { MOCK_COMMENTS, MOCK_ITEM_COMMENTS } from '../data/commentMockData';
import { Comment } from '../types/post';

type PostDetailRouteProp = RouteProp<AuthStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<PostDetailNavigationProp>();
  
  const { postId } = route.params;
  
  // 상태 관리
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  // 컴포넌트 마운트 시 게시물 데이터 로드
  useEffect(() => {
    loadPostDetail();
  }, [postId]);

  // 게시물 상세 정보 로드
  const loadPostDetail = async () => {
    try {
      setIsLoading(true);
      const postData = await PostService.getPostDetail(postId);
      setPost(postData);
      setIsLiked(postData.is_liked || false);
      setIsBookmarked(postData.is_bookmarked || false);
      setLikeCount(postData.like_count);
      
      // Mock 댓글 데이터 로드 (postId에 따라 다른 댓글)
      const mockComments = postId === 2 ? MOCK_ITEM_COMMENTS : MOCK_COMMENTS;
      setComments(mockComments);
    } catch (error) {
      Alert.alert('오류', '게시물을 불러오는데 실패했습니다.');
      console.error('게시물 상세 조회 실패:', error);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // 좋아요 토글
  const handleLikeToggle = () => {
    setIsLiked(prev => {
      const newLiked = !prev;
      setLikeCount(count => newLiked ? count + 1 : count - 1);
      return newLiked;
    });
    // TODO: API 호출
  };

  // 북마크 토글
  const handleBookmarkToggle = () => {
    setIsBookmarked(prev => !prev);
    // TODO: API 호출
  };

  // 댓글 좋아요 토글
  const handleCommentLike = (commentId: number) => {
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
  };

  // 답글 작성 (임시)
  const handleReplyPress = (comment: Comment) => {
    Alert.alert('답글', `${comment.user.nickname}님에게 답글을 작성합니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '작성', onPress: () => console.log('답글 작성:', comment.id) }
    ]);
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

  // 프로필 이미지 렌더링
  const renderProfileImage = () => {
    if (post?.user.profile_img) {
      return (
        <Image 
          source={{ uri: post.user.profile_img }} 
          style={styles.profileImage}
        />
      );
    }
    return (
      <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
        <Text style={styles.profileImageText}>
          {post?.user.nickname.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
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
          <View key={index} style={styles.imageBlock}>
            <Image 
              source={{ uri: block.value }} 
              style={styles.contentImage}
              resizeMode="cover"
            />
          </View>
        );
      case 'video':
        return (
          <View key={index} style={styles.videoBlock}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>🎥 동영상</Text>
              <Text style={styles.videoUrl}>{block.value}</Text>
            </View>
          </View>
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

  // 아이템 스냅샷 렌더링
  const renderItemSnapshots = (snapshots?: ItemSnapshot[]) => {
    if (!snapshots || snapshots.length === 0) return null;

    return (
      <View style={styles.itemSnapshotsContainer}>
        <Text style={styles.sectionTitle}>🎮 아이템 정보</Text>
        {snapshots.map((snapshot) => (
          <View key={snapshot.preset_no} style={styles.snapshotContainer}>
            <Text style={styles.snapshotTitle}>프리셋 {snapshot.preset_no}</Text>
            {snapshot.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemSlot}>{item.item_slot}</Text>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                </View>
                <View style={styles.itemOptions}>
                  {Object.entries(item.option_json).map(([key, value]) => (
                    <Text key={key} style={styles.itemOption}>
                      {key}: {value}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="게시물" />
        <LoadingOverlay visible={true} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="게시물" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <CommonHeader title="게시물" />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 작성자 정보 */}
        <View style={styles.authorSection}>
          <View style={styles.authorInfo}>
            {renderProfileImage()}
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{post.user.nickname}</Text>
              <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
            </View>
          </View>
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

        {/* 아이템 스냅샷 (아이템 스타일 게시물인 경우) */}
        {renderItemSnapshots(post.item_snapshots)}

        {/* 태그 */}
        {renderTags(post.tags)}

        {/* 통계 - 작은 버튼들을 왼쪽에 배치 */}
        <View style={styles.compactStatsSection}>
          <TouchableOpacity 
            style={styles.compactStatButton}
            onPress={handleLikeToggle}
            activeOpacity={0.7}
          >
            <LikeIcon 
              size={16} 
              filled={isLiked}
              color={isLiked ? COLORS.ERROR : COLORS.GRAY_500}
            />
            <Text style={[styles.compactStatText, isLiked && styles.likedText]}>
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
              size={16} 
              color={COLORS.GRAY_500}
            />
            <Text style={styles.compactStatText}>{comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactStatButton}
            onPress={handleBookmarkToggle}
            activeOpacity={0.7}
          >
            <BookmarkIcon 
              size={16} 
              filled={isBookmarked}
              color={isBookmarked ? COLORS.PRIMARY : COLORS.GRAY_500}
            />
            <Text style={[styles.compactStatText, isBookmarked && styles.bookmarkedText]}>
              {post.bookmark_count}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 목록 */}
        <CommentList 
          comments={comments}
          onCommentLike={handleCommentLike}
          onReplyPress={handleReplyPress}
        />

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.PRIMARY,
  },
  content: {
    flex: 1,
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
    color: TEXT_COLORS.SECONDARY,
    textAlign: 'center',
  },

  // 작성자 섹션
  authorSection: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  profileImagePlaceholder: {
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  postTime: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
  },
  categoryInfo: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 제목 섹션
  titleSection: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 28,
  },

  // 콘텐츠 섹션
  contentSection: {
    backgroundColor: COLORS.WHITE,
  },
  
  // 콘텐츠 블록
  textBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 24,
  },
  imageBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  contentImage: {
    width: '100%',
    height: 250,
    borderRadius: BORDER_RADIUS.MD,
  },
  videoBlock: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  videoPlaceholder: {
    backgroundColor: COLORS.GRAY_100,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  videoPlaceholderText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    marginBottom: SPACING.SM,
  },
  videoUrl: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
  },

  // 아이템 스냅샷
  itemSnapshotsContainer: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: TEXT_COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  snapshotContainer: {
    marginBottom: SPACING.MD,
  },
  snapshotTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  itemContainer: {
    backgroundColor: COLORS.GRAY_50,
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.SM,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  itemSlot: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  itemName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.PRIMARY,
  },
  itemOptions: {
    gap: SPACING.XS,
  },
  itemOption: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
  },

  // 태그
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    gap: SPACING.SM,
  },
  tag: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  tagText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 컴팩트한 통계 섹션
  compactStatsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
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
  compactStatText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  likedText: {
    color: COLORS.ERROR,
  },
  bookmarkedText: {
    color: COLORS.PRIMARY,
  },

  // 하단 여백
  bottomSpacing: {
    height: SPACING.XL,
    backgroundColor: BG_COLORS.SECONDARY,
  },
});
