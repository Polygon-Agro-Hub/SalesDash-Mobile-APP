import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  BackHandler,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SelectOrderTypeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SelectOrderType"
>;

interface SelectOrderTypeProps {
  navigation: SelectOrderTypeNavigationProp;
  route: {
    params: {
      id: string;
      isPackage: string;
      customerId: string;
      name: string;
      title: string;
      number: string;
      customerscreencustomerid: string;
      buyerType?: string;
      from?: string;
    };
  };
}

const SelectOrderType: React.FC<SelectOrderTypeProps> = ({
  navigation,
  route,
}) => {
  const {
    id,
    customerId,
    name,
    title,
    number,
    customerscreencustomerid,
    buyerType: paramBuyerType,
    from,
  } = (route.params as any) || {};

  const [fetchedBuyerType, setFetchedBuyerType] = useState<string>("");

  useEffect(() => {
    if (!paramBuyerType && (id || customerId)) {
      const targetId = id || customerId;
      AsyncStorage.getItem("authToken").then((token) => {
        if (!token) return;
        axios
          .get(
            `${environment.API_BASE_URL}api/customer/get-customer-data/${targetId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          .then((res) => {
            const bType =
              res.data?.customer?.buyerType ||
              res.data?.data?.buyerType ||
              res.data?.buyerType;
            if (bType) {
              setFetchedBuyerType(bType);
            }
          })
          .catch(() => {});
      });
    }
  }, [id, customerId, paramBuyerType]);

  const effectiveBuyerType = paramBuyerType || fetchedBuyerType;
  // isWholesale is determined solely by buyerType.
  // Do NOT use `from === "ViewCustomerScreen"` here — retail users also arrive from ViewCustomerScreen.
  const isWholesale =
    String(effectiveBuyerType || "").toLowerCase() === "wholesale";

  // Wholesale buyers cannot order packages - redirect directly to CreateCustomPackage
  useEffect(() => {
    if (isWholesale) {
      navigation.replace("CreateCustomPackage" as any, {
        id,
        isPackage: 0,
        customerId,
        name,
        title,
        number,
        customerscreencustomerid: customerscreencustomerid || customerId,
        buyerType: "Wholesale",
        from: "ViewCustomerScreen",
      });
    }
  }, [
    isWholesale,
    navigation,
    id,
    customerId,
    name,
    title,
    number,
    customerscreencustomerid,
  ]);

  const handleCreateCustomPackage = () => {
    navigation.navigate("CreateCustomPackage" as any, {
      id,
      isPackage: 0,
      customerId: customerId,
      name: name,
      title: title,
      number: number,
      customerscreencustomerid: customerscreencustomerid,
      buyerType: isWholesale ? "Wholesale" : "Retail",
      from: isWholesale ? "ViewCustomerScreen" : "SelectOrderType",
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ViewCustomerScreen" as any, {
          id: id,
          customerId: customerscreencustomerid || customerId,
          name: name,
          title: title,
          number: number,
          buyerType: isWholesale ? "Wholesale" : "Retail",
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, id, customerId, customerscreencustomerid, name, title, number, isWholesale]),
  );

  const handleSelectPackage = () => {
    if (isWholesale) {
      Alert.alert(
        "Not Available",
        "Packages are not available for wholesale buyers. Please create a custom package.",
      );
      return;
    }

    navigation.navigate("OrderScreen" as any, {
      id,
      isPackage: 1,
      customerId: customerId,
      name: name,
      title: title,
      number: number,
      customerscreencustomerid: customerscreencustomerid,
      buyerType: "Retail",
    });
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Select Order Type"
        titleColor="#6C3CD1"
        transparent
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ViewCustomerScreen" as any, {
            id: id,
            customerId: customerscreencustomerid || customerId,
            name: name,
            title: title,
            number: number,
            buyerType: isWholesale ? "Wholesale" : "Retail",
          })
        }
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Image - Centered */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/order/cart.webp")}
              className="w-[70%] h-40"
              resizeMode="contain"
            />
          </View>

          {/* Buttons Container - Centered */}
          <View className="items-center mb-10">
            {/* Create Custom Package Button */}
            <TouchableOpacity
              className="w-[70%] bg-white border border-[#F2F4F7] py-5 rounded-xl mb-4"
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                width: "80%",
                maxWidth: 500,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={handleCreateCustomPackage}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#6839CF",
                  textAlign: "center",
                }}
              >
                Create{"\n"}Custom Package
              </Text>
            </TouchableOpacity>

            {/* Select Package Button (Hidden for wholesale buyers) */}
            {!isWholesale && (
              <TouchableOpacity
                className="w-[70%] bg-white border border-[#F2F4F7] py-5 rounded-xl mb-4"
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  width: "80%",
                  maxWidth: 500,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
                onPress={handleSelectPackage}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#6839CF",
                    textAlign: "center",
                  }}
                >
                  Select{"\n"}Package
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SelectOrderType;
