import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  BackHandler,
  RefreshControl,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { Bar } from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import DashboardSkeleton from "./DashboardSkeleton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import socketService from "@/services/socket/socket.service";
import pushNotificationService from "@/services/notification/pushNotification.service";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DashboardScreen"
>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
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
    targetAchievedDays?: number;
  };
  totalDeliveredValue?: number;
}

/* ---------- Reusable dashboard box ---------- */
interface DashboardCardProps {
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof FontAwesome6.glyphMap;
  iconColor: string;
  iconBg: string;
  badgeColor: string;
  badgeBg: string;
  onPress?: () => void;
}

const CARD_GAP = 12;
const CARD_WIDTH = (wp("100%") - 32 - CARD_GAP) / 2;

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  badge,
  icon,
  iconColor,
  iconBg,
  badgeColor,
  badgeBg,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={{
      width: CARD_WIDTH,
      minHeight: 157,
      marginBottom: CARD_GAP,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#F1F5F9",
      shadowColor: "#8B5CF6",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 4,
    }}
  >
    {/* Soft corner glow: clipped inside the card, no visible circle edge */}
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 19,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[iconBg, "rgba(255,255,255,0)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.55 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
    </View>

    <View style={{ flex: 1, padding: 16 }}>
      {/* Icon */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome6 name={icon} size={22} color={iconColor} />
      </View>

      {/* Texts */}
      <Text
        style={{
          marginTop: 12,
          fontSize: 14,
          fontWeight: "700",
          color: "#0F172A",
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        style={{ fontSize: 10, color: "#475569", marginTop: 2 }}
        numberOfLines={1}
      >
        {subtitle}
      </Text>

      {/* Badge + arrow */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <View
          style={{
            backgroundColor: badgeBg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: badgeColor, fontSize: 10, fontWeight: "600" }}>
            {badge}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </View>
    </View>
  </TouchableOpacity>
);

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    image: "",
    empType: "",
  });
  const [packageCount, setPackageCount] = useState(0);
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  const [existingCustomerCount, setExistingCustomerCount] = useState(0);
  const [targetAchievedDays, setTargetAchievedDays] = useState(0);
  const [existingCustomersTotalValue, setExistingCustomersTotalValue] = useState(0);
  const [agentStats, setAgentStats] = useState<AgentStats>({
    daily: { target: 10, completed: 0, numOfStars: 0, progress: 0 },
    monthly: { totalStars: 0 },
  });

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      getUserProfile(),
      fetchAgentStats(),
      fetchPackages(),
      fetchCustomerCounts(),
      fetchTargetAchievedDaysFallback(),
      fetchDeliveredTotalFallback(),
    ]);
    setIsLoading(false);
  };

  const fetchPackages = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: any[]; total?: number }>(
        `${environment.API_BASE_URL}api/packages/get-packages?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      setPackageCount(response.data?.total ?? list.length);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    }
  };

  const fetchCustomerCounts = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/customer/cutomer-count`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
        );
        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          if (
            data.newCustomerCount !== undefined &&
            data.existingCustomerCount !== undefined
          ) {
            setNewCustomerCount(data.newCustomerCount);
            setExistingCustomerCount(data.existingCustomerCount);
            return;
          }
        }
      } catch (err) {
        // fallback
      }

      const [newRes, existingRes] = await Promise.all([
        axios
          .get(
            `${environment.API_BASE_URL}api/customer/get-customers?page=1&limit=1&type=new`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          )
          .catch(() => null),
        axios
          .get(
            `${environment.API_BASE_URL}api/customer/get-customers?page=1&limit=1&type=existing`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          )
          .catch(() => null),
      ]);

      if (newRes?.data?.totalCount !== undefined) {
        setNewCustomerCount(newRes.data.totalCount);
      }
      if (existingRes?.data?.totalCount !== undefined) {
        setExistingCustomerCount(existingRes.data.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch customer counts:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = socketService.onPackageUpdate(() => {
      fetchPackages();
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

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
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      console.log(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      console.error("Profile fetch error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        return;
      }
      Alert.alert("Error", "Failed to fetch user profile");
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
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
          if (new Date() >= new Date(expirationTime)) {
            await AsyncStorage.multiRemove([
              "userToken",
              "tokenStoredTime",
              "tokenExpirationTime",
            ]);
            Alert.alert(
              "Sorry",
              "No authenticated user found, please login again",
            );
            navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
          }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
      }
    };
    checkTokenExpiration();
  }, [navigation]);





  const fetchAgentStats = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: AgentStats }>(
        `${environment.API_BASE_URL}api/orders/sales-agent`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      const data = response.data.data;
      setAgentStats(data);
      if (data?.monthly?.targetAchievedDays !== undefined) {
        setTargetAchievedDays(data.monthly.targetAchievedDays);
      }
      if (data?.totalDeliveredValue !== undefined) {
        setExistingCustomersTotalValue(data.totalDeliveredValue);
      }
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    }
  };

  const fetchTargetAchievedDaysFallback = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const now = new Date();
      const res = await axios.get(
        `${environment.API_BASE_URL}api/orders/daily-targets?month=${
          now.getMonth() + 1
        }&year=${now.getFullYear()}&limit=100`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      const records = Array.isArray(res.data?.data) ? res.data.data : [];
      const count = records.filter(
        (r: any) =>
          Number(r.completed) >= Number(r.target) && Number(r.target) > 0,
      ).length;
      setTargetAchievedDays(count);
    } catch (e) {
      // fallback
    }
  };

  const fetchDeliveredTotalFallback = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const res = await axios.get(
        `${environment.API_BASE_URL}api/orders/delivered-existing-total`,
        { headers: { Authorization: `Bearer ${storedToken}` } },
      );
      if (res.data?.data?.totalDeliveredValue !== undefined) {
        setExistingCustomersTotalValue(res.data.data.totalDeliveredValue);
      }
    } catch (e) {
      // fallback
    }
  };

  const formatCurrency = (amount: number): string => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useFocusEffect(
    useCallback(() => {
      socketService.connect().catch(() => {});
      socketService.checkNewNotifications().catch(() => {});
      pushNotificationService.registerPushTokenAsync().catch(() => {});

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true,
      );
      return () => subscription.remove();
    }, []),
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const completed = agentStats?.daily?.completed ?? 0;
  const target = agentStats?.daily?.target ?? 0;
  const remaining = Math.max(target - completed, 0);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            colors={["#854BDA"]}
            tintColor="#854BDA"
          />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
        <View className="px-4" style={{ paddingTop: 8 }}>
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
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  Hello, {formData?.firstName || "User"}
                </Text>
                <Text className="text-xs text-[#64748B]">
                  {formData?.empType?.trim().toLowerCase() === "temporary" ||
                  formData?.empType?.trim().toLowerCase() === "freelancer"
                    ? "Freelancer"
                    : "Permanent Sales Agent"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center bg-[#E6DBF766] rounded-full px-5 py-3 gap-1">
              <Image
                source={require("@/assets/images/icons/star.webp")}
                className="w-7 h-7"
                resizeMode="contain"
              />
              <Text
                className="font-semibold text-black mt-1 pr-2"
                style={{ includeFontPadding: false }}
              >
                {agentStats?.monthly?.totalStars ?? 0}
              </Text>
            </View>
          </View>

          {/* Daily target */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3BCF" }}>
              Your Daily Target
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B" }}>
              {remaining} orders to go!
            </Text>
          </View>

          <LinearGradient
            colors={["#ECE6FD", "#F1EBFD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginTop: 10,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#EDE9FE",
              padding: 20,
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: "#6B3BCF",
                    letterSpacing: 1,
                  }}
                >
                  PROGRESS
                </Text>
              </View>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#6B3BCF" }}
              >
                {completed}/{target} completed
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Bar
                progress={agentStats?.daily?.progress ?? 0}
                width={wp("100%") - 32 - 42 - 28 - 12}
                height={10}
                borderRadius={6}
                color="#8B5CF6"
                unfilledColor="rgba(255,255,255,0.8)"
                borderWidth={0}
              />
              <Image
                source={require("@/assets/images/icons/star.webp")}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </View>

        {/* Boxes */}
        <View
          className="flex-row flex-wrap justify-between"
          style={{ paddingHorizontal: 16, marginTop: 24 }}
        >
          <DashboardCard
            title="New Customer Details"
            subtitle="New registration & profiles"
            badge={`Total : ${newCustomerCount}`}
            icon="users"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
            badgeColor="#6D28D9"
            badgeBg="#EDE9FE"
            onPress={() =>
              navigation.navigate("NewCustomerDetailsScreen" as any)
            }
          />

          <DashboardCard
            title="Existing Customer Details"
            subtitle="Active client records"
            badge={`Total : ${existingCustomerCount}`}
            icon="users"
            iconColor="#6872FF"
            iconBg="#EDF2FF"
            badgeColor="#1D4ED8"
            badgeBg="#EDF2FF"
            onPress={() =>
              navigation.navigate("ExistingCustomerDetailsScreen" as any)
            }
          />

          <DashboardCard
            title="Total Value of Existing Customers"
            subtitle="Total Orders Amount"
            badge={formatCurrency(existingCustomersTotalValue)}
            icon="coins"
            iconColor="#EBA313"
            iconBg="#FDFCDD"
            badgeColor="#ECA811"
            badgeBg="#FDFCDD"
            onPress={() =>
              navigation.navigate("TotalValueOfCustomersScreen" as any)
            }
          />

          {/* Navigates to the separate Packages screen */}
          <DashboardCard
            title="Polygon Standard Packages"
            subtitle="Standard Packages"
            badge={`Total : ${packageCount}`}
            icon="bag-shopping"
            iconColor="#00BCC1"
            iconBg="#D5FEFF"
            badgeColor="#009498"
            badgeBg="#D6FEFF"
            onPress={() => navigation.navigate("PackagesScreen" as any)}
          />

          <DashboardCard
            title="Monthly Orders Targets"
            subtitle="Monthly Target Achieved"
            badge={`${targetAchievedDays} ${targetAchievedDays === 1 ? "Day" : "Days"}`}
            icon="bullseye"
            iconColor="#E11D48"
            iconBg="#FFE4E6"
            badgeColor="#BE123C"
            badgeBg="#FFE4E6"
            onPress={() => navigation.navigate("MonthlyOrdersTargets" as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
