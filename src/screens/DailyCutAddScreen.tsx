import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { SPACING } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import MediaSelector from '../components/MediaSelector';
import { CheckIcon } from '../components/CommonIcons';
import * as MediaLibrary from 'expo-media-library';

// PHAsset URI를 file URI로 변환하는 헬퍼 함수
async function convertPhToFileUri(uri: string): Promise<string> {
  if (!uri.startsWith('ph://')) return uri;

  const assetId = uri.replace('ph://', '');
  const asset = await MediaLibrary.getAssetInfoAsync(assetId);
  return asset.localUri || asset.uri; // localUri가 우선 (file:// 경로)
}

export default function DailyCutAddScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [selectedMedias, setSelectedMedias] = useState<MediaAssetInfo[]>([]);

  const handleSelectionChange = (selections: MediaAssetInfo[]) => {
    setSelectedMedias(selections);
  };

  return (
    <View style={styles.container}>
      <CommonHeader
        title="데일리 컷 추가"
      rightComponent={
          selectedMedias.length > 0 ? (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={async () => {
                const selectedMedia = selectedMedias[0];
                if (selectedMedia?.mediaType === 'photo') {
                  // PHAsset URI를 file URI로 변환 후 CanvasEditor로 전달
                  const realUri = await convertPhToFileUri(selectedMedia.uri);
                  navigation.replace('CanvasEditor' as never, { imageUri: realUri });
                } else if (selectedMedia?.mediaType === 'video') {
                  // PHAsset URI를 file URI로 변환 후 VideoTrimCrop으로 비디오 전달
                  const realUri = await convertPhToFileUri(selectedMedia.uri);
                  navigation.replace('VideoTrimCrop' as never, {
                    videoUri: realUri,
                    videoDuration: selectedMedia.duration ? selectedMedia.duration * 1000 : undefined,
                    editMode: 'both',
                    maxDuration: 30000,
                    uploadService: 'story',
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <CheckIcon size={24} color={colors.PRIMARY} />
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={styles.content}>
        <MediaSelector
          maxSelection={1}
          mediaType="all"
          onSelectionChange={handleSelectionChange}
          onComplete={handleSelectionChange}
        />
      </View>
    </View>
  );
}

// 미디어 인터페이스
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

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  content: {
    flex: 1,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
