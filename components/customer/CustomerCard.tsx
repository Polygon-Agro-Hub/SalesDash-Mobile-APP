import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  order?: number;
  cusId: string;
  title: string;
  orderCount: number;
  buyerType: "Retail" | "Wholesale" | null;
  companyName?: string | null;
  createdAt?: string;
}

interface CustomerCardProps {
  customer: Customer;
  onPress?: () => void;
}

const getInitials = (firstName?: string, lastName?: string): string => {
  const f = firstName?.trim() || "";
  const l = lastName?.trim() || "";

  if (f && l) {
    const firstChar = f.charAt(0).toUpperCase();
    const lastParts = l.split(/\s+/).filter(Boolean);
    const lastWord = lastParts[lastParts.length - 1] || "";
    const lastChar =
      lastWord.charAt(0).toUpperCase() || l.charAt(0).toUpperCase();
    return `${firstChar}${lastChar}`;
  }

  const full = `${f} ${l}`.trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "C";
};

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onPress }) => {
  const isWholesale = customer.buyerType === "Wholesale";
  const initials = getInitials(customer.firstName, customer.lastName);
  const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: "#E0EAFF",
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        ...Platform.select({
          ios: {
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
          },
          android: {
            elevation: 2,
          },
        }),
      }}
    >
      {/* Left: Avatar with initials */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#EDE5FF",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#7C3AED",
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Middle: Details */}
      <View
        style={{
          flex: 1,
          marginLeft: 14,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: "#0F172A",
            marginBottom: 4,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {fullName}
        </Text>

        {/* Buyer Type Pill */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#630ED4",
            paddingHorizontal: 12,
            paddingVertical: 2.5,
            borderRadius: 12,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            {isWholesale ? "Wholesale" : "Retail"}
          </Text>
        </View>

        {/* Wholesale Company Name */}
        {isWholesale && !!customer.companyName && (
          <Text
            style={{
              fontSize: 13,
              color: "#475569",
              fontWeight: "500",
              marginBottom: 3,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {customer.companyName}
          </Text>
        )}

        {/* Orders Count */}
        <Text
          style={{
            fontSize: 13,
            color: "#475569",
            fontWeight: "500",
          }}
        >
          Orders : {customer.orderCount ?? 0}
        </Text>
      </View>

      {/* Right: Chevron */}
      <View style={{ paddingTop: 6, paddingLeft: 8 }}>
        <Feather name="chevron-right" size={20} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CustomerCard);
