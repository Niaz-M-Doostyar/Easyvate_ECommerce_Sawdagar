import React from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet } from 'react-native';
import PressableScale from './PressableScale';
import { useTheme } from '../contexts/ThemeContext';

const EXPAND_DURATION = 280;

// React Navigation supplies android_ripple, which React Native ignores on iOS.
// Keep Android's native drawable and provide its expanding/fading feedback on iOS.
export default function FooterTabButton(props) {
  return Platform.OS === 'ios'
    ? <IOSRippleTabButton {...props} />
    : <PressableScale {...props} scaleTo={0.94} />;
}

function IOSRippleTabButton({ children, onPressIn, onPressOut, onLayout, disabled, ...props }) {
  const { theme } = useTheme();
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const startedAt = React.useRef(0);
  const releaseAnimation = React.useRef(null);
  const reduceMotion = React.useRef(false);
  const expansion = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const diameter = Math.max(size.width, size.height) * 1.4;

  React.useEffect(() => {
    let mounted = true;
    const update = (enabled) => {
      if (!mounted) return;
      reduceMotion.current = enabled;
      if (enabled) {
        expansion.stopAnimation();
        expansion.setValue(1);
      }
    };
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      mounted = false;
      subscription.remove();
      releaseAnimation.current?.stop();
      expansion.stopAnimation();
      opacity.stopAnimation();
    };
  }, [expansion, opacity]);

  React.useEffect(() => {
    if (disabled) {
      releaseAnimation.current?.stop();
      expansion.stopAnimation();
      opacity.stopAnimation();
      opacity.setValue(0);
    }
  }, [disabled, expansion, opacity]);

  return (
    <PressableScale
      {...props}
      disabled={disabled}
      scaleTo={0.94}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((previous) => previous.width === width && previous.height === height
          ? previous : { width, height });
        onLayout?.(event);
      }}
      onPressIn={(event) => {
        releaseAnimation.current?.stop();
        expansion.stopAnimation();
        opacity.stopAnimation();
        startedAt.current = Date.now();
        opacity.setValue(theme.dark ? 0.22 : 0.16);
        expansion.setValue(reduceMotion.current ? 1 : 0.12);
        if (!reduceMotion.current) {
          Animated.timing(expansion, {
            toValue: 1,
            duration: EXPAND_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // A quick tap still gets a full ripple; holding keeps it visible.
        const remaining = reduceMotion.current ? 0 : Math.max(0, EXPAND_DURATION - (Date.now() - startedAt.current));
        releaseAnimation.current = Animated.timing(opacity, {
          toValue: 0,
          delay: remaining,
          duration: reduceMotion.current ? 0 : 220,
          useNativeDriver: true,
        });
        releaseAnimation.current.start();
        onPressOut?.(event);
      }}
    >
      <Animated.View
        pointerEvents="none"
        accessible={false}
        collapsable={false}
        style={[
          styles.ripple,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            left: (size.width - diameter) / 2,
            top: (size.height - diameter) / 2,
            backgroundColor: theme.dark ? theme.colors.white : theme.colors.black,
            opacity,
            transform: [{ scale: expansion }],
          },
        ]}
      />
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  ripple: { position: 'absolute' },
});
