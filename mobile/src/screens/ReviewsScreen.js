import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function ReviewsScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId || 1;
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [recipeId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/recipes/${recipeId}/reviews`);
      setReviewsList(res.data);
    } catch (error) {
      console.error('Gagal memuat ulasan:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const authorName = user.nama || user.name || 'Pengguna';

      await API.post(`/recipes/${recipeId}/reviews`, {
        author: authorName,
        rating: userRating || 5,
        comment: commentText,
      });

      setCommentText('');
      setUserRating(0);
      fetchReviews();
    } catch (error) {
      console.error('Gagal mengirim ulasan:', error.message);
    }
  };

  const renderReviewCard = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(item.author || 'P').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{item.author}</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={12}
              color="#E6A153"
            />
          ))}
        </View>
      </View>
      <Text style={styles.commentBody}>{item.comment}</Text>
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
        <Text style={styles.headerTitle}>Ulasan & Rating</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#E6A153" style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={reviewsList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReviewCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Interactive Rating Box */}
                <View style={styles.giveRatingBox}>
                  <Text style={styles.giveRatingTitle}>Beri rating untuk resep ini</Text>
                  <View style={styles.giveStarRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                        <Ionicons
                          name={star <= userRating ? 'star' : 'star-outline'}
                          size={28}
                          color="#E6A153"
                          style={{ marginHorizontal: 4 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Komentar ({reviewsList.length})</Text>
              </>
            }
          />
        )}

        {/* Bottom Comment Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Tulis komentar..."
            placeholderTextColor="#81A39D"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleAddComment}>
            <Ionicons name="send" size={18} color="#0D3B36" />
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  giveRatingBox: {
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  giveRatingTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  giveStarRow: {
    flexDirection: 'row',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#184943',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  starsRow: {
    flexDirection: 'row',
  },
  commentBody: {
    color: '#B2D0CA',
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#092A27',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#184943',
  },
  input: {
    flex: 1,
    backgroundColor: '#184943',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    marginRight: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
  },
});