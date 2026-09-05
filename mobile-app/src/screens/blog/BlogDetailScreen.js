import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import RemoteImage from '../../components/RemoteImage';
import { blogApi } from '../../services/api';
import { formatAppDate } from '../../utils/dateFormat';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

function articleParagraphs(html) {
  const text = String(html || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .trim();

  return text.split(/\n{2,}/).map((paragraph) => paragraph.replace(/\n/g, ' ').trim()).filter(Boolean);
}

export default function BlogDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t, getName, lang } = useLanguage();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const [post, setPost] = useState(route.params?.post || null);
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    blogApi.get(route.params?.id).then(d => { setPost(d.post || d); setLoading(false); }).catch(() => setLoading(false));
  }, [route.params?.id]);

  if (loading) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Blog" onBack={() => navigation.goBack()} />
      <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );
  if (!post) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Blog" onBack={() => navigation.goBack()} />
      <EmptyState icon="newspaper-outline" title="Post not found" />
    </SafeAreaView>
  );

  const content = getName(post, 'content') || '';
  const paragraphs = articleParagraphs(content);
  const mediaWidth = Math.min(width, 860);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.blog || 'Blog'} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {post.image && <RemoteImage source={post.image} width={800} style={{ width: mediaWidth, height: mediaWidth * 0.55, alignSelf: 'center' }} fallback={<View style={{ width: mediaWidth, height: mediaWidth * 0.55, alignSelf: 'center', backgroundColor: c.skeleton }} />} />}
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]}>{getName(post, 'title')}</Text>
          <Text style={[styles.date, { color: c.textMuted }]}>{formatAppDate(post.createdAt, lang, { month: 'long' })}</Text>
          {paragraphs.map((paragraph, index) => (
            <Text key={`${index}-${paragraph.slice(0, 20)}`} style={[styles.content, { color: c.textSecondary }]}>{paragraph}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, lineHeight: 32, marginBottom: 8 },
  date: { fontSize: fontSize.sm, marginBottom: spacing.lg },
  content: { fontSize: fontSize.base, lineHeight: 26, marginBottom: spacing.md },
});
