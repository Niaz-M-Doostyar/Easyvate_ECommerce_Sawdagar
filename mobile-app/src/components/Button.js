import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const bg = isPrimary ? c.primary : isOutline ? c.surface : 'transparent';
  const border = isOutline ? c.border : 'transparent';
  const textColor = isPrimary ? c.white : isGhost ? c.text : c.primaryDark || c.primary;
  const h = size === 'sm' ? 40 : size === 'lg' ? 58 : 50;
  const fs = size === 'sm' ? fontSize.sm : size === 'lg' ? fontSize.md : fontSize.base;

  return (
    <TouchableOpacity
      activeOpacity={0.8} onPress={onPress} disabled={loading || disabled}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          height: h,
          opacity: disabled ? 0.5 : 1,
        },
        isPrimary && {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 22,
          elevation: 6,
        },
        isOutline && { borderWidth: 1.2 },
        isGhost && { borderWidth: 1, borderColor: c.borderLight },
        style,
      ]}>
      {loading ? <ActivityIndicator color={textColor} size="small" /> : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize: fs }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, gap: 10 },
  text: { fontWeight: fontWeight.semibold, letterSpacing: 0.2 },
});
