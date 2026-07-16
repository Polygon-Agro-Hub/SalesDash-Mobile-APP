import React from "react";
import { View, Text } from "react-native";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";

interface CityDeliveryStatusProps {
  city: string;
  filteredCities: any[];
  isCityKnown: boolean;
  isCityDeliverable: boolean;
  canEdit?: boolean;
}

const CityDeliveryStatus: React.FC<CityDeliveryStatusProps> = ({
  city,
  filteredCities,
  isCityKnown,
  isCityDeliverable,
  canEdit = true,
}) => {
  if (!canEdit) return null;
  if (city.trim().length === 0 || filteredCities.length > 0) return null;

  if (!isCityKnown) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FEF6ED",
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginTop: 18,
          borderWidth: 1,
          borderColor: "#FFDCB5",
        }}
      >
        <FontAwesome6
          name="circle-info"
          size={18}
          color="#DC2626"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            color: "#991B1B",
            fontSize: 13,
            fontWeight: "600",
            flexShrink: 1,
          }}
        >
          City not found.
        </Text>
      </View>
    );
  }

  if (isCityDeliverable) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#EEFAF3",
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginTop: 18,
          borderWidth: 1,
          borderColor: "#D2ECE1",
        }}
      >
        <FontAwesome6
          name="circle-info"
          size={18}
          color="#059669"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            color: "#065F46",
            fontSize: 13,
            fontWeight: "600",
            flexShrink: 1,
          }}
        >
          Great news! We deliver to {city}!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF6ED",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginTop: 18,
        borderWidth: 1,
        borderColor: "#FFDCB5",
      }}
    >
      <FontAwesome6
        name="circle-info"
        size={18}
        color="#EC6821"
        style={{ marginRight: 8 }}
      />
      <Text
        style={{
          color: "#EC6821",
          fontSize: 13,
          fontWeight: "600",
          flexShrink: 1,
        }}
      >
        Delivery not available in {city} yet, but we're working on it and coming
        to your area soon!
      </Text>
    </View>
  );
};

export default CityDeliveryStatus;
