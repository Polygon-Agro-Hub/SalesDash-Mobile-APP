import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Entypo } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

interface BackButtonProps {
  navigation: any;
}

const BackButton: React.FC<BackButtonProps> = ({ navigation }) => {
  return (
    <TouchableOpacity
      style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
      onPress={() => navigation.goBack()}
    >
      <View className="w-10 h-10 bg-[#F6F6F680] rounded-full justify-center items-center ml-3">
        <Entypo
          name="chevron-left"
          size={25}
          color={"black"}
          style={{
            borderRadius: 50,
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default BackButton;
