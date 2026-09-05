import React from 'react';
import { Pressable, Animated } from 'react-native';

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
  ...rest
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
