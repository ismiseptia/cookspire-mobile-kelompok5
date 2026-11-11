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

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Bahan');
  const [recentSearches, setRecentSearches] = useState([
    'Soto ayam',
    'Pisang goreng',
    'Sambal terasi',
  ]);

  const popularIngredients = [
    'Tempe', 'Tahu', 'Ayam', 'Telur',
    'Cabai', 'Bawang Putih', 'Kecap'
  ];

  const categories = [
  { title: 'Makanan Utama', icon: '🍲' },
  { title: 'Minuman', icon: '🥤' },
  { title: 'Camilan', icon: '🧆' },
  { title: 'Dessert', icon: '🍰' },
  { title: 'Sayuran', icon: '🥗' },
];

  const handlePerformSearch = (queryToSearch = searchQuery, type = searchType) => {
    const trimmedQuery = queryToSearch.trim();
    if (!trimmedQuery) return;

    if (!recentSearches.includes(trimmedQuery)) {
      setRecentSearches([trimmedQuery, ...recentSearches.slice(0, 4)]);
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
    return 'Cari berdasarkan bahan (misal: Tempe)...';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <Text style={styles.headerTitle}>Cari Resep</Text>

        {/* Search Bar Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#81A39D" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={getPlaceholderText()}
            placeholderTextColor="#81A39D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => handlePerformSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#81A39D" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filter Tipe Pencarian */}
        <View style={styles.tabContainer}>
          {['Nama', 'Kategori', 'Bahan'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tabButton,
                searchType === type ? styles.tabButtonActive : null,
              ]}
              onPress={() => setSearchType(type)}
            >
              <Text
                style={[
                  styles.tabText,
                  searchType === type ? styles.tabTextActive : null,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Bahan Populer */}
        <Text style={styles.sectionTitle}>Bahan Populer</Text>
        <View style={styles.chipGrid}>
          {popularIngredients.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.chip}
              onPress={() => handlePerformSearch(item, 'Bahan')}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Pencarian Terakhir */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Pencarian Terakhir</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearText}>Hapus</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map((item, index) => (
              <View key={index} style={styles.recentRow}>
                <TouchableOpacity
                  style={styles.recentItemLeft}
                  onPress={() => handlePerformSearch(item, searchType)}
                >
                  <Ionicons name="time-outline" size={16} color="#81A39D" style={{ marginRight: 12 }} />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveRecent(item)}>
                  <Ionicons name="close" size={16} color="#81A39D" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Section Jelajahi Kategori */}
        <Text style={styles.sectionTitle}>Jelajahi Kategori</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
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
    backgroundColor: '#0D3B36',
    // Penyesuaian batas atas dari jam HP
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#184943',
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
  sectionTitle: {
    color: '#FFFFFF',
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
    backgroundColor: '#184943',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 10,
  },
  chipText: {
    color: '#FFFFFF',
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
    color: '#E6A153',
    fontSize: 12,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#184943',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentText: {
    color: '#B2D0CA',
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#184943',
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
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryCardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});