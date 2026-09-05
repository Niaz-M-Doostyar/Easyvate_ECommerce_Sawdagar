import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius } from '../theme';

/**
 * Standard circular icon button used across all screens (back, search,
 * cart, share, close, etc.). Sizes preserve a comfortable touch target.
 * Always fully round with a consistent hairline border + surface fill.
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

  const dim = size === 'sm' ? 38 : size === 'lg' ? 48 : 44;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 21;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={size === 'sm' ? 4 : 2}
      style={[
        styles.btn,
        {
          width: dim,
          height: dim,
          backgroundColor: bg || c.surfaceElevated,
          borderColor: borderColor || c.borderLight,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={iconSize} color={color || c.text} />
      {badge}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
