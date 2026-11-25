import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import { colors } from '../theme';

const resolveUserId = async () => {
  const storedUser = await AsyncStorage.getItem('userData');
  if (!storedUser) return null;
  const parsed = JSON.parse(storedUser);
  return parsed.id_user ?? parsed.id ?? parsed.user?.id_user ?? parsed.user?.id ?? null;
};

export default function MyRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ total_resep: 0, total_ulasan: 0, avg_rating: '0.0' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRecipeToDelete, setSelectedRecipeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchMyRecipes = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const userId = await resolveUserId();
      if (!userId) {
        setRecipes([]);
        return;
      }

      const response = await API.get(`/recipes/user/${userId}`);
      setRecipes(response.data?.recipes || []);
      setStats(response.data?.stats || { total_resep: 0, total_ulasan: 0, avg_rating: '0.0' });
    } catch (error) {
      console.error('Error Fetch My Recipes:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyRecipes(true);
    });
    return unsubscribe;
  }, [navigation, fetchMyRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyRecipes(false);
  }, [fetchMyRecipes]);

  const handleEditRecipe = (item) => {
    const recipeId = item.id || item.id_resep;
    if (!recipeId) return;
    navigation.navigate('EditRecipe', { recipeId });
  };

  const handleDeleteConfirm = async () => {
    const recipeId = selectedRecipeToDelete?.id || selectedRecipeToDelete?.id_resep;
    if (!recipeId) return;
    try {
      await API.delete(`/recipes/${recipeId}`);
      setShowDeleteModal(false);
      setSelectedRecipeToDelete(null);
      fetchMyRecipes(false);
    } catch (error) {
      console.error('Gagal menghapus resep:', error.message);
    }
  };

  const renderRecipeCard = ({ item }) => {
    const recipeId = item.id || item.id_resep;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMainClick}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId })}
        >
          <View style={styles.cardImageCircle}>
            <RecipeThumbnail uri={item.icon} emojiSize={32} fallbackEmoji="🥘" />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {item.title || item.nama_resep}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={13} color={colors.primary} />
              <Text style={styles.metaText}>
                {Number(item.rating || 0).toFixed(1)} • {item.reviews_count || 0} ulasan
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => handleEditRecipe(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              setSelectedRecipeToDelete(item);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBookCircle}>
        <Text style={{ fontSize: 50 }}>📖</Text>
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={16} color={colors.surface} />
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resep Saya</Text>
        <View style={{ width: 36 }} />
      </View>

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

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => String(item.id || item.id_resep || index)}
          renderItem={renderRecipeCard}
          ListEmptyComponent={renderEmptyState}
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
        />
      )}

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

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.trashCircle}>
              <Ionicons name="trash" size={24} color={colors.danger} />
            </View>

            <Text style={styles.modalTitle}>Hapus resep ini?</Text>
            <Text style={styles.modalSubtitle}>
              "{selectedRecipeToDelete?.title || selectedRecipeToDelete?.nama_resep}" akan dipindahkan ke Sampah dan bisa dipulihkan kapan saja dari menu Profil.
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
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
    borderColor: colors.surfaceAlt,
  },
  statNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  recipeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  firstRecipeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  firstRecipeBtnText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addRecipeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addRecipeBtnText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'colors.overlay',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  trashCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'colors.dangerSoft',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: colors.textSecondary,
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
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: 'bold',
  },
});