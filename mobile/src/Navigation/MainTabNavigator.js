import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoriteRecipesScreen from '../screens/FavoriteRecipesScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Dummy component khusus untuk slot tombol Tambah di Bottom Bar
const DummyComponent = () => null;

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#092A27',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E6A153',
        tabBarInactiveTintColor: '#81A39D',
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Beranda') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Cari') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favorit') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Cari" component={SearchScreen} />

      {/* Tombol Melayang Tambah Resep (Tengah) */}
      <Tab.Screen
        name="Tambah"
        component={DummyComponent}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.addBtnContainer}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddRecipe')}
            >
              <View style={styles.addBtn}>
                <Ionicons name="add" size={28} color="#0D3B36" />
              </View>
            </TouchableOpacity>
          ),
        })}
      />

      <Tab.Screen name="Favorit" component={FavoriteRecipesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  addBtnContainer: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6A153',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});