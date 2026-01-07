import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { NativeAd, NativeAdView, NativeMediaView, NativeAdEventType, NativeAsset, NativeAssetType } from 'react-native-google-mobile-ads';

import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ShortItemAdProps {
  nativeAd: NativeAd;
}

export const ShortItemAdComponent = React.memo<ShortItemAdProps>(({
  nativeAd,
}) => {
  useEffect(() => {
    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('숏츠 광고 카드 클릭됨');
    });

    return () => {
      clickListener.remove();
    };
  }, [nativeAd]);

  return (
    <View style={styles.container}>
      <NativeAdView
        nativeAd={nativeAd}
        style={styles.adView}
      >
        {/* 상단: 미디어 영역 */}
        <View style={styles.mediaContainer}>
          <NativeMediaView style={styles.media} />
        </View>

        {/* 하단: 광고 콘텐츠 오버레이 (ShortBottomOverlay처럼) */}
        <View style={styles.bottomOverlay}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {nativeAd.icon ? (
                <NativeAsset assetType={NativeAssetType.ICON}>
                  <Image
                    source={{ uri: nativeAd.icon.url }}
                    style={styles.profileImage}
                  />
                </NativeAsset>
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Text style={styles.profileImageText}>광</Text>
                </View>
              )}
            </View>

            <View style={styles.textSection}>
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.nickname}>
                  {nativeAd.advertiser || '광고'}
                </Text>
              </NativeAsset>
              <Text style={styles.sponsoredText}>SPONSORED</Text>
            </View>
          </View>

          {/* 설명 섹션 */}
          <View style={styles.descriptionSection}>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={styles.title} numberOfLines={2}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>

            {nativeAd.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text style={styles.description} numberOfLines={3}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>
            )}

            {/* CTA 버튼 */}
            {(nativeAd.callToAction || nativeAd.price) && (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View style={styles.ctaContainer}>
                  <Text style={styles.ctaText}>
                    {nativeAd.callToAction || '자세히 보기'}
                    {nativeAd.price && ` • ${nativeAd.price}`}
                  </Text>
                </View>
              </NativeAsset>
            )}
          </View>
        </View>
      </NativeAdView>
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
  adView: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: screenWidth,
    aspectRatio: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.SMD,
    paddingTop: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 25,
    marginBottom: SPACING.SM,
    marginHorizontal: SPACING.SM,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  profileImageContainer: {
    marginRight: SPACING.SM,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
  },
  textSection: {
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  sponsoredText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  descriptionSection: {
    marginBottom: SPACING.MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  ctaContainer: {
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
});

export default ShortItemAdComponent;
