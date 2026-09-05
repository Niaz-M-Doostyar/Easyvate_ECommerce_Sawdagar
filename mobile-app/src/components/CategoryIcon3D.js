import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const ASSETS = {
  'auto-parts': require('../../assets/category-icons/auto-parts.png'),
  bathroom: require('../../assets/category-icons/bathroom.png'),
  beverages: require('../../assets/category-icons/beverages.png'),
  clothing: require('../../assets/category-icons/clothing.png'),
  curd: require('../../assets/category-icons/curd.png'),
  electronics: require('../../assets/category-icons/electronics.png'),
  'food-groceries': require('../../assets/category-icons/food-groceries.png'),
  'health-beauty': require('../../assets/category-icons/health-beauty.png'),
  'home-garden': require('../../assets/category-icons/home-garden.png'),
  jewelry: require('../../assets/category-icons/jewelry.png'),
  juice: require('../../assets/category-icons/juice.png'),
  kitchen: require('../../assets/category-icons/kitchen.png'),
  marketplace: require('../../assets/category-icons/marketplace.png'),
  medical: require('../../assets/category-icons/medical.png'),
  milk: require('../../assets/category-icons/milk.png'),
  'tomato-paste': require('../../assets/category-icons/tomato-paste.png'),
  phones: require('../../assets/category-icons/phones.png'),
  shoes: require('../../assets/category-icons/shoes.png'),
  sports: require('../../assets/category-icons/sports.png'),
  general: require('../../assets/category-icons/general.png'),
};

const SLUGS = {
  'auto-parts': 'auto-parts', bathroom: 'bathroom', baverages: 'beverages', beverages: 'beverages',
  clothing: 'clothing', curd: 'curd', electronics: 'electronics', food: 'food-groceries',
  health: 'health-beauty', home: 'home-garden', jewelry: 'jewelry', juice: 'juice', kitchen: 'kitchen',
  medical: 'medical', milk: 'milk', paste: 'tomato-paste', phones: 'phones', shoes: 'shoes', sports: 'sports',
};

const LEGACY_KEYS = {
  'shape-outline': 'general', 'storefront-outline': 'marketplace', 'food-apple-outline': 'food-groceries',
  'car-cog': 'auto-parts', hanger: 'clothing', cellphone: 'electronics', 'sofa-outline': 'home-garden',
  shower: 'bathroom', 'cup-outline': 'beverages', dumbbell: 'sports',
  'silverware-fork-knife': 'food-groceries', 'palette-outline': 'health-beauty', 'medical-bag': 'medical',
  'home-outline': 'home-garden', 'watch-variant': 'jewelry', 'shoe-sneaker': 'shoes',
  'gamepad-variant-outline': 'electronics',
};

function resolveSource(category) {
  const iconKey = String(category?.iconKey || '').trim();
  if (ASSETS[iconKey]) return ASSETS[iconKey];
  const slug = String(category?.slug || '').trim().toLowerCase();
  return ASSETS[SLUGS[slug] || LEGACY_KEYS[iconKey] || 'general'];
}

export default function CategoryIcon3D({ category, size = 62, style }) {
  return (
    <View style={[styles.frame, { width: size, height: size }, style]}>
      <Image source={resolveSource(category)} style={styles.image} resizeMode="contain" fadeDuration={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
