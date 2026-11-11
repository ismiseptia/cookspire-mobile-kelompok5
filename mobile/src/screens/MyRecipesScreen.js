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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function MyRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ total_resep: 0, total_ulasan: 0, avg_rating: '0.0' });
  const [loading, setLoading] = useState(true);

  // Modal State untuk Konfirmasi Hapus (Figma 3.6)
  const [selectedRecipeToDelete, setSelectedRecipeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyRecipes();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyRecipes = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      const response = await API.get(`/recipes/user/${userId}`);
      setRecipes(response.data.recipes || []);
      setStats(response.data.stats || { total_resep: 0, total_ulasan: 0, avg_rating: '0.0' });
    } catch (error) {
      console.error('Error Fetch My Recipes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (item) => {
    const recipeId = item.id || item.id_resep;
    if (!recipeId) {
      console.warn('ID resep tidak ditemukan pada item:', item);
      return;
    }
    navigation.navigate('EditRecipe', { recipeId });
  };

  const handleDeleteConfirm = async () => {
    const recipeId = selectedRecipeToDelete?.id || selectedRecipeToDelete?.id_resep;
    if (!recipeId) return;
    try {
      await API.delete(`/recipes/${recipeId}`);
      setShowDeleteModal(false);
      setSelectedRecipeToDelete(null);
      fetchMyRecipes();
    } catch (error) {
      console.error('Gagal menghapus resep:', error.message);
    }
  };

  const renderRecipeCard = ({ item }) => {
    const recipeId = item.id || item.id_resep;

    return (
      <View style={styles.card}>
        {/* Kartu Utama untuk Membuka Detail Resep */}
        <TouchableOpacity
          style={styles.cardMainClick}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId })}
        >
          <View style={styles.cardImageCircle}>
            <Text style={{ fontSize: 32 }}>{item.icon || '🥘'}</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.recipeTitle}>{item.title || item.nama_resep}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={13} color="#E6A153" />
              <Text style={styles.metaText}>
                {item.rating || '0.0'} • {item.reviews_count || 0} ulasan
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tombol Aksi: Edit & Hapus */}
        <View style={styles.actionRow}>
          {/* Tombol Pensil (Edit) */}
          <TouchableOpacity 
            style={styles.iconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => handleEditRecipe(item)}
          >
            <Ionicons name="create-outline" size={20} color="#E6A153" />
          </TouchableOpacity>

          {/* Tombol Tempat Sampah (Hapus) */}
          <TouchableOpacity 
            style={styles.iconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              setSelectedRecipeToDelete(item);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Tampilan Kosong (Figma 3.4a)
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBookCircle}>
        <Text style={{ fontSize: 50 }}>📖</Text>
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={16} color="#0D3B36" />
        </View>
      </View>

      <Text style={styles.emptyTitle}>Setiap resep punya cerita. Bagikan punyamu.</Text>
      <Text style={styles.emptySubtitle}>
        Kamu belum membagikan resep. Mulai dari makanan andalanmu dan beri inspirasi untuk komunitas Cookspire.
      </Text>

      <TouchableOpacity
        style={styles.firstRecipeBtn}
        onPress={() => navigation.navigate('AddRecipe')}
      >
        <Text style={styles.firstRecipeBtnText}>+ Tambah Resep Pertama</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resep Saya</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats Header Bar */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total_resep}</Text>
          <Text style={styles.statLabel}>Resep</Text>
        </View>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statNumber}>{stats.total_ulasan}</Text>
          <Text style={styles.statLabel}>Ulasan</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.avg_rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Daftar Resep Utama */}
      {loading ? (
        <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => (item.id || item.id_resep || index).toString()}
          renderItem={renderRecipeCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Tombol Melayang Tambah Resep Baru */}
      {recipes.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.addRecipeBtn}
            onPress={() => navigation.navigate('AddRecipe')}
          >
            <Text style={styles.addRecipeBtnText}>+ Tambah Resep Baru</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Konfirmasi Hapus (Figma 3.6) */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.trashCircle}>
              <Ionicons name="trash" size={24} color="#FF6B6B" />
            </View>

            <Text style={styles.modalTitle}>Hapus resep ini?</Text>
            <Text style={styles.modalSubtitle}>
              "{selectedRecipeToDelete?.title || selectedRecipeToDelete?.nama_resep}" bakal terhapus dan komentarnya bakal terhapus permanen.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.deleteConfirmBtnText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#245D56',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardMainClick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  recipeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#B2D0CA',
    fontSize: 11,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyBookCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#B2D0CA',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  firstRecipeBtn: {
    backgroundColor: '#E6A153',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  firstRecipeBtnText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#092A27',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addRecipeBtn: {
    backgroundColor: '#E6A153',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addRecipeBtnText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#184943',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  trashCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#B2D0CA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#81A39D',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});