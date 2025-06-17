// import React, { useState, useEffect } from "react";
// import { View, Text, FlatList, TouchableOpacity, Image, Modal, Alert, RefreshControl } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { AntDesign } from "@expo/vector-icons";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "./types";
// import BackButton from "./BackButton";
// import axios from "axios";
// import environment from "@/environment/environment";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import ViewComplainScreenSkeleton from "../components/Skeleton/ViewComplainScreenSkeleton";  // Assuming skeleton loader component
// import { goBack, navigate } from "expo-router/build/global-state/routing";

// type ViewComplainScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewComplainScreen">;

// interface ViewComplainScreenProps {
//   navigation: ViewComplainScreenNavigationProp;
// }

// const ViewComplainScreen: React.FC<ViewComplainScreenProps> = ({ navigation }) => {
//   const [modalVisible, setModalVisible] = useState(false); 
//   const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null); 
//   const [complaints, setComplaints] = useState<Complaint[]>([]); 
//   const [loading, setLoading] = useState<boolean>(true); 
//   const [formData, setFormData] = useState({ username: "" });
//   const [refreshing, setRefreshing] = useState(false);

//   interface Complaint {
//     id: number;
//     refNo: string;
//     complain: string;
//     createdAt: string;
//     status: string;
//     reply?: string;
//     userName?: string;
//     replyTime: string;
//   }

//   const isEmpty = complaints.every(
//     (complaint) => !complaint.refNo && !complaint.complain && !complaint.status
//   );


//   const fetchComplaints = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem("authToken");
//       if (!storedToken) {
//         Alert.alert("Error", "No authentication token found");
//         return;
//       }
  
//       const complaintsUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/complain/get-complains`;
  
//       setTimeout(async () => {
//         try {
//           const complaintsResponse = await axios.get(complaintsUrl, {
//             headers: { Authorization: `Bearer ${storedToken}` },
//           });
  
//           if (complaintsResponse.status === 404) {
      
//             Alert.alert("No Complaints", "You have no previous complaints.");
//             setComplaints([]);
//           } else {
//             const formattedComplaints = complaintsResponse.data.map((complaint: { createdAt: string | number | Date }) => ({
//               ...complaint,
//               createdAt: new Date(complaint.createdAt).toLocaleString("en-US", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//                 day: "numeric",
//                 month: "short",
//                 year: "numeric",
//               }),
//             }));
  
//             setComplaints(formattedComplaints);
//           }
  
//           setLoading(false);
  
//           const profileUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/auth/user/profile`;
//           const profileResponse = await axios.get(profileUrl, {
//             headers: { Authorization: `Bearer ${storedToken}` },
//           });
  
//           setFormData(profileResponse.data.data);
//         } catch (error) {
//           console.error("Error fetching complaints or user profile:", error);
//           setLoading(false);
//           Alert.alert("Error", "Failed to fetch complaints or user profile");
//         }
//       }, 2000); 
//     } catch (error) {
//       console.error("Error fetching complaints or user profile:", error);
//       setLoading(false);
//       Alert.alert("Error", "Failed to fetch complaints or user profile");
//     }
//   };
  

//   useEffect(() => {
//     fetchComplaints(); 
//   }, []);
  
//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await fetchComplaints(); 
//     } catch (error) {
//       console.error("Error refreshing complaints:", error);
//     } finally {
//       setRefreshing(false); 
//     }
//   };

//   const handleViewResponse = (complaint: Complaint) => {
//     setSelectedComplaint(complaint);
//     setModalVisible(true);
//   };

  
//   return (
//     <View className="flex-1 bg-white">
//       {loading ? (
//         <ViewComplainScreenSkeleton />
//       ) : (
//         <>
//           {/* Header */}
//           <LinearGradient colors={["#6839CF", "#854EDC"]} className="h-30 shadow-md px-2 pt-2 mb-4">
//             <View className="flex-row items-center justify-between mt-[-4]">
//               <View className="mt-[-3]">
//         <TouchableOpacity 
//         style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
//        onPress={() => navigation.navigate("SidebarScreen")}>
//          <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
//            <AntDesign name="left" size={20} color="black" />
//          </View>
//        </TouchableOpacity>              </View>
    
