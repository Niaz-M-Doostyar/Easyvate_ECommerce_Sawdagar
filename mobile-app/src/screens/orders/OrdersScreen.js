import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import FilterTabs from '../../components/FilterTabs';
import RemoteImage from '../../components/RemoteImage';
import { ordersApi } from '../../services/api';
import { formatPrice } from '../../config';
import { formatAppDate } from '../../utils/dateFormat';
import { spacing, fontSize, fontWeight } from '../../theme';

const TABS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const orderCopy = {
  en: { active: 'Active', login: 'Sign in to see your orders', loginHint: 'Track deliveries and review the products you purchased.', empty: 'Your orders will appear here', product: 'Product', more: 'more products', details: 'View order' },
  ps: { active: 'روان', login: 'د سفارښتونو د کتلو لپاره ننوځئ', loginHint: 'تحویلي تعقیب کړئ او خپل اخیستل شوي محصولات وګورئ.', empty: 'ستاسو سفارښتونه به دلته ښکاره شي', product: 'محصول', more: 'نور محصولات', details: 'سفارښت وګورئ' },
  dr: { active: 'فعال', login: 'برای دیدن سفارشات وارد شوید', loginHint: 'تحویل را پیگیری کنید و محصولات خریداری شده را ببینید.', empty: 'سفارشات شما اینجا نمایش داده می‌شود', product: 'محصول', more: 'محصول دیگر', details: 'مشاهده سفارش' },
};

export default function OrdersScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, lang, getName, isRTL } = useLanguage();
  const { user } = useAuth();
  const c = theme.colors;
  const copy = orderCopy[lang] || orderCopy.en;
  const direction = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
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
    if (parent?.navigate) { parent.navigate(tabName); return; }
    navigation.navigate(tabName);
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
        <EmptyState icon="log-in-outline" title={copy.login} subtitle={copy.loginHint} actionLabel={t.login}
          onAction={() => navigation.navigate('Auth', { screen: 'Login', params: { redirectTo: { tab: 'OrdersTab' } } })} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[styles.headingRow, direction]}>
          <Text style={[styles.title, alignment, { color: c.text }]}>{t.orders}</Text>
          <Text style={[styles.orderCount, { color: c.textSecondary, backgroundColor: c.surfaceElevated, borderColor: c.borderLight }]}>{orders.length}</Text>
        </View>
        <View style={[styles.summary, direction]}>
          <Text style={[styles.summaryText, { color: c.textSecondary }]}>{copy.active} <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{activeOrders}</Text></Text>
          <View style={[styles.summaryDot, { backgroundColor: c.border }]} />
          <Text style={[styles.summaryText, { color: c.textSecondary }]}>{t.delivered} <Text style={{ color: c.text, fontWeight: fontWeight.semibold }}>{deliveredOrders}</Text></Text>
        </View>
      </View>
      <FilterTabs tabs={TABS.map((key) => {
        const label = String(key === 'all' ? t.all : t[key] || key);
        return { key, label: label.charAt(0).toUpperCase() + label.slice(1) };
      })} activeKey={tab} onChange={setTab} style={styles.tabs} />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : visibleOrders.length === 0 ? (
        <EmptyState icon="receipt-outline" title={t.noResults} subtitle={copy.empty} actionLabel={t.startShopping} onAction={() => openTab('ShopTab')} />
      ) : (
        <FlatList data={visibleOrders} keyExtractor={i => String(i.id)} contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => {
            const firstProduct = item.items?.[0]?.product;
            const image = firstProduct?.images?.[0]?.url || firstProduct?.image || firstProduct?.thumbnail;
            const itemCount = item.items?.length || 0;
            return (
              <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { id: item.id })} activeOpacity={0.85}
                accessibilityRole="button" accessibilityLabel={`${copy.details}: ${item.orderNumber || item.id}`}
                style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }]}>
                <View style={[styles.cardTop, direction]}>
                  <View style={styles.orderMeta}>
                    <Text style={[styles.ordNum, alignment, { color: c.text }]}>{t.orderNumber} {item.orderNumber || item.id}</Text>
                    <Text style={[styles.date, alignment, { color: c.textSecondary }]}>{formatAppDate(item.createdAt, lang)}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <View style={[styles.productRow, direction]}>
                  <View style={[styles.imageFrame, { backgroundColor: c.surfaceElevated }]}>
                    <RemoteImage source={image} fallbackSource={firstProduct?.images?.[1]?.url} resizeMode="contain" width={180} quality={76}
                      style={styles.image} fallback={<MaterialCommunityIcons name="image-outline" size={25} color={c.textMuted} />} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text numberOfLines={2} style={[styles.productName, alignment, { color: c.text }]}>{getName(firstProduct) || copy.product}</Text>
                    <Text style={[styles.itemCount, alignment, { color: c.textSecondary }]}>{itemCount > 1 ? `+${itemCount - 1} ${copy.more}` : `${itemCount} ${t.items}`}</Text>
                    {(item.district || item.province) ? <Text numberOfLines={2} style={[styles.address, alignment, { color: c.textSecondary }]}>{[item.district, item.province].filter(Boolean).join(', ')}</Text> : null}
                  </View>
                </View>
                <View style={[styles.cardBottom, direction, { borderColor: c.borderLight }]}>
                  <View style={styles.totalBlock}>
                    <Text style={[styles.totalLabel, alignment, { color: c.textSecondary }]}>{t.total}</Text>
                    <Text style={[styles.cardTotal, alignment, { color: c.text }]}>{formatPrice(item.totalAmount ?? item.total)}</Text>
                  </View>
                  <View style={[styles.viewOrder, direction]}>
                    <Text style={[styles.viewOrderText, { color: theme.dark ? c.primary : c.primaryDark }]}>{copy.details}</Text>
                    <MaterialCommunityIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={19} color={theme.dark ? c.primary : c.primaryDark} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  headingRow: { alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, flexShrink: 1 },
  orderCount: { fontSize: 14, lineHeight: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderRadius: 10 },
  summary: { alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 },
  summaryText: { fontSize: 14, lineHeight: 21 },
  summaryDot: { width: 4, height: 4, borderRadius: 2 },
  tabs: { marginVertical: spacing.md },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 120 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: spacing.md },
  cardTop: { justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  orderMeta: { flexGrow: 1, flexShrink: 1, minWidth: 110 },
  ordNum: { fontSize: 14, lineHeight: 21, fontWeight: fontWeight.semibold },
  date: { fontSize: 13, lineHeight: 20, marginTop: 3 },
  productRow: { alignItems: 'center', gap: 12, marginTop: 14 },
  imageFrame: { width: 78, height: 78, padding: 7, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.semibold },
  itemCount: { fontSize: 13, lineHeight: 20, marginTop: 3 },
  address: { fontSize: 13, lineHeight: 20, marginTop: 3 },
  cardBottom: { justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTopWidth: 1, paddingTop: 12, marginTop: 14 },
  totalBlock: { flexGrow: 1, flexShrink: 1 },
  totalLabel: { fontSize: 13, lineHeight: 19 },
  cardTotal: { fontSize: 16, lineHeight: 23, fontWeight: fontWeight.bold, marginTop: 2 },
  viewOrder: { minHeight: 44, alignItems: 'center', gap: 2, maxWidth: '100%' },
  viewOrderText: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.semibold, flexShrink: 1 },
});
