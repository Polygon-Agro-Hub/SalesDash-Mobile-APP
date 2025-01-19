import { View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types'; // Adjust the import path as needed

type SplashNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashProps {
  navigation: SplashNavigationProp;
}

const Splash: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    // Timer to navigate after 5 seconds
    const timer = setTimeout(() => {
      navigation.navigate('ChangePasswordScreen');
    }, 5000);

    // Cleanup function to clear the timer
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1">
      {/* Linear Gradient Background */}
      <LinearGradient
        colors={['#854BDA', '#6E3DD1']} // Gradient colors
        style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }} // Fullscreen gradient
      />

      {/* Background Image */}
      <Image
        source={require('../assets/images/splash.png')} // Replace with the correct path to your background image
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* Logo and App Name */}
      <View className="flex-1 justify-center items-center">
        <Image
          source={require('../assets/images/lgooo.png')} // Replace with the correct path to your logo image
          className="w-60 h-60" // Increased size for the logo
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default Splash;
