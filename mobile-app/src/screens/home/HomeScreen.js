import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import HomeHeroCarousel from '../../components/HomeHeroCarousel';
import RemoteImage from '../../components/RemoteImage';
import SectionHeader from '../../components/SectionHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import Gradient from '../../components/Gradient';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import { productsApi, categoriesApi, siteApi } from '../../services/api';
import { CURRENCY_SYMBOL, optimizedImageUri, buildImageUriCandidates } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme';

const TEMPLATE_BANNER_IMAGES = new Set([
  '/assets/img/banner/mini-banner-1.jpg',
  '/assets/img/banner/mini-banner-2.jpg',
  '/assets/img/banner/mini-banner-3.jpg',
  '/assets/img/banner/big-banner.jpg',
]);

function normalizeBannerImage(src) {
  if (!src || TEMPLATE_BANNER_IMAGES.has(src)) {
    return null;
  }

  return src;
}

// Richer, deeper gradients for the primary action tiles (cobalt / teal / indigo / azure).
const ACTION_GRADIENTS = [
  ['#3D8BFF', '#1B33A6'],
  ['#22C3D6', '#155E9E'],
  ['#6A5CFF', '#2B2A8F'],
  ['#2FBF9B', '#136F8F'],
];

export default function HomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName, isRTL } = useLanguage();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const c = theme.colors;
  const isTablet = width >= 768;
  const promoCardWidth = Math.min(width * (isTablet ? 0.52 : 0.78), 560);
  const actionCardWidth = Math.min(width * (isTablet ? 0.42 : 0.72), 420);
  const sponsoredCardWidth = Math.min(width * (isTablet ? 0.34 : 0.6), 360);
  const newArrivalCardWidth = Math.min(300, width * 0.45);
  const gridColumns = width >= 1024 ? 4 : 3;
  const gridCardWidth = Math.max(0, (width - spacing.base * 2) / gridColumns - 8);

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [promoBanners, setPromoBanners] = useState([]);
  const [bigBanner, setBigBanner] = useState(null);
  const [audienceMessage, setAudienceMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cats, prod, spon, siteData] = await Promise.all([
        categoriesApi.list(),
        productsApi.list({ limit: 50, status: 'approved' }),
        productsApi.sponsored().catch(() => []),
        siteApi.content().catch(() => null),
      ]);
      setCategories(cats.categories || cats || []);
      const products = prod.products || prod || [];
      setFeatured(products.slice(0, 30));
      setNewArrivals(products.slice(0, 20));
      setSponsored(spon.products || spon || []);
      const homeContent = siteData?.content?.home || siteData?.home || {};
      setHeroContent(homeContent.hero || null);
      const mobileContent = siteData?.content?.mobileApp || siteData?.mobileApp || {};
      setAudienceMessage(mobileContent.audienceMessage || homeContent.advertText || '');
      setPromoBanners(
        (homeContent.promoBanners || []).slice(0, 3).map((banner, index) => ({
          ...banner,
          image: normalizeBannerImage(banner?.image),
        }))
      );
      setBigBanner(
        homeContent.bigBanner
          ? {
              ...homeContent.bigBanner,
              image: normalizeBannerImage(homeContent.bigBanner.image),
            }
          : null
      );
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (loading) return undefined;
    const resetTimer = setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 60);
    return () => clearTimeout(resetTimer);
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openTab = (tabName) => {
    const parent = navigation.getParent();
    if (parent?.navigate) {
      parent.navigate(tabName);
      return;
    }

    navigation.navigate(tabName);
  };

  const goProduct = (p) => navigation.navigate('ProductDetail', { id: p.id, product: p });
  const goCategory = (cat) => navigation.navigate('Products', { categoryId: cat.id, title: getName(cat), categoriesMode: true });

  const getBannerTitle = (title) => (title || '').split(/\n+/).filter(Boolean);

  const heroSlides = (heroContent?.slides || []).map(slide => ({
    ...slide,
    title: getName(slide, 'title') || slide.title,
    subtitle: getName(slide, 'subtitle') || slide.subtitle || t.featured,
    description: getName(slide, 'description') || slide.description || '',
    priceValue: slide.priceValue || '',
  }));

  useEffect(() => {
    const promoUris = promoBanners
      .map((item) => buildImageUriCandidates(item?.image)[0])
      .filter(Boolean);

    const bigBannerUri = buildImageUriCandidates(bigBanner?.image)[0];
    if (bigBannerUri) {
      promoUris.push(bigBannerUri);
    }

    promoUris.forEach((uri) => {
      Image.prefetch(uri).catch(() => {});
    });
  }, [bigBanner?.image, promoBanners]);

  useEffect(() => {
    const visibleProductUris = [
      ...featured.slice(0, 6),
      ...sponsored.slice(0, 4),
      ...newArrivals.slice(0, 4),
    ]
      .map((product) => buildImageUriCandidates(product?.images?.[0]?.url || product?.image || product?.thumbnail)[0])
      .filter(Boolean);

    Array.from(new Set(visibleProductUris)).forEach((uri) => {
      Image.prefetch(uri).catch(() => {});
    });
  }, [featured, newArrivals, sponsored]);

  const openPromo = (href, title) => {
    const [, queryString = ''] = String(href || '/search').split('?');
    const query = new URLSearchParams(queryString);
    const sort = query.get('sort');
    const categoryId = query.get('categoryId') || query.get('category');
    const params = { title: getBannerTitle(title).join(' ') || 'Offers' };

    if (['newest', 'price_asc', 'price_desc', 'name_asc'].includes(sort)) {
      params.sort = sort;
    }

    if (categoryId) {
      params.categoryId = categoryId;
    }

    navigation.navigate('Products', params);
  };

  const openHeroDestination = (href, fallbackTitle) => {
    const target = String(href || '/search');

    if (target.startsWith('/about')) {
      navigation.navigate('About');
      return;
    }

    if (target.startsWith('/contact')) {
      navigation.navigate('Contact');
      return;
    }

    openPromo(target, fallbackTitle || 'Explore Products');
  };



  const serviceHighlights = [
    { key: 'trusted', title: 'Trusted sellers', icon: 'shield-check-outline' },
    { key: 'delivery', title: 'Fast delivery', icon: 'truck-fast-outline' },
    { key: 'support', title: 'Live support', icon: 'headset' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.brandBlock}>
          <BrandLogo width={172} />
          <Text style={[styles.greeting, { color: c.textSecondary }]}>
            {user ? `Welcome back, ${user.name?.split(' ')[0]}` : 'Afghanistan commerce, redesigned for mobile'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} accessibilityRole="button" accessibilityLabel={t.searchTitle || 'Search'} style={[styles.iconBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
            <MaterialCommunityIcons name="magnify" size={24} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openTab('CartTab')} accessibilityRole="button" accessibilityLabel={t.cart} style={[styles.iconBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
            <MaterialCommunityIcons name="cart-outline" size={24} color={c.text} />
            {cartCount > 0 && <View style={[styles.cartBadge, { backgroundColor: c.error }]}><Text numberOfLines={1} maxFontSizeMultiplier={1} style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
          <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.searchText, { color: c.placeholder }]}>{t.search}</Text>
        </TouchableOpacity>

        {audienceMessage ? (
          <View style={[styles.audienceMessage, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.audienceIcon, { backgroundColor: c.primary + '18' }]}>
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color={c.primary} />
            </View>
            <Text style={[styles.audienceText, { color: c.text }]} numberOfLines={3}>{audienceMessage}</Text>
          </View>
        ) : null}

        <SectionReveal delay={20}>
          <HomeHeroCarousel
            slides={heroSlides}
            primaryLabel={heroContent?.primaryButtonLabel || 'Shop now'}
            secondaryLabel={heroContent?.secondaryButtonLabel || 'Explore products'}
            onPrimaryPress={(slide) => slide?.productId
              ? navigation.navigate('ProductDetail', { id: slide.productId })
              : openHeroDestination(slide?.primaryButtonHref || heroContent?.primaryButtonHref || '/search', heroContent?.primaryButtonLabel || t.shop)}
            onSecondaryPress={() => openHeroDestination(heroContent?.secondaryButtonHref || '/search?sort=newest', heroContent?.secondaryButtonLabel || 'Explore products')}
          />
        </SectionReveal>

        <SectionReveal delay={90}>
          <View style={styles.carouselMeta}>
            {serviceHighlights.map((item) => (
              <View key={item.key} style={[styles.carouselPill, shadows.sm, { backgroundColor: c.card, borderColor: c.border }]}>
                <MaterialCommunityIcons name={item.icon} size={16} color={c.primary} />
                <Text style={[styles.carouselPillText, { color: c.textSecondary }]}>{item.title}</Text>
              </View>
            ))}
          </View>
        </SectionReveal>

        {promoBanners.length > 0 && (
          <SectionReveal delay={130}>
            <SectionHeader title="Featured Offers" actionLabel={t.viewAll} onAction={() => navigation.navigate('Products', { title: 'Featured Offers' })} />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={promoBanners}
              keyExtractor={(item, index) => `${item.title || 'banner'}-${index}`}
              contentContainerStyle={{ paddingHorizontal: spacing.base }}
              renderItem={({ item, index }) => {
                const lines = getBannerTitle(item.title);
                const accentSource = heroSlides[index % heroSlides.length]?.image;

                return (
                  <PressableScale
                    scaleTo={0.97}
                    onPress={() => openPromo(item.buttonHref, item.title)}
                    style={[
                      styles.promoCard,
                      { width: promoCardWidth, height: isTablet ? 220 : 194 },
                      shadows.md,
                      { backgroundColor: c.card, borderColor: c.borderLight || c.border },
                    ]}
                  >
                    <View style={[styles.promoFallback, { backgroundColor: c.secondary }]} />
                    <View style={styles.promoAuraPrimary} />
                    <View style={[styles.promoAuraSecondary, { backgroundColor: c.primary + '33' }]} />
                    <View style={styles.promoImageWrap}>
                      <RemoteImage source={item.image} fallbackSource={accentSource} style={styles.promoImageLayer} />
                    </View>
                    <View style={[styles.promoOverlay, { backgroundColor: 'rgba(8, 16, 28, 0.38)' }]} />
                    <View style={[styles.promoSoftOverlay, { backgroundColor: 'rgba(25, 43, 78, 0.28)' }]} />
                    <View style={styles.promoContent}>
                      <View style={[styles.promoContentPanel, { backgroundColor: 'rgba(10, 17, 32, 0.76)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                        <Text numberOfLines={1} style={[styles.promoLabel, { color: c.heroTextMuted }]}>{item.label || `Offer ${index + 1}`}</Text>
                        {lines.slice(0, 2).map((line, lineIndex) => (
                          <Text
                            key={`${line}-${lineIndex}`}
                            style={[styles.promoTitle, { color: c.heroText }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                            allowFontScaling={false}
                          >
                            {line}
                          </Text>
                        ))}
                        <View style={[styles.promoButton, { backgroundColor: c.white, borderColor: c.white }]}>
                          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} maxFontSizeMultiplier={1.15} style={[styles.promoButtonText, { color: c.primary }]}>{item.buttonLabel || 'Shop now'}</Text>
                          <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={16} color={c.primary} />
                        </View>
                      </View>
                    </View>
                  </PressableScale>
                );
              }}
            />
          </SectionReveal>
        )}

        <SectionReveal delay={170}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: spacing.base, paddingTop: spacing.base }}
            renderItem={({ item, index }) => (
              <PressableScale onPress={item.onPress} scaleTo={0.95} style={[styles.actionCard, { width: actionCardWidth }, shadows.md]}>
                <Gradient colors={ACTION_GRADIENTS[index % ACTION_GRADIENTS.length]} style={styles.actionCardFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.actionGlow} />
                  <View style={styles.actionIconGlass}>
                    <MaterialCommunityIcons name={item.icon} size={20} color="#FFFFFF" />
                  </View>
                  <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={styles.actionTitleGlass}>{item.title}</Text>
                  <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={styles.actionSubtitleGlass}>{item.subtitle}</Text>
                  <View style={[styles.actionArrow, isRTL && styles.actionArrowRTL]}>
                    <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={14} color="#FFFFFF" />
                  </View>
                </Gradient>
              </PressableScale>
            )}
          />
        </SectionReveal>

        <SectionReveal delay={210}>
          <SectionHeader title={t.categories} actionLabel={t.viewAll} onAction={() => openTab('CategoriesTab')} />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={categories.slice(0, 8)} keyExtractor={i => String(i.id)}
            contentContainerStyle={styles.categoryListContent}
            renderItem={({ item }) => (
              <PressableScale onPress={() => goCategory(item)} scaleTo={0.93} style={styles.catCardNew}>
                {item.image ? (
                  <View style={[styles.catImgRing, { borderColor: c.border }]}>
                    <Image source={{ uri: optimizedImageUri(item.image, { width: 96 }) }} style={styles.catImgNew} />
                  </View>
                ) : (
                  <CategoryIcon3D category={item} size={66} />
                )}
                <Text numberOfLines={1} style={[styles.catNameNew, { color: c.text }]}>{getName(item)}</Text>
              </PressableScale>
            )}
          />
        </SectionReveal>

        {sponsored.length > 0 && (
          <SectionReveal delay={250}>
            <SectionHeader title="Popular Now" />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={sponsored} keyExtractor={i => String(i.id)}
              contentContainerStyle={{ paddingHorizontal: spacing.base }}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => goProduct(item)} style={{ width: sponsoredCardWidth, marginRight: spacing.md }} />
              )}
            />
          </SectionReveal>
        )}

        {bigBanner?.title ? (
          <SectionReveal delay={290}>
            <PressableScale
              scaleTo={0.98}
              onPress={() => openPromo(bigBanner.buttonHref, bigBanner.title)}
              style={[styles.bigBannerCard, shadows.md, { backgroundColor: c.card, borderColor: c.borderLight || c.border }]}
            >
            <View style={[styles.bigBannerFallback, { backgroundColor: c.secondary }]} />
            <View style={styles.bigBannerAuraPrimary} />
            <View style={[styles.bigBannerAuraSecondary, { backgroundColor: c.primary + '33' }]} />
            <View style={styles.bigBannerImageWrap}>
              <RemoteImage source={bigBanner.image} fallbackSource={heroSlides[0]?.image} style={styles.bigBannerImageLayer} />
            </View>
            <View style={[styles.bigBannerOverlay, { backgroundColor: 'rgba(8,16,28,0.36)' }]} />
            <View style={[styles.bigBannerSoftOverlay, { backgroundColor: 'rgba(25, 43, 78, 0.24)' }]} />
            <View style={styles.bigBannerContent}>
              <View style={[styles.bigBannerContentPanel, { backgroundColor: 'rgba(10,17,32,0.72)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                {bigBanner.subtitle ? <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.bigBannerLabel, { color: c.heroTextMuted }]}>{bigBanner.subtitle}</Text> : null}
                <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={[styles.bigBannerTitle, { color: c.heroText }]}>{String(bigBanner.title).replace(/\n/g, ' ')}</Text>
                {bigBanner.description ? <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={[styles.bigBannerBody, { color: c.heroTextMuted }]}>{bigBanner.description}</Text> : null}
                <View style={[styles.bigBannerButton, { backgroundColor: c.white, borderColor: c.white }]}>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} maxFontSizeMultiplier={1.15} style={[styles.bigBannerButtonText, { color: c.primary }]}>{bigBanner.buttonLabel || 'Shop now'}</Text>
                  <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={16} color={c.primary} />
                </View>
              </View>
            </View>
            </PressableScale>
          </SectionReveal>
        ) : null}

        <SectionReveal delay={330}>
          <SectionHeader title={t.featured} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products')} />
          <View style={styles.grid}>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.gridItem}>
                <SkeletonLoader width="100%" height={180} radius={borderRadius.lg} />
                <SkeletonLoader width="80%" height={14} style={{ marginTop: 8 }} />
                <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
              </View>
            )) : featured.map(p => (
              <View key={p.id} style={[styles.gridItem, { width: `${100 / gridColumns}%` }]}>
                <ProductCard product={p} onPress={() => goProduct(p)} style={{ width: gridCardWidth }} />
              </View>
            ))}
          </View>
        </SectionReveal>

        {newArrivals.length > 0 && (
          <SectionReveal delay={370}>
            <SectionHeader title={t.newArrivals} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products', { sort: 'newest' })} />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={newArrivals} keyExtractor={i => String(i.id)}
              contentContainerStyle={{ paddingHorizontal: spacing.base }}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => goProduct(item)} style={{ width: newArrivalCardWidth, marginRight: spacing.md }} />
              )}
            />
          </SectionReveal>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionReveal({ children, delay = 0 }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(16)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1 },
  brandBlock: { flex: 1, paddingRight: spacing.base },
  greeting: { fontSize: fontSize.sm, marginTop: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cartBadge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 3, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#FFF', fontSize: 10, lineHeight: 14, fontWeight: fontWeight.bold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.base, marginTop: spacing.sm, paddingHorizontal: spacing.md, height: 46, borderRadius: borderRadius.md, borderWidth: 1, gap: 10 },
  searchText: { flex: 1, minWidth: 0, fontSize: fontSize.base, lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' },
  carouselMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.base, marginTop: spacing.sm },
  carouselPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  carouselPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  promoCard: { borderRadius: borderRadius.xl, overflow: 'hidden', marginRight: spacing.md, borderWidth: 1 },
  promoImageWrap: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  promoImageLayer: { width: '100%', height: '100%' },
  promoOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  promoSoftOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  promoFallback: { ...StyleSheet.absoluteFillObject },
  promoAuraPrimary: { position: 'absolute', top: -42, right: -28, width: 160, height: 160, borderRadius: borderRadius.full, backgroundColor: 'rgba(80, 156, 255, 0.22)' },
  promoAuraSecondary: { position: 'absolute', bottom: -54, left: -34, width: 142, height: 142, borderRadius: borderRadius.full },
  promoContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: spacing.md, zIndex: 10, elevation: 10 },
  promoContentPanel: { alignSelf: 'flex-start', maxWidth: '80%', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  promoLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.1 },
  promoTitle: { fontSize: fontSize.md, fontWeight: fontWeight.heavy, lineHeight: 22, marginTop: 4 },
  promoButton: { height: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 14, marginTop: spacing.md },
  promoButtonText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  audienceMessage: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: spacing.base, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1 },
  audienceIcon: { width: 34, height: 34, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  audienceText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, fontWeight: fontWeight.semibold },
  actionCard: { height: 172, marginRight: 12, borderRadius: borderRadius.xl, overflow: 'hidden' },
  actionCardFill: { height: '100%', padding: spacing.base, justifyContent: 'flex-end' },
  actionGlow: { position: 'absolute', top: -30, right: -24, width: 110, height: 110, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.18)' },
  actionIconGlass: { width: 38, height: 38, borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  actionTitleGlass: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.bold, color: '#FFFFFF', letterSpacing: 0.1, includeFontPadding: false },
  actionSubtitleGlass: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 3, color: 'rgba(255,255,255,0.82)' },
  actionArrow: { position: 'absolute', top: spacing.base, right: spacing.base, width: 26, height: 26, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  actionArrowRTL: { right: undefined, left: spacing.base },
  categoryListContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  catCardNew: { alignItems: 'center', marginRight: 16, width: 72 },
  catImgRing: { width: 62, height: 62, borderRadius: borderRadius.full, borderWidth: 1, padding: 2, backgroundColor: '#FFF', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  catImgNew: { width: 54, height: 54, borderRadius: borderRadius.full },
  catNameNew: { fontSize: fontSize.xs, lineHeight: 16, marginTop: 10, textAlign: 'center', fontWeight: fontWeight.semibold, includeFontPadding: false },
  bigBannerCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, borderRadius: borderRadius.xl, overflow: 'hidden', height: 210, borderWidth: 1 },
  bigBannerFallback: { ...StyleSheet.absoluteFillObject },
  bigBannerImageWrap: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  bigBannerImageLayer: { width: '100%', height: '100%' },
  bigBannerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  bigBannerSoftOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  bigBannerAuraPrimary: { position: 'absolute', top: -64, right: -42, width: 220, height: 220, borderRadius: borderRadius.full, backgroundColor: 'rgba(80, 156, 255, 0.2)' },
  bigBannerAuraSecondary: { position: 'absolute', bottom: -86, left: -56, width: 210, height: 210, borderRadius: borderRadius.full },
  bigBannerContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: spacing.md, zIndex: 10, elevation: 10 },
  bigBannerContentPanel: { maxWidth: '72%', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  bigBannerLabel: { fontSize: fontSize.xs, lineHeight: 16, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.1, includeFontPadding: false },
  bigBannerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, lineHeight: 28, marginTop: 4 },
  bigBannerBody: { fontSize: fontSize.sm, lineHeight: 19, marginTop: 4 },
  bigBannerButton: { height: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 14, marginTop: spacing.md },
  bigBannerButtonText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base },
  gridItem: { paddingHorizontal: 4 },
});
