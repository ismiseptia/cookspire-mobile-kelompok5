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
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function NotificationScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      const res = await API.get(`/recipes/notifications/${userId}`);
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Error Fetch Notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifs = notifications.filter((item) => {
    if (selectedFilter === 'Komentar') return item.tipe === 'komentar';
    if (selectedFilter === 'Rating') return item.tipe === 'rating';
    return true;
  });

  const renderNotifCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id_resep })}
    >
      <View style={styles.iconCircle}>
        <Ionicons
          name={item.tipe === 'komentar' ? 'chatbubble-ellipses' : 'star'}
          size={20}
          color="#E6A153"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.notifText}>
          <Text style={styles.authorBold}>{item.pengirim_nama} </Text>
          {item.tipe === 'komentar'
            ? `mengomentari resepmu "${item.nama_resep}"`
            : `memberi rating pada resep "${item.nama_resep}"`}
        </Text>
        <Text style={styles.timeText}>Baru saja</Text>
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
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['Semua', 'Komentar', 'Rating'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, selectedFilter === f ? styles.filterChipActive : null]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text style={[styles.filterText, selectedFilter === f ? styles.filterTextActive : null]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredNotifs}
          keyExtractor={(item, index) => (item.id || index).toString()}
          renderItem={renderNotifCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={44} color="#81A39D" />
              <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#184943',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#E6A153',
  },
  filterText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifText: {
    color: '#B2D0CA',
    fontSize: 12,
    lineHeight: 16,
  },
  authorBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#81A39D',
    fontSize: 10,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#B2D0CA',
    fontSize: 13,
    marginTop: 8,
  },
});