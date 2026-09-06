import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { categoriesApi } from '../../services/api';
import { optimizedImageUri } from '../../config';
import { borderRadius, fontSize, fontWeight, spacing } from '../../theme';

const QUICK_LINKS = [
  { key: 'all', title: 'All products', subtitle: 'Browse the complete marketplace', icon: 'view-grid-outline', params: { title: 'All Products' } },
  { key: 'new', title: 'New arrivals', subtitle: 'See the newest products first', icon: 'clock-outline', params: { title: 'New Arrivals', sort: 'newest' } },
  { key: 'stock', title: 'In stock', subtitle: 'Only products available now', icon: 'check-circle-outline', params: { title: 'In-stock Products', inStock: true } },
  { key: 'offers', title: 'Best price', subtitle: 'Start with the lowest price', icon: 'tag-outline', params: { title: 'Best Price', sort: 'price_asc' } },
];

export default function CategoriesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { getName, isRTL } = useLanguage();
  const c = theme.colors;
  const numColumns = width >= 768 ? 4 : 2;
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data.categories || data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((item) => String(getName(item) || '').toLowerCase().includes(needle));
  }, [categories, getName, query]);

  const openProducts = (params) => navigation.navigate('Products', { categoriesMode: true, ...params });

  const quickBrowse = !query ? (
    <View style={styles.quickSection}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>More ways to browse</Text>
      <View style={styles.quickGrid}>
        {QUICK_LINKS.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.86}
            onPress={() => openProducts(item.params)}
            style={[styles.quickCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: c.brandSurface }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={c.primary} />
            </View>
            <View style={styles.quickCopy}>
              <Text numberOfLines={1} style={[styles.quickTitle, { color: c.text }]}>{item.title}</Text>
              <Text numberOfLines={2} style={[styles.quickSubtitle, { color: c.textSecondary }]}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={c.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ) : null;

  const listHeader = (
    <>


      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
        <MaterialCommunityIcons name="magnify" size={21} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories"
          placeholderTextColor={c.placeholder}
          style={[styles.searchInput, { color: c.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClear} hitSlop={4} accessibilityRole="button" accessibilityLabel="Clear category search">
            <MaterialCommunityIcons name="close-circle" size={20} color={c.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.categoryHeading}>
        <Text style={[styles.sectionTitle, styles.categoryTitle, { color: c.text }]}>All categories</Text>
        <Text style={[styles.categoryCount, { color: c.textSecondary }]}>{filteredCategories.length}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title="Categories"
        subtitle="Browse before viewing products"
        showBack={false}
        right={(
          <TouchableOpacity onPress={() => navigation.navigate('Search')} accessibilityRole="button" accessibilityLabel="Search products" style={[styles.headerAction, { backgroundColor: c.surface, borderColor: c.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={c.text} />
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading categories…</Text>
        </View>
      ) : (
        <FlatList
          key={`categories-${numColumns}`}
          data={filteredCategories}
          numColumns={numColumns}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={quickBrowse}
          ListEmptyComponent={<EmptyState icon="shape-outline" title="No categories found" subtitle="Try a different search." />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadCategories(); setRefreshing(false); }} tintColor={c.primary} />}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.categoryRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.categoryCell, { width: `${100 / numColumns}%` }]}>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => openProducts({ categoryId: item.id, title: getName(item) })}
                style={[styles.categoryCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                {item.image ? (
                  <Image source={{ uri: optimizedImageUri(item.image, { width: 360 }) }} style={[styles.categoryImage, { backgroundColor: c.skeleton }]} resizeMode="cover" />
                ) : (
                  <View style={[styles.categoryImage, styles.categoryFallback, { backgroundColor: c.brandSurface }]}>
                    <CategoryIcon3D category={item} size={96} />
                  </View>
                )}
                <View style={styles.categoryCopy}>
                  <Text numberOfLines={2} style={[styles.categoryName, { color: c.text }]}>{getName(item)}</Text>
                  <View style={styles.categoryLink}>
                    <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.categoryLinkText, { color: c.primary }]}>View products</Text>
                    <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={15} color={c.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: spacing.md, paddingBottom: 120 },
  headerAction: { width: 44, height: 44, borderRadius: borderRadius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.xl, padding: spacing.base, marginTop: spacing.sm, marginHorizontal: 4, overflow: 'hidden' },
  introIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1, marginLeft: spacing.md },
  introTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  introText: { fontSize: fontSize.sm, lineHeight: 19, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, height: 48, paddingHorizontal: spacing.md, marginHorizontal: 4, marginTop: spacing.base },
  searchInput: { flex: 1, fontSize: fontSize.base, marginLeft: spacing.sm, paddingVertical: 0 },
  searchClear: { width: 44, height: 44, marginRight: -12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.xl, marginBottom: spacing.md, marginHorizontal: 4 },
  quickGrid: { marginHorizontal: 4, gap: spacing.sm },
  quickSection: { marginTop: spacing.sm },
  quickCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  quickIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, minWidth: 0, marginHorizontal: spacing.md },
  quickTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  quickSubtitle: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 3 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4 },
  categoryTitle: { marginHorizontal: 0, marginBottom: spacing.md },
  categoryCount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  categoryRow: { alignItems: 'stretch' },
  categoryCell: { paddingHorizontal: 4 },
  categoryCard: { flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  categoryImage: { width: '100%', aspectRatio: 1.45 },
  categoryFallback: { alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { padding: spacing.md },
  categoryName: { minHeight: 38, fontSize: fontSize.base, lineHeight: 19, fontWeight: fontWeight.bold },
  categoryLink: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
  categoryLinkText: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: fontSize.sm, marginTop: spacing.md },
});
