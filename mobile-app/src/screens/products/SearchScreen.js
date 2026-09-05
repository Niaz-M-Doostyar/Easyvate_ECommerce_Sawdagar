import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { productsApi } from '../../services/api';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function SearchScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const numColumns = width >= 1024 ? 4 : width >= 700 ? 3 : 2;
  const gridCardWidth = Math.max(0, (width - (spacing.base - 4) * 2) / numColumns - 6);
  const quickSuggestions = ['Rice', 'Cooking oil', 'Fresh arrivals', 'Electronics'];
  const inputRef = useRef();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await productsApi.search(query.trim());
        setResults(data.products || data || []);
      } catch { setResults([]); }
      setSearched(true);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query]);

  const showPrompt = query.trim().length < 2 && !loading && !searched;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.searchTitle || 'Search'} onBack={() => navigation.goBack()} />
      <View style={[styles.searchWrap, { borderBottomColor: c.border }]}>
        <View style={[styles.searchRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
          <TextInput ref={inputRef} value={query} onChangeText={setQuery} placeholder={t.search}
            placeholderTextColor={c.placeholder} style={[styles.input, { color: c.text }]}
            returnKeyType="search" autoCapitalize="none" />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
      ) : showPrompt ? (
        <View style={styles.promptWrap}>
          <View style={[styles.promptCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.promptEyebrow, { color: c.primary }]}>Search the catalog</Text>
            <Text style={[styles.promptTitle, { color: c.text }]}>Find groceries, fashion, electronics, and new arrivals faster.</Text>
            <Text style={[styles.promptBody, { color: c.textSecondary }]}>Type at least two letters, or start with one of the quick suggestions below.</Text>
          </View>
          <Text style={[styles.suggestionLabel, { color: c.text }]}>Popular searches</Text>
          <View style={styles.suggestionWrap}>
            {quickSuggestions.map((item) => (
              <TouchableOpacity key={item} onPress={() => setQuery(item)} style={[styles.suggestionChip, { backgroundColor: c.brandSurface, borderColor: c.borderLight }]}>
                <MaterialCommunityIcons name="magnify" size={16} color={c.primary} />
                <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.suggestionText, { color: c.primary }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : searched && results.length === 0 ? (
        <EmptyState icon="search-outline" title={t.noResults} subtitle={`No products found for "${query}"`} />
      ) : (
        <>
          <View style={styles.resultBar}>
            <Text style={[styles.resultTitle, { color: c.text }]}>{results.length} {results.length === 1 ? 'result' : 'results'}</Text>
            <Text style={[styles.resultSubtitle, { color: c.textSecondary }]}>Showing matches for "{query}"</Text>
          </View>
          <FlatList
            key={`grid-${numColumns}`}
            data={results} numColumns={numColumns} keyExtractor={i => String(i.id)}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={[styles.gridItem, { width: '33.333%' }]}>
                <ProductCard product={item} onPress={() => { Keyboard.dismiss(); navigation.navigate('ProductDetail', { id: item.id, product: item }); }} style={{ width: gridCardWidth }} />
              </View>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 54, borderRadius: borderRadius.xl, borderWidth: 1, gap: 8 },
  input: { flex: 1, fontSize: fontSize.base, padding: 0 },
  clearButton: { width: 44, height: 44, marginRight: -10, alignItems: 'center', justifyContent: 'center' },
  promptWrap: { padding: spacing.base },
  promptCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg },
  promptEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  promptTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: 30, marginTop: spacing.sm },
  promptBody: { fontSize: fontSize.base, lineHeight: 22, marginTop: spacing.sm },
  suggestionLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  suggestionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionChip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  suggestionText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: fontWeight.bold, includeFontPadding: false, textAlignVertical: 'center' },
  resultBar: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  resultTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  resultSubtitle: { fontSize: fontSize.sm, marginTop: 4 },
  grid: { paddingHorizontal: spacing.base - 4, paddingTop: spacing.md, paddingBottom: 120 },
  gridItem: { paddingHorizontal: 3 },
});
