import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordSuccessScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <View style={styles.content}>
        <View style={styles.successBadge}>
          <Ionicons name="lock-closed" size={44} color="#0D3B36" />
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Password berhasil diubah!</Text>
        <Text style={styles.subtitle}>
          Sekarang kamu bisa masuk dengan password baru dan kembali menemukan inspirasi masakan.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
        >
          <Text style={styles.primaryBtnText}>Kembali ke Masuk</Text>
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
    alignItems: 'center',
  },
  successBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#B2D0CA',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 36,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0D3B36',
    fontSize: 14,
    fontWeight: 'bold',
  },
});