import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const border = isOutline ? c.border : 'transparent';
  const textColor = isPrimary
    ? c.white
    : isGhost
      ? c.text
      : theme.dark
        ? c.primary
        : c.primaryDark || c.primary;
  const h = size === 'sm' ? 44 : size === 'lg' ? 56 : 50;
  const fs = size === 'sm' ? fontSize.sm : size === 'lg' ? fontSize.base : fontSize.base;
  const lineHeight = size === 'sm' ? 18 : 20;
  const externalStyle = StyleSheet.flatten(style) || {};
  const externallySized = externalStyle.flex != null || externalStyle.width != null || externalStyle.minWidth != null || externalStyle.alignSelf === 'stretch';
  const flexSized = externalStyle.flex != null || externalStyle.flexGrow != null;
  const horizontalPadding = size === 'sm' ? 16 : size === 'lg' ? 26 : 22;
  const appliedPadding = flexSized ? 12 : horizontalPadding;
  const baseMinWidth = size === 'sm' ? 92 : size === 'lg' ? 172 : 144;
  const estimatedLabelWidth = String(title || '').length * fs * 0.62;
  const contentMinWidth = externallySized
    ? 0
    : Math.min(280, Math.max(baseMinWidth, estimatedLabelWidth + horizontalPadding * 2 + (icon ? 26 : 0)));

  const content = loading ? <ActivityIndicator color={textColor} size="small" /> : (
    <>
      {icon}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.text, { color: textColor, fontSize: fs, lineHeight }, textStyle]}>{title}</Text>
    </>
  );

  if (isPrimary) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        disabled={loading || disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: Boolean(loading || disabled), busy: Boolean(loading) }}
        style={[
          styles.primaryShadow,
          { shadowColor: c.primary, height: h, minWidth: contentMinWidth, opacity: loading || disabled ? 0.55 : 1, borderRadius: borderRadius.full },
          style,
        ]}>
        <LinearGradient
          colors={[c.gradientStart, c.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, styles.fill, { borderRadius: borderRadius.full, paddingHorizontal: appliedPadding }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(loading || disabled), busy: Boolean(loading) }}
      style={[
        styles.btn,
        {
          backgroundColor: isOutline ? c.surface : 'transparent',
          borderColor: border,
          height: h,
          minWidth: contentMinWidth,
          opacity: loading || disabled ? 0.55 : 1,
          paddingHorizontal: appliedPadding,
        },
        isOutline && { borderWidth: 1 },
        isGhost && { borderWidth: 1, borderColor: c.borderLight },
        style,
      ]}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { minWidth: 0, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.full, gap: 8, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  primaryShadow: { alignSelf: 'stretch', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 5 },
  text: { flexShrink: 1, textAlign: 'center', textAlignVertical: 'center', fontWeight: fontWeight.bold, letterSpacing: 0.1, includeFontPadding: false },
});
