import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  Linking,
  ScrollView,
  Platform,
  StatusBar,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "expo-camera";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

type CameraAccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CameraAccess"
>;

interface CameraAccessProps {
  navigation?: CameraAccessNavigationProp;
  route?: {
    params?: {
      returnScreen?: keyof RootStackParamList;
      returnParams?: any;
      blockBackNavigation?: boolean;
    };
  };
  onRequestPermission?: () => Promise<any> | void;
  onPermissionGranted?: () => void;
  onClose?: () => void;
  returnScreen?: keyof RootStackParamList;
  returnParams?: any;
  onBackPress?: () => void;
  blockBackNavigation?: boolean;
}

const cameraImage = require("@/assets/images/permission/camera.webp");

const CameraAccess: React.FC<CameraAccessProps> = ({
  navigation,
  route,
  onRequestPermission,
  onPermissionGranted,
  onClose,
  returnScreen = "Main",
  returnParams,
  onBackPress,
  blockBackNavigation = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const targetReturnScreen = route?.params?.returnScreen || returnScreen;
  const targetReturnParams = route?.params?.returnParams || returnParams;
  const isBackBlocked =
    route?.params?.blockBackNavigation ?? blockBackNavigation;

  const isScreenTooLong =
    scrollViewHeight > 0 &&
    contentHeight > 0 &&
    scrollViewHeight >= contentHeight + 20;

  const navigateForward = () => {
    if (navigation) {
      if (targetReturnParams) {
        navigation.navigate(targetReturnScreen as any, targetReturnParams);
      } else {
        navigation.navigate(targetReturnScreen as any);
      }
    }
  };

  const handleDenyOrClose = () => {
    if (onClose) {
      onClose();
    } else if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigateForward();
    }
  };

  useEffect(() => {
    const handleHardwareBackPress = () => {
      if (isBackBlocked) {
        return true;
      }
      handleDenyOrClose();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress
    );
    return () => subscription.remove();
  }, [isBackBlocked, navigation, onClose, onBackPress, targetReturnScreen]);

  const requestCameraPermission = async () => {
    setIsLoading(true);
    try {
      let isGranted = false;
      let isDenied = false;

      if (onRequestPermission) {
        const response = await onRequestPermission();
        if (response && typeof response === "object") {
          isGranted = Boolean(response.granted || response.status === "granted");
          isDenied = !isGranted && response.status === "denied";
        } else {
          const check = await Camera.getCameraPermissionsAsync();
          isGranted = Boolean(check.granted || check.status === "granted");
          isDenied = check.status === "denied";
        }
      } else {
        const current = await Camera.getCameraPermissionsAsync();
        let status = current.status;
        if (status !== "granted") {
          const response = await Camera.requestCameraPermissionsAsync();
          status = response.status;
        }
        isGranted = status === "granted";
        isDenied = status === "denied";
      }

      if (isGranted) {
        if (onPermissionGranted) {
          onPermissionGranted();
        } else if (navigation) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigateForward();
          }
        }
      } else if (isDenied) {
        Alert.alert(
          "Permission Denied",
          "Camera access is required. Please enable it in settings.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: handleDenyOrClose,
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      Alert.alert(
        "Error",
        "Unable to request camera permission. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView
        className="flex-1 px-5"
        onLayout={(e: LayoutChangeEvent) =>
          setScrollViewHeight(e.nativeEvent.layout.height)
        }
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isScreenTooLong ? "center" : "flex-start",
          paddingBottom: isScreenTooLong
            ? 20
            : Platform.OS === "android"
              ? 75
              : 55,
          paddingTop: isScreenTooLong ? 0 : 20,
        }}
        showsVerticalScrollIndicator={false}
        bounces={!isScreenTooLong}
      >
        <View
          onLayout={(e: LayoutChangeEvent) =>
            setContentHeight(e.nativeEvent.layout.height)
          }
          className="w-full"
        >
          {/* Centered Image */}
          <View className="items-center justify-center mt-2 mb-4">
            <Image
              source={cameraImage}
              className="w-32 h-32"
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Why SalesDash Uses Camera
          </Text>

          {/* Intro */}
          <Text className="text-gray-300 text-sm text-center mb-5 leading-5">
            SalesDash requires camera access to enable the following operational features:
          </Text>

          {/* Feature 1: Profile & Shop Document Photos */}
          <View className="bg-[#1E1E1E] p-4 rounded-xl mb-3 border border-gray-800 flex-row items-start">
            <View className="bg-[#6839CF]/20 p-2.5 rounded-lg mr-3 mt-0.5 border border-[#6839CF]/40">
              <MaterialCommunityIcons
                name="camera-account"
                size={24}
                color="#874DDB"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base mb-1">
                Profile & Shop Document Photos
              </Text>
              <Text className="text-gray-400 text-xs leading-4">
                Capture real-time photos for sales agent profile updates, customer storefront verification, and document attachments.
              </Text>
            </View>
          </View>

          {/* Feature 2: Delivery Proof & Complaint Photos */}
          <View className="bg-[#1E1E1E] p-4 rounded-xl mb-4 border border-gray-800 flex-row items-start">
            <View className="bg-[#6839CF]/20 p-2.5 rounded-lg mr-3 mt-0.5 border border-[#6839CF]/40">
              <MaterialCommunityIcons
                name="camera-outline"
                size={24}
                color="#874DDB"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base mb-1">
                Delivery Proof & Complaint Photos
              </Text>
              <Text className="text-gray-400 text-xs leading-4">
                Capture invoice receipts, delivery proof photos, and real-time product issue condition when logging customer complaints.
              </Text>
            </View>
          </View>

          {/* Privacy Note */}
          <View className="bg-[#1F1E1A] p-3 rounded-lg mb-6 border border-[#6839CF]/30 flex-row items-start">
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#874DDB"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text className="text-gray-300 text-xs flex-1 leading-4">
              Camera access is only active while taking photos or capturing verification images. No photos or videos are captured without your explicit tap.
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            className={`items-center w-full mt-4 ${
              isScreenTooLong ? "mb-2" : "mb-8"
            }`}
          >
            <TouchableOpacity
              onPress={requestCameraPermission}
              activeOpacity={0.8}
              disabled={isLoading}
              className="w-full mb-3"
              style={{ borderRadius: 999, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-extrabold text-base tracking-wide">
                    {isLoading ? "Requesting..." : "Agree & Continue"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDenyOrClose}
              activeOpacity={0.7}
              className="py-3 px-6 items-center justify-center"
            >
              <Text className="text-gray-400 font-semibold text-sm">
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CameraAccess;
