import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { authApi } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const c = theme.colors;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, 520);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) { toast.error(err.message || 'Failed'); }
    setLoading(false);
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
        <View style={[styles.center, { maxWidth: contentWidth }]}>
          <Ionicons name="mail-open-outline" size={64} color={c.primary} />
          <Text style={[styles.sentTitle, { color: c.text }]}>Check Your Email</Text>
          <Text style={[styles.sentSub, { color: c.textSecondary }]}>We sent a password reset link to {email}</Text>
          <Button title="Back to Login" onPress={() => navigation.navigate('Login')} variant="outline" style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { maxWidth: contentWidth }]}> 
          <Ionicons name="key-outline" size={48} color={c.primary} style={{ marginBottom: spacing.base }} />
          <Text style={[styles.title, { color: c.text }]}>{t.forgotPassword}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Enter your email and we'll send you a reset link</Text>
          <Input label={t.email} icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          <Button title={t.sendResetLink} onPress={handleSend} loading={loading} style={{ marginTop: spacing.md }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  scrollTablet: { justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, marginBottom: spacing.xl, lineHeight: 22 },
  center: { flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  sentTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  sentSub: { fontSize: fontSize.base, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
