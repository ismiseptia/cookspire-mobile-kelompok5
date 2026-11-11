import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Dessert', 'Camilan', 'Sayuran'];

export default function SearchResultScreen({ route, navigation }) {
  const initialQuery = route.params?.query || route.params?.keyword || '';
  const initialCategory = route.params?.category || 'Semua';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchResults();
  }, [selectedCategory]);

  // Mengambil hasil pencarian dari Backend
  const fetchSearchResults = async (keyword = searchQuery) => {
    try {
      setLoading(true);
      const response = await API.get('/recipes', {
        params: {
          search: keyword,
          category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
        },
      });
      setRecipes(response.data || []);
    } catch (error) {
      console.error('Error fetching search results:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    fetchSearchResults(searchQuery);
  };

  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      <View style={styles.cardIconContainer}>
        <Text style={styles.cardIcon}>{item.icon || '🍲'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardCategory}>{item.category || 'Makanan'}</Text>
        <View style={styles.cardMetaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="star" size={12} color="#E6A153" style={{ marginRight: 2 }} />
            <Text style={styles.metaText}>{item.rating || '0.0'}</Text>
          </View>
          <Text style={styles.authorText}>oleh {item.author || 'Pengguna'}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#81A39D" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header Bar Search */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#81A39D" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari resep makanan..."
            placeholderTextColor="#81A39D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchSearchResults(''); }}>
              <Ionicons name="close-circle" size={18} color="#81A39D" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori Filter Chips */}
      <View style={{ height: 44, marginTop: 10 }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedCategory === item ? styles.chipActive : null,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === item ? styles.chipTextActive : null,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List Hasil Pencarian */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E6A153" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color="#81A39D" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Resep tidak ditemukan.</Text>
          <Text style={styles.emptySubText}>Coba kata kunci atau kategori lain.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecipeCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  chip: {
    backgroundColor: '#184943',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 34,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#E6A153',
  },
  chipText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D3B36',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardCategory: {
    color: '#E6A153',
    fontSize: 11,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  authorText: {
    color: '#B2D0CA',
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#B2D0CA',
    fontSize: 12,
    marginTop: 4,
  },
});