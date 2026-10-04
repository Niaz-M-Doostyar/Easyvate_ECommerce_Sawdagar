import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, fontWeight } from '../theme';
import PressableScale from './PressableScale';

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style, textStyle, accessibilityLabel, ...rest }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { fontScale } = useWindowDimensions();
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const inactive = Boolean(loading || disabled);
  const textColor = isPrimary ? c.white : isGhost ? c.textSecondary : theme.dark ? c.primary : c.primaryDark;
  const baseHeight = size === 'sm' ? 44 : size === 'lg' ? 54 : 50;
  const height = fontScale > 1.15 ? Math.max(baseHeight, Math.ceil(44 * fontScale + 16)) : baseHeight;
  const fs = size === 'sm' ? fontSize.sm : fontSize.base;
  const radius = size === 'sm' ? 12 : 16;
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
      <Text numberOfLines={2} style={[styles.text, { color: textColor, fontSize: fs, lineHeight: size === 'sm' ? 20 : 22 }, textStyle]}>{title}</Text>
    </>
  );

  return (
    <PressableScale
      {...rest}
      onPress={onPress}
      disabled={inactive}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          minWidth: contentMinWidth,
          borderRadius: radius,
          backgroundColor: 'transparent',
          opacity: disabled ? 0.45 : loading ? 0.8 : 1,
          shadowOpacity: 0,
          elevation: 0,
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
            borderColor: isOutline ? c.border : 'transparent',
          },
        ];

        return isPrimary ? (
          <LinearGradient
            colors={[c.primaryDark, c.primaryDark]}
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
  text: { flexShrink: 1, textAlign: 'center', textAlignVertical: 'center', fontWeight: fontWeight.semibold, letterSpacing: 0, includeFontPadding: false },
});
