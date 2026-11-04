import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import crashReporterService from "@/services/crash/crash-reporter.service";

interface CrashReportModalProps {
  visible: boolean;
  onClose: () => void;
  initialError?: string;
  initialStack?: string;
  screenName?: string;
}

const CrashReportModal: React.FC<CrashReportModalProps> = ({
  visible,
  onClose,
  initialError,
  initialStack,
  screenName = "User Feedback / Manual Report",
}) => {
  const [userComment, setUserComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [resultInfo, setResultInfo] = useState<any>(null);

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await crashReporterService.sendReport({
        errorMessage: initialError || "User Reported Issue / Manual Diagnostic",
        errorStack: initialStack || "Triggered manually from app support section",
        screenName,
        userComment: userComment.trim(),
      });

      if (res.success) {
        setSentSuccess(true);
        setResultInfo(res.data);
      } else {
        Alert.alert(
          "Submission Error",
          res.message || "Could not send report. Please check your network connection."
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit crash report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSentSuccess(false);
    setUserComment("");
    setResultInfo(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDone}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: wp(5),
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            width: "100%",
            maxWidth: 420,
            padding: wp(6),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {sentSuccess ? (
            <View style={{ alignItems: "center", paddingVertical: hp(2) }}>
              <View
                style={{
                  width: hp(8),
                  height: hp(8),
                  borderRadius: hp(4),
                  backgroundColor: "#E8F8EE",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: hp(2),
                }}
              >
                <Ionicons name="checkmark-circle" size={hp(5.5)} color="#10B981" />
              </View>
              <Text
                style={{
                  fontSize: hp(2.3),
                  fontWeight: "bold",
                  color: "#111827",
                  textAlign: "center",
                  marginBottom: hp(1),
                }}
              >
                Crash Report Sent!
              </Text>
              <Text
                style={{
                  fontSize: hp(1.6),
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: hp(2.3),
                  marginBottom: hp(2.5),
                  paddingHorizontal: wp(2),
                }}
              >
                The diagnostic report and error logs were emailed to the technical support team.
              </Text>

              {resultInfo?.recipients && (
                <View
                  style={{
                    backgroundColor: "#F3F4F6",
                    padding: wp(3),
                    borderRadius: 10,
                    marginBottom: hp(2.5),
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(1.4),
                      fontWeight: "600",
                      color: "#4B5563",
                      marginBottom: 4,
                    }}
                  >
                    Delivered to recipients:
                  </Text>
                  {resultInfo.recipients.map((email: string, idx: number) => (
                    <Text
                      key={idx}
                      style={{ fontSize: hp(1.4), color: "#6C3CD1", fontWeight: "500" }}
                    >
                      • {email}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={handleDone}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#6C3CD1", "#8C52FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: hp(1.8),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: hp(1.8),
                      fontWeight: "bold",
                    }}
                  >
                    Done
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: hp(2),
                }}
              >
                <View
                  style={{
                    width: hp(5),
                    height: hp(5),
                    borderRadius: hp(2.5),
                    backgroundColor: "#FEE2E2",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: wp(3),
                  }}
                >
                  <Ionicons name="bug-outline" size={hp(2.8)} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: hp(2.1),
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    Send Crash Report
                  </Text>
                  <Text style={{ fontSize: hp(1.5), color: "#6B7280" }}>
                    Help us identify and fix bugs
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                  <Ionicons name="close-outline" size={hp(3)} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: hp(1.5),
                  color: "#4B5563",
                  lineHeight: hp(2.2),
                  marginBottom: hp(1.5),
                }}
              >
                A diagnostic report containing app version, device model, and system error trace will be emailed to our developer team.
              </Text>

              {/* What went wrong comment input */}
              <Text
                style={{
                  fontSize: hp(1.6),
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: hp(0.8),
                }}
              >
                What were you doing when this happened? (Optional)
              </Text>
              <TextInput
                value={userComment}
                onChangeText={setUserComment}
                placeholder="e.g. Trying to view package details or place an order..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  padding: wp(3.5),
                  fontSize: hp(1.6),
                  color: "#1F2937",
                  minHeight: hp(10),
                  textAlignVertical: "top",
                  marginBottom: hp(2),
                }}
              />

              {initialError ? (
                <View
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderLeftWidth: 3,
                    borderLeftColor: "#EF4444",
                    padding: wp(3),
                    borderRadius: 6,
                    marginBottom: hp(2),
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(1.3),
                      fontWeight: "bold",
                      color: "#991B1B",
                      marginBottom: 2,
                    }}
                  >
                    Detected Error:
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: hp(1.3),
                      color: "#B91C1C",
                      fontFamily: Platform.OS === "android" ? "monospace" : "Courier",
                    }}
                  >
                    {initialError}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: wp(3), marginTop: hp(1) }}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    paddingVertical: hp(1.7),
                    borderRadius: 12,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(1.7),
                      color: "#4B5563",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={loading}
                  style={{
                    flex: 1.5,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#E53935", "#6C3CD1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: hp(1.7),
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={hp(2)} color="#FFFFFF" />
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: hp(1.7),
                            fontWeight: "bold",
                          }}
                        >
                          Send Report
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CrashReportModal;
