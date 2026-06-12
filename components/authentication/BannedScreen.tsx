import React, { useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type BannedScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BannedScreen"
>;

interface BannedScreenProps {
  navigation: BannedScreenNavigationProp;
  route: RouteProp<RootStackParamList, "BannedScreen">;
}

const BannedScreen: React.FC<BannedScreenProps> = ({
  route,
  navigation,
}) => {
  const { statusType, message } = route.params || {};

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

  const handleBackToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "authToken",
        "tokenStoredTime",
        "tokenExpirationTime",
        "userToken",
      ]);
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    } catch (e) {
      console.error("Error logging out from banned screen:", e);
      navigation.navigate("LoginScreen");
    }
  };

  let title = "Access Denied";
  let description = "Your account has been rejected or is not approved.";

  if (statusType === "rejected") {
    title = "Account Rejected";
    description = "Your account approval has been revoked by the administrator.";
  } else if (statusType === "not_approved") {
    title = "Account Not Approved";
    description = "Your account approval has been revoked by the administrator.";
  } else if (statusType === "pending") {
    title = "Pending Verification";
    description = "Your account status is pending verification.";
  }

  if (message) {
    description = message;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white items-center">
        <View
          style={{ paddingHorizontal: 20, paddingVertical: 20 }}
          className="flex-1 justify-center w-full max-w-[500px]"
        >
          {/* Lottie Animation - Centered */}
          <View className="items-center justify-center mb-6">
            <LottieView
              source={require("@/assets/json/banned.json")}
              style={{
                width: 180,
                height: 180,
              }}
              autoPlay
              loop
            />
          </View>

          {/* Text Section - Centered */}
          <View className="items-center px-4">
            <Text className="text-black text-center font-bold text-3xl">
              {title}
            </Text>
            <Text className="text-[#747474] text-center mt-4 text-base">
              {description}
            </Text>
            <Text className="text-[#747474] text-center mt-2 text-base font-semibold">
              Please contact Polygon Customer Support for further details.
            </Text>
          </View>

          {/* Button - Centered */}
          <View className="items-center mt-20">
            <TouchableOpacity
              onPress={handleBackToLogin}
              activeOpacity={0.7}
              style={{
                width: "60%",
                borderRadius: 30,
                backgroundColor: "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-[50px] items-center justify-center rounded-full"
                style={{
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 3.84,
                  overflow: "hidden",
                }}
              >
                <Text className="text-center text-white font-bold text-lg">
                  Back to Login
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default BannedScreen;
