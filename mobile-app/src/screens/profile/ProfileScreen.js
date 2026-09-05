import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import EmptyState from '../../components/EmptyState';
import Gradient from '../../components/Gradient';
import ScreenHeader from '../../components/ScreenHeader';
import PressableScale from '../../components/PressableScale';
import { spacing, fontSize, fontWeight, borderRadius, hairline, shadows } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, logout, deleteAccount } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const [deleting, setDeleting] = React.useState(false);
  const c = theme.colors;

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title={t.profile} showBack={false} />
        <EmptyState
          icon="person-outline"
          title="Not logged in"
          subtitle="Sign in to manage your account"
          actionLabel={t.login}
          onAction={() => navigation.navigate('Auth', {
            screen: 'Login',
            params: { redirectTo: { tab: 'ProfileTab' } },
          })}
        />
      </SafeAreaView>
    );
  }

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  const handleLogout = () => {
    Alert.alert(t.logout, 'Are you sure?', [
      { text: t.cancel, style: 'cancel' },
      { text: t.logout, style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    if (deleting) return;
    Alert.alert(t.deleteAccountTitle, t.deleteAccountConfirm || t.deleteAccountWarning, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteAccount,
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteAccount();
            toast.success(t.accountDeleted);
          } catch (err) {
            toast.error(err.message || t.deleteAccountFailed);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const accountMenu = [
    { icon: 'account-edit-outline', label: t.editProfile, action: () => navigation.navigate('EditProfile') },
    { icon: 'clipboard-text-outline', label: t.orders, action: () => openTab('OrdersTab') },
    { icon: 'shield-lock-outline', label: t.changePassword, action: () => navigation.navigate('ChangePassword') },
  ];

  const businessMenu = [
    ...(user.role === 'supplier' ? [
      { icon: 'package-variant-closed', label: t.myProducts, action: () => navigation.navigate('SupplierProducts') },
      { icon: 'truck-delivery-outline', label: t.myOrders, action: () => navigation.navigate('SupplierOrders') },
      { icon: 'bullhorn-outline', label: t.sponsorships, action: () => navigation.navigate('SupplierSponsorships') },
    ] : []),
    ...(user.role === 'delivery' ? [
      { icon: 'bike-fast', label: t.assignedOrders, action: () => navigation.navigate('DeliveryOrders') },
    ] : []),
  ];

  const supportMenu = [
    { icon: 'tune-variant', label: t.settings, action: () => navigation.navigate('Settings') },
    { icon: 'shield-check-outline', label: 'Privacy Policy', action: () => navigation.navigate('PrivacyPolicy') },
    { icon: 'lifebuoy', label: t.contact, action: () => navigation.navigate('Contact') },
    { icon: 'information-outline', label: t.about, action: () => navigation.navigate('About') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Gradient colors={[c.secondary, c.primaryDark]} style={styles.profileHero}>
          <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]} />
          <View style={styles.heroHeader}>
            <Text accessibilityRole="header" style={[styles.heroBrand, { color: c.heroText }]}>{t.profile}</Text>
            <PressableScale accessibilityLabel={t.settings} onPress={() => navigation.navigate('Settings')} style={[styles.settingsAction, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]}>
              <MaterialCommunityIcons name="cog-outline" size={20} color={c.heroText} />
            </PressableScale>
          </View>
          <View style={styles.heroUserRow}>
            <View style={[styles.avatar, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]}>
              <Text style={[styles.avatarText, { color: c.heroText }]}>{user.name?.trim().charAt(0).toUpperCase() || 'S'}</Text>
            </View>
            <View style={styles.heroUserCopy}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text numberOfLines={1} style={[styles.userName, { color: c.heroText }]}>{user.name}</Text>
                {user?.emailVerified ? <MaterialCommunityIcons name="check-circle" size={16} color={c.heroText} style={{ marginStart: 8 }} /> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text numberOfLines={1} style={[styles.userEmail, { color: c.heroTextMuted }]}>{user.email}</Text>
              </View>
              {user.role === 'supplier' && user.companyName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ flexShrink: 1, color: c.heroTextMuted, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{user.companyName}</Text>
                </View>
              ) : null}
              {user.role === 'supplier' && (user.province || user.district || user.village || user.landmark) ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: c.heroTextMuted }}>{[user.province, user.district, user.village, user.landmark].filter(Boolean).join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.summaryRow}>
            <SummaryPill icon="clipboard-text-outline" label={t.orders} value={t.viewAll} onPress={() => openTab('OrdersTab')} c={c} />
            <SummaryPill icon="cart-outline" label={t.cart} value={`${count} ${t.items}`} onPress={() => openTab('CartTab')} c={c} />
          </View>
          <View style={styles.roleRow}>
            <MaterialCommunityIcons name="shield-account-outline" size={16} color={c.heroTextMuted} />
            <Text style={[styles.roleLabel, { color: c.heroTextMuted }]}>{t[user.role] || user.role}</Text>
          </View>
        </Gradient>

        <SectionLabel title={t.profile} c={c} />
        <MenuCard items={accountMenu} c={c} />

        {businessMenu.length > 0 && (
          <>
            <SectionLabel title="Business" c={c} />
            <MenuCard items={businessMenu} c={c} />
          </>
        )}

        <SectionLabel title="Support" c={c} />
        <MenuCard items={supportMenu} c={c} />

        <PressableScale onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
          <MaterialCommunityIcons name="logout" size={20} color={c.error} style={{ marginRight: 10 }} />
          <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.logoutText, { color: c.error }]}>{t.logout}</Text>
        </PressableScale>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityState={{ disabled: deleting, busy: deleting }}
          style={[
            styles.deleteBtn,
            deleting && { opacity: 0.6 },
          ]}
        >
          <MaterialCommunityIcons name="delete-forever-outline" size={20} color={c.error} style={{ marginRight: 10 }} />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} maxFontSizeMultiplier={1.15} style={[styles.deleteText, { color: c.error }]}>{deleting ? t.deleting : t.deleteAccount}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title, c }) {
  return <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{title}</Text>;
}

