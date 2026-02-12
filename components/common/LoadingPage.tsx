import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  StatusBar,
} from "react-native";

interface LoadingPageProps {
  message?: string;
  containerStyle?: StyleProp<ViewStyle>;
  size?: "small" | "large" | number;
  color?: string;
  fullScreen?: boolean;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message,
  containerStyle,
  size = "large",
  color = "#6839CF",
  fullScreen = false,
}) => {
  return (
    <View
      className={`${fullScreen ? "flex-1" : ""} justify-center items-center bg-white`}
      style={[
        fullScreen ? { minHeight: 300 } : { paddingVertical: 40 },
        containerStyle,
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ActivityIndicator size={size} color={color} />
      <Text className="mt-4 text-[#6839CF] text-center">
        {message || "Loading..."}
      </Text>
    </View>
  );
};

export default LoadingPage;
