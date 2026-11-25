import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setUnauthorizedHandler } from './src/services/api';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ResetPasswordSuccessScreen from './src/screens/ResetPasswordSuccessScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import SearchResultScreen from './src/screens/SearchResultScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';
import AddRecipeScreen from './src/screens/AddRecipeScreen';
import AddRecipeSuccessScreen from './src/screens/AddRecipeSuccessScreen';
import MyRecipesScreen from './src/screens/MyRecipesScreen';
import TrashScreen from './src/screens/TrashScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';
import PopularRecipesScreen from './src/screens/PopularRecipesScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import AuthorProfileScreen from './src/screens/AuthorProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Sesi berakhir (JWT kedaluwarsa) -> kembali ke Login
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      Alert.alert('Sesi Berakhir', message || 'Silakan login kembali.');
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Gagal mengambil token:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={userToken ? 'MainTab' : 'Splash'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetPasswordSuccess" component={ResetPasswordSuccessScreen} />

        {/* Main Tab */}
        <Stack.Screen name="MainTab" component={MainTabNavigator} />

        {/* Recipe & Profile Screens */}
        <Stack.Screen name="SearchResult" component={SearchResultScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
        <Stack.Screen name="EditRecipe" component={EditRecipeScreen} />
        <Stack.Screen name="AddRecipeSuccess" component={AddRecipeSuccessScreen} />
        <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
        <Stack.Screen name="Trash" component={TrashScreen} />
        <Stack.Screen name="PopularRecipes" component={PopularRecipesScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="AuthorProfile" component={AuthorProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}