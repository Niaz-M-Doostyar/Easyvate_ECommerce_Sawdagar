import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

/**
 * Shared horizontal filter chip row (order status tabs, product filters, ...).
 * tabs: [{ key, label, icon?, count? }]
 */
export default function FilterTabs({ tabs, activeKey, onChange, style }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.content}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            onPress={() => onChange(tab.key)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? c.primary : c.surface,
                borderColor: active ? c.primary : c.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {tab.icon ? (
              <MaterialCommunityIcons
                name={tab.icon}
                size={15}
                color={active ? c.white : c.textSecondary}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.label, { color: active ? c.white : c.textSecondary }]}
            >
              {tab.label}
            </Text>
            {tab.count != null ? (
              <View style={[styles.countPill, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.brandSurface }]}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.1} style={[styles.countText, { color: active ? c.white : c.primary }]}>{tab.count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { gap: spacing.sm, paddingHorizontal: spacing.base },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  label: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
  countPill: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontSize: fontSize.xs, lineHeight: 14, fontWeight: fontWeight.bold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
});
