import { useState } from "react";
import { Text, TouchableOpacity, View, Animated } from "react-native";
import Octicons from "react-native-vector-icons/Octicons";
import Ionicons from "react-native-vector-icons/Ionicons";
import Fontisto from "react-native-vector-icons/Fontisto";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const tabs = [
  {
    name: "DashboardScreen",
    tabName: "Home",
    Icon: ({ focused }: { focused: boolean }) => (
      <Octicons
        name={focused ? "home-fill" : "home"}
        size={20}
        color={focused ? "#FFFFFF" : "#B6B7BC"}
      />
    ),
  },
  {
    name: "ViewOrdersScreen",
    tabName: "Orders",
    Icon: ({ focused }: { focused: boolean }) => (
      <Ionicons
        name={focused ? "list-circle" : "list-circle-outline"}
        size={22}
        color={focused ? "#FFFFFF" : "#B6B7BC"}
      />
    ),
  },
  {
    name: "ReminderScreen",
    tabName: "Reminders",
    Icon: ({ focused }: { focused: boolean }) => (
      <Fontisto
        name={focused ? "bell-alt" : "bell"}
        size={18}
        color={focused ? "#FFFFFF" : "#B6B7BC"}
      />
    ),
  },
  {
    name: "CustomersScreen",
    tabName: "Customers",
    Icon: ({ focused }: { focused: boolean }) => (
      <FontAwesome
        name={focused ? "user-circle" : "user-circle-o"}
        size={20}
        color={focused ? "#FFFFFF" : "#B6B7BC"}
      />
    ),
  },
];

const NavigationBar = ({
  navigation,
  state,
}: {
  navigation: any;
  state: any;
}) => {
  const [scales] = useState(() => tabs.map(() => new Animated.Value(1)));

  let currentTabName = state?.routes?.[state.index]?.name || "DashboardScreen";

  if (
    [
      "ViewCustomerScreen",
      "EditCustomerScreen",
      "SelectOrderType",
      "ExcludeListAdd",
      "AddCustomersScreen",
    ].includes(currentTabName)
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
        shadowColor: "#736e6e",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 15,
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
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <tab.Icon focused={isFocused} />
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
