import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, NativeAdEventType } from 'react-native-google-mobile-ads';
import { EmptyHeartIcon, CommentIcon } from './PostCardIcons';
import { BookmarkIcon } from './PostIcons';
import { useThemeStore } from '../stores/themeStore';

interface PostAdCardProps {
  nativeAd: NativeAd;
  onPress?: () => void;
}

const PostAdCard = ({ nativeAd, onPress }: PostAdCardProps) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  useEffect(() => {
    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('광고 카드 클릭됨');
    });

    return () => {
      clickListener.remove();
    };
  }, [nativeAd]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <NativeAdView nativeAd={nativeAd}>
        {/* 상단: 작성자 정보 (PostCard와 동일한 레이아웃) */}
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            <TouchableOpacity activeOpacity={0.7} disabled>
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
            </TouchableOpacity>
            <View style={styles.authorDetails}>
              <TouchableOpacity activeOpacity={0.7} disabled style={styles.nicknameTouchable}>
                <Text style={styles.authorName}>
                  {nativeAd.advertiser || '광고'}
                </Text>
              </TouchableOpacity>
              <View style={styles.adMetaInfo}>
                {/* 별점 표시 */}
                {nativeAd.starRating && (
                  <Text style={styles.ratingText}>
                    ⭐ {nativeAd.starRating.toFixed(1)}
                  </Text>
                )}
                {/* 스토어 정보 */}
                {nativeAd.store && (
                  <Text style={styles.storeText}>
                    {nativeAd.store}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryText}>
              SPONSORED {nativeAd.price ? `> ${nativeAd.price}` : ''}
            </Text>
          </View>
        </View>

        {/* 본문 영역 */}
        <View style={styles.content}>
          <View style={styles.textContent}>
            {/* 헤드라인 */}
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={styles.title} numberOfLines={2}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>

            {/* 본문 */}
            {nativeAd.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text style={styles.contentText} numberOfLines={3}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>
            )}
          </View>

          {/* 미디어 영역 */}
          <View style={styles.imageContainer}>
            <NativeMediaView style={styles.postImage} />
          </View>
        </View>

        {/* 하단: 상호작용 버튼들 (PostCard와 완전히 동일) */}
        <View style={styles.footer}>
          <View style={styles.interactionButtons}>
            <View style={styles.interactionButton}>
              <View style={styles.iconContainer}>
                <EmptyHeartIcon size={18} color={colors.GRAY_400} />
              </View>
              <Text style={styles.interactionText}>0</Text>
            </View>

            <View style={styles.interactionButton}>
              <View style={styles.iconContainer}>
                <CommentIcon size={18} color={colors.GRAY_400} />
              </View>
              <Text style={styles.interactionText}>0</Text>
            </View>

            <View style={styles.interactionButton}>
              <View style={styles.iconContainer}>
                <BookmarkIcon size={18} color={colors.GRAY_400} />
              </View>
              <Text style={styles.interactionText}>0</Text>
            </View>
          </View>
        </View>
      </NativeAdView>
    </TouchableOpacity>
  );
};

export default PostAdCard;

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.SM, // 좌우 마진 축소 (MD → SM)
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },

  // 헤더 (작성자 정보)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: SPACING.SM,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: 1,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
  },
  adMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.WARNING || '#FFA500',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  storeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  priceText: {
    color: colors.SUCCESS || '#28a745',
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 본문 내용
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  textContent: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 20,
  },

  // 썸네일 이미지
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },

  // 하단 통계
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingTop: SPACING.SM,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
    paddingVertical: SPACING.XS,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  interactionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.XS,
  },
  nicknameTouchable: {
    alignSelf: 'flex-start', // 닉네임 텍스트 크기에 맞게 터치 영역 제한
    paddingVertical: 2, // 최소 터치 영역 확보
  },
});
