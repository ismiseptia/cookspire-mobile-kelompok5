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
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import { colors } from '../theme';

// Minimal 8 karakter berupa huruf atau angka
const PASSWORD_REGEX = /^[A-Za-z0-9]{8,}$/;

export default function ResetPasswordScreen({ route, navigation }) {
  const { email = '', otp = '' } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPasswordValid = PASSWORD_REGEX.test(newPassword);

  const handleResetPassword = async () => {
    if (!email || !otp) {
      Alert.alert('Sesi Tidak Valid', 'Silakan ulangi proses lupa password dari awal.');
      navigation.navigate('ForgotPassword');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        'Password Tidak Valid',
        'Password baru harus minimal 8 karakter berupa huruf atau angka.'
      );
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerBackText}>Kembali ke Verifikasi</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>LANGKAH 3 DARI 3</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
          </View>

          <Text style={styles.title}>Buat password baru</Text>
          <Text style={styles.subtitle}>Pilih password yang kuat untuk akun {email}</Text>

          <Text style={styles.label}>Password baru</Text>
          <View style={[styles.inputBox, { marginBottom: 6 }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimal 8 huruf atau angka"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              onPress={() => setShowPass((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.passwordHint,
              newPassword.length > 0 && (isPasswordValid ? styles.hintValid : styles.hintInvalid),
            ]}
          >
            * Minimal 8 karakter (huruf atau angka)
          </Text>

          <Text style={styles.label}>Konfirmasi password baru</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi password baru"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryBtnText}>Simpan Password</Text>
            )}
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerBackText: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  stepBadge: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  passwordHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
    marginBottom: 16,
  },
  hintValid: {
    color: colors.secondary,
  },
  hintInvalid: {
    color: colors.danger,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
});