import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button';
import HeroCard from '../../components/HeroCard';
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
    Linking.openURL('mailto:supports@sawdagaraf.com?subject=Sawdagar%20Account%20Deletion%20Request').catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroCard
          eyebrow="Sawdagar Privacy"
          title="How we collect, use, and protect account information inside the app."
          subtitle="Last updated: April 2026"
          style={styles.hero}
        />

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
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>If someone wants to delete a Sawdagar account, they should contact supports@sawdagaraf.com. Send the request from the same email address or include the phone number linked to the account so the team can verify ownership.</Text>
          </View>
          <Button
            variant="primary"
            size="sm"
            title="Email us"
            onPress={handleEmailPress}
            icon={<Ionicons name="mail-outline" size={16} color={c.white} />}
            style={styles.emailButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.base, paddingBottom: 120 },
  hero: { marginBottom: spacing.base },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.base },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  cardBody: { fontSize: fontSize.sm, lineHeight: 22 },
  deleteCard: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginTop: spacing.sm },
  deleteIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base },
  deleteCopy: { marginBottom: spacing.base },
  emailButton: { alignSelf: 'flex-start' },
});
