import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import PostCard from './PostCard';
import type { Post } from './PostCard';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 2 - SPACING.XS * 2) / 3; // 3개씩, 양쪽 패딩과 간격 고려

// 피드 아이템 타입
export interface FeedItem {
  id: string;
  imageUrl: string;
  type: 'image' | 'video';
}

// 비디오 아이템 타입
export interface VideoItem {
  id: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  title: string;
}

// 캐릭터 아이템 타입
export interface CharacterItem {
  id: string;
  name: string;
  level: number;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ProfileContentGridProps {
  type: 'feed' | 'posts' | 'videos' | 'character';
  feedData?: FeedItem[];
  postsData?: Post[];
  videosData?: VideoItem[];
  charactersData?: CharacterItem[];
  onItemPress?: (item: any) => void;
}

export default function ProfileContentGrid({
  type,
  feedData = [],
  postsData = [],
  videosData = [],
  charactersData = [],
  onItemPress,
}: ProfileContentGridProps) {
  // 피드 그리드 렌더링 (3x3 격자)
  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity
      style={styles.feedItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.feedImage} />
      {item.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoIcon}>▶️</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // 게시물 리스트 렌더링
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => onItemPress?.(item)}
    />
  );

  // 비디오 그리드 렌더링
  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
      <View style={styles.videoOverlay}>
        <Text style={styles.videoDuration}>{item.duration}</Text>
        <Text style={styles.videoViews}>{formatNumber(item.viewCount)}</Text>
      </View>
      <View style={styles.videoPlayIcon}>
        <Text style={styles.playIcon}>▶️</Text>
      </View>
    </TouchableOpacity>
  );

  // 캐릭터 그리드 렌더링
  const renderCharacterItem = ({ item }: { item: CharacterItem }) => (
    <TouchableOpacity
      style={[styles.characterItem, styles[`${item.rarity}Border`]]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.characterImage} />
      <View style={styles.characterInfo}>
        <Text style={styles.characterName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.characterLevel}>Lv.{item.level}</Text>
      </View>
      <View style={[styles.rarityBadge, styles[item.rarity]]}>
        <Text style={styles.rarityText}>{getRaritySymbol(item.rarity)}</Text>
      </View>
    </TouchableOpacity>
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  const getRaritySymbol = (rarity: string) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  };

  // 데이터와 렌더 함수 매핑
  const getContentConfig = () => {
    switch (type) {
      case 'feed':
        return {
          data: feedData,
          renderItem: renderFeedItem,
          numColumns: 3,
          key: 'feed',
        };
      case 'posts':
        return {
          data: postsData,
          renderItem: renderPostItem,
          numColumns: 1,
          key: 'posts',
        };
      case 'videos':
        return {
          data: videosData,
          renderItem: renderVideoItem,
          numColumns: 3,
          key: 'videos',
        };
      case 'character':
        return {
          data: charactersData,
          renderItem: renderCharacterItem,
          numColumns: 3,
          key: 'character',
        };
      default:
        return {
          data: [],
          renderItem: () => null,
          numColumns: 1,
          key: 'default',
        };
    }
  };

  const config = getContentConfig();

  if (config.data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {type === 'posts' && '작성한 게시물이 없습니다.'}
          {type === 'feed' && '등록한 피드가 없습니다.'}
          {type === 'videos' && '업로드한 영상이 없습니다.'}
          {type === 'character' && '연동된 캐릭터가 없습니다.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={config.data}
      renderItem={config.renderItem}
      numColumns={config.numColumns}
      key={config.key}
      contentContainerStyle={[
        styles.container,
        config.numColumns === 1 && styles.listContainer
      ]}
      columnWrapperStyle={config.numColumns > 1 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={config.numColumns === 1 ? () => <View style={styles.separator} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  separator: {
    height: SPACING.SM,
  },

  // 피드 아이템
  feedItem: {
    width: imageSize,
    height: imageSize,
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
  },
  videoIndicator: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
  },
  videoIcon: {
    fontSize: 12,
  },

  // 비디오 아이템
  videoItem: {
    width: imageSize,
    height: imageSize * 1.2,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BLACK_50,
    padding: SPACING.XS,
    borderBottomLeftRadius: BORDER_RADIUS.SM,
    borderBottomRightRadius: BORDER_RADIUS.SM,
  },
  videoDuration: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  videoViews: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    opacity: 0.8,
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  playIcon: {
    fontSize: 24,
  },

  // 캐릭터 아이템
  characterItem: {
    width: imageSize,
    height: imageSize * 1.2,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.XS,
    borderWidth: 2,
    position: 'relative',
  },
  characterImage: {
    width: '100%',
    height: '70%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
  },
  characterInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.XS,
  },
  characterName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
  },
  characterLevel: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 12,
  },

  // 레어리티 테두리
  commonBorder: { borderColor: COLORS.GRAY_400 },
  rareBorder: { borderColor: '#3498db' },
  epicBorder: { borderColor: '#9b59b6' },
  legendaryBorder: { borderColor: '#f1c40f' },

  // 레어리티 배지
  common: { backgroundColor: COLORS.GRAY_400 },
  rare: { backgroundColor: '#3498db' },
  epic: { backgroundColor: '#9b59b6' },
  legendary: { backgroundColor: '#f1c40f' },

  // 빈 상태
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
});
