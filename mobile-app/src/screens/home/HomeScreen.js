import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const c = theme.colors;
  const isTablet = width >= 768;
  const promoCardWidth = Math.min(width * (isTablet ? 0.52 : 0.78), 560);
  const actionCardWidth = Math.min(width * (isTablet ? 0.42 : 0.72), 420);
  const sponsoredCardWidth = Math.min(width * (isTablet ? 0.34 : 0.6), 360);
  const newArrivalCardWidth = Math.min(width * (isTablet ? 0.32 : 0.55), 340);
  const gridColumns = isTablet ? 3 : 2;

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [promoBanners, setPromoBanners] = useState([]);
  const [bigBanner, setBigBanner] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cats, prod, spon, siteData] = await Promise.all([
        categoriesApi.list(),
        productsApi.list({ limit: 20, status: 'approved' }),
        productsApi.sponsored().catch(() => []),
        siteApi.content().catch(() => null),
      ]);
      setCategories(cats.categories || cats || []);
      const products = prod.products || prod || [];
      setFeatured(products.slice(0, 8));
      setNewArrivals(products.slice(-8).reverse());
      setSponsored(spon.products || spon || []);
      const homeContent = siteData?.content?.home || siteData?.home || {};
      setHeroContent(homeContent.hero || null);
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

  useEffect(() => { load(); }, [load]);

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
  const goCategory = (cat) => navigation.navigate('Products', { categoryId: cat.id, title: getName(cat) });

  const getBannerTitle = (title) => (title || '').split(/\n+/).filter(Boolean);

  const heroSlides = (heroContent?.slides?.length ? heroContent.slides : [
    {
      subtitle: heroContent?.badge || `Start From ${CURRENCY_SYMBOL}999`,
      title: heroContent?.titleLines?.join(' ') || 'Explore The Trendy products for you.',
      description: heroContent?.description || 'Afghanistan\'s premier online marketplace with thousands of quality products.',
      image: heroContent?.image || '/assets/img/hero/01.png',
      priceLabel: heroContent?.priceLabel || 'Price',
      priceValue: heroContent?.priceValue || `${CURRENCY_SYMBOL}2,500`,
    },
    {
      subtitle: heroContent?.badge || `Start From ${CURRENCY_SYMBOL}999`,
      title: 'Explore The Trendy products for you.',
      description: heroContent?.description || 'Discover fashion, daily essentials, and curated offers in one storefront.',
      image: '/assets/img/hero/02.png',
      priceLabel: heroContent?.priceLabel || 'Price',
      priceValue: heroContent?.priceValue || `${CURRENCY_SYMBOL}2,500`,
    },
    {
      subtitle: heroContent?.badge || `Start From ${CURRENCY_SYMBOL}999`,
      title: 'Explore The Trendy products for you.',
      description: heroContent?.description || 'Fast delivery and a cleaner mobile shopping experience built for daily use.',
      image: '/assets/img/hero/03.png',
      priceLabel: heroContent?.priceLabel || 'Price',
      priceValue: heroContent?.priceValue || `${CURRENCY_SYMBOL}2,500`,
    },
  ]).map((slide, index) => ({
    subtitle: slide.subtitle || heroContent?.badge || `Start From ${CURRENCY_SYMBOL}999`,
    title: slide.title || heroContent?.titleLines?.join(' ') || `Slide ${index + 1}`,
    description: slide.description || heroContent?.description || 'Explore products and discover what is new this week.',
    image: slide.image || heroContent?.image || `/assets/img/hero/0${(index % 3) + 1}.png`,
    priceLabel: slide.priceLabel || heroContent?.priceLabel || 'Price',
    priceValue: slide.priceValue || heroContent?.priceValue || `${CURRENCY_SYMBOL}2,500`,
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

  const catIcons = ['shape-outline', 'hanger', 'cellphone', 'sofa-outline', 'dumbbell', 'silverware-fork-knife', 'book-open-page-variant-outline', 'palette-outline'];
  const actionCards = user ? [
    {
      key: 'orders',
      title: 'Track your orders',
      subtitle: 'See delivery progress, order history, and purchase details in one place.',
      icon: 'clipboard-text-clock-outline',
      onPress: () => openTab('OrdersTab'),
    },
    {
      key: 'cart',
      title: 'Continue checkout',
      subtitle: cartCount > 0 ? `${cartCount} item${cartCount === 1 ? '' : 's'} waiting in your cart.` : 'Review saved items and finish checkout faster.',
      icon: 'cart-check-outline',
      onPress: () => openTab('CartTab'),
    },
  ] : [
    {
      key: 'signin',
      title: 'Sign in for faster checkout',
      subtitle: 'Save addresses, keep your cart, and track every order from one account.',
      icon: 'account-check-outline',
      onPress: () => navigation.navigate('Auth', { redirectTo: { tab: 'HomeTab' } }),
    },
    {
      key: 'arrivals',
      title: 'See new arrivals',
      subtitle: 'Fresh fashion, essentials, and trending finds added regularly.',
      icon: 'shopping-search-outline',
      onPress: () => navigation.navigate('Products', { sort: 'newest', title: t.newArrivals }),
    },
  ];

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
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={[styles.iconBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}> 
            <MaterialCommunityIcons name="magnify" size={24} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openTab('CartTab')} style={[styles.iconBtn, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}> 
            <MaterialCommunityIcons name="cart-outline" size={24} color={c.text} />
            {cartCount > 0 && <View style={[styles.cartBadge, { backgroundColor: c.error }]}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
          <Text style={[styles.searchText, { color: c.placeholder }]}>{t.search}</Text>
        </TouchableOpacity>

        <SectionReveal delay={20}>
          <HomeHeroCarousel
            slides={heroSlides}
            primaryLabel={heroContent?.primaryButtonLabel || 'Shop now'}
            secondaryLabel={heroContent?.secondaryButtonLabel || 'Explore products'}
            onPrimaryPress={() => openHeroDestination(heroContent?.primaryButtonHref || '/search', heroContent?.primaryButtonLabel || 'Shop now')}
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
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openPromo(item.buttonHref, item.title)}
                    style={[
                      styles.promoCard,
                      { width: promoCardWidth, height: isTablet ? 220 : 194 },
                      shadows.md,
                      { backgroundColor: c.card, borderColor: c.borderLight || c.border },
                    ]}
                  >
                    <View style={[styles.promoFallback, { backgroundColor: '#16253C' }]} />
                    <View style={styles.promoAuraPrimary} />
                    <View style={styles.promoAuraSecondary} />
                    <View style={styles.promoImageWrap}>
                      <RemoteImage source={item.image} fallbackSource={accentSource} style={styles.promoImageLayer} />
                    </View>
                    <View style={[styles.promoOverlay, { backgroundColor: 'rgba(8, 16, 28, 0.38)' }]} />
                    <View style={[styles.promoSoftOverlay, { backgroundColor: 'rgba(25, 43, 78, 0.28)' }]} />
                    <View style={styles.promoContent}>
                      <View style={[styles.promoContentPanel, { backgroundColor: 'rgba(10, 17, 32, 0.52)', borderColor: 'rgba(255,255,255,0.16)' }]}> 
                        <Text style={[styles.promoLabel, { color: '#D6E4FF' }]}>{item.label || `Offer ${index + 1}`}</Text>
                        {lines.map((line, lineIndex) => (
                          <Text
                            key={`${line}-${lineIndex}`}
                            style={[styles.promoTitle, { color: '#FFFFFF' }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                            allowFontScaling={false}
                          >
                            {line}
                          </Text>
                        ))}
                        <View style={[styles.promoButton, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}> 
                          <Text style={[styles.promoButtonText, { color: c.primary }]}>{item.buttonLabel || 'Shop now'}</Text>
                          <MaterialCommunityIcons name="arrow-right" size={16} color={c.primary} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </SectionReveal>
        )}

        <SectionReveal delay={170}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={actionCards}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: spacing.base, paddingTop: spacing.base }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={item.onPress} activeOpacity={0.9} style={[styles.actionCard, { width: actionCardWidth }, shadows.sm, { backgroundColor: c.card, borderColor: c.border }]}> 
                <View style={[styles.actionStripe, { backgroundColor: c.primary + '1F' }]} />
                <View style={[styles.actionIcon, { backgroundColor: c.brandSurface }]}> 
                  <MaterialCommunityIcons name={item.icon} size={20} color={c.primary} />
                </View>
                <Text style={[styles.actionTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.actionSubtitle, { color: c.textSecondary }]}>{item.subtitle}</Text>
              </TouchableOpacity>
            )}
          />
        </SectionReveal>

        <SectionReveal delay={210}>
          <SectionHeader title={t.categories} actionLabel={t.viewAll} onAction={() => navigation.navigate('Products')} />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={categories.slice(0, 8)} keyExtractor={i => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.base }}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => goCategory(item)} activeOpacity={0.9} style={[styles.catCard, shadows.sm, { backgroundColor: c.card, borderColor: c.border }]}>
                {item.image ? (
                  <Image source={{ uri: optimizedImageUri(item.image, { width: 80 }) }} style={styles.catImg} />
                ) : (
                  <View style={[styles.catIcon, { backgroundColor: c.brandSurface }]}> 
                    <MaterialCommunityIcons name={catIcons[index % catIcons.length]} size={24} color={c.primary} />
                  </View>
                )}
                <Text numberOfLines={1} style={[styles.catName, { color: c.text }]}>{getName(item)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={c.textMuted} style={{ marginTop: 4 }} />
              </TouchableOpacity>
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
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => openPromo(bigBanner.buttonHref, bigBanner.title)}
              style={[styles.bigBannerCard, shadows.md, { backgroundColor: c.card, borderColor: c.borderLight || c.border }]}
            >
            <View style={[styles.bigBannerFallback, { backgroundColor: '#16253C' }]} />
            <View style={styles.bigBannerAuraPrimary} />
            <View style={styles.bigBannerAuraSecondary} />
            <View style={styles.bigBannerImageWrap}>
              <RemoteImage source={bigBanner.image} fallbackSource={heroSlides[0]?.image} style={styles.bigBannerImageLayer} />
            </View>
            <View style={[styles.bigBannerOverlay, { backgroundColor: 'rgba(8,16,28,0.36)' }]} />
            <View style={[styles.bigBannerSoftOverlay, { backgroundColor: 'rgba(25, 43, 78, 0.24)' }]} />
            <View style={styles.bigBannerContent}>
              <View style={[styles.bigBannerContentPanel, { backgroundColor: 'rgba(10,17,32,0.52)', borderColor: 'rgba(255,255,255,0.16)' }]}> 
                {bigBanner.subtitle ? <Text style={[styles.bigBannerLabel, { color: '#D6E4FF' }]}>{bigBanner.subtitle}</Text> : null}
                <Text style={[styles.bigBannerTitle, { color: '#FFFFFF' }]}>{String(bigBanner.title).replace(/\n/g, ' ')}</Text>
                {bigBanner.description ? <Text style={[styles.bigBannerBody, { color: '#DDE8FF' }]}>{bigBanner.description}</Text> : null}
                <View style={[styles.bigBannerButton, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}> 
                  <Text style={[styles.bigBannerButtonText, { color: c.primary }]}>{bigBanner.buttonLabel || 'Shop now'}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={c.primary} />
                </View>
              </View>
            </View>
            </TouchableOpacity>
          </SectionReveal>
        ) : null}

        <SectionReveal delay={330}>
          <SectionHeader title={t.featured} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products')} />
          <View style={styles.grid}>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.gridItem}>
                <SkeletonLoader width="100%" height={180} radius={borderRadius.lg} />
                <SkeletonLoader width="80%" height={14} style={{ marginTop: 8 }} />
                <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
              </View>
            )) : featured.map(p => (
              <View key={p.id} style={[styles.gridItem, { width: `${100 / gridColumns}%` }]}> 
                <ProductCard product={p} onPress={() => goProduct(p)} />
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
        <View style={{ height: spacing.xxl }} />
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
  iconBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cartBadge: { position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.base, marginTop: spacing.md, paddingHorizontal: spacing.md, height: 48, borderRadius: borderRadius.lg, borderWidth: 1, gap: 10 },
  searchText: { fontSize: fontSize.base },
  carouselMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.base, marginTop: spacing.sm },
  carouselPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 10 },
  carouselPillText: { fontSize: fontSize.xs, fontWeight: '700' },
  promoCard: { borderRadius: borderRadius.xxl, overflow: 'hidden', marginRight: spacing.md, borderWidth: 1 },
  promoImageWrap: { ...StyleSheet.absoluteFillObject },
  promoImageLayer: { width: '100%', height: '100%' },
  promoOverlay: { ...StyleSheet.absoluteFillObject },
  promoSoftOverlay: { ...StyleSheet.absoluteFillObject },
  promoFallback: { ...StyleSheet.absoluteFillObject },
  promoAuraPrimary: { position: 'absolute', top: -42, right: -28, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(80, 156, 255, 0.22)' },
  promoAuraSecondary: { position: 'absolute', bottom: -54, left: -34, width: 142, height: 142, borderRadius: 71, backgroundColor: 'rgba(114, 84, 255, 0.18)' },
  promoContent: { flex: 1, justifyContent: 'flex-end', padding: spacing.md },
  promoContentPanel: { alignSelf: 'flex-start', maxWidth: '64%', borderWidth: 1, borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  promoLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  promoTitle: { fontSize: fontSize.lg, fontWeight: '800', lineHeight: 26, marginTop: spacing.sm },
  promoButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 10, marginTop: spacing.lg },
  promoButtonText: { fontSize: fontSize.sm, fontWeight: '700' },
  actionCard: { marginRight: 12, borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, overflow: 'hidden' },
  actionStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base },
  actionTitle: { fontSize: fontSize.base, fontWeight: '800' },
  actionSubtitle: { fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.sm },
  catCard: { alignItems: 'center', justifyContent: 'center', marginRight: 12, width: 94, paddingVertical: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1 },
  catImg: { width: 44, height: 44, borderRadius: 22 },
  catIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: fontSize.xs, marginTop: 8, textAlign: 'center', fontWeight: '700' },
  bigBannerCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, borderRadius: borderRadius.xxl, overflow: 'hidden', height: 236, borderWidth: 1 },
  bigBannerFallback: { ...StyleSheet.absoluteFillObject },
  bigBannerImageWrap: { ...StyleSheet.absoluteFillObject },
  bigBannerImageLayer: { width: '100%', height: '100%' },
  bigBannerOverlay: { ...StyleSheet.absoluteFillObject },
  bigBannerSoftOverlay: { ...StyleSheet.absoluteFillObject },
  bigBannerAuraPrimary: { position: 'absolute', top: -64, right: -42, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(80, 156, 255, 0.2)' },
  bigBannerAuraSecondary: { position: 'absolute', bottom: -86, left: -56, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(114, 84, 255, 0.18)' },
  bigBannerContent: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg },
  bigBannerContentPanel: { maxWidth: '64%', borderWidth: 1, borderRadius: borderRadius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  bigBannerLabel: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  bigBannerTitle: { fontSize: fontSize.xxl, fontWeight: '800', lineHeight: 34, marginTop: spacing.sm },
  bigBannerBody: { fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.sm },
  bigBannerButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 10, marginTop: spacing.lg },
  bigBannerButtonText: { fontSize: fontSize.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base },
  gridItem: { paddingHorizontal: 4 },
});
