import React from "react";
import { View, Text, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import Navbar from "./Navbar";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const OtpSuccesfulScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View
     
      className="flex-1 bg-white"
    >
      <View className="flex-1 bg-white px-3">
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


          {/* Verify Button */}
          <LinearGradient
            colors={["#6839CF", "#874DDB"]}
            className="py-3 px-14 rounded-lg items-center mt-[55%] mb-[5%] mr-[20%] ml-[20%] rounded-3xl h-15"
          >
            <TouchableOpacity>
              <Text className="text-center text-white font-bold">Order Now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

       </View>
        <Navbar navigation={navigation} activeTab="CustomersScreen" />
      </View>
   
  );
};

export default OtpSuccesfulScreen;
