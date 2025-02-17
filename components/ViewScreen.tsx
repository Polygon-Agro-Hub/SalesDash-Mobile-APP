import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack"; 
import { RootStackParamList } from "./types"; 
import Navbar from "./Navbar"; 
import BackButton from "./BackButton";

type ViewScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewScreen">;

interface ViewScreenProps {
  navigation: ViewScreenNavigationProp;
}

const ViewScreen: React.FC<ViewScreenProps> = ({ navigation }) => {
  const items = [
    { name: "Orange", quantity: "500g" },
    { name: "Grapes", quantity: "100g" },
    { name: "Strawberry", quantity: "100g" },
    { name: "Papaya", quantity: "100g" },
    { name: "Lemon", quantity: "400g" },
    { name: "Apple", quantity: "100g" },
    { name: "Watermelon", quantity: "500g" },
    { name: "Banana", quantity: "1kg" },
    { name: "Woodapple", quantity: "100g" },
    { name: "Guava", quantity: "250g" },
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Top Section with Background Image */}
      
      <ImageBackground
        source={require("../assets/images/Union.png")}
        className="h-64 rounded-b-3xl shadow-lg bg-[#E6DBF766]"
        resizeMode="cover"
      >
<View className="ml-2">
  <BackButton navigation={navigation} />
  </View>
          <Image
            source={require("../assets/images/viewPack.png")} // Replace with your product image path
            className="w-64 h-64 self-center mb-2 mt-[-20%]"
            resizeMode="contain"
          />

      </ImageBackground>

      {/* Scrollable Details Section */}
      <ScrollView className="flex-1 bg-white rounded-t-3xl -mt-7 px-6 pt-6 shadow-lg">
        {/* Title and Price */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-purple-600">Fruity Pack</Text>
          <Text className="text-lg font-bold text-gray-800">Rs.1800</Text>
        </View>

        {/* Description */}
        <View className="flex-row items-start mb-6">
          {/* Vertical Line */}
          <View className="bg-purple-600 w-1 mr-3" style={{ height: "100%" }}></View>
          
          {/* Paragraph Text */}
          <Text className="text-gray-600 text-sm leading-6 mr-2">
            Enjoy a handpicked mix of premium fruits, customized for one person's
            weekly needs. Perfectly portioned, always fresh, and packed for
            convenience. Stay healthy, energized, and satisfied all week long.
            Order your FreshWeek Personal Fruit Pack today! 🍎🍇
          </Text>
        </View>

        {/* Person and Duration */}
        <View className="items-center mb-6">
  <TouchableOpacity className="bg-[#F5F1FC] flex-row items-center justify-center px-8 py-4 rounded-full">
    <View className="bg-white rounded-full p-2">
      <Image
        source={require("../assets/images/Bell Service.png")} 
        className="w-5 h-5"
        resizeMode="contain"
      />
    </View>
    <Text className="text-purple-600 text-base font-medium mr-6 ml-1"> 01 person</Text> 

    <View className="bg-white rounded-full p-2 ml-8 mt-[-2]">
      <Image
        source={require("../assets/images/Clock.png")}
        className="w-5 h-5"
        resizeMode="contain"
      />
    </View>
    <Text className="text-purple-600 text-base font-medium ml-1">01 week</Text>
  </TouchableOpacity>
</View>

        {/* List Section */}
        <Text className="text-gray-800 text-lg font-bold p-4">All (10 items)</Text>
        {items.map((item, index) => (
          <View
            key={index}
            className="flex-row justify-between items-center border-b border-gray-200 py-3 px-4"
          >
            <Text className="text-gray-700 text-sm">{item.name}</Text>
            <Text className="text-gray-500 text-sm">{item.quantity}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Navbar */}
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default ViewScreen;
