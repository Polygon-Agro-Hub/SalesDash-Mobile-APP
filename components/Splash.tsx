import { View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient'; 
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types'; 

type SplashNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashProps {
  navigation: SplashNavigationProp;
}

const Splash: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {

    const timer = setTimeout(() => {
      navigation.navigate('LoginScreen');
    }, 5000);


    return () => clearTimeout(timer);
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
