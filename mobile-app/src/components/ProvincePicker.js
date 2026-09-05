import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { AFGHANISTAN_PROVINCES } from '../data/afghanistanProvinces';
import { borderRadius, fontSize, fontWeight, spacing } from '../theme';

export default function ProvincePicker({ value, onChange, error }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.textSecondary }]}>Province *</Text>
      <TouchableOpacity onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Select province" accessibilityValue={{ text: value || 'No province selected' }} style={[styles.field, { backgroundColor: c.inputBg, borderColor: error ? c.error : c.inputBorder }]}>
        <MaterialCommunityIcons name="map-marker-outline" size={20} color={c.textMuted} />
        <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.value, { color: value ? c.text : c.textMuted }]}>{value || 'Select one of 34 provinces'}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={c.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={[styles.error, { color: c.error }]}>{error}</Text> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: c.background }]}>
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <Text style={[styles.title, { color: c.text }]}>Select province</Text>
            <TouchableOpacity onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close province picker" style={styles.close}><MaterialCommunityIcons name="close" size={26} color={c.text} /></TouchableOpacity>
          </View>
          <FlatList data={AFGHANISTAN_PROVINCES} keyExtractor={item => item} contentContainerStyle={styles.list} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { onChange(item); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: item === value }} style={[styles.option, { backgroundColor: item === value ? c.brandSurface : c.card, borderColor: item === value ? c.primary : c.border }]}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.optionText, { color: item === value ? c.primary : c.text }]}>{item}</Text>
              {item === value ? <MaterialCommunityIcons name="check" size={20} color={c.primary} /> : null}
            </TouchableOpacity>
          )} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.base }, label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: 6 },
  field: { minHeight: 50, borderWidth: 1, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md },
  value: { flex: 1, fontSize: fontSize.base, lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' }, error: { fontSize: fontSize.xs, marginTop: 5 }, modal: { flex: 1 },
  header: { minHeight: 64, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold }, close: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }, list: { padding: spacing.base },
  option: { minHeight: 52, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { fontSize: fontSize.base, lineHeight: 20, fontWeight: fontWeight.medium, includeFontPadding: false, textAlignVertical: 'center' },
});
