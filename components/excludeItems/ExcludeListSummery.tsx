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
import NoDataFound from "../common/NoDataFound";
import CustomHeader from "../common/CustomHeader";
import { Entypo } from "@expo/vector-icons";
import FixedMarqueeText from "../common/MarqueeText";

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
  const { customerId, name, title, phoneNumber, cusId, id } = route.params || {};
  const [crops, setCrops] = useState<any[]>([]);

  // Split name into first and last name if they are passed as a single string
  const nameParts = (name || "").trim().split(/\s+/);
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [customerName, setCustomerName] = useState<{
    firstName: string;
    lastName: string;
    title: String;
    cusId: String;
    phoneNumber: string;
  }>({
    firstName: initialFirstName,
    lastName: initialLastName,
    title: title || "",
    cusId: cusId || "",
    phoneNumber: phoneNumber || "",
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
            } else {
              // Fallback to route parameters if no items exist in exclude list
              const nameParts = (name || "").trim().split(/\s+/);
              const initialFirstName = nameParts[0] || "";
              const initialLastName = nameParts.slice(1).join(" ") || "";
              setCustomerName({
                firstName: initialFirstName,
                lastName: initialLastName,
                title: title || "",
                cusId: cusId || "",
                phoneNumber: phoneNumber || "",
              });
            }

            // Filter out any invalid or empty items for crops display
            const validCrops = response.data.data.filter(
              (item: any) => item.excludeId && item.displayName,
            );
            setCrops(validCrops);
          } else {
            setCrops([]);
            // Fallback to route parameters
            const nameParts = (name || "").trim().split(/\s+/);
            const initialFirstName = nameParts[0] || "";
            const initialLastName = nameParts.slice(1).join(" ") || "";
            setCustomerName({
              firstName: initialFirstName,
              lastName: initialLastName,
              title: title || "",
              cusId: cusId || "",
              phoneNumber: phoneNumber || "",
            });
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
          setCrops([]); // Set empty array on error
          // Fallback to route parameters
          const nameParts = (name || "").trim().split(/\s+/);
          const initialFirstName = nameParts[0] || "";
          const initialLastName = nameParts.slice(1).join(" ") || "";
          setCustomerName({
            firstName: initialFirstName,
            lastName: initialLastName,
            title: title || "",
            cusId: cusId || "",
            phoneNumber: phoneNumber || "",
          });
        }
      };

      fetchProducts();
    }, [customerId, name, title, phoneNumber, cusId]),
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

  const fullTitle =
    customerName.firstName && customerName.lastName
      ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
      : "Loading...";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ExcludeListAdd", {
              customerId: Number(customerId),
            })
          }
          style={{
            width: 45,
            height: 45,
            borderRadius: 18,
            backgroundColor: "#F6F6F680",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: 10,
            zIndex: 1,
          }}
          activeOpacity={0.7}
        >
          <Entypo name="chevron-left" size={25} color="black" />
        </TouchableOpacity>

        {/* Title — marquee when long */}
        <View style={{ flex: 1, alignItems: "center", overflow: "hidden", marginHorizontal: 8 }}>
          {fullTitle.length > 25 ? (
            <FixedMarqueeText
              text={fullTitle}
              style={{ fontSize: 16, fontWeight: "bold" }}
              speed={50}
            />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#000000",
                textAlign: "center",
              }}
            >
              {fullTitle}
            </Text>
          )}
        </View>

        {/* Right spacer to keep title centred */}
        <View style={{ width: 45, marginRight: 10 }} />
      </View>

      {/* Customer ID */}
      <View className="mx-auto w-full max-w-[500px]">
        <Text style={{ fontSize: 16,marginTop: -3 }} className="text-center text-black">
          {customerName.firstName && customerName.lastName
            ? `Customer ID : ${customerName.cusId}`
            : "Loading..."}
        </Text>
      </View>

      <View className="flex-1 bg-white px-3 mx-auto w-full max-w-[500px]">
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
              paddingTop: hp("10%"),
             
            }}
          >
            <NoDataFound message="No items to exclude" />
          </View>
        ) : (
          // Items exist - show scrollable list
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className="mb-20"
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
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 px-6 items-center">
        <TouchableOpacity
          className="w-full max-w-[500px] items-center"
          onPress={() =>
            navigation.navigate("SelectOrderTypeNewCustomer", {
              id: Number(id || customerId),
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
