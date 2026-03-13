import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orders as ordersApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const statusColors = { pending: colors.warning, confirmed: colors.info, shipped: '#6f42c1', delivered: colors.success, cancelled: colors.danger };

export default function OrdersScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowDir = isRTL ? 'row-reverse' : 'row';

  const fetchOrders = useCallback(async (p = 1) => {
    if (p === 1) setLoading(true);
    try {
      const data = await ordersApi.list(p);
      const list = data.orders || [];
      setOrderList(prev => p === 1 ? list : [...prev, ...list]);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchOrders(); }, [user, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(1);
    setRefreshing(false);
  };

  if (!user) {
    return (
      <View style={styles.empty}>
        <Ionicons name="person-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('please_sign_in')}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.emptyBtnText}>{t('sign_in')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item: order }) => {
    const statusColor = statusColors[order.status] || colors.gray;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { id: order.id })}>
        <View style={[styles.cardHeader, { flexDirection: rowDir }]}>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{t(order.status) || order.status}</Text>
          </View>
        </View>
        <View style={[styles.cardBody, { flexDirection: rowDir }]}>
          <View style={styles.cardInfo}>
            <View style={[styles.infoRow, { flexDirection: rowDir }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.infoRow, { flexDirection: rowDir }]}>
              <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>{order.items?.length || order._count?.items || 0} {t('items')}</Text>
            </View>
          </View>
          <Text style={styles.cardPrice}>{formatPrice(order.totalAmount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={orderList}
          keyExtractor={i => String(i.id)}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={() => { if (page < totalPages) fetchOrders(page + 1); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>{t('no_orders')}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('HomeTab')}>
                <Text style={styles.emptyBtnText}>{t('start_shopping')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxl },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginTop: spacing.lg },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  emptyBtnText: { color: colors.white, fontWeight: 'bold', fontSize: fontSize.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderNum: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.dark },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardInfo: { gap: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { fontSize: fontSize.sm, color: colors.textMuted },
  cardPrice: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },
});
