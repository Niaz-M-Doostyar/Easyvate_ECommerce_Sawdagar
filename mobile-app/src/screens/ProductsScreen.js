import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { products as productsApi, categories as categoriesApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, API_URL } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.lg * 2 - spacing.md) / 2;

export default function ProductsScreen({ navigation, route }) {
  const { t, isRTL, getLocalizedName } = useLanguage();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(route?.params?.categoryId || null);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: p, limit: 20, sort };
      if (search) params.search = search;
      if (selectedCat) params.category = selectedCat;
      const data = await productsApi.list(params);
      const prods = data.products || [];
      setItems(prev => append ? [...prev, ...prods] : prods);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [search, selectedCat, sort]);

  useEffect(() => {
    categoriesApi.list().then(d => setCats(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  useEffect(() => {
    if (route?.params?.categoryId) setSelectedCat(route.params.categoryId);
  }, [route?.params?.categoryId]);

  const loadMore = () => {
    if (!loadingMore && page < totalPages) fetchProducts(page + 1, true);
  };

  const renderProduct = ({ item }) => {
    const img = item.images?.[0]?.url;
    const uri = img ? (img.startsWith('http') ? img : `${API_URL}${img}`) : null;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} activeOpacity={0.8}>
        <View style={styles.cardImg}>
          {uri ? <Image source={{ uri }} style={styles.img} resizeMode="contain" /> :
            <Ionicons name="image-outline" size={36} color={colors.border} />}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.name, isRTL && { textAlign: 'right' }]} numberOfLines={2}>{getLocalizedName(item)}</Text>
          <Text style={[styles.price, isRTL && { textAlign: 'right' }]}>{formatPrice(item.retailPrice || item.suggestedPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginHorizontal: spacing.sm }} />
        <TextInput
          style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t('search_placeholder')}
          returnKeyType="search"
          onSubmitEditing={() => fetchProducts(1)}
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={[{ id: null, nameEn: t('all') }, ...cats]}
        keyExtractor={i => String(i.id)}
        showsHorizontalScrollIndicator={false}
        inverted={isRTL}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.chip, selectedCat === cat.id && styles.chipActive]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Text style={[styles.chipText, selectedCat === cat.id && styles.chipTextActive]}>
              {cat.id === null ? cat.nameEn : getLocalizedName(cat)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Sort */}
      <View style={[styles.sortRow, isRTL && { flexDirection: 'row-reverse' }]}>
        {['newest', 'price_low', 'price_high'].map(s => (
          <TouchableOpacity key={s} style={[styles.sortBtn, sort === s && styles.sortBtnActive]} onPress={() => setSort(s)}>
            <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
              {s === 'newest' ? t('newest') : s === 'price_low' ? '↑ ' + t('price') : '↓ ' + t('price')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          numColumns={2}
          columnWrapperStyle={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          renderItem={renderProduct}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: spacing.md }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>{t('no_products_found')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: spacing.md, marginBottom: 0, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: fontSize.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.round, backgroundColor: colors.white, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  sortRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.xs },
  sortBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.white },
  sortBtnActive: { backgroundColor: colors.primary },
  sortText: { fontSize: fontSize.xs, color: colors.textLight },
  sortTextActive: { color: colors.white },
  row: { justifyContent: 'space-between' },
  card: { width: CARD_W, backgroundColor: colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardImg: { height: 140, backgroundColor: colors.grayLighter, justifyContent: 'center', alignItems: 'center' },
  img: { width: '100%', height: '100%' },
  cardBody: { padding: spacing.sm },
  name: { fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.xs, lineHeight: 18 },
  price: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.primary },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyText: { fontSize: fontSize.lg, color: colors.textLight, marginTop: spacing.md },
});
