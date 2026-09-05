import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { spacing, fontSize, fontWeight } from '../theme';

export default function EmptyState({ icon = 'bag-outline', title, subtitle, actionLabel, onAction }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: c.brandSurface }]}> 
        <Ionicons name={icon} size={36} color={c.primary} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
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
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  iconWrap: { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.base, textAlign: 'center' },
  sub: { fontSize: fontSize.base, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  actionWrap: { width: '100%', maxWidth: 280, marginTop: spacing.lg },
  actionButton: { width: '100%' },
});
