import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { ordersApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

const TABS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const c = theme.colors;
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const data = await ordersApi.list();
      setOrders(data.orders || data || []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const visibleOrders = tab === 'all' ? orders : orders.filter(order => order.status === tab);
  const activeOrders = orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <EmptyState
          icon="log-in-outline"
          title="Please login"
          subtitle="Sign in to track deliveries and review your purchase history."
          actionLabel={t.login}
          onAction={() => navigation.navigate('Auth', { redirectTo: { tab: 'OrdersTab' } })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{t.orders}</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Track every purchase from checkout to delivery.</Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: c.secondary }, shadows.lg]}>
        <Text style={styles.heroEyebrow}>Purchase history</Text>
        <Text style={styles.heroTitle}>Keep every order and status update in one place.</Text>
        <View style={styles.heroStats}>
          <OrderStat icon="clipboard-text-clock-outline" label="Active" value={String(activeOrders)} />
          <OrderStat icon="check-decagram-outline" label="Delivered" value={String(deliveredOrders)} />
          <OrderStat icon="basket-check-outline" label="Total" value={String(orders.length)} />
        </View>
      </View>

      <FlatList
        horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}
        data={TABS} keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setTab(item)}
            style={[styles.tabBtn, { backgroundColor: tab === item ? c.primary : c.card, borderColor: tab === item ? c.primary : c.border }]}>
            <Text style={{ color: tab === item ? '#FFF' : c.text, fontSize: fontSize.sm, fontWeight: '500', textTransform: 'capitalize' }}>{item === 'all' ? t.all : t[item] || item}</Text>
          </TouchableOpacity>
        )}
      />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : visibleOrders.length === 0 ? (
        <EmptyState icon="receipt-outline" title={t.noResults} subtitle="No orders found" actionLabel={t.startShopping} onAction={() => openTab('ShopTab')} />
      ) : (
        <FlatList
          data={visibleOrders} keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={[styles.ordNum, { color: c.text }]}>#{item.orderNumber || item.id}</Text>
                  <Text style={[styles.date, { color: c.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.totalBlock}>
                  <Text style={[styles.totalLabel, { color: c.textMuted }]}>Total</Text>
                  <Text style={[styles.cardTotal, { color: c.primary }]}>{formatPrice(item.totalAmount ?? item.total)}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <StatusBadge status={item.status} />
              </View>
              {(item.district || item.province) ? (
                <Text numberOfLines={1} style={[styles.address, { color: c.textSecondary }]}>{[item.district, item.province].filter(Boolean).join(', ')}</Text>
              ) : null}
              <View style={styles.cardBottom}>
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{item.items?.length || 0} {t.items}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={c.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function OrderStat({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={18} color="#D6E5FF" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: 4 },
  heroCard: { marginHorizontal: spacing.base, marginTop: spacing.base, borderRadius: borderRadius.xxl, padding: spacing.xl },
  heroEyebrow: { color: '#C6D4FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: fontWeight.heavy, lineHeight: 30, marginTop: spacing.sm },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  statCard: { flex: 1, alignItems: 'center', borderRadius: borderRadius.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, backgroundColor: 'rgba(255,255,255,0.08)' },
  statValue: { color: '#FFFFFF', fontSize: fontSize.lg, fontWeight: fontWeight.heavy, marginTop: 6 },
  statLabel: { color: '#D6E5FF', fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginTop: 2 },
  tabs: { maxHeight: 56, paddingLeft: spacing.base, marginVertical: spacing.md },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full, borderWidth: 1, marginRight: 8 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxl },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ordNum: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  date: { fontSize: fontSize.xs, marginTop: 6 },
  totalBlock: { alignItems: 'flex-end' },
  totalLabel: { fontSize: fontSize.xs, marginBottom: 4 },
  statusRow: { marginTop: spacing.sm },
  address: { fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  addressSpacer: { marginTop: spacing.sm },
});
