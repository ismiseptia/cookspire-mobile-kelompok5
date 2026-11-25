import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { resolveImageUrl } from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import { colors } from '../theme';

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Camilan', 'Dessert', 'Sayuran'];

const getHighestRatedRecipe = (recipeList = []) => {
  if (!Array.isArray(recipeList) || recipeList.length === 0) return null;

  return [...recipeList].sort((a, b) => {
    const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;
    return Number(b.reviews_count || 0) - Number(a.reviews_count || 0);
  })[0];
};

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [userName, setUserName] = useState('Pengguna');
  const [userPhoto, setUserPhoto] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      const name = user.nama || user.name;
      if (name) setUserName(name);
      setUserPhoto(user.foto || user.avatar || null);

      const userId =
        user.id_user ??
        user.id ??
        user.user?.id_user ??
        user.user?.id ??
        null;

      if (userId) {
        const res = await API.get(`/auth/user/profile/${userId}`).catch(() => null);
        if (res?.data?.user) {
          const syncedUser = { ...user, ...res.data.user };
          if (syncedUser.nama) setUserName(syncedUser.nama);
          setUserPhoto(syncedUser.foto || null);
          await AsyncStorage.setItem('userData', JSON.stringify(syncedUser));
        }
      }
    } catch (error) {
      console.error('Gagal memuat profil pengguna:', error.message);
    }
  }, []);

  const fetchRecipes = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const params = selectedCategory !== 'Semua' ? { category: selectedCategory } : {};
        const response = await API.get('/recipes', { params });

        const data = Array.isArray(response.data) ? response.data : [];
        setRecipes(data);
        setFeaturedRecipe(getHighestRatedRecipe(data));
      } catch (error) {
        console.error('Gagal memuat resep:', error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory]
  );

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    fetchRecipes(true);
  }, [fetchRecipes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      fetchRecipes(false);
    });
    return unsubscribe;
  }, [navigation, loadUserData, fetchRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
    fetchRecipes(false);
  }, [loadUserData, fetchRecipes]);

  const initialLetter = userName.trim() ? userName.trim().charAt(0).toUpperCase() : 'U';
  const resolvedUserPhoto = resolveImageUrl(userPhoto);

  useEffect(() => {
    setAvatarError(false);
  }, [resolvedUserPhoto]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header User & Notifikasi */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userInfo}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profil')}
          >
            <View style={styles.avatar}>
              {resolvedUserPhoto && !avatarError ? (
                <Image
                  source={{ uri: resolvedUserPhoto }}
                  style={styles.fullImage}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{initialLetter}</Text>
              )}
            </View>
            <View>
              <Text style={styles.greetingTitle}>Halo, {userName}</Text>
              <Text style={styles.greetingSubtitle}>Mau masak apa hari ini?</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar Trigger */}
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Cari')}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <Text style={styles.searchPlaceholder}>Cari resep, kategori, bahan...</Text>
          <View style={styles.filterBadge}>
            <Ionicons name="options-outline" size={16} color={colors.surface} />
          </View>
        </TouchableOpacity>

        {/* Banner Resep Pilihan */}
        {featuredRecipe && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>Resep Pilihan</Text>
            </View>

            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: featuredRecipe.id })}
            >
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featuredRecipe.title}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.primary} />
                  <Text style={styles.ratingText}>
                    {Number(featuredRecipe.rating || 0).toFixed(1)}{' '}
                    <Text style={styles.ratingCount}>
                      ({featuredRecipe.reviews_count || 0}) • {featuredRecipe.time_minutes || 30}m •{' '}
                      {featuredRecipe.level || 'Mudah'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.buttonDetail}>
                  <Text style={styles.buttonDetailText}>Lihat Resep</Text>
                </View>
              </View>
              <View style={styles.featuredImageCircle}>
                <RecipeThumbnail uri={featuredRecipe.icon} emojiSize={38} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Horizontal Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat ? styles.categoryChipActive : null,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat ? styles.categoryTextActive : null,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Header Resep Populer Grid */}
        <View style={styles.popularHeader}>
          <Text style={styles.sectionTitle}>Resep Populer</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PopularRecipes')}>
            <Text style={styles.seeAllText}>Lihat semua</Text>
          </TouchableOpacity>
        </View>

        {/* Resep Grid List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 35 }} />
        ) : recipes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Belum ada resep untuk kategori ini.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {recipes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recipeCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
              >
                <View style={styles.cardImageCircle}>
                  <RecipeThumbnail uri={item.icon} emojiSize={30} />
                </View>
                <Text style={styles.recipeCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="star" size={12} color={colors.primary} />
                  <Text style={styles.cardMetaText} numberOfLines={1}>
                    {Number(item.rating || 0).toFixed(1)} • {item.time_minutes || 30}m •{' '}
                    {item.level || 'Mudah'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  greetingTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  greetingSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 12,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionBadge: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredInfo: {
    flex: 1,
    paddingRight: 10,
  },
  featuredTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ratingCount: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  buttonDetail: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  buttonDetailText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredImageCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  categoryTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cardImageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  recipeCardTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cardMetaText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginLeft: 4,
    flexShrink: 1,
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