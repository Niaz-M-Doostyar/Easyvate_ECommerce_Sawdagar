import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { API_URL } from '../config';

// Keep these values aligned with CURRENT_PROJECT_VERSION and versionCode for every native release.
const INSTALLED_BUILD = Platform.OS === 'ios' ? 4 : 14;

export default function RequiredUpdate({ children }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [storeUrl, setStoreUrl] = useState(null);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mobile-version`, { cache: 'no-store' });
        if (!response.ok) return;
        const settings = await response.json();
        const platform = Platform.OS;
        if (mounted) setStoreUrl(INSTALLED_BUILD < Number(settings[platform]) ? settings[`${platform}StoreUrl`] : null);
      } catch { /* Keep the app usable while offline. */ }
    };
    check();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { mounted = false; listener.remove(); };
  }, []);
  if (!storeUrl) return children;
  return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: c.background }}>
    <View style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 28, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderLight }}>
      <Text accessibilityRole="header" style={{ fontSize: 30, lineHeight: 38, fontWeight: '600', color: c.text }}>Update Sawdagar</Text>
      <Text style={{ fontSize: 16, lineHeight: 26, color: c.textSecondary, marginVertical: 20 }}>A new version is ready. Update to continue shopping.</Text>
      <Button title="Open app store" onPress={() => Linking.openURL(storeUrl)} />
    </View>
  </SafeAreaView>;
}
