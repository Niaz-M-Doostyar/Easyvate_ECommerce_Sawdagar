import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, fontWeight, borderRadius } from '../theme';
import PressableScale from './PressableScale';

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle, accessibilityLabel, ...rest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const inactive = Boolean(loading || disabled);
  const textColor = isPrimary ? c.white : isGhost ? c.textSecondary : theme.dark ? c.primary : c.primaryDark;
  const height = size === 'sm' ? 46 : size === 'lg' ? 58 : 54;
  const fs = size === 'sm' ? fontSize.sm : fontSize.base;
  const radius = size === 'sm' ? borderRadius.md + 2 : borderRadius.lg;
  const externalStyle = StyleSheet.flatten(style) || {};
  const externallySized = externalStyle.flex != null || externalStyle.width != null || externalStyle.minWidth != null || externalStyle.alignSelf === 'stretch';
  const flexSized = externalStyle.flex != null || externalStyle.flexGrow != null;
  const horizontalPadding = size === 'sm' ? 16 : size === 'lg' ? 26 : 22;
  const baseMinWidth = size === 'sm' ? 92 : size === 'lg' ? 172 : 144;
  const estimatedLabelWidth = String(title || '').length * fs * 0.62;
  const contentMinWidth = externallySized
    ? 0
    : Math.min(280, Math.max(baseMinWidth, estimatedLabelWidth + horizontalPadding * 2 + (icon ? 26 : 0)));

  const content = loading ? <ActivityIndicator color={textColor} size="small" /> : (
    <>
      {icon}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.text, { color: textColor, fontSize: fs, lineHeight: size === 'sm' ? 18 : 20 }, textStyle]}>{title}</Text>
    </>
  );

  return (
    <PressableScale
      {...rest}
      onPress={onPress}
      disabled={inactive}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          minWidth: contentMinWidth,
          borderRadius: radius,
          backgroundColor: isPrimary ? c.primaryDark : isOutline ? c.border : 'transparent',
          paddingBottom: isPrimary ? 3 : isOutline ? 2 : 0,
          opacity: disabled ? 0.45 : loading ? 0.8 : 1,
          shadowColor: isPrimary ? c.primaryDark : c.black,
          shadowOpacity: inactive || isGhost ? 0 : pressed ? 0.08 : isPrimary ? 0.2 : 0.04,
          shadowRadius: pressed ? 3 : 9,
          shadowOffset: { width: 0, height: pressed ? 1 : 5 },
          elevation: inactive || isGhost ? 0 : pressed ? 1 : isPrimary ? 4 : 1,
        },
        style,
      ]}
    >
      {({ pressed }) => {
        const faceStyle = [
          styles.face,
          {
            borderRadius: radius,
            paddingHorizontal: flexSized ? 12 : horizontalPadding,
            borderColor: isPrimary ? 'rgba(255,255,255,0.18)' : isOutline ? c.border : 'transparent',
            transform: [{ translateY: pressed && !inactive ? isPrimary ? 2 : 1 : 0 }],
          },
        ];

        return isPrimary ? (
          <LinearGradient
            colors={[theme.dark ? c.gradientStart : c.primary, c.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={faceStyle}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[faceStyle, { backgroundColor: pressed ? c.brandSurface : isOutline ? c.surface : 'transparent' }]}>
            {content}
          </View>
        );
      }}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'stretch', minWidth: 0 },
  face: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 8, overflow: 'hidden' },
  text: { flexShrink: 1, textAlign: 'center', textAlignVertical: 'center', fontWeight: fontWeight.bold, letterSpacing: 0.1, includeFontPadding: false },
});
