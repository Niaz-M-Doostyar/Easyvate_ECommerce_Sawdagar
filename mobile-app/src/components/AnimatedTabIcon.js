import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AnimatedTabIcon({ focused, selected, name, color, backgroundColor, width }) {
  const progress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    // Reanimated honors the system Reduce Motion setting by default.
    // Navigation keeps separate active/inactive icons mounted; animate the
    // actual selected route rather than those fixed icon variants.
    progress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, progress]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: focused ? progress.value : 0,
    transform: [{ scale: 0.75 + progress.value * 0.25 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.08 }],
  }));

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View pointerEvents="none" style={[styles.highlight, { backgroundColor }, highlightStyle]} />
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons name={name} size={23} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 32, justifyContent: 'center', alignItems: 'center' },
  highlight: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
});
