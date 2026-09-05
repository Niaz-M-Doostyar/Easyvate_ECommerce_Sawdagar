import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const c = theme.colors;
  return (
    <View style={styles.row}>
      <View style={styles.left}> 
        <View style={[styles.dot, { backgroundColor: c.primary + '20' }]} />
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={4} style={styles.actionWrap}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.action, { color: c.primary }]}>{actionLabel}</Text>
          <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={15} color={c.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginTop: spacing.lg, marginBottom: spacing.sm },
  left: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: borderRadius.full },
  title: { flexShrink: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, letterSpacing: 0.1 },
  actionWrap: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingStart: spacing.md },
  action: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
});
