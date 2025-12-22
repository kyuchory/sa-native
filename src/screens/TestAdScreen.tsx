import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import { PostAdCard } from '../components';
import { TestIds, NativeAd, NativeAdEventType } from 'react-native-google-mobile-ads';

export default function TestAdScreen() {
  const { colors } = useThemeStore();
  const [nativeAd, setNativeAd] = useState<NativeAd>();

  useEffect(() => {
    // 네이티브 광고 로드
    NativeAd.createForAdRequest(TestIds.NATIVE, {
      aspectRatio: 1, // 정사각형 비율
      adChoicesPlacement: 0, // TOP_LEFT
      startVideoMuted: true,
    })
      .then((ad) => {
        setNativeAd(ad);
        console.log('네이티브 광고 로드 성공');
      })
      .catch((error) => {
        console.error('네이티브 광고 로드 실패:', error);
      });
  }, []);

  useEffect(() => {
    if (!nativeAd) return;

    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('네이티브 광고 클릭됨');
    });

    const impressionListener = nativeAd.addAdEventListener(NativeAdEventType.IMPRESSION, () => {
      console.log('네이티브 광고 노출됨');
    });

    return () => {
      clickListener.remove();
      impressionListener.remove();
      nativeAd.destroy();
    };
  }, [nativeAd]);

  if (!nativeAd) {
    return (
      <View style={[styles.container, { backgroundColor: colors.GRAY_50 }]}>
        <CommonHeader title="광고 테스트" />
        <View style={styles.content}>
          <Text style={[styles.loadingText, { color: colors.GRAY_900 }]}>
            광고 로딩 중...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.GRAY_50 }]}>
      <CommonHeader title="광고 테스트" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.GRAY_900 }]}>
          PostCard 스타일 네이티브 광고 테스트
        </Text>

        {/* PostAdCard를 사용한 네이티브 광고 표시 */}
        <PostAdCard nativeAd={nativeAd} />

        <Text style={[styles.info, { color: colors.GRAY_600 }]}>
          이 광고는 PostCard와 유사한 스타일로 디자인되었습니다.{'\n'}
          실제 앱에서는 실제 광고 단위 ID를 사용하세요.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  adContainer: {
    marginBottom: 20,
  },
  nativeAdView: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headlineContainer: {
    marginBottom: 8,
  },
  headline: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  adLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  mediaView: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  bodyContainer: {
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaContainer: {
    alignSelf: 'flex-start',
  },
  cta: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    overflow: 'hidden',
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
