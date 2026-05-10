import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import RemoteImage from '../../components/RemoteImage';
import { supplierApi } from '../../services/api';
import { formatPrice } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function SupplierProductsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async (statusValue = 'all') => {
    try {
      const d = await supplierApi.myProducts(statusValue === 'all' ? undefined : { status: statusValue });
      setProducts(d.products || d || []);
    } catch (err) {
      setProducts([]);
      toast.error(err?.message || 'Failed to load products');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(filter); }, [filter, load]);
  const onRefresh = async () => { setRefreshing(true); await load(filter); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: t.cancel, style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await supplierApi.deleteProduct(id); setProducts(p => p.filter(x => x.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title={t.myProducts}
        onBack={() => navigation.goBack()}
        right={(
          <TouchableOpacity onPress={() => navigation.navigate('SupplierAddProduct')} style={[styles.addBtn, { backgroundColor: c.primary }]}> 
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      />
      <View style={styles.filtersRow}>
        {[
          { key: 'all', label: t.all },
          { key: 'pending', label: t.pending },
          { key: 'approved', label: t.approved },
          { key: 'rejected', label: t.rejected },
        ].map((f) => {
          const selected = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}
            >
              <Text style={{ color: selected ? '#FFF' : c.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : products.length === 0 ? (
        <EmptyState icon="cube-outline" title={filter === 'all' ? 'No products yet' : 'No products in this status'} actionLabel={t.addProduct} onAction={() => navigation.navigate('SupplierAddProduct')} />
      ) : (
        <FlatList data={products} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => {
            const img = item.images?.[0]?.url || item.image || item.thumbnail || null;
            return (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardRow}>
                  {img ? <RemoteImage source={img} fallbackSource={item.images?.[1]?.url} style={styles.cardImg} fallback={<View style={[styles.cardImg, { backgroundColor: c.skeleton }]} />} /> : <View style={[styles.cardImg, { backgroundColor: c.skeleton }]} />}
                  <View style={styles.cardInfo}>
                    <Text numberOfLines={1} style={[styles.cardName, { color: c.text }]}>{getName(item)}</Text>
                    <Text style={[styles.cardPrice, { color: c.primary }]}>{formatPrice(item.retailPrice)}</Text>
                    <StatusBadge status={item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending'} />
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Button title={t.editProduct} onPress={() => navigation.navigate('SupplierAddProduct', { product: item })} size="sm" variant="outline" style={{ flex: 1, marginRight: 8 }} />
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.delBtn, { borderColor: c.error }]}>
                    <Ionicons name="trash-outline" size={18} color={c.error} />
                  </TouchableOpacity>
                </View>
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
  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: borderRadius.full, borderWidth: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.base, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', marginBottom: spacing.md },
  cardImg: { width: 64, height: 64, borderRadius: borderRadius.md },
  cardInfo: { flex: 1, marginLeft: spacing.md, gap: 4 },
  cardName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  cardPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  delBtn: { width: 38, height: 38, borderRadius: borderRadius.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});
