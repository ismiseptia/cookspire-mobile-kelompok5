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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMessage('');

    if (!nama || !email || !password) {
      setErrorMessage('Data pendaftaran tidak lengkap. Mohon isi semua kolom.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/register', { nama, email, password });
      setLoading(false);
      
      Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan masuk.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Gagal mendaftar. Pastikan koneksi backend terhubung.';
      setErrorMessage(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" // Agar tombol langsung merespons walau keyboard aktif
      >
        
        <Text style={styles.title}>Buat Akun Baru</Text>
        <Text style={styles.subtitle}>Bergabunglah dengan komunitas kuliner Cookspire</Text>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Input Nama */}
          <Text style={styles.label}>Nama Lengkap</Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Rina Wijaya"
              placeholderTextColor="#81A39D"
              value={nama}
              onChangeText={(text) => {
                setNama(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </View>

          {/* Input Email */}
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="rina@email.com"
              placeholderTextColor="#81A39D"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </View>

          {/* Input Password */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor="#81A39D"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="#81A39D"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.buttonPrimary, loading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={loading}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
  },
  content: {
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