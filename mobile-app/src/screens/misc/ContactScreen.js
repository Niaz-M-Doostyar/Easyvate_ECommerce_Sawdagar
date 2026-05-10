import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { siteApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

export default function ContactScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { toast.error('All fields are required'); return; }
    setLoading(true);
    try { await siteApi.contact(form); toast.success('Message sent!'); setForm({ name: '', email: '', message: '' }); }
    catch (err) { toast.error(err.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.contact} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Ionicons name="chatbubbles-outline" size={48} color={c.primary} style={{ alignSelf: 'center', marginBottom: spacing.base }} />
          <Text style={[styles.subTitle, { color: c.textSecondary }]}>We'd love to hear from you</Text>
          <Input label={t.fullName} icon="person-outline" value={form.name} onChangeText={v => set('name', v)} />
          <Input label={t.email} icon="mail-outline" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Message" icon="chatbubble-outline" value={form.message} onChangeText={v => set('message', v)} multiline numberOfLines={5} />
          <Button title="Send Message" onPress={handleSend} loading={loading} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg },
  subTitle: { fontSize: fontSize.base, textAlign: 'center', marginBottom: spacing.xl },
});
