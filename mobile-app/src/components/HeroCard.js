import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

/**
 * Shared dark hero card used at the top of screens (cart, checkout, orders,
 * profile, about, ...). Renders a layered brand surface with a soft glow and an
 * optional uppercase eyebrow / title / subtitle header. Any custom content can
 * be passed as `children` below the header.
 */
export default function HeroCard({ eyebrow, title, subtitle, right, children, style, contentStyle }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const c = theme.colors;
  const hasHeading = Boolean(eyebrow || title || subtitle);
  const textAlignment = { textAlign: isRTL ? 'right' : 'left' };

  return (
    <View style={[styles.hero, { backgroundColor: c.secondary, borderColor: c.heroBorder }, style]}>
      {(hasHeading || right) ? <View style={styles.headingRow}>
        <View style={styles.heading}>
          {eyebrow ? <Text style={[styles.eyebrow, textAlignment, { color: c.heroTextMuted }]}>{eyebrow}</Text> : null}
          {title ? <Text accessibilityRole="header" style={[styles.title, textAlignment, { color: c.heroText }]}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.subtitle, textAlignment, { color: c.heroTextMuted }]}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View> : null}
      {children ? <View style={[hasHeading && styles.content, hasHeading && { borderTopColor: c.heroBorder }, contentStyle]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    borderWidth: 1,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heading: { flex: 1, minWidth: 0 },
  right: {
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  content: {
    marginTop: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: 1,
  },
});
