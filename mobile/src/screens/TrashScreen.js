import React, { useState, useCallback, useEffect } from 'react';
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
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import RecipeThumbnail from '../components/RecipeThumbnail';
import { colors } from '../theme';

const formatDeletedAt = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Riwayat resep yang dihapus: bisa dipulihkan atau dihapus permanen
export default function TrashScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchTrash = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await API.get('/recipes/trash');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Gagal memuat sampah:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    return navigation.addListener('focus', () => fetchTrash(true));
  }, [navigation, fetchTrash]);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      await API.patch(`/recipes/${item.id}/restore`);
      setItems((prev) => prev.filter((r) => r.id !== item.id));
      Alert.alert('Berhasil', `"${item.title}" sudah dipulihkan ke Resep Saya.`);
    } catch (error) {
      Alert.alert('Gagal', error.response?.data?.message || 'Resep gagal dipulihkan.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = (item) => {
    Alert.alert(
      'Hapus permanen?',
      `"${item.title}" beserta komentarnya akan dihapus selamanya dan tidak bisa dipulihkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: async () => {
            setBusyId(item.id);
            try {
              await API.delete(`/recipes/${item.id}/permanent`);
              setItems((prev) => prev.filter((r) => r.id !== item.id));
            } catch (error) {
              Alert.alert('Gagal', error.response?.data?.message || 'Resep gagal dihapus.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.thumb}>
        <RecipeThumbnail uri={item.icon} emojiSize={28} fallbackEmoji="🥘" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {item.category || 'Umum'} • dihapus {formatDeletedAt(item.deleted_at)}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.restoreBtn, busyId === item.id ? { opacity: 0.6 } : null]}
            onPress={() => handleRestore(item)}
            disabled={busyId === item.id}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={14} color={colors.surface} style={{ marginRight: 4 }} />
            <Text style={styles.restoreText}>Pulihkan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePermanentDelete(item)}
            disabled={busyId === item.id}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.permanentText}>Hapus permanen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sampah Resep</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTrash(false);
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trash-bin-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sampah kosong</Text>
              <Text style={styles.emptySub}>Resep yang kamu hapus akan muncul di sini dan bisa dipulihkan.</Text>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  list: { paddingHorizontal: 20, paddingBottom: 30, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 14,
  },
  restoreText: { color: colors.surface, fontSize: 12, fontWeight: '700' },
  permanentText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
