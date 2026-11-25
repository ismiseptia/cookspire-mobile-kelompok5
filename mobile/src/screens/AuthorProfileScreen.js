import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { resolveImageUrl } from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import { colors } from '../theme';

const extractUserId = (userObj) => {
  if (!userObj) return null;
  return (
    userObj.id_user ??
    userObj.id ??
    userObj.user?.id_user ??
    userObj.user?.id ??
    null
  );
};

const extractUserPhoto = (userObj) => {
  if (!userObj) return null;
  return (
    userObj.foto ||
    userObj.avatar ||
    userObj.photoUri ||
    userObj.user?.foto ||
    userObj.user?.avatar ||
    null
  );
};

export default function AuthorProfileScreen({ route, navigation }) {
  const authorId = route.params?.authorId;
  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      console.error('Gagal memuat sesi pengguna:', error.message);
    }
  }, []);

  const fetchAuthorProfile = useCallback(
    async (showLoader = true) => {
      if (!authorId) {
        setLoading(false);
        return;
      }
      if (showLoader) setLoading(true);
      try {
        const res = await API.get(`/recipes/user-profile/${authorId}`);
        setProfileData(res.data);
      } catch (error) {
        console.error('Error Fetch Author Profile:', error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authorId]
  );

  useEffect(() => {
    loadCurrentUser();
    fetchAuthorProfile(true);
  }, [loadCurrentUser, fetchAuthorProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCurrentUser();
    fetchAuthorProfile(false);
  }, [loadCurrentUser, fetchAuthorProfile]);

  const user = profileData?.user || {};
  const stats = profileData?.stats || {};
  const recipes = Array.isArray(profileData?.recipes) ? profileData.recipes : [];

  const currentUserId = extractUserId(currentUser);
  const isOwnProfile =
    currentUserId !== null &&
    authorId !== undefined &&
    String(currentUserId) === String(authorId);

  // Path foto dari server ("/uploads/...") harus diubah jadi URL lengkap agar gambar muncul
  const authorPhoto = resolveImageUrl(
    user.foto ||
      user.avatar ||
      (isOwnProfile ? extractUserPhoto(currentUser) : null)
  );

  useEffect(() => {
    setAvatarError(false);
  }, [authorPhoto]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Pembuat</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header User */}
            <View style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                {authorPhoto && !avatarError ? (
                  <Image
                    source={{ uri: authorPhoto }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {(user.nama || 'P').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.userName}>
                {user.nama || 'Chef Cookspire'} {isOwnProfile ? '(Anda)' : ''}
              </Text>
              <Text style={styles.userBio}>Suka masak masakan rumahan • Member Cookspire</Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total_resep || 0}</Text>
                <Text style={styles.statLabel}>Resep</Text>
              </View>
              <View style={[styles.statBox, styles.statBorder]}>
                <Text style={styles.statNumber}>
                  {Number(stats.avg_rating || 0).toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total_favorit || 0}</Text>
                <Text style={styles.statLabel}>Disukai</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Resep dari {user.nama || 'Penulis'}</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
          >
            <View style={styles.cardImageCircle}>
              <RecipeThumbnail uri={item.icon} emojiSize={32} fallbackEmoji="🥘" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryBadge}>{item.category}</Text>
              <Text style={styles.recipeTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color={colors.primary} />
                <Text style={styles.metaText}>
                  {Number(item.rating || 0).toFixed(1)} • {item.reviews_count || 0} ulasan
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Penulis ini belum memiliki resep.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileCard: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 30,
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userBio: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
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
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardImageCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  categoryBadge: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});