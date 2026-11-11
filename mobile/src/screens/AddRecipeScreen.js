import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

const EMOJI_OPTIONS = ['🥘', '🍲', '🧆', '🥤', '🍳', '🥗', '🍞', '🍰'];
const CATEGORY_OPTIONS = [
  { id: 1, name: 'Makanan Utama' },
  { id: 2, name: 'Minuman' },
  { id: 3, name: 'Dessert' },
  { id: 4, name: 'Camilan' },
  { id: 5, name: 'Sayuran' },
];

export default function AddRecipeScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Informasi & Bahan, 2: Langkah Pembuatan

  // Form State
  const [imageUri, setImageUri] = useState(null); // URI foto galeri
  const [selectedEmoji, setSelectedEmoji] = useState('🥘');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [ingredients, setIngredients] = useState([
    { name: '', jumlah: '', satuan: '' },
  ]);
  const [steps, setSteps] = useState(['']);
  const [loading, setLoading] = useState(false);

  // Pick Image from Gallery
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Izin Ditolak',
        'Aplikasi memerlukan izin akses galeri untuk memilih foto resep.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Dynamic Handlers for Ingredients
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', jumlah: '', satuan: '' }]);
  };

  const handleUpdateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Dynamic Handlers for Steps
  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleUpdateStep = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleRemoveStep = (index) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Submit Handler to Backend
  const handleSubmitRecipe = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Nama resep harus diisi.');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      Alert.alert('Perhatian', 'Isi minimal 1 bahan memasak.');
      return;
    }

    const validSteps = steps.filter((st) => st.trim() !== '');
    if (validSteps.length === 0) {
      Alert.alert('Perhatian', 'Isi minimal 1 langkah pembuatan.');
      return;
    }

    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('userData');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const userId = user.id_user || user.id || 1;

      // Utamakan foto galeri (imageUri), jika kosong gunakan emoji
      const photoPayload = imageUri || selectedEmoji;

      const payload = {
        id_user: userId,
        nama_resep: title,
        id_kategori: categoryId,
        foto: photoPayload,
        ingredients: validIngredients,
        steps: validSteps,
      };

      const response = await API.post('/recipes', payload);

      if (response.data.success || response.data.id_resep) {
        navigation.replace('AddRecipeSuccess', {
          recipeId: response.data.id_resep,
          title,
          category: CATEGORY_OPTIONS.find((c) => c.id === categoryId)?.name || 'Makanan Utama',
          icon: photoPayload,
        });
      }
    } catch (error) {
      console.error('Error Submit Recipe:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengunggah resep.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (currentStep === 2) setCurrentStep(1);
            else navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Resep</Text>
        <Text style={styles.stepIndicator}>{currentStep}/2</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 ? (
          /* STEP 1: INFORMASI UTAMA & BAHAN */
          <>
            {/* Foto Galeri / Pick Emoji Header */}
            <Text style={styles.label}>Foto Resep</Text>
            <View style={styles.imagePickerBox}>
              {imageUri ? (
                /* Pratinjau Foto Galeri */
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close-circle" size={26} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Pratinjau Emoji */
                <View style={styles.heroCircle}>
                  <Text style={{ fontSize: 50 }}>{selectedEmoji}</Text>
                </View>
              )}

              {/* Tombol Akses Galeri */}
              <TouchableOpacity
                style={styles.galleryButton}
                activeOpacity={0.8}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={18} color="#0D3B36" style={{ marginRight: 6 }} />
                <Text style={styles.galleryButtonText}>
                  {imageUri ? 'Ganti Foto Galeri' : 'Pilih Foto dari Galeri'}
                </Text>
              </TouchableOpacity>

              {/* Opsi Pilihan Emoji (*Fallback*) */}
              <Text style={styles.subLabel}>Atau Pilih Emoji Resep:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiChip,
                      !imageUri && selectedEmoji === emoji ? styles.emojiChipActive : null,
                    ]}
                    onPress={() => {
                      setImageUri(null); // Reset foto galeri jika memilih emoji
                      setSelectedEmoji(emoji);
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Nama Resep Input */}
            <Text style={styles.label}>Nama Resep</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan nama resep (misal: Nasi Goreng)"
                placeholderTextColor="#81A39D"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Kategori Selector */}
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catOption,
                    categoryId === cat.id ? styles.catOptionActive : null,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.catOptionText,
                      categoryId === cat.id ? styles.catOptionTextActive : null,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* List Bahan-Bahan */}
            <Text style={styles.label}>Bahan-bahan</Text>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 2, marginRight: 6 }]}
                  placeholder="Nama Bahan"
                  placeholderTextColor="#81A39D"
                  value={ing.name}
                  onChangeText={(val) => handleUpdateIngredient(idx, 'name', val)}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Jumlah"
                  placeholderTextColor="#81A39D"
                  keyboardType="numeric"
                  value={ing.jumlah}
                  onChangeText={(val) => handleUpdateIngredient(idx, 'jumlah', val)}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 6 }]}
                  placeholder="Satuan"
                  placeholderTextColor="#81A39D"
                  value={ing.satuan}
                  onChangeText={(val) => handleUpdateIngredient(idx, 'satuan', val)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                    <Ionicons name="close-circle" size={22} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddIngredient}>
              <Ionicons name="add" size={18} color="#E6A153" style={{ marginRight: 6 }} />
              <Text style={styles.addBtnOutlineText}>Tambah Bahan</Text>
            </TouchableOpacity>

            {/* Navigation Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (!title.trim()) Alert.alert('Perhatian', 'Isi nama resep terlebih dahulu.');
                else setCurrentStep(2);
              }}
            >
              <Text style={styles.primaryButtonText}>Lanjut ke Langkah</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* STEP 2: LANGKAH PEMBUATAN */
          <>
            <Text style={styles.sectionHeaderTitle}>Langkah Pembuatan</Text>

            {steps.map((stepText, idx) => (
              <View key={idx} style={styles.stepInputCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={styles.stepTextInput}
                  placeholder={`Tulis langkah ke-${idx + 1}...`}
                  placeholderTextColor="#81A39D"
                  multiline
                  value={stepText}
                  onChangeText={(val) => handleUpdateStep(idx, val)}
                />
                {steps.length > 1 && (
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-start', marginLeft: 6 }}
                    onPress={() => handleRemoveStep(idx)}
                  >
                    <Ionicons name="close" size={20} color="#81A39D" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddStep}>
              <Ionicons name="add" size={18} color="#E6A153" style={{ marginRight: 6 }} />
              <Text style={styles.addBtnOutlineText}>Tambah Langkah</Text>
            </TouchableOpacity>

            {/* Final Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#E6A153', marginTop: 24 }]}
              onPress={handleSubmitRecipe}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0D3B36" />
              ) : (
                <Text style={styles.primaryButtonText}>Unggah Resep</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  stepIndicator: {
    color: '#E6A153',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imagePickerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#245D56',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: 140,
    height: 100,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0D3B36',
    borderRadius: 13,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6A153',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  galleryButtonText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subLabel: {
    color: '#B2D0CA',
    fontSize: 11,
    marginBottom: 4,
  },
  emojiChip: {
    padding: 8,
    backgroundColor: '#184943',
    borderRadius: 12,
    marginRight: 8,
  },
  emojiChipActive: {
    backgroundColor: '#E6A153',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#184943',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catOption: {
    backgroundColor: '#184943',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  catOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  catOptionText: {
    color: '#B2D0CA',
    fontSize: 12,
  },
  catOptionTextActive: {
    color: '#0D3B36',
    fontWeight: 'bold',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6A153',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  addBtnOutlineText: {
    color: '#E6A153',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepInputCard: {
    flexDirection: 'row',
    backgroundColor: '#184943',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 40,
  },
});