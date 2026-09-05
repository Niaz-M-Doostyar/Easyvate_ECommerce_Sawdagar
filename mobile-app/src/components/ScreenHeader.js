import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack, right, showBack = true, style }) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const c = theme.colors;
  const [sideWidth, setSideWidth] = useState(44);
  const syncSideWidth = useCallback((event) => {
    const measured = Math.max(44, Math.min(88, Math.ceil(event.nativeEvent.layout.width)));
    setSideWidth((current) => current === measured ? current : measured);
  }, []);

  return (
    <View style={[styles.header, { borderBottomColor: c.border }, style]}>
      <View style={[styles.leftWrap, { width: sideWidth }]}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            disabled={!onBack}
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.borderLight }]}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityState={{ disabled: !onBack }}
          >
            <MaterialCommunityIcons name={isRTL ? 'arrow-right' : 'arrow-left'} size={22} color={c.text} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.titleWrap}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.title, { color: c.text }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View onLayout={syncSideWidth} style={styles.rightWrap}>{right}</View> : <View onLayout={syncSideWidth} style={styles.sidePlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  leftWrap: { flexShrink: 0, alignItems: 'flex-start', justifyContent: 'center' },
  sidePlaceholder: { width: 44 },
  rightWrap: {
    minWidth: 44,
    maxWidth: 88,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
