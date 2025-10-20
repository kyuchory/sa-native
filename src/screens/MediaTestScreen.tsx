import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import { SPACING } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import MediaSelector from '../components/MediaSelector';
import { CheckIcon } from '../components/CommonIcons';

export default function MediaTestScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [selectedMedias, setSelectedMedias] = useState<MediaAssetInfo[]>([]);

  const handleSelectionChange = (selections: MediaAssetInfo[]) => {
    setSelectedMedias(selections);
  };

  const handleComplete = (selections: MediaAssetInfo[]) => {
    Alert.alert(
      '선택 완료',
      `${selections.length}개의 미디어가 선택되었습니다.`,
      [{ text: '확인' }]
    );
  };

  return (
    <View style={styles.container}>
      <CommonHeader
        title="미디어 테스트"
        rightComponent={
          selectedMedias.length > 0 ? (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={() => {
                const selectedMedia = selectedMedias[0];
                if (selectedMedia?.mediaType === 'video') {
                  // 비디오인 경우 VideoTrimCrop으로 이동
                  navigation.navigate('VideoTrimCrop' as never, {
                    videoUri: selectedMedia.uri,
                    videoDuration: selectedMedia.duration ? selectedMedia.duration * 1000 : undefined, // ms로 변환
                    aspectRatio: '1:1',
                  });
                } else {
                  // 이미지인 경우 CanvasEditor로 이동
                  navigation.navigate('CanvasEditor' as never, { imageUri: selectedMedia?.uri });
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
          allowedExtensions={['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv']}
          onSelectionChange={handleSelectionChange}
          onComplete={handleComplete}
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
