import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import CustomAlertModal from './CustomAlertModal';

interface MediaSelectorProps {
  maxSelection?: number;
  mediaType?: 'photos' | 'videos' | 'all';
  videoMaxDuration?: number;
  allowedExtensions?: string[];
  batchSize?: number;
  onComplete?: (selections: MediaAssetInfo[]) => void;
  onSelectionChange?: (selections: MediaAssetInfo[]) => void;
}

interface MediaAssetInfo {
  id: string;
  filename: string;
  uri: string;
  mediaType: 'video' | 'photo';
  duration?: number;
  width: number;
  height: number;
  creationTime: number;
  extension?: string;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - SPACING.MD * 2 - SPACING.XS * 3) / 4;

export default function MediaSelector({
  maxSelection = 10,
  mediaType = 'all',
  videoMaxDuration = 60,
  allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv'],
  batchSize = 40,
  onSelectionChange,
}: MediaSelectorProps) {
  const { colors } = useThemeStore();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [assets, setAssets] = useState<MediaAssetInfo[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string>();
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  useEffect(() => {
    loadAssets();
  }, [permissionResponse]);

  const getMediaTypes = () => {
    switch (mediaType) {
      case 'photos':
        return [MediaLibrary.MediaType.photo];
      case 'videos':
        return [MediaLibrary.MediaType.video];
      default:
        return [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];
    }
  };

  const loadAssets = async () => {
    if (permissionResponse?.status !== 'granted') {
      await requestPermission();
      return;
    }

    // 이미 로딩 중이거나 더 이상 데이터가 없으면 중단
    if (loading || loadingMore || !hasMore) return;

    const isInitialLoad = !endCursor;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: batchSize,
        after: endCursor,
        mediaType: getMediaTypes(),
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const filteredAssets = result.assets
        .filter(asset => {
          const ext = asset.filename.split('.').pop()?.toLowerCase();
          const valid = ext ? allowedExtensions.includes(ext) : false;
          if (asset.mediaType === MediaLibrary.MediaType.video) {
            return valid && (asset.duration || 0) <= videoMaxDuration;
          }
          return valid;
        })
        .map(asset => ({
          id: asset.id,
          filename: asset.filename,
          uri: asset.uri,
          mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' as const : 'photo' as const,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          creationTime: asset.creationTime,
          extension: asset.filename.split('.').pop()?.toLowerCase(),
        }));

      // 초기 로드일 때는 덮어쓰고, 추가 로드일 때는 중복 체크 후 추가
      if (isInitialLoad) {
        setAssets(filteredAssets);
      } else {
        setAssets(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAssets = filteredAssets.filter(a => !existingIds.has(a.id));
          return [...prev, ...newAssets];
        });
      }

      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setAlertModal({ visible: true, title: '오류', message: '미디어를 불러오지 못했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleSelection = (asset: MediaAssetInfo) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(asset.id)) {
        newSet.delete(asset.id);
      } else {
        if (newSet.size >= maxSelection) {
          setAlertModal({ visible: true, title: '선택 제한', message: `최대 ${maxSelection}개까지만 선택할 수 있습니다.`, buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
          return prev;
        }
        newSet.add(asset.id);
      }

      if (onSelectionChange) {
        const selected = assets.filter(a => newSet.has(a.id));
        onSelectionChange(selected);
      }

      return newSet;
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const styles = createStyles(colors);

  const renderItem = ({ item }: { item: MediaAssetInfo }) => {
    const isSelected = selectedAssets.has(item.id);
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: colors.GRAY_200 }]}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        
        {isVideo && item.duration && item.duration > 0 && (
          <View style={styles.durationBadge}>
            <Text style={[styles.durationText, { color: colors.WHITE }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        )}

        {isSelected && (
          <>
            <View style={[styles.selectedOverlay, { borderColor: colors.PRIMARY }]} />
            <View style={[styles.checkmark, { backgroundColor: colors.PRIMARY }]}>
              <Text style={[styles.checkmarkText, { color: colors.WHITE }]}>✓</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={[styles.message, { color: colors.GRAY_600 }]}>
          미디어를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (permissionResponse?.status === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={[styles.message, { color: colors.GRAY_700 }]}>
          사진 및 비디오 접근 권한이 필요합니다.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.PRIMARY }]}
          onPress={requestPermission}
        >
          <Text style={[styles.buttonText, { color: colors.WHITE }]}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={4}
        removeClippedSubviews={false}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadAssets}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>
                {loadingMore ? '더 불러오는 중...' : ''}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.LG,
    },
    message: {
      fontSize: TYPOGRAPHY.SIZE.MD,
      textAlign: 'center',
      marginBottom: SPACING.LG,
    },
    button: {
      paddingHorizontal: SPACING.LG,
      paddingVertical: SPACING.MD,
      borderRadius: 8,
    },
    buttonText: {
      fontSize: TYPOGRAPHY.SIZE.MD,
      fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    },
    gridContainer: {
      padding: SPACING.MD,
    },
    item: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      marginHorizontal: SPACING.XS / 2,
      marginBottom: SPACING.XS,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    selectedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: 3,
      borderRadius: 8,
      pointerEvents: 'none',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: colors.BLACK_50,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    durationText: {
      fontSize: TYPOGRAPHY.SIZE.XS,
      fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
      color: colors.WHITE,
    },
    checkmark: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      fontSize: TYPOGRAPHY.SIZE.SM,
      fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    },
    loadingMore: {
      paddingVertical: SPACING.MD,
      alignItems: 'center',
    },
    loadingMoreText: {
      fontSize: TYPOGRAPHY.SIZE.MD,
      color: colors.GRAY_600,
    },
  });
