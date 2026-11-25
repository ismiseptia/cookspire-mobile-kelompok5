import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../services/api';
import { colors } from '../theme';

// Avatar penulis yang dipakai di SEMUA layar (Favorit, Populer, Hasil Cari, Detail, dst.)
// agar foto profil selalu tampil konsisten. Jika foto kosong/gagal dimuat,
// tampil huruf pertama nama penulis.
export default function AuthorAvatar({ uri, name, size = 20, style }) {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = resolveImageUrl(uri);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUri]);

  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initial = (name || 'C').trim().charAt(0).toUpperCase() || 'C';

  return (
    <View style={[styles.circle, dimension, style]}>
      {resolvedUri && !hasError ? (
        <Image
          source={{ uri: resolvedUri }}
          style={dimension}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.max(9, size * 0.5) }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