//               <Text className="text-white text-lg font-bold flex-1 mx-14 mt ">Complaint History</Text>
//             </View>
//           </LinearGradient>
  
//           <View style={{ paddingHorizontal: wp(6) }} className="flex-1">
//             {/* Complaint List (FlatList) */}
//             {isEmpty ? (
//               <View className="flex-1 justify-center items-center px-4">
//                 <Image
//                   source={require("../assets/images/searchr.png")}
//                   style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }}
//                 />
//                 <Text className="text-black text-i text-center mt-4">You have no previous complaints</Text>
//               </View>
//             ) : (
//               <FlatList
//                 data={complaints}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsVerticalScrollIndicator={true}
//                 contentContainerStyle={{ paddingBottom: 100 }}
//                 refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//                 renderItem={({ item }) => (
//                   <View className="bg-white shadow-md p-4 mb-4 border border-gray-300 rounded-lg">
//                     <Text className="text-gray-700 font-semibold">Ref No: {item.refNo}</Text>
//                     <Text className="text-gray-500 text-sm">Sent {item.createdAt}</Text>
//                     <Text className="text-gray-700 mt-2">{item.complain}</Text>
    
      
//                     <View className="mt-4 flex-row justify-between items-center rounded-lg">
//                       {item.status === "Opened" ? (
//                         <Text></Text>
//                       ) : (
//                         <TouchableOpacity
//                           className="bg-black px-3 py-1 text-xs rounded-lg"
//                           onPress={() => handleViewResponse(item)}
//                         >
//                           <Text className="text-white text-xs">View Response</Text>
//                         </TouchableOpacity>
//                       )}
//                       <Text
//                         className={`px-3 py-1 text-xs rounded-lg ${item.status === "Opened" ? "bg-blue-200 text-blue-700" : "bg-purple-200 text-purple-700"}`}
//                       >
//                         {item.status}
//                       </Text>
//                     </View>
//                   </View>
//                 )}
//               />
//             )}
//           </View>
//         </>
//       )}
  
//       {/* Modal to View Response */}
      // <Modal
      //   animationType="fade"
      //   transparent={true}
      //   visible={modalVisible}
      //   onRequestClose={() => setModalVisible(false)}
      // >
      //   <View className="flex-1 items-center bg-white bg-opacity-50">
      //     <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      //       {/* Close Button */}
      //       <TouchableOpacity className="absolute top-3 right-3" onPress={() => setModalVisible(false)}>
      //         <AntDesign name="closecircle" size={24} color="gray" />
      //       </TouchableOpacity>
  
      //       {/* Complaint Response Content */}
      //       {selectedComplaint ? (
      //         <View className="mt-4">
      //           <Text className="text-gray-800 text-base leading-relaxed text-left">
      //             <Text className="font-bold">Dear {formData.username || "User"},</Text>
      //             {"\n\n"}
      //             {selectedComplaint.reply || "No response available."}
      //             {"\n\n"}
      //             <Text className="text-left">Sincerely,</Text>
      //             {"\n"}
      //             <Text className="text-left">AgroWorld Customer Support Team</Text>
      //             {"\n\n"}
      //           </Text>
  
      //           {selectedComplaint.replyTime ? (
      //             <Text className="text-gray-800 mt-[-28] text-base">
      //               {new Date(selectedComplaint.replyTime).toLocaleString("en-US", {
      //                 day: "2-digit",     
      //                 month: "2-digit",    
      //                 year: "numeric",    
      //               })}
      //             </Text>
      //           ) : (
      //             <Text className="text-gray-600 text-sm">No reply time available</Text>
      //           )}
      //         </View>
      //       ) : (
      //         <Text className="text-gray-700">No response available.</Text>
      //       )}
      //     </View>
      //   </View>
      // </Modal>
  
