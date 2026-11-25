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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import AuthorAvatar from '../components/AuthorAvatar';
import { colors } from '../theme';

export default function PopularRecipesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Mingguan');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPopularRecipes = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await API.get('/recipes/populer');
      setRecipes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error Fetch Popular:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularRecipes(true);
  }, [activeTab, fetchPopularRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPopularRecipes(false);
  }, [fetchPopularRecipes]);

  const renderRankCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      <Text style={[styles.rankNumber, index < 3 ? styles.topRankNumber : null]}>
        {index + 1}
      </Text>

      <View style={styles.cardImageCircle}>
        <RecipeThumbnail uri={item.icon} emojiSize={30} />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.authorRow}>
          <AuthorAvatar uri={item.author_photo} name={item.author} size={18} />
          <Text style={styles.authorText} numberOfLines={1}>
            {item.author || 'Chef'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.primary} />
          <Text style={styles.metaText}>
            {Number(item.rating || 0).toFixed(1)} • {item.reviews_count || 0} ulasan
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resep Populer</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabContainer}>
        {['Mingguan', 'Bulanan', 'Semua'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab ? styles.tabBtnActive : null]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRankCard}
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
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Belum ada resep populer tersedia.</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: colors.secondary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  rankNumber: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  topRankNumber: {
    color: colors.primary,
    fontSize: 22,
  },
  cardImageCircle: {
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
  recipeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 5,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.text,
    fontSize: 11,
    marginLeft: 4,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});