import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Camilan'];

export default function FavoriteRecipesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });
    return unsubscribe;
  }, [navigation, selectedCategory]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      const params = selectedCategory !== 'Semua' ? { category: selectedCategory } : {};
      const response = await API.get(`/recipes/favorites/${userId}`, { params });
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error Fetch Favorites:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (recipeId) => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      await API.post('/recipes/favorites/toggle', {
        id_user: userId,
        id_resep: recipeId,
      });

      fetchFavorites();
    } catch (error) {
      console.error('Gagal menghapus favorit:', error.message);
    }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      <View style={styles.cardImageCircle}>
        <Text style={{ fontSize: 32 }}>{item.icon || '🥘'}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.categoryBadge}>{item.category}</Text>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.authorText}>oleh {item.author}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color="#E6A153" />
          <Text style={styles.metaText}>{item.rating} • {item.reviews_count} ulasan</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Ionicons name="heart" size={22} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <Text style={styles.headerTitle}>Resep Favorit</Text>

      {/* Banner Informasi Offline/Tersimpan */}
      <View style={styles.infoBanner}>
        <Ionicons name="bookmark" size={20} color="#E6A153" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>Semua resep favorit tersimpan</Text>
          <Text style={styles.infoBannerSubtitle}>Akses cepat kapan saja saat ingin memasak.</Text>
        </View>
      </View>

      {/* Filter Kategori */}
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

      {/* Main Favorite List */}
      {loading ? (
        <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="heart-dislike-outline" size={48} color="#81A39D" />
              <Text style={styles.emptyTitle}>Belum Ada Resep Favorit</Text>
              <Text style={styles.emptySubtitle}>Tekan tombol hati pada resep favoritmu untuk menyimpannya di sini.</Text>
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
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  infoBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoBannerSubtitle: {
    color: '#B2D0CA',
    fontSize: 11,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxHeight: 40,
  },
  categoryChip: {
    backgroundColor: '#184943',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#E6A153',
  },
  categoryText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  categoryTextActive: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardImageCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  categoryBadge: {
    color: '#E6A153',
    fontSize: 10,
    fontWeight: '600',
  },
  recipeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorText: {
    color: '#B2D0CA',
    fontSize: 11,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
  },
  favoriteBtn: {
    padding: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#B2D0CA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});