import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Brand gradient wrapper. Defaults to the primary brand gradient
 * (cobalt light -> cobalt dark) at a diagonal angle. Pass `colors`
 * to override, or `variant` for presets: 'primary' | 'hero' | 'accent'.
 */
export default function Gradient({
  children,
  style,
  colors,
  variant = 'primary',
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  ...rest
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const presets = {
    primary: [c.gradientStart, c.gradientEnd],
    hero: [c.secondary, c.navy || '#0B1220'],
    accent: [c.primary, c.primaryDark],
  };

  const resolved = colors || presets[variant] || presets.primary;

  return (
    <LinearGradient
      colors={resolved}
      start={start}
      end={end}
      style={[styles.base, style]}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
