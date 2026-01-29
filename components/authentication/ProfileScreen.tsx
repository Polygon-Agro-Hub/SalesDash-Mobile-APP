import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,

} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import BackButton from "../common/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { AxiosError } from 'axios';
import LottieView from "lottie-react-native";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ProfileScreen"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface AgentStats {
  daily: {
    target: number;
    completed: number;
    numOfStars: number;
    progress: number;
  };
  monthly: {
    totalStars: number;
  };
  totalEntries: number;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    phoneNumber1: "",
    phoneNumber2: "",
    nic: "",
    email: "",
    houseNumber: "",
    streetName: "",
    city: "",
    empId: "",
    image:""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true); // Changed to true initially
  const [agentStats, setAgentStats] = useState<AgentStats>({
    daily: {
      target: 10,
      completed: 0,
      numOfStars: 0,
      progress: 0
    },
    monthly: {
      totalStars: 0
    }
  } as any);

  useEffect(() => {
    initializeData();
  }, []);

  // Combined initialization function with minimum 2 second loading
  const initializeData = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      await Promise.all([
        getUserProfile(),
        fetchAgentStats(),
        fetchOrderCount(),
        fetchCustomerCount()
      ]);
    } catch (error) {
      console.error("Error initializing data:", error);
    }
    
    // Ensure loading is displayed for at least 2 seconds
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 2000 - elapsedTime);
    
    setTimeout(() => {
      setLoading(false);
    }, remainingTime);
  };
 

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }
      setToken(storedToken);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      setFormData(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const fetchAgentStats = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: AgentStats }>(
        `${environment.API_BASE_URL}api/orders/sales-agent`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

      setAgentStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    }
  };

