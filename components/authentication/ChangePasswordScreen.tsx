import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  BackHandler,
  Keyboard,
  Dimensions,
  ScrollView,
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

type ChangePasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePasswordScreen"
>;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

type FieldName = "current" | "new" | "confirm";

// Space (px) kept between the focused field and the keyboard,
// so the fields / Update button below it stay visible.
const EXTRA_SPACE: Record<FieldName, number> = {
  current: 30,
  new: 60,
  confirm: 100,
};

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");
  const HALF = SCREEN_HEIGHT / 2;

  // Keyboard / scroll refs
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardTopRef = useRef(0);
  const keyboardOpenRef = useRef(false);
  const focusedFieldRef = useRef<FieldName>("current");
  const currentWrapRef = useRef<View>(null);
  const newWrapRef = useRef<View>(null);
  const confirmWrapRef = useRef<View>(null);

  // Scroll only as much as needed so the focused field sits just above
  // the keyboard (not at the top of the screen).
  const ensureVisible = useCallback(() => {
    const field = focusedFieldRef.current;
    const target =
      field === "current"
        ? currentWrapRef
        : field === "new"
          ? newWrapRef
          : confirmWrapRef;

    target.current?.measureInWindow((_x, y, _w, h) => {
      const limit = keyboardTopRef.current - EXTRA_SPACE[field];
      const overflow = y + h - limit;
      if (overflow > 0) {
        scrollRef.current?.scrollTo({
          y: scrollYRef.current + overflow,
          animated: true,
        });
      }
    });
  }, []);

  const handleFocus = (field: FieldName) => {
    focusedFieldRef.current = field;
    // if keyboard is already open (switching fields), adjust now
    if (keyboardOpenRef.current) {
      setTimeout(ensureVisible, 150);
    }
  };

  // Track keyboard height
  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardOpenRef.current = true;
      keyboardTopRef.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      // wait for bottom padding to render, then scroll
      setTimeout(ensureVisible, 150);
    });
    const hideListener = Keyboard.addListener("keyboardDidHide", () => {
      keyboardOpenRef.current = false;
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [ensureVisible]);

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

  const blockSpaces = (text: string, setter: (val: string) => void) => {
    if (text.includes(" ")) return;
    setter(text);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#6E3DD1" }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          flexGrow: 1,
          // Manually lift content above the keyboard (works in production
          // builds even with edge-to-edge enabled).
          paddingBottom: keyboardHeight,
        }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "#6E3DD1" }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* TOP HALF — Image Section exactly 50% */}
        <View style={{ height: HALF }}>
          {passwordUpdate === 1 && (
            <CustomHeader
              title=""
              showBackButton={true}
              navigation={navigation}
              transparent
            />
          )}
          <ImageBackground
            source={require("@/assets/images/auth/update-password.webp")}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        </View>

        {/* BOTTOM HALF — Form Section exactly 50% */}
        <View style={{ minHeight: HALF }}>
          <LinearGradient
            colors={["#854BDA", "#6E3DD1"]}
            style={{
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 28,
              paddingTop: 20,
              paddingBottom: 16,
              marginTop: -16,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                width: "100%",
                maxWidth: 500,
                alignSelf: "center",
              }}
            >
              {/* Title */}
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: SCREEN_HEIGHT > 900 ? 28 : 22,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Change Your Password
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Password must be at least 6 characters
              </Text>

              {/* Current Password */}
              <View
                ref={currentWrapRef}
                collapsable={false}
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  marginBottom: 16,
                  paddingVertical: 4,
                }}
              >
                <TextInput
                  placeholder="Current Password"
                  placeholderTextColor="#FFFFFF"
                  style={{ flex: 1, color: "#ffffff", paddingVertical: 12 }}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={(text) => blockSpaces(text, setCurrentPassword)}
                  onFocus={() => handleFocus("current")}
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

              {/* New Password */}
              <View
                ref={newWrapRef}
                collapsable={false}
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  marginBottom: 16,
                  paddingVertical: 4,
                }}
              >
                <TextInput
                  placeholder="New Password"
                  placeholderTextColor="#FFFFFF"
                  style={{ flex: 1, color: "#ffffff", paddingVertical: 12 }}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => blockSpaces(text, setNewPassword)}
                  onFocus={() => handleFocus("new")}
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

              {/* Confirm Password */}
              <View
                ref={confirmWrapRef}
                collapsable={false}
                style={{
                  backgroundColor: "rgba(255,255,255,0.4)",
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  marginBottom: 20,
                  paddingVertical: 4,
                }}
              >
                <TextInput
                  placeholder="Confirm New Password"
                  placeholderTextColor="#FFFFFF"
                  style={{ flex: 1, color: "#ffffff", paddingVertical: 12 }}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmNewPassword}
                  onChangeText={(text) =>
                    blockSpaces(text, setConfirmNewPassword)
                  }
                  onFocus={() => handleFocus("confirm")}
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

              {/* Button */}
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 999,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 12,
                    width: SCREEN_HEIGHT > 900 ? 260 : 220,
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
                        fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                      }}
                    >
                      {loading ? "Updating..." : "Update"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

export default ChangePasswordScreen;