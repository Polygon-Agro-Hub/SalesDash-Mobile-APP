import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  BackHandler,
  RefreshControl,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { Bar } from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";
import DashboardSkeleton from "./DashboardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DashboardScreen"
>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

interface Package {
  id: number;
  displayName: string;
  image: string;
  name?: string;
  price?: string;
  total: string;
  description: string;
  portion?: number;
  period?: number;
  packingFee: string;
  productPrice: string;
  serviceFee: string;
  status: string;
  createdAt?: string;
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
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", image: "" });
  const [packages, setPackages] = useState<Package[]>([]);
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
  });

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([getUserProfile(), fetchPackages(), fetchAgentStats()]);
    setIsLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshData();
    });

    return unsubscribe;
  }, [navigation]);

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
        return;
      }
      setToken(storedToken);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      setFormData(response.data.data);
    } catch (error) {
      console.error("Profile fetch error:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
        return;
      }
      Alert.alert("Error", "Failed to fetch user profile");
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
      return;
    }
  };

  useEffect(() => {
    const checkTokenExpiration = async () => {
      try {
        const expirationTime = await AsyncStorage.getItem(
          "tokenExpirationTime",
        );
        const userToken = await AsyncStorage.getItem("authToken");

        if (expirationTime && userToken) {
          const currentTime = new Date();
          const tokenExpiry = new Date(expirationTime);

          if (currentTime < tokenExpiry) {
          } else {
            await AsyncStorage.multiRemove([
              "userToken",
              "tokenStoredTime",
              "tokenExpirationTime",
            ]);
            Alert.alert(
              "Sorry",
              "No authenticated user found, please login again",
            );
            navigation.reset({
              index: 0,
              routes: [{ name: "LoginScreen" }],
            });
          }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        navigation.reset({
          index: 0,
          routes: [{ name: "LoginScreen" }],
        });
      }
    };

    checkTokenExpiration();
  }, [navigation]);

  const fetchPackages = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      setToken(storedToken);

      const response = await axios.get<{ data: Package[] }>(
        `${environment.API_BASE_URL}api/packages/get-packages`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      setPackages(response.data.data);
    } catch (error) {
      console.error("Package fetch error:", error);
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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const renderPackage = ({ item }: { item: Package }) => {
    const totalPrice =
      parseFloat(item.packingFee) +
      parseFloat(item.productPrice) +
      parseFloat(item.serviceFee);
    const formattedTotalPrice = totalPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <View
        className="bg-white rounded-2xl shadow-xl border-[#E0E0E0] border-[1px]"
        style={{
          padding: 16,
          marginBottom: 20,
          marginHorizontal: 8,
          width: (wp("100%") - 48) / 2,
          minHeight: 230,
        }}
      >
        <View className="flex-1">
          <Image
            source={{ uri: item.image }}
            className="w-full h-24 self-center"
            style={{ marginBottom: 12 }}
            resizeMode="contain"
          />

          <Text className="font-bold text-[#6A3AD0] text-center">
            {item.displayName}
          </Text>

          <Text
            className="text-sm font-medium text-[#808FA2] text-center"
            style={{ marginTop: 4 }}
          >
            Rs. {formattedTotalPrice}
          </Text>
        </View>
        <View className="items-center justify-center">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ViewScreen" as any, {
                selectedPackageId: item.id,
                selectedPackageName: item.displayName,
                selectedPackageImage: item.image,
                selectedPackageTotal: formattedTotalPrice,
                selectedPackageDescription: item.description,
                selectedPackageportion: item.portion,
                selectedPackageperiod: item.period,
                selectedPackagePackingFee: item.packingFee,
                selectedPackageProductPrice: item.productPrice,
                selectedPackageServiceFee: item.serviceFee,
              })
            }
            activeOpacity={0.8}
            style={{
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#9B60E8", "#6E3DD1"]}
              style={{
                borderRadius: 999,
                paddingVertical: 10,
                paddingHorizontal: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white font-bold text-sm">View</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      className="flex-1"
    >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View
          className="bg-white rounded-b-3xl px-4"
          style={{
            paddingTop: Platform.OS === "ios" ? 50 : 20,
            paddingBottom: 20,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.navigate("SidebarScreen")}
                activeOpacity={0.8}
                style={{ marginRight: 12 }}
              >
                <Image
                  source={
                    formData?.image
                      ? { uri: formData.image }
                      : require("@/assets/images/profile/profile1.webp")
                  }
                  className="w-14 h-14 rounded-full border-2 border-purple-200"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <Text className="text-lg font-bold text-gray-800">
                Hello, {formData?.firstName || "User"}
              </Text>
            </View>

            <View className="flex-row items-center bg-[#E6DBF766] rounded-full px-5 py-3 gap-1  ">
              <Image
                source={require("@/assets/images/icons/star.webp")}
                className="w-7 h-7"
                resizeMode="contain"
              />
              <Text
                className="font-semibold text-black"
                style={{
                  textDecorationLine: "none",
                  includeFontPadding: false,
                }}
              >
                {agentStats?.monthly?.totalStars ?? 0}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginTop: 24 }}>
            <Text className="text-lg text-[#874CDB]">Your Daily Target</Text>
            <View
              className="bg-[#824AD933] rounded-2xl relative overflow-hidden"
              style={{
                marginTop: 12,
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              {/* Progress Count (Centered Top) */}
              <Text className="absolute top-2 self-center text-sm font-bold text-[#693ACF]">
                {agentStats?.daily?.completed ?? 0}/
                {agentStats?.daily?.target ?? 0}
              </Text>

              {/* Progress Bar */}
              <View style={{ marginTop: 20 }}>
                <Bar
                  progress={agentStats?.daily?.progress ?? 0}
                  width={wp("65%")}
                  height={12}
                  color="#6D28D9"
                  unfilledColor="#FFFFFF"
                  borderWidth={0}
                />
              </View>

              {/* Star Icon */}
              <Image
                source={require("@/assets/images/icons/star.webp")}
                style={{
                  width: 40,
                  height: 40,
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  marginTop: -5,
                }}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Packages Section with Pull to Refresh */}
        <ScrollView
          className="flex-1 mb-10 "
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshData}
              colors={["#854BDA"]}
              tintColor="#854BDA"
            />
          }
        >
          <Text className="text-lg text-[#874CDB] mb-4 px-4">Packages</Text>
          <View style={{ paddingHorizontal: 4 }}>
            <FlatList
              data={packages}
              renderItem={renderPackage}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={{
                paddingHorizontal: 10,
                paddingLeft: 2,
                paddingBottom: 60,
              }}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DashboardScreen;
