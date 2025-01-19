import React from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import { RootStackParamList } from "./types"; 
import Navbar from "./Navbar"; 
import { LinearGradient } from "expo-linear-gradient";

// Define navigation prop type
type CustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CustomersScreen"
>;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  return (
    <View className="flex-1 bg-white">
      {/* Header Section */}
      <LinearGradient
        colors={["#854BDA", "#6E3DD1"]}
        className="h-24  shadow-md px-6 pt-6"
      >
        {/* Title Centered */}
        <Text className="text-white text-lg font-bold text-center">
          Total Customers: <Text className="font-normal">0</Text>
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-4 py-2 rounded-full mt-4 mx-auto w-[90%] shadow-sm">
          <TextInput
            placeholder="Search By Name, Phone Number"
            placeholderTextColor="#A3A3A3"
            className="flex-1 text-sm text-gray-800"
          />
          <Image
            source={require("../assets/images/search.png")} 
            className="w-8 h-8"
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Empty State */}
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={require("../assets/images/searchr.png")} 
          className="w-64 h-64 mb-6"
          resizeMode="contain"
        />
        <Text className="text-gray-500 text-lg text-center">
          No customers found
        </Text>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg mb-16"
        onPress={() => console.log("Add Customer")}
      >
        <Image
          source={require("../assets/images/plus.png")} 
          className="w-6 h-6"
          resizeMode="contain"
        />
      </TouchableOpacity>



      <Navbar navigation={navigation} activeTab="CustomersScreen" />
    </View>
  );
};

export default CustomersScreen;
