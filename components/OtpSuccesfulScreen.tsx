import React from "react";
import { View, Text, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { ScrollView } from "react-native-gesture-handler";
import { RouteProp } from '@react-navigation/native';

type OtpSuccesfulScreenNavigationProp = StackNavigationProp<RootStackParamList, "OtpSuccesfulScreen">;

interface OtpSuccesfulScreenProps {
  navigation: OtpSuccesfulScreenNavigationProp;
  route: RouteProp<RootStackParamList, "OtpSuccesfulScreen">;
}

const OtpSuccesfulScreen: React.FC<OtpSuccesfulScreenProps> = ({ route, navigation }) => {

  const { customerId} = route.params || {};
  
  console.log("Received customer ID:", customerId);


  return (
    <KeyboardAvoidingView 
                                                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                                                        enabled 
                                                        className="flex-1"
                                                      >
    <View
     
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1 bg-white px-3"
      keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-white flex-row items-center h-17 shadow-lg px-1">
          {/* Back Button */}
          <BackButton navigation={navigation} />
          {/* Title */}
        
        </View>

        {/* Main Content */}
        <View style={{ paddingHorizontal: wp(5), paddingVertical: hp(1) }} className="flex-1">
          {/* Illustration */}
          <View className="flex items-center justify-center w-50 h-40 mb-10 pt-24 mx-12">
            <Image
              source={require("../assets/images/sucsse.png")}
              className="w-30 h-30"
              resizeMode="contain"
            />
          </View>

<View className="px-2">
<Text 
style={{ fontSize: 20}}
className="text-black text-center mt-12 font-bold ">
Successfully Verified!
      </Text>
      <Text 
      style={{ fontSize: 17}}
      className="text-[#747474] text-center mt-2 ">
  Customer Phone number has been verified!
</Text>
</View>

          <LinearGradient
            colors={["#6839CF", "#874DDB"]}
            className="py-2 px-10 rounded-lg items-center mt-[55%] mb-[5%] mr-[20%] ml-[20%] rounded-3xl h-15"
          >
<TouchableOpacity onPress={() => navigation.navigate("SelectOrderType" as any, {
  id: customerId // Pass customerId as id parameter
})}>
  <Text className="text-center text-white font-bold text-lg">Order Now</Text>
</TouchableOpacity>
          </LinearGradient>
        </View>

        </ScrollView>
      </View>
      </KeyboardAvoidingView>
   
  );
};

export default OtpSuccesfulScreen;
