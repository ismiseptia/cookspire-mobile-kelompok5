import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountSettingsScreen({ navigation }) {
  const [nama, setNama] = useState('Rina Maharani');
  const [email, setEmail] = useState('rina@email.com');

  // Toggle Switch State
  const [komentarNotif, setKomentarNotif] = useState(true);
  const [ratingNotif, setRatingNotif] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.nama) setNama(user.nama);
        if (user.email) setEmail(user.email);
      }
    } catch (error) {
      console.error('Gagal memuat data akun:', error.message);
    }
  };

  const initialLetter = nama ? nama.charAt(0).toUpperCase() : 'R';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Akun</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Brief Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{nama}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
        </View>

        {/* AKUN & KEAMANAN SECTION */}
        <Text style={styles.sectionHeader}>AKUN & KEAMANAN</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Kelola Email', 'Fitur pengubahan email akan dikirim via verifikasi email.')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Kelola email</Text>
              <Text style={styles.menuSubtitle}>{email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => Alert.alert('Ubah Password', 'Link riset password telah dikirim ke email kamu.')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Ubah password</Text>
              <Text style={styles.menuSubtitle}>Jaga keamanan akunmu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>
        </View>

        {/* NOTIFIKASI SECTION */}
        <Text style={styles.sectionHeader}>NOTIFIKASI</Text>
        <View style={styles.cardGroup}>
          <View style={styles.switchRow}>
            <View style={styles.iconBox}>
              <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Komentar</Text>
              <Text style={styles.menuSubtitle}>
                {komentarNotif ? 'Aktif - komentar baru di resepmu' : 'Nonaktif'}
              </Text>
            </View>
            <Switch
              value={komentarNotif}
              onValueChange={setKomentarNotif}
              trackColor={{ false: '#245D56', true: '#E6A153' }}
              thumbColor={komentarNotif ? '#0D3B36' : '#81A39D'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.iconBox}>
              <Ionicons name="star-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Rating</Text>
              <Text style={styles.menuSubtitle}>
                {ratingNotif ? 'Aktif - penilaian baru di resepmu' : 'Nonaktif - penilaian baru di resepmu'}
              </Text>
            </View>
            <Switch
              value={ratingNotif}
              onValueChange={setRatingNotif}
              trackColor={{ false: '#245D56', true: '#E6A153' }}
              thumbColor={ratingNotif ? '#0D3B36' : '#81A39D'}
            />
          </View>
        </View>

        {/* Bottom Link */}
        <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#E6A153" style={{ marginRight: 6 }} />
          <Text style={styles.backLinkText}>Kembali ke Profil</Text>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 18,
    padding: 16,
    marginVertical: 14,
  },
  avatarMini: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#B2D0CA',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    color: '#E6A153',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: '#184943',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuSubtitle: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#245D56',
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  offlineTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  offlineSubtitle: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    color: '#E6A153',
    fontSize: 13,
    fontWeight: 'bold',
  },
});