import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import timeValidationService from "@/services/time/timeValidation.service";

interface Props {
  deviceTime?: Date;
  isChecking?: boolean;
  onAdjustDate?: () => void;
  onCheckAgain?: () => void;
  navigation?: any;
  route?: any;
}

const formatDate = (date?: Date | null): string => {
  const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  try {
    return validDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    try {
      return validDate.toLocaleString();
    } catch {
      return new Date().toISOString();
    }
  }
};

const DateInaccurateScreen: React.FC<Props> = ({
  deviceTime: propDeviceTime,
  isChecking: propIsChecking,
  onAdjustDate: propOnAdjustDate,
  onCheckAgain: propOnCheckAgain,
}) => {
  const insets = useSafeAreaInsets();
  const [internalChecking, setInternalChecking] = useState(false);
  const [currentDeviceTime, setCurrentDeviceTime] = useState<Date>(
    propDeviceTime instanceof Date && !isNaN(propDeviceTime.getTime())
      ? propDeviceTime
      : new Date()
  );

  const isChecking = propIsChecking !== undefined ? propIsChecking : internalChecking;

  const handleAdjustDate = () => {
    if (propOnAdjustDate) {
      propOnAdjustDate();
    } else {
      timeValidationService.openDateSettings();
    }
  };

  const handleCheckAgain = async () => {
    if (propOnCheckAgain) {
      propOnCheckAgain();
    } else {
      setInternalChecking(true);
      setCurrentDeviceTime(new Date());
      await timeValidationService.checkServerTime();
      setInternalChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
            paddingLeft: Math.max(insets.left, 24),
            paddingRight: Math.max(insets.right, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* WhatsApp-style Clock Alert Badge */}
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name="clock-alert-outline"
              size={56}
              color="#6C3CD1"
            />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            Your phone date is inaccurate!
          </Text>

          {/* Subheading */}
          <Text style={styles.subheading}>
            Adjust your clock and try again.
          </Text>

          {/* Device Date Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="calendar-alt" size={16} color="#6C3CD1" />
              <Text style={styles.cardHeaderTitle}>
                Current Phone Date & Time
              </Text>
            </View>
            <Text style={styles.deviceDateText}>
              {formatDate(currentDeviceTime)}
            </Text>
            <Text style={styles.cardDescription}>
              Your device's date or time does not match real-world time. Please
              update your device's date and time (or enable "Set Automatically")
              in your phone Settings to continue using SalesDash.
            </Text>
          </View>
        </View>

        {/* Action Buttons Area */}
        <View style={styles.buttonContainer}>
          {/* Primary: Adjust Date (Opens OS Date & Time Settings) */}
          <TouchableOpacity
            onPress={handleAdjustDate}
            activeOpacity={0.8}
            style={styles.adjustDateButton}
          >
            <Text style={styles.adjustDateButtonText}>
              Adjust Date
            </Text>
          </TouchableOpacity>

          {/* Secondary: Check Again */}
          <TouchableOpacity
            onPress={handleCheckAgain}
            disabled={isChecking}
            activeOpacity={0.7}
            style={styles.checkAgainButton}
          >
            {isChecking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6C3CD1" />
                <Text style={styles.loadingText}>
                  Checking time...
                </Text>
              </View>
            ) : (
              <Text style={styles.checkAgainButtonText}>
                Check Again
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  mainContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F1E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5A5859",
    textAlign: "center",
    marginBottom: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#5A5859",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 8,
  },
  deviceDateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 13,
    color: "#6C757D",
    lineHeight: 18,
  },
  buttonContainer: {
    width: "100%",
    paddingTop: 16,
  },
  adjustDateButton: {
    backgroundColor: "#6C3CD1",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    width: "100%",
    marginBottom: 12,
    shadowColor: "#6C3CD1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  adjustDateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkAgainButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  checkAgainButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5A5859",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C3CD1",
    marginLeft: 8,
  },
});

export default DateInaccurateScreen;
