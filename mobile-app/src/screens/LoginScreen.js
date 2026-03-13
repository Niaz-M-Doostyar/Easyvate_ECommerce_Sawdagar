import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t('error'), 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>{t('site_name')}</Text>
          <Text style={styles.subtitle}>{t('hero_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>{t('login')}</Text>

          <Text style={[styles.label, isRTL && styles.rtlText]}>{t('email')}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.rtlInput]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign={isRTL ? 'right' : 'left'}
          />

          <Text style={[styles.label, isRTL && styles.rtlText]}>{t('password')}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.rtlInput]}
            value={password}
            onChangeText={setPassword}
            placeholder={t('password')}
            secureTextEntry
            textAlign={isRTL ? 'right' : 'left'}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotLink, isRTL && styles.rtlText]}>{t('forgot_password')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? t('loading') : t('login')}</Text>
          </TouchableOpacity>

          <View style={[styles.linkRow, isRTL && styles.rtlRow]}>
            <Text style={styles.linkLabel}>{t('dont_have_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{t('register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: fontSize.md, color: colors.textLight, marginTop: spacing.xs },
  form: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.xs, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.lg, marginBottom: spacing.md, backgroundColor: colors.grayLighter },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
  forgotLink: { color: colors.primary, fontSize: fontSize.md, marginBottom: spacing.sm },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  linkLabel: { fontSize: fontSize.md, color: colors.textLight },
  link: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  rtlText: { textAlign: 'right' },
  rtlInput: { textAlign: 'right' },
  rtlRow: { flexDirection: 'row-reverse' },
});
