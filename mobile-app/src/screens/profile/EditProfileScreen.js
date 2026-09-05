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
import ProvincePicker from '../../components/ProvincePicker';
import { spacing, fontSize, fontWeight } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const c = theme.colors;
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [contactPerson, setContactPerson] = useState(user?.contactPerson || '');
  const [taxId, setTaxId] = useState(user?.taxId || '');
  const [province, setProvince] = useState(user?.province || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      await updateProfile({
        fullName: name.trim(),
        phone: phone.trim(),
        companyName: companyName ? companyName.trim() : undefined,
        contactPerson: contactPerson ? contactPerson.trim() : undefined,
        taxId: taxId ? taxId.trim() : undefined,
        province: province ? province.trim() : undefined,
        district: district ? district.trim() : undefined,
        village: village ? village.trim() : undefined,
        landmark: landmark ? landmark.trim() : undefined,
      });
      toast.success('Profile updated');
      navigation.goBack();
    } catch (err) { toast.error(err.message || 'Failed'); }
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
          {user?.role === 'supplier' && (
            <>
              <Input label={t.companyName || 'Company name'} icon="business-outline" value={companyName} onChangeText={setCompanyName} />
              <Input label="Contact person" icon="person-outline" value={contactPerson} onChangeText={setContactPerson} />
              <Input label="Tax ID" icon="document-text-outline" value={taxId} onChangeText={setTaxId} />
              <ProvincePicker value={province} onChange={setProvince} />
              <Input label="District" icon="location-outline" value={district} onChangeText={setDistrict} />
              <Input label="Village / City" icon="home-outline" value={village} onChangeText={setVillage} />
              <Input label="Landmark" icon="navigate-outline" value={landmark} onChangeText={setLandmark} />
            </>
          )}
          <Button title={t.save} onPress={handleSave} loading={loading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: spacing.lg, paddingBottom: 120 },
});
