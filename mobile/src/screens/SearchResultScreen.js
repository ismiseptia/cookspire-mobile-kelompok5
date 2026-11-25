import React, { useState, useEffect, useCallback } from 'react';
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
import RecipeThumbnail from '../components/RecipeThumbnail';
import AuthorAvatar from '../components/AuthorAvatar';
import { colors } from '../theme';

const CATEGORIES = ['Semua', 'Makanan Utama', 'Minuman', 'Dessert', 'Camilan', 'Sayuran'];

// Jenis pencarian -> nilai `type` yang dikirim ke backend
const SEARCH_TYPES = [
  { label: 'Bahan', value: 'bahan' },
  { label: 'Nama', value: 'nama' },
  { label: 'Kategori', value: 'kategori' },
];

const PLACEHOLDERS = {
  bahan: 'Bahan yang kamu punya, pisahkan koma (tempe, tahu)...',
  nama: 'Cari nama resep (misal: Soto Ayam)...',
  kategori: 'Cari kategori (misal: Minuman)...',
};

export default function SearchResultScreen({ route, navigation }) {
  const initialQuery = route.params?.query || route.params?.keyword || '';
  const initialCategory = route.params?.category || 'Semua';

  const initialType = String(route.params?.type || 'bahan').toLowerCase();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState(
    SEARCH_TYPES.some((t) => t.value === initialType) ? initialType : 'bahan'
  );
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = useCallback(
    async (keyword = searchQuery) => {
      try {
        setLoading(true);
        const response = await API.get('/recipes', {
          params: {
            search: keyword || undefined,
            type: keyword ? searchType : undefined,
            category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
          },
        });
        setRecipes(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching search results:', error.message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, searchType]
  );

  useEffect(() => {
    fetchSearchResults(searchQuery);
  }, [selectedCategory, searchType]);

  const ingredientTerms =
    searchType === 'bahan'
      ? searchQuery.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean)
      : [];

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
        <RecipeThumbnail uri={item.icon} emojiSize={26} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardCategory}>{item.category || 'Makanan'}</Text>
        <View style={styles.cardMetaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="star" size={12} color={colors.primary} style={{ marginRight: 2 }} />
            <Text style={styles.metaText}>{Number(item.rating || 0).toFixed(1)}</Text>
          </View>
          <View style={styles.authorRow}>
            <AuthorAvatar uri={item.author_photo} name={item.author} size={18} />
            <Text style={styles.authorText} numberOfLines={1}>
              {item.author || 'Pengguna'}
            </Text>
          </View>
        </View>
        {ingredientTerms.length > 1 && Number(item.matched_count) > 0 ? (
          <Text style={styles.matchText}>
            Cocok {item.matched_count} dari {ingredientTerms.length} bahan
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
                        placeholder={PLACEHOLDERS[searchType]}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchSearchResults('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Jenis pencarian: Bahan / Nama / Kategori */}
      <View style={styles.typeRow}>
        <Text style={styles.typeLabel}>Cari berdasarkan</Text>
        {SEARCH_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.typeChip, searchType === t.value ? styles.typeChipActive : null]}
            onPress={() => setSearchType(t.value)}
          >
            <Text style={[styles.typeChipText, searchType === t.value ? styles.typeChipTextActive : null]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 44, marginTop: 10 }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategory === item ? styles.chipActive : null]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.chipText, selectedCategory === item ? styles.chipTextActive : null]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Resep tidak ditemukan.</Text>
          <Text style={styles.emptySubText}>
            {searchType === 'bahan'
              ? 'Coba kurangi bahan atau gunakan nama bahan yang lebih umum.'
              : 'Coba kata kunci atau kategori lain.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 34,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.secondary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.surface,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardCategory: {
    color: colors.secondary,
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
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: 10,
  },
  authorText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 5,
    flexShrink: 1,
  },
  matchText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  typeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginRight: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    marginRight: 6,
  },
  typeChipActive: {
    backgroundColor: colors.secondary,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: colors.surface,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});