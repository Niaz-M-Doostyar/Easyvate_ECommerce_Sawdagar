import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import RemoteImage from '../../components/RemoteImage';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { categoriesApi } from '../../services/api';
import { borderRadius, fontSize, fontWeight, spacing } from '../../theme';

const QUICK_LINKS = [
  { key: 'all', icon: 'view-grid-outline', params: {} },
  { key: 'new', icon: 'clock-outline', params: { sort: 'newest' } },
  { key: 'stock', icon: 'check-circle-outline', params: { inStock: true } },
  { key: 'offers', icon: 'tag-outline', params: { sort: 'price_asc' } },
];
const categoryCopy = {
  en: { title: 'Categories', search: 'Search categories', clear: 'Clear category search', allCategories: 'All categories', browse: 'Browse products', view: 'View products', loading: 'Loading categories…', empty: 'No categories found', retry: 'Try a different search.', all: 'All products', new: 'New arrivals', stock: 'In stock', offers: 'Lowest price' },
  ps: { title: 'کټګورۍ', search: 'کټګورۍ ولټوئ', clear: 'لټون پاک کړئ', allCategories: 'ټولې کټګورۍ', browse: 'محصولات وګورئ', view: 'محصولات وګورئ', loading: 'کټګورۍ پورته کېږي…', empty: 'کټګورۍ ونه موندل شوې', retry: 'بل لټون وکړئ.', all: 'ټول محصولات', new: 'نوي محصولات', stock: 'موجود محصولات', offers: 'ټیټه بیه' },
  dr: { title: 'دسته‌بندی‌ها', search: 'جستجوی دسته‌بندی‌ها', clear: 'پاک کردن جستجو', allCategories: 'همه دسته‌بندی‌ها', browse: 'مشاهده محصولات', view: 'مشاهده محصولات', loading: 'دسته‌بندی‌ها بارگیری می‌شوند…', empty: 'دسته‌بندی یافت نشد', retry: 'جستجوی دیگری انجام دهید.', all: 'همه محصولات', new: 'محصولات جدید', stock: 'موجود', offers: 'کمترین قیمت' },
};

export default function CategoriesScreen({ navigation }) {
  const { columns: numColumns, fontScale } = useResponsiveLayout();
  const { theme } = useTheme();
  const { getName, isRTL, lang } = useLanguage();
  const c = theme.colors;
  const copy = categoryCopy[lang] || categoryCopy.en;
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const textAlignment = { textAlign: isRTL ? 'right' : 'left' };
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
      <Text style={[styles.sectionTitle, textAlignment, { color: c.text }]}>{copy.browse}</Text>
      <View style={[styles.quickGrid, rowDirection]}>
        {QUICK_LINKS.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.86}
            onPress={() => openProducts({ ...item.params, title: copy[item.key] })}
            accessibilityRole="button"
            accessibilityLabel={copy[item.key]}
            style={[styles.quickCard, rowDirection, fontScale > 1.3 && { flexBasis: '100%' }, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <MaterialCommunityIcons name={item.icon} size={19} color={c.primary} />
            <Text style={[styles.quickTitle, textAlignment, { color: c.text }]}>{copy[item.key]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ) : null;

  const listHeader = (
    <>


      <View style={[styles.searchBox, rowDirection, { backgroundColor: c.card, borderColor: c.border }] }>
        <MaterialCommunityIcons name="magnify" size={21} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={copy.search}
          accessibilityLabel={copy.search}
          placeholderTextColor={c.placeholder}
          style={[styles.searchInput, textAlignment, { color: c.text, minHeight: Math.ceil(24 * fontScale) + 16 }]}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClear} accessibilityRole="button" accessibilityLabel={copy.clear}>
            <MaterialCommunityIcons name="close-circle" size={20} color={c.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.categoryHeading, rowDirection]}>
        <Text style={[styles.sectionTitle, styles.categoryTitle, textAlignment, { color: c.text }]}>{copy.allCategories}</Text>
        <Text style={[styles.categoryCount, { color: c.textSecondary }]}>{filteredCategories.length}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={copy.title}
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
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>{copy.loading}</Text>
        </View>
      ) : (
        <FlatList
          key={`categories-${numColumns}`}
          data={filteredCategories}
          numColumns={numColumns}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={quickBrowse}
          ListEmptyComponent={<EmptyState icon="shape-outline" title={copy.empty} subtitle={copy.retry} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadCategories(); setRefreshing(false); }} tintColor={c.primary} />}
          contentContainerStyle={styles.list}
          columnWrapperStyle={numColumns > 1 ? styles.categoryRow : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.categoryCell, { width: `${100 / numColumns}%` }]}>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => openProducts({ categoryId: item.id, title: getName(item) })}
                accessibilityRole="button"
                accessibilityLabel={`${getName(item)}: ${copy.view}`}
                style={[styles.categoryCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={[styles.categoryImageFrame, { backgroundColor: c.surfaceElevated }]}>
                  <RemoteImage source={item.image} width={360} resizeMode="contain" style={styles.categoryImage} fallback={<View style={[styles.categoryImage, styles.categoryFallback]}><CategoryIcon3D category={item} size={88} /></View>} />
                </View>
                <View style={styles.categoryCopy}>
                  <Text numberOfLines={2} style={[styles.categoryName, textAlignment, { color: c.text, minHeight: Math.ceil(22 * fontScale) * 2 }]}>{getName(item)}</Text>
                  <View style={[styles.categoryLink, rowDirection]}>
                    <Text style={[styles.categoryLinkText, textAlignment, { color: c.primary }]}>{copy.view}</Text>
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
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  list: { flexGrow: 1, paddingHorizontal: spacing.md, paddingBottom: 120 },
  headerAction: { width: 44, height: 44, borderRadius: borderRadius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchBox: { alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, minHeight: 52, paddingHorizontal: spacing.md, marginHorizontal: 4, marginTop: spacing.sm, gap: spacing.sm },
  searchInput: { flex: 1, minWidth: 0, fontSize: fontSize.base, paddingVertical: spacing.sm },
  searchClear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: fontSize.md, lineHeight: 24, fontWeight: fontWeight.semibold, marginTop: spacing.lg, marginBottom: spacing.md, marginHorizontal: 4 },
  quickGrid: { marginHorizontal: 4, gap: spacing.sm, flexWrap: 'wrap' },
  quickSection: { marginTop: spacing.sm },
  quickCard: { minHeight: 48, minWidth: 136, flexBasis: '45%', flexGrow: 1, alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm },
  quickTitle: { flex: 1, minWidth: 0, fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4 },
  categoryTitle: { flex: 1, marginHorizontal: 0, marginEnd: spacing.md, marginBottom: spacing.md },
  categoryCount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  categoryRow: { alignItems: 'stretch' },
  categoryCell: { paddingHorizontal: 4 },
  categoryCard: { flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  categoryImageFrame: { aspectRatio: 1.1, margin: 5, padding: spacing.md, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  categoryImage: { width: '100%', height: '100%' },
  categoryFallback: { alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  categoryName: { fontSize: fontSize.base, lineHeight: 22, fontWeight: fontWeight.semibold },
  categoryLink: { alignItems: 'center', minHeight: 44, marginTop: 4, gap: 4 },
  categoryLinkText: { flexShrink: 1, fontSize: 13, lineHeight: 19, fontWeight: fontWeight.semibold, includeFontPadding: false },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: fontSize.sm, marginTop: spacing.md },
});
