import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, ActivityIndicator, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/ProductCard';
import CatalogSkeleton from '../../components/CatalogSkeleton';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { productsApi, categoriesApi } from '../../services/api';
import { optimizedImageUri } from '../../config';

const catalogCopy = {
  en: { loading: 'Loading products…', product: 'product', products: 'products', nameSort: 'Name: A → Z', anyPrice: 'Any price', underPrice: 'Under \u20661,000 ؋\u2069', clearCategory: 'Clear category', closeSort: 'Close sorting' },
  ps: { loading: 'محصولات بارېږي…', product: 'محصول', products: 'محصولات', nameSort: 'د نوم له مخې', anyPrice: 'هر قیمت', underPrice: 'له ؋۱٬۰۰۰ کم', clearCategory: 'کټګوري پاکه کړئ', closeSort: 'د ترتیب تړل' },
  dr: { loading: 'در حال بارگذاری محصولات…', product: 'محصول', products: 'محصولات', nameSort: 'بر اساس نام', anyPrice: 'هر قیمت', underPrice: 'کمتر از ؋۱٬۰۰۰', clearCategory: 'پاک کردن دسته‌بندی', closeSort: 'بستن مرتب‌سازی' },
};

const getProductSupplierId = (product) => product?.supplierId ?? product?.supplier?.id;

const belongsToSupplier = (product, supplierId) => (
  !supplierId || String(getProductSupplierId(product)) === String(supplierId)
);

