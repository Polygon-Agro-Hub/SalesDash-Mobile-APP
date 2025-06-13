import React from "react";
import { TouchableOpacity , View, } from "react-native";
import { AntDesign } from "@expo/vector-icons"; 
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";


  interface BackButtonProps {
    navigation: any;
    
  }
const BackButton: React.FC<BackButtonProps> = ({ navigation }) => {
    return(
        <TouchableOpacity 
        style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
       onPress={() => navigation.goBack()}>
         <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
           <AntDesign name="left" size={20} color="black" />
         </View>
       </TouchableOpacity>
    );
}

export default BackButton;



////