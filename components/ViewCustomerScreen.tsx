// import React, { useState, useEffect } from "react";
// import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Linking, Keyboard, Platform, KeyboardAvoidingView } from "react-native";
// import { RouteProp } from "@react-navigation/native"; // Import RouteProp for type safety
// import { RootStackParamList } from "./types"; // Adjust if you have a type file for navigation
// import Navbar from "./Navbar";
// import { StackNavigationProp } from "@react-navigation/stack"; // Import StackNavigationProp
// import { AntDesign } from "@expo/vector-icons";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import BackButton from "./BackButton";

// // Define navigation prop type
// type ViewCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewCustomerScreen">;

// // Define route prop type
// type ViewCustomerScreenRouteProp = RouteProp<RootStackParamList, "ViewCustomerScreen">;

// type ViewCustomerScreenProps = {
//   route: ViewCustomerScreenRouteProp;
//   navigation: ViewCustomerScreenNavigationProp;
// };

// const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({ route, navigation }) => {
//   const [isKeyboardVisible, setKeyboardVisible] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const [selectedFilter, setSelectedFilter] = useState("One Time");

//   const { name, number,id  ,customerId} = route.params;

//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
//     const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

//     return () => {
//       keyboardDidShowListener.remove();
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   const handleGetACall = () => {
//     const phoneNumber = `tel:${number}`;
//     Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
//   };

//   const filters = ["One Time", "Twice a Week", "Weekly"];

//   // Static order data
//   const orders = [
//     { id: "1", orderNumber: "1234", schedule: "Monday", time: "9:00 AM - 12:00 PM", status: "Delivered", type: "One Time" },
//     { id: "2", orderNumber: "5678", schedule: "Tuesday", time: "2:00 PM - 4:00 PM", status: "On the way", type: "Twice a Week" },
//     { id: "3", orderNumber: "9101", schedule: "Wednesday", time: "10:00 AM - 1:00 PM", status: "Delivered", type: "Weekly" },
//     { id: "4", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Pending", type: "One Time" },
//     { id: "5", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Processing", type: "One Time" },
//   ];

//   // Filter the orders based on the selected filter and search text
//   const filteredOrders = orders.filter(
//     (order) =>
//       order.type === selectedFilter &&
//       (!searchText || order.orderNumber.includes(searchText))
//   );

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
//       <View className="flex-1 bg-white">
//         {/* Header Section */}
//         <View className="relative">
//           <View className="bg-white flex-row rounded-b-[35px] items-center justify-between h-28 z-50 shadow-lg px-5">
         
//             <View className="mt-[-8%] ml-[-2%]">
//              <BackButton navigation={navigation} />
//              </View> 

//             {/* Customer Info */}
//             {/* <View className="flex-1 ml-[8%] mt-[-3%]">
//   <Text className="text-xl font-bold text-gray-800" style={{ paddingHorizontal: wp("15%"), marginLeft: wp("2%") }}>
//     {name}
//   </Text>
//   <Text className=" text-gray-500" style={{ paddingHorizontal: wp("8%") }}>
//     Customer ID: {customerId}
//   </Text>
// </View> */}
// <View className="flex-1 justify-center items-center mt-[-3%]">
//   <Text className="text-xl font-bold text-gray-800" style={{ paddingHorizontal: wp("15%"), textAlign: 'center' }}>
//     {name}
//   </Text>
//   <Text className="text-gray-500" style={{ paddingHorizontal: wp("8%"), textAlign: 'center' }}>
//     Customer ID: {customerId}
//   </Text>
// </View>


//             {/* Edit Button */} 
//             <TouchableOpacity className="px-6 mt-[-20%] mr-[-10%]"
//   onPress={() => {

//     navigation.navigate("EditCustomerScreen", {
//       id:id,
//     });
//   }}
// >

//               <MaterialIcons name="edit" size={28} color="#6839CF" />
//             </TouchableOpacity>
//           </View>

//           {/* Action Buttons (Purple Section) */}
//           <View className="bg-[#F1E8FF] rounded-b-[25px] pt-6 pb-3 shadow-md mt-[-20] items-center z-5">
//             <View className="flex-row justify-between mb-4 px-5 px-3 mx-5">
//               {/* Get a Call Button */}
//               <TouchableOpacity onPress={handleGetACall} className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4">
//                 <Image source={require("../assets/images/call.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
//                 <Text className="text-white font-bold">Get a Call</Text>
//               </TouchableOpacity>

//               {/* New Order Button */}
//               <TouchableOpacity 
//               onPress={() => navigation.navigate("OrderScreen")}
//               className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4">
//                 <Image source={require("../assets/images/newOrder.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
//                 <Text className="text-white font-bold">New Order</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Search Bar */}
//         <View className="flex-row items-center bg-[#F5F1FC] px-8 py-2 rounded-full mt-4 mb-2 mx-5 w-[90%] shadow-sm">
//           <TextInput
//             placeholder="Search By Order Number"
//             placeholderTextColor="#6839CF"
//             className="flex-1 text-sm text-purple"
//             onChangeText={(text) => setSearchText(text)}
//             value={searchText}
//             style={{ fontStyle: 'italic' }}
//           />
//           <Image source={require("../assets/images/search.png")} className="w-8 h-8" resizeMode="contain" />
//         </View>

//         {/* Filters */}
//         <View className="flex-row flex-wrap justify-center mt-[2%] mb-[1%] mx-[2%]">
//   {filters.map((filter) => (
//     <TouchableOpacity
//       key={filter}
//       className={`px-[4%] py-[1.5%] rounded-full border ${selectedFilter === filter ? "bg-[#6B3BCF] border-[#6B3BCF]" : "border-[#6B3BCF]"}`}
//       style={{ minWidth: wp("28%"), marginHorizontal: wp("1%"), marginBottom: hp("1%") }} // Ensures responsiveness
//       onPress={() => setSelectedFilter(filter)}
//     >
//       <Text className={`text-center text-sm ${selectedFilter === filter ? "text-white font-bold" : "text-[#6B3BCF]"}`}>
//         {filter}
//       </Text>
//     </TouchableOpacity>
//   ))}
// </View>

//         {/* Orders List */}
//         {filteredOrders.length > 0 ? (
//          <FlatList
//                              data={filteredOrders}
//                              keyExtractor={(item) => item.id}
//                              renderItem={({ item }) => (
//                                  <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-4">
//                                    {/* Order number and status tag in the same row */}
//                                    <View className="flex-row justify-between items-center">
//                                      <Text className="text-lg font-semibold text-gray-900">
//                                        Order: {item.orderNumber}
//                                      </Text>
//                                      <View className={`px-3 py-1 rounded-full ${ 
//                                        item.status === "Delivered" ? "bg-[#CCFBF1]" 
//                                        : item.status === "On the way" ? "bg-[#FFFD99]" 
//                                        : item.status === "Processing" ? "bg-[#CFE1FF]"
//                                        : "bg-[#EAEAEA]"
//                                      }`}>
//                                        <Text className={`text-xs font-semibold ${
//                                          item.status === "Delivered" ? "text-[#0D9488]"
//                                          : item.status === "On the way" ? "text-[#A6A100]"
//                                          : item.status === "Processing" ? "text-[#3B82F6]"
//                                          : "text-[#393939]"
//                                        }`}>
//                                          {item.status}
//                                        </Text>
//                                      </View>
//                                    </View>
                                   
//                                    {/* Schedule Details */}
//                                    <Text className="text-sm text-[#808FA2] mt-1">
//                                      Scheduled to: {item.schedule}
//                                    </Text>
//                                    <Text className="text-sm text-[#808FA2]">
//                                      Within {item.time}
//                                    </Text>
//                                  </View>
//                                )}
                               
//                              contentContainerStyle={{ paddingBottom: 16 }}
//                            />
//         ) : (
//           <Text className="text-center text-gray-500">No orders found.</Text>
//         )}
//       </View>

//       {/* Navbar */}
//       {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
//     </KeyboardAvoidingView>
//   );
// };

// export default ViewCustomerScreen;

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Linking, Keyboard, Platform, KeyboardAvoidingView } from "react-native";
import { RouteProp } from "@react-navigation/native"; // Import RouteProp for type safety
import { RootStackParamList } from "./types"; // Adjust if you have a type file for navigation
import { StackNavigationProp } from "@react-navigation/stack"; // Import StackNavigationProp
import { AntDesign } from "@expo/vector-icons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "./BackButton";

