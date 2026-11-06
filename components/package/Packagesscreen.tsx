import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { RootStackParamList } from "../types/types";
import environment from "@/environment/environment";
import socketService from "@/services/socket/socket.service";
import CustomHeader from "../common/CustomHeader";

type PackagesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PackagesScreen"
>;

interface PackagesScreenProps {
  navigation: PackagesScreenNavigationProp;
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
  packageType?: string;
  endDate?: string | null;
  startDate?: string | null;
  status: string;
  createdAt?: string;
}

const PackagesScreen: React.FC<PackagesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const response = await axios.get<{ data: Package[] }>(
        `${environment.API_BASE_URL}api/packages/get-packages?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      setPackages(response.data.data);
    } catch (error) {
      console.error("Package fetch error:", error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchPackages();
      setIsLoading(false);
    })();
  }, [fetchPackages]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = socketService.onPackageUpdate((data?: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data);
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        setPackages(data.data);
      } else if (Array.isArray(data?.packages) && data.packages.length > 0) {
        setPackages(data.packages);
      } else {
        fetchPackages();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [fetchPackages]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchPackages();
    setIsRefreshing(false);
  };

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
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#F1F5F9",
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 14,
          marginHorizontal: 8,
          width: (wp("100%") - 48) / 2,
          justifyContent: "space-between", 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Top section: image + name + price (takes the free space) */}
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 64, marginBottom: 6 }}
            resizeMode="contain"
          />

          <Text
            className="font-bold text-[#000000] text-center"
            style={{ fontSize: 12 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {(item.displayName || "").length > 14
              ? (item.displayName || "").slice(0, 14) + "..."
              : item.displayName}
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#6A3AD0",
              textAlign: "center",
              marginTop: 2,
              marginBottom: 6,
            }}
          >
            Rs. {formattedTotalPrice}
          </Text>
        </View>

        {/* Bottom section: button always at the same place */}
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
                packageType: item.packageType,
                endDate: item.endDate,
              })
            }
            activeOpacity={0.8}
            style={{ borderRadius: 999, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#9B60E8", "#6E3DD1"]}
              style={{
                borderRadius: 999,
                paddingVertical: 5,
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
    <View className="flex-1 bg-white">
      {/* Header */}
      <CustomHeader
        title="Standard Packages"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#854BDA" />
        </View>
      ) : (
        <FlatList
          data={packages}
          renderItem={renderPackage}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#854BDA"]}
              tintColor="#854BDA"
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 12,
            paddingBottom: 60,
          }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#999", fontSize: 16 }}>
                No packages available
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default PackagesScreen;
