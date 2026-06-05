import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onClose,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 30,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 24,
            width: "100%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#1a1a1a",
              marginBottom: 10,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#444",
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ alignSelf: "flex-end", marginTop: 20 }}
          >
            <Text
              style={{
                color: "#6C3CD1",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;