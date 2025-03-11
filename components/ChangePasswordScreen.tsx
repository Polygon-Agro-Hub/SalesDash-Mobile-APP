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
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import environment from '@/environment/environment';

// Navigation type
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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle password update
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    setLoading(true);

    try {
      // Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Unauthorized access, please login again');
        navigation.replace('LoginScreen');
        return;
      }

      // Make API request to update password
      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user/update-password`,
        { oldPassword: currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Password updated successfully', [
          { text: 'OK', onPress: () => navigation.replace('LoginScreen') },
        ]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        (axios.isAxiosError(error) && error.response?.data?.error) || 'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Top Section with Background Vector Image */}
      <ImageBackground
        source={require('../assets/images/g16.png')}
        className="h-64 items-center"
        resizeMode="cover"
      >
        <Image
          source={require('../assets/images/updatepsw.png')}
          className="w-64 h-64"
          resizeMode="contain"
        />
      </ImageBackground>

      {/* Form Section */}
      <View className="flex-1">
        <LinearGradient colors={['#854BDA', '#6E3DD1']} className="flex-1 rounded-t-3xl px-7 pt-6 pb-14">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
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
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#E5E5E5" />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View className="bg-purple-500 rounded-full flex-row items-center px-4 mb-4">
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#E5E5E5"
                className="flex-1 text-white py-3"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#E5E5E5" />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View className="bg-purple-500 rounded-full flex-row items-center px-4 mb-6">
              <TextInput
                placeholder="Confirm New Password"
                placeholderTextColor="#E5E5E5"
                className="flex-1 text-white py-3"
                secureTextEntry={!showConfirmPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#E5E5E5" />
              </TouchableOpacity>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              className="bg-white rounded-full py-3 px-10 self-center"
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text className="text-purple-600 font-bold text-lg">
                {loading ? 'Updating...' : 'Update'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;
