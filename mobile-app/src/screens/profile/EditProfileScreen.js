import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, fontSize, fontWeight } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const c = theme.colors;
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try { await updateProfile({ fullName: name.trim(), phone: phone.trim() }); toast.success('Profile updated'); navigation.goBack(); }
    catch (err) { toast.error(err.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.editProfile} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Input label={t.fullName} icon="person-outline" value={name} onChangeText={setName} />
          <Input label={t.email} icon="mail-outline" value={user?.email || ''} editable={false} />
          <Input label={t.phone} icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Button title={t.save} onPress={handleSave} loading={loading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg },
});
