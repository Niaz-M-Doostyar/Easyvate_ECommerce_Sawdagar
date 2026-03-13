import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const align = isRTL ? 'right' : 'left';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        province: user.province || '',
        district: user.district || '',
        village: user.village || '',
        landmark: user.landmark || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <View style={styles.empty}>
        <Ionicons name="person-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('please_sign_in')}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.emptyBtnText}>{t('sign_in')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile(form);
      Alert.alert(t('success'), 'Profile updated');
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!passForm.currentPassword || !passForm.newPassword) return;
    if (passForm.newPassword !== passForm.confirm) {
      Alert.alert(t('error'), 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      Alert.alert(t('success'), 'Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert(t('logout'), '', [
      { text: t('cancel') },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.fullName?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>{user.role}</Text>
        </View>
      </View>

      {/* Language Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('select_language')}</Text>
        <View style={[styles.langRow, { flexDirection: rowDir }]}>
          {[
            { code: 'en', label: 'English' },
            { code: 'ps', label: 'پښتو' },
            { code: 'dr', label: 'دری' },
          ].map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, language === l.code && styles.langBtnActive]}
              onPress={() => setLanguage(l.code)}
            >
              <Text style={[styles.langText, language === l.code && styles.langTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { flexDirection: rowDir }]}>
        <TouchableOpacity style={[styles.tab, tab === 'profile' && styles.tabActive]} onPress={() => setTab('profile')}>
          <Ionicons name="person-outline" size={16} color={tab === 'profile' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, tab === 'profile' && styles.tabTextActive]}>{t('profile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'password' && styles.tabActive]} onPress={() => setTab('password')}>
          <Ionicons name="lock-closed-outline" size={16} color={tab === 'password' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, tab === 'password' && styles.tabTextActive]}>{t('change_password')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        {tab === 'profile' ? (
          <>
            {[
              { key: 'fullName', label: t('full_name') },
              { key: 'phone', label: t('phone'), keyboard: 'phone-pad' },
              { key: 'province', label: t('province') },
              { key: 'district', label: t('district') },
              { key: 'village', label: t('village') },
              { key: 'landmark', label: t('landmark') },
            ].map(f => (
              <View key={f.key}>
                <Text style={[styles.label, { textAlign: align }]}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { textAlign: align }]}
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                />
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? t('loading') : t('save')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { textAlign: align }]}>{t('current_password')}</Text>
            <TextInput style={[styles.input, { textAlign: align }]} value={passForm.currentPassword} onChangeText={v => setPassForm(p => ({ ...p, currentPassword: v }))} secureTextEntry />

            <Text style={[styles.label, { textAlign: align }]}>{t('new_password')}</Text>
            <TextInput style={[styles.input, { textAlign: align }]} value={passForm.newPassword} onChangeText={v => setPassForm(p => ({ ...p, newPassword: v }))} secureTextEntry />

            <Text style={[styles.label, { textAlign: align }]}>{t('confirm_password')}</Text>
            <TextInput style={[styles.input, { textAlign: align }]} value={passForm.confirm} onChangeText={v => setPassForm(p => ({ ...p, confirm: v }))} secureTextEntry />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? t('loading') : t('change_password')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.dark, marginTop: spacing.lg },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  emptyBtnText: { color: colors.white, fontWeight: 'bold', fontSize: fontSize.lg },
  userCard: { alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.xl, paddingTop: spacing.xxl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  userName: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.white, marginTop: spacing.sm },
  userEmail: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.8)' },
  roleBadge: { paddingHorizontal: spacing.md, paddingVertical: 2, borderRadius: borderRadius.round, marginTop: spacing.xs, backgroundColor: 'rgba(255,255,255,0.2)' },
  roleText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },
  section: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.dark, marginBottom: spacing.sm },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: fontSize.md, color: colors.text },
  langTextActive: { color: colors.white, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, marginTop: spacing.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.md, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  formCard: { backgroundColor: colors.white, padding: spacing.lg },
  label: { fontSize: fontSize.md, color: colors.text, fontWeight: '500', marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.md, marginBottom: spacing.md, backgroundColor: colors.grayLighter },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  saveBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  logoutText: { fontSize: fontSize.lg, color: colors.danger, fontWeight: '600' },
});