const fetchOrderCount = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    
    const response = await axios.get(`${environment.API_BASE_URL}api/orders/order-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Debug: Log the response structure
    console.log("Order count response:", JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      // Since your backend returns a single object, not an array
      const orderData = response.data.data;
      
      if (orderData && typeof orderData === 'object') {
        // If the object has orderCount property, use it directly
        if (orderData.orderCount !== undefined) {
          setOrderCount(orderData.orderCount);
        } else {
          console.error("orderCount property not found in response");
          setOrderCount(0);
        }
      } else {
        console.error("Invalid data structure:", orderData);
        setOrderCount(0);
      }
    } else {
      console.error("API returned success: false");
      setOrderCount(0);
    }
  } catch (error) {
    console.error("Error fetching order count:", error);
    setOrderCount(0);
  }
};

const fetchCustomerCount = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    
    const response = await axios.get(`${environment.API_BASE_URL}api/customer/cutomer-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Debug: Log the entire response to understand the structure
    console.log("Full response:", JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      // Try different possible structures
      let dataArray;
      
      if (Array.isArray(response.data.data)) {
        dataArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response.data.data && typeof response.data.data === 'object') {
        // If data is an object, check if it has array properties
        const keys = Object.keys(response.data.data);
        console.log("Data object keys:", keys);
        
        // Look for array properties in the object
        for (const key of keys) {
          if (Array.isArray(response.data.data[key])) {
            dataArray = response.data.data[key];
            break;
          }
        }
        
        // If no array found, treat the object as a single item
        if (!dataArray) {
          dataArray = [response.data.data];
        }
      } else {
        console.error("Unexpected data structure:", response.data);
        setCustomerCount(0);
        return;
      }
      
      console.log("Processing data array:", dataArray);
      
      if (Array.isArray(dataArray)) {
        const customerData = dataArray.find(
          (item) => item.salesAgent === parseInt(formData.empId)
        );
        
        if (customerData) {
          setCustomerCount(customerData.customerCount);
        } else {
          setCustomerCount(dataArray[0]?.customerCount || 0);
        }
      } else {
        console.error("Still not an array after processing:", typeof dataArray);
        setCustomerCount(0);
      }
    }
  } catch (error) {
    console.error("Error fetching customer count:", error);
    setCustomerCount(0);
  }
};
  

   const handleUpdate = async () => {
     if (isSubmitting) return;
  
  setIsSubmitting(true);
    try {
      if (!token) {
        Alert.alert("Error", "You are not authenticated");
        return;
      }
  
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
       email: formData.email,
    //    phoneNumber1: formData.phoneNumber1,
        houseNumber: formData.houseNumber,
        streetName: formData.streetName,
        city: formData.city,
        nic: formData.nic
      };
      
    
  
      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user-updateUser`,
        dataToSend,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
  
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        // Handle specific validation errors with user-friendly messages
        const errorData = error.response.data;
        
        // Check if there are validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Process each error to make it user-friendly
          const userFriendlyErrors = errorData.errors.map((err: string) => {
            // Check for NIC pattern error
            if (err.includes("\"NIC\"") && err.includes("pattern")) {
              return "NIC must be either 12 digits or 9 digits followed by 'V'";
            }
            // Check for phone number format
            else if (err.includes("\"phoneNumber")) {
              return "Phone number must be in the correct format";
            }
            // Check for email format
            else if (err.includes("\"email\"")) {
              return "Please enter a valid email address";
            }
            // For other fields, extract the field name from the error message
            else {
              // Extract field name from error like "\"firstName\" is required"
              const fieldMatch = err.match(/"([^"]+)"/);
              const fieldName = fieldMatch ? fieldMatch[1] : "field";
              
              // Make field name more readable (camelCase to Title Case with spaces)
              const readableFieldName = fieldName
                .replace(/([A-Z])/g, ' $1')
               
              return err.includes("required") 
                ? `${readableFieldName} is required` 
                : `There's an issue with ${readableFieldName.toLowerCase()}`;
            }
          });
          
          // Show alert with all user-friendly errors
          Alert.alert(
            "Validation Error", 
            userFriendlyErrors.join("\n"),
            [{ text: "OK" }]
          );
        } else {
          // Generic error message
          Alert.alert("Error", errorData.message || "Failed to update profile");
        }
        console.error("Update error details:", errorData);
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again later.");
        console.error("Update error:", error);
      }
    
     }finally {
    setIsSubmitting(false); 
  }
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        {/* <LottieView
          source={require("../assets/images/loading.json")}
          autoPlay
          loop
          style={{ width: wp(25), height: hp(12) }}
        /> */}
        <ActivityIndicator></ActivityIndicator>
        <Text className="text-[#6839CF]  font-semibold mt-4">
          Loading Profile...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled 
        style={{flex: 1}}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="bg-[#6839CF]">
            <View className="relative">
              <ImageBackground
                source={require("../../assets/images/profilebackground.webp")}
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: hp(25),
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </View>
            <View className="ml-3"> 
              <BackButton navigation={navigation} />
            </View>

            <View
              className="bg-white rounded-t-3xl pt-6"
              style={{ marginTop: hp(15), paddingHorizontal: wp(6) }}
            >
              <View className="items-center" style={{ marginTop: -hp(12) }}>
                <TouchableOpacity className="relative">
                  {formData.image ? (
                    <Image
                      source={{ uri: formData.image }}
                      style={{
                        width: wp(35),
                        height: wp(35),
                        borderRadius: wp(35) / 2,
                      }}
                      onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                      defaultSource={require("../../assets/images/profile.webp")}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/images/profile.webp")}
                      style={{
                        width: wp(34),
                        height: wp(34),
                        borderRadius: wp(34) / 2,
                      }}
                    />
                  )}
                </TouchableOpacity>
                <Text className="text-black text-2xl font-bold mb-2">
                  {formData.firstName} {formData.lastName}
                </Text>
              </View>
            </View>

            <View className="bg-white px-7">
              <View className="p-4">
                <View className="bg-[#6839CF] flex-row justify-between mt-3 px-4 py-3 rounded-2xl">
                  <View className="flex-1 items-center">
                    <Image 
                      source={require("../../assets/images/star.webp")} 
                      style={{ width: 24, height: 24 }} 
                    />
                    <Text className="text-white text-sm mt-1">Points</Text>
                    <Text className="text-white text-lg font-bold">{agentStats.monthly.totalStars}</Text>
                  </View>

                  <View className="w-[1px] bg-white h-full mx-2" />

                  <View className="flex-1 items-center">
                    <Image 
                      source={require("../../assets/images/Order Completed.webp")} 
                      style={{ width: 24, height: 24 }} 
                    />
                    <Text className="text-white text-sm mt-1">Orders</Text>
                    <Text className="text-white text-lg font-bold">{orderCount}</Text>
                  </View>

                  <View className="w-[1px] bg-white h-full mx-2" />

                  <View className="flex-1 items-center">
                    <Image 
                      source={require("../../assets/images/Batch Assign.webp")} 
                      style={{ width: 24, height: 24 }} 
                    />
                    <Text className="text-white text-sm mt-1">Customers</Text>
                    <Text className="text-white text-lg font-bold">{customerCount}</Text>
                  </View>
                </View>
              </View>
              <View className="px-5 mb-8">

              <View className="mb-4">
                <Text className="text-black mb-1">
                  Employee ID
                </Text>
                <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.empId}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  First Name
                </Text>
                 {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange("firstName", text)}
                  placeholder="Enter First Name"
                /> */}
                 <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.firstName}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Last Name
                </Text>
                  {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange("lastName", text)}
                  placeholder="Enter Last Name"
                /> */}
                 <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.lastName}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Phone Number - 1
                </Text>
                <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.phoneNumber1}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Phone Number - 2
                </Text>
                <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.phoneNumber2 || "---"}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  NIC Number
                </Text>
                <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.nic}
                </Text>
           
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Email Address
                </Text>
              
                    <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.email}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Building / House No
                </Text>
                {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.houseNumber}
                  onChangeText={(text) => handleInputChange("houseNumber", text)}
                  placeholder="Enter Building Number"
                /> */}
                 <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.houseNumber}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  Street Name
                </Text>
                  {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.streetName}
                  onChangeText={(text) => handleInputChange("streetName", text)}
                  placeholder="Enter Street Name"
                /> */}
                 <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.streetName}
                </Text>
              </View>

              <View className="mb-4">
              <Text className="text-black mb-1">
                  City
                </Text>
                 {/* <TextInput
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2"
                  value={formData.city}
                  onChangeText={(text) => handleInputChange("city", text)}
                  placeholder="Enter City"
                /> */}
                    <Text
                  className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-2 text-[#8492A3]"
                >
                  {formData.city}
                </Text>
              </View>
              </View>
               {/* <View className="">
              <TouchableOpacity  onPress={handleUpdate} >

                 <LinearGradient colors={["#6839CF", "#874DDB"]} className="py-3   items-center mt-6 mb-[15%] mr-[20%] ml-[20%] rounded-3xl h-15">
                   {isSubmitting || loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                              
                                  <Text className="text-center text-white text-base font-bold">Update</Text>
                      )}
                              </LinearGradient>
                              </TouchableOpacity>

            
              </View> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;