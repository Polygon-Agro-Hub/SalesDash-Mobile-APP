import React from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
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
  {/* Active / Inactive Image */}
  {activeTab === "DashboardScreen" ? (
    <View
      style={{
        backgroundColor: "#854BDA", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={require("../assets/images/Home1.png")}
        style={{
          width: 20,
          height: 20,
        }}
      />
    </View>
  ) : (
    <View
    style={{
      backgroundColor: "#FFFFFF", // Purple background when active
      padding: 8, // Space around the image
      borderRadius: 9999, // Make it circular
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Image
      source={require("../assets/images/hut1.png")}
      style={{
        width: 20,
        height: 20,
      }}
    />
    </View>
  )}

  {/* Text below image */}
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
  onPress={() => navigation.navigate("ViewOrdersScreen")}
>
  {/* Active / Inactive Image */}
  {activeTab === "ViewOrdersScreen" ? (
    <View
      style={{
        backgroundColor: "#854BDA", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={require("../assets/images/Bullet List1.png")}
        style={{
          width: 20,
          height: 20,
        }}
      />
    </View>
  ) : (
    <View
    style={{
      backgroundColor: "#FFFFFF", // Purple background when active
      padding: 8, // Space around the image
      borderRadius: 9999, // Make it circular
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Image
      source={require("../assets/images/list-items.png")}
      style={{
        width: 20,
        height: 20,
      }}
    />
    </View>
  )}

  {/* Text below image */}
  <Text
    className={`${
      activeTab === "ViewOrdersScreen" ? "text-purple-600" : "text-gray-600"
    } text-sm font-medium`}
  >
   Orders
  </Text>
</TouchableOpacity>


    
    <TouchableOpacity
  className="items-center"
  onPress={() => navigation.navigate("ReminderScreen")}
>
  {/* Active / Inactive Image */}
  {activeTab === "ReminderScreen" ? (
    <View
      style={{
        backgroundColor: "#854BDA", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
       
      <Image
        source={require("../assets/images/Notification1.png")}
        style={{
          width: 20,
          height: 20,
        }}
      />
    </View>
  ) : (
    <View
      style={{
        backgroundColor: "#FFFFFF", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
    <Image
      source={require("../assets/images/bell.png")}
      style={{
        width: 20,
        height: 20,
      }}
    />
    </View>
  )}

  {/* Text below image */}
  <Text
    className={`${
      activeTab === "ReminderScreen" ? "text-purple-600" : "text-gray-600"
    } text-sm font-medium`}
  >
    Reminders
  </Text>
</TouchableOpacity>

   

<TouchableOpacity
  className="items-center"
  onPress={() => navigation.navigate("CustomersScreen")}
>
  {/* Active / Inactive Image */}
  {activeTab === "CustomersScreen" ? (
    <View
      style={{
        backgroundColor: "#854BDA", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={require("../assets/images/user.png")}
        style={{
          width: 20,
          height: 20,
        }}
      />
    </View>
  ) : (
    <View
      style={{
        backgroundColor: "#FFFFFF", // Purple background when active
        padding: 8, // Space around the image
        borderRadius: 9999, // Make it circular
        alignItems: "center",
        justifyContent: "center",
      }}
    >
    <Image
      source={require("../assets/images/user1.png")}
      style={{
        width: 20,
        height: 20,
      }}
    />
    </View>
  )}

  {/* Text below image */}
  <Text
    className={`${
      activeTab === "CustomersScreen" ? "text-purple-600" : "text-gray-600"
    } text-sm font-medium`}
  >
   Customers
  </Text>
</TouchableOpacity>
    </View>
  );
};

export default Navbar;
