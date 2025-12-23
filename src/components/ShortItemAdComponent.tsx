import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Text, Dimensions } from 'react-native';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, NativeAdEventType } from 'react-native-google-mobile-ads';
import { PlayIcon, PauseIcon } from './CutIcons';
import { ShortActionButtons } from './ShortActionButtons';
import { ShortBottomAdOverlay } from './ShortBottomAdOverlay';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShortItemAdProps {
  nativeAd: NativeAd;
  onComment?: () => void;
  onShare?: () => void;
  onUpload?: () => void;
  extraBottomMargin?: number;
}

export const ShortItemAdComponent = React.memo<ShortItemAdProps>(({
  nativeAd,
  onComment,
  onShare,
  onUpload,
  extraBottomMargin,
}) => {
  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [overlayIsPlaying, setOverlayIsPlaying] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('숏츠 광고 카드 클릭됨');
    });

    return () => {
      clickListener.remove();
    };
  }, [nativeAd]);

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
  }, []);

  const handleTogglePlay = useCallback(() => {
    // 광고에서는 실제 재생 제어 대신 오버레이만 표시
    triggerOverlay(!overlayIsPlaying);
  }, [overlayIsPlaying, triggerOverlay]);

  const handleComment = useCallback(() => onComment?.(), [onComment]);
  const handleShare = useCallback(() => onShare?.(), [onShare]);
  const handleUpload = useCallback(() => onUpload?.(), [onUpload]);

  // 더미 데이터들 (실제로는 광고 데이터 사용)
  const dummyActionData = {
    isLiked: false,
    likeCount: 0,
    isLikeLoading: false,
    commentCount: 0,
    isBookmarked: false,
    isBookmarkLoading: false,
    viewCount: 0,
    onLike: () => {},
    onComment: handleComment,
    onBookmark: () => {},
    onShare: handleShare,
    onUpload: handleUpload,
    bottomInsets: extraBottomMargin,
  };

  // 광고용 더미 데이터들 (타임스탬프 대신 SPONSORED 정보 표시)
  const sponsoredInfo = [
    'SPONSORED',
    nativeAd.starRating ? `⭐ ${nativeAd.starRating.toFixed(1)}` : null,
    nativeAd.store || null,
  ].filter(Boolean).join(' • ');

  const dummyBottomData = {
    nickname: nativeAd.advertiser || '광고',
    profileImg: nativeAd.icon?.url || null,
    sponsoredInfo: sponsoredInfo, // SPONSORED 정보
    description: nativeAd.body || nativeAd.headline || '광고 콘텐츠',
    categories: [{ id: 1, name: 'SPONSORED' }],
    onProfilePress: () => {},
    bottomInsets: extraBottomMargin,
  };

  return (
    <View style={styles.container}>
      <NativeAdView 
        nativeAd={nativeAd} 
        style={[StyleSheet.absoluteFill, styles.adViewCenter]}
      >
        <NativeMediaView style={styles.media} />
      </NativeAdView>

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

      <ShortActionButtons {...dummyActionData} />

      <ShortBottomAdOverlay {...dummyBottomData} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: COLORS.BLACK,
  },
  adViewCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: screenWidth,
    aspectRatio: 1,
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

export default ShortItemAdComponent;