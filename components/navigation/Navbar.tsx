import { useState } from "react";
import { Image, Text, TouchableOpacity, View, Animated } from "react-native";

const DashboardIcon = require("@/assets/images/navbar/home.webp");
const DashboardIconFocus = require("@/assets/images/navbar/home-focus.webp");
const ViewOrdersIcon = require("@/assets/images/navbar/order.webp");
const ViewOrdersIconFocus = require("@/assets/images/navbar/order-focus.webp");
const ReminderIcon = require("@/assets/images/navbar/reminder.webp");
const ReminderIconFocus = require("@/assets/images/navbar/reminder-focus.webp");
const CustomersIcon = require("@/assets/images/navbar/user.webp");
const CustomersIconFocus = require("@/assets/images/navbar/user-focus.webp");

const NavigationBar = ({
  navigation,
  state,
}: {
  navigation: any;
  state: any;
}) => {
  let tabs = [
    {
      name: "DashboardScreen",
      icon: DashboardIcon,
      focusedIcon: DashboardIconFocus,
      tabName: "Home",
    },
    {
      name: "ViewOrdersScreen",
      icon: ViewOrdersIcon,
      focusedIcon: ViewOrdersIconFocus,
      tabName: "Orders",
    },
    {
      name: "ReminderScreen",
      icon: ReminderIcon,
      focusedIcon: ReminderIconFocus,
      tabName: "Reminders",
    },
    {
      name: "CustomersScreen",
      icon: CustomersIcon,
      focusedIcon: CustomersIconFocus,
      tabName: "Customers",
    },
  ];

  const [scales] = useState(() => tabs.map(() => new Animated.Value(1)));

  let currentTabName = state?.routes?.[state.index]?.name || "DashboardScreen";

  if (
    currentTabName === "ViewCustomerScreen" ||
    currentTabName === "EditCustomerScreen" ||
    currentTabName === "SelectOrderType" ||
    currentTabName === "ExcludeListAdd" ||
    currentTabName === "AddCustomersScreen"
  ) {
    currentTabName = "CustomersScreen";
  }

  const handleTabPress = (tabName: string, index: number) => {
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
  };

  return (
    <View
      className="absolute bottom-0 flex-row justify-between items-center bg-white w-full p-4 rounded-t-3xl px-10"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
        borderTopWidth: 2,
        borderTopColor: "rgba(6, 6, 6, 0.1)",
      }}
    >
      {tabs.map((tab, index) => {
        const isFocused = currentTabName === tab.name;

        return (
          <Animated.View
            key={index}
            style={{
              transform: [{ scale: scales[index] }],
              alignItems: "center",
              justifyContent: "center",
              height: 40,
            }}
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
