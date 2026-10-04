import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
const copy = {
  en: ['YOUR EVERYDAY MARKETPLACE', 'Good finds.\nCloser to home.', 'Discover essentials and new arrivals from sellers across Afghanistan.'],
  ps: ['ستاسو ورځنی بازار', 'غوره توکي،\nتاسو ته نږدې.', 'د افغانستان له پلورونکو څخه نوي محصولات او ورځني توکي ومومئ.'],
  dr: ['بازار روزمره شما', 'انتخاب‌های خوب،\nنزدیک‌تر به شما.', 'کالاهای ضروری و تازه را از فروشندگان سراسر افغانستان پیدا کنید.'],
};
export default function MarketplaceIntro() {
  const { theme } = useTheme();
  const { lang, isRTL } = useLanguage();
  const { isTablet } = useResponsiveLayout();
  const [eyebrow, title, subtitle] = copy[lang] || copy.en;
  const c = theme.colors;
  return <View style={[styles.wrap, { flexDirection: isTablet ? (isRTL ? 'row-reverse' : 'row') : 'column' }]}>
    <View style={{ flex: isTablet ? 1 : undefined }}>
      <Text style={[styles.eyebrow, { color: c.primary, textAlign: isRTL ? 'right' : 'left' }]}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: isTablet ? 44 : 26, lineHeight: isTablet ? 52 : 32, color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{isTablet ? title : title.replace('\n', ' ')}</Text>
    </View>
    <Text style={[styles.subtitle, { flex: isTablet ? 0.7 : undefined, color: c.textSecondary, textAlign: isRTL ? 'right' : 'left', alignSelf: isTablet ? 'flex-end' : 'stretch' }]}>{subtitle}</Text>
  </View>;
}
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 10 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', marginBottom: 8 },
  title: { fontWeight: '600', letterSpacing: -1.1 },
  subtitle: { fontSize: 14, lineHeight: 22, maxWidth: 440 },
});
