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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { resolveImageUrl } from '../services/api';
import { colors } from '../theme';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ nama: '', email: '', bio: '', foto: null, id_user: null });
  const [stats, setStats] = useState({ total_resep: 0, total_favorit: 0, avg_rating: '0.0' });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const userId =
        parsedUser.id_user ??
        parsedUser.id ??
        parsedUser.user?.id_user ??
        parsedUser.user?.id;

      if (!userId) return;

      const [recipesRes, profileRes] = await Promise.all([
        API.get(`/recipes/user/${userId}`),
        API.get(`/auth/user/profile/${userId}`).catch(() => null),
      ]);

      if (profileRes?.data?.user) {
        const syncedUser = { ...parsedUser, ...profileRes.data.user };
        setUser(syncedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(syncedUser));
      }

      if (recipesRes.data?.stats) {
        setStats({
          total_resep: recipesRes.data.stats.total_resep || 0,
          total_favorit: recipesRes.data.stats.total_ulasan || 0,
          avg_rating: recipesRes.data.stats.avg_rating || '0.0',
        });
      }
    } catch (error) {
      console.error('Gagal memuat data profil:', error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah kamu yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const initialLetter = user.nama?.trim() ? user.nama.trim().charAt(0).toUpperCase() : 'U';
  const avatarUri = resolveImageUrl(user.foto || user.avatar || null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info Header Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initialLetter}</Text>
            )}
          </View>
          <Text style={styles.userName}>{user.nama || 'Pengguna'}</Text>
          <Text style={[styles.userEmail, user.bio ? { marginBottom: 6 } : null]}>
            {user.email || 'user@email.com'}
          </Text>
          {user.bio ? <Text style={styles.userBio}>{user.bio}</Text> : null}

          {/* Tombol Kapsul EDIT PROFIL */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={14} color={colors.text} style={{ marginRight: 6 }} />
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
              <Ionicons name="book-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Resep Saya</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 2. Resep Favorit */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Favorit')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Resep Favorit</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 2b. Sampah (pulihkan resep terhapus) */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Trash')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-bin-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Sampah Resep</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 3. Notifikasi */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.primary}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Notifikasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 4. Pengaturan Akun */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Pengaturan Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Tombol Keluar dari Akun */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  },
  userBio: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editProfileText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
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
    borderColor: colors.surfaceAlt,
  },
  statNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  menuGroupHeader: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: colors.surface,
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
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceAlt,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'colors.danger',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
});