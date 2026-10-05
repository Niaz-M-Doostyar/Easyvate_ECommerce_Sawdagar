import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import PressableScale from './PressableScale';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack, right, showBack = true, style }) {
  const { theme } = useTheme();
  const { isRTL, lang } = useLanguage();
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.5 && width < 600;
  const c = theme.colors;
  const [sideWidth, setSideWidth] = useState(44);
  const syncSideWidth = useCallback((event) => {
    const measured = Math.max(44, Math.min(88, Math.ceil(event.nativeEvent.layout.width)));
    setSideWidth((current) => current === measured ? current : measured);
  }, []);

  const backControl = (
    <View style={[styles.leftWrap, { width: stacked ? 44 : sideWidth, display: showBack ? 'flex' : 'none' }]}>
      {showBack ? (
        <PressableScale onPress={onBack} disabled={!onBack}
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.borderLight }]}
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ps' ? 'شاته' : lang === 'dr' ? 'بازگشت' : 'Back'}
          accessibilityState={{ disabled: !onBack }}>
          <MaterialCommunityIcons name={isRTL ? 'chevron-right' : 'chevron-left'} size={25} color={c.text} />
        </PressableScale>
      ) : null}
    </View>
  );
  const rightControl = right ? <View onLayout={syncSideWidth} style={styles.rightWrap}>{right}</View> : <View onLayout={syncSideWidth} style={styles.sidePlaceholder} />;
  const titleContent = (
    <View style={[styles.titleWrap, !showBack && { paddingStart: 0 }, stacked && styles.stackedTitle]}>
      <Text accessibilityRole="header" numberOfLines={stacked ? undefined : 2} style={[styles.title, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      {subtitle ? <Text numberOfLines={stacked ? undefined : 2} style={[styles.subtitle, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.header, { backgroundColor: c.headerBg }, stacked && styles.stackedHeader, style]}>
      {stacked ? (
        <>
          {(showBack || right) ? <View style={[styles.controlRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {showBack ? backControl : <View style={styles.controlSpacer} />}
            {rightControl}
          </View> : null}
          {titleContent}
        </>
      ) : <>{backControl}{titleContent}{rightControl}</>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 76,
  },
  stackedHeader: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  controlRow: { minHeight: 44, alignItems: 'center', justifyContent: 'space-between' },
  controlSpacer: { width: 44 },
  stackedTitle: { flex: 0, width: '100%', paddingHorizontal: 0 },
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
    alignItems: 'stretch',
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    lineHeight: 30,
    fontWeight: fontWeight.heavy,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
