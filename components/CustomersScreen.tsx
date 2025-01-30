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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";

// Define navigation prop type
type CustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "CustomersScreen">;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Phone number validation regex
  const phoneRegex = /^[+]?[0-9]{1,4}?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}$/;

  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Validate phone number and email
  const validatePhoneNumber = (phone: string) => phoneRegex.test(phone);
  const validateEmail = (email: string) => emailRegex.test(email);

  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch customers from the backend when the component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${environment.API_BASE_URL}api/customer/get-customers`);
        const validCustomers = response.data.filter((customer: any) => {
          return validatePhoneNumber(customer.phoneNumber) && validateEmail(customer.email);
        });
        setCustomers(validCustomers);
        setError(null);
      } catch (err) {
        setError("Failed to fetch customers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchCustomers();
    return () => {
      setLoading(false);
      setError(null); // Optional: Cleanup if the component unmounts
    };
  }, []);
  

  const isEmpty = customers.length === 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className=" bg-white flex-1">
        {/* Header Section */}
        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
          <Text className="text-white text-lg font-bold mt-[-9]">
            Total Customers: <Text className="font-bold ">{customers.length}</Text>
          </Text>
        </LinearGradient>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mt-[-22] mx-auto w-[90%] shadow-md">
          <TextInput placeholder="Search By Name, Phone Number" placeholderTextColor="#A3A3A3" className="flex-1 text-sm text-gray-700" />
          <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
        </View>

        {/* Floating Add Button */}
        <TouchableOpacity
          style={{ zIndex: 1000 }}
          className="absolute bottom-[10] right-6 bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg mb-1"
          onPress={() => navigation.navigate("AddCustomersScreen")}
        >
          <Image source={require("../assets/images/plus.png")} className="w-6 h-6" resizeMode="contain" />
        </TouchableOpacity>

        {/* Display Loading, Error, or Customer List */}
        <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }} className="flex-1">
          {loading ? (
            <View className="flex-1 justify-center items-center px-4">
              {/* <Image source={require("../assets/images/loading.png")} style={{ width: wp("20%"), height: hp("10%"), resizeMode: "contain" }} /> */}
              <Text className="text-black text-center mt-4">Loading Customers...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-red-500 text-center mt-4">{error}</Text>
            </View>
          ) : isEmpty ? (
            <View className="flex-1 justify-center items-center px-4">
              <Image source={require("../assets/images/searchr.png")} style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }} />
              <Text className="text-black text-center mt-4">No Customers found</Text>
            </View>
          ) : (
            <View className="flex-1 px-4 pt-4">
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => navigation.navigate("ViewCustomerScreen",{
                    name:item.firstName,
                    number:item.phoneNumber,
                    customerId:item.cusId,
                  })}>
                    <View className="bg-white shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg border border-gray-200">
                      <View>
                        <Text className="text-gray-700 font-semibold">{item.firstName} {item.lastName}</Text>
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
      </View>

      {/* Hide Navbar when keyboard is visible */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default CustomersScreen;
