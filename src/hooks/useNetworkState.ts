import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export enum NetworkType {
  WIFI = 'WIFI',
  CELLULAR = 'CELLULAR',
  NONE = 'NONE',
  UNKNOWN = 'UNKNOWN'
}

type NetworkState = {
  type: NetworkType;
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

// 네트워크 타입 변환 함수
const mapToNetworkType = (type: string | undefined): NetworkType => {
  switch (type?.toUpperCase()) {
    case 'WIFI':
      return NetworkType.WIFI;
    case 'CELLULAR':
      return NetworkType.CELLULAR;
    case 'NONE':
      return NetworkType.NONE;
    default:
      return NetworkType.UNKNOWN;
  }
};

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    type: NetworkType.UNKNOWN,
    isConnected: false,
    isInternetReachable: null,
  });

  useEffect(() => {
    // 초기 네트워크 상태 가져오기
    const getInitialNetworkState = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setNetworkState({
          type: mapToNetworkType(state.type),
          isConnected: !!state.isConnected,
          isInternetReachable: state.isInternetReachable ?? null,
        });
      } catch (error) {
        console.warn('네트워크 상태 초기화 실패:', error);
        // 에러 시 기본값 유지
      }
    };

    getInitialNetworkState();

    // 네트워크 상태 변경 리스너
    const subscription = Network.addNetworkStateListener((state) => {
      setNetworkState({
        type: mapToNetworkType(state.type),
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return networkState;
};

// 비디오 자동 재생 여부 결정 유틸리티 함수
export const shouldAutoPlayVideo = (
  networkType: NetworkType,
  autoPlayMode: 'always' | 'wifi_only' | 'cellular_only' | 'manual'
): boolean => {
  switch (autoPlayMode) {
    case 'always':
      return true;
    case 'wifi_only':
      return networkType === NetworkType.WIFI;
    case 'cellular_only':
      return networkType === NetworkType.CELLULAR;
    case 'manual':
      return false;
    default:
      return true;
  }
};
