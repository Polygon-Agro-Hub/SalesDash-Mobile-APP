// app/_layout.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider } from '@/context/LanguageContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from "react-native-safe-area-context";
export default function Layout() {
  return (
     <SafeAreaProvider>
    <LanguageProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </LanguageProvider>
    </SafeAreaProvider>
  );
}
