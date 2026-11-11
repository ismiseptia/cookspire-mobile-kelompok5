import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';

const slides = [
  {
    id: 1,
    icon: '🍲',
    title: 'Bagikan Resep Favoritmu',
    desc: 'Unggah resep buatanmu sendiri beserta foto dan langkah-langkahnya untuk komunitas.',
  },
  {
    id: 2,
    icon: '⭐',
    title: 'Temukan Resep Terpercaya',
    desc: 'Cari resep berkualitas berdasarkan rating dan ulasan dari pengguna lain.',
  },
  {
    id: 3,
    icon: '👨‍🍳',
    title: 'Masak Bersama Komunitas',
    desc: 'Berinteraksi lewat komentar, simpan resep favorit, dan inspirasi menu harian.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B36" />

      <View style={styles.content}>
        
        {/* Gambar / Ilustrasi Icon */}
        <View style={styles.imageCircle}>
          <Text style={{ fontSize: 60 }}>{slides[currentIndex].icon}</Text>
        </View>

        {/* Teks Judul & Deskripsi */}
        <Text style={styles.title}>{slides[currentIndex].title}</Text>
        <Text style={styles.desc}>{slides[currentIndex].desc}</Text>

        {/* Pagination Indicator */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Tombol Lanjut / Mulai */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
          </Text>
        </TouchableOpacity>

        {/* Tombol Lewati di Bawah Tombol Lanjut */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B36',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#184943',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#E6A153',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    color: '#B2D0CA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#E6A153',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#245D56',
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0D3B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#E6A153',
    fontSize: 14,
    fontWeight: '600',
  },
});