import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import BackButton from "./BackButton";

type SelectOrderTypeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SelectOrderType"
>;

interface SelectOrderTypeProps {
  navigation: SelectOrderTypeNavigationProp;
  route: {
    params: {
      id: string; 
    };
  };
}

const SelectOrderType: React.FC<SelectOrderTypeProps> = ({ navigation, route }) => {
  // Get the ID from route params
  const { id } = route.params || {};
  console.log("ll",id)

  return (
    <View className="flex-1 bg-white">
     
      <View className="flex-row items-center h-16 shadow-md px-4 bg-white">
        <BackButton navigation={navigation} />
        <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7">
          Select Order Type
        </Text>
      </View>
      
      <ScrollView>
        <View className="flex-1 bg-white items-center justify-center relative">
         
          <Image
            source={require("../assets/images/cart.webp")}
            className="w-[70%] h-40 mt-[20%]"
            resizeMode="contain"
          />
          
          
          <TouchableOpacity 
            className="w-4/5 bg-white py-4 rounded-2xl my-2 shadow-xl items-center mt-5"
            onPress={() => navigation.navigate("CreateCustomPackage" as any, { id })}
          >
            <Text className="text-lg font-semibold text-[#6839CF] text-center">
              Create{"\n"}Custom Package
            </Text>
          </TouchableOpacity>
    
          <TouchableOpacity 
            className="w-4/5 bg-white py-4 rounded-2xl my-2 shadow-xl items-center"
            onPress={() => navigation.navigate("OrderScreen" as any , { id })}
          >
            <Text className="text-lg font-semibold text-[#6839CF] text-center">
              Select{"\n"}Package
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SelectOrderType;