import React, { useCallback, useRef, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import {
  Keyboard,
  Platform,
  Dimensions,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Alert,
  BackHandler,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HALF = SCREEN_HEIGHT * 0.5;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [empIdError, setEmpIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);

  const validateEmployeeId = (id: string): string => {
    if (id.trim() === "") return "Employee ID is required";
    const prefix = id.substring(0, 2);
    if (/^sa$/i.test(prefix) && prefix !== "SA") {
      return "Please enter Employee ID in uppercase letters";
    }
    return "";
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.trim() === "") return "Password is required";
    return "";
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setEmpIdError("");
    setPasswordError("");

    let hasError = false;

    const empIdValidationError = validateEmployeeId(empId);
    if (empIdValidationError) {
      setEmpIdError(empIdValidationError);
      hasError = true;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      hasError = true;
    }

    if (hasError) return;

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
        { empId: empId.trim(), password },
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
          Alert.alert("Sorry", "Something went wrong, please try again later.");
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message || "Something went wrong.";
        const statusType = err.response?.data?.statusType;

        if (statusType === "rejected" || statusType === "not_approved") {
          navigation.navigate("BannedScreen", {
            statusType,
            message: errorMessage,
          });
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ backgroundColor: "white" }}
      >
        <LinearGradient
          colors={["#9B60E8", "#6E3DD1"]}
          style={{
            height: HALF,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("@/assets/images/public/logo.webp")}
            style={{ width: "55%", height: "55%" }}
            resizeMode="contain"
          />
        </LinearGradient>

        <View
          style={{
            flex: 1,
            backgroundColor: "white",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -28,
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
        >
          {/* Center Container */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              width: "100%",
              maxWidth: 500,
              alignSelf: "center",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: SCREEN_HEIGHT > 900 ? 28 : 22,
                fontWeight: "700",
                color: "#6C3CD1",
                marginBottom: 52,
              }}
            >
              Welcome to Sign in
            </Text>

            {empIdError.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontSize: 13, marginLeft: 6 }}>
                  {empIdError}
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: empIdError ? "#EF4444" : "#D1D5DB",
                paddingHorizontal: 16,
                marginBottom: 16,
              }}
            >
              <TextInput
                placeholder="Employee ID"
                placeholderTextColor="#A3A3A3"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  fontSize: 16,
                  color: "#1F2937",
                }}
                value={empId}
                onChangeText={(text) => {
                  if (text.includes(" ")) return;
                  setEmpId(text);
                  if (empIdError) setEmpIdError("");
                }}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {passwordError.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontSize: 13, marginLeft: 6 }}>
                  {passwordError}
                </Text>
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: passwordError ? "#EF4444" : "#D1D5DB",
                paddingHorizontal: 16,
                marginBottom: 40,
              }}
            >
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A3A3A3"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  fontSize: 16,
                  color: "#1F2937",
                }}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  if (text.includes(" ")) return;
                  setPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                ref={passwordRef}
                onFocus={() =>
                  setTimeout(
                    () =>
                      scrollViewRef.current?.scrollToEnd({ animated: true }),
                    100,
                  )
                }
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Button */}
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  borderRadius: 999,
                  shadowColor: "#6E3DD1",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
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
                    colors={["#9B60E8", "#6E3DD1"]}
                    style={{
                      borderRadius: 999,
                      paddingVertical: 16,
                      width: SCREEN_HEIGHT > 900 ? 260 : 220,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: SCREEN_HEIGHT > 900 ? 20 : 18,
                        fontWeight: "700",
                      }}
                    >
                      {loading ? "Signing in…" : "Sign in"}
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
