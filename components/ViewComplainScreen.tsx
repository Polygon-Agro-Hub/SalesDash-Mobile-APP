import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal ,ScrollView} from "react-native"; // Added Modal import
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import BackButton from "./BackButton";


type ViewComplainScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewComplainScreen"
>;

interface ViewComplainScreenProps {
  navigation: ViewComplainScreenNavigationProp;
}

const ViewComplainScreen: React.FC<ViewComplainScreenProps> = ({ navigation }) => {

  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null); // State to store selected complaint

  const complaints = [
    {
      id: "1",
      refNo: "SA2412080001",
      date: "5 Nov 2024",
      time: "10:55AM",
      message: "I need to change my account details...",
      status: "Opened",
    },
    {
      id: "2",
      refNo: "SA2412080001",
      date: "5 Aug 2024",
      time: "09:55AM",
      message:
        "I think last month I didn’t receive my bonus money for OT. Please check and update me.",
      status: "Closed",
    },
  ];

  // Check for truly empty complaints (e.g., all fields empty)
  const isEmpty = complaints.every(
    (complaint) => !complaint.refNo && !complaint.message && !complaint.status
  );

  const handleViewResponse = (complaint: any) => {
    console.log("Complaint selected:", complaint); // Debugging log to check if the selected complaint is set
    setSelectedComplaint(complaint); // Set the selected complaint
    setModalVisible(true); // Show the modal
  };

  return (
    <View className="flex-1 bg-white">
    
      
      {/* Header */}
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-25 shadow-md px-2 pt-4">
        <View className="flex-row items-center justify-between ">
          <View  
         
        >
            <BackButton navigation={navigation} />
          </View>

          <Text className="text-white text-lg font-bold flex-1 mx-7">Complaint History</Text>
        </View>
      </LinearGradient>


   <View 
   style = {{ paddingHorizontal: wp(6)}}
   className="flex-1">
      {/* Display Image if no complaints */}
      {isEmpty ? (
        <View className="flex-1 justify-center items-center px-4">
          <Image
            source={require("../assets/images/searchr.png")} // Make sure the image path is correct
            style={{ width: wp("60%"), height: hp("30%"), resizeMode: "contain" }}
          />
          <Text className="text-black text-i text-center mt-4">Your have no previous complaints </Text>
        </View>
      ) : (
        // Complaint List (FlatList)
        <View className="flex-1 px-4 pt-4">
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true} // Enables scrollbar
            contentContainerStyle={{ paddingBottom: 100 }} // Prevents content cutoff
          
            renderItem={({ item }) => (
              <View className="bg-white shadow-md p-4 mb-4 border border-gray-300">
                <Text className="text-gray-700 font-semibold">Ref No: {item.refNo}</Text>
                <Text className="text-gray-500 text-sm">
                  Sent {item.time}, {item.date}
                </Text>
                <Text className="text-gray-700 mt-2">{item.message}</Text>

                {/* Status & Action Buttons */}
                <View className="mt-4 flex-row justify-between items-center">
                  {item.status === "Opened" ? (
                    <Text></Text>
                  ) : (
                    <TouchableOpacity
                      className="bg-black px-3 py-1 text-xs"
                      onPress={() => handleViewResponse(item)} // Trigger modal on press
                    >
                      <Text className="text-white">View Response</Text>
                    </TouchableOpacity>
                  )}
                  <Text
                    className={`px-3 py-1 text-xs ${
                      item.status === "Opened"
                        ? "bg-blue-200 text-blue-700"
                        : "bg-purple-200 text-purple-700"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Modal to View Response */}
      <Modal
  animationType="fade"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View className="flex-1  items-center bg-white bg-opacity-50 ">
   
      {/* Close Button */}
      <TouchableOpacity
        className="absolute top-2 right-2"
        onPress={() => setModalVisible(false)}
      >
        <AntDesign name="closecircle" size={24} color="gray" />
      </TouchableOpacity>

      {/* Modal Header */}
     

      {/* Complaint Details */}
      {selectedComplaint ? (
        <>
          <View className="text-gray-700 mb-2 mt-10 flex-1">
          
          <Text className="text-gray-800 text-base leading-relaxed ml-6">
        <Text className="font-bold ">Dear {selectedComplaint?.userName || "User"},</Text>
        {"\n\n"}
        We are pleased to inform you that your complaint has been resolved.
        {"\n\n"}
        We understand that pricing is influenced by market trends and company
        policies, but we urge [Company Name] to consider reviewing the current pricing
        structure. Offering more equitable compensation would not only support farmers'
        livelihoods but also ensure the continued supply of top-quality crops to your
        company. An investment in fair pricing today would cultivate loyalty and
        sustainability that benefits both sides for the long term.
        {"\n\n"}
        If you have any further concerns or questions, feel free to reach out. Thank you
        for your patience and understanding.
        {"\n\n"}
        Sincerely,
        {"\n"}AgroWorld Customer Support Team
        {"\n"}2024/09/08
      </Text>

          </View>
        </>
      ) : (
        <Text className="text-gray-700">No response available.</Text>
      )}

     

  </View>
</Modal>

</View>
      {/* Bottom Navigation */}
    
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default ViewComplainScreen;
