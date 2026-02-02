import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Alert, RefreshControl, BackHandler, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import BackButton from "../common/BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewComplainScreenSkeleton from "../Skeleton/ViewComplainScreenSkeleton";
import { goBack, navigate } from "expo-router/build/global-state/routing";
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from "react-native-gesture-handler";

type ViewComplainScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewComplainScreen">;

interface ViewComplainScreenProps {
  navigation: ViewComplainScreenNavigationProp;
}

const ViewComplainScreen: React.FC<ViewComplainScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null); 
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [loading, setLoading] = useState<boolean>(true); 
  const [formData, setFormData] = useState({ username: "" ,firstName:"",lastName:"" });
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
    (complaint) => !complaint.refNo && !complaint.complain && !complaint.status
  );

  const fetchComplaints = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const complaintsUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/complain/get-complains`;

      setTimeout(async () => {
        try {
          const complaintsResponse = await axios.get(complaintsUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (complaintsResponse.status === 404) {
            Alert.alert("No Complaints", "You have no previous complaints.");
            setComplaints([]);
          } else {
            const formattedComplaints = complaintsResponse.data.map((complaint: { createdAt: string | number | Date }) => {
              const date = new Date(complaint.createdAt);
              
              let hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12;
              
              const timeString = `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}${ampm}`;
              
              const day = date.getDate();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = monthNames[date.getMonth()];
              const year = date.getFullYear();
              
              const dateString = `${day} ${month} ${year}`;
              
              const formattedDateTime = `${timeString},${dateString}`;
              
              return {
                ...complaint,
                createdAt: formattedDateTime,
              };
            });

            setComplaints(formattedComplaints);
          }

          setLoading(false);

          const profileUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/auth/user/profile`;
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

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [navigation])
  );

  // Get status bar height
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <View className="flex-1 bg-white">
      {loading ? (
        <ViewComplainScreenSkeleton />
      ) : (
        <>
          <LinearGradient colors={["#6839CF", "#854EDC"]} className="h-30 shadow-md px-2 pt-2 mb-4">
            <View className="flex-row items-center justify-between mt-[-4]">
              <View className="mt-[-3]">
                <TouchableOpacity 
                  style={{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
                  onPress={() => navigation.navigate("SidebarScreen")}>
                  <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                    <AntDesign name="left" size={20} color="black" />
                  </View>
                </TouchableOpacity>
              </View>
    
              <Text className="text-white text-lg font-bold flex-1 mx-14 mt">Complaint History</Text>
            </View>
          </LinearGradient>
  
          <View style={{ paddingHorizontal: wp(6) }} className="flex-1">
            {isEmpty ? (
              <View className="flex-1 justify-center items-center px-4">
                <Image
                  source={require("../../assets/images/searchr.webp")}
                  style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }}
                />
                <Text className="text-black text-i text-center mt-4">You have no previous complaints</Text>
              </View>
            ) : (
              <FlatList
                data={complaints}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item }) => (
                  <View className="bg-white shadow-md p-4 mb-4 border border-gray-300 rounded-lg">
                    <Text className="text-gray-700 font-semibold">Ref No: {item.refNo}</Text>
                    <Text className="text-gray-500 text-sm">Sent {item.createdAt}</Text>
                    <Text className="text-gray-700 mt-2">{item.complain}</Text>
    
                    <View className="mt-4 flex-row justify-between items-center rounded-lg">
                      {item.status === "Opened" ? (
                        <Text></Text>
                      ) : (
                        <TouchableOpacity
                          className="bg-black px-3 py-1 text-xs rounded-lg"
                          onPress={() => handleViewResponse(item)}
                        >
                          <Text className="text-white text-xs">View Response</Text>
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
        <View className="flex-1 items-center bg-white bg-opacity-50" style={{ paddingTop: statusBarHeight }}>
          <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md" style={{ marginTop: 12}}>
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
              <ScrollView className="mt-4 mb-7">
                <Text className="text-gray-800 text-base leading-relaxed text-left">
                  <Text className="font-">Dear {formData.firstName || "User"} {formData.lastName},</Text>
                  {"\n\n"}
                  We are pleased to inform you that your complaint has been resolved.
                  {"\n\n"}
                  {selectedComplaint.reply || "No response available."}
                  {"\n\n"}
                  If you have any further concerns or questions, feel free to reach out.
                  Thank you for your patience and understanding.
                  {"\n\n"}
                  <Text className="text-left">Sincerely,</Text>
                  {"\n"}
                  <View>
                    <Text className="text-left text-base text-gray-800">Polygon Customer Support Team</Text>
                  </View>
                  {"\n\n"}
                </Text>
  
                {selectedComplaint.replyTime ? (
                  <Text className="text-gray-800 mt-[-28] text-base">
                    {new Date(selectedComplaint.replyTime).toLocaleString("en-US", {
                      year: "numeric",  
                      month: "2-digit",  
                      day: "2-digit", 
                    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2')}
                  </Text>
                ) : (
                  <Text className="text-gray-600 text-sm">No reply time available</Text>
                )}
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