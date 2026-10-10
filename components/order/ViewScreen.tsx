import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  ImageBackground,
  Alert,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../common/CustomHeader";

const getDeliveryCutoffDate = (endDateStr?: string | null): string | null => {
  if (!endDateStr) return null;
  try {
    let year: number;
    let month: number;
    let day: number;

    const str = String(endDateStr).trim();
    if (str.includes("T") || str.includes("Z")) {
      const d = new Date(str);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    } else if (str.includes("-")) {
      const parts = str.split("T")[0].split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(str);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    // Delivery cutoff is [Expire Date] - 2 days
    const cutoffDate = new Date(year, month, day);
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const displayDay = cutoffDate.getDate();
    const displayMonth = monthNames[cutoffDate.getMonth()];
    const displayYear = cutoffDate.getFullYear();

    return `${displayDay} ${displayMonth} ${displayYear}`;
  } catch (err) {
    console.error("Error calculating delivery cutoff date:", err);
    return null;
  }
};

type ViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewScreen"
>;

type RootStackParamList = {
  ViewScreen: {
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageImage: string;
    selectedPackageTotal: string;
    selectedPackageDescription: string;
    selectedPackageportion: string;
    selectedPackageperiod: string;
    selectedPackageServiceFee: string;
    selectedPackagePackingFee: string;
    selectedPackageProductPrice: string;
    packageType?: string;
    endDate?: string | null;
  };
};

type ViewScreenRouteProp = RouteProp<RootStackParamList, "ViewScreen">;

interface ViewScreenProps {
  navigation: ViewScreenNavigationProp;
  route: ViewScreenRouteProp;
}

const ViewScreen: React.FC<ViewScreenProps> = ({ navigation, route }) => {
  const {
    selectedPackageId,
    selectedPackageName,
    selectedPackageImage,
    selectedPackageTotal,
    selectedPackageDescription,
    packageType: initialPackageType,
    endDate: initialEndDate,
  } = route.params;

  const [packageType, setPackageType] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [items, setItems] = useState<
    {
      name: string;
      quantity: string;
      quantityType: string;
      portion: number;
      period: number;
      qty: string;
    }[]
  >([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPackageDetails = useCallback(async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{
        data: {
          id: number;
          displayName: string;
          description: string;
          packageType?: string;
          startDate?: string;
          endDate?: string;
        };
      }>(`${environment.API_BASE_URL}api/packages/marketplace-package/${packageId}?_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (response.data && response.data.data) {
        if (response.data.data.packageType) {
          setPackageType(response.data.data.packageType);
        }
        if (response.data.data.endDate) {
          setEndDate(response.data.data.endDate);
        }
      }
    } catch (error) {
      console.warn("Could not fetch extra package details:", error);
    }
  }, []);

  const fetchItemsForPackage = useCallback(async (packageId: number) => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await axios.get<{
        data: {
          name: string;
          quantity: string;
          quantityType: string;
          portion: number;
          period: number;
          qty: string;
        }[];
      }>(`${environment.API_BASE_URL}api/packages/${packageId}/items`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.data && response.data.data) {
        setItems(response.data.data);
      } else {
        console.warn("⚠️ No items found for this package.");
      }
    } catch (error) {
      console.error("❌ Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
    }
  }, []);

  useEffect(() => {
    if (selectedPackageId) {
      fetchItemsForPackage(selectedPackageId);
      fetchPackageDetails(selectedPackageId);
    }
  }, [selectedPackageId, fetchItemsForPackage, fetchPackageDetails]);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      if (selectedPackageId) {
        fetchPackageDetails(selectedPackageId);
      }
    }, [selectedPackageId, fetchPackageDetails]),
  );

  const onRefresh = useCallback(async () => {
    if (selectedPackageId) {
      setRefreshing(true);
      try {
        await Promise.all([
          fetchItemsForPackage(selectedPackageId),
          fetchPackageDetails(selectedPackageId),
        ]);
      } catch (err) {
        console.error("Refresh error in ViewScreen:", err);
      } finally {
        setRefreshing(false);
      }
    }
  }, [selectedPackageId, fetchItemsForPackage, fetchPackageDetails]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  const isOneTimePackage =
    (packageType || "").trim().toLowerCase() === "one time" ||
    (packageType || "").trim().toLowerCase().includes("one");
  const deliveryCutoffDate = getDeliveryCutoffDate(endDate);
  const showSeasonalSection = isOneTimePackage && !!deliveryCutoffDate;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require("@/assets/images/order/order-bg.webp")}
          style={{ height: 220 }}
          className="rounded-b-3xl bg-[#E6DBF766]"
          resizeMode="cover"
        >
          <CustomHeader
            title=""
            transparent
            showBackButton={true}
            navigation={navigation}
          />
          <Image
            source={{ uri: selectedPackageImage }}
            className="w-52 h-52 self-center mb-2 "
            resizeMode="contain"
          />
        </ImageBackground>

        {/* Content Section */}
        <View style={{ flex: 1, marginTop: -28, marginBottom: 10 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 24,
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6839CF"]}
                tintColor="#6839CF"
              />
            }
          >
            <View className="flex-row justify-between items-start mb-4 mx-6">
              <View className="flex-1 mr-4">
                <Text
                  className="text-xl font-bold text-[#7240D3]"
                  numberOfLines={2}
                  style={{ lineHeight: 24 }}
                >
                  {selectedPackageName}
                </Text>
              </View>
              <View className="flex-shrink-0">
                <Text className="text-lg font-bold text-black">
                  Rs. {selectedPackageTotal}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View className="flex-row items-start mb-6 mx-6">
              {/* Vertical Line */}
              <View
                className="bg-[#7240D3] w-1 mr-3"
                style={{ height: "100%" }}
              ></View>

              {/* Paragraph Text */}
              <Text className="text-gray-600 text-sm leading-6 mr-2">
                {selectedPackageDescription}
              </Text>
            </View>

            {/* Seasonal Package Section (Only for One Time packages) */}
            {showSeasonalSection && (
              <View
                style={{
                  backgroundColor: "#E3FFEA",
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 20,
                  marginHorizontal: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Ionicons
                    name="time"
                    size={20}
                    color="#000000"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#000000",
                    }}
                  >
                    Seasonal Package
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#000000",
                    lineHeight: 19,
                  }}
                >
                  This package will no longer be available{"\n"}
                  for delivery after this date : {deliveryCutoffDate}.{"\n"}
                  We appreciate your understanding and support.
                </Text>
              </View>
            )}

            {/* Items List */}
            <Text className="text-gray-800 text-lg font-bold mx-6">
              All (
              {items.reduce((total, item) => total + parseInt(item.qty), 0)}{" "}
              items)
            </Text>
            {items.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center border-b border-gray-200 py-3 mx-6"
              >
                <Text className="text-gray-700 text-sm">{item.name}</Text>
                <Text className="text-[#5D5D5D] text-sm">{item.qty}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default ViewScreen;
