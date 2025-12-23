import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { TYPOGRAPHY, SPACING, COLORS } from '../constants/theme';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, NativeAdEventType } from 'react-native-google-mobile-ads';
import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';
import { MenuIcon } from './CommonIcons';
import { useThemeStore } from '../stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

interface FeedAdCardProps {
  nativeAd: NativeAd;
  onPress?: () => void;
}

const FeedAdCard = ({ nativeAd, onPress }: FeedAdCardProps) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  useEffect(() => {
    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('피드 광고 카드 클릭됨');
    });

    return () => {
      clickListener.remove();
    };
  }, [nativeAd]);

  return (
    <View style={styles.container}>
      <NativeAdView nativeAd={nativeAd}>
        {/* 헤더: 광고주 정보 (FeedCard와 동일한 레이아웃) */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} activeOpacity={0.7} disabled>
            <View style={styles.userAvatar}>
              {nativeAd.icon ? (
                <NativeAsset assetType={NativeAssetType.ICON}>
                  <Image
                    source={{ uri: nativeAd.icon.url }}
                    style={styles.avatarImage}
                  />
                </NativeAsset>
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>광</Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>
                {nativeAd.advertiser || '광고'}
              </Text>
              <View style={styles.adMetaInfo}>
                <Text style={styles.sponsoredText}>SPONSORED</Text>
                {nativeAd.starRating && (
                  <Text style={styles.ratingText}>⭐ {nativeAd.starRating.toFixed(1)}</Text>
                )}
                {nativeAd.store && (
                  <Text style={styles.storeText}>{nativeAd.store}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} disabled>
            <MenuIcon size={20} color={colors.GRAY_700} />
          </TouchableOpacity>
        </View>

        {/* 미디어 콘텐츠 */}
        <TouchableOpacity style={styles.imageContainer} activeOpacity={0.9}>
          <NativeMediaView style={styles.mainImage} />
        </TouchableOpacity>

        {/* 액션 버튼들 (FeedCard와 동일) */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} disabled>
              <HeartIcon filled={false} size={20} color={colors.GRAY_600} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} disabled>
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} disabled>
              <CommentIcon size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} disabled>
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton} disabled>
              <BookmarkIcon filled={false} size={20} color={colors.GRAY_600} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} disabled>
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 텍스트 콘텐츠 */}
        <View style={styles.contentContainer}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.contentText} numberOfLines={3}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
          {nativeAd.body && (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text style={styles.bodyText} numberOfLines={2}>
                {nativeAd.body}
              </Text>
            </NativeAsset>
          )}
        </View>

      </NativeAdView>
    </View>
  );
};

export default FeedAdCard;

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginBottom: SPACING.XS,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: SPACING.SM,
  },
  userAvatar: {
    marginRight: SPACING.SM,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
  },
  adMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
  },
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
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },
  contentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    lineHeight: 20,
    marginBottom: SPACING.XS,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
    gap: SPACING.SM,
  },
  sponsoredText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    textTransform: 'uppercase',
  },
  ratingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WARNING || '#FFA500',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  storeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

export { FeedAdCard };
