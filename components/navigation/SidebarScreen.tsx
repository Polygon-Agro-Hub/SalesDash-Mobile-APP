import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Switch,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingPage from "../common/LoadingPage";
import biometricService from "@/services/biometric/biometric.service";
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";

type SidebarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SidebarScreen"
>;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    empId: "",
    image: "",
  });
  const [imageLoading, setImageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricActive, setIsBiometricActive] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");


  const checkBiometrics = async (targetEmpId?: string) => {
    try {
      const avail = await biometricService.checkBiometricAvailability();
      if (avail.hasHardware && avail.isEnrolled) {
        setIsBiometricAvailable(true);
        const label = await biometricService.getBiometricTypeLabel();
        setBiometricLabel(label);

        const activeId =
          targetEmpId ||
          formData.empId ||
          (await AsyncStorage.getItem("salesdash_current_emp_id")) ||
          undefined;

        const enabled = await biometricService.isBiometricEnabled(activeId);
        setIsBiometricActive(enabled);
      } else {
        setIsBiometricAvailable(false);
        setIsBiometricActive(false);
      }
    } catch (err) {
      console.warn("Error checking biometric status in sidebar:", err);
      setIsBiometricAvailable(false);
      setIsBiometricActive(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setComplaintsExpanded(false);
      setImageLoading(true);
      setProfileLoading(true);
      getUserProfile();
      checkBiometrics();
    }, []),
  );

  const handleToggleBiometric = async (value: boolean) => {
    if (!value) {
      await biometricService.clearBiometricCredentials();
      setIsBiometricActive(false);
      return;
    }

    const avail = await biometricService.checkBiometricAvailability();
    if (!avail.hasHardware || !avail.isEnrolled) {
      setIsBiometricActive(false);
      Alert.alert(
        "Biometrics Unavailable",
        "Please set up a fingerprint or Face ID in your device settings first.",
      );
      return;
    }

    const currentEmpId =
      formData.empId ||
      (await AsyncStorage.getItem("salesdash_current_emp_id")) ||
      "";

    const creds = await biometricService.getBiometricCredentials();
    const credsMatchCurrent = Boolean(
      creds?.empId &&
        creds?.password &&
        currentEmpId &&
        creds.empId.trim().toUpperCase() === currentEmpId.trim().toUpperCase(),
    );

    if (credsMatchCurrent && creds) {
      const verified = await biometricService.authenticateWithBiometrics(
        `Verify ${biometricLabel} to enable Biometric Sign-In`,
      );
      if (verified) {
        await biometricService.setBiometricEnabled(true);
        setIsBiometricActive(true);
        Alert.alert("Success", "Biometric Sign-In has been enabled.");
      } else {
        setIsBiometricActive(false);
      }
      return;
    }

    // If no biometric credentials for current user, check if Remember Me has saved their password
    const savedEmp = await AsyncStorage.getItem("salesdash_saved_empid");
    const isRemembered = await AsyncStorage.getItem("salesdash_remember_me");
    if (
      isRemembered === "true" &&
      savedEmp &&
      currentEmpId &&
      savedEmp.trim().toUpperCase() === currentEmpId.trim().toUpperCase()
    ) {
      const savedPwd = await SecureStore.getItemAsync("salesdash_saved_password");
      if (savedPwd) {
        const verified = await biometricService.authenticateWithBiometrics(
          `Verify ${biometricLabel} to enable Biometric Sign-In`,
        );
        if (verified) {
          await biometricService.saveBiometricCredentials(currentEmpId, savedPwd);
          setIsBiometricActive(true);
          Alert.alert("Success", "Biometric Sign-In has been enabled.");
          return;
        } else {
          setIsBiometricActive(false);
          return;
        }
      }
    }

    // Password is not known in secure storage, inform user to enable it from sign-in
    setIsBiometricActive(false);
    Alert.alert(
      "Enable Biometric Sign-In",
      "To securely link your biometrics, please tap 'Enable Biometrics' on the sign-in screen when logging in with your Employee ID and password.",
    );
  };

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        setProfileLoading(false);
        return;
      }
      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      const empId = response.data?.data?.empId;
      if (empId) {
        await AsyncStorage.setItem(
          "salesdash_current_emp_id",
          empId.trim().toUpperCase(),
        );
      }

      // Preload the image before setting formData
      if (response.data.data.image) {
        Image.prefetch(response.data.data.image)
          .then(() => {
            setFormData(response.data.data);
            setImageLoading(false);
            setProfileLoading(false);
            checkBiometrics(empId);
          })
          .catch(() => {
            setFormData(response.data.data);
            setImageLoading(false);
            setProfileLoading(false);
            checkBiometrics(empId);
          });
      } else {
        setFormData(response.data.data);
        setImageLoading(false);
        setProfileLoading(false);
        checkBiometrics(empId);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
      setImageLoading(false);
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove([
        "authToken",
        "salesdash_current_emp_id",
      ]);
      setTimeout(() => {
        navigation.replace("LoginScreen");
      }, 5000);
    } catch (error) {
      console.error("Error removing authToken:", error);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Main" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 w-full bg-white">
        {loading ? (
          <LoadingPage message="Logging Out..." fullScreen={true} />
        ) : (
          <View className="flex-1 bg-white">
            <ScrollView keyboardShouldPersistTaps="handled">
              <CustomHeader
                title=""
                showBackButton={true}
                navigation={navigation}
                onBackPress={() => navigation.navigate("Main" as any)}
              />

              {profileLoading ? (
                <SidebarSkeleton showHeader={true} />
              ) : (
                <>
                  <View className="flex-row items-center px-5 py-2">
                    {/* Profile Image with Loading State */}
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {formData.image ? (
                        <>
                          {/* Show placeholder while loading */}
                          {imageLoading && (
                            <Image
                              source={require("@/assets/images/profile/profile1.webp")}
                              className="w-16 h-16 rounded-full absolute"
                              resizeMode="cover"
                            />
                          )}
                          {/* Actual profile image */}
                          <Image
                            source={{ uri: formData.image }}
                            className="w-16 h-16 rounded-full"
                            resizeMode="cover"
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                          />
                        </>
                      ) : (
                        <Image
                          source={require("@/assets/images/profile/profile1.webp")}
                          className="w-16 h-16 rounded-full"
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    <View style={{ marginLeft: wp(4) }}>
                      <Text className=" font-bold text-gray-900"
                      style={{  fontSize: hp(2) }}
                      >
                        {formData.firstName} {formData.lastName}
                      </Text>
                      <Text className=" text-gray-500 mt-1"
                      style={{  fontSize: hp(2) }}
                      >
                        {formData.empId}
                      </Text>
                    </View>
                  </View>

                  <View className="border-b border-gray-200 my-1 ml-4 mr-4" />

                  <View className="flex-1 p-5">
                    <TouchableOpacity
                      style={{ marginBottom: hp(2) }}
                      className="flex-row items-center"    
                      onPress={() =>navigation.navigate("Main", { screen: "ProfileScreen" })}
                    >
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5),
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/sidebar/user.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Profile
                      </Text>

                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center py-3"
                      onPress={() => setComplaintsExpanded(!complaintsExpanded)}
                    >
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5),
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/sidebar/complaints.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Complaints
                      </Text>

                      <Ionicons
                        name={
                          complaintsExpanded
                            ? "chevron-down-outline"
                            : "chevron-forward-outline"
                        }
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    {complaintsExpanded && (
                      <View style={{ paddingLeft: wp(15) }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("Main", {
                              screen: "AddComplaintScreen",
                            })
                          }
                        >
                          <Text className=" text-gray-700 font-bold mb-2"
                          style={{  fontSize: hp(2) }}
                          >
                            Report a Complaint
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ marginTop: hp(1), marginBottom: hp(1) }}
                          onPress={() =>navigation.navigate("Main", { screen: "ViewComplainScreen" })}
                        >
                          <Text className=" text-gray-700 font-bold"
                          style={{  fontSize: hp(2) }}
                          >
                            View Complaint History
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ marginBottom: hp(2), marginTop: hp(1) }}
                      className="flex-row items-center py-3"
                      onPress={() =>
                        navigation.navigate("ChangePasswordScreen")
                      }
                    >
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5),
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/sidebar/passwords.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Change Password
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    {isBiometricAvailable && (
                      <View
                        style={{ marginBottom: hp(2) }}
                        className="flex-row items-center py-3"
                      >
                        <View
                          style={{
                            width: hp(5),
                            height: hp(5),
                            borderRadius: hp(2.5),
                            backgroundColor: "#F4F9FB",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <FontAwesome5
                            name="fingerprint"
                            size={hp(2.5)}
                            color="#8F8F8F"
                          />
                        </View>

                        <Text
                          style={{
                            flex: 1,
                            marginLeft: wp(4),
                            fontSize: hp(2),
                          }}
                          className="text-gray-800"
                        >
                          Use Biometrics
                        </Text>

                        <Switch
                          value={isBiometricActive}
                          onValueChange={handleToggleBiometric}
                          trackColor={{ false: "#D1D5DB", true: "#6C3CD1" }}
                          thumbColor="#FFFFFF"
                          style={{ marginRight: wp(2) }}
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ marginBottom: hp(2) }}
                      className="flex-row items-center py-3"
                      onPress={() => navigation.navigate("PrivacyPolicy")}
                    >
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5),
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/sidebar/privacy-policy.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>
                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Privacy & Policy
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center py-3"
                      onPress={() => navigation.navigate("TermsConditions")}
                    >
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5),
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/sidebar/terms-conditions.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>
                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Terms & Conditions
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>


                    <View className="mb-4">
                      <View className="border-b border-gray-200 my-5" />
                      <TouchableOpacity
                        className="flex-row items-center"
                        onPress={handleLogout}
                      >
                        <View
                          className="mt-4"
                          style={{
                            width: hp(5),
                            height: hp(5),
                            borderRadius: hp(2.5),
                            backgroundColor: "#FFF2EE",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="log-out-outline"
                            size={hp(3)}
                            color="#FF3B30"
                          />
                        </View>
                        <Text
                          style={{
                            marginLeft: wp(4),
                            fontSize: hp(2),
                            color: "#FF3B30",
                            fontWeight: "bold",
                            marginTop: 13,
                          }}
                        >
                          Logout
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* App Version Footer */}
                    <View style={{ alignItems: "center", paddingVertical: hp(2), marginBottom: hp(2) }}>
                      <Text style={{ fontSize: hp(1.5), color: "#9CA3AF", fontWeight: "600" }}>
                        Version {Application.nativeApplicationVersion || "1.0.6"}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        )}
      </View>

    </KeyboardAvoidingView>
  );
};

export default SidebarScreen;
