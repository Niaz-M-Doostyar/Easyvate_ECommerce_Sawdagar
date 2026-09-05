import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import HeroCard from '../../components/HeroCard';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight, borderRadius, hairline } from '../../theme';

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="About" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroCard
          style={styles.hero}
          contentStyle={{ marginTop: 0 }}
          right={<BrandLogo variant="symbol" size={72} style={{ opacity: 0.12 }} />}>
          <Text style={[styles.heroBrand, { color: c.heroText }]}>Sawdagar</Text>
          <Text style={[styles.heroText, { color: c.heroTextMuted }]}>Built for Afghanistan's modern marketplace with a unified mobile, website, and admin experience.</Text>
        </HeroCard>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: hairline, borderBottomColor: c.border }}>
      <Ionicons name={icon} size={18} color={c.primary} style={{ marginRight: 12 }} />
      <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, flex: 1 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg, paddingBottom: 120, alignItems: 'center' },
  hero: { width: '100%', marginTop: spacing.xl },
  heroBrand: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, letterSpacing: 0.2 },
  heroText: { fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.base, maxWidth: '84%' },
  version: { fontSize: fontSize.sm, marginTop: 4 },
  desc: { fontSize: fontSize.base, lineHeight: 24, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  infoCard: { width: '100%', borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base },
});
