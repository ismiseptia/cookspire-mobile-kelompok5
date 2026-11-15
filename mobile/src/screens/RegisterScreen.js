import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';

// Minimal 8 karakter berupa huruf atau angka (tanpa spasi/simbol)
const PASSWORD_REGEX = /^[A-Za-z0-9]{8,}$/;

export default function RegisterScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isPasswordValid = PASSWORD_REGEX.test(password);

  const handleFieldChange = (setter) => (text) => {
    setter(text);
    if (errorMessage) setErrorMessage('');
  };

  const handleRegister = async () => {
    setErrorMessage('');

    const trimmedNama = nama.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNama || !trimmedEmail || !password) {
      setErrorMessage('Data pendaftaran tidak lengkap. Mohon isi semua kolom.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password harus minimal 8 karakter berupa huruf atau angka.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/register', {
        nama: trimmedNama,
        email: trimmedEmail,
        password,
      });

      Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan masuk.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Gagal mendaftar. Pastikan koneksi backend terhubung.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>Bergabunglah dengan komunitas kuliner Cookspire</Text>

          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#FF6B6B"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Input Nama */}
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={[styles.inputContainer, errorMessage && !nama.trim() ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Rina Wijaya"
                placeholderTextColor="#81A39D"
                value={nama}
                onChangeText={handleFieldChange(setNama)}
              />
            </View>

            {/* Input Email */}
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, errorMessage && !email.trim() ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="rina@email.com"
                placeholderTextColor="#81A39D"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={handleFieldChange(setEmail)}
              />
            </View>

            {/* Input Password */}
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                { marginBottom: 6 },
                errorMessage && !isPasswordValid ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#81A39D"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Minimal 8 huruf atau angka"
                placeholderTextColor="#81A39D"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={handleFieldChange(setPassword)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#81A39D"
                />
              </TouchableOpacity>
            </View>

            {/* Indikator Syarat Password */}
            <Text
              style={[
                styles.passwordHint,
                password.length > 0 && (isPasswordValid ? styles.hintValid : styles.hintInvalid),
              ]}
            >
              * Minimal 8 karakter (huruf atau angka)
            </Text>

            <TouchableOpacity
              style={[styles.buttonPrimary, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0D3B36" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Daftar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#B2D0CA',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#245D56',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  input: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  passwordHint: {
    color: '#81A39D',
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 16,
  },
  hintValid: {
    color: '#4ADE80',
  },
  hintInvalid: {
    color: '#FF6B6B',
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonPrimaryText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#B2D0CA',
    fontSize: 13,
  },
  linkText: {
    color: '#E6A153',
    fontWeight: 'bold',
    fontSize: 13,
  },
});