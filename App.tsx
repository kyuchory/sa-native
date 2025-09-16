import React, { useEffect } from 'react';
import { StatusBar as RNStatusBar, Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
