import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight, borderRadius, hairline } from '../../theme';

export default function SettingsScreen({ navigation }) {
  const { theme, themeKey, switchTheme, allThemes } = useTheme();
  const { lang, setLang, t, langs } = useLanguage();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.settings} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Language */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{t.language}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {Object.entries(langs).map(([key, val]) => (
            <TouchableOpacity key={key} onPress={() => setLang(key)}
              style={[styles.row, key !== Object.keys(langs).pop() && { borderBottomColor: c.border, borderBottomWidth: hairline }]}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>{val.flag}</Text>
              <Text style={[styles.rowLabel, { color: c.text }]}>{val.label}</Text>
              {lang === key && <Ionicons name="checkmark-circle" size={22} color={c.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{t.theme}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {allThemes.map((th, i) => (
            <TouchableOpacity key={th.key} onPress={() => switchTheme(th.key)}
              style={[styles.row, i < allThemes.length - 1 && { borderBottomColor: c.border, borderBottomWidth: hairline }]}>
              <View style={[styles.colorDot, { backgroundColor: th.colors.primary }]} />
              <View>
                <Text style={[styles.rowLabel, { color: c.text }]}>{th.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{th.mode}</Text>
              </View>
              {themeKey === th.key && <Ionicons name="checkmark-circle" size={22} color={c.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Legal</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}> 
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={20} color={c.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: c.text }]}>Privacy Policy</Text>
              <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 4 }}>Account deletion requests: supports@sawdagaraf.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.base, paddingBottom: 120 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  rowLabel: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.medium, includeFontPadding: false, textAlignVertical: 'center' },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginRight: 12 },
});
