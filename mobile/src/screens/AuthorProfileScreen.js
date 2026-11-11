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

export default function AuthorProfileScreen({ route, navigation }) {
  const authorId = route.params?.authorId || 1;
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthorProfile();
  }, [authorId]);

  const fetchAuthorProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/recipes/user-profile/${authorId}`);
      setProfileData(res.data);
    } catch (error) {
      console.error('Error Fetch Author Profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E6A153" />
      </View>
    );
  }

  const user = profileData?.user || {};
  const stats = profileData?.stats || {};
  const recipes = profileData?.recipes || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Pembuat</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            {/* Header User */}
            <View style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>{(user.nama || 'A').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{user.nama || 'Ayu Rahma'}</Text>
              <Text style={styles.userBio}>Suka masak masakan rumahan • Member Cookspire</Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total_resep || 0}</Text>
                <Text style={styles.statLabel}>Resep</Text>
              </View>
              <View style={[styles.statBox, styles.statBorder]}>
                <Text style={styles.statNumber}>{stats.avg_rating || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total_favorit || 0}</Text>
                <Text style={styles.statLabel}>Disukai</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Resep dari {user.nama || 'Penulis'}</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
          >
            <View style={styles.cardImageCircle}>
              <Text style={{ fontSize: 32 }}>{item.icon || '🥘'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryBadge}>{item.category}</Text>
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color="#E6A153" />
                <Text style={styles.metaText}>{item.rating} • {item.reviews_count} ulasan</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileCard: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 30,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userBio: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
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
    color: '#E6A153',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B2D0CA',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recipeCard: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: '#B2D0CA',
    fontSize: 11,
    marginLeft: 4,
  },
});