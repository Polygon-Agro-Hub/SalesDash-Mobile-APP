import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  Keyboard, 
  KeyboardAvoidingView,    
  Platform, 
  FlatList, 
  Alert
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import CustomersScreenSkeleton from "../components/Skeleton/CustomerScreenSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";


type CustomersScreenNavigationProp = StackNavigationProp<RootStackParamList, "CustomersScreen">;

interface CustomersScreenProps {
  navigation: CustomersScreenNavigationProp;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  order: number;
  cusId: string;
  title: string;
  orderCount:number;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Add focus listener to clear search when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Clear search when returning to this screen
      setSearchQuery("");
      setFilteredCustomers(customers);
    });

    return unsubscribe;
  }, [navigation, customers]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Helper function to sort customers alphabetically by full name
  const sortCustomersByName = (customerList: Customer[]): Customer[] => {
    return [...customerList].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        setLoading(false);
        return;
      }
      
      const customersUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/customer/get-customers`;
      
      setTimeout(async () => {
        try {
          const response = await axios.get(customersUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          
          // Sort customers alphabetically by name
          const sortedCustomers = sortCustomersByName(response.data);

          console.log("--------------------------",sortedCustomers)
          
          setCustomers(sortedCustomers);
          setFilteredCustomers(sortedCustomers);
          setError(null);
        } catch (error) {
          console.error("Error fetching customers:", error);
          setError("Failed to fetch customers. Please try again.");
          Alert.alert("Error", "Failed to fetch customers");
        } finally {
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Error in fetchCustomers:", error);
      setLoading(false);
      setError("Failed to fetch customers. Please try again.");
      Alert.alert("Error", "Failed to fetch customers");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  
    const formattedQuery = query.startsWith("+94") ? query.replace("+94", "0") : query;
  
    if (query === "") {
      setFilteredCustomers(customers); 
    } else {
      const filteredData = customers.filter((customer) => {
        const formattedPhoneNumber = formatPhoneNumber(customer.phoneNumber);
        
        return (
          customer.firstName.toLowerCase().includes(query.toLowerCase()) ||
          customer.lastName.toLowerCase().includes(query.toLowerCase()) ||
          formattedPhoneNumber.includes(formattedQuery)
        );
      });
  
      // Keep the filtered results sorted alphabetically
      setFilteredCustomers(sortCustomersByName(filteredData));
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber.startsWith("+94")
      ? phoneNumber.replace("+94", "0")
      : phoneNumber;
  };
  
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers();
    }, 3000); 

    return () => clearTimeout(delay);
  }, []);
  
  const isEmpty = filteredCustomers.length === 0;

  return (
   <KeyboardAvoidingView 
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         enabled 
         className="flex-1"
       >
        
      <View className="bg-white flex-1">
        
        {/* Show Skeleton while loading */}
        {loading ? (
          <>
            <CustomersScreenSkeleton />
          </>
        ) : (
          <>
            {/* Header */}
            <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
              <Text className="text-white text-lg font-bold">
                Total Customers: <Text className="font-bold">{filteredCustomers.length}</Text>
              </Text>
            </LinearGradient>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mt-[-22px] mx-auto w-[90%] shadow-md">
              <TextInput 
                value={searchQuery}
                onChangeText={handleSearch} 
                placeholder="Search By Name, Phone Number" 
                placeholderTextColor="#6839CF" 
                className="flex-1 text-sm text-gray-700" 
                style={{ fontStyle: 'italic' }}
              />
              <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
            </View>

            {/* Floating Button */}
            {/* <TouchableOpacity
              style={{ zIndex: 1000 }}
              className="absolute bottom-20 right-6 bg-[#7743D4] w-14 h-14 rounded-full items-center justify-center shadow-lg mb-1"
              onPress={() => navigation.navigate("AddCustomersScreen")}
            >
              <Image source={require("../assets/images/plus.png")} className="w-6 h-6" resizeMode="contain" />
            </TouchableOpacity> */}
            {!isKeyboardVisible && (
              <TouchableOpacity
                style={{ zIndex: 1000 }}
                className="absolute bottom-20 right-6 bg-[#7743D4] w-14 h-14 rounded-full items-center justify-center shadow-lg mb-1"
                onPress={() => navigation.navigate("AddCustomersScreen")}
              >
                <Image source={require("../assets/images/plus.png")} className="w-6 h-6" resizeMode="contain" />
              </TouchableOpacity>
            )}

            <View style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }} className="flex-1">
              {error ? (
                <View className="flex-1 justify-center items-center px-4">
                  <Text className="text-red-500 text-center mt-4">{error}</Text>
                </View>
              ) : isEmpty ? (
                <View className="flex-1 justify-center items-center px-4 mt-[-20%]">
                  <Image source={require("../assets/images/searchr.png")} style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }} />
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  scrollEventThrottle={16}
                  renderItem={({ item }: { item: Customer }) => (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ViewCustomerScreen", {
                          name: item.firstName,
                          title: item.title,
                          number: item.phoneNumber,
                          customerId: item.cusId,
                          id: item.id,
                        })
                      }
                    >
                      <View className="bg-white shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg border border-gray-200">
                        <View>
                          <Text className="text-gray-700 font-semibold">{item.title}.{item.firstName} {item.lastName}</Text>
                          <Text className="text-gray-500 text-sm">{formatPhoneNumber(item.phoneNumber)}</Text>
                        </View>
                        {/* <Text className="text-gray-700 font-bold">#{item.orderCount}</Text> */}
                        <Text className="text-gray-700 font-semibold">#{item.orderCount < 10 ? `0${item.orderCount}` : item.orderCount}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CustomersScreen;

