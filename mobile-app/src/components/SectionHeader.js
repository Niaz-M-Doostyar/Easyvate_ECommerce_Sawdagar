import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import PressableScale from './PressableScale';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const c = theme.colors;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      </View>
      {actionLabel && (
        <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={4} style={styles.actionWrap}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.action, { color: c.primary }]}>{actionLabel}</Text>
          <View style={[styles.arrow, { backgroundColor: c.brandSurface }]}>
            <MaterialCommunityIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={17} color={c.primary} />
          </View>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, marginTop: spacing.xl, marginBottom: spacing.md, minHeight: 36 },
  left: { flex: 1, minWidth: 0 },
  title: { flexShrink: 1, fontSize: fontSize.lg, lineHeight: 26, fontWeight: fontWeight.heavy },
  actionWrap: { maxWidth: '44%', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  arrow: { width: 26, height: 26, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  action: { flexShrink: 1, fontSize: fontSize.xs, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
});
