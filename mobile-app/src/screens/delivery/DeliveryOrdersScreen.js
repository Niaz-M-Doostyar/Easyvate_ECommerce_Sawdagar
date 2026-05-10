import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { deliveryApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const TABS = ['pending', 'shipped', 'delivered'];

export default function DeliveryOrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const d = await deliveryApi.orders(); setOrders(d.orders || d || []); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const filtered = orders.filter(o => tab === 'all' ? true : o.status === tab);

  const updateStatus = async (id, status) => {
    try { await deliveryApi.updateOrder(id, { status }); toast.success('Updated'); await load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.assignedOrders} onBack={() => navigation.goBack()} />
      <FlatList horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}
        data={TABS} keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setTab(item)}
            style={[styles.tabBtn, { backgroundColor: tab === item ? c.primary : c.card, borderColor: tab === item ? c.primary : c.border }]}>
            <Text style={{ color: tab === item ? '#FFF' : c.text, fontSize: fontSize.sm, fontWeight: '500', textTransform: 'capitalize' }}>{t[item] || item}</Text>
          </TouchableOpacity>
        )}
      />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : filtered.length === 0 ? (
        <EmptyState icon="bicycle-outline" title="No orders" />
      ) : (
        <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.cardTop}><Text style={[styles.ordNum, { color: c.text }]}>#{item.orderNumber || item.id}</Text><StatusBadge status={item.status} /></View>
              {item.deliveryAddress && <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, marginBottom: 6 }}>{item.deliveryAddress}</Text>}
              <View style={styles.cardBottom}>
                <Text style={{ color: c.textMuted, fontSize: fontSize.xs }}>{item.items?.length || 0} items • {formatPrice(item.total)}</Text>
              </View>
              {item.status === 'confirmed' && <Button title={t.markShipped} onPress={() => updateStatus(item.id, 'shipped')} size="sm" style={{ marginTop: 8 }} />}
              {item.status === 'shipped' && <Button title={t.markDelivered} onPress={() => updateStatus(item.id, 'delivered')} size="sm" style={{ marginTop: 8 }} />}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabs: { maxHeight: 48, paddingLeft: spacing.base, marginVertical: spacing.sm },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ordNum: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cardBottom: { marginTop: 4 },
});
