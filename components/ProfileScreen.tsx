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

} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { AxiosError } from 'axios';

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
    nicNumber: "",
    username: "",
    email: "",
    buildingNo: "",
    streetName: "",
    city: "",
    empId: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [agentStats, setAgentStats] = useState<AgentStats>({
    daily: {
      target: 0,
      completed: 0,
      numOfStars: 0,
      progress: 0
    },
    monthly: {
      totalStars: 0
    },
    totalEntries: 0
  });

  useEffect(() => {
    getUserProfile();
  }, []);

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
      
      const response = await axios.get<{ success: boolean; data: AgentStats }>(
        `${environment.API_BASE_URL}api/orders/get-All-Start`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      
      if (response.data.success) {
        setAgentStats(response.data.data);
        console.log("//////////",response.data)
      }
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    }
  };

  useEffect(() => {
    getUserProfile();
    fetchAgentStats(); // Add this line
  }, []);


  const fetchOrderCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      
      const response = await axios.get(`${environment.API_BASE_URL}api/orders/order-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        console.log(".......", response.data);
        // Since the data comes as an array, we need to find the current user's order count
        const orderData = response.data.data.find(
          (item: { salesAgentId: number }) => item.salesAgentId === parseInt(formData.empId)
        );
        
        if (orderData) {
          setOrderCount(orderData.orderCount);
        } else {
          // If no match is found, check if there's at least one item in the array
          setOrderCount(response.data.data[0]?.orderCount || 0);
        }
      } else {
        console.warn("Failed to fetch order count:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching order count:", error);
    }
  };
  
  useEffect(() => {
    getUserProfile();
    fetchAgentStats();
    fetchOrderCount();
  }, []);



  const fetchCustomerCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
          
      const response = await axios.get(`${environment.API_BASE_URL}api/customer/cutomer-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
          
      if (response.data.success) {
        console.log("Customer count data:", response.data);
        // Find the current user's customer count
        const customerData = response.data.data.find(
          (item: { salesAgentId: number }) => item.salesAgentId === parseInt(formData.empId)
        );
              
        if (customerData) {
          setCustomerCount(customerData.customerCount);
        } else {
          // If no match is found, check if there's at least one item in the array
          setCustomerCount(response.data.data[0]?.customerCount || 0);
        }
      } else {
        console.warn("Failed to fetch customer count:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching customer count:", error);
    }
  };
  
  useEffect(() => {
    getUserProfile();

    fetchCustomerCount();
  }, []);



  
  const handleUpdate = async () => {
    try {
      if (!token) {
        Alert.alert("Error", "You are not authenticated");
        return;
      }
  
    
      const { empId, nicNumber, username, ...updatedData } = formData;
  
      console.log('Form data being sent:', updatedData);  
  
      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user-updateUser`,
        updatedData,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
  
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Backend error details:', error.response?.data);
        Alert.alert("Error", `Failed to update profile: ${error.response?.data.message || 'Validation error'}`);
      } else {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };
  
  

  return (
    <View className="flex-1 bg-white">
     
       <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled 
        className="flex-1"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="bg-[#6839CF]">
              <View className="relative">
                <ImageBackground
                  source={require("../assets/images/profilebackground.png")}
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
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={{
                          width: wp(35),
                          height: wp(35),
                       
                        
                        }}
                      />
                    ) : (
                      <Image
                        source={require("../assets/images/profile.png")}
                        style={{
                          width: wp(34),
                          height: wp(34),
                          borderRadius: wp(1),
                       
                        }}
                      />
                    )}
                  </TouchableOpacity>
                  <Text className="text-black text-2xl font-bold mb-2">
                    {formData.firstName}
                  </Text>
                </View>
              </View>

              <View className="bg-white px-7">
                <View className="p-4">
                <View className="bg-[#6839CF] flex-row justify-between mt-3 px-4 py-3 rounded-2xl ">
                    <View className="flex-1 items-center">
                    <Image 
  source={require("../assets/images/star.png")} 
  style={{ width: 24, height: 24 }} 
/>
                      <Text className="text-white text-sm mt-1">Points</Text>
                      <Text className="text-white text-lg font-bold">{agentStats.monthly.totalStars}</Text>
                    </View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
  <Image 
    source={require("../assets/images/Order Completed.png")} 
    style={{ width: 24, height: 24 }} 
  />
  <Text className="text-white text-sm mt-1">Orders</Text>
  <Text className="text-white text-lg font-bold">{orderCount}</Text>
</View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
                    <Image 
  source={require("../assets/images/Batch Assign.png")} 
  style={{ width: 24, height: 24 }} 
/>
                      <Text className="text-white text-sm mt-1">Customers</Text>
                      <Text className="text-white text-lg font-bold">{customerCount}</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-white px-7">
                  {/* Employee ID Field */}
                  <View className="mb-4">
                    <Text className="text-black-500 mb-1 capitalize mt-4">
                      Employee ID
                    </Text>
                    <Text
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2 text-gray-500"
                      style={{ fontSize: wp(4) }}
                    >
                      {formData.empId}
                    </Text>
                  </View>

                {/* Other Fields */}
{Object.entries(formData).map(([key, value]) => {
  // Skip username and empId as before, they're handled separately
  if (key === "empId" || key === "username") return null;
  
  // Check if this is one of the phone number fields that should be read-only
  const isPhoneNumber = key === "phoneNumber1" || key === "phoneNumber2";
  
  return (
    <View className="mb-4" key={key}>
      <Text
        className="text-black-500 mb-1 capitalize mt-4"
        style={{ fontSize: wp(4) }}
      >
        {key.replace(/([A-Z])/g, " $1")}
      </Text>
      
      {isPhoneNumber ? (
        // Render phone numbers as read-only Text components
        <Text
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2 text-gray-500"
          style={{ fontSize: wp(4) }}
        >
          {value}
        </Text>
      ) : (
        // Render other fields as editable TextInput components
        <TextInput
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2"
          value={value}
          onChangeText={(text) => handleInputChange(key, text)}
          placeholder={`Enter ${key.replace(/([A-Z])/g, " $1")}`}
          style={{ fontSize: wp(4) }}
        />
      )}
    </View>
  );
})}
                </View>
              </View>

              <View className="bg-white px-7">
      <TouchableOpacity onPress={handleUpdate} style={{ width: wp(60), alignSelf: "center" }}>
        <LinearGradient
          colors={["#6839CF", "#874DDB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-3 rounded-full items-center mt-6 mb-10 px-4"
        >
          <Text className="text-white text-lg font-bold">Update</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    

    </View>
  );
};

export default ProfileScreen;
