import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="About" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: c.secondary }]}> 
          <View style={[styles.heroGlow, { backgroundColor: c.primary + '22' }]} />
          <BrandLogo variant="symbol" size={72} style={styles.heroMark} />
          <BrandLogo width={188} />
          <Text style={styles.heroText}>Built for Afghanistan's modern marketplace with a unified mobile, website, and admin experience.</Text>
        </View>
        <Text style={[styles.version, { color: c.textMuted }]}>Version 1.0.0</Text>
        <Text style={[styles.desc, { color: c.textSecondary }]}>
          Sawdagar is Afghanistan's premier e-commerce marketplace connecting buyers with trusted local and international suppliers. Shop with confidence, enjoy competitive prices, and support Afghan businesses.
        </Text>
        <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <InfoRow icon="globe-outline" label="Website" value="sawdagar.af" c={c} />
          <InfoRow icon="mail-outline" label="Email" value="info@sawdagar.af" c={c} />
          <InfoRow icon="location-outline" label="Location" value="Kabul, Afghanistan" c={c} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, c }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Ionicons name={icon} size={18} color={c.primary} style={{ marginRight: 12 }} />
      <Text style={{ color: c.textSecondary, fontSize: 14, flex: 1 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, alignItems: 'center' },
  hero: { width: '100%', borderRadius: borderRadius.xxl, overflow: 'hidden', padding: spacing.xl, alignItems: 'flex-start', marginTop: spacing.xl },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -42, right: -24 },
  heroMark: { position: 'absolute', right: spacing.lg, top: spacing.lg, opacity: 0.12 },
  heroText: { color: '#D2DEFF', fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.base, maxWidth: '84%' },
  version: { fontSize: fontSize.sm, marginTop: 4 },
  desc: { fontSize: fontSize.base, lineHeight: 24, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  infoCard: { width: '100%', borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base },
});
