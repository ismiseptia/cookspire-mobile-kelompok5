import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { resolveImageUrl } from '../services/api';
import { colors } from '../theme';

const extractUserId = (userObj) => {
  if (!userObj) return null;
  return (
    userObj.id_user ??
    userObj.id ??
    userObj.user?.id_user ??
    userObj.user?.id ??
    null
  );
};

const extractUserPhoto = (userObj) => {
  if (!userObj) return null;
  return (
    userObj.foto ||
    userObj.avatar ||
    userObj.photoUri ||
    userObj.user?.foto ||
    userObj.user?.avatar ||
    null
  );
};

function ReviewerAvatar({ uri, name, isAuthor }) {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = resolveImageUrl(uri);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUri]);

  return (
    <View style={[styles.avatarCircle, isAuthor && styles.avatarCircleOwner]}>
      {resolvedUri && !hasError ? (
        <Image
          source={{ uri: resolvedUri }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <Text style={styles.avatarText}>
          {(name || 'U').charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

export default function ReviewsScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;
  const initialAuthorId = route.params?.authorId ?? null;
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

  const topPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 0, 28) + 10
      : Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, 12);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [recipeAuthorId, setRecipeAuthorId] = useState(initialAuthorId);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userId = extractUserId(parsedUser);
      setCurrentUserId(userId);
      setCurrentUserPhoto(extractUserPhoto(parsedUser));

      if (userId) {
        const res = await API.get(`/auth/user/profile/${userId}`).catch(() => null);
        if (res?.data?.user?.foto) {
          setCurrentUserPhoto(res.data.user.foto);
        }
      }

      return userId;
    } catch (error) {
      console.error('Gagal membaca sesi pengguna:', error.message);
      return null;
    }
  }, []);

  const fetchReviewsAndAuthor = useCallback(
    async (showLoader = true) => {
      if (!recipeId) return;
      if (showLoader) setLoading(true);
      try {
        const [reviewsRes, detailRes] = await Promise.all([
          API.get(`/recipes/${recipeId}/reviews`),
          API.get(`/recipes/${recipeId}`).catch(() => null),
        ]);

        const reviewList = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
        setReviews(reviewList);

        if (detailRes?.data?.author_id !== undefined && detailRes?.data?.author_id !== null) {
          setRecipeAuthorId(detailRes.data.author_id);
        } else {
          const authorReview = reviewList.find(
            (r) => r.recipe_author_id !== undefined && r.recipe_author_id !== null
          );
          if (authorReview) {
            setRecipeAuthorId(authorReview.recipe_author_id);
          }
        }
      } catch (error) {
        console.error('Gagal memuat ulasan:', error.message);
      } finally {
        setLoading(false);
      }
    },
    [recipeId]
  );

  useEffect(() => {
    loadStoredUser();
    fetchReviewsAndAuthor(true);
  }, [loadStoredUser, fetchReviewsAndAuthor]);

  const isRecipeOwner =
    currentUserId !== null &&
    recipeAuthorId !== null &&
    String(currentUserId) === String(recipeAuthorId);

  const handleStartEdit = (item, isAuthorItem) => {
    setEditingReviewId(item.id);
    setRating(isAuthorItem ? 0 : Number(item.rating) || 5);
    setComment(item.comment || '');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Hapus komentar: pemilik komentar atau pembuat resep
  const handleDeleteReview = (item) => {
    Alert.alert('Hapus komentar?', 'Komentar ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/recipes/${recipeId}/reviews/${item.id}`);
            if (editingReviewId === item.id) handleCancelEdit();
            await fetchReviewsAndAuthor(false);
          } catch (error) {
            Alert.alert('Gagal', error.response?.data?.message || 'Komentar gagal dihapus.');
          }
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(0);
    setComment('');
  };

  const handleSubmitReview = async () => {
    if (isRecipeOwner) {
      if (!comment.trim()) {
        Alert.alert('Perhatian', 'Tulis balasan atau catatan terlebih dahulu.');
        return;
      }
    } else if (rating === 0 && !comment.trim()) {
      Alert.alert('Perhatian', 'Pilih bintang rating atau tulis komentar terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      const userId = currentUserId ?? (await loadStoredUser());

      if (!userId) {
        Alert.alert('Perhatian', 'Data akun tidak ditemukan. Silakan login ulang.');
        return;
      }

      const payload = {
        id_user: userId,
        rating: isRecipeOwner ? null : rating || 5,
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
      await fetchReviewsAndAuthor(false);
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

    const isAuthorComment =
      item.is_author === 1 ||
      item.is_author === true ||
      (recipeAuthorId !== null &&
        item.id_user !== undefined &&
        item.id_user !== null &&
        String(item.id_user) === String(recipeAuthorId));

    const numericRating = Number(item.rating || 0);
    const showStars = !isAuthorComment && numericRating > 0;
    const isCurrentlyEditing = editingReviewId === item.id;
    const avatarPhoto = isMyReview
      ? currentUserPhoto || item.author_photo
      : item.author_photo || null;

    return (
      <View
        style={[
          styles.reviewCard,
          isAuthorComment && styles.reviewCardOwner,
          isCurrentlyEditing && styles.reviewCardEditing,
        ]}
      >
        <View style={styles.reviewHeader}>
          <ReviewerAvatar
            uri={avatarPhoto}
            name={item.author}
            isAuthor={isAuthorComment}
          />

          <View style={styles.authorNameRow}>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.author}
            </Text>
            {isAuthorComment && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Pembuat</Text>
              </View>
            )}
          </View>

          {showStars && (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= numericRating ? 'star' : 'star-outline'}
                  size={14}
                  color={colors.primary}
                  style={{ marginLeft: 2 }}
                />
              ))}
            </View>
          )}

          {isMyReview && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleStartEdit(item, isAuthorComment)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {(isMyReview || isRecipeOwner) && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleDeleteReview(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>

        {item.comment ? <Text style={styles.commentText}>{item.comment}</Text> : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ulasan & Rating</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Kotak Beri Rating (Khusus Pengunjung) atau Info Pembuat */}
        {isRecipeOwner ? (
          <View style={styles.ownerInfoBox}>
            <Ionicons name="ribbon-outline" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.ownerInfoText}>
              Komentar Anda akan ditandai dengan label{' '}
              <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>Pembuat</Text>
            </Text>
          </View>
        ) : (
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
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Komentar ({reviews.length})</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
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
            <Text style={styles.editBannerText}>Sedang mengedit komentar Anda</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.cancelEditText}>Batal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Komentar Bawah */}
        <View style={[styles.inputBar, { paddingBottom: bottomPadding }]}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder={
              editingReviewId
                ? 'Ubah komentar Anda...'
                : isRecipeOwner
                ? 'Tulis balasan sebagai pembuat resep...'
                : 'Tulis komentar...'
            }
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons
                name={editingReviewId ? 'checkmark' : 'send'}
                size={18}
                color={colors.surface}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  ratingBox: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingPrompt: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  ownerInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  reviewCardOwner: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  reviewCardEditing: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarCircleOwner: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 13,
  },
  authorNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  authorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  ownerBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },
  ownerBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
  },
  editBtn: {
    marginLeft: 10,
    padding: 2,
  },
  commentText: {
    color: colors.textSecondary,
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
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  editBannerText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelEditText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    marginRight: 10,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});