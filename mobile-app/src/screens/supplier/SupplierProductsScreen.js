import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import RemoteImage from '../../components/RemoteImage';
import FilterTabs from '../../components/FilterTabs';
import { supplierApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontWeight } from '../../theme';

const supplierCopy = {
  en: { empty: 'No products yet', emptyStatus: 'No products in this status', deleteTitle: 'Delete product?', deleteHint: 'Are you sure you want to delete this product?', delete: 'Delete', deleted: 'Product deleted', loadError: 'Failed to load products', openError: 'Failed to open product', deleteError: 'Failed to delete product' },
  ps: { empty: 'تر اوسه محصولات نشته', emptyStatus: 'په دې حالت کې محصولات نشته', deleteTitle: 'محصول ړنګ کړئ؟', deleteHint: 'ایا دا محصول ړنګول غواړئ؟', delete: 'ړنګول', deleted: 'محصول ړنګ شو', loadError: 'محصولات ښکاره نه شول', openError: 'محصول پرانیستل نه شو', deleteError: 'محصول ړنګ نه شو' },
  dr: { empty: 'هنوز محصولی ندارید', emptyStatus: 'محصولی با این وضعیت نیست', deleteTitle: 'محصول حذف شود؟', deleteHint: 'آیا می‌خواهید این محصول را حذف کنید؟', delete: 'حذف', deleted: 'محصول حذف شد', loadError: 'محصولات بارگذاری نشد', openError: 'محصول باز نشد', deleteError: 'محصول حذف نشد' },
};

export default function SupplierProductsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName, lang, isRTL } = useLanguage();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const c = theme.colors;
  const copy = supplierCopy[lang] || supplierCopy.en;
  const direction = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const viewportWidth = Math.min(width, 1200) - insets.left - insets.right;
  const baseColumns = viewportWidth >= 1000 ? 4 : viewportWidth >= 700 ? 3 : viewportWidth >= 350 ? 2 : 1;
  const columns = fontScale >= 1.8 ? 1 : fontScale > 1.25 ? Math.max(1, baseColumns - 1) : baseColumns;
  const gutter = viewportWidth >= 700 ? 24 : 16;
  const gap = 12;
  const cardWidth = (viewportWidth - gutter * 2 - gap * (columns - 1)) / columns;
  const imageHeight = Math.min(cardWidth - 12, columns === 1 ? 240 : 250);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [openingId, setOpeningId] = useState(null);

  const load = useCallback(async (statusValue = 'all') => {
    try {
      const d = await supplierApi.myProducts(statusValue === 'all' ? { all: true } : { status: statusValue, all: true });
      setProducts(d.products || d || []);
    } catch (err) {
      setProducts([]);
      toast.error(err?.message || (supplierCopy[lang] || supplierCopy.en).loadError);
    }
    setLoading(false);
  }, [toast, lang]);

  useEffect(() => { load(filter); }, [filter, load]);
  const onRefresh = async () => { setRefreshing(true); await load(filter); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert(copy.deleteTitle, copy.deleteHint, [
      { text: t.cancel, style: 'cancel' },
      { text: copy.delete, style: 'destructive', onPress: async () => {
        try { await supplierApi.deleteProduct(id); setProducts(p => p.filter(x => x.id !== id)); toast.success(copy.deleted); } catch { toast.error(copy.deleteError); }
      }},
    ]);
  };

  const handleEdit = async (item) => {
    if (openingId) return;
    setOpeningId(item.id);
    try {
      const data = await supplierApi.getProduct(item.id);
      navigation.navigate('SupplierAddProduct', { product: data.product || data });
    } catch (err) {
      toast.error(err?.message || copy.openError);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t.myProducts} onBack={() => navigation.goBack()} right={(
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.addProduct} onPress={() => navigation.navigate('SupplierAddProduct')}
          style={[styles.addBtn, { backgroundColor: c.brandSurface, borderColor: c.borderLight }]}>
          <Ionicons name="add" size={22} color={theme.dark ? c.primary : c.primaryDark} />
        </TouchableOpacity>
      )} />
      <FilterTabs tabs={[{ key: 'all', label: t.all }, { key: 'pending', label: t.pending }, { key: 'approved', label: t.approved }, { key: 'rejected', label: t.rejected }]}
        activeKey={filter} onChange={setFilter} style={{ marginVertical: spacing.sm }} />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : products.length === 0 ? (
        <EmptyState icon="cube-outline" title={filter === 'all' ? copy.empty : copy.emptyStatus} actionLabel={t.addProduct} onAction={() => navigation.navigate('SupplierAddProduct')} />
      ) : (
        <FlatList key={`supplier-products-${columns}`} data={products} numColumns={columns} keyExtractor={i => String(i.id)}
          columnWrapperStyle={columns > 1 ? [styles.gridRow, direction] : undefined}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: gutter }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => {
            const image = item.images?.[0]?.url || item.image || item.thumbnail;
            const name = getName(item);
            return (
              <View style={[styles.card, { width: cardWidth, backgroundColor: c.card, borderColor: c.borderLight }]}>
                <View style={[styles.imageFrame, { height: imageHeight, backgroundColor: c.surfaceElevated }]}>
                  <RemoteImage source={image} fallbackSource={item.images?.[1]?.url} resizeMode="contain" width={500} quality={76}
                    style={styles.cardImg} fallback={<Ionicons name="image-outline" size={30} color={c.textMuted} />} />
                </View>
                <View style={styles.cardInfo}>
                  <Text numberOfLines={2} style={[styles.cardName, alignment, { color: c.text, minHeight: Math.ceil(21 * fontScale) * 2 }]}>{name}</Text>
                  <Text style={[styles.cardPrice, alignment, { color: c.text }]}>{formatPrice(item.retailPrice ?? item.suggestedPrice ?? item.wholesaleCost)}</Text>
                  <View style={[styles.statusRow, direction]}>
                    <StatusBadge status={item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending'} />
                  </View>
                </View>
                <View style={[styles.cardActions, direction]}>
                  <Button title={t.editProduct} accessibilityLabel={`${t.editProduct}: ${name}`} onPress={() => handleEdit(item)} loading={openingId === item.id} disabled={!!openingId}
                    size="sm" variant="outline" style={[styles.editButton, { minHeight: fontScale > 1 ? Math.ceil(40 * fontScale + 8) : 44 }]} />
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${copy.delete}: ${name}`} onPress={() => handleDelete(item.id)}
                    style={[styles.delBtn, { minHeight: Math.max(44, Math.ceil(20 * fontScale + 16)), borderColor: c.border, backgroundColor: c.surfaceElevated }]}>
                    <Ionicons name="trash-outline" size={19} color={c.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 8, paddingBottom: 120 },
  gridRow: { gap: 12, alignItems: 'stretch' },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  imageFrame: { margin: 5, padding: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 12 },
  cardName: { fontSize: 14, lineHeight: 21, fontWeight: fontWeight.semibold },
  cardPrice: { fontSize: 16, lineHeight: 23, fontWeight: fontWeight.bold, marginTop: 5 },
  statusRow: { marginTop: 8 },
  cardActions: { alignItems: 'stretch', marginHorizontal: 8, marginBottom: 8, gap: 6 },
  editButton: { flex: 1 },
  delBtn: { width: 44, flexShrink: 0, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});
