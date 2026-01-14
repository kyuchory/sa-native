import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

type Props = {
  unitId: string;
  onPress?: () => void;
};

export default function NativeBannerAd({ unitId, onPress }: Props) {
  const { colors } = useThemeStore();
  const [ad, setAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    // 기존 광고 정리
    setAd(prev => {
      prev?.destroy?.();
      return null;
    });

    try {
      const native = await NativeAd.createForAdRequest(unitId, {
        aspectRatio: 1,
        startVideoMuted: true,
      });
      setAd(native);
      setIsLoading(false);
    } catch (e) {
      // 실패하면 그냥 안 보여주면 됨
      setAd(null);
      setIsLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    load();
    return () => {
      ad?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // 광고 이벤트 리스너
  useEffect(() => {
    if (!ad) return;

    const clickListener = ad.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('배너 광고 클릭됨');
    });

    return () => {
      clickListener.remove();
    };
  }, [ad]);

  const styles = createStyles(colors);

  // 로딩 중일 때는 스켈레톤 표시
  if (isLoading || !ad) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.card, styles.skeletonCard]}>
          {/* 광고 뱃지 스켈레톤 */}
          <View style={[styles.adBadge, styles.skeletonBadge]}>
            <Text style={styles.adBadgeText}>광고</Text>
          </View>

          {/* 좌측: 아이콘 스켈레톤 */}
          <View style={styles.left}>
            <View style={[styles.iconBox, styles.skeletonIcon]} />
          </View>

          {/* 가운데: 텍스트 스켈레톤 */}
          <View style={styles.center}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, styles.skeletonTextSmall]} />
          </View>

          {/* 우측: CTA 스켈레톤 */}
          <View style={styles.right}>
            <View style={styles.skeletonButton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <NativeAdView nativeAd={ad} style={[styles.wrap, { height: 68 }]}>
      <AdContainer onPress={onPress} style={styles.card}>
        {/* 광고 뱃지 - 우측 상단 */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>광고</Text>
        </View>

        {/* 좌측: 아이콘 */}
        <View style={styles.left}>
          <View style={styles.iconBox}>
            {ad.icon ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image
                  source={{ uri: ad.icon.url }}
                  style={styles.icon}
                />
              </NativeAsset>
            ) : (
              <View style={[styles.icon, styles.iconPlaceholder]}>
                <Text style={styles.iconPlaceholderText}>앱</Text>
              </View>
            )}
          </View>
        </View>

        {/* 가운데: 텍스트 */}
        <View style={styles.center}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headline} numberOfLines={1}>
              {ad.headline}
            </Text>
          </NativeAsset>
          {ad.body && (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text style={styles.body} numberOfLines={1}>
                {ad.body}
              </Text>
            </NativeAsset>
          )}
        </View>

        {/* 우측: CTA */}
        <View style={styles.right}>
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>
                {ad.callToAction || '자세히 보기'}
              </Text>
            </View>
          </NativeAsset>
        </View>
      </AdContainer>
    </NativeAdView>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  wrap: {
    width: '100%',
    height: 68,
  },

  card: {
    height: 68,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    marginHorizontal: SPACING.SM,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: colors.WHITE,
    ...SHADOWS.SMALL,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM
  },

  adBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: colors.GRAY_200,
    opacity: 0.3,
  },
  adBadgeText: {
    fontSize: 8,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    backgroundColor: colors.GRAY_100,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.MD,
  },
  iconPlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },

  center: {
    flex: 1,
    paddingHorizontal: SPACING.SM
  },
  headline: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
  },
  body: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    marginTop: 2,
  },

  right: { alignItems: 'flex-end' },
  cta: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  // 스켈레톤 스타일
  skeletonCard: {
    backgroundColor: colors.GRAY_50,
  },
  skeletonBadge: {
    backgroundColor: colors.GRAY_200,
  },
  skeletonIcon: {
    backgroundColor: colors.GRAY_200,
  },
  skeletonText: {
    height: 16,
    backgroundColor: colors.GRAY_200,
    borderRadius: 2,
    marginBottom: 4,
  },
  skeletonTextSmall: {
    height: 12,
    width: '70%',
  },
  skeletonButton: {
    width: 60,
    height: 24,
    backgroundColor: colors.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
  },
});

// 터치 리스폰더 충돌 방지를 위한 조건부 컨테이너 컴포넌트
const AdContainer = ({ onPress, children, style }: { onPress?: () => void; children: React.ReactNode; style: any }) => {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={style}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{children}</View>;
};