export default function ProductsScreen({ navigation, route }) {
  const { columns: numColumns, cardWidth: gridCardWidth, gutter, height } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, getName, lang, isRTL } = useLanguage();
  const c = theme.colors;
  const copy = catalogCopy[lang] || catalogCopy.en;
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const sortOptions = [
    { key: 'newest', label: t.newest },
    { key: 'price_asc', label: `${t.price}: ${t.lowToHigh}` },
    { key: 'price_desc', label: `${t.price}: ${t.highToLow}` },
    { key: 'name_asc', label: copy.nameSort },
  ];
  const initCategoryId = route.params?.categoryId;
  const initSort = route.params?.sort || 'newest';
  const supplierId = route.params?.supplierId;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(initCategoryId || null);
  const [sort, setSort] = useState(initSort);
  const sortButtonLabel = sort === 'price_asc' ? t.lowToHigh
    : sort === 'price_desc' ? t.highToLow
      : sort === 'name_asc' ? copy.nameSort : t.newest;
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
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={route.params?.title || t.shop}
        onBack={() => navigation.goBack()}
        showBack={navigation.canGoBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Search')} accessibilityRole="button" accessibilityLabel={t.search} style={[styles.backBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
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
            style={[styles.chip, rowDirection, { backgroundColor: String(categoryId ?? '') === String(item.id ?? '') ? c.brandSurface : c.card, borderColor: String(categoryId ?? '') === String(item.id ?? '') ? c.primary : c.border }]}>
            {item.image ? (
              <Image source={{ uri: optimizedImageUri(item.image, { width: 80 }) }} style={[styles.chipImg, { backgroundColor: c.skeleton }]} />
            ) : item.id == null ? (
              <View style={[styles.chipFallback, { backgroundColor: c.surfaceElevated }]}>
                <MaterialCommunityIcons name="view-grid-outline" size={14} color={c.primary} />
              </View>
            ) : (
              <View style={[styles.chipFallback, { backgroundColor: c.surfaceElevated }]}>
                <CategoryIcon3D category={item} size={22} />
              </View>
            )}
            <Text style={[styles.chipText, { color: String(categoryId ?? '') === String(item.id ?? '') ? (theme.dark ? c.primary : c.primaryDark) : c.text }]}>{getName(item) || t.all}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.chipListContent, { paddingHorizontal: gutter }]}
      />

      {route.params?.categoriesMode ? (
        <View style={[styles.filterPanel, { paddingHorizontal: gutter }]}>
          <Text style={[styles.filterTitle, alignment, { color: c.text }]}>{t.filter}</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { key: 'stock', label: t.inStock, selected: inStockOnly, onPress: () => setInStockOnly(value => !value) },
              { key: 'all', label: copy.anyPrice, selected: priceFilter === 'all', onPress: () => setPriceFilter('all') },
              { key: 'under1000', label: copy.underPrice, selected: priceFilter === 'under1000', onPress: () => setPriceFilter('under1000') },
              { key: '1000to5000', label: '\u20661,000–5,000 ؋\u2069', selected: priceFilter === '1000to5000', onPress: () => setPriceFilter('1000to5000') },
              { key: 'over5000', label: '\u20665,000+ ؋\u2069', selected: priceFilter === 'over5000', onPress: () => setPriceFilter('over5000') },
            ]}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={item.onPress} accessibilityRole="button" accessibilityState={{ selected: item.selected }} style={[styles.filterOption, { backgroundColor: item.selected ? c.brandSurface : c.card, borderColor: item.selected ? c.primary : c.border }]}>
                <Text style={[styles.filterOptionText, { color: item.selected ? (theme.dark ? c.primary : c.primaryDark) : c.text }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      <View style={[styles.sortRow, rowDirection, { paddingHorizontal: gutter }]}>
        <View style={styles.resultCopy}>
          <Text style={[styles.resultTitle, alignment, { color: c.text }]}>{loading ? copy.loading : `${products.length} ${products.length === 1 ? copy.product : copy.products}`}</Text>
          {selectedCategory ? <Text numberOfLines={2} style={[styles.resultSubtitle, alignment, { color: c.textSecondary }]}>{getName(selectedCategory)}</Text> : null}
        </View>
        <View style={[styles.sortActions, rowDirection]}>
          {categoryId != null && (
            <TouchableOpacity onPress={() => setCategoryId(null)} accessibilityRole="button" accessibilityLabel={copy.clearCategory} style={[styles.clearBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <MaterialCommunityIcons name="close" size={20} color={c.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowSort(!showSort)} accessibilityRole="button" accessibilityLabel={`${t.sort}: ${sortOptions.find(s => s.key === sort)?.label}`} accessibilityState={{ expanded: showSort }} style={[styles.sortBtn, rowDirection, { backgroundColor: c.card, borderColor: showSort ? c.primary : c.border }]}>
            <MaterialCommunityIcons name="tune-variant" size={18} color={c.textSecondary} />
            <Text style={[styles.sortLabel, { color: c.text }]}>{sortButtonLabel}</Text>
            <MaterialCommunityIcons name={showSort ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showSort} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSort(false)}>
        <View style={[styles.sortOverlay, { paddingHorizontal: gutter, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal onAccessibilityEscape={() => setShowSort(false)}>
          <Pressable onPress={() => setShowSort(false)} accessibilityRole="button" accessibilityLabel={copy.closeSort} style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />
          <View style={[styles.sortDrop, { maxHeight: Math.max(0, height - insets.top - insets.bottom - 32), backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.sortHeading, rowDirection, { borderBottomColor: c.borderLight }]}>
              <Text accessibilityRole="header" style={[styles.sortHeadingText, alignment, { color: c.text }]}>{t.sort}</Text>
              <TouchableOpacity onPress={() => setShowSort(false)} accessibilityRole="button" accessibilityLabel={copy.closeSort} style={[styles.closeSort, { backgroundColor: c.surfaceElevated }]}>
                <MaterialCommunityIcons name="close" size={21} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sortOptions} contentContainerStyle={styles.sortOptionsContent} keyboardShouldPersistTaps="handled">
              {sortOptions.map(s => (
                <TouchableOpacity key={s.key} onPress={() => { setSort(s.key); setShowSort(false); }}
                  accessibilityRole="button" accessibilityState={{ selected: sort === s.key }}
                  style={[styles.sortItem, rowDirection, sort === s.key && { backgroundColor: c.brandSurface }]}>
                  <Text style={[styles.sortItemText, alignment, { color: sort === s.key ? (theme.dark ? c.primary : c.primaryDark) : c.text }]}>{s.label}</Text>
                  {sort === s.key ? <MaterialCommunityIcons name="check" size={20} color={c.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading ? (
        <CatalogSkeleton />
      ) : products.length === 0 ? (
        <EmptyState icon="bag-outline" title={t.noResults} />
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={products} numColumns={numColumns} keyExtractor={i => String(i.id)}
          contentContainerStyle={[styles.grid, { paddingHorizontal: gutter }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.gridItem, { width: `${100 / numColumns}%` }]}>
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
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipList: { flexGrow: 0, flexShrink: 0 },
  chipListContent: { paddingVertical: 8, alignItems: 'center', gap: 8 },
  chip: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipImg: { width: 24, height: 24, borderRadius: 8 },
  chipFallback: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  filterPanel: { paddingVertical: 8 },
  filterTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600', marginBottom: 8 },
  filterOption: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  filterOptionText: { fontSize: 13, lineHeight: 19, fontWeight: '500', textAlign: 'center' },
  sortRow: { flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 10 },
  resultCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 110, minWidth: 110 },
  resultTitle: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  resultSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  sortActions: { alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
  sortBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  sortLabel: { flexShrink: 1, maxWidth: 140, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  sortOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sortDrop: { width: '100%', maxWidth: 560, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sortHeading: { minHeight: 60, alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingStart: 14, paddingEnd: 8, paddingVertical: 8, borderBottomWidth: 1, flexShrink: 0 },
  sortHeadingText: { fontSize: 15, lineHeight: 22, fontWeight: '600', flex: 1 },
  closeSort: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sortOptions: { flexGrow: 0, flexShrink: 1 },
  sortOptionsContent: { paddingVertical: 4 },
  sortItem: { minHeight: 48, alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  sortItemText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  grid: { paddingTop: 2, paddingBottom: 120 },
  gridItem: { paddingHorizontal: 6, alignItems: 'center' },
});
