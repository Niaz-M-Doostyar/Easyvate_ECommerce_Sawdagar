import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../theme';

export default function SkeletonLoader({ width, height = 16, radius = borderRadius.sm, style }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton, opacity: anim }, style]} />;
}
