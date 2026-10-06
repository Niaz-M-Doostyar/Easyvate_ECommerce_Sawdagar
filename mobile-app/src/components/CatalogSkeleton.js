import React from 'react';
import { ScrollView, View } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
import { useTheme } from '../contexts/ThemeContext';

export default function CatalogSkeleton({ layout }) {
  const defaultLayout = useResponsiveLayout();
  const { columns, cardWidth, gutter = 16, gap = 12 } = layout || defaultLayout;
  const { theme } = useTheme();
  return <ScrollView accessibilityLabel="Loading products" accessibilityState={{ busy: true }} contentContainerStyle={[
    { padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
    layout && { paddingHorizontal: gutter, columnGap: gap },
  ]}>
    {Array.from({ length: columns * 2 }, (_, index) => <View key={index} style={[
      { width: `${100 / columns}%`, paddingHorizontal: 6, paddingBottom: 12, alignItems: 'center' },
      layout && { width: cardWidth, paddingHorizontal: 0 },
    ]}>
      <View style={{ width: cardWidth, padding: 12, borderRadius: 22, backgroundColor: theme.colors.card, gap: 12 }}>
        <SkeletonLoader width="100%" height={cardWidth - 24} radius={16} />
        <SkeletonLoader width="85%" />
        <SkeletonLoader width="60%" height={20} />
        <SkeletonLoader width="100%" height={40} radius={12} />
      </View>
    </View>)}
  </ScrollView>;
}
