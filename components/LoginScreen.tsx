import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types"; 
import Icon from "react-native-vector-icons/Ionicons"; 
import { LinearGradient } from "expo-linear-gradient"; 
import axios  from "axios"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import environment from "@/environment/environment";

// Navigation type
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "LoginScreen">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setErrors([]);
    let validationErrors: string[] = [];

    if (empId.trim() === "") {
      validationErrors.push("Employee ID is required");
    }
    if (password.trim() === "") {
      validationErrors.push("Password is required");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true); 

    try {
      const response = await axios.post(`${environment.API_BASE_URL}api/auth/login`, { empId, password });

      if (response.data.success) {
        const { token, passwordUpdate } = response.data.data;
        console.log(token)

    
        await AsyncStorage.setItem("authToken", token);

        if (passwordUpdate === 0) {
          navigation.navigate("ChangePasswordScreen");
        } else {
          navigation.navigate("Main", { screen: "DashboardScreen" });
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiErrors = err.response?.data?.errors || [err.response?.data?.message || "Something went wrong."];
        setErrors(apiErrors);
      } else {
        setErrors(["Something went wrong. Please try again."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
                       behavior={Platform.OS === "ios" ? "padding" : "height"}
                       enabled 
                       className="flex-1"
                     >
                       <ScrollView 
      contentContainerStyle={{ flexGrow: 1 }} 
      keyboardShouldPersistTaps="handled"
    >
    <View className="flex-1 bg-white">
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="flex-1 items-center justify-center">
        <Image source={require("../assets/images/lgooo.png")} className="w-auto h-40" resizeMode="contain" />
      </LinearGradient>

      <View className="flex-1 bg-white px-9 py-8 rounded-t-3xl shadow-lg -mt-8">
        <Text className="text-center text-xl font-bold text-purple-500 mb-6 mt-[12%]">Welcome to Sign in</Text>

        {/* Display all validation errors */}
        {errors.length > 0 && (
          <View className="mb-4">
            {errors.map((error, index) => (
              <View key={index} className="flex-row items-center mb-1">
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-2">{error}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="border border-gray-300 rounded-full px-4 mb-4 flex-row items-center bg-gray-100 mt-5">
          <TextInput
            placeholder="Employee ID"
            placeholderTextColor="#A3A3A3"
            className="flex-1 py-3 text-gray-800"
            value={empId}
            onChangeText={setEmpId}
          />
        </View>

        <View className="border border-gray-300 rounded-full px-4 mb-6 flex-row items-center bg-gray-100 mt-4">
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

        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="rounded-full py-3 px-12 self-center shadow-lg">
          <TouchableOpacity className="items-center" onPress={handleSignIn} disabled={loading}>
            <Text className="text-white text-lg font-bold">{loading ? "Signing in..." : "Sign in"}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
