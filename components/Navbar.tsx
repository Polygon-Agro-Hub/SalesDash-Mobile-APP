// import React from "react";
// import { View, TouchableOpacity, Text, Image } from "react-native";
// import Icon from "react-native-vector-icons/Ionicons"; // For icons

// interface NavbarProps {
//   navigation: any;
//   activeTab: string; // Prop to indicate the active tab
// }

// const Navbar: React.FC<NavbarProps> = ({ navigation, activeTab }) => {
//   return (
//     <View
//       className="bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg"
//       style={{
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: -4 },
//         shadowOpacity: 0.2,
//         shadowRadius: 8,
//         elevation: 10,
//         marginTop: -10,
//       }}
//     >
//       {/* Navigation Items */}
    
//  <TouchableOpacity
//   className="items-center"
//   onPress={() => navigation.navigate("DashboardScreen")}
// >
//   {/* Active / Inactive Image */}
//   {activeTab === "DashboardScreen" ? (
//     <View
      // style={{
      //   backgroundColor: "#854BDA", // Purple background when active
      //   padding: 8, // Space around the image
      //   borderRadius: 9999, // Make it circular
      //   alignItems: "center",
      //   justifyContent: "center",
      // }}
//     >
//       <Image
//         source={require("../assets/images/Home1.png")}
//         style={{
//           width: 20,
//           height: 20,
//         }}
//       />
//     </View>
//   ) : (
//     <View
//     style={{
//       backgroundColor: "#FFFFFF", // Purple background when active
//       padding: 8, // Space around the image
//       borderRadius: 9999, // Make it circular
//       alignItems: "center",
//       justifyContent: "center",
//     }}
//   >
//     <Image
//       source={require("../assets/images/hut1.png")}
//       style={{
//         width: 20,
//         height: 20,
//       }}
//     />
//     </View>
//   )}

//   {/* Text below image */}
//   <Text
//     className={`${
//       activeTab === "DashboardScreen" ? "text-purple-600" : "text-gray-600"
//     } text-sm font-medium`}
//   >
//     Home
//   </Text>
// </TouchableOpacity>



     


// <TouchableOpacity
//   className="items-center"
//   onPress={() => navigation.navigate("ViewOrdersScreen")}
// >
//   {/* Active / Inactive Image */}
//   {activeTab === "ViewOrdersScreen" ? (
//     <View
//       style={{
//         backgroundColor: "#854BDA", // Purple background when active
//         padding: 8, // Space around the image
//         borderRadius: 9999, // Make it circular
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <Image
//         source={require("../assets/images/Bullet List1.png")}
//         style={{
//           width: 20,
//           height: 20,
//         }}
//       />
//     </View>
//   ) : (
//     <View
//     style={{
//       backgroundColor: "#FFFFFF", // Purple background when active
//       padding: 8, // Space around the image
//       borderRadius: 9999, // Make it circular
//       alignItems: "center",
//       justifyContent: "center",
//     }}
//   >
//     <Image
//       source={require("../assets/images/list-items.png")}
//       style={{
//         width: 20,
//         height: 20,
//       }}
//     />
//     </View>
//   )}

//   {/* Text below image */}
//   <Text
//     className={`${
//       activeTab === "ViewOrdersScreen" ? "text-purple-600" : "text-gray-600"
//     } text-sm font-medium`}
//   >
//    Orders
//   </Text>
// </TouchableOpacity>


    
//     <TouchableOpacity
//   className="items-center"
//   onPress={() => navigation.navigate("ReminderScreen")}
// >
//   {/* Active / Inactive Image */}
//   {activeTab === "ReminderScreen" ? (
//     <View
//       style={{
//         backgroundColor: "#854BDA", // Purple background when active
//         padding: 8, // Space around the image
//         borderRadius: 9999, // Make it circular
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
       
//       <Image
//         source={require("../assets/images/Notification1.png")}
//         style={{
//           width: 20,
//           height: 20,
//         }}
//       />
//     </View>
//   ) : (
//     <View
//       style={{
//         backgroundColor: "#FFFFFF", // Purple background when active
//         padding: 8, // Space around the image
//         borderRadius: 9999, // Make it circular
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//     <Image
//       source={require("../assets/images/bell.png")}
//       style={{
//         width: 20,
//         height: 20,
//       }}
//     />
//     </View>
//   )}

//   {/* Text below image */}
//   <Text
//     className={`${
//       activeTab === "ReminderScreen" ? "text-purple-600" : "text-gray-600"
//     } text-sm font-medium`}
//   >
//     Reminders
//   </Text>
// </TouchableOpacity>

   

// <TouchableOpacity
//   className="items-center"
//   onPress={() => navigation.navigate("CustomersScreen")}
// >
//   {/* Active / Inactive Image */}
//   {activeTab === "CustomersScreen" ? (
//     <View
//       style={{
//         backgroundColor: "#854BDA", // Purple background when active
//         padding: 8, // Space around the image
//         borderRadius: 9999, // Make it circular
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <Image
//         source={require("../assets/images/user.png")}
//         style={{
//           width: 20,
//           height: 20,
//         }}
//       />
//     </View>
//   ) : (
//     <View
//       style={{
//         backgroundColor: "#FFFFFF", // Purple background when active
//         padding: 8, // Space around the image
//         borderRadius: 9999, // Make it circular
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//     <Image
//       source={require("../assets/images/user1.png")}
//       style={{
//         width: 20,
//         height: 20,
//       }}
//     />
//     </View>
//   )}

