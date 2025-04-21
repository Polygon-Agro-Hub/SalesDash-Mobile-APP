import { View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';

type SplashNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashProps {
  navigation: SplashNavigationProp;
}

const Splash: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Check if auth token exists
        const authToken = await AsyncStorage.getItem('authToken');
        
        // Timer to navigate after 5 seconds
        setTimeout(() => {
          // If token exists, navigate to Dashboard, otherwise to Login
          if (authToken) {
            navigation.navigate("Main", { screen: 'DashboardScreen' });
          } else {
            navigation.navigate('LoginScreen');
          }
        }, 5000);
      } catch (error) {
        console.error('Error checking authentication token:', error);
        // If there's an error, navigate to login as fallback
        setTimeout(() => {
          navigation.navigate('LoginScreen');
        }, 5000);
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
        source={require('../assets/images/splash.png')}
        className="absolute w-full h-full"
        resizeMode="cover"
      />
      {/* Logo and App Name */}
      <View className="flex-1 justify-center items-center">
        <Image
          source={require('../assets/images/lgooo.png')}
          className="w-60 h-60"
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default Splash;