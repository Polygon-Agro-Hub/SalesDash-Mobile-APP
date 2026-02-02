import { View, Image, Alert } from 'react-native';
import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/types';
import environment from "@/environment/environment";

type SplashNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashProps {
  navigation: SplashNavigationProp;
}

const Splash: React.FC<SplashProps> = ({ navigation }) => {
  
  // Function to check password update status
  const checkPasswordUpdateStatus = async (authToken: string) => {
  try {
    const response = await fetch(`${environment.API_BASE_URL}api/auth/user/password-update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Explicitly ask for JSON response
      }
    });

    // First check the response content type
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response:', textResponse);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();

    if (response.ok && data.success) {
      if (data.data.passwordUpdate === 1) {
        navigation.navigate("Main", { screen: 'DashboardScreen' });
      } else {
        await AsyncStorage.multiRemove([
          "authToken",
          "tokenStoredTime",
          "tokenExpirationTime",
        ]);
        navigation.navigate('LoginScreen');
      }
    } else {
      await AsyncStorage.multiRemove([
        "authToken",
        "tokenStoredTime",
        "tokenExpirationTime",
      ]);
      navigation.navigate('LoginScreen');
    }
  } catch (error) {
    console.error('Error checking password status:', error);
    await AsyncStorage.multiRemove([
      "authToken",
      "tokenStoredTime",
      "tokenExpirationTime",
    ]);
    navigation.navigate('LoginScreen');
  }
};

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Check if auth token exists
        const authToken = await AsyncStorage.getItem('authToken');
        const expirationTime = await AsyncStorage.getItem("tokenExpirationTime");
        
        // Timer to navigate after 3 seconds
        setTimeout(async() => {
          if (expirationTime && authToken) {
            const currentTime = new Date();
            const tokenExpiry = new Date(expirationTime);
    
            if (currentTime < tokenExpiry) {
              await checkPasswordUpdateStatus(authToken);
            } else {
              await AsyncStorage.multiRemove([
                "authToken",
                "tokenStoredTime",
                "tokenExpirationTime",
              ]);
              navigation.navigate('LoginScreen');
            }
          } else {
            navigation.navigate('LoginScreen');
          }
        }, 3000);
      } catch (error) {
        console.error('Error checking authentication token:', error);
        // If there's an error, navigate to login as fallback
        setTimeout(() => {
          navigation.navigate('LoginScreen');
        }, 3000);
      }
    };
    
    checkToken();
  }, [navigation]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#854BDA', '#6E3DD1']} 
        style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }} 
      />
      {/* Background Image */}
      <Image
        source={require('../../assets/images/splash.webp')}
        className="absolute w-full h-full"
        resizeMode="cover"
      />
      {/* Logo and App Name */}
      <View className="flex-1 justify-center items-center">
        <Image
          source={require('../../assets/images/lgooo.webp')}
          className="w-60 h-60"
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default Splash;