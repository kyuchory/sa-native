import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, Image, Pressable, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { COLORS, BG_COLORS, SPACING, TYPOGRAPHY, TEXT_COLORS } from '../constants/theme';

import CommonHeader from '../components/CommonHeader';
import CommentList from '../components/CommentList';
import { CommentInput } from '../components/CommentInput';
import LoadingOverlay from '../components/LoadingOverlay';
import { FeedDetailResponse, CommentItem } from '../types/feed';

// 데이터 imports
import { mockFeedDetail } from '../data/feedDetailMockData';
import { mockComments } from '../data/commentMockData';

// 아이콘 imports
import { HeartIcon, CommentIcon, BookmarkIcon } from '../components/FeedCardIcons';

// 서비스 imports
import { FeedService } from '../services/feedService';

const { width: screenWidth } = Dimensions.get('window');

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
  const route = useRoute() as { params: { feedId: number } };
  const feedId = route.params?.feedId || 15;

  // expand/collapse 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);

  // 피드 데이터 및 상태 관리
  const [feed, setFeed] = useState<FeedDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 댓글 데이터 (임시로 mock 사용, 추후 API로 교체)
  const comments = mockComments;

  // 데이터 필터링 (feed가 null일 수 있음)
  const imageBlocks = feed ? feed.content_blocks.filter(block => block.type === 'image') : [];
  const textBlock = feed ? feed.content_blocks.find(block => block.type === 'text') : null;

  // API 호출
  useEffect(() => {
    const fetchFeedDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await FeedService.getFeed(feedId);
        console.log('API Response:', response);
        setFeed(response);
      } catch (err) {
        console.error('피드 상세 조회 실패:', err);
        setError('피드를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedDetail();
  }, [feedId]);

  // 이벤트 핸들러들
  const onFeedLikePress = () => {
    console.log('피드 좋아요 누름:', feedId);
    // TODO: 좋아요 API 호출
  };

  const onCommentLikePress = (commentId: number) => {
    console.log('댓글 좋아요 누름:', commentId);
    // TODO: 댓글 좋아요 API 호출
  };

  const onSendComment = (text: string) => {
    console.log('댓글 전송:', text);
    // TODO: 댓글 작성 API 호출
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
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* 프로필 정보 */}
          <TouchableOpacity style={styles.header} onPress={()=>{}} activeOpacity={0.7}>
            <Image source={{ uri: feed.user.profile_img }} style={styles.profileImage} />
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
              {imageBlocks.map((block, index) => (
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
                <HeartIcon filled={feed.is_liked} size={20} color={feed.is_liked ? COLORS.ERROR : TEXT_COLORS.SECONDARY} />
              </Pressable>
              <Text style={[styles.actionCount, feed.is_liked && { color: COLORS.ERROR }]}>
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
          onReplyPress={() => {
            // TODO: 답글 기능
          }}
          onEditComment={(commentId: number) => {
            // TODO: 댓글 수정
            console.log('댓글 수정:', commentId);
          }}
          onDeleteComment={(commentId: number) => {
            // TODO: 댓글 삭제
            console.log('댓글 삭제:', commentId);
          }}
        />
      </ScrollView>

      {/* 댓글 입력 */}
      <CommentInput
        onSendComment={onSendComment}
        placeholder="댓글을 작성해 보세요."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: COLORS.WHITE,
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
    color: TEXT_COLORS.PRIMARY,
  },
  location: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
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
    color: COLORS.WHITE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: COLORS.GRAY_200, // 임시 색상
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
    color: TEXT_COLORS.PRIMARY,
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
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    marginTop: SPACING.XS,
  },

  // 시간
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
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
    color: COLORS.ERROR || '#FF5722',
    textAlign: 'center',
  },
});
