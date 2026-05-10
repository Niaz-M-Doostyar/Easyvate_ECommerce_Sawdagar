import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight } from '../theme';

export default function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.row}>
      <View style={styles.left}> 
        <View style={[styles.dot, { backgroundColor: c.primary + '20' }]} />
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} style={styles.actionWrap}>
          <Text style={[styles.action, { color: c.primary }]}>{actionLabel}</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color={c.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginTop: spacing.xl, marginBottom: spacing.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  actionWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  action: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
