import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { productsApi } from '../../services/api';
import { loadSearchResults } from '../../utils/searchResults';

const searchCopy = {
  en: { hint: 'Type at least 2 letters to find products.', suggestions: ['Rice', 'Cooking oil', 'Fresh arrivals', 'Electronics'], result: 'result', results: 'results', clear: 'Clear search', noMatches: 'No products found for' },
  ps: { hint: 'د محصولاتو موندلو لپاره لږ تر لږه ۲ توري ولیکئ.', suggestions: ['وریجې', 'غوړي', 'نوي محصولات', 'برېښنايي وسایل'], result: 'پایله', results: 'پایلې', clear: 'لټون پاک کړئ', noMatches: 'محصولات ونه موندل شول:' },
  dr: { hint: 'برای یافتن محصولات حداقل ۲ حرف بنویسید.', suggestions: ['برنج', 'روغن', 'محصولات جدید', 'لوازم الکترونیکی'], result: 'نتیجه', results: 'نتایج', clear: 'پاک کردن جستجو', noMatches: 'محصولی یافت نشد برای' },
};

export default function SearchScreen({ navigation }) {
  const { columns: numColumns, cardWidth: gridCardWidth, gutter } = useResponsiveLayout();
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLanguage();
  const c = theme.colors;
  const copy = searchCopy[lang] || searchCopy.en;
  const rowDirection = { flexDirection: isRTL ? 'row-reverse' : 'row' };
  const alignment = { textAlign: isRTL ? 'right' : 'left' };
  const inputRef = useRef();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [retry, setRetry] = useState(0);
  const timer = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    let active = true;
    setResults([]);
    setTotal(0);
    setSearched(false);
    setSearchError(false);
    setLoadingMore(false);
    const term = query.trim();
    setLoading(term.length >= 2);
    if (term.length < 2) return;
    timer.current = setTimeout(async () => {
      try {
        await loadSearchResults(productsApi.search, term, () => active, (products, count, hasMore) => {
          setResults(products);
          setTotal(count);
          setSearched(true);
          setLoading(false);
          setLoadingMore(hasMore);
        });
      } catch {
        if (active) { setSearchError(true); setSearched(true); }
      } finally {
        if (active) { setLoading(false); setLoadingMore(false); }
      }
    }, 400);
    return () => { active = false; clearTimeout(timer.current); };
  }, [query, retry]);

  const showPrompt = query.trim().length < 2 && !loading && !searched;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t.searchTitle || 'Search'} onBack={() => navigation.goBack()} />
      <View style={[styles.searchWrap, { paddingHorizontal: gutter }]}>
        <View style={[styles.searchRow, rowDirection, { backgroundColor: c.card, borderColor: c.inputBorder }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={c.textSecondary} />
          <TextInput ref={inputRef} value={query} onChangeText={setQuery} placeholder={t.search}
            accessibilityLabel={t.search} placeholderTextColor={c.placeholder} style={[styles.input, alignment, { color: c.text }]}
            returnKeyType="search" autoCapitalize="none" />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} accessibilityRole="button" accessibilityLabel={copy.clear} style={styles.clearButton}>
              <MaterialCommunityIcons name="close" size={20} color={c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
      ) : showPrompt ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.promptWrap, { paddingHorizontal: gutter }]}>
          <Text style={[styles.promptBody, alignment, { color: c.textSecondary }]}>{copy.hint}</Text>
          <View style={[styles.suggestionWrap, rowDirection]}>
            {copy.suggestions.map((item) => (
              <TouchableOpacity key={item} onPress={() => setQuery(item)} accessibilityRole="button" accessibilityLabel={`${t.searchTitle}: ${item}`} style={[styles.suggestionChip, rowDirection, { backgroundColor: c.card, borderColor: c.border }]}>
                <MaterialCommunityIcons name="magnify" size={17} color={c.textSecondary} />
                <Text style={[styles.suggestionText, { color: c.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : searchError && results.length === 0 ? (
        <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.promptWrap}>
          <Text style={{ color: c.primary, textAlign: 'center' }}>{t.retry || 'Retry'}</Text>
        </TouchableOpacity>
      ) : searched && results.length === 0 ? (
        <EmptyState icon="search-outline" title={t.noResults} subtitle={`${copy.noMatches} “${query}”`} />
      ) : (
        <>
          <View style={[styles.resultBar, { paddingHorizontal: gutter }]}>
            <Text style={[styles.resultTitle, alignment, { color: c.text }]}>{total} {total === 1 ? copy.result : copy.results}</Text>
          </View>
          <FlatList
            key={`grid-${numColumns}`}
            data={results} numColumns={numColumns} keyExtractor={i => String(i.id)}
            contentContainerStyle={[styles.grid, { paddingHorizontal: gutter }]}
            renderItem={({ item }) => (
              <View style={[styles.gridItem, { width: `${100 / numColumns}%` }]}>
                <ProductCard product={item} onPress={() => { Keyboard.dismiss(); navigation.navigate('ProductDetail', { id: item.id, product: item }); }} style={{ width: gridCardWidth }} />
              </View>
            )}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListFooterComponent={loadingMore ? <ActivityIndicator color={c.primary} /> : searchError ? (
              <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={{ padding: 16 }}>
                <Text style={{ color: c.primary, textAlign: 'center' }}>{t.retry || 'Retry'}</Text>
              </TouchableOpacity>
            ) : null}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  searchWrap: { paddingBottom: 10 },
  searchRow: { alignItems: 'center', paddingHorizontal: 12, minHeight: 54, borderRadius: 14, borderWidth: 1, gap: 8 },
  input: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 24, paddingVertical: 12, paddingHorizontal: 0 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  promptWrap: { paddingTop: 10, paddingBottom: 24 },
  promptBody: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  suggestionWrap: { flexWrap: 'wrap', gap: 8 },
  suggestionChip: { minHeight: 44, maxWidth: '100%', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  suggestionText: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  resultBar: { paddingTop: 4, paddingBottom: 12 },
  resultTitle: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  grid: { paddingTop: 2, paddingBottom: 120 },
  gridItem: { paddingHorizontal: 6, alignItems: 'center' },
});
