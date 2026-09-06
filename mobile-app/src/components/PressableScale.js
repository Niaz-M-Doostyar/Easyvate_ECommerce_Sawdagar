import React from 'react';
import { AccessibilityInfo, Pressable, Animated, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a subtle spring scale-down on press — the standard
 * "premium app" touch feedback. Drop-in replacement for TouchableOpacity.
 * The scale transform is applied to the Pressable itself (no wrapper view),
 * so flex/width layout behaves exactly like a plain TouchableOpacity.
 */
export default function PressableScale({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  disabled,
  accessibilityRole = 'button',
  accessibilityLabel,
  onPressIn,
  onPressOut,
  ...rest
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const reduceMotion = React.useRef(false);
  const [pressed, setPressed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const updateMotion = (enabled) => {
      if (!mounted) return;
      reduceMotion.current = enabled;
      if (enabled) {
        scale.stopAnimation();
        scale.setValue(1);
      }
    };
    AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', updateMotion);
    return () => {
      mounted = false;
      subscription.remove();
      scale.stopAnimation();
    };
  }, [scale]);

  React.useEffect(() => {
    if (disabled) {
      setPressed(false);
      scale.stopAnimation();
      scale.setValue(1);
    }
  }, [disabled, scale]);

  const animateTo = (value) => {
    if (reduceMotion.current) return;
    if (value !== 1) {
      Animated.timing(scale, { toValue: value, duration: 90, useNativeDriver: true }).start();
      return;
    }
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style;
  const originalTransforms = StyleSheet.flatten(resolvedStyle)?.transform || [];
  const baseOpacity = StyleSheet.flatten(resolvedStyle)?.opacity ?? 1;

  return (
    <AnimatedPressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        animateTo(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animateTo(1);
        onPressOut?.(event);
      }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[resolvedStyle, { opacity: pressed ? Animated.multiply(baseOpacity, 0.82) : baseOpacity, transform: [...originalTransforms, { scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
