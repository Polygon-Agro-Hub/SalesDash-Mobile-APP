import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  FlatList,
  Keyboard,
  ActivityIndicator
} from "react-native";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "react-native-screens";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

type ExcludeListAddNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeListAdd"
>;

// Define proper interfaces for customer data and route params
interface CustomerData {
  name?: string;
  title?: string;
  number?: string;
  cusId?: number;
  id?: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

interface RouteParams {
  customerId: number;
  name?: string;
  title?: string;
  number?: string;
  id?: number;
}

interface ExcludeListAddProps {
  navigation: ExcludeListAddNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeListAdd">;
}

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId, name, title, number, id } = (route.params as RouteParams) || {};
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerDataLoading, setCustomerDataLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
    const [searchError, setSearchError] = useState<string | null>(null);
  
  console.log("selected Crop", selectedCrops);
  console.log("Customer Data:", customerData);
  
  const toggleSelect = (id: number) => {
    setSelectedCrops(
      (prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((cropId) => cropId !== id)
          : [...prevSelected, id]
    );
  };

  // Get current customer data (either from state or route params)
  const getCurrentCustomerData = () => {
    if (customerData) {
      return {
        name: customerData.name || customerData.firstName || name || "",
        title: customerData.title || title || "",
        number: customerData.number || customerData.phoneNumber || number || "",
        id: customerData.id?.toString() || id?.toString() || "",
        customerId: customerData.cusId?.toString() || customerId.toString()
      };
    }
    return {
      name: name || "",
      title: title || "",
      number: number || "",
      id: id?.toString() || "",
      customerId: customerId.toString()
    };
  };

  // Define handleBackPress outside of useFocusEffect so it can be reused
  const handleBackPress = useCallback(() => {
    const currentData = getCurrentCustomerData();
    navigation.navigate("ViewCustomerScreen", {
      number: currentData.number,
      name: currentData.name,
      customerId: currentData.customerId,
      id: currentData.id,
      title: currentData.title
    });
    return true;
  }, [navigation, customerData, customerId, number, name, id, title]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setCustomerDataLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          setCustomerDataLoading(false);
          return;
        }

        // Fixed the API endpoint name
        const response = await axios.get(
          `${environment.API_BASE_URL}api/customer/get-customer-excludelist/${customerId}`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log("Customer data response:", response.data);
        
        if (response.data && response.data.data) {
          setCustomerData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setCustomerDataLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      setSelectedCrops([]);
      
      // Override the default back action for BackButton
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        e.preventDefault();
        const currentData = getCurrentCustomerData();
        navigation.navigate("ViewCustomerScreen", {
          number: currentData.number,
          name: currentData.name,
          customerId: currentData.customerId,
          id: currentData.id,
          title: currentData.title
        });
      });
      
      // Handle hardware back button
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress', 
        handleBackPress
      );
      
      const fetchProducts = async () => {
  try {
    setListLoading(true); // Set loading to true when starting
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!storedToken) {
      setListLoading(false);
      return;
    }

    const apiUrl = `${environment.API_BASE_URL}api/customer/croplist`;
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${storedToken}` },
      params: { customerId: customerId },
    });

    console.log("Crops response:", response.data);

    if (response.data && response.data.data) {
      setCrops(response.data.data);
      setFilteredCrops(response.data.data);
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
  } finally {
    setListLoading(false); // Always set loading to false when done
  }
};

      fetchProducts();
      
      return () => {
        unsubscribe();
        backHandler.remove();
      };
    }, [navigation, customerData, customerId, number, name, id, title])
  );

  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  //   if (query === "") {
  //     setFilteredCrops(crops);
  //   } else {
  //     const filtered = crops.filter((crop) =>
  //       crop.displayName.toLowerCase().includes(query.toLowerCase())
  //     );
  //     setFilteredCrops(filtered);
  //   }
  // };

  const handlesubmitexcludelist = async () => {

    setLoading(true)

    try {
        const token = await AsyncStorage.getItem("authToken");
          if (!token) {
      console.error("No authentication token found");
      return;
    }

     const payload = {
      customerId,          
      selectedCrops,       
    };

         const checkResponse = await axios.post(
            `${environment.API_BASE_URL}api/customer/add/excludelist`,
              payload,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

        console.log("Response:", checkResponse.data);
      if (checkResponse.status === 200) {
      console.log("Exclude list updated successfully");
      navigation.navigate("Main", {
        screen: "ExcludeListSummery",
        params : {customerId: customerId}
      })
    } else if (checkResponse.status === 400) {
      console.error("Bad request:", checkResponse.data.message);
    } else if (checkResponse.status === 404) {
      console.error("Not Found:", checkResponse.data.message);
    }
  } catch (err) {
    console.error("Error posting exclude list:", err);
  }finally{
        setLoading(false)
    }
  }

const handleSearch = (query: string) => {
  setSearchQuery(query);
  setSearchError(null); // Clear any previous error
  
  if (query === "") {
    setFilteredCrops(crops);
  } else {
    const filtered = crops.filter((crop) =>
      crop.displayName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCrops(filtered);
    
    // Set error if no results found
    if (filtered.length === 0) {
      setSearchError("No products found matching your search");
    }
  }
};


   const handleNavigateIfNoCropsSelected = () => {
        
    if (selectedCrops.length === 0) {
         navigation.navigate("Main", {
        screen: "ExcludeListSummery",
        params : {customerId: customerId}
      })
    } else {
      handlesubmitexcludelist();
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Show loading while fetching customer data
  if (listLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6C3CD1" />
       
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  style={{flex: 1}}
  keyboardVerticalOffset={Platform.select({ios: 60, android: 0})}
>
      <View className="flex-1 bg-white">
        <View className="bg-white flex-row items-center h-17 px-1">
          <TouchableOpacity 
            style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
            onPress={handleBackPress}
          >
            <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
              <AntDesign name="left" size={20} color="black" />
            </View>
          </TouchableOpacity> 
          
          <Text
            style={{ fontSize: 18 }}
            className="font-bold text-center text-[#6C3CD1] flex-grow mr-9 text-xl"
          >
            Exclude Item List
          </Text>
        </View>

        <View className="px-5">
          <Text className="text-center text-sm">
            Exclude any items your customer doesn't want in their package.
            Simply tap on the Products they want to remove.
          </Text>
        </View>

        <View className="px-6 mt-6 mb-6">
          <View className="relative">
            <TextInput
              className="p-3 pr-10 flex-row justify-between items-center border border-[#6B3BCF] rounded-full bg-[#F5F1FC]"
              placeholder="Search Products"
              placeholderTextColor="black"
              value={searchQuery}
              onFocus={() => setIsKeyboardVisible(true)}
              onChangeText={handleSearch}
            />
            
            <Ionicons
              name="search"
              size={24}
              color="#6C3CD1"
              style={{ 
                position: "absolute", 
                right: 20, 
                marginTop: Platform.OS === 'ios' ? 10 : 20, 
                transform: [{ translateY: -12 }] 
              }}
            />
          </View>
        </View>

         {searchError && (
                    <View>
                      <View className="bg-red-50 px-4 py-2 mt-2 rounded-lg border border-red-200">
                        <Text className="text-red-600 text-center">{searchError}</Text>
                      </View>
                      <View className="justify-center items-center mt-4">
                        <LottieView
                          source={require("../assets/images/NoComplaints.json")}
                          style={{ width: wp(50), height: hp(50) }}
                          autoPlay
                          loop
                        />
                      
                      </View>
                    </View>
                  )}
             
        
        <View className="flex-1 ">
          {/* <FlatList
            keyboardShouldPersistTaps='handled'
            data={filteredCrops}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center my-1 px-6 mb">
                <View className="flex-row items-center space-x-6">
                  <TouchableOpacity onPress={() => toggleSelect(item.id)}>
                    <View
                      className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                        selectedCrops.includes(item.id) ? "bg-red-600 border-red-600" : "bg-white border-gray-400"
                      }`}
                    >
                      {selectedCrops.includes(item.id) && (
                        <Ionicons name="close" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text className="text-black">{item.displayName}</Text>
                </View>

                <Image 
                  source={{ uri: item.image }} 
                  style={{ width: 60, height: 60, marginRight: 10 }} 
                  resizeMode="contain" 
                />
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
         contentContainerStyle={{ 
        paddingBottom: 200, // Adds space at the bottom for the button
        paddingTop: 10 
      }}
          /> */}
            <FlatList          
            keyboardShouldPersistTaps='handled'       
            data={filteredCrops}       
            renderItem={({ item }) => (         
              <TouchableOpacity 
                onPress={() => toggleSelect(item.id)}
                className="flex-row justify-between items-center my-1 px-6 mb-2"
              >           
                {/* Crop name and selection toggle */}                      
                <View className="flex-row items-center space-x-4">
                  <View
                    className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                      selectedCrops.includes(item.id) 
                        ? "bg-red-600 border-red-600" 
                        : "bg-white border-gray-400"
                    }`}
                  >
                    {selectedCrops.includes(item.id) && (
                      <Ionicons name="close" size={16} color="white" />
                    )}
                  </View>                         
                  <Text className="text-black text-base font-medium">{item.displayName}</Text>
                </View>            
          
                {/* Crop image */}
                <Image 
                  source={{ uri: item.image }} 
                  style={{ width: 60, height: 60 }} 
                  resizeMode="contain" 
                />            
              </TouchableOpacity>         
            )}
          />
        </View>
      </View>
      
           {!isKeyboardVisible && (
            <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-20 px-6">
        <TouchableOpacity 
          onPress={handleNavigateIfNoCropsSelected} 
          className="bottom-[14%] left-0 right-0 items-center" 
          disabled={loading}
        >
          <LinearGradient
            colors={["#6C3CD1", "#9B65D6"]}
            start={[0, 0]}
            end={[1, 1]}
            style={{
              width: "70%",
              paddingVertical: 12,
              borderRadius: 25,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                  Continue
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ExcludeListAdd;