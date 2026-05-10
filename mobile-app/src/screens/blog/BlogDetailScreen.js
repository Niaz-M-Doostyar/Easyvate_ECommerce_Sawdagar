import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ScreenHeader from '../../components/ScreenHeader';
import { blogApi } from '../../services/api';
import { optimizedImageUri } from '../../config';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme';

export default function BlogDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { getName } = useLanguage();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const [post, setPost] = useState(route.params?.post || null);
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    blogApi.get(route.params?.id).then(d => { setPost(d.post || d); setLoading(false); }).catch(() => setLoading(false));
  }, [route.params?.id]);

  if (loading) return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><ActivityIndicator size="large" color={c.primary} style={{ marginTop: 100 }} /></SafeAreaView>;
  if (!post) return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}><Text style={{ color: c.text, textAlign: 'center', marginTop: 100 }}>Post not found</Text></SafeAreaView>;

  const content = getName(post, 'content') || '';
  const plainContent = content.replace(/<[^>]*>/g, '');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={getName(post, 'title') || 'Blog'} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {post.image && <Image source={{ uri: optimizedImageUri(post.image, { width: 800 }) }} style={{ width, height: width * 0.55 }} />}
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]}>{getName(post, 'title')}</Text>
          <Text style={[styles.date, { color: c.textMuted }]}>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={[styles.content, { color: c.textSecondary }]}>{plainContent}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, lineHeight: 32, marginBottom: 8 },
  date: { fontSize: fontSize.sm, marginBottom: spacing.lg },
  content: { fontSize: fontSize.base, lineHeight: 26 },
});
