import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { RouteProp, useFocusEffect } from "@react-navigation/native";

type OtpSuccesfulScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OtpSuccesfulScreen"
>;

interface OtpSuccesfulScreenProps {
  navigation: OtpSuccesfulScreenNavigationProp;
  route: RouteProp<RootStackParamList, "OtpSuccesfulScreen">;
}

const OtpSuccesfulScreen: React.FC<OtpSuccesfulScreenProps> = ({
  route,
  navigation,
}) => {
  const { customerId, name, number, title, id } = route.params || {};

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
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white items-center">
        <View
          style={{ paddingHorizontal: 20, paddingVertical: 20 }}
          className="flex-1 justify-center w-full max-w-[500px]"
        >
          {/* Success Image - Centered */}
          <View className="items-center justify-center mb-6">
            <Image
              source={require("@/assets/images/otp/sucsse.webp")}
              style={{
                width: 180,
                height: 180,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Text Section - Centered */}
          <View className="items-center px-4">
            <Text className="text-black text-center font-bold text-3xl">
              Successfully Verified!
            </Text>
            <Text className="text-[#747474] text-center mt-2 text-base">
              Customer's Mobile number has been verified!
            </Text>
          </View>

          {/* Go to Profile Button - Centered */}
          <View className="items-center mt-24">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Main" as any, {
                  screen: "ViewCustomerScreen",
                  params: {
                    customerId: String(customerId),
                    id: String(id || ""),
                    name: name || "",
                    title: title || "",
                    number: number || "",
                  },
                })
              }
              activeOpacity={0.7}
              style={{
                width: "50%",
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
                colors={["#545454", "#808080"]}
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
                  Go to Profile
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View className="items-center mt-5">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ExcludeListAdd", {
                  customerId: Number(customerId),
                })
              }
              activeOpacity={0.7}
              style={{
                width: "50%",
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
                  Order Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpSuccesfulScreen;