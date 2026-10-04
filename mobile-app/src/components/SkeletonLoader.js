import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../theme';

export default function SkeletonLoader({ width, height = 16, radius = borderRadius.sm, style }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    let mounted = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ]));
    const update = reduced => {
      if (!mounted) return;
      loop.stop();
      if (reduced) anim.setValue(0.6);
      else loop.start();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(true));
    return () => { mounted = false; subscription.remove(); loop.stop(); };
  }, [anim]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton, opacity: anim }, style]} />;
}
