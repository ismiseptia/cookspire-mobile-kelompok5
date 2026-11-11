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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';

export default function PopularRecipesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Mingguan');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularRecipes();
  }, [activeTab]);

  const fetchPopularRecipes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/recipes/populer');
      setRecipes(res.data || []);
    } catch (error) {
      console.error('Error Fetch Popular:', error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={{ fontSize: 30 }}>{item.icon || '🍲'}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.authorText}>oleh {item.author || 'Chef'}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color="#E6A153" />
          <Text style={styles.metaText}>{item.rating} • {item.reviews_count} ulasan</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resep Populer</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Time Filter Tabs */}
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
        <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRankCard}
          contentContainerStyle={styles.listContent}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#184943',
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
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  tabTextActive: {
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
  rankNumber: {
    color: '#B2D0CA',
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  topRankNumber: {
    color: '#E6A153',
    fontSize: 22,
  },
  cardImageCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
});