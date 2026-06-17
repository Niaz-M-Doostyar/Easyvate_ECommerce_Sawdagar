import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BrandLogo from '../../components/BrandLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import EmptyState from '../../components/EmptyState';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

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
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <EmptyState
          icon="person-outline"
          title="Not logged in"
          subtitle="Sign in to manage your account"
          actionLabel={t.login}
          onAction={() => navigation.navigate('Auth', { redirectTo: { tab: 'ProfileTab' } })}
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
        <View style={[styles.profileHero, { backgroundColor: c.secondary }]}> 
          <View style={[styles.heroGlow, { backgroundColor: c.primary + '22' }]} />
          <View style={styles.heroHeader}>
            <BrandLogo width={142} />
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.settingsAction, { backgroundColor: 'rgba(255,255,255,0.1)' }]}> 
              <MaterialCommunityIcons name="cog-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroUserRow}>
            <View style={[styles.avatar, { backgroundColor: '#FFFFFF14' }]}> 
              <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.heroUserCopy}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{user.name}</Text>
                {user?.emailVerified ? <MaterialCommunityIcons name="check-circle" size={16} color={c.primary} style={{ marginLeft: 8 }} /> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user?.emailVerified ? <MaterialCommunityIcons name="shield-check-outline" size={14} color={c.primary} style={{ marginLeft: 8 }} /> : null}
              </View>
              {user.role === 'supplier' && user.companyName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ color: '#D6E5FF', fontSize: 14, fontWeight: '600' }}>{user.companyName}</Text>
                  {user?.emailVerified ? <MaterialCommunityIcons name="badge-account" size={14} color={c.primary} style={{ marginLeft: 8 }} /> : null}
                </View>
              ) : null}
              {user.role === 'supplier' && (user.province || user.district || user.village || user.landmark) ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: c.textSecondary }}>{[user.companyName, user.province, user.district, user.village, user.landmark].filter(Boolean).join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.summaryRow}>
            <SummaryPill icon="clipboard-text-outline" label={t.orders} value="History" c={c} />
            <SummaryPill icon="cart-outline" label={t.cart} value={`${count} item${count === 1 ? '' : 's'}`} c={c} />
            <SummaryPill icon="shield-account-outline" label={t.role} value={user.role} c={c} />
          </View>
        </View>

        <SectionLabel title="Account" c={c} />
        <MenuCard items={accountMenu} c={c} />

        {businessMenu.length > 0 && (
          <>
            <SectionLabel title="Business" c={c} />
            <MenuCard items={businessMenu} c={c} />
          </>
        )}

        <SectionLabel title="Support" c={c} />
        <MenuCard items={supportMenu} c={c} />

        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: c.error + '10', borderColor: c.error + '30' }]}> 
          <MaterialCommunityIcons name="logout" size={20} color={c.error} style={{ marginRight: 10 }} />
          <Text style={[styles.logoutText, { color: c.error }]}>{t.logout}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={deleting}
          style={[
            styles.deleteBtn,
            { backgroundColor: c.error + '08', borderColor: c.error + '24' },
            deleting && { opacity: 0.6 },
          ]}
        >
          <MaterialCommunityIcons name="delete-forever-outline" size={20} color={c.error} style={{ marginRight: 10 }} />
          <Text style={[styles.deleteText, { color: c.error }]}>{deleting ? t.deleting : t.deleteAccount}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title, c }) {
  return <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{title}</Text>;
}

function SummaryPill({ icon, label, value, c }) {
  return (
    <View style={[styles.summaryPill, { backgroundColor: 'rgba(255,255,255,0.08)' }]}> 
      <MaterialCommunityIcons name={icon} size={18} color="#D6E5FF" />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MenuCard({ items, c }) {
  return (
    <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}> 
      {items.map((item, index) => (
        <TouchableOpacity key={item.label} onPress={item.action} style={[styles.menuItem, index < items.length - 1 && { borderBottomColor: c.border, borderBottomWidth: 0.5 }]}> 
          <View style={[styles.menuIcon, { backgroundColor: c.brandSurface }]}> 
            <MaterialCommunityIcons name={item.icon} size={19} color={c.primary} />
          </View>
          <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.base },
  profileHero: { padding: spacing.xl, borderRadius: borderRadius.xxl, overflow: 'hidden', marginBottom: spacing.base },
  heroGlow: { position: 'absolute', top: -54, right: -18, width: 180, height: 180, borderRadius: 90 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsAction: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  heroUserRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  heroUserCopy: { flex: 1, marginLeft: spacing.base },
  avatar: { width: 74, height: 74, borderRadius: 37, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  userEmail: { fontSize: fontSize.sm, marginTop: 4, color: '#D6E5FF' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  summaryPill: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  summaryLabel: { fontSize: fontSize.xs, color: '#BDD0FF', marginTop: 8 },
  summaryValue: { fontSize: fontSize.sm, fontWeight: '700', color: '#FFFFFF', marginTop: 4, textTransform: 'capitalize' },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.sm },
  menuCard: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.base },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.base },
  menuIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { fontSize: fontSize.base, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1 },
  logoutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  deleteText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
