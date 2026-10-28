import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface NegativeCreditBalanceAlertProps {
  creditBalance: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const NegativeCreditBalanceAlert: React.FC<NegativeCreditBalanceAlertProps> = ({
  creditBalance,
  containerStyle,
}) => {
  if (creditBalance >= 0) return null;

  const formattedAmount = Math.abs(creditBalance).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FEF6F0",
          borderWidth: 1,
          borderColor: "#FDE4D4",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        containerStyle,
      ]}
    >
      <MaterialIcons
        name="warning"
        size={26}
        color="#FF6400"
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#000000",
            lineHeight: 18,
          }}
        >
          Negative Credit Balance{" "}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#FF6400",
            }}
          >
            (- Rs. {formattedAmount})
          </Text>
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#5E6089",
            marginTop: 3,
            lineHeight: 16,
          }}
        >
          Ask the customer to clear the balance first.
        </Text>
      </View>
    </View>
  );
};

export default NegativeCreditBalanceAlert;
