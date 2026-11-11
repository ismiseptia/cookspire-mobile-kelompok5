import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Perhatian', 'Password minimal terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Perhatian', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (res.data.success) {
        navigation.navigate('ResetPasswordSuccess');
      }
    } catch (error) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerBackText}>Kembali ke Verifikasi</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>LANGKAH 3 DARI 3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={24} color="#E6A153" />
        </View>

        <Text style={styles.title}>Buat password baru</Text>
        <Text style={styles.subtitle}>Pilih password yang kuat untuk akun {email}</Text>

        <Text style={styles.label}>Password baru</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInput}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••••••"
            placeholderTextColor="#81A39D"
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#81A39D" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Konfirmasi password baru</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••••••"
            placeholderTextColor="#81A39D"
            secureTextEntry={!showPass}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0D3B36" />
          ) : (
            <Text style={styles.primaryBtnText}>Simpan Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 10,
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  stepBadge: {
    backgroundColor: '#184943',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    color: '#E6A153',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#B2D0CA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  label: {
    color: '#B2D0CA',
    fontSize: 12,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#0D3B36',
    fontSize: 14,
    fontWeight: 'bold',
  },
});