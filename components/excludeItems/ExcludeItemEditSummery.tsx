import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  Alert,
} from "react-native";
import BackButton from "../common/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "react-native-screens";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { navigate } from "expo-router/build/global-state/routing";

type ExcludeItemEditSummeryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeItemEditSummery"
>;

interface ExcludeListAddProps {
  navigation: ExcludeItemEditSummeryNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeItemEditSummery">;
}

const ExcludeListSummery: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { id, customerId, name, title } = route.params;
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState<{
    firstName: string;
    lastName: string;
    title: String;
    cusId: String;
  }>({
    firstName: "",
    lastName: "",
    title: "",
    cusId: "",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProducts = async () => {
        setLoading(true); // Set loading to true when starting fetch
        setCrops([]);
        setCustomerName({
          firstName: "",
          lastName: "",
          title: "",
          cusId: "",
        });
        try {
          const storedToken = await AsyncStorage.getItem("authToken");
          if (!storedToken) {
            setLoading(false);
            return;
          }

          const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist`;
          const response = await axios.get(apiUrl, {
            params: { customerId: id },
            headers: { Authorization: `Bearer ${storedToken}` },
          });


          if (response.data && response.data.data) {
            setCrops(response.data.data);
          }
          if (response.data && response.data.data.length > 0) {
            const { firstName, lastName, title, cusId } = response.data.data[0];
            setCustomerName({ firstName, lastName, title, cusId });
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
        } finally {
          setLoading(false); // Set loading to false when done
        }
      };

      fetchProducts();
      return () => { };
    }, [id])
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
                prevCrops.filter((crop) => crop.excludeId !== excludeId)
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
        // Navigate to ViewCustomerScreen instead of going back to main dashboard
        navigation.navigate("ViewCustomerScreen" as any, {
          id: id,
          customerId: customerId,
          name: name,
          title: title
        });
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove(); // Cleanup on unmount
    }, [navigation, id, customerId, name, title])
  );

  const hasExcludedItems = () => {
    return crops.length > 0 && crops.some((crop) => crop.excludeId !== null);
  };
  const getButtonText = () => {
    return hasExcludedItems() ? "Add more" : "Add";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      <View className="flex bg-white px-3">
        <View className="bg-white flex-row items-center h-17  px-1">
          <TouchableOpacity
            style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
            onPress={() => navigation.navigate("ViewCustomerScreen" as any, { id: id, customerId: customerId, name: name, title: title })}
          >
            <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
              <AntDesign name="left" size={20} color="black" />
            </View>
          </TouchableOpacity>
          {/* Title */}
          <Text
            style={{ fontSize: 18 }}
            className="font-bold text-center text-black flex-grow mr-9 text-xl -mt-2 "
          >
            {customerName.firstName && customerName.lastName
              ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
              : "Loading..."}
          </Text>
        </View>

        <Text
          style={{ fontSize: 18 }}
          className=" text-center text-black flex-grow ml-4 text-xl -mt-6"
        >
          {customerName.firstName && customerName.lastName
            ? `Customer ID : ${customerName.cusId.slice(4)}`
            : "Loading..."}
        </Text>

        <View className="px-6 mt-10">
          <Text className="text-[#874CDB] text-sm font-semibold">
            Preferred Items to Exclude
          </Text>
          <View className="bg-gray-300 h-[1px] mt-2" />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" className="mb-[90%]">
          <View className="px-6 mt-4">
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: hp("60%"),
                }}
              >
                <LottieView
                  source={require("../../assets/images/loading.json")} 
                  style={{ width: wp(40), height: hp(40) }}
                  autoPlay
                  loop
                />
                <Text className="text-center text-lg text-gray-500 mt-4">
                  Loading...
                </Text>
              </View>
            ) : crops.length === 0 || crops.every((crop) => crop.excludeId === null) ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: hp("60%"),
                }}
              >
                <View className="flex-1 justify-center items-center px-4 ">
                  <LottieView
                    source={require("../../assets/images/NoComplaints.json")}
                    style={{ width: wp(50), height: hp(50) }}
                    autoPlay
                    loop
                  />
                </View>
                <View className="mt-[-20]">
                  <Text className="text-center text-lg text-gray-500 mt-[-40%]">
                    No Exclude Item Found
                  </Text>
                </View>
              </View>
            ) : (
              // Show crops list
              crops.map((crop) => (
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

                  <TouchableOpacity onPress={() => deleteCrop(crop.excludeId)}>
                    <View>
                      <MaterialIcons name="delete" size={24} color="#FF0000" />
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}0
          </View>
        </ScrollView>
      </View>
      <TouchableOpacity
        className="absolute bottom-[14%] left-0 right-0 items-center "
        onPress={() => navigation.navigate("ExcludeAddMore", {
          id: id,
          customerId: customerId,
          name: name,
          title: title
        })}
      >
        <LinearGradient
          colors={["#6C3CD1", "#9B65D6"]}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            width: "70%",
            paddingVertical: 12,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            {getButtonText()}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default ExcludeListSummery;
