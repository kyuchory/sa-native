import React, { useEffect, useState, useCallback } from 'react';
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
import CommonHeader from '../components/CommonHeader';
import * as MediaLibrary from 'expo-media-library';
import { CheckIcon } from '../components/ChatActionIcons';

// 타입 정의
interface MediaAssetInfo {
  id: string;
  filename: string;
  uri: string;
  mediaType: 'video' | 'photo';
  duration?: number;
  width: number;
  height: number;
  creationTime: number;
}

// 화면 크기 계산
const { width } = Dimensions.get('window');
const itemWidth = (width - SPACING.MD * 2 - SPACING.XS * 3) / 4; // 4열 그리드

export default function DailyCutAddScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [selections, setSelections] = useState<{
    photos: MediaAssetInfo[];
    videos: MediaAssetInfo[];
  }>({
    photos: [],
    videos: [],
  });

  const [mediaAssets, setMediaAssets] = useState<MediaAssetInfo[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  // 권한 요청
  const requestPermissions = async () => {
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
  };

  // 미디어 자산 로드 (초기)
  const loadMediaAssets = async () => {
    try {
      console.log('초기 미디어 로드 시작...');

      // 사진과 비디오 모두 가져오기
      const { assets, endCursor, hasNextPage } = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // 최신순
        first: 40, // 페이징을 위해 적게 시작
      });

      console.log(`가져온 미디어 개수: ${assets.length}, 다음 페이지 존재: ${hasNextPage}`);

      // 비디오 1분 미만, 사진 전체 필터링
      const filteredAssets = assets
        .filter((asset) => {
          if (asset.mediaType === 'video') {
            return (asset.duration || 0) < 60; // 1분 미만
          }
          return asset.mediaType === 'photo';
        })
        .map((asset) => ({
          id: asset.id,
          filename: asset.filename,
          uri: asset.uri,
          mediaType: asset.mediaType as 'video' | 'photo',
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          creationTime: asset.creationTime,
        }));

      console.log(`필터링된 미디어 개수: ${filteredAssets.length}`);

      setMediaAssets(filteredAssets);
      setEndCursor(endCursor || undefined);
      setHasNextPage(hasNextPage);
    } catch (error) {
      console.error('미디어 로드 실패:', error);
      Alert.alert('오류', '미디어를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 추가 미디어 로드 (페이징)
  const loadMoreAssets = async () => {
    if (!hasNextPage || loadingMore || !endCursor) {
      return;
    }

    try {
      setLoadingMore(true);
      console.log('추가 미디어 로드 시작...');

      const { assets, endCursor: newEndCursor, hasNextPage: newHasNextPage } = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 40,
        after: endCursor,
      });

      console.log(`추가로 가져온 미디어 개수: ${assets.length}`);

      // 비디오 1분 미만, 사진 전체 필터링
      const filteredAssets = assets
        .filter((asset) => {
          if (asset.mediaType === 'video') {
            return (asset.duration || 0) < 60; // 1분 미만
          }
          return asset.mediaType === 'photo';
        })
        .map((asset) => ({
          id: asset.id,
          filename: asset.filename,
          uri: asset.uri,
          mediaType: asset.mediaType as 'video' | 'photo',
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          creationTime: asset.creationTime,
        }));

      console.log(`추가로 필터링된 미디어 개수: ${filteredAssets.length}`);

      // 기존 미디어에 새 미디어 추가
      setMediaAssets(prev => [...prev, ...filteredAssets]);
      setEndCursor(newEndCursor || undefined);
      setHasNextPage(newHasNextPage);
    } catch (error) {
      console.error('추가 미디어 로드 실패:', error);
      Alert.alert('오류', '추가 미디어를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMore(false);
    }
  };

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      const hasPermission = await requestPermissions();
      if (hasPermission) {
        await loadMediaAssets();
      }
    };

    initialize();
  }, []);

  // 선택 토글
  const toggleSelection = useCallback((asset: MediaAssetInfo) => {
    setSelections(current => {
      if (asset.mediaType === 'photo') {
        // 사진은 하나만 선택 가능
        const hasPhoto = current.photos.find(p => p.id === asset.id);
        return {
          ...current,
          photos: hasPhoto ? [] : [asset],
        };
      } else {
        // 비디오는 다중 선택 가능
        const hasVideo = current.videos.find(v => v.id === asset.id);
        return {
          ...current,
          videos: hasVideo
            ? current.videos.filter(v => v.id !== asset.id)
            : [...current.videos, asset],
        };
      }
    });
  }, []);

  // 선택 상태 확인
  const isSelected = useCallback((asset: MediaAssetInfo) => {
    if (asset.mediaType === 'photo') {
      return selections.photos.some(p => p.id === asset.id);
    } else {
      return selections.videos.some(v => v.id === asset.id);
    }
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

  // 선택된 미디어 수 계산
  const selectedCount = selections.photos.length + selections.videos.length;

  // 완료 버튼 핸들러 (나중에 API 연동)
  const handleComplete = useCallback(() => {
    if (selectedCount === 0) {
      Alert.alert('선택 필요', '적어도 하나 이상의 미디어를 선택해주세요.');
      return;
    }

    // TODO: API 호출로 데일리 컷 저장
    console.log('선택된 미디어:', selections);
    Alert.alert(
      '완료',
      `${selectedCount}개의 미디어가 선택되었습니다.\n(향후 API 연동 예정)`,
      [{ text: '확인' }]
    );
  }, [selectedCount, selections]);

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="데일리 컷 추가" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>미디어를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.container}>
        <CommonHeader title="데일리 컷 추가" />
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader
        title="데일리 컷 추가"
        rightComponent={
          selectedCount > 0 ? (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              activeOpacity={0.7}
            >
              <CheckIcon size={18} color={colors.PRIMARY} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* 선택된 미디어 요약 */}
      {(selections.photos.length > 0 || selections.videos.length > 0) && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryText}>
            선택됨: 사진 {selections.photos.length}개, 영상 {selections.videos.length}개
          </Text>
        </View>
      )}

      {/* 미디어 그리드 */}
      <FlatList
        data={mediaAssets}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreAssets}
        onEndReachedThreshold={0.8}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>더 불러오는 중...</Text>
            </View>
          ) : null
        }
      />
    </View>
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
  mediaItemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
});
