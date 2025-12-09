import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import useProfileStore from '../stores/profileStore';
import { CutService } from '../services/cutService';
import { ShortUploadResponse } from '../types/cut';
import LoadingOverlay from '../components/LoadingOverlay';
import CustomAlertModal from '../components/CustomAlertModal';
import {
  UploadIcon,
} from '../components/CutIcons';

// Import components
import {
  ShortActionButtons,
} from '../components/ShortActionButtons';
import {
  ShortBottomOverlay,
} from '../components/ShortBottomOverlay';

// Import icons
import {
  BackIcon,
  MoreVerticalIcon,
  PlayIcon,
  PauseIcon,
} from '../components/CutIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutPreviewRouteProp = RouteProp<AuthStackParamList, 'CutPreview'>;
type CutPreviewScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function CutPreviewScreen({ route }: { route: CutPreviewRouteProp }) {
  const { colors } = useThemeStore();
  const navigation = useNavigation<CutPreviewScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    videoUri,
    trimStart,
    trimEnd,
    cropArea,
    thumbnailUri,
    description,
    selectedCategories,
  } = route.params;

  const [isUploading, setIsUploading] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const ITEM_HEIGHT = containerHeight ?? SCREEN_HEIGHT;

  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [overlayIsPlaying, setOverlayIsPlaying] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const tooltipAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const triggerOverlay = useCallback((isPlayingNow: boolean) => {
    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.stop();
    }

    setOverlayIsPlaying(isPlayingNow);
    setShowOverlayIcon(true);
    overlayOpacity.setValue(1);

    overlayAnimationRef.current = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    });

    overlayAnimationRef.current.start(({ finished }) => {
      if (finished) setShowOverlayIcon(false);
    });
  }, [overlayOpacity]);

  const handleTogglePlay = useCallback(() => {
    // Mock toggle for preview
    triggerOverlay(!overlayIsPlaying);
    setOverlayIsPlaying(!overlayIsPlaying);
  }, [triggerOverlay, overlayIsPlaying]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpload = useCallback(async () => {
    // validation
    if (selectedCategories.length === 0) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '최소 1개의 카테고리를 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    if (description.trim().length > 300) {
      setAlertModal({
        visible: true,
        title: '오류',
        message: '설명은 300자 이내로 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    try {
      setIsUploading(true);

      const uploadData = {
        file: { uri: videoUri, type: 'video/mp4', name: `cut_${Date.now()}.mp4` },
        type: 'video' as const,
        category_ids: selectedCategories.map(cat => cat.id),
        description: description.trim(),
        trimStart,
        trimEnd,
        cropArea,
      };

      // 최종 업로드 데이터 로그 출력
      console.log('🚀 컷츠 업로드 FormData 최종 데이터:', uploadData);

      // 실제 업로드 호출 (현재 API 없으므로 목데이터 응답)
      const response: ShortUploadResponse = await CutService.uploadShorts(uploadData);

      setAlertModal({
        visible: true,
        title: '성공',
        message: '컷츠가 성공적으로 업로드되었습니다!',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            // 프로필 쇼츠 목록 갱신을 위한 플래그 설정
            useProfileStore.getState().setShouldRefreshProfileShorts(true);
            // 새로 업로드된 컷츠 상세 조회로 이동
            (navigation as any).replace('CutDetail', { shortId: response.id });
          }
        }]
      });
    } catch (error: any) {
      console.error('업로드 실패:', error);
      setAlertModal({
        visible: true,
        title: '업로드 실패',
        message: error.message || '컷츠 업로드에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsUploading(false);
    }
  }, [videoUri, trimStart, trimEnd, cropArea, description, selectedCategories, navigation]);

  // Mock handlers for preview
  const handleLike = useCallback(() => {}, []);
  const handleComment = useCallback(() => {}, []);
  const handleBookmark = useCallback(() => {}, []);
  const handleShare = useCallback(() => {}, []);

  // 말풍선 애니메이션 실행 (반복)
  useEffect(() => {
    const tooltipAnimation = () => {
      // 먼저 기존 애니메이션 정리
      if (tooltipAnimationRef.current) {
        tooltipAnimationRef.current.stop();
      }

      // fade in (0.5초 후)
      const fadeInTimeout = setTimeout(() => {
        tooltipAnimationRef.current = Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        });

        tooltipAnimationRef.current.start(() => {
          // 3초 유지 후 fade out
          const fadeOutTimeout = setTimeout(() => {
            tooltipAnimationRef.current = Animated.timing(tooltipOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            });
            tooltipAnimationRef.current?.start(() => {
              // fade out이 끝나면 다시 애니메이션 시작 (반복)
              tooltipAnimation();
            });
          }, 3000);

          return () => clearTimeout(fadeOutTimeout);
        });
      }, 500);

      return () => clearTimeout(fadeInTimeout);
    };

    tooltipAnimation();

    // cleanup
    return () => {
      if (tooltipAnimationRef.current) {
        tooltipAnimationRef.current.stop();
      }
    };
  }, []);

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { height } = e.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header - identical to CutScreen */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
          <BackIcon size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.WHITE }]}>미리보기</Text>
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={isUploading} activeOpacity={0.8}>
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.WHITE} />
            ) : (
              <Text style={styles.uploadButtonText}>업로드</Text>
            )}
          </TouchableOpacity>
          {/* 말풍선 툴팁 */}
          <Animated.View style={[styles.tooltipContainer, { opacity: tooltipOpacity }]}>
            <View style={styles.tooltipArrow} />
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>이곳을 터치하여 컷츠를 업로드하세요!</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      <View style={{ height: ITEM_HEIGHT }}>
        <View style={styles.previewContainer}>
          {/* Image background */}
          {thumbnailUri && (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.media}
              resizeMode="cover"
            />
          )}

          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleTogglePlay}
          >
            {showOverlayIcon && (
              <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <View style={styles.overlayIcon}>
                  {overlayIsPlaying ? (
                    <PlayIcon size={48} color={COLORS.WHITE} filled />
                  ) : (
                    <PauseIcon size={48} color={COLORS.WHITE} filled />
                  )}
                </View>
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Right side action buttons */}
          <ShortActionButtons
            isLiked={false}
            likeCount={123}
            isLikeLoading={false}
            commentCount={45}
            isBookmarked={false}
            isBookmarkLoading={false}
            viewCount={456}
            onLike={handleLike}
            onComment={handleComment}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onUpload={handleUpload}
            bottomInsets={insets.bottom}
          />

          {/* Bottom overlay */}
          <ShortBottomOverlay
            username="@preview_user"
            profileImg={null}
            createdAt={new Date().toISOString()}
            description={description}
            categories={selectedCategories}
            onProfilePress={() => {}}
            bottomInsets={insets.bottom}
          />
        </View>
      </View>

      <LoadingOverlay
        visible={isUploading}
        message="컷츠를 업로드 중입니다..."
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 44) + SPACING.SM,
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
  uploadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  uploadSection: {
    alignItems: 'center',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 45,
    right: 0,
    zIndex: 20,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    right: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SMD,
    minWidth: 200,
  },
  tooltipText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    textAlign: 'center',
  },

  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: COLORS.BLACK,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  overlayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
