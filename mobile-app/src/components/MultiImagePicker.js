import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RemoteImage from './RemoteImage';
import { uploadApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';

export default function MultiImagePicker({ value = [], onChange, max = 10 }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [images, setImages] = useState((value || []).map((u) => ({ url: u })));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setImages((value || []).map((u) => ({ url: u })));
  }, [value]);

  const pickImages = async () => {
    try {
      const remainingSlots = max - images.length;
      if (remainingSlots <= 0) return;
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: remainingSlots,
        quality: 0.9,
        maxWidth: 1600,
        maxHeight: 1600,
        assetRepresentationMode: 'compatible',
      });
      if (res.didCancel) return;
      if (res.errorCode) throw new Error(res.errorMessage || 'ImagePicker error');
      const assets = res.assets || [];
      if (assets.length === 0) return;

      const files = assets.map((a) => ({
        uri: a.uri,
        fileName: a.fileName,
        type: a.type,
      }));
      setUploading(true);
      const data = await uploadApi.multiple(files);
      const uploaded = (data.files || []).map((f) => ({ url: f.url }));
      const next = [...images, ...uploaded].slice(0, max);
      setImages(next);
      onChange && onChange(next.map(i => i.url));
    } catch (err) {
      console.error('Image upload failed', err);
      const msg = (err && err.message) ? err.message : String(err);
      const details = (err && err.data) ? `\n\n${JSON.stringify(err.data)}` : '';
      Alert.alert('Upload failed', `${msg}${details}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    const next = images.slice();
    next.splice(idx, 1);
    setImages(next);
    onChange && onChange(next.map(i => i.url));
  };

  return (
    <View>
      <View style={styles.row}>
        {images.map((img, idx) => (
          <View key={img.url || img.local?.uri || `image-${idx}`} style={styles.thumbWrap}>
            {img.url ? (
              <RemoteImage source={img.url} style={styles.thumb} />
            ) : img.local?.uri ? (
              <Image source={{ uri: img.local.uri }} style={styles.thumb} />
            ) : null}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeImage(idx)}
              accessibilityRole="button"
              accessibilityLabel={`Remove image ${idx + 1}`}
            >
              <View style={[styles.removeVisual, { backgroundColor: c.error, borderColor: c.card }]}>
                <MaterialCommunityIcons name="close" size={18} color={c.white} />
              </View>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.brandSurface, borderColor: c.primary }, (uploading || images.length >= max) && styles.disabled]} onPress={pickImages} disabled={uploading || images.length >= max} accessibilityRole="button" accessibilityLabel="Add product images" accessibilityState={{ disabled: uploading || images.length >= max, busy: uploading }}>
          {uploading ? <ActivityIndicator size="small" color={c.primary} /> : <MaterialCommunityIcons name={images.length >= max ? 'check' : 'image-plus-outline'} size={24} color={c.primary} />}
          <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82} maxFontSizeMultiplier={1.15} style={[styles.addTxt, { color: c.primary }]}>{uploading ? 'Uploading' : images.length >= max ? `${max}/${max}` : 'Add image'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', paddingTop: spacing.xs },
  thumbWrap: { width: 96, height: 96, position: 'relative' },
  thumb: { position: 'absolute', left: 0, bottom: 0, width: 88, height: 88, borderRadius: borderRadius.lg, backgroundColor: '#EEE' },
  removeBtn: { position: 'absolute', top: 0, right: 0, width: 44, height: 44, justifyContent: 'flex-start', alignItems: 'flex-end', zIndex: 2 },
  removeVisual: { width: 32, height: 32, borderRadius: borderRadius.full, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 88, height: 88, borderRadius: borderRadius.lg, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 5, padding: spacing.xs },
  addTxt: { fontSize: fontSize.xs, lineHeight: 15, fontWeight: fontWeight.bold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  disabled: { opacity: 0.5 },
});
