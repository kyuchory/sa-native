import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { Cut } from '../types/cut';
import UserAvatar from '../components/UserAvatar';

// Components
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BackIcon,
  MoreVerticalIcon,
  UploadIcon,
} from '../components/CutIcons';

// Mock Data
import { MOCK_CUTS } from '../data/cutMockData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

interface CutItemProps {
  cut: Cut;
  isActive: boolean;
  onLike: (cutId: number) => void;
  onComment: (cutId: number) => void;
  onShare: (cutId: number) => void;
  onUpload: () => void;
  onToggleDescription: (cutId: number) => void;
  isDescriptionExpanded: boolean;
  tabBarHeight: number;
}

// 개별 컷 아이템 컴포넌트
const CutItem: React.FC<CutItemProps> = ({
  cut,
  isActive,
  onLike,
  onComment,
  onShare,
  onUpload,
  onToggleDescription,
  isDescriptionExpanded,
  tabBarHeight,
}) => {
  const descriptionAnimation = useRef(new Animated.Value(0)).current;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    Animated.timing(descriptionAnimation, {
      toValue: isDescriptionExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDescriptionExpanded, descriptionAnimation]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };


  return (
    <View style={styles.cutContainer}>
      {/* 배경 이미지 */}
      <Image 
        source={{ uri: cut.image_url }} 
        style={styles.backgroundImage}
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
      
      {/* 로딩 인디케이터 */}
      {imageLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      )}
      
      {/* 에러 플레이스홀더 */}
      {imageError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🎬</Text>
          <Text style={styles.errorMessage}>이미지를 불러올 수 없습니다</Text>
        </View>
      )}
      
      {/* 오른쪽 액션 버튼들 */}
      <View style={styles.rightActions}>
        {/* 좋아요 */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(cut.id)}
          activeOpacity={0.8}
        >
          <HeartIcon
            size={28}
            color={cut.is_liked ? COLORS.ERROR : COLORS.WHITE}
            filled={cut.is_liked}
          />
          <Text style={styles.actionText}>{formatCount(cut.like_count)}</Text>
        </TouchableOpacity>

        {/* 댓글 */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(cut.id)}
          activeOpacity={0.8}
        >
          <CommentIcon size={28} color={COLORS.WHITE} />
          <Text style={styles.actionText}>{formatCount(cut.comment_count)}</Text>
        </TouchableOpacity>

        {/* 공유 */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(cut.id)}
          activeOpacity={0.8}
        >
          <ShareIcon size={28} color={COLORS.WHITE} />
          <Text style={styles.actionText}>{formatCount(cut.share_count)}</Text>
        </TouchableOpacity>

        {/* 프로필 */}
        <TouchableOpacity style={styles.profileContainer} activeOpacity={0.8}>
          <UserAvatar
            profileImg={cut.user.profile_img}
            nickname={cut.user.nickname}
            size={60}
          />
        </TouchableOpacity>

        {/* 업로드 */}
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
              <Animated.View
          style={[
            styles.bottomOverlay,
            {
              bottom: tabBarHeight, // 탭바 높이만큼 위로 올림
              height: descriptionAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [140, 220], // 높이를 줄임
              }),
            },
          ]}
        >
        <TouchableWithoutFeedback onPress={() => onToggleDescription(cut.id)}>
          <View style={styles.contentArea}>
            {/* 사용자 정보 */}
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{cut.user.nickname}</Text>
              <Text style={styles.timeText}>{formatTime(cut.created_at)}</Text>
            </View>

            {/* 설명 */}
            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                numberOfLines={isDescriptionExpanded ? undefined : 2}
              >
                {cut.description}
              </Text>
              {!isDescriptionExpanded && cut.description.length > 100 && (
                <Text style={styles.moreText}>더보기</Text>
              )}
            </View>

            {/* 태그 */}
            {cut.tags && cut.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {cut.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

export default function CutScreen() {
  const navigation = useNavigation<CutScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cuts, setCuts] = useState<Cut[]>(MOCK_CUTS);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // 탭바 높이 계산 (iOS: 49 + safeArea, Android: 56)
  const tabBarHeight = Platform.OS === 'ios' ? 49 + insets.bottom : 56;

  // 좋아요 토글
  const handleLike = (cutId: number) => {
    setCuts(prev =>
      prev.map(cut =>
        cut.id === cutId
          ? {
              ...cut,
              is_liked: !cut.is_liked,
              like_count: cut.is_liked ? cut.like_count - 1 : cut.like_count + 1,
            }
          : cut
      )
    );
  };

  // 댓글 보기
  const handleComment = (cutId: number) => {
    Alert.alert('댓글', `컷 ${cutId}의 댓글을 보시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '보기', onPress: () => console.log('댓글 보기:', cutId) },
    ]);
  };

  // 공유하기
  const handleShare = (cutId: number) => {
    Alert.alert('공유하기', '어디로 공유하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '카카오톡', onPress: () => console.log('카카오톡 공유:', cutId) },
      { text: '인스타그램', onPress: () => console.log('인스타그램 공유:', cutId) },
      { text: '링크 복사', onPress: () => console.log('링크 복사:', cutId) },
    ]);
  };

  // 설명 토글
  const handleToggleDescription = (cutId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cutId)) {
        newSet.delete(cutId);
      } else {
        newSet.add(cutId);
      }
      return newSet;
    });
  };

  // 뒤로가기
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 업로드 버튼 클릭
  const handleUpload = () => {
    navigation.navigate('CutUploadSelect');
  };

  // 스크롤 이벤트 처리
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCutItem = ({ item, index }: { item: Cut; index: number }) => (
    <View style={{ height: SCREEN_HEIGHT }}>
      <CutItem
        cut={item}
        isActive={index === currentIndex}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onUpload={handleUpload}
        onToggleDescription={handleToggleDescription}
        isDescriptionExpanded={expandedDescriptions.has(item.id)}
        tabBarHeight={tabBarHeight}
      />
    </View>
  );

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

      {/* 컷 리스트 */}
      <FlatList
        ref={flatListRef}
        data={cuts}
        renderItem={renderCutItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
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
});
