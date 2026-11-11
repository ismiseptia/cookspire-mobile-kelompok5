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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Camilan', "Dessert", "Sayuran"];

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [userName, setUserName] = useState('Pengguna');
  const [recipes, setRecipes] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Memuat Data Profil User dari AsyncStorage
  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const name = user.nama || user.name;
        if (name) setUserName(name);
      }
    } catch (error) {
      console.error('Gagal memuat profil pengguna:', error.message);
    }
  };

  // Memuat Data Resep dari Backend API
  const fetchRecipes = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = selectedCategory !== 'Semua' ? { category: selectedCategory } : {};
      const response = await API.get('/recipes', { params });

      const data = response.data || [];
      setRecipes(data);
      setFeaturedRecipe(data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Gagal memuat resep:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    fetchRecipes(true);
  }, [selectedCategory]);

  // Listener untuk memperbarui data otomatis saat layar dipfokuskan kembali
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      fetchRecipes(false);
    });
    return unsubscribe;
  }, [navigation, selectedCategory]);

  // Handler Pull-to-Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
    fetchRecipes(false);
  }, [selectedCategory]);

  const initialLetter = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E6A153"
            colors={['#E6A153']}
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
              <Text style={styles.avatarText}>{initialLetter}</Text>
            </View>
            <View>
              <Text style={styles.greetingTitle}>Halo, {userName}</Text>
              <Text style={styles.greetingSubtitle}>Mau masak apa hari ini?</Text>
            </View>
          </TouchableOpacity>

          {/* Tombol Lonceng Notifikasi */}
          <TouchableOpacity
            style={styles.notifButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Trigger */}
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Cari')}
        >
          <Ionicons name="search-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <Text style={styles.searchPlaceholder}>Cari resep, kategori, bahan...</Text>
          <View style={styles.filterBadge}>
            <Ionicons name="options-outline" size={16} color="#0D3B36" />
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
                  <Ionicons name="star" size={14} color="#E6A153" />
                  <Text style={styles.ratingText}>
                    {featuredRecipe.rating || '0.0'}{' '}
                    <Text style={styles.ratingCount}>
                      ({featuredRecipe.reviews_count || 0} ulasan)
                    </Text>
                  </Text>
                </View>
                <View style={styles.buttonDetail}>
                  <Text style={styles.buttonDetailText}>Lihat Resep</Text>
                </View>
              </View>
              <View style={styles.featuredImageCircle}>
                <Text style={{ fontSize: 38 }}>{featuredRecipe.icon || '🍲'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Horizontal Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
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
          <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 35 }} />
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
                  <Text style={{ fontSize: 30 }}>{item.icon || '🍲'}</Text>
                </View>
                <Text style={styles.recipeCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="star" size={12} color="#E6A153" />
                  <Text style={styles.cardMetaText}>
                    {item.rating || '0.0'} • {item.time_minutes || 30} min
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
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
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
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  greetingSubtitle: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#81A39D',
    fontSize: 13,
  },
  filterBadge: {
    backgroundColor: '#E6A153',
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
    color: '#E6A153',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  featuredCard: {
    backgroundColor: '#184943',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ratingCount: {
    color: '#B2D0CA',
    fontWeight: 'normal',
  },
  buttonDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  buttonDetailText: {
    color: '#0D3B36',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredImageCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryChip: {
    backgroundColor: '#184943',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    color: '#B2D0CA',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#E6A153',
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  cardImageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  recipeCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaText: {
    color: '#B2D0CA',
    fontSize: 11,
    marginLeft: 4,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#B2D0CA',
    fontSize: 13,
  },
});