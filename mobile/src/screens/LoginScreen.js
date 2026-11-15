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
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Normalisasi objek user dari berbagai kemungkinan struktur respons API
  const buildUserSession = (responseData, fallbackEmail) => {
    const rawUser = responseData?.user || responseData?.data || responseData || {};
    const resolvedId =
      rawUser.id_user ?? rawUser.id ?? responseData?.id_user ?? responseData?.id;

    return {
      ...rawUser,
      ...(resolvedId !== undefined ? { id_user: resolvedId, id: resolvedId } : {}),
      email: rawUser.email || fallbackEmail,
      nama: rawUser.nama || rawUser.name || 'User',
    };
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);

      // Bersihkan sesi akun sebelumnya agar tidak tertimpa data lama
      await AsyncStorage.multiRemove(['userToken', 'userData']);

      const res = await API.post('/auth/login', {
        email: trimmedEmail,
        password,
      });

      if (res.data?.success || res.data?.token) {
        const token = res.data.token || 'dummy_token';
        const userData = buildUserSession(res.data, trimmedEmail);

        await AsyncStorage.multiSet([
          ['userToken', token],
          ['userData', JSON.stringify(userData)],
        ]);

        navigation.reset({ index: 0, routes: [{ name: 'MainTab' }] });
      } else {
        Alert.alert('Gagal Masuk', res.data?.message || 'Respons login tidak valid.');
      }
    } catch (error) {
      Alert.alert(
        'Gagal Masuk',
        error.response?.data?.message || 'Email atau password salah.'
      );
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Circle Logo */}
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍲</Text>
            </View>

            <Text style={styles.title}>Selamat Datang Kembali</Text>
            <Text style={styles.subtitle}>Masuk untuk membuka seluruh fitur Cookspire</Text>

            {/* Form Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="#81A39D" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                placeholderTextColor="#81A39D"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Form Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#81A39D"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor="#81A39D"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#81A39D"
                />
              </TouchableOpacity>
            </View>

            {/* Tombol Lupa Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Lupa password?</Text>
            </TouchableOpacity>

            {/* Tombol Masuk */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0D3B36" />
              ) : (
                <Text style={styles.primaryBtnText}>Masuk</Text>
              )}
            </TouchableOpacity>

            {/* Tombol Google */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
              <Text style={styles.googleBtnText}>Lanjutkan dengan Google</Text>
            </TouchableOpacity>

            {/* Footer Register Link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Belum punya akun? <Text style={styles.registerHighlight}>Daftar</Text>
              </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#B2D0CA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#245D56',
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: {
    color: '#E6A153',
    fontSize: 12,
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.75,
  },
  primaryBtnText: {
    color: '#0D3B36',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleBtn: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#245D56',
    marginBottom: 28,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  registerHighlight: {
    color: '#E6A153',
    fontWeight: 'bold',
  },
});