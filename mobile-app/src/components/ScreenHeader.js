import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import PressableScale from './PressableScale';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack, right, showBack = true, style }) {
  const { theme } = useTheme();
  const { isRTL, lang } = useLanguage();
  const c = theme.colors;
  const [sideWidth, setSideWidth] = useState(44);
  const syncSideWidth = useCallback((event) => {
    const measured = Math.max(44, Math.min(88, Math.ceil(event.nativeEvent.layout.width)));
    setSideWidth((current) => current === measured ? current : measured);
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: c.headerBg }, style]}>
      <View style={[styles.leftWrap, { width: sideWidth }]}>
        {showBack ? (
          <PressableScale
            onPress={onBack}
            disabled={!onBack}
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.borderLight }]}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ps' ? 'شاته' : lang === 'dr' ? 'بازگشت' : 'Back'}
            accessibilityState={{ disabled: !onBack }}
          >
            <MaterialCommunityIcons name={isRTL ? 'chevron-right' : 'chevron-left'} size={25} color={c.text} />
          </PressableScale>
        ) : null}
      </View>
      <View style={styles.titleWrap}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.2} style={[styles.title, { color: c.text }]}>{title}</Text>
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
    paddingVertical: spacing.md,
    minHeight: 68,
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
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
    fontWeight: fontWeight.heavy,
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
