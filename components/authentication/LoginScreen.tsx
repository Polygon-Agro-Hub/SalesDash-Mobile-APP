import React, { useCallback, useRef, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import pushNotificationService from "@/services/notification/pushNotification.service";
import socketService from "@/services/socket/socket.service";
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
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import biometricService from "@/services/biometric/biometric.service";
import BiometricAuthModal from "./BiometricAuthModal";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Only IDs with this prefix belong to the SalesDash app
const EMP_ID_PREFIX = "SA";

const normalizeId = (id?: string | null): string =>
  (id ?? "").trim().toUpperCase();

const isSalesDashId = (id?: string | null): boolean =>
  normalizeId(id).startsWith(EMP_ID_PREFIX);

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [empIdError, setEmpIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasStoredBiometrics, setHasStoredBiometrics] = useState(false);
  const [storedBiometricEmpId, setStoredBiometricEmpId] = useState<
    string | null
  >(null);
  const [isBiometricModalVisible, setIsBiometricModalVisible] = useState(false);
  const [biometricModalStatus, setBiometricModalStatus] = useState<
    "scanning" | "success" | "error"
  >("scanning");

  // Load Remembered Credentials and check Biometrics state on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initScreen = async () => {
        try {
          // 1) Remember Me credentials
          let rememberedEmp = "";
          let rememberedPwd = "";
          const savedRemember = await AsyncStorage.getItem(
            "salesdash_remember_me",
          );
          if (savedRemember === "true") {
            rememberedEmp =
              (await AsyncStorage.getItem("salesdash_saved_empid")) ?? "";
            rememberedPwd =
              (await AsyncStorage.getItem("salesdash_saved_password")) ?? "";
          }

          // 2) Biometrics status (only SalesDash users are accepted)
          let bioId: string | null = null;
          const avail = await biometricService.checkBiometricAvailability();
          if (avail.hasHardware && avail.isEnrolled) {
            const bioCreds = await biometricService.getBiometricCredentials();
            const enabled = await biometricService.isBiometricEnabled();
            const storedId = normalizeId(bioCreds?.empId);
            const hasBio = Boolean(
              enabled && isSalesDashId(storedId) && bioCreds?.password,
            );
            bioId = hasBio ? storedId : null;
          }

          if (!isActive) return;

          setIsBiometricAvailable(Boolean(avail.hasHardware && avail.isEnrolled));
          setHasStoredBiometrics(Boolean(bioId));
          setStoredBiometricEmpId(bioId);

          // 3) Pre-fill the form (e.g. after logout):
          //    Remember Me wins, otherwise show the biometric user's Employee ID.
          if (rememberedEmp) {
            setRememberMe(true);
            setEmpId(rememberedEmp.trim().toUpperCase());
            setPassword(rememberedPwd);
          } else {
            setRememberMe(false);
            setEmpId(bioId ?? "");
            setPassword("");
          }
          setEmpIdError("");
          setPasswordError("");
        } catch (err) {
          console.warn("Error initializing login screen:", err);
        }
      };

      initScreen();

      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => {
        isActive = false;
        subscription.remove();
      };
    }, []),
  );

  const validateEmployeeId = (id: string): string => {
    if (id.trim() === "") return "Employee ID is required";
    return "";
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.trim() === "") return "Password is required";
    return "";
  };

  // Remember Me Handler
  const handleToggleRememberMe = async (val: boolean) => {
    setRememberMe(val);
    if (!val) {
      await AsyncStorage.multiRemove([
        "salesdash_remember_me",
        "salesdash_saved_empid",
        "salesdash_saved_password",
      ]);
    }
  };

  const performLogin = async (
    loginEmpId: string,
    loginPassword: string,
    saveBioOnSuccess = false,
  ) => {
    await AsyncStorage.multiRemove([
      "authToken",
      "tokenStoredTime",
      "tokenExpirationTime",
    ]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/login`,
        { empId: loginEmpId.trim(), password: loginPassword },
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

          // Save Remember Me credentials if toggle is enabled
          if (rememberMe) {
            await AsyncStorage.multiSet([
              ["salesdash_remember_me", "true"],
              ["salesdash_saved_empid", loginEmpId.trim()],
              ["salesdash_saved_password", loginPassword],
            ]);
          } else {
            await AsyncStorage.multiRemove([
              "salesdash_remember_me",
              "salesdash_saved_empid",
              "salesdash_saved_password",
            ]);
          }

          // Save Biometrics credentials only after a successful login
          // and only for a SalesDash ID (this replaces any previous user)
          if (saveBioOnSuccess && isSalesDashId(loginEmpId)) {
            const cleanId = normalizeId(loginEmpId);
            await biometricService.saveBiometricCredentials(
              cleanId,
              loginPassword,
            );
            setHasStoredBiometrics(true);
            setStoredBiometricEmpId(cleanId);
          }

          socketService.connect().catch(() => {});
          socketService.checkNewNotifications().catch(() => {});
          pushNotificationService.registerPushTokenAsync().catch(() => {});

          if (passwordUpdate === 0) {
            navigation.navigate("ChangePasswordScreen");
          } else {
            try {
              const hasAsked = await AsyncStorage.getItem(
                "hasAskedNotificationPermission",
              );
              if (hasAsked !== "true") {
                navigation.navigate("NotificationAccess", {
                  returnScreen: "Main",
                  returnParams: { screen: "DashboardScreen" },
                  blockBackNavigation: true,
                });
                return;
              }
            } catch (err) {
              console.warn("Error reading notification permission flag:", err);
            }
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

  // Regular Sign In
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

    const cleanEmpId = normalizeId(empId);
    if (!isSalesDashId(cleanEmpId)) {
      Alert.alert(
        "Unauthorized Access",
        "You are not authorized to access this system. Please use a valid Employee ID.",
        [{ text: "OK" }],
      );
      return;
    }

    await performLogin(cleanEmpId, password, false);
  };

  // State 1: "Enable Biometrics" Button clicked
  const handleEnableBiometricsAndLogin = async () => {
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

    if (hasError) {
      Alert.alert(
        "Enable Biometrics",
        "Please enter your Employee ID and Password to enable biometric login.",
      );
      return;
    }

    const cleanEmpId = normalizeId(empId);
    if (!isSalesDashId(cleanEmpId)) {
      Alert.alert(
        "Unauthorized Access",
        "You are not authorized to access this system. Please use a valid Employee ID.",
      );
      return;
    }

    const avail = await biometricService.checkBiometricAvailability();
    if (!avail.hasHardware || !avail.isEnrolled) {
      Alert.alert(
        "Biometric Setup",
        "No biometric sensor or enrolled fingerprint found on this device. Please set up fingerprint/face unlock in your phone settings first.",
      );
      return;
    }

    // Verify biometric hardware once to confirm user identity
    const verified = await biometricService.authenticateWithBiometrics(
      Platform.OS === "ios"
        ? "Verify identity to enable biometric sign-in"
        : "Confirm fingerprint to enable biometric login",
    );

    if (verified) {
      // Login with credentials and save to biometric store if password is correct
      await performLogin(cleanEmpId, password, true);
    }
  };

  // State 2: "Use Biometrics" Button clicked
  const handleBiometricLogin = async () => {
    try {
      const creds = await biometricService.getBiometricCredentials();
      const credId = normalizeId(creds?.empId);

      if (!creds || !credId || !creds.password || !isSalesDashId(credId)) {
        Alert.alert(
          "Biometric Sign-In",
          "No saved SalesDash credentials found. Please sign in with your password to enable biometric login.",
        );
        setHasStoredBiometrics(false);
        setStoredBiometricEmpId(null);
        return;
      }

      if (Platform.OS === "android") {
        setIsBiometricModalVisible(true);
        setBiometricModalStatus("scanning");
      }

      const verified = await biometricService.authenticateWithBiometrics(
        Platform.OS === "ios"
          ? "Sign in with Face ID / Touch ID"
          : "Confirm your fingerprint to sign in",
      );

      if (verified) {
        setEmpId(credId);
        setPassword(creds.password);
        setStoredBiometricEmpId(credId);

        if (Platform.OS === "android") {
          setBiometricModalStatus("success");
          setTimeout(async () => {
            setIsBiometricModalVisible(false);
            await performLogin(credId, creds.password, false);
          }, 650);
        } else {
          // On iOS, Face ID / Touch ID handles its own native animation and checkmark
          await performLogin(credId, creds.password, false);
        }
      } else {
        if (Platform.OS === "android") {
          setIsBiometricModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Biometric login error:", error);
      if (Platform.OS === "android") {
        setIsBiometricModalVisible(false);
      }
    }
  };

  // "Use Biometrics" only when stored biometrics exist AND the typed ID is empty
  // or exactly equals the stored biometric user. Any other ID => "Enable Biometrics".
  const typedId = normalizeId(empId);
  const isMatchingBiometricUser = Boolean(
    hasStoredBiometrics &&
      storedBiometricEmpId &&
      (typedId === "" || typedId === storedBiometricEmpId),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#7342DC" }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1, backgroundColor: "#7342DC" }}
      >
        {/* Top Purple Branding Banner */}
        <LinearGradient
          colors={["#7E46E8", "#6835CE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            height: SCREEN_HEIGHT * 0.38,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 10,
          }}
        >
          <Image
            source={require("@/assets/images/public/logo.webp")}
            style={{ width: "62%", height: "62%" }}
            resizeMode="contain"
          />
        </LinearGradient>

        {/* White Rounded Form Card */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            marginTop: -32,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View style={{ width: "100%", maxWidth: 440, alignSelf: "center" }}>
            {/* "Welcome Back" Pill Badge */}
            <View
              style={{
                alignSelf: "center",
                backgroundColor: "#F3E8FF",
                paddingVertical: 6,
                paddingHorizontal: 18,
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: "#7C3AED",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                Welcome Back
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "800",
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Sign in to your account
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 26,
              }}
            >
              Enter your enterprise credentials or use biometrics
            </Text>

            {/* Employee ID Error Banner */}
            {empIdError.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontSize: 13, marginLeft: 6 }}>
                  {empIdError}
                </Text>
              </View>
            )}

            {/* Employee ID Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: empIdError ? "#EF4444" : "#E5E7EB",
                paddingHorizontal: 16,
                height: 54,
                marginBottom: empIdError ? 8 : 16,
              }}
            >
              <Ionicons
                name="person-circle"
                size={22}
                color="#6B7280"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Employee ID (e.g. SA00001)"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#1F2937",
                  paddingVertical: 0,
                }}
                value={empId}
                onChangeText={(text) => {
                  if (text.includes(" ")) return;
                  setEmpId(text.toUpperCase());
                  if (empIdError) setEmpIdError("");
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password Error Banner */}
            {passwordError.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ color: "#DC2626", fontSize: 13, marginLeft: 6 }}>
                  {passwordError}
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: passwordError ? "#EF4444" : "#E5E7EB",
                paddingHorizontal: 16,
                height: 54,
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="lock-closed"
                size={20}
                color="#6B7280"
                style={{ marginRight: 12, marginLeft: 2 }}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "#1F2937",
                  paddingVertical: 0,
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
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6C3CD1"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 22,
                paddingHorizontal: 4,
              }}
            >
              <Switch
                value={rememberMe}
                onValueChange={handleToggleRememberMe}
                trackColor={{ false: "#D1D5DB", true: "#6C3CD1" }}
                thumbColor={"#FFFFFF"}
                style={{
                  transform: [
                    { scaleX: Platform.OS === "ios" ? 0.85 : 0.95 },
                    { scaleY: Platform.OS === "ios" ? 0.85 : 0.95 },
                  ],
                }}
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  color: "#4B5563",
                  fontWeight: "500",
                }}
              >
                Remember me
              </Text>
            </View>

            {/* Primary Sign In Button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                width: "100%",
                borderRadius: 999,
                shadowColor: "#6C3CD1",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 8,
                marginBottom: 26,
              }}
            >
              <LinearGradient
                colors={["#7C3AED", "#6C3CD1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 999,
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    Sign in
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* "OR AUTHENTICATE WITH" Separator */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}
              />
              <Text
                style={{
                  paddingHorizontal: 12,
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  letterSpacing: 0.8,
                }}
              >
                OR AUTHENTICATE WITH
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}
              />
            </View>

            {/* Biometric Button: "Enable Biometrics" vs "Use Biometrics" */}
            <TouchableOpacity
              onPress={
                isMatchingBiometricUser
                  ? handleBiometricLogin
                  : handleEnableBiometricsAndLogin
              }
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#F7F3FF",
                borderWidth: 1.5,
                borderColor: "#EADFFC",
                borderRadius: 999,
                height: 52,
                paddingHorizontal: 28,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                shadowColor: "#6C3CD1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <FontAwesome5
                name="fingerprint"
                size={20}
                color="#6C3CD1"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: "#6C3CD1",
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {isMatchingBiometricUser
                  ? "Use Biometrics"
                  : "Enable Biometrics"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Verification Radar Modal (Android Only) */}
      {Platform.OS === "android" && (
        <BiometricAuthModal
          visible={isBiometricModalVisible}
          status={biometricModalStatus}
          biometricLabel="Fingerprint"
          onCancel={() => setIsBiometricModalVisible(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;