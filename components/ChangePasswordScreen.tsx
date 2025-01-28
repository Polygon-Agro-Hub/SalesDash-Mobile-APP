import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { LinearGradient } from 'expo-linear-gradient'; 
import Icon from 'react-native-vector-icons/Ionicons'; 

type ChangePasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChangePasswordScreen'
>;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Top Section with Background Vector Image */}
      <ImageBackground
        source={require('../assets/images/g16.png')} // Replace with your vector image path
        className="h-64 items-center"
        resizeMode="cover"
      >
        {/* Overlay Image */}
        <Image
          source={require('../assets/images/updatepsw.png')} // Replace with your overlay image path
          className="w-64 h-64"
          resizeMode="contain"
        />
      </ImageBackground>

      {/* Form Section */}
      <View className=" flex-1">
        <LinearGradient
          colors={['#854BDA', '#6E3DD1']} // Gradient colors
          className="flex-1 rounded-t-3xl px-7 pt-6 pb-14"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text className="text-white text-lg font-bold text-center mb-6">
              Change Your Password
            </Text>

            {/* Current Password */}
            <View className="bg-purple-500 rounded-full flex-row items-center px-4 mb-4">
              <TextInput
                placeholder="Current Password"
                placeholderTextColor="#E5E5E5"
                className="flex-1 text-white py-3"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View className="bg-purple-500 rounded-full flex-row items-center px-4 mb-4">
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#E5E5E5"
                className="flex-1 text-white py-3"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Icon
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View className="bg-purple-500 rounded-full flex-row items-center px-4 mb-6">
              <TextInput
                placeholder="Confirm New Password"
                placeholderTextColor="#E5E5E5"
                className="flex-1 text-white py-3"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              className="bg-white rounded-full py-3 px-10 self-center"
              onPress={() => navigation.navigate('LoginScreen')} // Example action, replace as needed
            >
              <Text className="text-purple-600 font-bold text-lg">Update</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;
