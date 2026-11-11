import React, { useState, useEffect } from 'react';
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
import API from '../services/api';

const EMOJI_OPTIONS = ['🥘', '🍲', '🧆', '🥤', '🍳', '🥗', '🍞', '🍰'];
const CATEGORY_OPTIONS = [
  { id: 1, name: 'Makanan Utama' },
  { id: 2, name: 'Minuman' },
  { id: 3, name: 'Dessert' },
  { id: 4, name: 'Camilan' },
  { id: 5, name: 'Sayuran' },
];

export default function EditRecipeScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [imageUri, setImageUri] = useState(null); // State simpan URI foto dari galeri
  const [selectedEmoji, setSelectedEmoji] = useState('🥘');
  const [ingredients, setIngredients] = useState([
    { name: '', jumlah: '', satuan: '' },
  ]);
  const [steps, setSteps] = useState(['']);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recipeId) {
      fetchExistingRecipe();
    }
  }, [recipeId]);

  // Load Data Resep Lama dari Backend
  const fetchExistingRecipe = async () => {
    try {
      setFetching(true);
      const res = await API.get(`/recipes/${recipeId}`);
      const data = res.data;

      setTitle(data.title || '');
      
      // Tentukan kategori ID
      const foundCat = CATEGORY_OPTIONS.find(
        (c) => c.name.toLowerCase() === (data.category || '').toLowerCase()
      );
      setCategoryId(foundCat ? foundCat.id : 1);

      // Cek apakah foto berbentuk URL/File URI atau emoji
      const photo = data.icon || data.foto || '🥘';
      if (photo.startsWith('file:') || photo.startsWith('http') || photo.startsWith('data:')) {
        setImageUri(photo);
      } else {
        setSelectedEmoji(photo);
      }

      // Format data bahan jika ada
      if (data.ingredients && data.ingredients.length > 0) {
        const formattedIngs = data.ingredients.map((ing) => ({
          name: ing.name || ing.nama_bahan || '',
          jumlah: ing.jumlah || ing.qty ? ing.qty.split(' ')[0] : '',
          satuan: ing.satuan || ing.qty ? ing.qty.split(' ').slice(1).join(' ') : '',
        }));
        setIngredients(formattedIngs);
      }

      // Format langkah jika ada
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
      }
    } catch (error) {
      console.error('Gagal mengambil data resep:', error.message);
      Alert.alert('Gagal', 'Tidak dapat memuat data resep.');
    } finally {
      setFetching(false);
    }
  };

  // Panggil Galeri HP
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

  // Dynamic Handlers Bahan
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

  // Dynamic Handlers Langkah
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

  // Simpan Perubahan Resep ke Backend
  const handleSaveRecipe = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Nama resep tidak boleh kosong.');
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
      setSaving(true);

      const photoPayload = imageUri || selectedEmoji;

      const payload = {
        nama_resep: title.trim(),
        id_kategori: categoryId,
        foto: photoPayload,
        ingredients: validIngredients,
        steps: validSteps,
      };

      const response = await API.put(`/recipes/${recipeId}`, payload);

      if (response.data.success) {
        Alert.alert('Sukses', 'Resep berhasil diperbarui!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error Update Recipe:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memperbarui resep.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E6A153" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Resep</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* FOTO RESEP / PICKER */}
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

          {/* Fallback Pilihan Emoji */}
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
                  setImageUri(null);
                  setSelectedEmoji(emoji);
                }}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nama Resep */}
        <Text style={styles.label}>Nama Resep</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Masukkan nama resep"
            placeholderTextColor="#81A39D"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Kategori */}
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

        {/* Langkah Pembuatan */}
        <Text style={styles.label}>Langkah Pembuatan</Text>
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

        {/* Tombol Simpan Perubahan */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#E6A153', marginTop: 24 }]}
          onPress={handleSaveRecipe}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#0D3B36" />
          ) : (
            <Text style={styles.primaryButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
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