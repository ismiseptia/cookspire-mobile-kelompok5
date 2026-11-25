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
import AuthorAvatar from '../components/AuthorAvatar';

// Waktu relatif: "Baru saja", "5 menit lalu", "2 hari lalu"
const timeAgo = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
  return date.toLocaleDateString('id-ID');
};
import { colors } from '../theme';

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
      // User diambil server dari token JWT (dikirim otomatis oleh interceptor API)
      const res = await API.get('/recipes/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error Fetch Notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch('/recipes/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, sudah_dibaca: 1 })));
    } catch (error) {
      console.error('Gagal menandai dibaca:', error.message);
    }
  };

  const openNotification = async (item) => {
    if (!item.sudah_dibaca) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, sudah_dibaca: 1 } : n)));
      API.patch(`/recipes/notifications/${item.id}/read`).catch(() => {});
    }
    navigation.navigate('RecipeDetail', { recipeId: item.id_resep });
  };

  const unreadCount = notifications.filter((n) => !n.sudah_dibaca).length;

  const filteredNotifs = notifications.filter((item) => {
    if (selectedFilter === 'Komentar') return item.tipe === 'komentar';
    if (selectedFilter === 'Rating') return item.tipe === 'rating';
    return true;
  });

  const renderNotifCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.sudah_dibaca ? styles.cardUnread : null]}
      activeOpacity={0.8}
      onPress={() => openNotification(item)}
    >
      <AuthorAvatar uri={item.pengirim_foto} name={item.pengirim_nama} size={40} style={{ marginRight: 12 }} />

      <View style={{ flex: 1 }}>
        <Text style={styles.notifText}>
          <Text style={styles.authorBold}>{item.pengirim_nama} </Text>
          {item.tipe === 'komentar'
            ? `mengomentari resepmu "${item.nama_resep}"`
            : `memberi rating pada resep "${item.nama_resep}"`}
        </Text>
        <Text style={styles.timeText}>{timeAgo(item.tanggal)}</Text>
      </View>
      {!item.sudah_dibaca && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0} style={{ width: 36, alignItems: 'flex-end' }}>
          <Ionicons name="checkmark-done" size={22} color={unreadCount === 0 ? colors.textMuted : colors.secondary} />
        </TouchableOpacity>
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
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredNotifs}
          keyExtractor={(item, index) => (item.id || index).toString()}
          renderItem={renderNotifCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={44} color={colors.textMuted} />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  cardUnread: {
    backgroundColor: colors.primarySoft,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  authorBold: {
    color: colors.text,
    fontWeight: 'bold',
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
});