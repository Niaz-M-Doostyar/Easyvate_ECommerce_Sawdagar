import React from 'react';
import { StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../theme';
import PressableScale from './PressableScale';

/**
 * Standard icon button used across all screens (back, search,
 * cart, share, close, etc.). Sizes preserve a comfortable touch target.
 * Rounded surface with a subtle raised edge and tactile press feedback.
 */
export default function IconButton({
  icon,
  onPress,
  size = 'md',
  color,
  bg,
  borderColor,
  badge,
  style,
  accessibilityLabel,
  disabled,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const dim = size === 'lg' ? 50 : 44;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 21;

  return (
    <PressableScale
      scaleTo={0.94}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={size === 'sm' ? 4 : 2}
      style={({ pressed }) => [
        styles.btn,
        {
          width: dim,
          height: dim,
          backgroundColor: bg || c.surfaceElevated,
          borderColor: borderColor || c.borderLight,
          borderBottomColor: borderColor || c.border,
          shadowColor: c.black,
          shadowOpacity: disabled ? 0 : pressed ? 0.02 : 0.06,
          elevation: disabled || pressed ? 0 : 2,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={iconSize} color={color || c.text} />
      {badge}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: borderRadius.lg - 2,
    borderWidth: 1,
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
