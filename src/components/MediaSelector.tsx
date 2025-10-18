import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import * as MediaLibrary from 'expo-media-library';

// props 인터페이스
interface MediaSelectorProps {
  maxSelection?: number;           // 최대 선택 개수 (기본: 10)
  mediaType?: 'photos' | 'videos' | 'all';  // 미디어 타입 (기본: 'all')
  videoMaxDuration?: number;       // 비디오 최대 길이 초 (기본: 60)
  allowedExtensions?: string[];    // 허용 확장자
  batchSize?: number;              // 한 번에 로드할 미디어 수 (기본: 40)
  onComplete?: (selections: MediaAssetInfo[]) => void;  // 완료 콜백
  onSelectionChange?: (selections: MediaAssetInfo[]) => void;  // 선택 변경 콜백
}

// 미디어 자산 인터페이스
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

// 화면 크기 계산
const { width } = Dimensions.get('window');
const itemWidth = (width - SPACING.MD * 2 - SPACING.XS * 3) / 4;

export default function MediaSelector(props: MediaSelectorProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // Props 기본값 설정
  const {
    maxSelection = 10,
    mediaType = 'all',
    videoMaxDuration = 60,
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv'],
    batchSize = 40,
    onComplete,
    onSelectionChange,
  } = props;

  // Ref to prevent multiple initializations
  const initRef = useRef(false);

  // 상태 관리
  const [selections, setSelections] = useState<MediaAssetInfo[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetInfo[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  // 미디어 타입 매핑
  const getMediaTypes = useCallback(() => {
    switch (mediaType) {
      case 'photos':
        return [MediaLibrary.MediaType.photo];
      case 'videos':
        return [MediaLibrary.MediaType.video];
      case 'all':
      default:
        return [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];
    }
  }, [mediaType]);

  // 확장자 필터링 함수
  const filterByExtension = useCallback((asset: MediaAssetInfo) => {
    if (!allowedExtensions || allowedExtensions.length === 0) return true;
    const extension = asset.filename.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }, [allowedExtensions]);

  // 권한 요청
  const requestPermissions = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status);

    if (status !== 'granted') {
      Alert.alert(
        '권한 필요',
        '사진 및 비디오에 접근하기 위해 권한이 필요합니다. 설정에서 허용해주세요.',
        [{ text: '확인' }]
      );
      setLoading(false);
      return false;
    }
    return true;
  }, []);

  // 미디어 자산 로드 (초기)
  const loadMediaAssets = useCallback(async () => {
    try {
      console.log('초기 미디어 로드 시작...');

      const mediaTypes = getMediaTypes();

      const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
        mediaType: mediaTypes,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // 최신순
        first: batchSize,
      });

      console.log(`가져온 미디어 개수: ${assets.length}`);

      // 타입별 필터링
      let filteredAssets = assets;

      if (mediaType === 'videos' || mediaType === 'all') {
        filteredAssets = filteredAssets.filter((asset) => {
          if (asset.mediaType === 'video') {
            return (asset.duration || 0) <= videoMaxDuration;
          }
          return true;
        });
      }

      // 확장자 필터링
      filteredAssets = filteredAssets.filter((asset) => {
        const extension = asset.filename.split('.').pop()?.toLowerCase();
        return extension ? allowedExtensions.includes(extension) : false;
      });

      const mappedAssets: MediaAssetInfo[] = filteredAssets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        mediaType: asset.mediaType as 'video' | 'photo',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        extension: asset.filename.split('.').pop()?.toLowerCase(),
      }));

      console.log(`필터링된 미디어 개수: ${mappedAssets.length}`);

      setMediaAssets(mappedAssets);
      setEndCursor(endCursor || undefined);
      setHasNextPage(hasNextPage);
    } catch (error) {
      console.error('미디어 로드 실패:', error);
      Alert.alert('오류', '미디어를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getMediaTypes, mediaType, videoMaxDuration, allowedExtensions, batchSize]);

  // 추가 미디어 로드 (페이징)
  const loadMoreAssets = useCallback(async () => {
    if (!hasNextPage || loadingMore || !endCursor) {
      return;
    }

    try {
      setLoadingMore(true);
      console.log('추가 미디어 로드 시작...');

      const mediaTypes = getMediaTypes();

      const { assets, endCursor: newEndCursor, hasNextPage: newHasNextPage } = await MediaLibrary.getAssetsAsync({
        mediaType: mediaTypes,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: batchSize,
        after: endCursor,
      });

      console.log(`추가로 가져온 미디어 개수: ${assets.length}`);

      // 타입별 필터링
      let filteredAssets = assets;

      if (mediaType === 'videos' || mediaType === 'all') {
        filteredAssets = filteredAssets.filter((asset) => {
          if (asset.mediaType === 'video') {
            return (asset.duration || 0) <= videoMaxDuration;
          }
          return true;
        });
      }

      // 확장자 필터링
      filteredAssets = filteredAssets.filter((asset) => {
        const extension = asset.filename.split('.').pop()?.toLowerCase();
        return extension ? allowedExtensions.includes(extension) : false;
      });

      const mappedAssets: MediaAssetInfo[] = filteredAssets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        mediaType: asset.mediaType as 'video' | 'photo',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        extension: asset.filename.split('.').pop()?.toLowerCase(),
      }));

      console.log(`추가로 필터링된 미디어 개수: ${mappedAssets.length}`);

      // 기존 미디어에 새 미디어 추가
      setMediaAssets(prev => [...prev, ...mappedAssets]);
      setEndCursor(newEndCursor || undefined);
      setHasNextPage(newHasNextPage);
    } catch (error) {
      console.error('추가 미디어 로드 실패:', error);
      Alert.alert('오류', '추가 미디어를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [getMediaTypes, hasNextPage, loadingMore, endCursor, mediaType, videoMaxDuration, allowedExtensions, batchSize]);

  // 초기화 - 한 번만 실행
  useEffect(() => {
    const initialize = async () => {
      if (!initRef.current) {
        initRef.current = true;
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          await loadMediaAssets();
        }
      }
    };

    initialize();
  }, [requestPermissions, loadMediaAssets]);

  // 선택 토글
  const toggleSelection = useCallback((asset: MediaAssetInfo) => {
    setSelections(current => {
      let newSelections;
      const isSelected = current.find(s => s.id === asset.id);
      if (isSelected) {
        // 선택 해제
        newSelections = current.filter(s => s.id !== asset.id);
      } else {
        // 선택 제한 확인
        if (current.length >= maxSelection) {
          Alert.alert('선택 제한', `최대 ${maxSelection}개까지만 선택할 수 있습니다.`);
          return current;
        }
        // 선택 추가
        newSelections = [...current, asset];
      }
      // 선택 변경 콜백 호출
      if (onSelectionChange) {
        onSelectionChange(newSelections);
      }
      return newSelections;
    });
  }, [maxSelection, onSelectionChange]);

  // 선택 상태 확인
  const isSelected = useCallback((asset: MediaAssetInfo) => {
    return selections.some(s => s.id === asset.id);
  }, [selections]);

  // 그리드 렌더링
  const renderMediaItem = ({ item }: { item: MediaAssetInfo }) => (
    <TouchableOpacity
      style={[
        styles.mediaItem,
        isSelected(item) && styles.mediaItemSelected,
      ]}
      onPress={() => toggleSelection(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
      {item.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoText}>
            {item.duration ? `${Math.floor(item.duration)}s` : '영상'}
          </Text>
        </View>
      )}
      {isSelected(item) && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>미디어를 불러오는 중...</Text>
      </View>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          사진 및 비디오에 접근 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestPermissions}
        >
          <Text style={styles.retryButtonText}>권한 요청 다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={mediaAssets}
      renderItem={renderMediaItem}
      keyExtractor={(item) => item.id}
      numColumns={4}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={loadMoreAssets}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingMore}>
            <Text style={styles.loadingMoreText}>더 불러오는 중...</Text>
          </View>
        ) : null
      }
    />
  );
}

// 스타일 생성
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },

  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
  },

  // 페이징 로딩
  loadingMore: {
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
  },

  // 권한 상태
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  retryButton: {
    backgroundColor: colors.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 완료 버튼
  completeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },

  // 선택 요약
  selectionSummary: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.GRAY_50,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  selectionSummaryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 그리드 컨테이너
  gridContainer: {
    padding: SPACING.MD,
  },

  // 미디어 아이템
  mediaItem: {
    width: itemWidth,
    height: itemWidth,
    marginHorizontal: SPACING.XS / 2,
    marginBottom: SPACING.XS,
    borderRadius: 8,
    backgroundColor: colors.GRAY_200,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaItemSelected: {
    borderWidth: 3,
    borderColor: colors.PRIMARY,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },

  // 비디오 인디케이터
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 선택 인디케이터
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
});
