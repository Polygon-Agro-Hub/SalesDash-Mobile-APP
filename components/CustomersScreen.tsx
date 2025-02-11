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
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import LottieView from "lottie-react-native";

// Define navigation prop type
type CustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "CustomersScreen">;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${environment.API_BASE_URL}api/customer/get-customers`);
        setTimeout(() => {
          setCustomers(response.data);
          setError(null);
          setLoading(false);
        }, 3000); // Ensure loading lasts at least 3 seconds
      } catch (err) {
        setTimeout(() => {
          setError("Failed to fetch customers. Please try again.");
          setLoading(false);
        }, 3000);
      }
    };

    fetchCustomers();
    const interval = setInterval(fetchCustomers, 3000);
    return () => clearInterval(interval);
  }, []);

  const isEmpty = customers.length === 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className=" bg-white flex-1">
        {loading && (
          <Modal transparent animationType="fade">
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <LottieView source={require("../assets/images/loading.json")} autoPlay loop style={{ width: 100, height: 100 }} />
            </View>
          </Modal>
        )}

        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
          <Text className="text-white text-lg font-bold mt-[-9]">
            Total Customers: <Text className="font-bold ">{customers.length}</Text>
          </Text>
        </LinearGradient>

        <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mt-[-22] mx-auto w-[90%] shadow-md">
          <TextInput placeholder="Search By Name, Phone Number" placeholderTextColor="#A3A3A3" className="flex-1 text-sm text-gray-700" />
          <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
        </View>

        <TouchableOpacity
          style={{ zIndex: 1000 }}
          className="absolute bottom-[10] right-6 bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg mb-1"
          onPress={() => navigation.navigate("AddCustomersScreen")}
        >
          <Image source={require("../assets/images/plus.png")} className="w-6 h-6" resizeMode="contain" />
        </TouchableOpacity>

        <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }} className="flex-1">
          {error ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-red-500 text-center mt-4">{error}</Text>
            </View>
          ) : isEmpty ? (
            <View className="flex-1 justify-center items-center px-4">
              <Image source={require("../assets/images/searchr.png")} style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }} />
              <Text className="text-black text-center mt-4">No Customers found</Text>
            </View>
          ) : (
            <View className="flex-1 px-2 pt-4">
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ViewCustomerScreen", {
                        name: item.firstName,
                        number: item.phoneNumber,
                        customerId: item.cusId,
                        id: item.id,
                      })
                    }
                  >
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
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default CustomersScreen;
