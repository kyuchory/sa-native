import { Platform } from 'react-native';

export const AdUnits = {
  POST_LIST: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/7397749410',
  }) as string,

  SHORT_LIST: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/1057859312',
  }) as string,

  CHAT_HEADER: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/8012288080',
  }) as string,

  NOTIFICATION_HEADER: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/8744777643',
  }) as string,

  SETTING_HEADER: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/3914945187',
  }) as string,

  BOOKMARK_HEADER: Platform.select({
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/3986624511'
      : 'ca-app-pub-3940256099942544/3986624511',
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-9090911298107655/6509318938',
  }) as string,
};
