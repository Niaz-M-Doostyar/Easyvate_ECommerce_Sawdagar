import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PressableScale from './PressableScale';
import RemoteImage from './RemoteImage';
import { API_URL, WEBSITE_URL } from '../config';
import { spacing, borderRadius, shadows } from '../theme';

const TABLET_OFFER_IMAGES = [
  require('../../assets/home/offer-essentials-20261006.jpg'),
  require('../../assets/home/offer-discover-20261006.jpg'),
  require('../../assets/home/offer-latest-20261006.jpg'),
];
const TABLET_CAMPAIGN_IMAGE = require('../../assets/home/campaign-marketplace-20261006.jpg');
const PHONE_OFFER_IMAGES = [
  require('../../assets/home/offer-essentials-phone-20261006.png'),
  require('../../assets/home/offer-discover-phone-20261006.png'),
  require('../../assets/home/offer-latest-phone-20261006.png'),
];
const PHONE_CAMPAIGN_IMAGE = require('../../assets/home/campaign-marketplace-phone-20261006.png');
const STOCK_PHONE_IMAGES = {
  '/assets/img/home/offer-essentials-20261006.jpg': PHONE_OFFER_IMAGES[0],
  '/assets/img/home/offer-discover-20261006.jpg': PHONE_OFFER_IMAGES[1],
  '/assets/img/home/offer-latest-20261006.jpg': PHONE_OFFER_IMAGES[2],
  '/assets/img/home/campaign-marketplace-20261006.jpg': PHONE_CAMPAIGN_IMAGE,
};
const STOCK_IMAGE_ORIGINS = new Set([API_URL, WEBSITE_URL, 'https://www.sawdagar.com']
  .map((origin) => origin.replace(/\/$/, '').toLowerCase()));
const titleText = (title) => String(title || '').replace(/\n+/g, ' ').trim();

// Campaign fills follow the same admin-selected palette as the rest of Home.
export function campaignPalette(theme, index = 0) {
  const c = theme.colors;
  const fills = [c.brandSurface, c.card, c.surfaceElevated];
  const artworkFills = [c.brandSurfaceStrong, c.brandSurface, c.brandSurfaceStrong];
  const position = index % fills.length;
  return {
    background: fills[position],
    artwork: artworkFills[position],
    actionBackground: c.primaryDark,
    actionText: c.white,
  };
}

