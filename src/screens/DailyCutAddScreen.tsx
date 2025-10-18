import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../stores/themeStore';
import { SPACING } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import MediaSelector from '../components/MediaSelector';
import { CheckIcon } from '../components/CommonIcons';

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
              onPress={() => {
                // CanvasEditor로 이미지 전달
                navigation.navigate('CanvasEditor' as never, { imageUri: selectedMedias[0]?.uri });
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
