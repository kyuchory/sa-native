import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { ShortItem } from '../types/cut';
import { CutService } from '../services/cutService';
import { formatRelativeTime } from '../utils/timeUtils';
import UserAvatar from '../components/UserAvatar';

// Components
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BackIcon,
  MoreVerticalIcon,
  UploadIcon,
  PlayIcon,
  PauseIcon,
} from '../components/CutIcons';

// 실제 쇼츠 API 사용

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

interface ShortItemProps {
  item: ShortItem;
  isActive: boolean;
  onLike: (shortId: number) => void;
  onComment: (shortId: number) => void;
  onShare: (shortId: number) => void;
  onUpload: () => void;
}

// 쇼츠 개별 아이템 컴포넌트
const ShortItemComponent: React.FC<ShortItemProps> = ({
  item,
  isActive,
  onLike,
  onComment,
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
    if (item.type === 'video') {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, item.type]);

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
            onPress={() => onLike(item.id)}
            activeOpacity={0.8}
          >
            <HeartIcon
              size={28}
              color={item.is_liked ? COLORS.ERROR : COLORS.WHITE}
              filled={item.is_liked}
            />
            <Text style={styles.actionText}>{formatCount(item.like_count)}</Text>
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
            onPress={() => onShare(item.id)}
            activeOpacity={0.8}
          >
            <ShareIcon size={28} color={COLORS.WHITE} />
            <Text style={styles.actionText}>{formatCount(item.view_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileContainer} activeOpacity={0.8}>
            <UserAvatar
              profileImg={item.profile_img}
              nickname={item.username}
              size={60}
            />
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
          <View style={styles.contentArea}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
            </View>

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
        allowsFullscreen={false}
        allowsPictureInPicture={false}
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
          onPress={() => onLike(item.id)}
          activeOpacity={0.8}
        >
          <HeartIcon
            size={28}
            color={item.is_liked ? COLORS.ERROR : COLORS.WHITE}
            filled={item.is_liked}
          />
          <Text style={styles.actionText}>{formatCount(item.like_count)}</Text>
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
          onPress={() => onShare(item.id)}
          activeOpacity={0.8}
        >
          <ShareIcon size={28} color={COLORS.WHITE} />
          <Text style={styles.actionText}>{formatCount(item.view_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileContainer} activeOpacity={0.8}>
          <UserAvatar
            profileImg={item.profile_img}
            nickname={item.username}
            size={60}
          />
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
        <View style={styles.contentArea}>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
          </View>

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
        </View>
      </View>
    </View>
  );
};

export default function CutScreen() {
  const navigation = useNavigation<CutScreenNavigationProp>();
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
      console.error('쇼츠 피드 초기 로딩 실패:', e);
      setError('쇼츠를 불러오는 중 오류가 발생했습니다.');
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
      console.warn('쇼츠 추가 로딩 실패:', e);
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

  // 좋아요 토글
  const handleLike = async (shortId: number) => {
    try {
      const response = await CutService.toggleShortLike(shortId);
      setShorts(prev =>
        prev.map(short =>
          short.id === shortId
            ? {
                ...short,
                is_liked: response.data.is_liked,
                like_count: response.data.like_count,
              }
            : short
        )
      );
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 댓글 보기
  const handleComment = (shortId: number) => {
    Alert.alert('댓글', `쇼츠 ${shortId}의 댓글을 보시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '보기', onPress: () => console.log('댓글 보기:', shortId) },
    ]);
  };

  // 공유하기
  const handleShare = (shortId: number) => {
    const short = shorts.find(s => s.id === shortId);
    Alert.alert('공유하기', '어디로 공유하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '카카오톡', onPress: () => console.log('카카오톡 공유:', shortId) },
      { text: '인스타그램', onPress: () => console.log('인스타그램 공유:', shortId) },
      { text: '링크 복사', onPress: () => console.log('링크 복사:', shortId, short?.content_url) },
    ]);
  };

  // 뒤로가기
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 업로드 버튼 클릭
  const handleUpload = () => {
    navigation.navigate('CutUploadSelect');
  };

  // FlatList 뷰어빌리티 설정
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // 80% 이상 보일 때 액티브로 간주
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderShortItem = ({ item, index }: { item: ShortItem; index: number }) => (
    <View style={{ height: SCREEN_HEIGHT }}>
      <ShortItemComponent
        item={item}
        isActive={index === currentIndex}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onUpload={handleUpload}
      />
    </View>
  );

  // 로딩 중
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>쇼츠 불러오는 중...</Text>
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

  return (
    <View style={styles.container}>
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

      {/* 쇼츠 리스트 */}
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
              <Text style={styles.footerLoaderText}>더 많은 쇼츠 불러오는 중...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          shorts.length === 0 && !isInitialLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎬</Text>
              <Text style={styles.emptyTitle}>시청 가능한 쇼츠가 없습니다</Text>
              <Text style={styles.emptyMessage}>첫 번째 쇼츠를 올려보세요!</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleUpload}>
                <Text style={styles.emptyButtonText}>쇼츠 제작하기</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
    height: SCREEN_HEIGHT,
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
    right: SPACING.XS,  // MD에서 SM으로 변경해 더 오른쪽으로 붙임
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
  profileContainer: {
    marginTop: SPACING.MD,
  },

  // 하단 오버레이
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD, // XL에서 MD로 줄임
    paddingBottom: SPACING.LG,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.LG,
    paddingHorizontal: SPACING.XL,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.MD,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
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
