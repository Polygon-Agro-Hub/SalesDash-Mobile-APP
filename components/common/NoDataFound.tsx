import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import LottieView from "lottie-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NoDataFoundProps {
  message?: string;
  lottieSize?: { width: number; height: number };
  containerStyle?: object;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({
  message = "No Data Found",
  lottieSize,
  containerStyle,
}) => {


  return (
    <View style={[styles.container, containerStyle]}>
      <LottieView
        source={require("@/assets/json/no-data.json")}
        style={{ width: 150, height: 150 }}
        autoPlay
        loop
      />
      {/* Isolated View breaks NativeWind inheritance */}
      <View style={styles.textWrapper}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    marginTop: -15,        
    backgroundColor: "transparent",
  },
  messageText: {
    color: "#000000",     
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});

export default NoDataFound;