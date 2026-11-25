import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function AddRecipeSuccessScreen({ route, navigation }) {
  const { recipeId, title, category, icon } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Circle Success Icon */}
        <View style={styles.checkCircleBg}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={54} color={colors.surface} />
          </View>
        </View>

        <Text style={styles.title}>Resep Berhasil Diunggah!</Text>
        <Text style={styles.subtitle}>
          Resepmu kini dapat dilihat dan dicoba oleh pengguna lain di komunitas Cookspire.
        </Text>

        {/* Recipe Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.cardIconCircle}>
            <Text style={{ fontSize: 32 }}>{icon || '🥘'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title || 'Nasi Goreng Kampung'}</Text>
            <Text style={styles.cardMeta}>{category || 'Makanan Utama'} • 25 min</Text>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.whiteButton}
          onPress={() => navigation.replace('RecipeDetail', { recipeId })}
        >
          <Text style={styles.whiteButtonText}>Lihat Resep</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
        >
          <Text style={styles.outlineButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkCircleBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    width: '100%',
  },
  cardIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  whiteButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  whiteButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});