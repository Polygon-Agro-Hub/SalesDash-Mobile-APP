import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
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
import CustomHeader from "../common/CustomHeader";

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
  } = route.params;

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
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (selectedPackageId) {
      fetchItemsForPackage(selectedPackageId);
    }
  }, [selectedPackageId]);

  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const fetchItemsForPackage = async (packageId: number) => {
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
        console.log("No items found for this package.");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items for the package");
    }
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require("@/assets/images/order/order-bg.webp")}
          style={{ height: 220 }}
          className="rounded-b-3xl shadow-lg bg-[#E6DBF766]"
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
          >
            <View className="flex-row justify-between items-start mx-6">
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
