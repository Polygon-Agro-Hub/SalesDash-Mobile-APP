import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler, SafeAreaView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types"; 
import Icon from "react-native-vector-icons/Ionicons"; 
import { LinearGradient } from "expo-linear-gradient"; 
import axios  from "axios"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import environment from "@/environment/environment";
import { Keyboard } from "react-native";
import { useFocusEffect } from "expo-router";


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
  const [error1, setError1] = useState("")
  const [error2, setError2] = useState("")
  const [loading, setLoading] = useState(false);



  ///text 

 const handleSignIn = async () => {
  Keyboard.dismiss()
  setError1("")
  setError2("")
  
  if (empId.trim() === "") {
    setError1("Employee ID is required");
    return;
  }
  
  // Check if empId contains lowercase letters
  if (empId !== empId.toUpperCase()) {
    setError1("Employee ID must be in uppercase format (e.g., SA00001)");
    return;
  }
  
  if (password.trim() === "") {
    setError2("Password is required")
    return;
  }

  await AsyncStorage.multiRemove([
    "authToken",
    "tokenStoredTime",
    "tokenExpirationTime",
  ]);
  setLoading(true); 

  try {
    const response = await axios.post(`${environment.API_BASE_URL}api/auth/login`, { 
      empId: empId.trim(), 
      password 
    });

    if (response.data.success) {
      const { token, passwordUpdate } = response.data.data;
      console.log(token)

      if (token) {
        const timestamp = new Date();
        const expirationTime = new Date(
          timestamp.getTime() + 8 * 60 * 60 * 1000
        );
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.multiSet([
          ["tokenStoredTime", timestamp.toISOString()],
          ["tokenExpirationTime", expirationTime.toISOString()],
        ]);
        if (passwordUpdate === 0) {
          navigation.navigate("ChangePasswordScreen");
        } else {
          navigation.navigate("Main", { screen: "DashboardScreen" });
        }
      } else {
        Alert.alert("Sorry","Something went wrong, please try again later..");
      }
    }
  } catch (err) {
    console.log(err)
    if (axios.isAxiosError(err)) {
      const errorMessage = err.response?.data?.message || "Something went wrong.";
      if (errorMessage === "Invalid password") {
        Alert.alert("Login Error", "Invalid password, please try again.");
      } else {
        Alert.alert("Error", "Invalid employee ID or credentials");
      }
    } else {
      setErrors(["Something went wrong. Please try again."]);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  return (
  
        <KeyboardAvoidingView 
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 ,backgroundColor: "white" }}
        className="bg-white"
      >

    <ScrollView 
    
      contentContainerStyle={{ flexGrow: 1 }} 
      keyboardShouldPersistTaps="handled"
    >
            <View className="h-96 ">
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="flex-1 items-center justify-center mb-20">
        <Image source={require("../assets/images/lgooo.webp")} className="w-auto h-[60%]" resizeMode="contain" />
      </LinearGradient>
      </View>

    <View className="flex-1 bg-white">

      {/* Form Section */}

      <View className="flex-1 bg-white px-9 py-8 rounded-t-3xl shadow-lg -mt-28 pt-10">
        <Text className="text-center text-xl font-bold text-[#6C3CD1] mb-6 mt-[6%]">Welcome to Sign in</Text>

        {error1.length > 0 && (
          <View className="-mb-3">

              <View  className="flex-row items-center ">
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-2">{error1}</Text>
              </View>
      
          </View>
        )}
        <View className="border border-gray-300 rounded-full px-4 mb-4 flex-row items-center bg-gray-100 mt-5">

  <TextInput
  placeholder="Employee ID"
  placeholderTextColor="#A3A3A3"
  className="flex-1 py-3 text-gray-800"
  value={empId}
  onChangeText={(text) => {
    // Convert to uppercase automatically
    const upperCaseText = text.toUpperCase();
    setEmpId(upperCaseText);
  }}
  autoCapitalize="characters"  // This helps with keyboard suggestions
/>
        </View>
        {error2.length > 0 && (
          <View className="-mb-3">

              <View  className="flex-row items-center ">
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-2">{error2}</Text>
              </View>
      
          </View>
        )}
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
       <View className="mb-2">
                  <TouchableOpacity className="items-center" onPress={handleSignIn} disabled={loading}>

        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="rounded-full py-3 px-12 self-center shadow-lg">
            <Text className="text-white text-lg font-bold">{loading ? "Signing in..." : "Sign in"}</Text>
        </LinearGradient>
                  </TouchableOpacity>

        </View>
      </View>
    </View>
    </ScrollView>
 
         </KeyboardAvoidingView>
  );
};

export default LoginScreen;
