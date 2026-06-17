import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RemoteImage from './RemoteImage';
import { uploadApi } from '../services/api';
import { spacing, borderRadius, fontSize } from '../theme';

export default function MultiImagePicker({ value = [], onChange, max = 10 }) {
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
          <View key={idx} style={styles.thumbWrap}>
            {img.url ? (
              <RemoteImage source={img.url} style={styles.thumb} />
            ) : img.local?.uri ? (
              <Image source={{ uri: img.local.uri }} style={styles.thumb} />
            ) : null}
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)}>
              <Text style={styles.removeTxt}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={pickImages} disabled={uploading || images.length >= max}>
          <Text style={styles.addTxt}>{uploading ? 'Uploading...' : images.length >= max ? 'Full' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  thumbWrap: { width: 84, height: 84, marginRight: 8, marginBottom: 8, position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#EEE' },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  removeTxt: { color: '#FFF', fontSize: 16, lineHeight: 18 },
  addBtn: { width: 84, height: 84, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  addTxt: { fontSize: fontSize.sm, color: '#666' },
});
