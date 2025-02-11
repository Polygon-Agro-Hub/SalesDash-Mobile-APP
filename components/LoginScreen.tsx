import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types"; // Replace with the path to your types file
import Icon from "react-native-vector-icons/Ionicons"; // For the eye icon in the password field
import { LinearGradient } from "expo-linear-gradient"; // Gradient background
import axios, { AxiosError } from "axios"; // Import axios and AxiosError
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import environment from "@/environment/environment";
import LottieView from "lottie-react-native";
import { Modal } from "react-native"; // Import Modal for full-screen loading

// Navigation type
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "LoginScreen">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // const handleSignIn = async () => {
  //   let hasError = false;
  //   setError({ username: "", password: "" }); // Clear previous errors
  
  //   if (username.trim() === "") {
  //     setError((prev) => ({ ...prev, username: "User Name is required" }));
  //     hasError = true;
  //   }
  
  //   if (password.trim() === "") {
  //     setError((prev) => ({ ...prev, password: "Password is required" }));
  //     hasError = true;
  //   }
  
  //   if (hasError) {
  //     return; // Stop if there are errors
  //   }
  
  //   setLoading(true); // Show loading indicator
  
  //   try {
  //     // Make the API call
  //     const response = await axios.post(`${environment.API_BASE_URL}api/auth/login`, {
  //       username,
  //       password,
  //     });
  
  //     // Handle successful response
  //     if (response.data.success) {
  //       const { token, passwordUpdate } = response.data.data;
  
  //       // Save token in AsyncStorage
  //       await AsyncStorage.setItem("authToken", token);
  
  //       if (passwordUpdate === 0) {
  //         // Redirect to Password Update Screen
  //         navigation.navigate("ChangePasswordScreen");
  //       } else {
  //         // Redirect to Dashboard Screen
  //         navigation.navigate("DashboardScreen");
  //       }
  //     }
  //   } catch (err) {
  //     // Check if the error is an instance of AxiosError
  //     if (axios.isAxiosError(err)) {
  //       setError({
  //         ...error,
  //         password: err.response?.data?.message || "Something went wrong. Please try again.",
  //       });
  //     } else {
  //       // Handle non-axios errors here if necessary
  //       setError({ ...error, password: "Something went wrong. Please try again." });
  //     }
  //   } finally {
  //     setLoading(false); // Hide loading indicator
  //   }
  // };
  
 


const handleSignIn = async () => {
  let hasError = false;
  setError({ username: "", password: "" });

  if (username.trim() === "") {
    setError((prev) => ({ ...prev, username: "User Name is required" }));
    hasError = true;
  }

  if (password.trim() === "") {
    setError((prev) => ({ ...prev, password: "Password is required" }));
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);
  setIsLoading(true);

  try {
    const response = await axios.post(`${environment.API_BASE_URL}api/auth/login`, { username, password });

    if (response.data.success) {
      const { token, passwordUpdate } = response.data.data;
      await AsyncStorage.setItem("authToken", token);

      setTimeout(() => {
        setIsLoading(false); // Hide animation after 3 seconds
        navigation.navigate(passwordUpdate === 0 ? "ChangePasswordScreen" : "DashboardScreen");
      }, 3000);
    }
  } catch (err) {
    setError({
      ...error,
      password: axios.isAxiosError(err) ? err.response?.data?.message || "Something went wrong." : "Something went wrong.",
    });
    setIsLoading(false);
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
        {/* Title */}
        <Text className="text-center text-xl font-bold text-purple-500 mb-6">Welcome to Sign in</Text>

        {/* Username Error Message */}
        {error.username ? (
          <View className="flex-row items-center ">
            <Icon name="alert-circle" size={16} color="#DC2626" />
            <Text className="text-red-600 text-sm ml-2">{error.username}</Text>
          </View>
        ) : null}

        {/* Username Input */}
        <View className={`border ${error.username ? "border-red-500" : "border-gray-300"} rounded-full px-4 mb-4 flex-row items-center bg-gray-100 mt-5`}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#A3A3A3"
            className="flex-1 py-3 text-gray-800"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Password Error Message */}
        {error.password ? (
          <View className="flex-row items-center ">
            <Icon name="alert-circle" size={16} color="#DC2626" />
            <Text className="text-red-600 text-sm ml-2">{error.password}</Text>
          </View>
        ) : null}

        {/* Password Input */}
        <View className={`border ${error.password ? "border-red-500" : "border-gray-300"} rounded-full px-4 mb-6 flex-row items-center bg-gray-100 mt-4`}>
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

        {isLoading && (
 <Modal transparent animationType="fade">
 <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
   <LottieView
     source={require("../assets/images/loading.json")}
     autoPlay
     loop
     style={{ width: 100, height: 100 }}
   />
 </View>
</Modal>

)}


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