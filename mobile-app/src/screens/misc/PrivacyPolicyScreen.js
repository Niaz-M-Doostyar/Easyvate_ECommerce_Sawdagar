import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '../../theme';

const POLICY_SECTIONS = [
  {
    title: 'Information we collect',
    body:
      'Sawdagar may collect the information you provide directly in the app, including your name, phone number, email address, delivery address, and order details.',
  },
  {
    title: 'How we use your information',
    body:
      'We use your information to create and manage your account, process orders, arrange delivery, respond to support requests, and improve the shopping experience.',
  },
  {
    title: 'Sharing and protection',
    body:
      'We only share information needed to fulfill your order or operate the service, such as with delivery staff, suppliers, or service providers. We work to protect account information and limit internal access to authorized team members.',
  },
  {
    title: 'Location usage',
    body:
      'If you allow location access, the app may use your location to help estimate delivery coverage and improve delivery coordination in your area.',
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const handleEmailPress = () => {
    Linking.openURL('mailto:easyvate33@gmail.com?subject=Sawdagar%20Account%20Deletion%20Request').catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: c.secondary }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.primary + '22' }]} />
          <Text style={styles.heroEyebrow}>Sawdagar Privacy</Text>
          <Text style={styles.heroTitle}>How we collect, use, and protect account information inside the app.</Text>
          <Text style={styles.heroBody}>Last updated: April 2026</Text>
        </View>

        {POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{section.title}</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>{section.body}</Text>
          </View>
        ))}

        <View style={[styles.deleteCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.deleteIcon, { backgroundColor: c.brandSurface }]}>
            <Ionicons name="mail-open-outline" size={22} color={c.primary} />
          </View>
          <View style={styles.deleteCopy}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Account deletion requests</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>If someone wants to delete a Sawdagar account, they should contact easyvate33@gmail.com. Send the request from the same email address or include the phone number linked to the account so the team can verify ownership.</Text>
          </View>
          <TouchableOpacity onPress={handleEmailPress} style={[styles.emailButton, { backgroundColor: c.primary }]}>
            <Text style={styles.emailButtonText}>Email us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  hero: { borderRadius: borderRadius.xxl, overflow: 'hidden', padding: spacing.xl, marginBottom: spacing.base },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -46, right: -18 },
  heroEyebrow: { color: '#BDD0FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: 30, marginTop: spacing.sm, maxWidth: '88%' },
  heroBody: { color: '#D6E5FF', fontSize: fontSize.sm, marginTop: spacing.sm },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.base },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  cardBody: { fontSize: fontSize.sm, lineHeight: 22 },
  deleteCard: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginTop: spacing.sm },
  deleteIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base },
  deleteCopy: { marginBottom: spacing.base },
  emailButton: { alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  emailButtonText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});