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
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/login', { email: email.trim(), password });
      if (res.data.success || res.data.token) {
        const token = res.data.token || 'dummy_token';
        const userData = res.data.user || { email, nama: 'User' };
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        navigation.reset({ index: 0, routes: [{ name: 'MainTab' }] });
      }
    } catch (error) {
      Alert.alert('Gagal Masuk', error.response?.data?.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <View style={styles.content}>
        {/* Circle Logo */}
        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 32 }}>🍲</Text>
        </View>

        <Text style={styles.title}>Selamat Datang Kembali</Text>
        <Text style={styles.subtitle}>Masuk untuk membuka seluruh fitur Cookspire</Text>

        {/* Form Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            placeholderTextColor="#81A39D"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Form Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            placeholderTextColor="#81A39D"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#81A39D"
            />
          </TouchableOpacity>
        </View>

        {/* Tombol Lupa Password (Sudah Diberi Jarak Cukup) */}
        <TouchableOpacity
          style={styles.forgotBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Lupa password?</Text>
        </TouchableOpacity>

        {/* Tombol Masuk */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
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
            Belum punya akun? <Text style={{ color: '#E6A153', fontWeight: 'bold' }}>Daftar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 24, // Jarak memberi ruang antara teks dan tombol Masuk
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
});