function SummaryPill({ icon, label, value, onPress, c }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${label}, ${value}`} style={[styles.summaryPill, { backgroundColor: c.heroSurface, borderColor: c.heroBorder }]}>
      <View style={styles.summaryHeader}>
        <MaterialCommunityIcons name={icon} size={21} color={c.heroText} />
        <MaterialCommunityIcons name="arrow-top-right" size={16} color={c.heroTextMuted} />
      </View>
      <Text style={[styles.summaryLabel, { color: c.heroTextMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: c.heroText }]}>{value}</Text>
    </PressableScale>
  );
}

function MenuCard({ items, c }) {
  return (
    <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
      {items.map((item, index) => (
        <TouchableOpacity key={item.label} accessibilityRole="button" onPress={item.action} activeOpacity={0.65} style={[styles.menuItem, index < items.length - 1 && { borderBottomColor: c.borderLight, borderBottomWidth: hairline }]}>
          <View style={[styles.menuIcon, { backgroundColor: c.brandSurface }]}>
            <MaterialCommunityIcons name={item.icon} size={19} color={c.primary} />
          </View>
          <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} style={{ marginStart: spacing.sm }} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.base, paddingBottom: spacing.xxxl },
  profileHero: { padding: spacing.lg, borderRadius: borderRadius.xxl, overflow: 'hidden', marginBottom: spacing.base },
  heroGlow: { position: 'absolute', top: -76, right: -78, width: 260, height: 260, borderRadius: 130, borderWidth: 1 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroBrand: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.2 },
  settingsAction: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  heroUserRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  heroUserCopy: { flex: 1, minWidth: 0, marginStart: spacing.base },
  avatar: { width: 68, height: 68, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  userName: { flexShrink: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  userEmail: { flexShrink: 1, fontSize: fontSize.sm, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  summaryPill: { flex: 1, minWidth: 0, borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.md },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSize.xs, marginTop: 8 },
  summaryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginTop: 4, textTransform: 'capitalize' },
  roleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.base },
  roleLabel: { flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.sm },
  menuCard: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.base, ...shadows.sm },
  menuItem: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginEnd: 14 },
  menuLabel: { flex: 1, minWidth: 0, fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.medium, includeFontPadding: false, textAlignVertical: 'center' },
  logoutBtn: { minHeight: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  logoutText: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
  deleteBtn: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  deleteText: { flexShrink: 1, fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
});
