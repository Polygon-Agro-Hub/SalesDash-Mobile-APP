import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// Define navigation prop type
type CustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CustomersScreen"
>;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const customers = [
    {
      id: "1",
      customerID: "240001",
      name: "Nimal",
      phoneNumber: "011223355",
      order: "2",
      orders: [
        {
          id: "1",
          
          orderNumber: "#24123105",
          schedule: "2024/12/31",
          time: "12PM - 4PM",
          status: "Delivered",
          type: "One Time", // Filter type
        },
        {
          id: "2",
          
          orderNumber: "#24121901",
          schedule: "2024/12/29",
          time: "12PM - 4PM",
          status: "On the way",
          type: "Once a Week", // Filter type
        },
        {
          id: "3",
          
          orderNumber: "#24121902",
          schedule: "2024/12/29",
          time: "12PM - 4PM",
          status: "Processing",
          type: "Weekly", // Filter type
        },
        {
          id: "4",
        
          orderNumber: "#24121903",
          schedule: "2024/12/30",
          time: "12PM - 4PM",
          status: "Processing",
          type: "One Time", // Filter type
        },
      ],
    },
    {
      id: "2",
      customerID: "240002",
      name: "Kamal",
      phoneNumber: "011998877",
      order: "4",
      orders: [
        {
          id: "1",
          
          orderNumber: "#24123105",
          schedule: "2024/12/31",
          time: "12PM - 4PM",
          status: "Delivered",
          type: "One Time", // Filter type
        },
        {
          id: "2",
          
          orderNumber: "#24121901",
          schedule: "2024/12/29",
          time: "12PM - 4PM",
          status: "On the way",
          type: "Once a Week", // Filter type
        },
        {
          id: "3",
          
          orderNumber: "#24121902",
          schedule: "2024/12/29",
          time: "12PM - 4PM",
          status: "Processing",
          type: "Weekly", // Filter type
        },
   
      ],
    },
  ];

  const isEmpty = customers.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <LinearGradient
          colors={["#854BDA", "#6E3DD1"]}
          className="h-20 shadow-md px-4 pt-19 items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">
            Total Customers: <Text className="font-bold ">{customers.length}</Text>
          </Text>
        </LinearGradient>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mt-[-22] mx-auto w-[90%] shadow-md">
          <TextInput
            placeholder="Search By Name, Phone Number"
            placeholderTextColor="#A3A3A3"
            className="flex-1 text-sm text-gray-700"
          />
          <Image
            source={require("../assets/images/search.png")}
            className="w-6 h-6"
            resizeMode="contain"
          />
        </View>

        {/* Floating Add Button */}
        <TouchableOpacity
          className="absolute bottom-10 right-6 bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          onPress={() => console.log("Add Customer")}
        >
          <Image
            source={require("../assets/images/plus.png")}
            className="w-6 h-6"
            resizeMode="contain"
          />
        </TouchableOpacity>

        {isEmpty ? (
          <View className="flex-1 justify-center items-center px-4">
            <Image
              source={require("../assets/images/searchr.png")}
              style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }}
            />
            <Text className="text-black text-center mt-4">No Customers found</Text>
          </View>
        ) : (
          <View className="flex-1 px-4 pt-4">
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("ViewCustomerScreen", { customer: item })}
                >
                  <View className="bg-white shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg border border-gray-200">
                    <View>
                      <Text className="text-gray-700 font-semibold">{item.name}</Text>
                      <Text className="text-gray-500 text-sm">{item.phoneNumber}</Text>
                    </View>
                    <Text className="text-gray-700 font-bold">#{item.order}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Hide Navbar when keyboard is visible */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  );
};




export default CustomersScreen;
