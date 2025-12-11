import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import PopularPostCard from './PopularPostCard';
import { PopularIcons } from './PopularIcons';
import type { PopularPostItem } from '../types/popular';

// MainScreen container 패딩 고려한 실제 사용 가능 너비
const screenWidth = Dimensions.get('window').width - 2 * 8; // SPACING.SM = 8

export type PopularPostsSectionProps = {
  posts: PopularPostItem[];
  onPostPress?: (post: PopularPostItem) => void;
  onUserPress?: (userId: number) => void;
  onSeeMorePress?: () => void;
};

const AnimatedScrollView = Animated.createAnimatedComponent(Animated.ScrollView);

// 애니메이션 페이지 인디케이터 - FeedCard 형식을 참고한 스크롤 오프셋 기반
const AnimatedPageIndicator: React.FC<{
  index: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  colors: Record<string, string>;
}> = ({ index, totalPages, scrollX, colors }) => {

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    // 현재 페이지와의 거리 계산
    const distance = Math.abs(scrollX.value / screenWidth - index);

    // 거리에 따라 표시 여부 결정 (현재 기준 앞뒤 2개만)
    if (distance > 2) {
      return {
        width: 0,
        opacity: 0,
        transform: [{ scale: 0 }],
      };
    }

    // 너비 애니메이션 (active일 때 12, 나머지 6)
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 12, 6],
      Extrapolation.CLAMP
    );

    // 투명도 애니메이션
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    // 스케일 애니메이션
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
      transform: [{ scale }],
    };
  });

  // active 판단용 (렌더링용)
  const isActiveStyle = useAnimatedStyle(() => {
    'worklet';
    const currentPage = Math.round(scrollX.value / screenWidth);
    const isActive = currentPage === index;

    return {
      backgroundColor: isActive ? colors.PRIMARY : colors.GRAY_400,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
        },
        isActiveStyle,
        animatedStyle,
      ]}
    />
  );
};

export default function PopularPostsSection({
  posts,
  onPostPress,
  onUserPress,
  onSeeMorePress
}: PopularPostsSectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const scrollX = useSharedValue(0);

  // 3개씩 페이지로 나누기
  const postsPerPage = 3;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const paginatedData = [];
  for (let i = 0; i < totalPages; i++) {
    paginatedData.push(posts.slice(i * postsPerPage, (i + 1) * postsPerPage));
  }

  // 스크롤 핸들러 - FeedCard 방식
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <PopularIcons.PostsIcon size={20} />
          <Text style={styles.title}>인기 게시물</Text>
        </View>
        {onSeeMorePress && (
          <TouchableOpacity onPress={onSeeMorePress}>
            <Text style={styles.seeMoreText}>더보기 ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 수평 스크롤 뷰 - FeedCard 방식 */}
      <AnimatedScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageScroll}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {paginatedData.map((pagePosts, pageIndex) => (
          <View key={pageIndex} style={styles.carouselItem}>
            {/* 세로로 3개의 포스트 카드 배치 */}
            <View style={styles.page}>
              {pagePosts.map((post) => (
                <PopularPostCard
                  key={post.id}
                  post={post}
                  onPress={onPostPress}
                  onUserPress={onUserPress}
                />
              ))}
            </View>
          </View>
        ))}
      </AnimatedScrollView>

      {/* 페이지 인디케이터 */}
      {totalPages > 1 && (
        <View style={styles.pageIndicatorContainer}>
          {paginatedData.map((_, index) => (
            <AnimatedPageIndicator
              key={index}
              index={index}
              totalPages={totalPages}
              scrollX={scrollX}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    marginVertical: SPACING.SM,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingLeft: SPACING.XS,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
  },
  seeMoreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.PRIMARY,
  },

  // 수평 스크롤뷰 (FeedCard 방식)
  imageScroll: {
    minHeight: screenWidth * 0.8, // 컨텐츠에 따라 자동 조정 (최소 높이 garanti)
  },
  carouselItem: {
    width: screenWidth,
  },

  // 페이지 (세로로 카드들 배치)
  page: {
    flex: 1,
    paddingVertical: SPACING.SM,
  },

  // 페이지 인디케이터 컨테이너
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XS, // 상하 패딩 조금 줄임
    gap: SPACING.XS,
  },
});
