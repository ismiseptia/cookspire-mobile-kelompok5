import React, { useState, useEffect, useCallback } from 'react';
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
import API, { resolveImageUrl, uploadImageAsset } from '../services/api';
import { colors } from '../theme';

const EMOJI_OPTIONS = ['🥘', '🍲', '🧆', '🥤', '🍳', '🥗', '🍞', '🍰'];
const CATEGORY_OPTIONS = [
  { id: 1, name: 'Makanan Utama' },
  { id: 2, name: 'Minuman' },
  { id: 3, name: 'Dessert' },
  { id: 4, name: 'Camilan' },
  { id: 5, name: 'Sayuran' },
];
const DIFFICULTY_OPTIONS = ['Mudah', 'Sedang', 'Sulit'];
const TIME_PRESETS = ['15', '30', '45', '60'];

export default function EditRecipeScreen({ route, navigation }) {
  const recipeId = route.params?.recipeId;

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [cookingTime, setCookingTime] = useState('30');
  const [difficulty, setDifficulty] = useState('Mudah');
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState('🥘');
  const [ingredients, setIngredients] = useState([
    { name: '', jumlah: '', satuan: '' },
  ]);
  const [steps, setSteps] = useState(['']);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchExistingRecipe = useCallback(async () => {
    if (!recipeId) return;
    try {
      setFetching(true);
      const res = await API.get(`/recipes/${recipeId}`);
      const data = res.data;

      setTitle(data.title || '');

      const foundCat = CATEGORY_OPTIONS.find(
        (c) => c.name.toLowerCase() === (data.category || '').toLowerCase()
      );
      setCategoryId(foundCat ? foundCat.id : 1);

      const existingTime = data.time_minutes ?? data.waktu_memasak ?? 30;
      setCookingTime(String(existingTime));

      const existingLevel = data.level ?? data.tingkat_kesulitan ?? 'Mudah';
      const matchedLevel =
        DIFFICULTY_OPTIONS.find((l) => l.toLowerCase() === String(existingLevel).toLowerCase()) ||
        'Mudah';
      setDifficulty(matchedLevel);

      const photo = data.icon || data.foto || '🥘';
      if (
        photo.startsWith('/uploads/') ||
        photo.startsWith('uploads/') ||
        photo.startsWith('file:') ||
        photo.startsWith('content:') ||
        photo.startsWith('http') ||
        photo.startsWith('data:')
      ) {
        setImageUri(photo);
        setImageBase64(null);
      } else {
        setImageUri(null);
        setImageBase64(null);
        setSelectedEmoji(photo);
      }

      if (data.ingredients && data.ingredients.length > 0) {
        const formattedIngs = data.ingredients.map((ing) => ({
          name: ing.name || ing.nama_bahan || '',
          jumlah:
            ing.jumlah !== undefined && ing.jumlah !== null
              ? String(ing.jumlah)
              : ing.qty
              ? String(ing.qty).split(' ')[0]
              : '',
          satuan:
            ing.satuan !== undefined && ing.satuan !== null
              ? String(ing.satuan)
              : ing.qty
              ? String(ing.qty).split(' ').slice(1).join(' ')
              : '',
        }));
        setIngredients(formattedIngs);
      }

      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
      }
    } catch (error) {
      console.error('Gagal mengambil data resep:', error.message);
      Alert.alert('Gagal', 'Tidak dapat memuat data resep.');
    } finally {
      setFetching(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchExistingRecipe();
  }, [fetchExistingRecipe]);

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
      mediaTypes: ImagePicker.MediaTypeOptions?.Images || ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
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

    const parsedTime = parseInt(cookingTime, 10);
    if (!Number.isFinite(parsedTime) || parsedTime <= 0) {
      Alert.alert('Perhatian', 'Waktu memasak harus lebih dari 0 menit.');
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

      let photoPayload = selectedEmoji;
      if (imageUri) {
        photoPayload = imageBase64
          ? await uploadImageAsset(imageUri, imageBase64, 'recipe')
          : imageUri;
      }

      const payload = {
        nama_resep: title.trim(),
        id_kategori: categoryId,
        foto: photoPayload,
        waktu_memasak: parsedTime,
        tingkat_kesulitan: difficulty,
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
      Alert.alert(
        'Gagal',
        error.response?.data?.message || 'Terjadi kesalahan saat memperbarui resep.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resolvedPreviewUri = resolveImageUrl(imageUri);

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Resep</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FOTO RESEP / PICKER */}
        <Text style={styles.label}>Foto Resep</Text>
        <View style={styles.imagePickerBox}>
          {resolvedPreviewUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: resolvedPreviewUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Ionicons name="close-circle" size={26} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.heroCircle}>
              <Text style={{ fontSize: 50 }}>{selectedEmoji}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.galleryButton}
            activeOpacity={0.8}
            onPress={handlePickImage}
          >
            <Ionicons name="image-outline" size={18} color={colors.surface} style={{ marginRight: 6 }} />
            <Text style={styles.galleryButtonText}>
              {resolvedPreviewUri ? 'Ganti Foto Galeri' : 'Pilih Foto dari Galeri'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.subLabel}>Atau Pilih Emoji Resep:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiChip,
                  !resolvedPreviewUri && selectedEmoji === emoji ? styles.emojiChipActive : null,
                ]}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
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
            placeholderTextColor={colors.textMuted}
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

        {/* Waktu Memasak */}
        <Text style={styles.label}>Waktu Memasak (Menit)</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeInputWrapper}>
            <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.timeInput}
              placeholder="30"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              value={cookingTime}
              onChangeText={(val) => setCookingTime(val.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.timeUnitText}>menit</Text>
          </View>

          <View style={styles.presetRow}>
            {TIME_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  cookingTime === preset ? styles.presetChipActive : null,
                ]}
                onPress={() => setCookingTime(preset)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    cookingTime === preset ? styles.presetChipTextActive : null,
                  ]}
                >
                  {preset}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tingkat Kesulitan */}
        <Text style={styles.label}>Tingkat Kesulitan</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.difficultyOption,
                difficulty === lvl ? styles.difficultyOptionActive : null,
              ]}
              onPress={() => setDifficulty(lvl)}
            >
              <Ionicons
                name="flame-outline"
                size={15}
                color={difficulty === lvl ? colors.surface : colors.textSecondary}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === lvl ? styles.difficultyTextActive : null,
                ]}
              >
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List Bahan-Bahan */}
        <Text style={styles.label}>Bahan-bahan</Text>
        {ingredients.map((ing, idx) => (
          <View key={idx} style={styles.ingredientInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 2, marginRight: 6 }]}
              placeholder="Nama Bahan"
              placeholderTextColor={colors.textMuted}
              value={ing.name}
              onChangeText={(val) => handleUpdateIngredient(idx, 'name', val)}
            />
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 6 }]}
              placeholder="Jumlah"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={ing.jumlah}
              onChangeText={(val) => handleUpdateIngredient(idx, 'jumlah', val)}
            />
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 6 }]}
              placeholder="Satuan"
              placeholderTextColor={colors.textMuted}
              value={ing.satuan}
              onChangeText={(val) => handleUpdateIngredient(idx, 'satuan', val)}
            />
            {ingredients.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddIngredient}>
          <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
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
              placeholderTextColor={colors.textMuted}
              multiline
              value={stepText}
              onChangeText={(val) => handleUpdateStep(idx, val)}
            />
            {steps.length > 1 && (
              <TouchableOpacity
                style={{ alignSelf: 'flex-start', marginLeft: 6 }}
                onPress={() => handleRemoveStep(idx)}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addBtnOutline} onPress={handleAddStep}>
          <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnOutlineText}>Tambah Langkah</Text>
        </TouchableOpacity>

        {/* Tombol Simpan Perubahan */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 24 }]}
          onPress={handleSaveRecipe}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} />
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
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 12,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
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
    backgroundColor: colors.background,
    borderRadius: 13,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  galleryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 12,
  },
  subLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  emojiChip: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 8,
  },
  emojiChipActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  catOption: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  catOptionActive: {
    backgroundColor: colors.secondary,
  },
  catOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  catOptionTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginRight: 8,
  },
  timeInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeUnitText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  presetRow: {
    flexDirection: 'row',
  },
  presetChip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  difficultyOptionActive: {
    backgroundColor: colors.primary,
  },
  difficultyText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyTextActive: {
    color: colors.surface,
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
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  addBtnOutlineText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepInputCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepTextInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    minHeight: 40,
  },
});