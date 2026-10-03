import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config';

// Keep these values aligned with CURRENT_PROJECT_VERSION and versionCode for every native release.
const INSTALLED_BUILD = Platform.OS === 'ios' ? 4 : 14;

export default function RequiredUpdate({ children }) {
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
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: '#f8f9fb' }}>
    <Text style={{ fontSize: 30, fontWeight: '800', color: '#132b55', textAlign: 'center' }}>Update Sawdagar</Text>
    <Text style={{ fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#445', marginVertical: 18 }}>A new version is ready. Update to continue shopping.</Text>
    <TouchableOpacity onPress={() => Linking.openURL(storeUrl)} style={{ backgroundColor: '#175ce3', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 14 }}><Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>Open app store</Text></TouchableOpacity>
  </View>;
}
