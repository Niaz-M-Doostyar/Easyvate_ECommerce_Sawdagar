import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/ProductCard';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { productsApi, categoriesApi } from '../../services/api';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';
import { optimizedImageUri } from '../../config';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low → High' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'name_asc', label: 'Name: A → Z' },
];

const getProductSupplierId = (product) => product?.supplierId ?? product?.supplier?.id;

const belongsToSupplier = (product, supplierId) => (
  !supplierId || String(getProductSupplierId(product)) === String(supplierId)
);

export default function ProductsScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const c = theme.colors;
  const numColumns = width >= 1024 ? 4 : width >= 700 ? 3 : 2;
  const gridCardWidth = Math.max(0, (width - (spacing.base - 4) * 2) / numColumns - 6);
  const initCategoryId = route.params?.categoryId;
  const initSort = route.params?.sort || 'newest';
  const supplierId = route.params?.supplierId;

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
  const [inStockOnly, setInStockOnly] = useState(Boolean(route.params?.inStock));
  const [priceFilter, setPriceFilter] = useState(route.params?.priceFilter || 'all');

  useEffect(() => {
    categoriesApi.list().then(d => setCategories(d.categories || d || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: p, limit: supplierId ? 100 : 12, status: 'approved' };
      if (categoryId) params.categoryId = categoryId;
      if (supplierId) params.supplierId = supplierId;
      if (inStockOnly) params.inStock = true;
      if (priceFilter === 'under1000') params.maxPrice = 1000;
      if (priceFilter === '1000to5000') { params.minPrice = 1000; params.maxPrice = 5000; }
      if (priceFilter === 'over5000') params.minPrice = 5000;
      params.sort = sort;
      const data = await productsApi.list(params);
      const responseItems = data.products || data || [];
      const containsAnotherSupplier = supplierId && responseItems.some((item) => !belongsToSupplier(item, supplierId));
      let items = supplierId ? responseItems.filter((item) => belongsToSupplier(item, supplierId)) : responseItems;
      let canLoadMore = data.pagination
        ? data.pagination.page < data.pagination.totalPages
        : responseItems.length >= params.limit;

      // Compatibility guard for older API deployments that ignored supplierId.
      // Pull the remaining result pages once, then filter locally so another
      // supplier can never leak into this storefront.
      if (supplierId && containsAnotherSupplier && p === 1) {
        const totalPages = Math.max(1, Number(data.pagination?.totalPages || data.totalPages || 1));
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
        const remainingResponses = await Promise.all(
          remainingPages.map((nextPage) => productsApi.list({ ...params, page: nextPage }))
        );
        items = [
          ...responseItems,
          ...remainingResponses.flatMap((result) => result.products || result || []),
        ].filter((item) => belongsToSupplier(item, supplierId));
        canLoadMore = false;
      }

      setProducts(append ? prev => [...prev, ...items] : items);
      setHasMore(canLoadMore);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [categoryId, sort, supplierId, inStockOnly, priceFilter]);

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
        showBack={navigation.canGoBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Search')} accessibilityRole="button" accessibilityLabel="Search products" style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={c.text} />
          </TouchableOpacity>
        }
      />

      <FlatList
        horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}
        data={chipData} keyExtractor={i => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setCategoryId(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: String(categoryId ?? '') === String(item.id ?? '') }}
            style={[styles.chip, { backgroundColor: String(categoryId ?? '') === String(item.id ?? '') ? c.primary : c.card, borderColor: String(categoryId ?? '') === String(item.id ?? '') ? c.primary : c.border }]}>
            {item.image ? (
              <Image source={{ uri: optimizedImageUri(item.image, { width: 80 }) }} style={[styles.chipImg, { backgroundColor: c.skeleton }]} />
            ) : item.id == null ? (
	              <View style={[styles.chipFallback, { backgroundColor: String(categoryId ?? '') === String(item.id ?? '') ? c.heroSurface : c.brandSurface }]}>
	                <MaterialCommunityIcons name="view-grid-outline" size={14} color={String(categoryId ?? '') === String(item.id ?? '') ? c.white : c.primary} />
              </View>
            ) : (
	              <View style={[styles.chipFallback, { backgroundColor: String(categoryId ?? '') === String(item.id ?? '') ? c.heroSurface : c.brandSurface }]}>
	                <CategoryIcon3D category={item} size={22} />
              </View>
            )}
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.chipText, { color: String(categoryId ?? '') === String(item.id ?? '') ? c.white : c.text }]}>{getName(item) || t.all}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chipListContent}
      />

      {route.params?.categoriesMode ? (
        <View style={[styles.filterPanel, { borderColor: c.border }]}>
          <Text style={[styles.filterTitle, { color: c.text }]}>Filters</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { key: 'stock', label: 'In stock', selected: inStockOnly, onPress: () => setInStockOnly(value => !value) },
              { key: 'all', label: 'Any price', selected: priceFilter === 'all', onPress: () => setPriceFilter('all') },
              { key: 'under1000', label: 'Under ؋1,000', selected: priceFilter === 'under1000', onPress: () => setPriceFilter('under1000') },
              { key: '1000to5000', label: '؋1,000–5,000', selected: priceFilter === '1000to5000', onPress: () => setPriceFilter('1000to5000') },
              { key: 'over5000', label: '؋5,000+', selected: priceFilter === 'over5000', onPress: () => setPriceFilter('over5000') },
            ]}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={item.onPress} style={[styles.filterOption, { backgroundColor: item.selected ? c.primary : c.card, borderColor: item.selected ? c.primary : c.border }]}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.filterOptionText, { color: item.selected ? c.white : c.text }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      <View style={styles.sortRow}>
        <View style={styles.resultCopy}>
          <Text numberOfLines={1} style={[styles.resultTitle, { color: c.text }]}>{products.length} {products.length === 1 ? 'product' : 'products'}</Text>
          <Text numberOfLines={1} style={[styles.resultSubtitle, { color: c.textSecondary }]}>{selectedCategory ? `${getName(selectedCategory)} selected` : 'Showing every category'}</Text>
        </View>
        <View style={styles.sortActions}>
          {categoryId != null && (
            <TouchableOpacity onPress={() => setCategoryId(null)} style={[styles.clearBtn, { backgroundColor: c.brandSurface }]}>
              <MaterialCommunityIcons name="close-circle-outline" size={16} color={c.primary} />
              <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.clearLabel, { color: c.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowSort(!showSort)} style={[styles.sortBtn, { backgroundColor: c.card, borderColor: c.border }]}>
            <MaterialCommunityIcons name="tune-variant" size={16} color={c.primary} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.84} maxFontSizeMultiplier={1.15} style={[styles.sortLabel, { color: c.primary }]}>{SORT_OPTIONS.find(s => s.key === sort)?.label}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSort && (
        <View style={[styles.sortDrop, { backgroundColor: c.card, borderColor: c.border }]}>
          {SORT_OPTIONS.map(s => (
            <TouchableOpacity key={s.key} onPress={() => { setSort(s.key); setShowSort(false); }}
              style={[styles.sortItem, sort === s.key && { backgroundColor: c.primary + '15' }]}>
              <Text maxFontSizeMultiplier={1.2} style={[styles.sortItemText, { color: sort === s.key ? c.primary : c.text }]}>{s.label}</Text>
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
          key={`grid-${numColumns}`}
          data={products} numColumns={numColumns} keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.gridItem, { width: '33.333%' }]}>
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id, product: item })} style={{ width: gridCardWidth }} />
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
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipList: { maxHeight: 74, paddingVertical: spacing.sm },
  chipListContent: { paddingLeft: spacing.base, paddingRight: spacing.base / 2, alignItems: 'center' },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1, marginRight: 10 },
  chipImg: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  chipFallback: { width: 24, height: 24, borderRadius: 12, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.medium, includeFontPadding: false, textAlignVertical: 'center' },
  filterPanel: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: spacing.sm, paddingLeft: spacing.base },
  filterTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginBottom: 8 },
  filterOption: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  filterOptionText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  resultCopy: { flex: 1, minWidth: 0 },
  resultTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  resultSubtitle: { fontSize: fontSize.sm, marginTop: 4 },
  sortActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 1, gap: 6 },
  clearBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: borderRadius.full },
  clearLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  sortBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexShrink: 1, gap: 5, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: borderRadius.full },
  sortLabel: { maxWidth: 102, flexShrink: 1, fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.semibold, includeFontPadding: false, textAlignVertical: 'center' },
  sortDrop: { marginHorizontal: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 4, ...shadows.md },
  sortItem: { minHeight: 48, justifyContent: 'center', paddingVertical: 12, paddingHorizontal: spacing.base },
  sortItemText: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.medium, includeFontPadding: false, textAlignVertical: 'center' },
  grid: { paddingHorizontal: spacing.base - 4, paddingTop: 4, paddingBottom: 120 },
  gridItem: { paddingHorizontal: 3 },
});
