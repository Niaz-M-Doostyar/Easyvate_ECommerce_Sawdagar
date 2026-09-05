import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { fontSize, fontWeight, borderRadius, spacing } from '../theme';

const STATUS_MAP = {
  pending: { label: 'Pending', colorKey: 'warning' },
  confirmed: { label: 'Confirmed', colorKey: 'info' },
  shipped: { label: 'Shipped', colorKey: 'primary' },
  delivered: { label: 'Delivered', colorKey: 'success' },
  cancelled: { label: 'Cancelled', colorKey: 'error' },
  approved: { label: 'Approved', colorKey: 'success' },
  rejected: { label: 'Rejected', colorKey: 'error' },
  unpaid: { label: 'Unpaid', colorKey: 'warning' },
  paid: { label: 'Paid', colorKey: 'success' },
};

export default function StatusBadge({ status }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const s = STATUS_MAP[status] || { label: status, colorKey: 'textMuted' };
  const lightForegrounds = {
    warning: '#744600',
    info: '#075985',
    primary: c.primaryDark || c.primary,
    success: '#087443',
    error: '#B42318',
    textMuted: c.textSecondary,
  };
  const color = theme.dark ? (c[s.colorKey] || c.textSecondary) : lightForegrounds[s.colorKey];
  const label = t[status] || s.label || status;

  return (
    <View accessibilityRole="text" accessibilityLabel={`${t.status || 'Status'}: ${label}`} style={[styles.badge, { backgroundColor: color + '16', borderColor: color + '38' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 28, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1, alignSelf: 'flex-start' },
  dot: { width: 5, height: 5, borderRadius: borderRadius.full },
  text: { flexShrink: 1, fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
});
