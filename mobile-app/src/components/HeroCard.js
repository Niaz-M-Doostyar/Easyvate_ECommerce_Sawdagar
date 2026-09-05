import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

/**
 * Shared dark hero card used at the top of screens (cart, checkout, orders,
 * profile, about, ...). Renders the brand ink surface with a soft glow and an
 * optional uppercase eyebrow / title / subtitle header. Any custom content can
 * be passed as `children` below the header.
 */
export default function HeroCard({ eyebrow, title, subtitle, right, children, style, contentStyle }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.hero, { backgroundColor: c.secondary }, style]}>
      <View style={[styles.glow, { backgroundColor: c.primary + '22' }]} />
      {right ? <View style={styles.right}>{right}</View> : null}
      {eyebrow ? <Text style={[styles.eyebrow, { color: c.heroTextMuted }]}>{eyebrow}</Text> : null}
      {title ? <Text style={[styles.title, { color: c.heroText }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: c.heroTextMuted }]}>{subtitle}</Text> : null}
      {children ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -46,
    right: -28,
  },
  right: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: 4,
  },
  content: {
    marginTop: spacing.md,
  },
});
