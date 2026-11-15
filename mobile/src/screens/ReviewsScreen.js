import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function ReviewsScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const inputRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, [recipeId]);

  const getStoredUserId = async () => {
    const storedUser = await AsyncStorage.getItem('userData');
    const parsedUser = storedUser ? JSON.parse(storedUser) : {};
    return (
      parsedUser.id_user ??
      parsedUser.id ??
      parsedUser.user?.id_user ??
      parsedUser.user?.id ??
      null
    );
  };

  const initializeScreen = async () => {
    try {
      const userId = await getStoredUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Gagal membaca sesi pengguna:', error.message);
    }
    await fetchReviews();
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/recipes/${recipeId}/reviews`);
      setReviews(res.data || []);
    } catch (error) {
      console.error('Gagal memuat ulasan:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingReviewId(item.id);
    setRating(Number(item.rating) || 5);
    setComment(item.comment || '');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(0);
    setComment('');
  };

  const handleSubmitReview = async () => {
    if (rating === 0 && !comment.trim()) {
      Alert.alert('Perhatian', 'Pilih bintang rating atau tulis komentar terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      const userId = currentUserId ?? (await getStoredUserId());

      if (!userId) {
        Alert.alert('Perhatian', 'Data akun tidak ditemukan. Silakan login ulang.');
        return;
      }

      const payload = {
        id_user: userId,
        rating: rating || 5,
        comment: comment.trim(),
      };

      if (editingReviewId) {
        await API.put(`/recipes/${recipeId}/reviews/${editingReviewId}`, payload);
        setEditingReviewId(null);
      } else {
        await API.post(`/recipes/${recipeId}/reviews`, payload);
      }

      setComment('');
      setRating(0);
      await fetchReviews();
    } catch (error) {
      console.error('Gagal menyimpan ulasan:', error.message);
      Alert.alert(
        'Gagal',
        error.response?.data?.message || 'Terjadi kesalahan saat menyimpan ulasan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderReviewItem = ({ item }) => {
    const isMyReview =
      currentUserId !== null &&
      item.id_user !== undefined &&
      item.id_user !== null &&
      String(item.id_user) === String(currentUserId);

    const isCurrentlyEditing = editingReviewId === item.id;

    return (
      <View style={[styles.reviewCard, isCurrentlyEditing && styles.reviewCardEditing]}>
        <View style={styles.reviewHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(item.author || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? 'star' : 'star-outline'}
                size={14}
                color="#E6A153"
                style={{ marginLeft: 2 }}
              />
            ))}
          </View>
          {isMyReview && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleStartEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color="#E6A153" />
            </TouchableOpacity>
          )}
        </View>
        {item.comment ? <Text style={styles.commentText}>{item.comment}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ulasan & Rating</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Kotak Beri / Edit Rating */}
        <View style={styles.ratingBox}>
          <Text style={styles.ratingPrompt}>
            {editingReviewId ? 'Edit rating untuk resep ini' : 'Beri rating untuk resep ini'}
          </Text>
          <View style={styles.ratingStarsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                onPress={() => setRating(star)}
                style={{ marginHorizontal: 6 }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={30}
                  color="#E6A153"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Komentar ({reviews.length})</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#E6A153" />
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Belum ada ulasan untuk resep ini.</Text>
            }
          />
        )}

        {/* Banner Mode Edit */}
        {editingReviewId !== null && (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>Sedang mengedit ulasan Anda</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.cancelEditText}>Batal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Komentar Bawah */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder={editingReviewId ? 'Ubah komentar Anda...' : 'Tulis komentar...'}
            placeholderTextColor="#81A39D"
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#0D3B36" />
            ) : (
              <Ionicons
                name={editingReviewId ? 'checkmark' : 'send'}
                size={18}
                color="#0D3B36"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
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
  ratingBox: {
    backgroundColor: '#184943',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingPrompt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  reviewCard: {
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  reviewCardEditing: {
    borderWidth: 1,
    borderColor: '#E6A153',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#245D56',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
  },
  editBtn: {
    marginLeft: 10,
    padding: 2,
  },
  commentText: {
    color: '#B2D0CA',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#81A39D',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#184943',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#245D56',
  },
  editBannerText: {
    color: '#E6A153',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelEditText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#092A27',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#184943',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#184943',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    marginRight: 10,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
  },
});