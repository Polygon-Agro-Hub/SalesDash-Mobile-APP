import { View, Image, Text, Alert } from "react-native";
import React, { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types/types";
import environment from "@/environment/environment";
import socketService from "@/services/socket/socket.service";
import pushNotificationService from "@/services/notification/pushNotification.service";

type SplashNavigationProp = StackNavigationProp<RootStackParamList, "Splash">;

interface SplashProps {
  navigation: SplashNavigationProp;
}

const Splash: React.FC<SplashProps> = ({ navigation }) => {
  // Function to handle logout and alert when 14-day token has expired
  const handleExpiredToken = async () => {
    await AsyncStorage.multiRemove([
      "authToken",
      "refreshToken",
      "tokenStoredTime",
      "tokenExpirationTime",
      "userToken",
    ]);
    Alert.alert("Token Expired", "Your token has expired. Please log in again.");
    navigation.navigate("LoginScreen");
  };

  // Attempt to refresh token using stored refresh token
  const tryRefreshToken = async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
      if (!storedRefreshToken) return null;

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success && data.data?.token) {
        await AsyncStorage.setItem("authToken", data.data.token);
        if (data.data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
        }
        return data.data.token;
      }
      return null;
    } catch (err) {
      console.warn("Splash refresh token error:", err);
      return null;
    }
  };

  // Function to check password update status
  const checkPasswordUpdateStatus = async (
    authToken: string,
    hasRetried = false
  ) => {
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/user/password-update`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      // If access token is expired (401), attempt to silently refresh with refreshToken
      if (response.status === 401 && !hasRetried) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          return checkPasswordUpdateStatus(newToken, true);
        } else {
          // If 14 days passed or refresh token is invalid, show expired token alert
          return handleExpiredToken();
        }
      }

      // First check the response content type
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        await response.text();
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data.passwordUpdate === 1) {
          try {
            const hasAsked = await AsyncStorage.getItem(
              "hasAskedNotificationPermission"
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
          socketService.connect().catch(() => {});
          socketService.checkNewNotifications().catch(() => {});
          pushNotificationService.registerPushTokenAsync().catch(() => {});
          navigation.navigate("Main", { screen: "DashboardScreen" });
        } else {
          await AsyncStorage.multiRemove([
            "authToken",
            "refreshToken",
            "tokenStoredTime",
            "tokenExpirationTime",
            "userToken",
          ]);
          navigation.navigate("LoginScreen");
        }
      } else {
        return handleExpiredToken();
      }
    } catch (error) {
      console.error("Error checking password status:", error);
      await AsyncStorage.multiRemove([
        "authToken",
        "refreshToken",
        "tokenStoredTime",
        "tokenExpirationTime",
        "userToken",
      ]);
      navigation.navigate("LoginScreen");
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Check if auth token exists
        const authToken = await AsyncStorage.getItem("authToken");

        // Timer to navigate after 3 seconds
        setTimeout(async () => {
          if (authToken) {
            // Validate token status directly via backend API (expiration handled on server)
            await checkPasswordUpdateStatus(authToken);
          } else {
            const refreshToken = await AsyncStorage.getItem("refreshToken");
            if (refreshToken) {
              const newToken = await tryRefreshToken();
              if (newToken) {
                await checkPasswordUpdateStatus(newToken, true);
                return;
              } else {
                await handleExpiredToken();
                return;
              }
            }
            navigation.navigate("LoginScreen");
          }
        }, 3000);
      } catch (error) {
        console.error("Error checking authentication token:", error);
        // If there's an error, navigate to login as fallback
        setTimeout(() => {
          navigation.navigate("LoginScreen");
        }, 3000);
      }
    };

    checkToken();
  }, [navigation]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#854BDA", "#6E3DD1"]}
        style={{ flex: 1, position: "absolute", width: "100%", height: "100%" }}
      />
      {/* Background Image */}
      <Image
        source={require("@/assets/images/splash/splash.webp")}
        className="absolute w-full h-full"
        resizeMode="cover"
      />
      {/* Logo and App Name */}
      <View className="flex-1 justify-center items-center">
        <Image
          source={require("@/assets/images/public/logo.webp")}
          className="w-60 h-60"
          resizeMode="contain"
        />
      </View>

      {/* Powered By Text at Bottom */}
      <View className="absolute bottom-10 w-full items-center">
        <Text className="text-white text-md font-medium opacity-80">
          Powered By Polygon
        </Text>
      </View>
    </View>
  );
};

export default Splash;