// Define navigation prop type
type ViewCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewCustomerScreen">;

// Define route prop type
type ViewCustomerScreenRouteProp = RouteProp<RootStackParamList, "ViewCustomerScreen">;

type ViewCustomerScreenProps = {
  route: ViewCustomerScreenRouteProp;
  navigation: ViewCustomerScreenNavigationProp;
};

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({ route, navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("One Time");

  const { name, number,id  ,customerId} = route.params;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleGetACall = () => {
    const phoneNumber = `tel:${number}`;
    Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
  };

  const filters = ["One Time", "Twice a Week", "Weekly"];

  // Static order data
  const orders = [
    { id: "1", orderNumber: "1234", schedule: "Monday", time: "9:00 AM - 12:00 PM", status: "Delivered", type: "One Time" },
    { id: "2", orderNumber: "5678", schedule: "Tuesday", time: "2:00 PM - 4:00 PM", status: "On the way", type: "Twice a Week" },
    { id: "3", orderNumber: "9101", schedule: "Wednesday", time: "10:00 AM - 1:00 PM", status: "Delivered", type: "Weekly" },
    { id: "4", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Pending", type: "One Time" },
    { id: "5", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Processing", type: "One Time" },
  ];

  // Filter the orders based on the selected filter and search text
  const filteredOrders = orders.filter(
    (order) =>
      order.type === selectedFilter &&
      (!searchText || order.orderNumber.includes(searchText))
  );

  return (
   <KeyboardAvoidingView 
                           behavior={Platform.OS === "ios" ? "padding" : "height"}
                           enabled 
                           className="flex-1"
                           >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="relative">
          <View className="bg-white flex-row rounded-b-[35px] items-center justify-between h-28 z-50 shadow-lg px-5">
         
            <View className="mt-[-8%] ml-[-2%]">
             <BackButton navigation={navigation} />
             </View> 

            {/* Customer Info */}
            {/* <View className="flex-1 ml-[8%] mt-[-3%]">
  <Text className="text-xl font-bold text-gray-800" style={{ paddingHorizontal: wp("15%"), marginLeft: wp("2%") }}>
    {name}
  </Text>
  <Text className=" text-gray-500" style={{ paddingHorizontal: wp("8%") }}>
    Customer ID: {customerId}
  </Text>
</View> */}
<View className="flex-1 justify-center items-center mt-[-3%]">
  <Text className="text-xl font-bold text-gray-800" style={{ paddingHorizontal: wp("15%"), textAlign: 'center' }}>
    {name}
  </Text>
  <Text className="text-gray-500" style={{ paddingHorizontal: wp("8%"), textAlign: 'center' }}>
    Customer ID: {customerId}
  </Text>
</View>


            {/* Edit Button */} 
            <TouchableOpacity className="px-6 mt-[-20%] mr-[-10%]"
  onPress={() => {

    navigation.navigate("EditCustomerScreen", {
      id:id,
    });
  }}
>

              <MaterialIcons name="edit" size={28} color="#6839CF" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons (Purple Section) */}
          <View className="bg-[#F1E8FF] rounded-b-[25px] pt-6 pb-3 shadow-md mt-[-20] items-center z-5">
            <View className="flex-row justify-between mb-4 px-5 px-3 mx-5">
              {/* Get a Call Button */}
              <TouchableOpacity onPress={handleGetACall} className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4">
                <Image source={require("../assets/images/call.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
                <Text className="text-white font-bold">Get a Call</Text>
              </TouchableOpacity>

              {/* New Order Button */}
              <TouchableOpacity 
             onPress={() => {
              console.log("cus id____________",id);  // Log the id
              navigation.navigate("OrderScreen", { id: id });  // Navigate to OrderScreen
            }}
              className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4">
                <Image source={require("../assets/images/newOrder.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
                <Text className="text-white font-bold">New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-8 py-2 rounded-full mt-4 mb-2 mx-5 w-[90%] shadow-sm">
          <TextInput
            placeholder="Search By Order Number"
            placeholderTextColor="#6839CF"
            className="flex-1 text-sm text-purple"
            onChangeText={(text) => setSearchText(text)}
            value={searchText}
            style={{ fontStyle: 'italic' }}
          />
          <Image source={require("../assets/images/search.png")} className="w-8 h-8" resizeMode="contain" />
        </View>

        {/* Filters */}
        <View className="flex-row flex-wrap justify-center mt-[2%] mb-[1%] mx-[2%]">
  {filters.map((filter) => (
    <TouchableOpacity
      key={filter}
      className={`px-[4%] py-[1.5%] rounded-full border ${selectedFilter === filter ? "bg-[#6B3BCF] border-[#6B3BCF]" : "border-[#6B3BCF]"}`}
      style={{ minWidth: wp("28%"), marginHorizontal: wp("1%"), marginBottom: hp("1%") }} // Ensures responsiveness
      onPress={() => setSelectedFilter(filter)}
    >
      <Text className={`text-center text-sm ${selectedFilter === filter ? "text-white font-bold" : "text-[#6B3BCF]"}`}>
        {filter}
      </Text>
    </TouchableOpacity>
  ))}
</View>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate("Main",{screen:"View_CancelOrderScreen"})}
          >
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-4">
              {/* Order number and status tag in the same row */}
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-900">
                  Order: {item.orderNumber}
                </Text>
                <View className={`px-3 py-1 rounded-full ${ 
                  item.status === "Delivered" ? "bg-[#CCFBF1]" 
                  : item.status === "On the way" ? "bg-[#FFFD99]" 
                  : item.status === "Processing" ? "bg-[#CFE1FF]"
                  : "bg-[#EAEAEA]"
                }`}>
                  <Text className={`text-xs font-semibold ${
                    item.status === "Delivered" ? "text-[#0D9488]"
                    : item.status === "On the way" ? "text-[#A6A100]"
                    : item.status === "Processing" ? "text-[#3B82F6]"
                    : "text-[#393939]"
                  }`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              
              {/* Schedule Details */}
              <Text className="text-sm text-[#808FA2] mt-1">
                Scheduled to: {item.schedule}
              </Text>
              <Text className="text-sm text-[#808FA2]">
                Within {item.time}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    ) : (
      <Text className="text-center text-gray-500">No orders found.</Text>
    )}
      </View>

      {/* Navbar */}
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;

