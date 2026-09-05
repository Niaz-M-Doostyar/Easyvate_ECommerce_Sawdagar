import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';

export default function EmptyState({ icon = 'bag-outline', title, subtitle, actionLabel, onAction }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.wrap}>
      <View style={[styles.illustration, { backgroundColor: c.brandSurface }]}>
        <View style={[styles.orbit, { borderColor: c.primary + '18' }]} />
        <View style={[styles.iconWrap, shadows.md, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <Ionicons name={icon} size={36} color={c.primary} />
        </View>
        <View style={[styles.spark, { backgroundColor: c.accent || c.primary, borderColor: c.background }]} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.sub, { color: c.textSecondary }]}>{subtitle}</Text>}
      {actionLabel ? (
        <View style={styles.actionWrap}>
          <Button title={actionLabel} onPress={onAction} style={styles.actionButton} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  illustration: { width: 116, height: 116, borderRadius: 58, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  orbit: { position: 'absolute', width: 136, height: 136, borderWidth: 1, borderRadius: 68 },
  iconWrap: { width: 76, height: 76, borderRadius: borderRadius.xl, borderWidth: 1, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }] },
  spark: { position: 'absolute', top: 7, end: 3, width: 18, height: 18, borderRadius: 9, borderWidth: 4 },
  title: { maxWidth: 320, fontSize: fontSize.xl, fontWeight: fontWeight.heavy, marginTop: spacing.lg, textAlign: 'center', lineHeight: 31 },
  sub: { maxWidth: 300, fontSize: fontSize.base, marginTop: spacing.sm, textAlign: 'center', lineHeight: 23 },
  actionWrap: { width: '100%', maxWidth: 280, marginTop: spacing.xl },
  actionButton: { width: '100%' },
});
