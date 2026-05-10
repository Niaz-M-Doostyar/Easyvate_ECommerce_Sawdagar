import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

export default function PortalHubScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const c = theme.colors;

  const cards = [
    {
      key: 'website',
      title: 'Full Website',
      subtitle: 'Browse every storefront page, content screen, and customer flow inside the app.',
      icon: 'globe-outline',
      variant: 'website',
      initialPath: '/',
      accent: c.primary,
    },
    {
      key: 'dashboard',
      title: 'Customer Dashboard',
      subtitle: 'Open orders, profile, and account tools exactly as they exist on the website.',
      icon: 'grid-outline',
      variant: 'website',
      initialPath: '/dashboard',
      requiresAuth: true,
      accent: c.info,
    },
    ...((user?.role === 'supplier' || user?.role === 'admin') ? [{
      key: 'supplier',
      title: 'Supplier Console',
      subtitle: 'Use the full supplier workspace from the admin app for products, orders, and sponsorships.',
      icon: 'storefront-outline',
      variant: 'admin',
      initialPath: '/supplier',
      requiresAuth: true,
      allowedRoles: ['supplier', 'admin'],
      accent: c.success,
    }] : []),
    ...((user?.role === 'delivery' || user?.role === 'admin') ? [{
      key: 'delivery',
      title: 'Delivery Center',
      subtitle: 'Run delivery updates and operational pages inside the same mobile shell.',
      icon: 'bicycle-outline',
      variant: 'website',
      initialPath: '/delivery',
      requiresAuth: true,
      allowedRoles: ['delivery', 'admin'],
      accent: c.warning,
    }] : []),
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      title: 'Admin Console',
      subtitle: 'Access reports, approvals, users, orders, content, and database tools from mobile.',
      icon: 'shield-checkmark-outline',
      variant: 'admin',
      initialPath: '/admin',
      requiresAuth: true,
      allowedRoles: ['admin'],
      accent: c.secondary,
    }] : []),
  ];

  const openCard = (card) => {
    if (card.requiresAuth && !user) {
      navigation.navigate('Auth');
      return;
    }

    navigation.navigate('Portal', {
      title: card.title,
      variant: card.variant,
      initialPath: card.initialPath,
      requiresAuth: card.requiresAuth,
      allowedRoles: card.allowedRoles,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Command Center</Text>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Full website and admin parity, routed through a mobile shell.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, shadows.lg, { backgroundColor: c.card, borderColor: c.border }]}> 
          <View style={[styles.heroBadge, { backgroundColor: c.primary + '14' }]}> 
            <Ionicons name="sparkles-outline" size={18} color={c.primary} />
            <Text style={[styles.heroBadgeText, { color: c.primary }]}>Hybrid Access Layer</Text>
          </View>
          <Text style={[styles.heroTitle, { color: c.text }]}>Native shopping where speed matters, full portals where parity matters.</Text>
          <Text style={[styles.heroBody, { color: c.textSecondary }]}>This layer keeps cart, checkout, orders, and product browsing native while giving you the complete website and admin surfaces inside the app.</Text>
          <View style={styles.heroStats}>
            <StatPill label="Native" value="Shop" c={c} />
            <StatPill label="Website" value="Full" c={c} />
            <StatPill label="Admin" value="Ready" c={c} />
          </View>
        </View>

        {cards.map((card) => (
          <TouchableOpacity
            key={card.key}
            activeOpacity={0.88}
            onPress={() => openCard(card)}
            style={[styles.portalCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.portalIcon, { backgroundColor: card.accent + '14' }]}> 
              <Ionicons name={card.icon} size={22} color={card.accent} />
            </View>
            <View style={styles.portalCopy}>
              <Text style={[styles.portalTitle, { color: c.text }]}>{card.title}</Text>
              <Text style={[styles.portalBody, { color: c.textSecondary }]}>{card.subtitle}</Text>
              {card.requiresAuth && !user && (
                <Text style={[styles.portalHint, { color: c.primary }]}>Sign in to open this workspace.</Text>
              )}
            </View>
            <Ionicons name="arrow-forward" size={18} color={c.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value, c }) {
  return (
    <View style={[styles.statPill, { backgroundColor: c.background }]}> 
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: spacing.base, borderBottomWidth: 1 },
  headerAction: { padding: 8, marginRight: spacing.sm },
  headerCopy: { flex: 1, paddingTop: 4 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  headerSubtitle: { fontSize: fontSize.sm, marginTop: 4, lineHeight: 20 },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  heroCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.base },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  heroBadgeText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '800', lineHeight: 30, marginTop: spacing.base },
  heroBody: { fontSize: fontSize.base, lineHeight: 24, marginTop: spacing.sm },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  statPill: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  statLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: fontSize.md, fontWeight: '800', marginTop: 4 },
  portalCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.base, marginBottom: 12 },
  portalIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: spacing.base },
  portalCopy: { flex: 1, paddingRight: spacing.base },
  portalTitle: { fontSize: fontSize.base, fontWeight: '800' },
  portalBody: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
  portalHint: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 8 },
});