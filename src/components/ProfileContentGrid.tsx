import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text, ActivityIndicator } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import ProfilePostCard from './ProfilePostCard';
import type { ProfilePostItem, ProfileFeedItem } from '../types/profile';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 2 - SPACING.XS * 2) / 3; // 3개씩, 양쪽 패딩과 간격 고려

interface ProfileContentGridProps {
  type: 'feed' | 'posts';
  feedData?: ProfileFeedItem[];
  postsData?: ProfilePostItem[];
  loading?: boolean;
  onItemPress?: (item: any) => void;
  onEndReached?: () => void;
}

export default function ProfileContentGrid({
  type,
  feedData = [],
  postsData = [],
  loading = false,
  onItemPress,
  onEndReached,
}: ProfileContentGridProps) {
  // 피드 그리드 렌더링 (3x3 격자)
  const renderFeedItem = ({ item }: { item: ProfileFeedItem }) => (
    <TouchableOpacity
      style={styles.feedItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      {item.preview_image ? (
        <Image source={{ uri: item.preview_image }} style={styles.feedImage} />
      ) : null}
    </TouchableOpacity>
  );

  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();

  // 게시물 리스트 렌더링
  const renderPostItem = ({ item }: { item: ProfilePostItem }) => (
    <ProfilePostCard
      post={item}
      onPress={() => {
        navigation.navigate('PostDetail', { postId: item.id });
      }}
    />
  );

  // 로딩 컴포넌트
  const renderLoading = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  };

  // 타입에 따라 적절한 데이터 선택
  const data = type === 'feed' ? feedData : postsData;

  // 데이터가 없고 로딩 중이 아닐 때
  if (!loading && (!data || data.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {type === 'feed' ? '등록된 피드가 없습니다.' : '등록된 게시글이 없습니다.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {type === 'feed' ? (
        <FlatList
          key="grid-3"
          data={data as ProfileFeedItem[]}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          onEndReached={onEndReached}
          onEndReachedThreshold={0}
          ListFooterComponent={renderLoading}
        />
      ) : (
        <FlatList
          key="list-1"
          data={data as ProfilePostItem[]}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          contentContainerStyle={styles.postsContainer}
          ListFooterComponent={renderLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  postsContainer: {
    paddingBottom: SPACING.MD,
  },
  loadingContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.DISABLED,
    textAlign: 'center',
  },
  // 피드 아이템
  feedItem: {
    width: imageSize,
    height: imageSize,
    margin: SPACING.XS / 2,
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
  },
});
