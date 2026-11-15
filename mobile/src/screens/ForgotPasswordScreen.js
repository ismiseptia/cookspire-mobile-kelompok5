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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Perhatian', 'Masukkan email kamu terlebih dahulu.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/forgot-password', { email: normalizedEmail });

      if (res.data.success) {
        const otpCode = res.data.otpDev;
        const goToVerify = () =>
          navigation.navigate('VerifyOtp', {
            email: normalizedEmail,
            otpDev: otpCode,
          });

        if (otpCode) {
          Alert.alert(
            'Kode OTP Terkirim',
            `Kode verifikasi kamu adalah: ${otpCode}`,
            [{ text: 'Lanjut', onPress: goToVerify }]
          );
        } else {
          goToVerify();
        }
      }
    } catch (error) {
      Alert.alert('Gagal', error.response?.data?.message || 'Email tidak terdaftar.');
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
        <Text style={styles.headerBackText}>Kembali ke Masuk</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>LANGKAH 1 DARI 3</Text>
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
            <Ionicons name="key-outline" size={24} color="#E6A153" />
          </View>

          <Text style={styles.title}>Lupa password?</Text>
          <Text style={styles.subtitle}>
            Tenang, kami bantu. Masukkan email akunmu untuk menerima kode pemulihan.
          </Text>

          <Text style={styles.label}>Email pemulihan</Text>
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
              autoCorrect={false}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#E6A153"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>
              Kode 6 digit akan dikirim ke emailmu. Periksa juga folder spam jika belum masuk.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0D3B36" />
            ) : (
              <Text style={styles.primaryBtnText}>Kirim Kode</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.goBack()}>
            <Text style={styles.bottomLinkText}>
              Sudah ingat? <Text style={{ color: '#E6A153', fontWeight: 'bold' }}>Kembali ke Masuk</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 20,
    paddingBottom: 32,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    color: '#B2D0CA',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#0D3B36',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomLink: {
    alignItems: 'center',
  },
  bottomLinkText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
});