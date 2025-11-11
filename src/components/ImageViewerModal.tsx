import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaveIcon, ShareIcon } from './CommonIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  title = '이미지 뷰어',
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // React state for page indicator
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 이미지 위치 및 스케일
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // 페이지 스크롤
  const pageTranslateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  const savedPageTranslateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  
  // 모달 닫기 애니메이션
  const modalOpacity = useSharedValue(1);
  const modalScale = useSharedValue(1);

  // 핀치 제스처 focal point
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // 페이지 변경 콜백
  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleClose = useCallback(() => {
    'worklet';
    scheduleOnRN(onClose);
  }, [onClose]);

  const resetImagePosition = useCallback(() => {
    'worklet';
    scale.value = withTiming(1, { duration: 300 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const closeModal = useCallback(() => {
    'worklet';
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.9, { duration: 200 }, (finished) => {
      if (finished) {
        handleClose();
      }
    });
  }, [handleClose]);

  // 더블 탭 제스처
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((event) => {
      if (scale.value > 1.5) {
        // 축소 - 원본으로
        resetImagePosition();
      } else {
        // 확대
        const tapX = event.x - SCREEN_WIDTH / 2;
        const tapY = event.y - SCREEN_HEIGHT / 2;

        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 300 });
        savedScale.value = DOUBLE_TAP_SCALE;

        translateX.value = withTiming(-tapX * (DOUBLE_TAP_SCALE - 1), { duration: 300 });
        translateY.value = withTiming(-tapY * (DOUBLE_TAP_SCALE - 1), { duration: 300 });
        savedTranslateX.value = -tapX * (DOUBLE_TAP_SCALE - 1);
        savedTranslateY.value = -tapY * (DOUBLE_TAP_SCALE - 1);
      }
    });

  // 핀치 제스처
  const pinch = Gesture.Pinch()
    .onBegin((event) => {
      focalX.value = event.focalX - SCREEN_WIDTH / 2;
      focalY.value = event.focalY - SCREEN_HEIGHT / 2;
    })
    .onUpdate((event) => {
      const newScale = Math.max(MIN_SCALE, Math.min(savedScale.value * event.scale, MAX_SCALE));
      scale.value = newScale;
      
      if (newScale > MIN_SCALE) {
        const deltaScale = newScale - savedScale.value;
        translateX.value = savedTranslateX.value - focalX.value * deltaScale;
        translateY.value = savedTranslateY.value - focalY.value * deltaScale;
      } else {
        translateX.value = 0;
        translateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      if (scale.value < MIN_SCALE + 0.1) {
        resetImagePosition();
      } else if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE, { duration: 300 });
        savedScale.value = MAX_SCALE;
      }
    });

  // 팬 제스처 (확대 시 이미지 이동)
  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .onUpdate((event) => {
      const maxTransX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTransY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      translateX.value = Math.max(
        -maxTransX,
        Math.min(maxTransX, savedTranslateX.value + event.translationX)
      );
      translateY.value = Math.max(
        -maxTransY,
        Math.min(maxTransY, savedTranslateY.value + event.translationY)
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // 모달 닫기 제스처 (축소 시 세로 드래그)
  const closePan = Gesture.Pan()
    .enabled(!isZoomed)
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onUpdate((event) => {
      translateY.value = event.translationY;
      const progress = Math.min(Math.abs(event.translationY) / 200, 1);
      modalOpacity.value = 1 - progress * 0.5;
      modalScale.value = 1 - progress * 0.1;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationY) > 150 || Math.abs(event.velocityY) > 1000) {
        closeModal();
      } else {
        translateY.value = withTiming(0, { duration: 300 });
        modalOpacity.value = withTiming(1, { duration: 300 });
        modalScale.value = withTiming(1, { duration: 300 });
      }
    });

  // 페이지 스와이프 (원본 크기일 때만)
  const pageSwipe = Gesture.Pan()
    .enabled(!isZoomed)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      const newTranslate = savedPageTranslateX.value + event.translationX;
      const minTranslate = -(images.length - 1) * SCREEN_WIDTH;
      pageTranslateX.value = Math.max(minTranslate, Math.min(0, newTranslate));
    })
    .onEnd((event) => {
      const currentIdx = Math.round(-savedPageTranslateX.value / SCREEN_WIDTH);
      let nextIdx = currentIdx;

      // 속도 기반 페이지 전환
      if (event.velocityX < -800 && currentIdx < images.length - 1) {
        nextIdx = currentIdx + 1;
      } else if (event.velocityX > 800 && currentIdx > 0) {
        nextIdx = currentIdx - 1;
      } else {
        // 이동 거리 기반
        const threshold = SCREEN_WIDTH * 0.3;
        if (event.translationX < -threshold && currentIdx < images.length - 1) {
          nextIdx = currentIdx + 1;
        } else if (event.translationX > threshold && currentIdx > 0) {
          nextIdx = currentIdx - 1;
        }
      }

      const targetTranslate = -nextIdx * SCREEN_WIDTH;
      pageTranslateX.value = withTiming(targetTranslate, { duration: 300 });
      savedPageTranslateX.value = targetTranslate;

      if (nextIdx !== currentIdx) {
        scheduleOnRN(updateCurrentPage, nextIdx);
        resetImagePosition();
      }
    });

  // 제스처 조합
  const composed = Gesture.Simultaneous(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
    pageSwipe,
    closePan
  );

  // 애니메이션 스타일
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageTranslateX.value }],
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  // 확대 상태 감시 및 React state 동기화
  useAnimatedReaction(
    () => scale.value > 1.05,
    (result) => {
      if (result !== isZoomed) {
        scheduleOnRN(setIsZoomed, result);
      }
    },
    [isZoomed]
  );

  // 이미지 저장 함수
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const imageUri = images[currentPage];
    if (!imageUri) return;

    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('갤러리 저장 권한이 필요합니다.');
        return;
      }

      let localUri = imageUri;
      if (imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
        const file = new File(Paths.cache, filename);
        await File.downloadFileAsync(imageUri, file);
        localUri = file.uri;
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);

      if (Platform.OS === 'android') {
        const album = await MediaLibrary.getAlbumAsync('Download');
        if (album == null) {
          await MediaLibrary.createAlbumAsync('Download', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }

      alert('이미지가 갤러리에 저장되었습니다.');
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [images, currentPage, isSaving]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      setCurrentPage(initialIndex);
      setIsZoomed(false); // 초기화 시 확대 상태 false로 설정

      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;

      pageTranslateX.value = -initialIndex * SCREEN_WIDTH;
      savedPageTranslateX.value = -initialIndex * SCREEN_WIDTH;

      modalOpacity.value = 1;
      modalScale.value = 1;
    }
  }, [visible, initialIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          
          {/* 배경 */}
          <Animated.View style={[styles.background, modalStyle]} />

          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 이미지 영역 */}
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageScrollContainer, pageStyle]}>
              {images.map((uri, index) => (
                <Animated.View
                  key={`image-${index}`}
                  style={[
                    styles.imageWrapper,
                    currentPage === index && imageStyle,
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={styles.image}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </Animated.View>
              ))}
            </Animated.View>
          </GestureDetector>

          {/* 하단 메뉴 */}
          <View style={[styles.bottomMenu, { marginBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={handleSave}>
              <SaveIcon size={24} color="#fff" />
              <Text style={styles.menuText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
              <ShareIcon size={24} color="#fff" />
              <Text style={styles.menuText}>공유</Text>
            </TouchableOpacity>
          </View>

          {/* 페이지 인디케이터 */}
          {images.length > 1 && (
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {currentPage + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  imageScrollContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    zIndex: 5,
  },
  pageIndicatorText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
});
