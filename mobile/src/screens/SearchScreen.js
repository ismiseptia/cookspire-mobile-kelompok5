import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const POPULAR_INGREDIENTS = [
  'Tempe',
  'Tahu',
  'Ayam',
  'Telur',
  'Cabai',
  'Bawang Putih',
  'Kecap',
];

const CATEGORIES = [
  { title: 'Makanan Utama', icon: '🍛' },
  { title: 'Minuman', icon: '🥤' },
  { title: 'Camilan', icon: '🍟' },
  { title: 'Dessert', icon: '🍰' },
  { title: 'Sayuran', icon: '🥬' },
];

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Bahan');
  const [recentSearches, setRecentSearches] = useState([
    'Soto ayam',
    'Pisang goreng',
    'Sambal terasi',
  ]);

  const handlePerformSearch = (queryToSearch = searchQuery, type = searchType) => {
    const trimmedQuery = queryToSearch.trim();
    if (!trimmedQuery) return;

    if (!recentSearches.includes(trimmedQuery)) {
      setRecentSearches([trimmedQuery, ...recentSearches.slice(0, 4)]);
    }

    if (type === 'Kategori') {
      navigation.navigate('SearchResult', {
        query: '',
        category: trimmedQuery,
        type,
      });
      return;
    }

    navigation.navigate('SearchResult', { query: trimmedQuery, type });
  };

  const handleRemoveRecent = (itemToRemove) => {
    setRecentSearches(recentSearches.filter((item) => item !== itemToRemove));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  const getPlaceholderText = () => {
    if (searchType === 'Nama') return 'Cari nama resep (misal: Soto Ayam)...';
    if (searchType === 'Kategori') return 'Cari kategori (misal: Makanan Utama)...';
    return 'Bahan yang kamu punya (misal: tempe, tahu)...';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Cari Resep</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={getPlaceholderText()}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => handlePerformSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {searchType === 'Bahan' && (
          <Text style={styles.hintText}>
            Ketik beberapa bahan dipisah koma, misalnya <Text style={styles.hintBold}>tempe, tahu, cabai</Text>.
            Resep yang paling banyak cocok tampil paling atas.
          </Text>
        )}

        <View style={styles.tabContainer}>
          {['Nama', 'Kategori', 'Bahan'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tabButton, searchType === type ? styles.tabButtonActive : null]}
              onPress={() => setSearchType(type)}
            >
              <Text style={[styles.tabText, searchType === type ? styles.tabTextActive : null]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bahan Populer</Text>
        <View style={styles.chipGrid}>
          {POPULAR_INGREDIENTS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => handlePerformSearch(item, 'Bahan')}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Pencarian Terakhir</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearText}>Hapus</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map((item) => (
              <View key={item} style={styles.recentRow}>
                <TouchableOpacity
                  style={styles.recentItemLeft}
                  onPress={() => handlePerformSearch(item, searchType)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} style={{ marginRight: 12 }} />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveRecent(item)}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Jelajahi Kategori</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.title}
              style={styles.categoryCard}
              onPress={() => handlePerformSearch(cat.title, 'Kategori')}
            >
              <View style={styles.categoryCircle}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryCardText}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 16,
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  hintBold: {
    color: colors.secondary,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
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
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 10,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: colors.primary,
    fontSize: 12,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryCardText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});