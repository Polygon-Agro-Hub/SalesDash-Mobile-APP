import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  BackHandler,
  Keyboard,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type ChangePasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePasswordScreen"
>;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  navigation,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdate, setPasswordUpdate] = useState<number | null>(null);

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "All fields are required");
      return false;
    }
    if (newPassword.length < 6) {
      Alert.alert(
        "Error",
        "Your password must contain a minimum of 6 characters with 1 Uppercase, Numbers & Special characters.",
      );
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert(
        "Error",
        "Your password must contain a minimum of 6 characters with 1 Uppercase, Numbers & Special characters.",
      );
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      Alert.alert(
        "Error",
        "Your password must contain a minimum of 6 characters with 1 Uppercase, Numbers & Special characters.",
      );
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      Alert.alert(
        "Error",
        "Your password must contain a minimum of 6 characters with 1 Uppercase, Numbers & Special characters.",
      );
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return false;
    }

    return true;
  };

  const fetchCustomer = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/password-update`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setPasswordUpdate(response.data.data.passwordUpdate);
    } catch (error) {
      console.error("Error fetching password update status:", error);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const handleChangePassword = async () => {
    Keyboard.dismiss();
    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "Unauthorized access, please login again");
        navigation.replace("LoginScreen");
        return;
      }

      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user/update-password`,
        { oldPassword: currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 200) {
        Alert.alert("Success", "Password updated successfully", [
          { text: "OK", onPress: () => navigation.replace("LoginScreen") },
        ]);
        await AsyncStorage.multiRemove([
          "authToken",
          "tokenStoredTime",
          "tokenExpirationTime",
        ]);
      }
    } catch (error) {
      // Check for password mismatch error specifically
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        if (
          typeof errorMsg === "string" &&
          (errorMsg.includes("Current Password does not match") ||
            (errorMsg.toLowerCase().includes("password") &&
              errorMsg.toLowerCase().includes("match")))
        ) {
          Alert.alert(
            "Error",
            "Current Password does not match. Please Re-enter",
          );
        } else {
          Alert.alert("Error", errorMsg);
        }
      } else {
        Alert.alert(
          "Error",
          "Current Password does not match. Please Re-enter",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Conditional back button behavior based on passwordUpdate status
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (passwordUpdate === 0) {
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [passwordUpdate]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#6E3DD1" }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "#6E3DD1" }}
      >
        {passwordUpdate === 1 && (
          <CustomHeader
            title=""
            showBackButton={true}
            navigation={navigation}
            transparent
          />
        )}
        <View className="h-56 flex-1">
          <ImageBackground
            source={require("@/assets/images/auth/update-password.webp")}
            className="flex-1 items-center justify-center h-full"
            resizeMode="cover"
          />
        </View>

        {/* Form Section */}
        <View className="flex-1 ">
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            className="flex-1 rounded-t-3xl px-7 pt-10 pb-8 -mt-4"
          >
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Change Your Password
            </Text>

            {/* Password Requirements Note */}
            <Text className="text-white/80 text-xs text-center mb-4">
              Password must be at least 6 characters
            </Text>

            {/* Current Password */}
            <View className="bg-[#FFFFFF66] rounded-full flex-row items-center px-4 mb-4 py-1">
              <TextInput
                placeholder="Current Password"
                placeholderTextColor="#FFFFFF"
                className="flex-1 text-white py-3"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon
                  name={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            <View className="bg-[#FFFFFF66] rounded-full flex-row items-center px-4 mb-4 py-1">
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#FFFFFF"
                className="flex-1 text-white py-3"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Icon
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View className="bg-[#FFFFFF66] rounded-full flex-row items-center px-4 mb-4 py-1">
              <TextInput
                placeholder="Confirm New Password"
                placeholderTextColor="#FFFFFF"
                className="flex-1 text-white py-3"
                secureTextEntry={!showConfirmPassword}
                value={confirmNewPassword}
                onChangeText={(text) => {
                  setConfirmNewPassword(text);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#E5E5E5"
                />
              </TouchableOpacity>
            </View>

            {/* Update Button */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 999,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 12,
                  width: "50%",
                }}
              >
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 14,
                    alignItems: "center",
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color: "#6B21A8",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    {loading ? "Updating..." : "Update"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default ChangePasswordScreen;
