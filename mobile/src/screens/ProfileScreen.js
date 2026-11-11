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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ nama: '', email: '', id_user: 1 });
  const [stats, setStats] = useState({ total_resep: 0, total_favorit: 0, avg_rating: '0.0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const userId = parsedUser.id_user || parsedUser.id || 1;
        const res = await API.get(`/recipes/user/${userId}`);

        if (res.data && res.data.stats) {
          setStats({
            total_resep: res.data.stats.total_resep || 0,
            total_favorit: res.data.stats.total_ulasan || 0,
            avg_rating: res.data.stats.avg_rating || '0.0',
          });
        }
      }
    } catch (error) {
      console.error('Gagal memuat data profil:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah kamu yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const initialLetter = user.nama ? user.nama.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info Header Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <Text style={styles.userName}>{user.nama || 'Pengguna'}</Text>
          <Text style={styles.userEmail}>{user.email || 'user@email.com'}</Text>

          {/* Tombol Kapsul EDIT PROFIL */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileText}>EDIT PROFIL</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total_resep}</Text>
            <Text style={styles.statLabel}>Resep Saya</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNumber}>{stats.total_favorit}</Text>
            <Text style={styles.statLabel}>Favorit</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.avg_rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Menu Items Container */}
        <Text style={styles.menuGroupHeader}>MENU PROFIL</Text>
        <View style={styles.menuContainer}>
          {/* 1. Resep Saya */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyRecipes')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="book-outline" size={20} color="#E6A153" style={styles.menuIcon} />
              <Text style={styles.menuText}>Resep Saya</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 2. Resep Favorit */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Favorit')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={20} color="#E6A153" style={styles.menuIcon} />
              <Text style={styles.menuText}>Resep Favorit</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 3. Notifikasi */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color="#E6A153" style={styles.menuIcon} />
              <Text style={styles.menuText}>Notifikasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 4. Pengaturan Akun */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={20} color="#E6A153" style={styles.menuIcon} />
              <Text style={styles.menuText}>Pengaturan Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#81A39D" />
          </TouchableOpacity>
        </View>

        {/* Tombol Keluar dari Akun */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#184943',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#0D3B36',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    color: '#B2D0CA',
    fontSize: 12,
    marginBottom: 14,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#245D56',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#245D56',
  },
  statNumber: {
    color: '#E6A153',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 2,
  },
  menuGroupHeader: {
    color: '#81A39D',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: '#184943',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#245D56',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#184943',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: 'bold',
  },
});