//   {/* Text below image */}
//   <Text
//     className={`${
//       activeTab === "CustomersScreen" ? "text-purple-600" : "text-gray-600"
//     } text-sm font-medium`}
//   >
//    Customers
//   </Text>
// </TouchableOpacity>
//     </View>
//   );
// };

// export default Navbar;


import React, { useState, useEffect, useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/components/types";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  Animated,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { useFocusEffect, useNavigationState } from "@react-navigation/native"; 
import axios, { AxiosError } from "axios";
import environment from "@/environment/environment";
import { interpolate, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { use } from "i18next";

const DashboardIcon = require("../assets/images/Home1.png");
const DashboardIconFocus = require("../assets/images/hut1.png");
const ViewOrdersIcon= require("../assets/images/Bullet List1.png");
const ViewOrdersIconFocus= require("../assets/images/list-items.png");
const ReminderIcon = require("../assets/images/Notification1.png");
const ReminderIconFocus = require("../assets/images/bell.png");
const CustomersIcon = require("../assets/images/user.png");
const CustomersIconFocus = require("../assets/images/user1.png");

const NavigationBar = ({
  navigation,
  state,
}: {
  navigation: any;
  state: any;
}) => {
  let tabs = [
    { name: "DashboardScreen", icon: DashboardIcon, focusedIcon: DashboardIconFocus, tabName: "Home" },
    { name: "ViewOrdersScreen", icon: ViewOrdersIcon, focusedIcon: ViewOrdersIconFocus, tabName: "Orders" },
    { name: "ReminderScreen", icon: ReminderIcon, focusedIcon: ReminderIconFocus , tabName: "Reminders"},
    { name: "CustomersScreen", icon: CustomersIcon, focusedIcon: CustomersIconFocus, tabName: "Customers" },
  ];
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("DashboardScreen");
  const { t } = useTranslation();
  const [scales] = useState(() => tabs.map(() => new Animated.Value(1)));

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  let currentTabName = state?.routes?.[state.index]?.name || "DashboardScreen";
  // if (currentTabName === 'CropCalander') {
  //   currentTabName = "MyCrop";
  // }

  useEffect(() => {
    const loadActiveTab = async () => {
      const storedTab = await AsyncStorage.getItem("activeTab");
      const currentRoute =
        navigation.getState().routes[navigation.getState().index].name;

      if (!storedTab || storedTab !== currentRoute) {
        setActiveTab(currentRoute);
        await AsyncStorage.setItem("activeTab", currentRoute); 
      } else {
        setActiveTab(storedTab); 
      }
    };
    loadActiveTab();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadActiveTab = async () => {
        const currentRoute =
          navigation.getState().routes[navigation.getState().index].name;
        setActiveTab(currentRoute);
        await AsyncStorage.setItem("activeTab", currentRoute); 
      };
      loadActiveTab();
    }, [])
  );


  const handleTabPress = async (tabName: string, index: number) => {
    Animated.spring(scales[index], {
      toValue: 1.1,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scales[index], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    navigation.navigate(tabName);
    console.log("tabName", tabName);
  };


  const tabPositionX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  }
  );
  if (isKeyboardVisible) return null;
  return (
    <View className="absolute bottom-0 flex-row justify-between items-center bg-white w-full p-4 rounded-t-3xl shadow-lg shadow-black/10" >

   {tabs.map((tab, index) => {
  const isFocused = currentTabName === tab.name;
  console.log("isFocused", isFocused);
  return (
    <Animated.View
      style={{
        transform: [{ scale: scales[index] }],
        alignItems: "center",
        justifyContent: "center",
        height: 40,
      }}
      // style={[animatedStyle,
      //   {
      //     backgroundColor: isFocused ? "#854BDA" : "#FFFFFF", // Purple background when active
      //     padding: 8, // Space around the image
      //     borderRadius: 9999, // Make it circular
      //     alignItems: "center",
      //     justifyContent: "center",
      //   }
      // ]}
      key={index} // This is the key prop
    >
      <TouchableOpacity
        onPress={() => handleTabPress(tab.name, index)}
   
        style={{
          backgroundColor: isFocused ? "#854BDA" : "#FFFFFF", // Purple background when active
          padding: 8, // Space around the image
          borderRadius: 9999, // Make it circular
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View>
          
        </View>
        <Image
             className={`${
              isFocused
                ? " bg-[#854BDA] rounded-full   "
                : "items-center justify-center"
            }`}
          source={isFocused ? tab.icon :tab.focusedIcon}
          style={{ width: 20, height: 20}}
        />

      </TouchableOpacity>
      <Text
    className={`${
      isFocused? "text-purple-600" : "text-gray-600"
    } text-sm font-medium`}
  >
   {tab.tabName}
  </Text>
    </Animated.View>
  );
})}

    </View>
  
  );
};

export default NavigationBar;
