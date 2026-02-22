import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";

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
    image: "",
  });
  const [orderCount, setOrderCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState<AgentStats>({
    daily: {
      target: 10,
      completed: 0,
      numOfStars: 0,
      progress: 0,
    },
    monthly: {
      totalStars: 0,
    },
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
        fetchCustomerCount(),
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

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );

      setFormData(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
    }
  };

  const fetchAgentStats = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: AgentStats }>(
        `${environment.API_BASE_URL}api/orders/sales-agent`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      setAgentStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    }
  };

  const fetchOrderCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/orders/order-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Since your backend returns a single object, not an array
        const orderData = response.data.data;

        if (orderData && typeof orderData === "object") {
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

      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/cutomer-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Try different possible structures
        let dataArray;

        if (Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (
          response.data.data &&
          typeof response.data.data === "object"
        ) {
          // If data is an object, check if it has array properties
          const keys = Object.keys(response.data.data);

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

        if (Array.isArray(dataArray)) {
          const customerData = dataArray.find(
            (item) => item.salesAgent === parseInt(formData.empId),
          );

          if (customerData) {
            setCustomerCount(customerData.customerCount);
          } else {
            setCustomerCount(dataArray[0]?.customerCount || 0);
          }
        } else {
          console.error(
            "Still not an array after processing:",
            typeof dataArray,
          );
          setCustomerCount(0);
        }
      }
    } catch (error) {
      console.error("Error fetching customer count:", error);
      setCustomerCount(0);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading Profile..." fullScreen={true} />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#6839CF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <CustomHeader
            title=""
            showBackButton={true}
            navigation={navigation}
            transparent
          />
          <View className="bg-[#6839CF]">
            <View className="relative">
              <ImageBackground
                source={require("@/assets/images/profile/profile-bg.webp")}
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: hp(50),
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
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
                      onError={(e) =>
                        console.log("Image load error:", e.nativeEvent.error)
                      }
                      defaultSource={require("@/assets/images/profile/profile.webp")}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/profile/profile.webp")}
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

            <View className="bg-white px-6">
              <View className="py-4">
                <View className="bg-[#6839CF] flex-row justify-between mt-3 py-3 rounded-2xl">
                  <View className="flex-1 items-center">
                    <Image
                      source={require("@/assets/images/icons/star.webp")}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text className="text-white text-sm mt-1">Points</Text>
                    <Text className="text-white text-lg font-bold">
                      {agentStats.monthly.totalStars}
                    </Text>
                  </View>

                  <View className="w-[1px] bg-white h-full mx-2" />

                  <View className="flex-1 items-center">
                    <Image
                      source={require("@/assets/images/icons/order-completed.webp")}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text className="text-white text-sm mt-1">Orders</Text>
                    <Text className="text-white text-lg font-bold">
                      {orderCount}
                    </Text>
                  </View>

                  <View className="w-[1px] bg-white h-full mx-2" />

                  <View className="flex-1 items-center">
                    <Image
                      source={require("@/assets/images/icons/batch-assign.webp")}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text className="text-white text-sm mt-1">Customers</Text>
                    <Text className="text-white text-lg font-bold">
                      {customerCount}
                    </Text>
                  </View>
                </View>
              </View>
              <View className=" mb-8">
                <View className="mb-4">
                  <Text className="text-black mb-1">Employee ID</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.empId}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">First Name</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.firstName}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Last Name</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.lastName}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Phone Number - 1</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.phoneNumber1}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Phone Number - 2</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.phoneNumber2 || "---"}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">NIC Number</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.nic}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Email Address</Text>

                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.email}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Building / House No</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.houseNumber}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">Street Name</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.streetName}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-1">City</Text>
                  <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-3 py-3 text-black">
                    {formData.city}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;
