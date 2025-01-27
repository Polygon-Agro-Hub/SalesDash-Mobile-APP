import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // For icons

interface NavbarProps {
  navigation: any;
  activeTab: string; // Prop to indicate the active tab
}

const Navbar: React.FC<NavbarProps> = ({ navigation, activeTab }) => {
  return (
    <View
      className="bg-white flex-row justify-between items-center p-4 rounded-t-3xl shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        marginTop: -10,
      }}
    >
      {/* Navigation Items */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("DashboardScreen")}
      >
        <Icon
          name="home"
          size={24}
          color={activeTab === "DashboardScreen" ? "#854BDA" : "#A3A3A3"}
        />
        <Text
          className={`${
            activeTab === "DashboardScreen" ? "text-purple-600" : "text-gray-600"
          } text-sm font-medium`}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("OrdersScreen")}
      >
        <Icon
          name="receipt"
          size={24}
          color={activeTab === "OrdersScreen" ? "#854BDA" : "#A3A3A3"}
        />
        <Text
          className={`${
            activeTab === "OrdersScreen" ? "text-purple-600" : "text-gray-600"
          } text-sm font-medium`}
        >
          Orders
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("ReminderScreen")}
      >
        <Icon
          name="notifications"
          size={24}
          color={activeTab === "ReminderScreen" ? "#854BDA" : "#A3A3A3"}
        />
        <Text
          className={`${
            activeTab === "ReminderScreen"
              ? "text-purple-600"
              : "text-gray-600"
          } text-sm font-medium`}
        >
          Reminders
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("CustomersScreen")}
      >
        <Icon
          name="people"
          size={24}
          color={activeTab === "CustomersScreen" ? "#854BDA" : "#A3A3A3"}
        />
        <Text
          className={`${
            activeTab === "CustomersScreen"
              ? "text-purple-600"
              : "text-gray-600"
          } text-sm font-medium`}
        >
          Customers
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Navbar;
