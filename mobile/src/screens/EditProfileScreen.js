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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function EditProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('Suka masak rumahan dan berbagi resep sederhana.');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserId(user.id_user || user.id || 1);
        setNama(user.nama || user.name || '');
        setEmail(user.email || '');
        if (user.bio) setBio(user.bio);
      }
    } catch (error) {
      console.error('Gagal memuat data user:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!nama.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await API.put(`/recipes/user/profile/${userId}`, {
        nama: nama.trim(),
        bio: bio.trim(),
      });

      if (response.data.success) {
        // Update data lokal di AsyncStorage
        const currentData = await AsyncStorage.getItem('userData');
        const parsed = currentData ? JSON.parse(currentData) : {};
        const updatedData = { ...parsed, nama: nama.trim(), bio: bio.trim() };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));

        Alert.alert('Sukses', 'Profil berhasil diperbarui!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error Save Profile:', error.message);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSubmitting(false);
    }
  };

  const initialLetter = nama ? nama.charAt(0).toUpperCase() : 'U';

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#E6A153" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Ionicons name="camera-outline" size={16} color="#E6A153" style={{ marginRight: 6 }} />
            <Text style={styles.changePhotoText}>Ubah Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <Text style={styles.label}>Nama lengkap</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#81A39D" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={nama}
            onChangeText={setNama}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor="#81A39D"
          />
        </View>

        <Text style={styles.label}>Email - hanya baca</Text>
        <View style={[styles.inputContainer, styles.readOnlyInput]}>
          <Ionicons name="mail-outline" size={18} color="#81A39D" style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: '#81A39D' }]}
            value={email}
            editable={false}
          />
          <Ionicons name="lock-closed" size={16} color="#81A39D" />
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
            placeholderTextColor="#81A39D"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.helperText}>Ceritakan sedikit tentang dirimu.</Text>

        {/* Buttons */}
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleSaveProfile} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#0D3B36" />
          ) : (
            <Text style={styles.primaryButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
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
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
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
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#0D3B36',
    fontSize: 36,
    fontWeight: 'bold',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#E6A153',
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    color: '#B2D0CA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
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
    color: '#FFFFFF',
    fontSize: 13,
  },
  linkButton: {
    marginTop: 6,
    marginBottom: 10,
  },
  linkText: {
    color: '#E6A153',
    fontSize: 12,
    fontWeight: '500',
  },
  multilineContainer: {
    backgroundColor: '#184943',
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
  },
  multilineInput: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  helperText: {
    color: '#81A39D',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#B2D0CA',
    fontSize: 13,
  },
});