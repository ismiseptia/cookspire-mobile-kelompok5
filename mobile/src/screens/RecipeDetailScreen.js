import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

// Helper format kuantitas bahan agar tidak ada desimal berlebih (misal 100.00000 -> 100)
const formatQty = (qtyStr) => {
  if (!qtyStr) return '';
  return qtyStr.toString().replace(/\b\d+\.\d+\b/g, (match) => {
    const num = parseFloat(match);
    return isNaN(num) ? match : num.toString();
  });
};

export default function RecipeDetailScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const [activeTab, setActiveTab] = useState('Bahan');
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipeDetail();
    checkFavoriteStatus();
  }, [recipeId]);

  // 1. Ambil Detail Resep dari Backend
  const fetchRecipeDetail = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/recipes/${recipeId}`);
      setRecipe(res.data);
    } catch (error) {
      console.error('Gagal mengambil detail resep:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cek Apakah Resep Ini Sudah Ditinggalkan Hati/Favorit oleh User
  const checkFavoriteStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      const res = await API.get(`/recipes/favorites/${userId}`);
      const favs = res.data || [];
      const isFav = favs.some((item) => item.id.toString() === recipeId.toString());
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Error check favorite status:', error.message);
    }
  };

  // 3. Simpan / Hapus Favorit ke MySQL Backend
  const handleToggleFavorite = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      const res = await API.post('/recipes/favorites/toggle', {
        id_user: userId,
        id_resep: recipeId,
      });

      if (res.data && res.data.isFavorite !== undefined) {
        setIsFavorite(res.data.isFavorite);
      } else {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Gagal memproses favorit:', error.message);
    }
  };

  // 4. Memicu Dialog Berbagi Bawaan Perangkat (Native Share)
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E6A153" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF' }}>Resep tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner Gambar / Icon */}
        <View style={styles.imageBannerContainer}>
          <View style={styles.heroCircle}>
            <Text style={{ fontSize: 75 }}>{recipe.icon || '🍲'}</Text>
          </View>
        </View>

        {/* Info Judul & Tombol Favorit */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
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
              color={isFavorite ? '#FF6B6B' : '#E6A153'}
            />
          </TouchableOpacity>
        </View>

        {/* Chips Meta */}
        <View style={styles.metaBadgeContainer}>
          <TouchableOpacity 
            style={styles.metaBadge}
            onPress={() => navigation.navigate('Reviews', { recipeId })}
          >
            <Ionicons name="star" size={14} color="#E6A153" style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{recipe.rating} ({recipe.reviews_count})</Text>
          </TouchableOpacity>

          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={14} color="#B2D0CA" style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{recipe.time_minutes} min</Text>
          </View>

          <View style={styles.metaBadge}>
            <Ionicons name="flame-outline" size={14} color="#B2D0CA" style={{ marginRight: 4 }} />
            <Text style={styles.metaBadgeText}>{recipe.level}</Text>
          </View>
        </View>

        {/* Penulis Resep (Dapat Ditekan untuk Membuka Profil Pembuat) */}
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
            <Text style={styles.authorAvatarText}>
              {(recipe.author || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{recipe.author}</Text>
            <Text style={styles.authorRole}>{recipe.author_role}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#81A39D" />
        </TouchableOpacity>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {['Bahan', 'Langkah', 'Ulasan'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab ? styles.tabButtonActive : null,
              ]}
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
            {recipe.ingredients.map((item, index) => (
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
            {recipe.steps.map((step, index) => (
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
    backgroundColor: '#0D3B36',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 73, 67, 0.8)',
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
    backgroundColor: '#092A27',
  },
  heroCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#245D56',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  recipeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  categoryBadge: {
    color: '#E6A153',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  favoriteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#184943',
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
    backgroundColor: '#184943',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  metaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  authorRole: {
    color: '#B2D0CA',
    fontSize: 11,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#184943',
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
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#B2D0CA',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0D3B36',
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
    borderBottomColor: '#184943',
  },
  ingredientName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  ingredientQty: {
    color: '#B2D0CA',
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
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#092A27',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#184943',
  },
  primaryButton: {
    backgroundColor: '#E6A153',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
});