import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API, { resolveImageUrl, uploadImageAsset } from '../services/api';
import { colors } from '../theme';

const DEFAULT_BIO = 'Suka masak rumahan dan berbagi resep sederhana.';

export default function EditProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState(DEFAULT_BIO);
  const [foto, setFoto] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const resolvedId =
          parsed.id_user ??
          parsed.id ??
          parsed.user?.id_user ??
          parsed.user?.id ??
          null;

        setUserId(resolvedId);
        setNama(parsed.nama || parsed.name || '');
        setEmail(parsed.email || '');
        setFoto(parsed.foto || parsed.avatar || null);
        if (parsed.bio !== undefined && parsed.bio !== null) {
          setBio(parsed.bio);
        }

        if (resolvedId) {
          const res = await API.get(`/auth/user/profile/${resolvedId}`).catch(() => null);
          if (res?.data?.user) {
            const dbUser = res.data.user;
            setNama(dbUser.nama || parsed.nama || '');
            setEmail(dbUser.email || parsed.email || '');
            setFoto(dbUser.foto || parsed.foto || null);
            if (dbUser.bio !== undefined && dbUser.bio !== null) {
              setBio(dbUser.bio);
            }
          }
        }
      }
    } catch (error) {
      console.error('Gagal memuat data user:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Izin Diperlukan',
          'Izinkan aplikasi mengakses galeri foto untuk mengubah foto profil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setFoto(result.assets[0].uri);
        setFotoBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      console.error('Error Pick Photo:', error.message);
      Alert.alert('Gagal', 'Tidak dapat membuka galeri foto.');
    }
  };

  const handleSaveProfile = async () => {
    const trimmedNama = nama.trim();
    const trimmedBio = bio.trim();

    if (!trimmedNama) {
      Alert.alert('Perhatian', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!userId) {
      Alert.alert('Sesi Tidak Valid', 'ID pengguna tidak ditemukan. Silakan login ulang.');
      return;
    }

    try {
      setSubmitting(true);

      let uploadedFotoUrl = foto;
      if (fotoBase64) {
        uploadedFotoUrl = await uploadImageAsset(foto, fotoBase64, 'avatar');
      }

      const response = await API.put(`/auth/user/profile/${userId}`, {
        nama: trimmedNama,
        bio: trimmedBio,
        foto: uploadedFotoUrl || null,
      });

      if (response.data?.success) {
        const currentData = await AsyncStorage.getItem('userData');
        const parsed = currentData ? JSON.parse(currentData) : {};

        const updatedData = {
          ...parsed,
          ...(response.data.user || {}),
          id_user: userId,
          id: userId,
          nama: trimmedNama,
          bio: trimmedBio,
          foto: response.data.user?.foto ?? uploadedFotoUrl ?? null,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));

        Alert.alert('Sukses', 'Profil berhasil diperbarui!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error Save Profile:', error.message);
      Alert.alert(
        'Gagal',
        error.response?.data?.message || 'Terjadi kesalahan saat menyimpan profil.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const initialLetter = nama.trim() ? nama.trim().charAt(0).toUpperCase() : 'U';
  const displayAvatarUri = resolveImageUrl(foto);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
            >
              {displayAvatarUri ? (
                <Image source={{ uri: displayAvatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initialLetter}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={handlePickPhoto}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Ionicons name="camera-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.changePhotoText}>Ubah Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <Text style={styles.label}>Nama lengkap</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={nama}
              onChangeText={setNama}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Email - hanya baca</Text>
          <View style={[styles.inputContainer, styles.readOnlyInput]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.textMuted }]}
              value={email}
              editable={false}
            />
            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Text style={styles.linkText}>Ubah email melalui Pengaturan Akun →</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Bio (opsional)</Text>
          <View style={styles.multilineContainer}>
            <TextInput
              style={styles.multilineInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tuliskan bio singkat tentang dirimu..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.helperText}>Ceritakan sedikit tentang dirimu.</Text>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
            onPress={handleSaveProfile}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Simpan Perubahan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 12,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 36,
    fontWeight: 'bold',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyInput: {
    opacity: 0.8,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  linkButton: {
    marginTop: 6,
    marginBottom: 10,
  },
  linkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  multilineContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
  },
  multilineInput: {
    color: colors.text,
    fontSize: 13,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});