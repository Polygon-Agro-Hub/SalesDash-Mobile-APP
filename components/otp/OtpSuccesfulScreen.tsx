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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
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
  const { customerId } = route.params || {};

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
      <View className="flex-1 bg-white">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{ paddingHorizontal: wp(5), paddingVertical: hp(2) }}
            className="flex-1 justify-center"
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
              <Text className="text-black text-center font-bold text-xl">
                Successfully Verified!
              </Text>
              <Text className="text-[#747474] text-center mt-2 text-base">
                Customer Phone number has been verified!
              </Text>
            </View>

            {/* Button - Centered */}
            <View className="items-center mt-24">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Main", {
                    screen: "ExcludeListAdd",
                    params: { customerId: customerId },
                  })
                }
                className="w-[60%]"
              >
                <LinearGradient
                  colors={["#6839CF", "#874DDB"]}
                  className="py-3 px-6 items-center rounded-3xl"
                >
                  <Text className="text-center text-white font-bold text-lg">
                    Order Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpSuccesfulScreen;
