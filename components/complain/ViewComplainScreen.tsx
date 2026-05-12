import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  RefreshControl,
  BackHandler,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewComplainScreenSkeleton from "./ViewComplainScreenSkeleton";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import CustomHeader from "../common/CustomHeader";

type ViewComplainScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewComplainScreen"
>;

interface ViewComplainScreenProps {
  navigation: ViewComplainScreenNavigationProp;
}

const ViewComplainScreen: React.FC<ViewComplainScreenProps> = ({
  navigation,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  interface Complaint {
    id: number;
    refNo: string;
    complain: string;
    createdAt: string;
    status: string;
    reply?: string;
    userName?: string;
    replyTime: string;
  }

  const isEmpty = complaints.every(
    (complaint) => !complaint.refNo && !complaint.complain && !complaint.status,
  );

  const fetchComplaints = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const complaintsUrl = `${environment.API_BASE_URL.replace(/\/$/, "")}/api/complain/get-complains`;

      setTimeout(async () => {
        try {
          const complaintsResponse = await axios.get(complaintsUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (complaintsResponse.status === 404) {
            Alert.alert("No Complaints", "You have no previous complaints.");
            setComplaints([]);
          } else {
            const formattedComplaints = complaintsResponse.data.map(
              (complaint: { createdAt: string | number | Date }) => {
                const date = new Date(complaint.createdAt);

                let hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12;
                hours = hours ? hours : 12;

                const timeString = `${hours.toString().padStart(2, "0")}.${minutes.toString().padStart(2, "0")}${ampm}`;

                const day = date.getDate();
                const monthNames = [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ];
                const month = monthNames[date.getMonth()];
                const year = date.getFullYear();

                const dateString = `${day} ${month} ${year}`;

                const formattedDateTime = `${timeString},${dateString}`;

                return {
                  ...complaint,
                  createdAt: formattedDateTime,
                };
              },
            );

            setComplaints(formattedComplaints);
          }

          setLoading(false);

          const profileUrl = `${environment.API_BASE_URL.replace(/\/$/, "")}/api/auth/user/profile`;
          const profileResponse = await axios.get(profileUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          setFormData(profileResponse.data.data);
        } catch (error) {
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Error fetching complaints or user profile:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchComplaints();
    } catch (error) {
      console.error("Error refreshing complaints:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewResponse = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("SidebarScreen" as any);
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
    <View className="flex-1 bg-white">
      {loading ? (
        <ViewComplainScreenSkeleton />
      ) : (
        <>
          <CustomHeader
            title="Complaint History"
            navigation={navigation}
            onBackPress={() => navigation.navigate("SidebarScreen")}
            linearGradient
          />
          <View className="flex-1 px-6">
            {isEmpty ? (
              <View className="flex-1 justify-center items-center">
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-black italic text-center mt-4">
                  You have no previous complaints
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                <FlatList
                  data={complaints}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                  renderItem={({ item }) => (
                    <View className="bg-white shadow-md p-4 mb-4 border border-gray-300 rounded-lg">
                      <Text className="text-gray-700 font-semibold">
                        Ref No: {item.refNo}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Sent {item.createdAt}
                      </Text>
                      <Text className="text-gray-700 mt-2">
                        {item.complain}
                      </Text>

                      <View className="mt-4 flex-row justify-between items-center rounded-lg">
                        {item.status === "Opened" ? (
                          <Text></Text>
                        ) : (
                          <TouchableOpacity
                            className="bg-black px-3 py-1 text-xs rounded-lg"
                            onPress={() => handleViewResponse(item)}
                          >
                            <Text className="text-white text-xs">
                              View Response
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text
                          className={`px-3 py-1 text-xs rounded-lg ${item.status === "Opened" ? "bg-blue-200 text-blue-700" : "bg-purple-200 text-purple-700"}`}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </>
      )}

      {/* Modal to View Response */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center bg-white">
          <View
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            style={{ marginTop: 12 }}
          >
            {/* Close Button */}
            <TouchableOpacity
              className="absolute top-3 right-3 z-10"
              onPress={() => setModalVisible(false)}
              style={{ zIndex: 10 }}
            >
              <AntDesign name="close-circle" size={24} color="gray" />
            </TouchableOpacity>

            {/* Complaint Response Content */}
            {selectedComplaint ? (
              <ScrollView>
                <View className="mt-4 mb-7">
                  <Text className="text-gray-800 text-base leading-relaxed text-left">
                    <Text className="font-">
                      Dear {formData.firstName || "User"} {formData.lastName},
                    </Text>
                    {"\n\n"}
                    We are pleased to inform you that your complaint has been
                    resolved.
                    {"\n\n"}
                    {selectedComplaint.reply || "No response available."}
                    {"\n\n"}
                    If you have any further concerns or questions, feel free to
                    reach out.
                    {"\n"}
                    Thank you for your patience and understanding.
                    {"\n\n"}
                    <Text className="text-left">Sincerely,</Text>
                    {"\n"}
                    <View>
                      <Text className="text-left text-base text-gray-800">
                        Polygon Customer Support Team
                      </Text>
                    </View>
                    {"\n\n"}
                  </Text>

                  {selectedComplaint.replyTime ? (
                    <Text className="text-gray-800 mt-[-10%] text-base">
                      {(() => {
                        const date = new Date(selectedComplaint.replyTime);
                        let hours = date.getHours();
                        const minutes = date.getMinutes();
                        const ampm = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        const timeString = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1)
                          .toString()
                          .padStart(2, "0");
                        const day = date.getDate().toString().padStart(2, "0");
                        const dateString = `${year}/${month}/${day}`;

                        return `At ${timeString} on ${dateString}`;
                      })()}
                    </Text>
                  ) : (
                    <Text className="text-gray-600 text-sm">
                      No reply time available
                    </Text>
                  )}
                </View>
              </ScrollView>
            ) : (
              <Text className="text-gray-700">No response available.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ViewComplainScreen;
