import React, { useState, useRef } from 'react';
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

export default function VerifyOtpScreen({ route, navigation }) {
  const { email, otpDev } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      Alert.alert('Perhatian', 'Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/verify-otp', { email, otp: fullOtp });
      if (res.data.success) {
        navigation.navigate('ResetPassword', { email, otp: fullOtp });
      }
    } catch (error) {
      Alert.alert('Gagal', error.response?.data?.message || 'Kode OTP salah.');
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
        <Text style={styles.headerBackText}>Kembali ke Lupa Password</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>LANGKAH 2 DARI 3</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread-outline" size={24} color="#E6A153" />
        </View>

        <Text style={styles.title}>Verifikasi kode</Text>
        <Text style={styles.subtitle}>
          Masukkan kode 6 digit yang dikirim ke <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{email}</Text>
        </Text>

        {otpDev && (
          <Text style={{ color: '#E6A153', fontSize: 12, marginBottom: 16 }}>
            [DEV MODE] Kode OTP kamu: {otpDev}
          </Text>
        )}

        {/* 6 OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, idx)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0D3B36" />
          ) : (
            <Text style={styles.primaryBtnText}>Verifikasi</Text>
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#184943',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#245D56',
  },
  otpBoxFilled: {
    borderColor: '#E6A153',
    backgroundColor: '#245D56',
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0D3B36',
    fontSize: 14,
    fontWeight: 'bold',
  },
});