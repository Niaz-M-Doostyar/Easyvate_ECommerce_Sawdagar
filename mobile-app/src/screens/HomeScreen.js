import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { products as productsApi, categories as categoriesApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, API_URL } from '../config';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

function ProductCard({ item, onPress, getLocalizedName, isRTL }) {
  const image = item.images?.[0]?.url;
  const imageUri = image ? (image.startsWith('http') ? image : `${API_URL}${image}`) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}><Ionicons name="image-outline" size={40} color={colors.border} /></View>
        )}
        {item.isSponsored && (
          <View style={styles.sponsorBadge}><Text style={styles.sponsorText}>★</Text></View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
          {getLocalizedName(item)}
        </Text>
        <Text style={[styles.cardPrice, isRTL && { textAlign: 'right' }]}>
          {formatPrice(item.retailPrice || item.suggestedPrice)}
        </Text>
        {item.stock <= 0 && <Text style={styles.outOfStock}>Out of Stock</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { t, isRTL, getLocalizedName } = useLanguage();
  const { user } = useAuth();
  const [sponsored, setSponsored] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cats, setCats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sp, na, ca] = await Promise.all([
        productsApi.sponsored().catch(() => ({ products: [] })),
        productsApi.list({ limit: 10, sort: 'newest' }).catch(() => ({ products: [] })),
        categoriesApi.list().catch(() => ({ categories: [] })),
      ]);
      setSponsored(sp.products || []);
      setNewArrivals(na.products || []);
      setCats((ca.categories || []).slice(0, 8));
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const sections = [];

  // Hero
  sections.push({ key: 'hero', render: () => (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>{t('welcome')}</Text>
      <Text style={styles.heroSub}>{t('hero_subtitle')}</Text>
      <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('ProductsTab')}>
        <Text style={styles.heroBtnText}>{t('shop_now')}</Text>
      </TouchableOpacity>
    </View>
  )});

  // Features
  sections.push({ key: 'features', render: () => (
    <View style={[styles.features, isRTL && { flexDirection: 'row-reverse' }]}>
      {[
        { icon: 'bicycle-outline', label: t('free_delivery') },
        { icon: 'cash-outline', label: t('cash_on_delivery') },
        { icon: 'shield-checkmark-outline', label: t('support_247') || '24/7 Support' },
      ].map((f, i) => (
        <View key={i} style={styles.featureItem}>
          <Ionicons name={f.icon} size={24} color={colors.primary} />
          <Text style={styles.featureText}>{f.label}</Text>
        </View>
      ))}
    </View>
  )});

  // Categories
  if (cats.length > 0) {
    sections.push({ key: 'cats-header', render: () => (
      <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.sectionTitle}>{t('featured_categories')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
          <Text style={styles.viewAll}>{t('view_all')}</Text>
        </TouchableOpacity>
      </View>
    )});
    sections.push({ key: 'cats', render: () => (
      <FlatList
        horizontal
        data={cats}
        keyExtractor={i => String(i.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        inverted={isRTL}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.catItem} onPress={() => navigation.navigate('ProductsTab', { categoryId: item.id })}>
            <View style={styles.catIcon}>
              <Ionicons name="grid-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.catText} numberOfLines={1}>{getLocalizedName(item)}</Text>
          </TouchableOpacity>
        )}
      />
    )});
  }

  // Sponsored
  if (sponsored.length > 0) {
    sections.push({ key: 'sp-header', render: () => (
      <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.sectionTitle}>{t('sponsored_products')}</Text>
      </View>
    )});
    sections.push({ key: 'sp', render: () => (
      <FlatList
        horizontal
        data={sponsored}
        keyExtractor={i => String(i.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        inverted={isRTL}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, marginRight: spacing.md }}>
            <ProductCard item={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} getLocalizedName={getLocalizedName} isRTL={isRTL} />
          </View>
        )}
      />
    )});
  }

  // New Arrivals
  if (newArrivals.length > 0) {
    sections.push({ key: 'na-header', render: () => (
      <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.sectionTitle}>{t('new_arrivals')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
          <Text style={styles.viewAll}>{t('view_all')}</Text>
        </TouchableOpacity>
      </View>
    )});
    sections.push({ key: 'na', render: () => (
      <View style={[styles.productGrid, isRTL && { flexDirection: 'row-reverse' }]}>
        {newArrivals.slice(0, 6).map(item => (
          <View key={item.id} style={{ width: CARD_WIDTH, marginBottom: spacing.md }}>
            <ProductCard item={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} getLocalizedName={getLocalizedName} isRTL={isRTL} />
          </View>
        ))}
      </View>
    )});
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={i => i.key}
      renderItem={({ item }) => item.render()}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.primary, padding: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  heroTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
  heroSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs, textAlign: 'center' },
  heroBtn: { backgroundColor: colors.white, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.round, marginTop: spacing.lg },
  heroBtnText: { color: colors.primary, fontWeight: 'bold', fontSize: fontSize.lg },
  features: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg, paddingHorizontal: spacing.md, backgroundColor: colors.white, marginBottom: spacing.sm },
  featureItem: { alignItems: 'center', flex: 1 },
  featureText: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.dark },
  viewAll: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  catItem: { alignItems: 'center', marginRight: spacing.lg, width: 72 },
  catIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.grayLighter, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  catText: { fontSize: fontSize.xs, color: colors.text, textAlign: 'center' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardImage: { height: 140, backgroundColor: colors.grayLighter, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  sponsorBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: colors.warning, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sponsorText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  cardBody: { padding: spacing.sm },
  cardName: { fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.xs, lineHeight: 18 },
  cardPrice: { fontSize: fontSize.md, fontWeight: 'bold', color: colors.primary },
  outOfStock: { fontSize: fontSize.xs, color: colors.danger, marginTop: 2 },
});
