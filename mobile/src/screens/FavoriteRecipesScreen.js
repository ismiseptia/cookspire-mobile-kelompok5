import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ScrollView,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthorAvatar from '../components/AuthorAvatar';
import RecipeThumbnail from '../components/RecipeThumbnail';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import { colors } from '../theme';

const CATEGORY_ITEMS = [
  { label: 'Semua', icon: 'grid-outline' },
  { label: 'Makanan Utama', icon: 'restaurant-outline' },
  { label: 'Minuman', icon: 'cafe-outline' },
  { label: 'Camilan', icon: 'pizza-outline' },
  { label: 'Dessert', icon: 'ice-cream-outline' },
  { label: 'Sayuran', icon: 'leaf-outline' },
];

const resolveUserId = async () => {
  const storedUser = await AsyncStorage.getItem('userData');
  if (!storedUser) return null;

  const parsed = JSON.parse(storedUser);
  return (
    parsed.id_user ??
    parsed.id ??
    parsed.user?.id_user ??
    parsed.user?.id ??
    null
  );
};

const isImageUri = (value) =>
  typeof value === 'string' &&
  (value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('data:image'));

export default function FavoriteRecipesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const userId = await resolveUserId();
      if (!userId) {
        setFavorites([]);
        return;
      }

      const response = await API.get(`/recipes/favorites/${userId}`);
      setFavorites(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error Fetch Favorites:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(true);
  }, [fetchFavorites]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites(false);
    });
    return unsubscribe;
  }, [navigation, fetchFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites(false);
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (recipeId) => {
    try {
      const userId = await resolveUserId();
      if (!userId) return;

      setFavorites((prev) => prev.filter((item) => item.id !== recipeId));

      await API.post('/recipes/favorites/toggle', {
        id_user: userId,
        id_resep: recipeId,
      });
    } catch (error) {
      console.error('Gagal menghapus favorit:', error.message);
      fetchFavorites(false);
    }
  };

  // Hitung jumlah resep pada tiap kategori
  const categoryCounts = useMemo(() => {
    const counts = { Semua: favorites.length };
    for (const item of favorites) {
      const cat = (item.category || '').trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [favorites]);

  // Filter berdasarkan kategori aktif dan kata kunci pencarian
  const filteredFavorites = useMemo(() => {
    const targetCategory = selectedCategory.toLowerCase();
    const keyword = searchQuery.trim().toLowerCase();

    return favorites.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua' ||
        (item.category || '').trim().toLowerCase() === targetCategory;

      const matchSearch =
        !keyword ||
        (item.title || '').toLowerCase().includes(keyword) ||
        (item.author || '').toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [favorites, selectedCategory, searchQuery]);

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      {/* Thumbnail Resep */}
      <View style={styles.cardImageBox}>
        <RecipeThumbnail uri={item.icon} emojiSize={32} fallbackEmoji="🥘" />
      </View>

      {/* Konten Utama */}
      <View style={styles.cardContent}>
        <View style={styles.topTagRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryBadge}>{item.category || 'Umum'}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color={colors.primary} />
            <Text style={styles.ratingPillText}>{Number(item.rating || 0).toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.bottomMetaRow}>
          <View style={styles.authorRow}>
            <AuthorAvatar uri={item.author_photo} name={item.author} size={18} />
            <Text style={styles.authorText} numberOfLines={1}>
              {item.author || 'Chef Cookspire'}
            </Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.reviewCountText}>{item.reviews_count || 0} ulasan</Text>
        </View>
      </View>

      {/* Tombol Hapus Favorit */}
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => handleRemoveFavorite(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header dengan Counter */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Resep Favorit</Text>
          <Text style={styles.headerSubtitle}>Koleksi masakan andalanmu</Text>
        </View>
        <View style={styles.countBadge}>
          <Ionicons name="bookmark" size={13} color={colors.surface} style={{ marginRight: 5 }} />
          <Text style={styles.countBadgeText}>{favorites.length} Tersimpan</Text>
        </View>
      </View>

      {/* Search Bar dalam Favorit */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={17} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari di daftar favorit..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Kategori Berikon */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORY_ITEMS.map(({ label, icon }) => {
          const isActive = selectedCategory === label;
          const count = categoryCounts[label] || 0;

          return (
            <TouchableOpacity
              key={label}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(label)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={icon}
                size={14}
                color={isActive ? colors.surface : colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {label}
              </Text>
              <View style={[styles.chipCountBubble, isActive && styles.chipCountBubbleActive]}>
                <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Daftar Favorit */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={38} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'Resep Tidak Ditemukan'
                  : selectedCategory === 'Semua'
                  ? 'Belum Ada Resep Favorit'
                  : `Kategori ${selectedCategory} Kosong`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Tidak ada favorit yang cocok dengan "${searchQuery}".`
                  : selectedCategory === 'Semua'
                  ? 'Simpan resep kesukaanmu dengan menekan ikon hati agar mudah ditemukan kapan saja.'
                  : `Kamu belum menyimpan resep favorit untuk kategori ${selectedCategory}.`}
              </Text>

              {!searchQuery && (
                <TouchableOpacity
                  style={styles.exploreBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Cari')}
                >
                  <Ionicons name="compass-outline" size={16} color={colors.surface} style={{ marginRight: 6 }} />
                  <Text style={styles.exploreBtnText}>Jelajahi Resep</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    marginBottom: 16,
    maxHeight: 42,
  },
  categoryContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  chipCountBubble: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  chipCountBubbleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCountText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  chipCountTextActive: {
    color: colors.surface,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImageBox: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    paddingRight: 6,
  },
  topTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryPill: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  categoryBadge: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingPillText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '58%',
  },
  authorText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
  },
  dotSeparator: {
    color: colors.textMuted,
    fontSize: 11,
    marginHorizontal: 6,
  },
  reviewCountText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  favoriteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'colors.primarySoft',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'colors.primarySoft',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  exploreBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: 'bold',
  },
});