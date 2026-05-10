import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { productsApi, categoriesApi } from '../../services/api';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { optimizedImageUri } from '../../config';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low → High' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'name_asc', label: 'Name: A → Z' },
];

export default function ProductsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const c = theme.colors;
  const initCategoryId = route.params?.categoryId;
  const initSort = route.params?.sort || 'newest';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(initCategoryId || null);
  const [sort, setSort] = useState(initSort);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    categoriesApi.list().then(d => setCategories(d.categories || d || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: p, limit: 12, status: 'approved' };
      if (categoryId) params.categoryId = categoryId;
      if (sort === 'price_asc') { params.sortBy = 'retailPrice'; params.sortOrder = 'asc'; }
      else if (sort === 'price_desc') { params.sortBy = 'retailPrice'; params.sortOrder = 'desc'; }
      else if (sort === 'name_asc') { params.sortBy = 'nameEn'; params.sortOrder = 'asc'; }
      else { params.sortBy = 'createdAt'; params.sortOrder = 'desc'; }
      const data = await productsApi.list(params);
      const items = data.products || data || [];
      setProducts(append ? prev => [...prev, ...items] : items);
      setHasMore(items.length >= 12);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [categoryId, sort]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const loadMore = () => { if (hasMore && !loadingMore) fetchProducts(page + 1, true); };
  const selectedCategory = categories.find((item) => String(item.id) === String(categoryId));
  const chipData = [{ id: null, nameEn: t.all }, ...(categories || [])];

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title={route.params?.title || t.shop}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.backBtn}>
            <MaterialCommunityIcons name="magnify" size={22} color={c.text} />
          </TouchableOpacity>
        }
      />

     

      <FlatList
        horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}
        data={chipData} keyExtractor={i => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setCategoryId(item.id)}
            style={[styles.chip, { backgroundColor: categoryId === item.id ? c.primary : c.card, borderColor: categoryId === item.id ? c.primary : c.border }]}>
            {item.image ? (
              <Image source={{ uri: optimizedImageUri(item.image, { width: 80 }) }} style={styles.chipImg} />
            ) : item.id == null ? (
              <View style={[styles.chipFallback, { backgroundColor: categoryId === item.id ? 'rgba(255,255,255,0.2)' : c.brandSurface }]}>
                <MaterialCommunityIcons name="view-grid-outline" size={14} color={categoryId === item.id ? '#FFF' : c.primary} />
              </View>
            ) : (
              <View style={[styles.chipFallback, { backgroundColor: categoryId === item.id ? 'rgba(255,255,255,0.2)' : c.brandSurface }]}>
                <MaterialCommunityIcons name="shape-outline" size={14} color={categoryId === item.id ? '#FFF' : c.primary} />
              </View>
            )}
            <Text style={[styles.chipText, { color: categoryId === item.id ? '#FFF' : c.text }]}>{getName(item) || t.all}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chipListContent}
      />

      <View style={styles.sortRow}>
        <View>
          <Text style={[styles.resultTitle, { color: c.text }]}>{products.length} {products.length === 1 ? 'product' : 'products'}</Text>
          <Text style={[styles.resultSubtitle, { color: c.textSecondary }]}>{selectedCategory ? `${getName(selectedCategory)} selected` : 'Showing every category'}</Text>
        </View>
        <View style={styles.sortActions}>
          {categoryId != null && (
            <TouchableOpacity onPress={() => setCategoryId(null)} style={[styles.clearBtn, { backgroundColor: c.brandSurface }]}> 
              <MaterialCommunityIcons name="close-circle-outline" size={16} color={c.primary} />
              <Text style={[styles.clearLabel, { color: c.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowSort(!showSort)} style={[styles.sortBtn, { backgroundColor: c.card, borderColor: c.border }]}> 
            <MaterialCommunityIcons name="tune-variant" size={16} color={c.primary} />
            <Text style={[styles.sortLabel, { color: c.primary }]}>{SORT_OPTIONS.find(s => s.key === sort)?.label}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSort && (
        <View style={[styles.sortDrop, { backgroundColor: c.card, borderColor: c.border }]}>
          {SORT_OPTIONS.map(s => (
            <TouchableOpacity key={s.key} onPress={() => { setSort(s.key); setShowSort(false); }}
              style={[styles.sortItem, sort === s.key && { backgroundColor: c.primary + '15' }]}>
              <Text style={[styles.sortItemText, { color: sort === s.key ? c.primary : c.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
      ) : products.length === 0 ? (
        <EmptyState icon="bag-outline" title={t.noResults} />
      ) : (
        <FlatList
          data={products} numColumns={2} keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id, product: item })} />
            </View>
          )}
          onEndReached={loadMore} onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={c.primary} style={{ margin: 20 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  introCard: { marginHorizontal: spacing.base, marginTop: spacing.base, borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg },
  introEyebrow: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  introTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.sm },
  introBody: { fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.sm },
  chipList: { maxHeight: 74, paddingVertical: spacing.sm },
  chipListContent: { paddingLeft: spacing.base, paddingRight: spacing.base / 2, alignItems: 'center' },
  chip: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: borderRadius.full, borderWidth: 1, marginRight: 10 },
  chipImg: { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: '#EEE' },
  chipFallback: { width: 24, height: 24, borderRadius: 12, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: fontSize.sm, lineHeight: fontSize.sm + 3, fontWeight: fontWeight.medium, includeFontPadding: false },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  resultTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  resultSubtitle: { fontSize: fontSize.sm, marginTop: 4 },
  sortActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 10, borderRadius: borderRadius.full },
  clearLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: borderRadius.full },
  sortLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  sortDrop: { marginHorizontal: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  sortItem: { paddingVertical: 12, paddingHorizontal: spacing.base },
  sortItemText: { fontSize: fontSize.base },
  grid: { paddingHorizontal: spacing.base - 4, paddingTop: 4 },
  gridItem: { width: '50%', paddingHorizontal: 4 },
});
