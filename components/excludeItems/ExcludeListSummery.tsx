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
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import NoDataFound from "../common/NoDataFound";
import { Entypo } from "@expo/vector-icons";
import FixedMarqueeText from "../common/MarqueeText";
import LottieView from "lottie-react-native";

type ExcludeListSummeryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeListSummery"
>;

interface ExcludeListAddProps {
  navigation: ExcludeListSummeryNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeListSummery">;
}

interface ExcludeCrop {
  excludeId: number;
  displayName: string;
  image: string;
}

interface PreferCrop {
  preId: number;
  displayName: string;
  image: string;
}

const ExcludeListSummery: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId, name, title, phoneNumber, cusId, id } =
    route.params || {};

  const [excludeCrops, setExcludeCrops] = useState<ExcludeCrop[]>([]);
  const [preferCrops, setPreferCrops] = useState<PreferCrop[]>([]);

  const [selectedExcludeIds, setSelectedExcludeIds] = useState<number[]>([]);
  const [selectedPreferIds, setSelectedPreferIds] = useState<number[]>([]);

  const nameParts = (name || "").trim().split(/\s+/);
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [customerName, setCustomerName] = useState<{
    firstName: string;
    lastName: string;
    title: string;
    cusId: string;
    phoneNumber: string;
  }>({
    firstName: initialFirstName,
    lastName: initialLastName,
    title: title || "",
    cusId: cusId || "",
    phoneNumber: phoneNumber || "",
  });

  const fetchLists = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      const headers = { Authorization: `Bearer ${storedToken}` };

      const [excludeRes, preferRes] = await Promise.allSettled([
        axios.get(`${environment.API_BASE_URL}api/customer/excludelist`, {
          params: { customerId },
          headers,
        }),
        axios.get(`${environment.API_BASE_URL}api/customer/preferlist`, {
          params: { customerId },
          headers,
        }),
      ]);

      if (excludeRes.status === "fulfilled" && excludeRes.value.data?.data) {
        const data = excludeRes.value.data.data;
        const valid = data.filter(
          (item: any) => item.excludeId && item.displayName,
        );
        setExcludeCrops(valid);

        if (data.length > 0) {
          const { firstName, lastName, title, cusId, phoneNumber } = data[0];
          setCustomerName((prev) => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            title: title || prev.title,
            cusId: cusId || prev.cusId,
            phoneNumber: phoneNumber || prev.phoneNumber,
          }));
        }
      } else {
        setExcludeCrops([]);
      }

      if (preferRes.status === "fulfilled" && preferRes.value.data?.data) {
        const data = preferRes.value.data.data;
        const valid = data.filter(
          (item: any) => item.preId && item.displayName,
        );
        setPreferCrops(valid);

        if (data.length > 0 && !customerName.firstName) {
          const { firstName, lastName, title, cusId, phoneNumber } = data[0];
          setCustomerName((prev) => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            title: title || prev.title,
            cusId: cusId || prev.cusId,
            phoneNumber: phoneNumber || prev.phoneNumber,
          }));
        }
      } else {
        setPreferCrops([]);
      }
    } catch (err) {
      console.error("Failed to fetch prefer/exclude lists:", err);
      setExcludeCrops([]);
      setPreferCrops([]);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      setSelectedExcludeIds([]);
      setSelectedPreferIds([]);
      fetchLists();
    }, [fetchLists]),
  );

  const toggleSelectExclude = (excludeId: number) => {
    setSelectedExcludeIds((prev) =>
      prev.includes(excludeId)
        ? prev.filter((id) => id !== excludeId)
        : [...prev, excludeId],
    );
  };

  const toggleSelectPrefer = (preId: number) => {
    setSelectedPreferIds((prev) =>
      prev.includes(preId)
        ? prev.filter((id) => id !== preId)
        : [...prev, preId],
    );
  };

  const toggleSelectAllExclude = () => {
    if (selectedExcludeIds.length === excludeCrops.length) {
      setSelectedExcludeIds([]);
    } else {
      setSelectedExcludeIds(excludeCrops.map((crop) => crop.excludeId));
    }
  };

  const toggleSelectAllPrefer = () => {
    if (selectedPreferIds.length === preferCrops.length) {
      setSelectedPreferIds([]);
    } else {
      setSelectedPreferIds(preferCrops.map((crop) => crop.preId));
    }
  };

  const deleteExcludeCrop = async (excludeId: number) => {
    Alert.alert("Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) return;

            const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist/delete`;
            const response = await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              params: { excludeId },
            });

            if (response.status === 200) {
              setExcludeCrops((prev) =>
                prev.filter((crop) => crop.excludeId !== excludeId),
              );
              setSelectedExcludeIds((prev) =>
                prev.filter((id) => id !== excludeId),
              );
            }
          } catch (err) {
            console.error("Error deleting exclude crop:", err);
          }
        },
      },
    ]);
  };

  const deletePreferCrop = async (preId: number) => {
    Alert.alert("Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) return;

            const apiUrl = `${environment.API_BASE_URL}api/customer/preferlist/delete`;
            const response = await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              params: { preferId: preId },
            });

            if (response.status === 200) {
              setPreferCrops((prev) =>
                prev.filter((crop) => crop.preId !== preId),
              );
              setSelectedPreferIds((prev) => prev.filter((id) => id !== preId));
            }
          } catch (err) {
            console.error("Error deleting prefer crop:", err);
          }
        },
      },
    ]);
  };

  const deleteSelectedExcludeCrops = async () => {
    if (selectedExcludeIds.length === 0) return;

    Alert.alert(
      "Delete Selected",
      `Delete ${selectedExcludeIds.length} selected item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem("authToken");
              if (!storedToken) return;

              const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist/delete`;
              await Promise.all(
                selectedExcludeIds.map((excludeId) =>
                  axios.delete(apiUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    params: { excludeId },
                  }),
                ),
              );

              setExcludeCrops((prev) =>
                prev.filter(
                  (crop) => !selectedExcludeIds.includes(crop.excludeId),
                ),
              );
              setSelectedExcludeIds([]);
            } catch (err) {
              console.error("Error bulk deleting exclude crops:", err);
            }
          },
        },
      ],
    );
  };

  const deleteSelectedPreferCrops = async () => {
    if (selectedPreferIds.length === 0) return;

    Alert.alert(
      "Delete Selected",
      `Delete ${selectedPreferIds.length} selected item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem("authToken");
              if (!storedToken) return;

              const apiUrl = `${environment.API_BASE_URL}api/customer/preferlist/delete`;
              await Promise.all(
                selectedPreferIds.map((preId) =>
                  axios.delete(apiUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    params: { preferId: preId },
                  }),
                ),
              );

              setPreferCrops((prev) =>
                prev.filter((crop) => !selectedPreferIds.includes(crop.preId)),
              );
              setSelectedPreferIds([]);
            } catch (err) {
              console.error("Error bulk deleting prefer crops:", err);
            }
          },
        },
      ],
    );
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
    }, [navigation, customerId]),
  );

  const fullTitle =
    customerName.firstName && customerName.lastName
      ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
      : "Loading...";

  const Checkbox = ({
    checked,
    onPress,
  }: {
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} hitSlop={8}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? "#374151" : "#9CA3AF",
          backgroundColor: checked ? "#374151" : "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ExcludeListAdd", {
              customerId: Number(customerId),
            })
          }
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

        <View
          style={{
            flex: 1,
            alignItems: "center",
            overflow: "hidden",
            marginHorizontal: 8,
          }}
        >
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

        <View style={{ width: 45, marginRight: 10 }} />
      </View>

      <View className="mx-auto w-full max-w-[500px]">
        <Text
          style={{ fontSize: 16, marginTop: -3 }}
          className="text-center text-black"
        >
          {customerName.firstName && customerName.lastName
            ? `Customer ID : ${customerName.cusId}`
            : "Loading..."}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1 mb-24"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="mx-auto w-full max-w-[500px] px-6">
          {/* ---------------- Items prefer to include ---------------- */}
          <View
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <View
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ backgroundColor: "#E6F2E5" }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: "#E6F2E5",
                }}
              >
                <Ionicons name="heart" size={16} color="#16A34A" />
              </View>
              <Text style={{ fontSize: 14, color: "#34C759" }}>
                Items prefer to Include
              </Text>
            </View>

            {preferCrops.length === 0 ? (
              <View className="items-center py-8">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ExcludeListAdd", {
                      customerId: Number(customerId),
                    })
                  }
                  className="items-center"
                >
                  <LottieView
                    source={require("../../assets/json/add-items.json")}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                  <Text className="text-[#8C46FB] font-semibold">Add Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="px-4 pb-3">
                {selectedPreferIds.length > 0 && (
                  <View className="flex-row justify-end items-center gap-1 py-2">
                    <MaterialIcons name="delete" size={16} color="#FF000D" />
                    <TouchableOpacity onPress={deleteSelectedPreferCrops}>
                      <Text
                        style={{
                          color: "#FF000D",
                          fontSize: 12,
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        Delete Selected Items
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View
                  className="flex-row justify-between items-center py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Checkbox
                      checked={preferCrops.length > 0 && selectedPreferIds.length === preferCrops.length}
                      onPress={toggleSelectAllPrefer}
                    />
                    <Text
                      style={{ fontSize: 13, color: "#9CA3AF" }}
                    >
                      Item ({String(preferCrops.length).padStart(2, "0")})
                    </Text>
                  </View>
                  <Text
                    className="flex-1 text-center"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Name
                  </Text>
                  <Text
                    className="flex-1 text-right"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Action
                  </Text>
                </View>

                {preferCrops.map((crop) => (
                  <View
                    key={crop.preId}
                    className="flex-row justify-between items-center py-3"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedPreferIds.includes(crop.preId)}
                        onPress={() => toggleSelectPrefer(crop.preId)}
                      />
                      <Image
                        source={{ uri: crop.image }}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className="text-sm text-black flex-1 text-center"
                      numberOfLines={2}
                    >
                      {crop.displayName}
                    </Text>
                    <View className="flex-1 items-end">
                      <TouchableOpacity
                        onPress={() => deletePreferCrop(crop.preId)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#FF000D"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ---------------- Items prefer to exclude ---------------- */}
          <View
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <View
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ backgroundColor: "#FDEEEE" }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "500", color: "#DC2626" }}
              >
                Items prefer to exclude
              </Text>
            </View>

            {excludeCrops.length === 0 ? (
              <View className="items-center py-8">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ExcludeListAdd", {
                      customerId: Number(customerId),
                    })
                  }
                  className="items-center"
                >
                  <LottieView
                    source={require("../../assets/json/add-items.json")}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                  <Text className="text-[#8C46FB] font-semibold">Add Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="px-4 pb-3">
                {selectedExcludeIds.length > 0 && (
                  <View className="flex-row justify-end items-center gap-1 py-2">
                    <MaterialIcons name="delete" size={16} color="#DC2626" />
                    <TouchableOpacity onPress={deleteSelectedExcludeCrops}>
                      <Text
                        style={{
                          color: "#FF000D",
                          fontSize: 12,
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        Delete Selected Items
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View
                  className="flex-row justify-between items-center py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Checkbox
                      checked={excludeCrops.length > 0 && selectedExcludeIds.length === excludeCrops.length}
                      onPress={toggleSelectAllExclude}
                    />
                    <Text
                      style={{ fontSize: 13, color: "#9CA3AF" }}
                    >
                      Item ({String(excludeCrops.length).padStart(2, "0")})
                    </Text>
                  </View>
                  <Text
                    className="flex-1 text-center"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Name
                  </Text>
                  <Text
                    className="flex-1 text-right"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Action
                  </Text>
                </View>

                {excludeCrops.map((crop) => (
                  <View
                    key={crop.excludeId}
                    className="flex-row justify-between items-center py-3"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedExcludeIds.includes(crop.excludeId)}
                        onPress={() => toggleSelectExclude(crop.excludeId)}
                      />
                      <Image
                        source={{ uri: crop.image }}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className="text-sm text-black flex-1 text-center"
                      numberOfLines={2}
                    >
                      {crop.displayName}
                    </Text>
                    <View className="flex-1 items-end">
                      <TouchableOpacity
                        onPress={() => deleteExcludeCrop(crop.excludeId)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#FF0000"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {excludeCrops.length === 0 && preferCrops.length === 0 && (
            <View className="mt-2">
              <NoDataFound message="No preferred or excluded items yet" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
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
              shadowOffset: { width: 0, height: 2 },
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
