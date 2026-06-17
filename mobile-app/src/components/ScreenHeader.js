import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight } from '../theme';

export default function ScreenHeader({ title, onBack, right, showBack = true, style }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.header, { borderBottomColor: c.border }, style]}>
      {showBack ? (
        <TouchableOpacity onPress={() => onBack && onBack()} style={styles.iconBtn} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}
      <Text numberOfLines={1} style={[styles.title, { color: c.text }]}>{title}</Text>
      {right ? <View style={styles.rightWrap}>{right}</View> : <View style={styles.sidePlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  sidePlaceholder: {
    width: 40,
  },
  rightWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing.sm,
  },
});
