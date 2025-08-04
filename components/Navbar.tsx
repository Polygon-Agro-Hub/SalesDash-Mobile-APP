import React, { useState, useEffect, useCallback } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { useFocusEffect } from "@react-navigation/native"; 
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
// Redux imports
import { useSelector } from 'react-redux';
import { RootState } from '../services/reducxStore'; // Adjust path as needed

const DashboardIcon = require("../assets/images/Home1.webp");
const DashboardIconFocus = require("../assets/images/hut1.webp");
const ViewOrdersIcon= require("../assets/images/Bullet List1.webp");
const ViewOrdersIconFocus= require("../assets/images/list-items.webp");
const ReminderIcon = require("../assets/images/Notification1.webp");
const ReminderIconFocus = require("../assets/images/bell.webp");
const CustomersIcon = require("../assets/images/user.webp");
const CustomersIconFocus = require("../assets/images/user1.webp");

const NavigationBar = ({
  navigation,
  state,
}: {
  navigation: any;
  state: any;
}) => {
  // Redux
  const isClick = useSelector((state: RootState) => state.input.isClick);

  let tabs = [
    { name: "DashboardScreen", icon: DashboardIcon, focusedIcon: DashboardIconFocus, tabName: "Home" },
    { name: "ViewOrdersScreen", icon: ViewOrdersIcon, focusedIcon: ViewOrdersIconFocus, tabName: "Orders" },
    { name: "ReminderScreen", icon: ReminderIcon, focusedIcon: ReminderIconFocus , tabName: "Reminders"},
    { name: "CustomersScreen", icon: CustomersIcon, focusedIcon: CustomersIconFocus, tabName: "Customers" },
  ];
 
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("DashboardScreen");
  const { t } = useTranslation();
  const [scales] = useState(() => tabs.map(() => new Animated.Value(1)));

  useFocusEffect(
    React.useCallback(() => {
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
    }, []) // Empty dependency array
  );

  let currentTabName = state?.routes?.[state.index]?.name || "DashboardScreen";
  console.log('Current tab:', currentTabName);
  if (currentTabName === 'ViewCustomerScreen' || currentTabName === 'EditCustomerScreen' || currentTabName === 'SelectOrderType' || currentTabName ==='ExcludeListAdd' || currentTabName ==='AddCustomersScreen' ) {
    currentTabName = 'CustomersScreen';
  }

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
  });

  // Hide navbar if keyboard is visible OR if an input field is clicked (isClick === 1)
  if (isKeyboardVisible || isClick === 1) return null;

  return (
    <View className="absolute bottom-0 flex-row justify-between items-center bg-white w-full p-4 rounded-t-3xl" 
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15, 
        borderTopWidth: 2,
        borderTopColor: 'rgba(6, 6, 6, 0.1)',
      }}
    >
      {tabs.map((tab, index) => {
        const isFocused = currentTabName === tab.name;
        return (
          <Animated.View
            style={{
              transform: [{ scale: scales[index] }],
              alignItems: "center",
              justifyContent: "center",
              height: 40,
            }}
            key={index} 
          >
            <TouchableOpacity
              onPress={() => handleTabPress(tab.name, index)}
              style={{
                backgroundColor: isFocused ? "#854BDA" : "#FFFFFF", 
                padding: 8, 
                borderRadius: 9999, 
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                className={`${
                  isFocused
                    ? "bg-[#854BDA] rounded-full"
                    : "items-center justify-center"
                }`}
                source={isFocused ? tab.icon : tab.focusedIcon}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
            <Text
              className={`${
                isFocused ? "text-purple-600" : "text-gray-600"
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