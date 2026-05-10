import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, borderRadius, spacing } from '../theme';

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
  const c = theme.colors;
  const s = STATUS_MAP[status] || { label: status, colorKey: 'textMuted' };
  const color = c[s.colorKey] || c.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: color + '18' }]}>
      <Text style={[styles.text, { color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  text: { fontSize: fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
});
