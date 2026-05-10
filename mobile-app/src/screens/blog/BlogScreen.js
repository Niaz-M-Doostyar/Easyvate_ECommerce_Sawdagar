import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { blogApi } from '../../services/api';
import { optimizedImageUri } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function BlogScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, getName } = useLanguage();
  const c = theme.colors;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    blogApi.list()
      .then((d) => {
        if (!active) return;
        setPosts(d.posts || d || []);
        setLoadError(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.blog} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} /> : loadError ? (
        <EmptyState icon="cloud-offline-outline" title="Blog temporarily unavailable" subtitle="Please try again later." />
      ) : posts.length === 0 ? (
        <EmptyState icon="newspaper-outline" title="No articles yet" />
      ) : (
        <FlatList data={posts} keyExtractor={i => String(i.id)} contentContainerStyle={{ padding: spacing.base }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('BlogDetail', { id: item.id, post: item })}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              {item.image && <Image source={{ uri: optimizedImageUri(item.image, { width: 500 }) }} style={styles.cardImg} />}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: c.text }]}>{getName(item, 'title')}</Text>
                <Text numberOfLines={2} style={[styles.cardExcerpt, { color: c.textSecondary }]}>{getName(item, 'content')?.replace(/<[^>]*>/g, '').slice(0, 120)}</Text>
                <Text style={[styles.cardDate, { color: c.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.base },
  cardImg: { width: '100%', height: 180 },
  cardBody: { padding: spacing.base },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 4, lineHeight: 22 },
  cardExcerpt: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: 6 },
  cardDate: { fontSize: fontSize.xs },
});