// A custom admin upload stays primary. Only the bundled default photography is
// replaced with transparent artwork on phones, including absolute CMS URLs.
export function phoneCampaignArtwork(source, fallback) {
  let path = typeof source === 'string' ? source.trim().split(/[?#]/)[0] : '';
  const origin = path.match(/^https?:\/\/[^/]+/i)?.[0];
  if (origin && STOCK_IMAGE_ORIGINS.has(origin.toLowerCase())) path = path.slice(origin.length);
  const stock = STOCK_PHONE_IMAGES[path];
  return { source: stock ? null : source, fallback: stock || fallback };
}

function CampaignArtwork({ source, fallback, style }) {
  return (
    <RemoteImage
      source={source}
      fallback={<Image source={fallback} style={style} resizeMode="contain" accessible={false} />}
      style={style}
      resizeMode="contain"
      accessible={false}
    />
  );
}

function PhoneAction({ label, theme, isRTL }) {
  const palette = campaignPalette(theme);
  return (
    <View style={[styles.phoneAction, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: palette.actionBackground }]}>
      <Text maxFontSizeMultiplier={2} style={[styles.phoneActionText, { color: palette.actionText, textAlign: isRTL ? 'right' : 'left' }]}>{label || 'Shop now'}</Text>
      <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={17} color={palette.actionText} />
    </View>
  );
}

export function PhoneOfferCard({ banner, index = 0, width, fontScale = 1, isRTL, theme, onPress }) {
  const stacked = fontScale >= 1.4 || width / Math.max(1, fontScale) < 300;
  const palette = campaignPalette(theme, index);
  const c = theme.colors;
  const artwork = phoneCampaignArtwork(banner.image, PHONE_OFFER_IMAGES[index % PHONE_OFFER_IMAGES.length]);
  return (
    <PressableScale
      onPress={() => onPress?.(banner.buttonHref, banner.title)}
      accessibilityLabel={[banner.label, titleText(banner.title), banner.buttonLabel || 'Shop now'].filter(Boolean).join('. ')}
      scaleTo={0.98}
      style={[styles.phoneOffer, { width, backgroundColor: palette.background }]}
    >
      <View style={[styles.phoneOfferRow, { flexDirection: stacked ? 'column' : isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.phoneOfferCopy, stacked && styles.stackedCopy]}>
          {!!banner.label && <Text maxFontSizeMultiplier={2} style={[styles.phoneEyebrow, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.label}</Text>}
          <Text maxFontSizeMultiplier={2} style={[styles.phoneOfferTitle, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{titleText(banner.title)}</Text>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginTop: 14 }}>
            <PhoneAction label={banner.buttonLabel} theme={theme} isRTL={isRTL} />
          </View>
        </View>
        <View style={[styles.phoneOfferArt, stacked && styles.stackedOfferArt]} pointerEvents="none">
          <View style={[styles.artHalo, { backgroundColor: palette.artwork }]} />
          <CampaignArtwork {...artwork} style={styles.phoneArtwork} />
        </View>
      </View>
    </PressableScale>
  );
}

export function TabletOfferCard({ banner, index = 0, width, isRTL, theme, onPress }) {
  const c = theme.colors;
  return (
    <PressableScale
      scaleTo={0.97}
      onPress={() => onPress?.(banner.buttonHref, banner.title)}
      style={[styles.tabletPromoCard, { width }, shadows.md, { backgroundColor: c.card, borderColor: c.borderLight || c.border }]}
    >
      <View style={[styles.tabletImageFrame, { backgroundColor: c.surfaceElevated }]}>
        <CampaignArtwork source={banner.image} fallback={TABLET_OFFER_IMAGES[index]} style={styles.tabletImage} />
      </View>
      <View style={styles.tabletOfferContent}>
        {!!banner.label && <Text numberOfLines={2} style={[styles.tabletOfferLabel, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.label}</Text>}
        <Text numberOfLines={2} style={[styles.tabletOfferTitle, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{titleText(banner.title)}</Text>
        <View style={[styles.tabletOfferAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text numberOfLines={2} style={[styles.tabletOfferActionText, { color: c.primary }]}>{banner.buttonLabel || 'Shop now'}</Text>
          <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={c.primary} />
        </View>
      </View>
    </PressableScale>
  );
}

export function HomeFeaturedOffers({ banners, width, fontScale = 1, isTablet, isRTL, theme, onPress, gutter = 16 }) {
  const stacked = fontScale >= 1.4 || width / Math.max(1, fontScale) < 300;
  const cardWidth = isTablet
    ? Math.min(width * (width >= 700 ? 0.52 : 0.78), 560)
    : Math.max(0, width - gutter * 2 - (stacked ? 12 : 22));
  const Card = isTablet ? TabletOfferCard : PhoneOfferCard;
  return (
    <FlatList
      horizontal
      inverted={!isTablet && isRTL}
      showsHorizontalScrollIndicator={false}
      data={banners}
      keyExtractor={(item, index) => `${item.title || 'banner'}-${index}`}
      contentContainerStyle={isTablet ? { paddingHorizontal: spacing.base } : { paddingHorizontal: gutter, paddingBottom: 2 }}
      snapToInterval={isTablet ? undefined : cardWidth + 12}
      decelerationRate={isTablet ? 'normal' : 'fast'}
      disableIntervalMomentum={!isTablet}
      renderItem={({ item, index }) => <Card banner={item} index={index} width={cardWidth} fontScale={fontScale} isRTL={isRTL} theme={theme} onPress={onPress} />}
    />
  );
}

export function PhoneDiscoveryCard({ banner, width, fontScale = 1, isRTL, theme, gutter = 16, onPress }) {
  const c = theme.colors;
  const palette = campaignPalette(theme);
  const stacked = fontScale >= 1.4 || width / Math.max(1, fontScale) < 300;
  const artwork = phoneCampaignArtwork(banner.image, PHONE_CAMPAIGN_IMAGE);
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => onPress?.(banner.buttonHref, banner.title)}
      accessibilityLabel={[banner.subtitle, titleText(banner.title), banner.description, banner.buttonLabel || 'Shop now'].filter(Boolean).join('. ')}
      style={[styles.phoneDiscovery, { marginHorizontal: gutter, backgroundColor: palette.background }]}
    >
      <View style={[styles.phoneDiscoveryTop, { flexDirection: stacked ? 'column' : isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.phoneDiscoveryCopy, stacked && styles.stackedCopy]}>
          {!!banner.subtitle && <Text maxFontSizeMultiplier={2} style={[styles.phoneEyebrow, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.subtitle}</Text>}
          <Text maxFontSizeMultiplier={2} style={[styles.phoneDiscoveryTitle, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{titleText(banner.title)}</Text>
        </View>
        <View style={[styles.phoneDiscoveryArt, stacked && styles.stackedDiscoveryArt]} pointerEvents="none">
          <View style={[styles.discoveryHalo, { backgroundColor: palette.artwork }]} />
          <CampaignArtwork {...artwork} style={styles.phoneArtwork} />
        </View>
      </View>
      {!!banner.description && <Text maxFontSizeMultiplier={2} style={[styles.phoneDiscoveryDescription, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.description}</Text>}
      <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginTop: 16 }}>
        <PhoneAction label={banner.buttonLabel} theme={theme} isRTL={isRTL} />
      </View>
    </PressableScale>
  );
}

export function TabletDiscoveryCard({ banner, width, fontScale = 1, isRTL, theme, gutter = 16, onPress }) {
  const c = theme.colors;
  const horizontal = width >= 700 && width / Math.max(1, fontScale) >= 600;
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => onPress?.(banner.buttonHref, banner.title)}
      style={[styles.tabletBannerCard, shadows.md, { marginHorizontal: gutter, backgroundColor: c.card, borderColor: c.borderLight || c.border }]}
    >
      <View style={[styles.tabletCampaignLayout, { flexDirection: horizontal ? (isRTL ? 'row-reverse' : 'row') : 'column', alignItems: horizontal ? 'center' : 'stretch' }]}>
        <View style={[styles.tabletImageFrame, styles.tabletCampaignImageFrame, { width: horizontal ? '44%' : '100%', backgroundColor: c.surfaceElevated }]}>
          <CampaignArtwork source={banner.image} fallback={TABLET_CAMPAIGN_IMAGE} style={styles.tabletImage} />
        </View>
        <View style={[styles.tabletCampaignContent, horizontal ? { flex: 1 } : { width: '100%' }]}>
          {!!banner.subtitle && <Text style={[styles.tabletOfferLabel, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.subtitle}</Text>}
          <Text style={[styles.tabletCampaignTitle, { color: c.text, textAlign: isRTL ? 'right' : 'left' }]}>{String(banner.title).replace(/\n/g, ' ')}</Text>
          {!!banner.description && <Text style={[styles.tabletCampaignDescription, { color: c.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{banner.description}</Text>}
          <View style={[styles.tabletOfferAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text numberOfLines={2} style={[styles.tabletOfferActionText, { color: c.primary }]}>{banner.buttonLabel || 'Shop now'}</Text>
            <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={c.primary} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export function HomeDiscoveryCampaign(props) {
  const Card = props.isTablet ? TabletDiscoveryCard : PhoneDiscoveryCard;
  return <Card {...props} />;
}

const styles = StyleSheet.create({
  phoneOffer: { borderRadius: 24, marginRight: 12, padding: 20, overflow: 'hidden', minHeight: 208 },
  phoneOfferRow: { alignItems: 'center', gap: 8 },
  phoneOfferCopy: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
  phoneEyebrow: { fontSize: 12, fontWeight: '500', marginBottom: 8, flexShrink: 1 },
  phoneOfferTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.45, flexShrink: 1 },
  phoneOfferArt: { width: '42%', height: 154, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  artHalo: { position: 'absolute', width: 144, height: 144, borderRadius: 72, opacity: 0.68 },
  phoneArtwork: { width: '100%', height: '100%' },
  phoneAction: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, alignItems: 'center', gap: 9, maxWidth: '100%' },
  phoneActionText: { flexShrink: 1, fontSize: 13, fontWeight: '600' },
  stackedCopy: { flex: 0, width: '100%' },
  stackedOfferArt: { width: '100%', height: 144, marginTop: 12 },
  phoneDiscovery: { borderRadius: 26, padding: 22, overflow: 'hidden', marginTop: 12, marginBottom: spacing.xl },
  phoneDiscoveryTop: { alignItems: 'center', gap: 8 },
  phoneDiscoveryCopy: { flex: 1, minWidth: 0 },
  phoneDiscoveryTitle: { fontSize: 23, fontWeight: '700', letterSpacing: -0.6, flexShrink: 1 },
  phoneDiscoveryArt: { width: '42%', height: 150, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  discoveryHalo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.8 },
  stackedDiscoveryArt: { width: '100%', height: 150, marginTop: 12 },
  phoneDiscoveryDescription: { fontSize: 14, marginTop: 14, flexShrink: 1 },
  tabletImageFrame: { width: '100%', aspectRatio: 16 / 10, padding: 12, borderRadius: borderRadius.lg, overflow: 'hidden' },
  tabletImage: { width: '100%', height: '100%' },
  tabletOfferContent: { gap: 8, flex: 1 },
  tabletOfferLabel: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  tabletOfferTitle: { fontSize: 17, lineHeight: 23, fontWeight: '600', minHeight: 46 },
  tabletOfferAction: { minHeight: 44, alignItems: 'center', gap: 8, marginTop: 2 },
  tabletOfferActionText: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  tabletCampaignLayout: { gap: spacing.xl },
  tabletCampaignImageFrame: { padding: spacing.base, flexShrink: 0 },
  tabletCampaignContent: { minWidth: 0, gap: spacing.md },
  tabletCampaignTitle: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  tabletCampaignDescription: { fontSize: 15, lineHeight: 23 },
  tabletPromoCard: { borderRadius: borderRadius.xxl, overflow: 'hidden', marginRight: spacing.md, borderWidth: 1, padding: spacing.xl, gap: spacing.base },
  tabletBannerCard: { marginBottom: spacing.xl, borderRadius: borderRadius.xxl, overflow: 'hidden', borderWidth: 1, padding: spacing.xl },
});
