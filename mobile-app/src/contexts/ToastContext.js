import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, fontSize, fontWeight, spacing } from '../theme';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = useCallback((msg, type = 'success', duration = 3000) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, type });
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
    }, duration);
  }, [anim]);

  const bg = toast?.type === 'error' ? '#B42318' : toast?.type === 'warning' ? '#8A5700' : toast?.type === 'info' ? '#17339B' : '#087443';

  return (
    <ToastContext.Provider value={{ toast: show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), warning: (m) => show(m, 'warning'), info: (m) => show(m, 'info') }}>
      {children}
      {toast && (
        <Animated.View style={[styles.toast, { backgroundColor: bg, left: Math.max(16, (width - 560) / 2), right: Math.max(16, (width - 560) / 2), top: insets.top + 10, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }]}>
          <Text style={styles.text}>{toast.msg}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: spacing.base, right: spacing.base, borderRadius: borderRadius.md, padding: spacing.base, zIndex: 9999, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 8 } }) },
  text: { color: '#FFF', fontSize: fontSize.base, fontWeight: fontWeight.semibold, textAlign: 'center' },
});
