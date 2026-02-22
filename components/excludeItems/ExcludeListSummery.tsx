import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LottieView from "lottie-react-native";
import CustomHeader from "../common/CustomHeader";

type ExcludeListSummeryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeListSummery"
>;

interface ExcludeListAddProps {
  navigation: ExcludeListSummeryNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeListSummery">;
}

const ExcludeListSummery: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId } = route.params || {};
  const [crops, setCrops] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<{
    firstName: string;
    lastName: string;
    title: String;
    cusId: String;
    phoneNumber: string;
  }>({
    firstName: "",
    lastName: "",
    title: "",
    cusId: "",
    phoneNumber: "",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProducts = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("authToken");
          if (!storedToken) {
            return;
          }

          const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist`;
          const response = await axios.get(apiUrl, {
            params: { customerId },
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.data && response.data.data) {
            // Set customer name from first item (regardless of crop validity)
            if (response.data.data.length > 0) {
              const { firstName, lastName, title, cusId, phoneNumber } =
                response.data.data[0];
              setCustomerName({
                firstName,
                lastName,
                title,
                cusId,
                phoneNumber,
              });
            }

            // Filter out any invalid or empty items for crops display
            const validCrops = response.data.data.filter(
              (item: any) => item.excludeId && item.displayName,
            );
            setCrops(validCrops);
          } else {
            setCrops([]);
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
          setCrops([]); // Set empty array on error
        }
      };

      fetchProducts();
    }, [customerId]),
  );

  const deleteCrop = async (excludeId: number) => {
    // Ask for confirmation before deleting
    Alert.alert("Delete", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) {
              console.error("No authentication token found");
              return;
            }

            const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist/delete`;
            const response = await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              params: { excludeId },
            });

            // Handle response
            if (response.status === 200) {
              setCrops((prevCrops) =>
                prevCrops.filter((crop) => crop.excludeId !== excludeId),
              );
            } else {
              console.error("Failed to delete item");
            }
          } catch (err) {
            console.error("Error deleting crop:", err);
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ExcludeListAdd", {
          customerId: Number(customerId),
        });
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      <CustomHeader
        title={
          customerName.firstName && customerName.lastName
            ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
            : "Loading..."
        }
        titleColor="#000000"
        transparent
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ExcludeListAdd", {
            customerId: Number(customerId),
          })
        }
      />
      <Text
        style={{ fontSize: 18 }}
        className=" text-center text-black text-xl mt-12"
      >
        {customerName.firstName && customerName.lastName
          ? `Customer ID : ${customerName.cusId}`
          : "Loading..."}
      </Text>

      <View className="flex-1 bg-white px-3">
        <View className="px-6 mt-6">
          <Text className="text-[#874CDB] text-sm font-semibold">
            Preferred Items to Exclude
          </Text>
          <View className="bg-gray-300 h-[1px] mt-2" />
        </View>

        {crops.length === 0 ||
        !crops.some((crop) => crop.excludeId && crop.displayName) ? (
          // Empty state - show Lottie animation
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: hp("30%"),
              paddingBottom: hp("20%"),
            }}
          >
            <LottieView
              source={require("@/assets/json/no-data.json")}
              style={{ width: wp(50), height: wp(50) }}
              autoPlay
              loop
            />
            <Text className="text-center text-lg text-gray-500 mt-4">
              No items to exclude
            </Text>
          </View>
        ) : (
          // Items exist - show scrollable list
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 mt-4 ">
              {crops
                .filter((crop) => crop.excludeId && crop.displayName)
                .map((crop) => (
                  <View
                    key={crop.excludeId}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginVertical: 4,
                    }}
                  >
                    <View className="flex-row justify-center items-center gap-6">
                      <Image
                        source={{ uri: crop.image }}
                        style={{ width: 60, height: 60, marginRight: 10 }}
                        resizeMode="contain"
                      />
                      <Text style={{ fontSize: 16, color: "#000" }}>
                        {crop.displayName}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteCrop(crop.excludeId)}
                    >
                      <View>
                        <MaterialIcons
                          name="delete"
                          size={24}
                          color="#FF0000"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </ScrollView>
        )}
      </View>
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 px-6">
        <TouchableOpacity
          className="left-0 right-0 items-center"
          onPress={() =>
            navigation.navigate("SelectOrderTypeNewCustomer", {
              id: Number(customerId),
              name: String(
                `${customerName.firstName || ""} ${customerName.lastName || ""}`,
              ).trim(),
              title: String(customerName.title || ""),
              customerId: String(customerName.cusId || customerId || ""),
              phoneNumber: String(customerName.phoneNumber || ""),
            })
          }
        >
          <View
            style={{
              width: 264,
              height: 48,
              borderRadius: 25,
              shadowColor: "#000000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
              backgroundColor: "transparent",
            }}
          >
            <LinearGradient
              colors={["#6839CF", "#874DDB"]}
              start={[0, 0]}
              end={[1, 1]}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                Select Order Type
              </Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ExcludeListSummery;
