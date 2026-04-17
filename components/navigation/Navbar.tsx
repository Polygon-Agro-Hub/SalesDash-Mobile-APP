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
      style={{
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        width: "100%",
        paddingVertical: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
              flex: 1,
              transform: [{ scale: scales[index] }],
            }}
          >
            <TouchableOpacity
              onPress={() => handleTabPress(tab.name, index)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 4,
              }}
            >
              <View
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
              </View>

              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  fontWeight: "500",
                  color: isFocused ? "#9333ea" : "#4b5563",
                }}
              >
                {tab.tabName}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default NavigationBar;
