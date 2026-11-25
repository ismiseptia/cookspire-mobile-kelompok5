import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { resolveImageUrl } from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import { colors } from '../theme';

const formatQty = (qtyStr) => {
  if (!qtyStr) return '';
  return qtyStr.toString().replace(/\b\d+\.\d+\b/g, (match) => {
    const num = parseFloat(match);
    return isNaN(num) ? match : num.toString();
  });
};

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

export default function RecipeDetailScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const [activeTab, setActiveTab] = useState('Bahan');
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authorImgError, setAuthorImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      console.error('Gagal memuat data pengguna:', error.message);
    }
  }, []);

  const fetchRecipeDetail = useCallback(
    async (showLoader = true) => {
      if (!recipeId) return;
      if (showLoader) setLoading(true);
      try {
        const res = await API.get(`/recipes/${recipeId}`);
        setRecipe(res.data);
      } catch (error) {
        console.error('Gagal mengambil detail resep:', error.message);
      } finally {
        setLoading(false);
      }
    },
    [recipeId]
  );

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      const userId = extractUserId(parsed);
      if (!userId || !recipeId) return;

      const res = await API.get(`/recipes/favorites/${userId}`);
      const favs = Array.isArray(res.data) ? res.data : [];
      const isFav = favs.some((item) => String(item.id) === String(recipeId));
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Error check favorite status:', error.message);
    }
  }, [recipeId]);

  useEffect(() => {
    loadCurrentUser();
    fetchRecipeDetail(true);
    checkFavoriteStatus();
  }, [loadCurrentUser, fetchRecipeDetail, checkFavoriteStatus]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCurrentUser();
      fetchRecipeDetail(false);
      checkFavoriteStatus();
    });
    return unsubscribe;
  }, [navigation, loadCurrentUser, fetchRecipeDetail, checkFavoriteStatus]);

  const handleToggleFavorite = async () => {
    const previousState = isFavorite;
    setIsFavorite(!previousState);

    try {
      const userId = extractUserId(currentUser);
      if (!userId) {
        setIsFavorite(previousState);
        return;
      }

      const res = await API.post('/recipes/favorites/toggle', {
        id_user: userId,
        id_resep: recipeId,
      });

      if (res.data && res.data.isFavorite !== undefined) {
        setIsFavorite(res.data.isFavorite);
      }
    } catch (error) {
      setIsFavorite(previousState);
      console.error('Gagal memproses favorit:', error.message);
    }
  };

  const handleShare = async () => {
    try {
      if (!recipe) return;
      await Share.share({
        message: `Yuk coba buat resep "${recipe.title}" di aplikasi Cookspire! Lezat dan mudah dibuat.`,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error.message);
    }
  };

  const currentUserId = extractUserId(currentUser);
  const isOwnRecipe =
    currentUserId !== null &&
    recipe?.author_id !== undefined &&
    String(currentUserId) === String(recipe.author_id);

  const rawAuthorPhoto =
    recipe?.author_photo ||
    recipe?.author_avatar ||
    (isOwnRecipe ? extractUserPhoto(currentUser) : null);

  const authorPhoto = resolveImageUrl(rawAuthorPhoto);

  useEffect(() => {
    setAuthorImgError(false);
  }, [authorPhoto]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.text }}>Resep tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Gambar / Icon Resep */}
        <View style={styles.imageBannerContainer}>
          <View style={styles.heroCircle}>
            <RecipeThumbnail uri={recipe.icon} emojiSize={75} />
          </View>
        </View>

        {/* Info Judul & Tombol Favorit */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.categoryBadge}>{recipe.category}</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteBtn}
            activeOpacity={0.8}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Chips Meta */}
        <View style={styles.metaBadgeContainer}>
          <TouchableOpacity
            style={styles.metaBadge}
            onPress={() => navigation.navigate('Reviews', { recipeId })}
          >
            <Ionicons name="star" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>
              {Number(recipe.rating || 0).toFixed(1)} ({recipe.reviews_count || 0})
            </Text>
          </TouchableOpacity>

          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={14} color={colors.secondary} style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{recipe.time_minutes || 30} min</Text>
          </View>

          <View style={styles.metaBadge}>
            <Ionicons name="flame-outline" size={14} color={colors.secondary} style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{recipe.level || 'Mudah'}</Text>
          </View>
        </View>

        {/* Kartu Penulis Resep */}
        <TouchableOpacity
          style={styles.authorCard}
          activeOpacity={0.8}
          onPress={() => {
            if (recipe.author_id) {
              navigation.navigate('AuthorProfile', { authorId: recipe.author_id });
            }
          }}
        >
          <View style={styles.authorAvatar}>
            {authorPhoto && !authorImgError ? (
              <Image
                source={{ uri: authorPhoto }}
                style={styles.authorAvatarImage}
                resizeMode="cover"
                onError={() => setAuthorImgError(true)}
              />
            ) : (
              <Text style={styles.authorAvatarText}>
                {(recipe.author || 'A').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>
              {recipe.author} {isOwnRecipe ? '(Anda)' : ''}
            </Text>
            <Text style={styles.authorRole}>{recipe.author_role}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {['Bahan', 'Langkah', 'Ulasan'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
              onPress={() => {
                if (tab === 'Ulasan') {
                  navigation.navigate('Reviews', { recipeId });
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Bahan */}
        {activeTab === 'Bahan' && (
          <View style={styles.sectionBox}>
            {(recipe.ingredients || []).map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientQty}>{formatQty(item.qty)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab Langkah */}
        {activeTab === 'Langkah' && (
          <View style={styles.sectionBox}>
            {(recipe.steps || []).map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Reviews', { recipeId })}
        >
          <Text style={styles.primaryButtonText}>Beri Rating & Ulasan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageBannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 30,
    backgroundColor: colors.surfaceAlt,
  },
  heroCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  categoryBadge: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  favoriteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBadgeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  metaBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  authorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  authorAvatarText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 15,
  },
  authorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  authorRole: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.secondary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  sectionBox: {
    paddingHorizontal: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  ingredientName: {
    color: colors.text,
    fontSize: 14,
  },
  ingredientQty: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 15,
  },
});