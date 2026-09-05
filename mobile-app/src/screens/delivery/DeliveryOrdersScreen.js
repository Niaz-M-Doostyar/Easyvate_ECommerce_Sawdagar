import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import FilterTabs from '../../components/FilterTabs';
import { deliveryApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const TABS = ['confirmed', 'shipped', 'delivered'];

function getDeliveryAddress(order) {
  return [
    order.village ?? order.user?.village,
    order.district ?? order.user?.district,
    order.province ?? order.user?.province,
    order.landmark ?? order.user?.landmark,
  ].filter(Boolean).join(', ');
}

export default function DeliveryOrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await deliveryApi.orders({ all: true });
      setOrders(d.orders || d || []);
    } catch (err) {
      setOrders([]);
      setError(err?.message || 'Failed to load assigned orders');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const filtered = orders.filter(o => o.status === tab);

  const updateStatus = async (id, status) => {
    if (updatingId) return;
    setUpdatingId(id);
    try { await deliveryApi.updateOrder(id, { status }); toast.success('Updated'); await load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setUpdatingId(null); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.assignedOrders} onBack={() => navigation.goBack()} />
      <FilterTabs
        tabs={TABS.map((key) => ({ key, label: t[key] || key }))}
        activeKey={tab}
        onChange={setTab}
        style={{ marginVertical: spacing.sm }}
      />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : error ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load orders" subtitle={error} actionLabel="Try Again" onAction={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="bicycle-outline" title={`No ${t[tab] || tab} orders`} subtitle="Assigned orders will appear here when they reach this status." actionLabel="Refresh" onAction={onRefresh} />
      ) : (
        <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => {
            const address = getDeliveryAddress(item);
            const phone = item.phone ?? item.user?.phone;
            return (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardTop}><Text style={[styles.ordNum, { color: c.text }]}>#{item.orderNumber || item.id}</Text><StatusBadge status={item.status} /></View>
                {!!item.user?.fullName && <Text style={[styles.customer, { color: c.text }]}>{item.user.fullName}</Text>}
                {!!address && <Text style={[styles.detailText, { color: c.textSecondary }]}>{address}</Text>}
                {!!phone && <Text selectable style={[styles.detailText, { color: c.textSecondary }]}>{phone}</Text>}
                <View style={styles.cardBottom}>
                  <Text style={{ color: c.textMuted, fontSize: fontSize.sm }}>{item.items?.length || 0} {t.items}</Text>
                  <Text style={[styles.total, { color: c.primary }]}>{formatPrice(item.totalAmount ?? item.total ?? 0)}</Text>
                </View>
                {item.status === 'confirmed' && <Button title={t.markShipped} onPress={() => updateStatus(item.id, 'shipped')} loading={updatingId === item.id} disabled={!!updatingId} size="sm" style={{ marginTop: 12 }} />}
                {item.status === 'shipped' && <Button title={t.markDelivered} onPress={() => updateStatus(item.id, 'delivered')} loading={updatingId === item.id} disabled={!!updatingId} size="sm" style={{ marginTop: 12 }} />}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ordNum: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  customer: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, marginTop: 8 },
  detailText: { fontSize: fontSize.sm, lineHeight: 20, marginTop: 4 },
  cardBottom: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#00000018', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