//       {/* Bottom Navigation */}
//     </View>
//   );
// };

// export default ViewComplainScreen;

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Alert, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewComplainScreenSkeleton from "../components/Skeleton/ViewComplainScreenSkeleton";  // Assuming skeleton loader component
import { goBack, navigate } from "expo-router/build/global-state/routing";

type ViewComplainScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewComplainScreen">;

interface ViewComplainScreenProps {
  navigation: ViewComplainScreenNavigationProp;
}

const ViewComplainScreen: React.FC<ViewComplainScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false); 
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null); 
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [loading, setLoading] = useState<boolean>(true); 
  const [formData, setFormData] = useState({ username: "" });
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
            const formattedComplaints = complaintsResponse.data.map((complaint: { createdAt: string | number | Date }) => ({
              ...complaint,
              createdAt: new Date(complaint.createdAt).toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            }));
  
            setComplaints(formattedComplaints);
          }
  
          setLoading(false);
  
          const profileUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/auth/user/profile`;
          const profileResponse = await axios.get(profileUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
  
          setFormData(profileResponse.data.data);
        } catch (error) {
        //  console.error("Error fetching complaints or user profile:", error);
          setLoading(false);
      //    Alert.alert("Error", "Failed to fetch complaints or user profile");
        }
      }, 2000); 
    } catch (error) {
      console.error("Error fetching complaints or user profile:", error);
      setLoading(false);
  //    Alert.alert("Error", "Failed to fetch complaints or user profile");
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

  
  return (
    <View className="flex-1 bg-white">
      {loading ? (
        <ViewComplainScreenSkeleton />
      ) : (
        <>
          {/* Header */}
          <LinearGradient colors={["#6839CF", "#854EDC"]} className="h-30 shadow-md px-2 pt-2 mb-4">
            <View className="flex-row items-center justify-between mt-[-4]">
              <View className="mt-[-3]">
                <TouchableOpacity 
                  style={{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
                  onPress={() => navigation.navigate("DashboardScreen")}>
                  <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                    <AntDesign name="left" size={20} color="black" />
                  </View>
                </TouchableOpacity>
              </View>
    
              <Text className="text-white text-lg font-bold flex-1 mx-14 mt">Complaint History</Text>
            </View>
          </LinearGradient>
  
          <View style={{ paddingHorizontal: wp(6) }} className="flex-1">
            {/* Complaint List (FlatList) */}
            {isEmpty ? (
              <View className="flex-1 justify-center items-center px-4">
                <Image
                  source={require("../assets/images/searchr.webp")}
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
        <View className="flex-1 items-center bg-white bg-opacity-50">
          <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            {/* Close Button */}
            <TouchableOpacity className="absolute top-3 right-3" onPress={() => setModalVisible(false)}>
              <AntDesign name="closecircle" size={24} color="gray" />
            </TouchableOpacity>
  
            {/* Complaint Response Content */}
            {selectedComplaint ? (
              <View className="mt-4">
                <Text className="text-gray-800 text-base leading-relaxed text-left">
                  <Text className="font-bold">Dear {formData.username || "User"},</Text>
                  {"\n\n"}
                  {selectedComplaint.reply || "No response available."}
                  {"\n\n"}
                  <Text className="text-left">Sincerely,</Text>
                  {"\n"}
                  <Text className="text-left">AgroWorld Customer Support Team</Text>
                  {"\n\n"}
                </Text>
  
                {selectedComplaint.replyTime ? (
                  <Text className="text-gray-800 mt-[-28] text-base">
                    {new Date(selectedComplaint.replyTime).toLocaleString("en-US", {
                      day: "2-digit",     
                      month: "2-digit",    
                      year: "numeric",    
                    })}
                  </Text>
                ) : (
                  <Text className="text-gray-600 text-sm">No reply time available</Text>
                )}
              </View>
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

