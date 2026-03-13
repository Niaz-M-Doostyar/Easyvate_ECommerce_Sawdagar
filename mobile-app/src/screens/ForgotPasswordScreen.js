import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    try {
      await auth.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>✉️</Text>
          <Text style={styles.title}>{t('success')}</Text>
          <Text style={styles.desc}>Password reset link has been sent to your email.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('forgot_password')}</Text>
        <Text style={styles.desc}>Enter your email address and we'll send you a reset link.</Text>
        <TextInput
          style={[styles.input, isRTL && { textAlign: 'right' }]}
          value={email}
          onChangeText={setEmail}
          placeholder={t('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign={isRTL ? 'right' : 'left'}
        />
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? t('loading') : t('submit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.link}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.sm },
  desc: { fontSize: fontSize.md, color: colors.textLight, textAlign: 'center', marginBottom: spacing.lg },
  input: { width: '100%', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.lg, backgroundColor: colors.grayLighter, marginBottom: spacing.md },
  btn: { width: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
  backBtn: { marginTop: spacing.lg },
  link: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
});
