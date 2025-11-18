import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import { ShortItem } from '../types/cut';
import { CutService } from '../services/cutService';
import { formatRelativeTime } from '../utils/timeUtils';
import UserAvatar from '../components/UserAvatar';

// Components
import {
  HeartIcon,
  CommentIcon,
  BookmarkIcon,
  ShareIcon,
  BackIcon,
  MoreVerticalIcon,
  UploadIcon,
  PlayIcon,
  PauseIcon,
<<<<<<< HEAD
  ChevronDownIcon,
  ChevronUpIcon,
=======
  CutEmptyIcon,
>>>>>>> 45dd923aae9551437caaad9230961f60593fd882
} from '../components/CutIcons';

// 실제 컷츠 API 사용

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

interface ShortItemProps {
  item: ShortItem; 
  isActive: boolean;
  onComment: (shortId: number) => void;
  onBookmark: (shortId: number) => void;
  onShare: (shortId: number) => void;
  onUpload: () => void;
}

// 컷츠 개별 아이템 컴포넌트
const ShortItemComponent: React.FC<ShortItemProps> = ({
  item,
  isActive,
  onComment,
  onBookmark,
  onShare,
  onUpload,
}) => {
  const videoUri = item.content_url; // 서버에서 이미 baseUrl 포함됨

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });

  // 오버레이 아이콘 상태 & 애니메이션
  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [overlayIsPlaying, setOverlayIsPlaying] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // 설명 접기/펼치기 상태
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  // 로컬 좋아요 상태 관리 (낙관적 UI 적용)
  const [isLiked, setIsLiked] = useState(item.is_liked || false);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // 로컬 북마크 상태 관리 (낙관적 UI 적용)
  const [isBookmarked, setIsBookmarked] = useState(item.is_bookmarked || false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // item prop이 변경될 때 상태 초기화
  useEffect(() => {
    setIsLiked(item.is_liked || false);
    setLikeCount(item.like_count);
  }, [item.is_liked, item.like_count]);

  useEffect(() => {
    setIsBookmarked(item.is_bookmarked || false);
  }, [item.is_bookmarked]);

  // 좋아요 토글 핸들러 (낙관적 UI 적용)
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
      const response = await CutService.toggleShortLike(item.id);

      // 서버 응답으로 최종 상태 동기화
      setIsLiked(response.data.is_liked);
      setLikeCount(response.data.like_count);

    } catch (error) {
      console.error('좋아요 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);

      // TODO: 에러 토스트 메시지 표시

    } finally {
      setIsLikeLoading(false);
    }
  };

  // 북마크 토글 핸들러 (낙관적 UI 적용)
  const handleBookmarkToggle = async () => {
    if (isBookmarkLoading) return; // 이미 요청 중이면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsBookmarked = isBookmarked;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setIsBookmarkLoading(true);

    try {
      // API 호출
      const response = await CutService.toggleShortBookmark(item.id);

      // 서버 응답으로 최종 상태 동기화
      setIsBookmarked(response.data.is_bookmarked);

    } catch (error) {
      console.error('북마크 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setIsBookmarked(originalIsBookmarked);

      // TODO: 에러 토스트 메시지 표시

    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const triggerOverlay = (isPlayingNow: boolean) => {
    setOverlayIsPlaying(isPlayingNow);
    setShowOverlayIcon(true);
    overlayOpacity.setValue(1);

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowOverlayIcon(false);
      }
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // isActive 변경될 때마다 재생/정지 컨트롤
  useEffect(() => {
    if (item.type !== 'video') return;

    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, item.type, player]);

  const handleTogglePlay = () => {
    if (item.type !== 'video') return;
    if (!isActive) return; // 현재 화면에 보이는 카드가 아닐 땐 재생 X

    if (player.playing) {
      player.pause();
      triggerOverlay(false); // ⏸ 아이콘
    } else {
      player.play();
      triggerOverlay(true); // ▶ 아이콘
    }
  };

  // 이미지 타입일 경우
  if (item.type === 'image') {
    return (
      <View style={styles.cutContainer}>
        <TouchableOpacity activeOpacity={0.8} style={styles.backgroundImage} onPress={handleTogglePlay}>
          {/* 썸네일 대신 곧바로 이미지 표시 */}
          <Image
            source={{ uri: videoUri }}
            style={styles.backgroundImage}
          />
        </TouchableOpacity>

        {/* 오른쪽 액션 버튼들 */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLikeToggle}
            activeOpacity={0.8}
            disabled={isLikeLoading}
          >
            <View style={styles.iconContainer}>
              {isLikeLoading ? (
                <ActivityIndicator size="small" color={COLORS.ERROR} />
              ) : (
                <HeartIcon
                  size={28}
                  color={isLiked ? COLORS.ERROR : COLORS.WHITE}
                  filled={isLiked}
                />
              )}
            </View>
            <Text style={[styles.actionText, isLikeLoading && styles.actionLoadingText]}>
              {formatCount(likeCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(item.id)}
            activeOpacity={0.8}
          >
            <CommentIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>{formatCount(item.comment_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBookmarkToggle}
            activeOpacity={0.8}
            disabled={isBookmarkLoading}
          >
            <View style={styles.iconContainer}>
              {isBookmarkLoading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <BookmarkIcon size={28} color={isBookmarked ? COLORS.PRIMARY : COLORS.WHITE} filled={isBookmarked} />
              )}
            </View>
            <Text style={[styles.actionText, isBookmarkLoading && styles.actionLoadingText]}>
              저장
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(item.id)}
            activeOpacity={0.8}
          >
            <ShareIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>{formatCount(item.view_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onUpload}
            activeOpacity={0.8}
          >
            <UploadIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>업로드</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 콘텐츠 오버레이 */}
        <View style={styles.bottomOverlay}>
          {/* 토글 버튼 */}
          <TouchableOpacity
            style={styles.expandToggleButton}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            activeOpacity={0.8}
          >
            {isDescriptionExpanded ? (
              <ChevronDownIcon size={40} color={COLORS.WHITE} />
            ) : (
              <ChevronUpIcon size={40} color={COLORS.WHITE} />
            )}
          </TouchableOpacity>

          <View style={styles.contentArea}>
            <View style={styles.userInfo}>
              <UserAvatar
                profileImg={item.profile_img}
                nickname={item.username}
                size={30}
              />
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
            </View>

            {isDescriptionExpanded && (
              <>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>

                <View style={styles.tagsContainer}>
                  {item.categories.map((category) => (
                    <Text key={category.id} style={styles.tag}>
                      #{category.name}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 비디오 타입일 경우
  return (
    <View style={styles.cutContainer}>
      {/* 실제 비디오 렌더링 (터치 X) */}
      <VideoView
        style={styles.backgroundImage}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />

      {/* 터치를 전담하는 투명 오버레이 + 아이콘 */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleTogglePlay}
      >
        <View style={StyleSheet.absoluteFill}>
          {showOverlayIcon && (
            <Animated.View
              style={[
                styles.playOverlayContainer,
                { opacity: overlayOpacity },
              ]}
            >
              <View style={styles.playOverlayIconWrapper}>
                {overlayIsPlaying ? (
                  <PlayIcon size={48} color={COLORS.WHITE} filled />
                ) : (
                  <PauseIcon size={48} color={COLORS.WHITE} filled />
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      {/* 오른쪽 액션 버튼들 */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikeToggle}
          activeOpacity={0.8}
          disabled={isLikeLoading}
        >
          <View style={styles.iconContainer}>
            {isLikeLoading ? (
              <ActivityIndicator size="small" color={COLORS.ERROR} />
            ) : (
              <HeartIcon
                size={28}
                color={isLiked ? COLORS.ERROR : COLORS.WHITE}
                filled={isLiked}
              />
            )}
          </View>
<Text style={[styles.actionText, isLikeLoading && styles.actionLoadingText]}>
              {formatCount(likeCount)}
            </Text>
        </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(item.id)}
            activeOpacity={0.8}
          >
            <CommentIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>{formatCount(item.comment_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBookmarkToggle}
            activeOpacity={0.8}
            disabled={isBookmarkLoading}
          >
            <View style={styles.iconContainer}>
              {isBookmarkLoading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <BookmarkIcon size={28} color={isBookmarked ? COLORS.PRIMARY : COLORS.WHITE} filled={isBookmarked} />
              )}
            </View>
            <Text style={[styles.actionText, isBookmarkLoading && styles.actionLoadingText]}>
              저장
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(item.id)}
            activeOpacity={0.8}
          >
            <ShareIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>{formatCount(item.view_count)}</Text>
          </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onUpload}
          activeOpacity={0.8}
        >
          <UploadIcon size={28} color={COLORS.WHITE} />
          <Text style={styles.actionText}>업로드</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 콘텐츠 오버레이 */}
      <View style={styles.bottomOverlay}>
        {/* 토글 버튼 */}
        <TouchableOpacity
          style={styles.expandToggleButton}
          onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          activeOpacity={0.8}
        >
          {isDescriptionExpanded ? (
            <ChevronDownIcon size={20} color={COLORS.WHITE} />
          ) : (
            <ChevronUpIcon size={20} color={COLORS.WHITE} />
          )}
        </TouchableOpacity>

        <View style={styles.contentArea}>
          <View style={styles.userInfo}>
            <UserAvatar
              profileImg={item.profile_img}
              nickname={item.username}
              size={30}
            />
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
          </View>

          {isDescriptionExpanded && (
            <>
              <View style={styles.descriptionContainer}>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.tagsContainer}>
                {item.categories.map((category) => (
                  <Text key={category.id} style={styles.tag}>
                    #{category.name}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const ShortItemComponentMemo = React.memo(ShortItemComponent);

export default function CutScreen() {
  const navigation = useNavigation<CutScreenNavigationProp>();
<<<<<<< HEAD
  const isFocused = useIsFocused();

  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const ITEM_HEIGHT = containerHeight ?? SCREEN_HEIGHT;

=======
  const { colors } = useThemeStore();
>>>>>>> 45dd923aae9551437caaad9230961f60593fd882
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const LIMIT = 4;
  const PREFETCH_OFFSET = 1; // 끝에서 1개 남았을 때 프리패칭

  // 초기 로딩
  const fetchInitial = async () => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const response = await CutService.getShortsFeed(undefined, LIMIT);
      setShorts(response.data.items);
      setNextCursor(response.data.next_cursor);
      setCurrentIndex(0);
    } catch (e) {
      console.error('컷츠 피드 초기 로딩 실패:', e);
      setError('컷츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 추가 페이지 불러오기
  const fetchMore = async () => {
    if (!nextCursor || isFetchingMore) return;

    try {
      setIsFetchingMore(true);

      const response = await CutService.getShortsFeed(nextCursor!, LIMIT);
      setShorts((prev) => [...prev, ...response.data.items]);
      setNextCursor(response.data.next_cursor);
    } catch (e) {
      console.warn('컷츠 추가 로딩 실패:', e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // 프리패칭 로직
  useEffect(() => {
    if (!nextCursor) return;
    if (isFetchingMore) return;
    if (shorts.length === 0) return;

    // 끝에서 1개 남았을 때 프리패칭
    if (currentIndex >= shorts.length - 1 - PREFETCH_OFFSET) {
      fetchMore();
    }
  }, [currentIndex, shorts.length, nextCursor, isFetchingMore]);

  // 초기 로딩
  useEffect(() => {
    fetchInitial();
  }, []);



  // 댓글 보기
<<<<<<< HEAD
  const handleComment = useCallback((shortId: number) => {
=======
  const handleComment = (shortId: number) => {
>>>>>>> 45dd923aae9551437caaad9230961f60593fd882
    Alert.alert('댓글', `컷츠 ${shortId}의 댓글을 보시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '보기', onPress: () => console.log('댓글 보기:', shortId) },
    ]);
  }, []);

  // 북마크 토글
  const handleBookmark = useCallback(async (shortId: number) => {
    try {
      const response = await CutService.toggleShortBookmark(shortId);
      console.log('북마크 상태 변경:', response.data.is_bookmarked);
      // TODO: UI 업데이트 또는 피드 새로고침
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
  }, []);

  // 공유하기
  const handleShare = useCallback((shortId: number) => {
    const short = shorts.find(s => s.id === shortId);
    Alert.alert('공유하기', '어디로 공유하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '카카오톡', onPress: () => console.log('카카오톡 공유:', shortId) },
      { text: '인스타그램', onPress: () => console.log('인스타그램 공유:', shortId) },
      { text: '링크 복사', onPress: () => console.log('링크 복사:', shortId, short?.content_url) },
    ]);
  }, [shorts]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 업로드 버튼 클릭
  const handleUpload = useCallback(() => {
    navigation.navigate('CutUploadSelect');
  }, [navigation]);

  // FlatList 뷰어빌리티 설정
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // 80% 이상 보일 때 액티브로 간주
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderShortItem = useCallback(
    ({ item, index }: { item: ShortItem; index: number }) => (
      <View style={{ height: ITEM_HEIGHT }}>
        <ShortItemComponentMemo
          item={item}
          isActive={isFocused && index === currentIndex}
          onComment={handleComment}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onUpload={handleUpload}
        />
      </View>
    ),
    [ITEM_HEIGHT, isFocused, currentIndex, handleComment, handleBookmark, handleShare, handleUpload]
  );

<<<<<<< HEAD
=======
  // 로딩 중
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>컷츠 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🎬</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInitial}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ 빈 상태 처리
  if (!isInitialLoading && shorts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.WHITE }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
            <BackIcon size={24} color={colors.GRAY_900} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.GRAY_900 }]}>Cuts</Text>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.8}>
            <MoreVerticalIcon size={32} color={colors.GRAY_900} />
          </TouchableOpacity>
        </View>

        {/* 빈 상태 뷰 */}
        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <CutEmptyIcon size={64} color={colors.GRAY_600} />
          <Text style={[styles.emptyTitle, { color: colors.GRAY_900 }]}>시청 가능한 컷츠가 없습니다</Text>
          <Text style={[styles.emptyMessage, { color: colors.GRAY_500 }]}>첫 번째 컷츠를 올려보세요!</Text>
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.PRIMARY }]} onPress={handleUpload}>
            <Text style={[styles.emptyButtonText, { color: colors.WHITE }]}>컷츠 제작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

>>>>>>> 45dd923aae9551437caaad9230961f60593fd882
  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { height } = e.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 투명 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
          <BackIcon size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuts</Text>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.8}>
          <MoreVerticalIcon size={32} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

<<<<<<< HEAD
      {/* 로딩 중 */}
      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>컷츠 불러오는 중...</Text>
        </View>
      ) : error ? (
        // 에러 상태
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🎬</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInitial}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // 정상 컷츠 리스트
        <FlatList
          ref={flatListRef}
          data={shorts}
          renderItem={renderShortItem}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.5}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.WHITE} />
                <Text style={styles.footerLoaderText}>더 많은 컷츠 불러오는 중...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            shorts.length === 0 && !isInitialLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎬</Text>
                <Text style={styles.emptyTitle}>시청 가능한 컷츠가 없습니다</Text>
                <Text style={styles.emptyMessage}>첫 번째 컷츠를 올려보세요!</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleUpload}>
                  <Text style={styles.emptyButtonText}>컷츠 제작하기</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
=======
      {/* 컷츠 리스트 */}
      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={renderShortItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.WHITE} />
              <Text style={styles.footerLoaderText}>더 많은 컷츠 불러오는 중...</Text>
            </View>
          ) : null
        }

      />
>>>>>>> 45dd923aae9551437caaad9230961f60593fd882
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
  
  // 헤더
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 44) + SPACING.SM, // 8px 추가
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 컷 컨테이너
  cutContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // 오른쪽 액션 버튼들
  rightActions: {
    position: 'absolute',
    right: SPACING.SM,  // MD에서 SM으로 변경해 더 오른쪽으로 붙임
    bottom: 200,
    alignItems: 'center',
    gap: SPACING.LG,
  },
  actionButton: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  actionText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionLoadingText: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    marginTop: SPACING.MD,
  },

  // 하단 오버레이
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD, // XL에서 MD로 줄임
    paddingBottom: SPACING.LG,
  },
  expandToggleButton: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    padding: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.XS, // 약간의 하단 패딩 추가
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS, // SM에서 XS로 줄임
    gap: SPACING.SM,
  },
  username: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  descriptionContainer: {
    marginBottom: SPACING.XS, // SM에서 XS로 줄임
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.XS,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  tag: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 로딩 상태
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.GRAY_600,
    borderTopColor: COLORS.PRIMARY,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 에러 상태
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.GRAY_800,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  errorText: {
    fontSize: 48,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  footerLoader: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    gap: SPACING.SM,
  },
  footerLoaderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.LG,
    paddingHorizontal: SPACING.XL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.MD,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  playOverlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlayIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlayIconText: {
    fontSize: 40,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});
