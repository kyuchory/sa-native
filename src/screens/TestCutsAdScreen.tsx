import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { ShortItemAdComponent } from '../components';
import { TestIds, NativeAd, NativeAdEventType } from 'react-native-google-mobile-ads';

export default function TestCutsAdScreen() {
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
        console.log('숏츠 네이티브 광고 로드 성공');
      })
      .catch((error) => {
        console.error('숏츠 네이티브 광고 로드 실패:', error);
      });
  }, []);

  useEffect(() => {
    if (!nativeAd) return;

    // 광고 이벤트 리스너
    const clickListener = nativeAd.addAdEventListener(NativeAdEventType.CLICKED, () => {
      console.log('숏츠 광고 클릭됨');
    });

    const impressionListener = nativeAd.addAdEventListener(NativeAdEventType.IMPRESSION, () => {
      console.log('숏츠 광고 노출됨');
    });

    return () => {
      clickListener.remove();
      impressionListener.remove();
      nativeAd.destroy();
    };
  }, [nativeAd]);

  if (!nativeAd) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BLACK }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.BLACK} />
        <View style={styles.loadingContainer}>
          {/* 로딩 중일 때는 빈 화면 표시 */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BLACK }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.BLACK} />
      <ShortItemAdComponent nativeAd={nativeAd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
