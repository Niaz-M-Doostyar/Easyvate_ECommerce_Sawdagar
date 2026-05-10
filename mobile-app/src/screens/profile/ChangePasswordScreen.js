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

export default function ChangePasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { changePassword } = useAuth();
  const toast = useToast();
  const c = theme.colors;
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!current) { toast.error('Enter current password'); return; }
    if (newPass.length < 6) { toast.error('Min 6 characters'); return; }
    if (newPass !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await changePassword({ currentPassword: current, newPassword: newPass }); toast.success('Password changed'); navigation.goBack(); }
    catch (err) { toast.error(err.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title={t.changePassword} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Input label={t.currentPassword} icon="lock-closed-outline" value={current} onChangeText={setCurrent} secureTextEntry />
          <Input label={t.newPassword} icon="lock-closed-outline" value={newPass} onChangeText={setNewPass} secureTextEntry />
          <Input label={t.confirmPassword} icon="lock-closed-outline" value={confirm} onChangeText={setConfirm} secureTextEntry />
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
