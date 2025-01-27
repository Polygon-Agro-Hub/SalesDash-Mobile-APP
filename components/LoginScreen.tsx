import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types"; // Replace with the path to your types file
import Icon from "react-native-vector-icons/Ionicons"; // For the eye icon in the password field
import { LinearGradient } from "expo-linear-gradient"; // Gradient background
import axios from "axios"; // Import axios
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import environment from "@/environment/environment";

// Navigation type
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "LoginScreen">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);

    try {
      console.log("Base URL:", environment.API_BASE_URL);
      console.log("Making API call to:", `${environment.API_BASE_URL}api/auth/login`);
      console.log("Payload:", { username, password });

      const response = await axios.post(`${environment.API_BASE_URL}api/auth/login`, {
        username,
        password,
      });

      console.log("Response:", response.data);

      if (response.data.success) {
        const { token, passwordUpdate } = response.data.data;
        await AsyncStorage.setItem("authToken", token);

        if (passwordUpdate === 0) {
          navigation.navigate("ChangePasswordScreen");
        } else {
          navigation.navigate("DashboardScreen");
        }
      }
    } catch (err) {
      console.log("Error occurred:", err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top Section with Logo */}
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="flex-1 items-center justify-center">
        <Image source={require("../assets/images/lgooo.png")} className="w-40 h-40" resizeMode="contain" />
      </LinearGradient>

      {/* Form Section with Top Curve */}
      <View className="flex-1 bg-white px-9 py-8 rounded-t-3xl shadow-lg -mt-8">
        <Text className="text-center text-xl font-bold text-purple-500 mb-6">Welcome to Sign in</Text>

        {error ? (
          <View className="flex-row items-center mb-4">
            <Icon name="alert-circle" size={16} color="#DC2626" />
            <Text className="text-red-600 text-sm ml-2">{error}</Text>
          </View>
        ) : null}

        {/* Username Input */}
        <View className="border border-gray-300 rounded-full px-4 mb-4 flex-row items-center bg-gray-100">
          <TextInput
            placeholder="Username"
            placeholderTextColor="#A3A3A3"
            className="flex-1 py-3 text-gray-800"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Password Input */}
        <View className="border border-gray-300 rounded-full px-4 mb-6 flex-row items-center bg-gray-100">
          <TextInput
            placeholder="Password"
            placeholderTextColor="#A3A3A3"
            className="flex-1 py-3 text-gray-800"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="rounded-full py-3 px-12 self-center shadow-lg">
          <TouchableOpacity className="items-center" onPress={handleSignIn} disabled={loading}>
            <Text className="text-white text-lg font-bold">{loading ? "Signing in..." : "Sign in"}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

export default LoginScreen;
