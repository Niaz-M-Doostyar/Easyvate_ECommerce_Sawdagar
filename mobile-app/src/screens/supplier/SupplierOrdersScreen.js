import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { supplierApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function SupplierOrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const d = await supplierApi.myOrders(); setOrders(d.orders || d || []); } catch { setOrders([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.myOrders} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : orders.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" />
      ) : (
        <FlatList data={orders} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { id: item.id, order: item })}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.cardTop}><Text style={[styles.ordNum, { color: c.text }]}>#{item.orderNumber || item.id}</Text><StatusBadge status={item.status} /></View>
              {!!item.user?.fullName && <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, marginBottom: 2 }}>{item.user.fullName}</Text>}
              <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginBottom: 6 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <View style={styles.cardBottom}><Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{item.items?.length || 0} {t.items}</Text><Text style={[styles.cardTotal, { color: c.primary }]}>{formatPrice(item.totalAmount ?? item.total ?? 0)}</Text></View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ordNum: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
