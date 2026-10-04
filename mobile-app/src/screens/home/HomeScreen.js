import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, StyleSheet, Animated, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import FeaturedProductCard from '../../components/FeaturedProductCard';
import { featuredLayout } from '../../utils/featuredLayout';
import HomeHeroCarousel from '../../components/HomeHeroCarousel';
import RemoteImage from '../../components/RemoteImage';
import SectionHeader from '../../components/SectionHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import CategoryIcon3D from '../../components/CategoryIcon3D';
import { productsApi, categoriesApi, siteApi } from '../../services/api';
import { optimizedImageUri, buildImageUriCandidates } from '../../config';
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
const homeCopy = {
  en: { recommended: 'Recommended for you', featured: 'Featured Products', loadMore: 'Load more products' },
  ps: { recommended: 'ستاسو لپاره وړاندیز شوي', featured: 'ځانګړي محصولات', loadMore: 'نور محصولات وګورئ' },
  dr: { recommended: 'پیشنهاد برای شما', featured: 'محصولات ویژه', loadMore: 'نمایش محصولات بیشتر' },
};
export default function HomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const { width, height, isTablet, fontScale } = useResponsiveLayout();
  const layout = featuredLayout(width, fontScale);
  const { theme } = useTheme();
  const { t, getName, isRTL, lang } = useLanguage();
  const { count: cartCount } = useCart();
  const c = theme.colors;
  const copy = homeCopy[lang] || homeCopy.en;
  const adSize = Math.max(120, Math.min(width - 48, height - 200, 480));
  const promoCardWidth = Math.min(width * (isTablet ? 0.52 : 0.78), 560);
  const newArrivalCardWidth = Math.min(240, Math.max(144, 152 * Math.min(fontScale, 1.6)));
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [featuredDisplayCount, setFeaturedDisplayCount] = useState(50);
  const [recommended, setRecommended] = useState([]);
  const [sponsored, setSponsored] = useState([]);
  const [adVisible, setAdVisible] = useState(false);
  const [readyAd, setReadyAd] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const adShown = useRef(false);
  const adProduct = useMemo(() => {
    const candidates = sponsored.filter(product => product.images?.[0]?.url || product.image || product.thumbnail);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [sponsored]);
  const adImage = adProduct?.images?.[0]?.url || adProduct?.image || adProduct?.thumbnail;
  useEffect(() => {
    if (!adProduct || adShown.current) return;
    let active = true;
    const preload = async () => {
      const candidates = buildImageUriCandidates(adImage, { width: 800, quality: 80 });
      for (const uri of candidates) {
        try {
          const response = await fetch(uri);
          if (!response.ok) continue;
          const blob = await response.blob();
          const loaded = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (!active) return;
          if (!loaded) continue;
          adShown.current = true;
          setReadyAd({ product: adProduct, uri: loaded });
          setAdVisible(true);
          return;
        } catch { if (!active) return; }
      }
    };
    preload();
    return () => { active = false; };
  }, [adProduct?.id, adImage]);
  useEffect(() => {
    if (!adVisible || !adLoaded) return;
    const timer = setTimeout(() => setAdVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [adVisible, adLoaded]);
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
        productsApi.list({ limit: 75 }),
        productsApi.sponsored().catch(() => []),
        siteApi.content().then(data => {
          // Display promotions without waiting for the larger catalog requests.
          const hero = (data?.content?.home || data?.home || {}).hero;
          setHeroContent(hero || null);
          (hero?.slides || []).slice(0, 2).forEach(slide => {
            if (slide.image) Image.prefetch(optimizedImageUri(slide.image, { width: 400, quality: 72 })).catch(() => {});
          });
          return data;
        }).catch(() => null),
      ]);
      setCategories(cats.categories || cats || []);
      const products = prod.products || prod || [];
      setFeatured(products);
      // The catalog is newest first. Keep these shelves distinct so a product
      // does not appear in both New Arrivals and Recommended for you.
      setNewArrivals(products.slice(0, 8));
      setRecommended(products.slice(8, 16));
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
    setFeaturedDisplayCount(50);
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
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      {adVisible && readyAd && <Modal visible transparent animationType="fade" onRequestClose={() => setAdVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06122ab8', padding: 24, opacity: adLoaded ? 1 : 0 }}>
          <View style={{ width: adSize, position: 'relative' }}>
            <View style={{ height: adSize, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', backgroundColor: c.card }}>
              <WebView
                originWhitelist={['*']}
                source={{ html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;height:100vh;background:white;box-sizing:border-box;padding:24px 20px 16px"><img alt="View sponsored product" role="button" src="${readyAd.uri}" style="width:100%;height:100%;object-fit:contain" onload="window.ReactNativeWebView.postMessage('loaded')" onerror="window.ReactNativeWebView.postMessage('error')" onclick="window.ReactNativeWebView.postMessage('open')"></body></html>` }}
                scrollEnabled={false}
                onMessage={({ nativeEvent }) => {
                  if (nativeEvent.data === 'loaded') setAdLoaded(true);
                  if (nativeEvent.data === 'error') setAdVisible(false);
                  if (nativeEvent.data === 'open') { setAdVisible(false); goProduct(readyAd.product); }
                }}
                onError={() => setAdVisible(false)}
                style={{ flex: 1, backgroundColor: 'transparent' }}
              />
            </View>
            <TouchableOpacity onPress={() => { setAdVisible(false); goProduct(readyAd.product); }} accessibilityRole="button" style={{ backgroundColor: c.card, padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
              <Text numberOfLines={2} style={{ color: c.text, fontSize: fontSize.md, lineHeight: 24, fontWeight: fontWeight.semibold, textAlign: isRTL ? 'right' : 'left' }}>{getName(readyAd.product)}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close ad" onPress={() => setAdVisible(false)} style={{ position: 'absolute', top: 10, right: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0009' }}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.brandBlock}>
          <BrandLogo width={140} />
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
                      { width: promoCardWidth },
                      shadows.md,
                      { backgroundColor: c.card, borderColor: c.borderLight || c.border },
                    ]}
                  >
                    <RemoteImage source={item.image} fallbackSource={accentSource} style={styles.offerImage} resizeMode="cover" />
                    <View style={styles.offerContent}>
                      {!!item.label && <Text numberOfLines={1} style={[styles.offerLabel, { color: c.textSecondary }]}>{item.label}</Text>}
                      <Text numberOfLines={2} style={[styles.offerTitle, { color: c.text }]}>{lines.join(' ')}</Text>
                      <View style={[styles.offerAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text numberOfLines={2} style={[styles.offerActionText, { color: c.primary }]}>{item.buttonLabel || 'Shop now'}</Text>
                        <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={c.primary} />
                      </View>
                    </View>
                  </PressableScale>
                );
              }}
            />
          </SectionReveal>
        )}
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
        {bigBanner?.title ? (
          <SectionReveal delay={290}>
            <PressableScale
              scaleTo={0.98}
              onPress={() => openPromo(bigBanner.buttonHref, bigBanner.title)}
              style={[styles.bigBannerCard, shadows.md, { backgroundColor: c.card, borderColor: c.borderLight || c.border }]}
            >
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'stretch' }}>
                <RemoteImage source={bigBanner.image} fallbackSource={heroSlides[0]?.image} style={styles.campaignImage} resizeMode="cover" />
                <View style={styles.campaignContent}>
                  {!!bigBanner.subtitle && <Text numberOfLines={2} style={[styles.offerLabel, { color: c.textSecondary }]}>{bigBanner.subtitle}</Text>}
                  <Text numberOfLines={2} style={[styles.campaignTitle, { color: c.text }]}>{String(bigBanner.title).replace(/\n/g, ' ')}</Text>
                  {!!bigBanner.description && <Text numberOfLines={3} style={[styles.campaignDescription, { color: c.textSecondary }]}>{bigBanner.description}</Text>}
                  <View style={[styles.offerAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text numberOfLines={2} style={[styles.offerActionText, { color: c.primary }]}>{bigBanner.buttonLabel || 'Shop now'}</Text>
                    <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={c.primary} />
                  </View>
                </View>
              </View>
            </PressableScale>
          </SectionReveal>
        ) : null}
        {recommended.length > 0 && <SectionReveal delay={320}>
          <SectionHeader title={copy.recommended} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products')} />
          <FlatList horizontal inverted={isRTL} showsHorizontalScrollIndicator={false} data={recommended} keyExtractor={item => String(item.id)} contentContainerStyle={{ paddingHorizontal: spacing.base }} renderItem={({ item }) => <FeaturedProductCard product={item} onPress={() => goProduct(item)} style={{ width: newArrivalCardWidth, marginRight: spacing.md }} />} />
        </SectionReveal>}
        <SectionReveal delay={330}>
          <SectionHeader title={copy.featured} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products')} />
          <View style={{ paddingHorizontal: layout.gutter, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: layout.gap }}>
            {loading ? Array.from({ length: layout.placeholderCount }, (_, index) => <View key={index} style={{ width: layout.cardWidth, padding: 8, borderRadius: 16, backgroundColor: c.card }}>
              <SkeletonLoader width="100%" height={layout.cardWidth - 16} radius={12} />
              <SkeletonLoader width="85%" height={14} style={{ marginTop: 12 }} />
              <SkeletonLoader width="55%" height={18} style={{ marginTop: 8 }} />
              <SkeletonLoader width="100%" height={40} style={{ marginTop: 10 }} />
            </View>) : featured.slice(0, featuredDisplayCount).map(product => <FeaturedProductCard key={product.id} product={product} onPress={() => goProduct(product)} style={{ width: layout.cardWidth }} />)}
          </View>
          {!loading && featuredDisplayCount < featured.length && (
            <PressableScale
              onPress={() => setFeaturedDisplayCount(count => Math.min(count + 25, featured.length, 75))}
              accessibilityLabel={copy.loadMore}
              style={[styles.loadMoreButton, { marginHorizontal: layout.gutter, backgroundColor: c.card, borderColor: c.border }]}
            >
              <Text style={[styles.loadMoreText, { color: c.primary }]}>{copy.loadMore}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={c.primary} />
            </PressableScale>
          )}
        </SectionReveal>
        {newArrivals.length > 0 && (
          <SectionReveal delay={370}>
            <SectionHeader title={t.newArrivals} actionLabel={t.seeAll} onAction={() => navigation.navigate('Products', { sort: 'newest' })} />
            <FlatList
              horizontal inverted={isRTL} showsHorizontalScrollIndicator={false}
              data={newArrivals} keyExtractor={i => String(i.id)}
              contentContainerStyle={{ paddingHorizontal: spacing.base }}
              renderItem={({ item }) => (
                <FeaturedProductCard product={item} onPress={() => goProduct(item)} style={{ width: newArrivalCardWidth, marginRight: spacing.md }} />
              )}
            />
          </SectionReveal>
        )}
        <View style={{ height: 32 }} />
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
  loadMoreButton: { minHeight: 48, marginTop: 16, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadMoreText: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  offerImage: { width: '100%', height: 140 },
  offerContent: { padding: 14, gap: 6, flex: 1 },
  offerLabel: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  offerTitle: { fontSize: 17, lineHeight: 23, fontWeight: '600', minHeight: 46 },
  offerAction: { minHeight: 44, alignItems: 'center', gap: 8, marginTop: 2 },
  offerActionText: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  campaignImage: { width: '38%', minHeight: 210 },
  campaignContent: { flex: 1, padding: 18, gap: 6 },
  campaignTitle: { fontSize: 21, lineHeight: 27, fontWeight: '600' },
  campaignDescription: { fontSize: 14, lineHeight: 21 },
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  brandBlock: { flex: 1, paddingRight: spacing.base },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cartBadge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 3, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#FFF', fontSize: 10, lineHeight: 14, fontWeight: fontWeight.bold, includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.base, marginTop: spacing.sm, paddingHorizontal: spacing.md, height: 50, borderRadius: borderRadius.md, borderWidth: 1, gap: 10 },
  searchText: { flex: 1, minWidth: 0, fontSize: fontSize.base, lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  promoCard: { borderRadius: borderRadius.xl, overflow: 'hidden', marginRight: spacing.md, borderWidth: 1 },
  audienceMessage: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: spacing.base, borderRadius: borderRadius.md, padding: 8, marginTop: spacing.sm, borderWidth: 1 },
  audienceIcon: { width: 26, height: 26, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  audienceText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18, fontWeight: fontWeight.medium },
  categoryListContent: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  catCardNew: { alignItems: 'center', marginRight: 16, width: 72 },
  catImgRing: { width: 62, height: 62, borderRadius: borderRadius.full, borderWidth: 1, padding: 2, backgroundColor: '#FFF', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  catImgNew: { width: 54, height: 54, borderRadius: borderRadius.full },
  catNameNew: { fontSize: fontSize.xs, lineHeight: 18, marginTop: 10, textAlign: 'center', fontWeight: fontWeight.semibold, includeFontPadding: false },
  bigBannerCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1 },
});
