import React, { useCallback, useState } from "react";
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
import LoadingPage from "../common/LoadingPage";
import FixedMarqueeText from "../common/MarqueeText";
import { Entypo } from "@expo/vector-icons";

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
    title: string;
    cusId: string;
  }>({
    firstName: "",
    lastName: "",
    title: "",
    cusId: "",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProducts = async () => {
        setLoading(true);
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
            const { firstName, lastName, title, cusId } =
              response.data.data[0];
            setCustomerName({ firstName, lastName, title, cusId });
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
      return () => {};
    }, [id]),
  );

  const fullTitle =
    customerName.firstName && customerName.lastName
      ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
      : "Loading...";

  const handleBackPress = () => {
    navigation.navigate("Main" as any, {
      screen: "ViewCustomerScreen",
      params: {
        id: id,
        customerId: customerId,
        name: name,
        title: title,
      },
    });
  };

  const deleteCrop = async (excludeId: number) => {
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
        handleBackPress();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, id, customerId, name, title]),
  );

  const hasExcludedItems = () => {
    return crops.length > 0 && crops.some((crop) => crop.excludeId !== null);
  };

  const getButtonText = () => {
    return hasExcludedItems() ? "Add More" : "Add";
  };

  if (loading) {
    return <LoadingPage message="Loading Details..." fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      {/* ── Inline header with marquee support ── */}
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
          onPress={handleBackPress}
          style={{
            width: 45,
            height: 45,
            borderRadius: 25,
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
        <View style={{ flex: 1, alignItems: "center", overflow: "hidden" }}>
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
      <View className="mx-auto w-full  max-w-[500px]">
        <Text
          style={{ fontSize: 16 ,marginTop: -3}}
          className="text-center text-black "
        >
          {customerName.firstName && customerName.lastName
            ? `Customer ID : ${customerName.cusId}`
            : "Loading..."}
        </Text>
      </View>

      <View className="flex-1 bg-white px-6 overflow-scroll mx-auto w-full max-w-[500px]">
        <View className="mt-4">
          <Text className="text-[#874CDB] text-sm font-semibold">
            Preferred Items to Exclude
          </Text>
          <View className="bg-gray-300 h-[1px] mt-2" />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="mb-20"
        >
          <View className="mt-4">
            {crops.length === 0 ||
            crops.every((crop) => crop.excludeId === null) ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: hp("50%"),
                }}
              >
                <View className="flex-1 justify-center items-center px-4">
                  <LottieView
                    source={require("@/assets/json/no-data.json")}
                    style={{ width: wp(50), height: hp(50) }}
                    autoPlay
                    loop
                  />
                </View>
                <View className="justify-center mt-[-30%] items-center">
                  <Text className="text-black italic text-center mt-[-35%]">
                    No Exclude Item Found
                  </Text>
                </View>
              </View>
            ) : (
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
            )}
          </View>
        </ScrollView>
      </View>

      {/* Add / Add More button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 px-6 items-center">
        <TouchableOpacity
          className="w-full max-w-[500px] items-center"
          onPress={() =>
            navigation.navigate("ExcludeAddMore", {
              id: id,
              customerId: customerId,
              name: name,
              title: title,
            })
          }
        >
          <LinearGradient
            colors={["#6839CF", "#874DDB"]}
            start={[0, 0]}
            end={[1, 1]}
            style={{
              width: "70%",
              paddingVertical: 12,
              borderRadius: 25,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {getButtonText()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ExcludeListSummery;
