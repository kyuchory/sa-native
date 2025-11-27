import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Dimensions, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import { Image } from 'expo-image';
import { ChatService } from '../services/chatService';
import { ChatRoomMediaItem } from '../types/chat';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { BackIcon } from '../components/CommonIcons';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 4;
// 올바른 이미지 사이즈 계산: 좌우 패딩 + 아이템 사이 간격 고려
const totalGutter = SPACING.MD * 2 + SPACING.XS * (numColumns - 1);
const imageSize = (screenWidth - totalGutter) / numColumns;

interface ChatRoomMediaScreenProps {
  chatRoomId: number;
  chatRoomName: string;
}

export default function ChatRoomMediaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const { chatRoomId, chatRoomName } = route.params as ChatRoomMediaScreenProps;

  const [mediaItems, setMediaItems] = useState<ChatRoomMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [chatRoomId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await ChatService.getChatRoomMedia(chatRoomId);
      setMediaItems(response.media);
    } catch (error) {
      console.error('미디어 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPress = (index: number) => {
    setImageViewerInitialIndex(index);
    setIsImageViewerVisible(true);
  };

  const renderMediaItem = ({ item, index }: { item: ChatRoomMediaItem; index: number }) => {
    // 비디오의 경우 썸네일 URL 추출
    let displayUrl = item.content;
    if (item.type === 'video') {
      try {
        const videoData = JSON.parse(item.content);
        displayUrl = videoData.thumbnail_url || item.content;
      } catch (error) {
        console.error('비디오 content 파싱 실패:', error);
      }
    }

    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => handleMediaPress(index)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: displayUrl }}
          style={styles.mediaImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        {item.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Text style={styles.videoIcon}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const mediaItemsForViewer = mediaItems.map(item => ({
    type: item.type as 'image' | 'video',
    url: item.type === 'video' ? (() => {
      try {
        const videoData = JSON.parse(item.content);
        return videoData.video_url || '';
      } catch (error) {
        return '';
      }
    })() : item.content,
    thumbnailUrl: item.type === 'video' ? (() => {
      try {
        const videoData = JSON.parse(item.content);
        return videoData.thumbnail_url || '';
      } catch (error) {
        return '';
      }
    })() : undefined,
  }));

  return (
    <View style={styles.container}>
      <CommonHeader
        title={chatRoomName}
        showBackButton={true}
      />

      {/* 미디어 보관 공지사항 */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeText}>
          미디어는 30일, 최근 50개 항목이 보관됩니다.
        </Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>로딩 중...</Text>
          </View>
        ) : mediaItems.length > 0 ? (
          <FlatList
            data={mediaItems}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.message_id.toString()}
            numColumns={numColumns}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              paddingHorizontal: SPACING.MD,
              marginBottom: SPACING.XS,
            }}
            contentContainerStyle={styles.mediaGrid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>공유된 미디어파일이 없습니다</Text>
          </View>
        )}
      </View>

      <ImageViewerModal
        visible={isImageViewerVisible}
        mediaItems={mediaItemsForViewer}
        initialIndex={imageViewerInitialIndex}
        title={chatRoomName}
        onClose={() => setIsImageViewerVisible(false)}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500,
  },
  mediaGrid: {
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.MD + SPACING.XS,
  },
  mediaItem: {
    marginHorizontal: 0,
    marginVertical: 0,
    position: 'relative',
  },
  mediaImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.GRAY_100,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500,
  },
  noticeContainer: {
    backgroundColor: colors.GRAY_50,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  noticeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    textAlign: 'center',
  },
});
