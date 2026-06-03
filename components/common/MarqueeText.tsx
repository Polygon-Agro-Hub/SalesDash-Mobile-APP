import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Easing,
  TextStyle,
} from "react-native";

interface FixedMarqueeTextProps {
  text: string;
  style?: TextStyle;
  speed?: number;
}

const FixedMarqueeText: React.FC<FixedMarqueeTextProps> = ({
  text,
  style,
  speed = 40,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [measurementWidth, setMeasurementWidth] = useState<number>(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const cleanText = text?.trim() || "";

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    setMeasurementWidth(9999);
    setTextWidth(0);

    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    scrollX.setValue(0);
  }, [cleanText]);

  useEffect(() => {
    if (textWidth === 0 || containerWidth === 0) return;

    const shouldScroll = textWidth > containerWidth - 5;

    if (shouldScroll) {
      startScrolling();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      scrollX.setValue(0);
    }
  }, [textWidth, containerWidth]);

  const startScrolling = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    const startPosition = 0;
    const endPosition = -textWidth;
    const duration = (textWidth / speed) * 1000;

    scrollX.setValue(startPosition);

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(scrollX, {
          toValue: endPosition,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: startPosition,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animationRef.current.start();
  };

  const shouldScroll =
    textWidth > containerWidth - 5 && textWidth > 0 && containerWidth > 0;

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
          setContainerWidth(width);
        }
      }}
    >
      {/* Measurement text — key={cleanText} forces remount on text change,
          guaranteeing onLayout fires fresh every time */}
      <View style={[styles.measurementWrapper, { width: measurementWidth }]}>
        <Text
          key={cleanText}
          style={[styles.measurementText, style]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              setTextWidth(width);
            }
          }}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {cleanText}
        </Text>
      </View>

      {/* Display area */}
      <View style={styles.displayContainer}>
        {shouldScroll ? (
          <View style={styles.scrollView}>
            <Animated.View
              style={[
                styles.scrollingText,
                {
                  transform: [{ translateX: scrollX }],
                  left: 0,
                  width: textWidth,
                },
              ]}
            >
              <Text
                style={[styles.displayText, style]}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {cleanText}
              </Text>
            </Animated.View>
          </View>
        ) : (
          <Text
            style={[styles.displayText, style]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cleanText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 24,
    overflow: "hidden",
  },
  measurementWrapper: {
    position: "absolute",
    left: -10000,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  measurementText: {
    includeFontPadding: false,
    flexShrink: 0,
    flexWrap: "nowrap",
    alignSelf: "flex-start",
  },
  displayContainer: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    overflow: "hidden",
  },
  scrollingText: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  displayText: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default FixedMarqueeText;