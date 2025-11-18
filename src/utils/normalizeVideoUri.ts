import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export async function normalizeVideoUri(
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  // 안드로이드는 그냥 사용해도 되는 경우가 대부분
  if (Platform.OS !== 'ios') {
    return asset.uri;
  }

  try {
    // iOS: assetId가 있으면 MediaLibrary로 실제 파일 위치 조회
    if (asset.assetId) {
      const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
      const sourceUri = info.localUri ?? asset.uri;

      const filename = info.filename ?? `video_${asset.assetId}.mov`;
      const documentDir = (FileSystem as any).documentDirectory || (FileSystem as any).bundleDirectory;
      const dest = `${documentDir}${filename}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: dest,
      });

      return dest; // 이 경로를 이후에 사용
    } else {
      // assetId가 없는 경우 fallback
      const filename = `video_${Date.now()}.mov`;
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).temporaryDirectory;
      const dest = `${cacheDir}${filename}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: dest,
      });

      return dest;
    }
  } catch (e) {
    console.warn('normalizeVideoUri 실패, 원본 uri 사용', e);
    return asset.uri; // 최후의 수단
  }
}
