import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t, isRTL } = useLanguage();
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', phone: '', province: '', district: '', companyName: '' });
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm(p => ({ ...p, [key]: value }));

  async function handleRegister() {
    if (!form.email || !form.password || !form.fullName) {
      Alert.alert(t('error'), 'Please fill required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role });
      Alert.alert(t('success'), t('register_success') || 'Registration successful!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  const align = isRTL ? 'right' : 'left';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('register')}</Text>

        {/* Role toggle */}
        <View style={[styles.roleRow, { flexDirection: rowDir }]}>
          <TouchableOpacity style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]} onPress={() => setRole('customer')}>
            <Text style={[styles.roleTxt, role === 'customer' && styles.roleTxtActive]}>{t('register_as_customer')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleBtn, role === 'supplier' && styles.roleBtnActive]} onPress={() => setRole('supplier')}>
            <Text style={[styles.roleTxt, role === 'supplier' && styles.roleTxtActive]}>{t('register_as_supplier')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={[styles.input, { textAlign: align }]} value={form.fullName} onChangeText={v => set('fullName', v)} placeholder={t('full_name')} />
        <TextInput style={[styles.input, { textAlign: align }]} value={form.email} onChangeText={v => set('email', v)} placeholder={t('email')} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={[styles.input, { textAlign: align }]} value={form.phone} onChangeText={v => set('phone', v)} placeholder={t('phone')} keyboardType="phone-pad" />
        <TextInput style={[styles.input, { textAlign: align }]} value={form.province} onChangeText={v => set('province', v)} placeholder={t('province')} />
        <TextInput style={[styles.input, { textAlign: align }]} value={form.district} onChangeText={v => set('district', v)} placeholder={t('district')} />

        {role === 'supplier' && (
          <TextInput style={[styles.input, { textAlign: align }]} value={form.companyName} onChangeText={v => set('companyName', v)} placeholder={t('company_name')} />
        )}

        <TextInput style={[styles.input, { textAlign: align }]} value={form.password} onChangeText={v => set('password', v)} placeholder={t('password')} secureTextEntry />
        <TextInput style={[styles.input, { textAlign: align }]} value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} placeholder={t('confirm_password')} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? t('loading') : t('register')}</Text>
        </TouchableOpacity>

        <View style={[styles.linkRow, { flexDirection: rowDir }]}>
          <Text style={styles.linkLabel}>{t('already_have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, textAlign: 'center', marginBottom: spacing.lg },
  roleRow: { marginBottom: spacing.lg, gap: spacing.sm },
  roleBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTxt: { fontSize: fontSize.md, color: colors.textLight },
  roleTxtActive: { color: colors.white, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.lg, marginBottom: spacing.md, backgroundColor: colors.white },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
  linkRow: { justifyContent: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
  linkLabel: { fontSize: fontSize.md, color: colors.textLight },
  link: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
});
