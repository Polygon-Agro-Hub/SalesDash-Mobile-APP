import React, { useCallback, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { Keyboard, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  BackHandler,
} from "react-native";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [empIdError, setEmpIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmployeeId = (id: string): string => {
    if (id.trim() === "") {
      return "Employee ID is required";
    }

    // Check if first two letters are exactly "SA" in uppercase
    const prefix = id.substring(0, 2);
    if (/^sa$/i.test(prefix)) {
      // If letters are lowercase in any combination, show uppercase error
      if (prefix !== "SA") {
        return "Please enter Employee ID in uppercase letters";
      }
    }

    return "";
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.trim() === "") {
      return "Password is required";
    }
    return "";
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setEmpIdError("");
    setPasswordError("");

    let hasError = false;

    // Validate Employee ID
    const empIdValidationError = validateEmployeeId(empId);
    if (empIdValidationError) {
      setEmpIdError(empIdValidationError);
      hasError = true;
    }

    // Validate Password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      hasError = true;
    }

    // If there are validation errors, stop here
    if (hasError) {
      return;
    }

    // Check if EMP ID starts with exactly "SA" (both letters capital)
    if (empId.length < 2 || empId.substring(0, 2) !== "SA") {
      Alert.alert(
        "Unauthorized Access",
        "You are not authorized to access this system. Please use a valid Employee ID.",
        [{ text: "OK" }],
      );
      return;
    }

    await AsyncStorage.multiRemove([
      "authToken",
      "tokenStoredTime",
      "tokenExpirationTime",
    ]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/login`,
        {
          empId: empId.trim(),
          password,
        },
      );

      if (response.data.success) {
        const { token, passwordUpdate } = response.data.data;

        if (token) {
          const timestamp = new Date();
          const expirationTime = new Date(
            timestamp.getTime() + 8 * 60 * 60 * 1000,
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
          Alert.alert(
            "Sorry",
            "Something went wrong, please try again later..",
          );
        }
      }
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message || "Something went wrong.";
        const statusType = err.response?.data?.statusType;

        // Handle specific status-related errors
        if (statusType === "rejected") {
          Alert.alert("Account Rejected", "This Employee ID is rejected.", [
            { text: "OK" },
          ]);
        } else if (statusType === "not_approved") {
          Alert.alert("Not Approved EMP ID", "This EMP ID is not approved.", [
            { text: "OK" },
          ]);
        } else if (statusType === "password_not_set") {
          Alert.alert("Not Approved EMP ID", "This EMP ID is not approved.", [
            { text: "OK" },
          ]);
        } else if (errorMessage === "Invalid password") {
          Alert.alert("Login Error", "Invalid password, please try again.");
        } else if (errorMessage === "Invalid Employee ID") {
          Alert.alert("Login Error", "Invalid Employee ID, please try again.");
        } else {
          Alert.alert("Error", errorMessage);
        }
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      className="bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-96 flex-1 justify-center items-center">
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            className="flex-1 items-center justify-center mb-20"
          >
            <Image
              source={require("@/assets/images/public/logo.webp")}
              className="w-auto h-[60%]"
              resizeMode="contain"
            />
          </LinearGradient>
        </View>

        <View className="flex-1">
          {/* Form Section */}
          <View className="flex-1 bg-white px-6 py-8 rounded-t-3xl shadow-lg -mt-28 pt-16">
            <Text className="text-center text-2xl font-bold text-[#6C3CD1] mb-6 mt-[6%]">
              Welcome to Sign in
            </Text>

            {empIdError.length > 0 && (
              <View className="-mb-3">
                <View className="flex-row items-center ">
                  <Icon name="alert-circle" size={16} color="#DC2626" />
                  <Text className="text-red-600 text-sm ml-2">
                    {empIdError}
                  </Text>
                </View>
              </View>
            )}

            <View
              className={`border rounded-full px-4 py-1 mb-4 flex-row items-center bg-gray-100 mt-5 ${
                empIdError ? "border-red-500" : "border-gray-300"
              }`}
            >
              <TextInput
                placeholder="Employee ID"
                placeholderTextColor="#A3A3A3"
                className="flex-1 py-3 text-gray-800"
                value={empId}
                onChangeText={(text) => {
                  setEmpId(text);
                  // Clear error when user starts typing
                  if (empIdError) setEmpIdError("");
                }}
              />
            </View>

            {passwordError.length > 0 && (
              <View className="-mb-3">
                <View className="flex-row items-center ">
                  <Icon name="alert-circle" size={16} color="#DC2626" />
                  <Text className="text-red-600 text-sm ml-2">
                    {passwordError}
                  </Text>
                </View>
              </View>
            )}

            <View
              className={`border rounded-full px-4 py-1 mb-6 flex-row items-center bg-gray-100 mt-4 ${
                passwordError ? "border-red-500" : "border-gray-300"
              }`}
            >
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A3A3A3"
                className="flex-1 py-3 text-gray-800"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  // Clear error when user starts typing
                  if (passwordError) setPasswordError("");
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-6">
              <View
                style={{
                  backgroundColor: "#854BDA",
                  borderRadius: 999,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 12,
                }}
              >
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{ borderRadius: 999 }}
                >
                  <LinearGradient
                    colors={["#854BDA", "#6E3DD1"]}
                    style={{
                      borderRadius: 999,
                      paddingVertical: 14,
                      width: 180,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
