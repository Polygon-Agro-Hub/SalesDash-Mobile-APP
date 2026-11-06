import React from "react";
import { View } from "react-native";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

/* Same sizing as DashboardScreen so the skeleton lines up exactly */
const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (wp("100%") - SCREEN_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = 157;
const CONTENT_WIDTH = wp("100%") - SCREEN_PADDING * 2;

const BASE = "#E5E7EB";
const HIGHLIGHT = "#F5F5F5";

/* Skeleton for one dashboard card */
const CardSkeleton: React.FC = () => (
  <View
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      marginBottom: CARD_GAP,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#F1F5F9",
      overflow: "hidden",
    }}
  >
    <ContentLoader
      speed={1.5}
      width={CARD_WIDTH - 2}
      height={CARD_HEIGHT - 2}
      viewBox={`0 0 ${CARD_WIDTH - 2} ${CARD_HEIGHT - 2}`}
      backgroundColor={BASE}
      foregroundColor={HIGHLIGHT}
    >
      {/* Icon box */}
      <Rect x="16" y="16" rx="12" ry="12" width="38" height="38" />
      {/* Title (2 lines) */}
      <Rect x="16" y="66" rx="4" ry="4" width={CARD_WIDTH * 0.7} height="14" />
      <Rect x="16" y="86" rx="4" ry="4" width={CARD_WIDTH * 0.45} height="14" />
      {/* Subtitle */}
      <Rect x="16" y="108" rx="3" ry="3" width={CARD_WIDTH * 0.6} height="8" />
      {/* Badge pill */}
      <Rect x="16" y="124" rx="9" ry="9" width="84" height="20" />
      {/* Chevron */}
      <Circle cx={CARD_WIDTH - 28} cy="134" r="7" />
    </ContentLoader>
  </View>
);

const DashboardSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="px-4" style={{ paddingTop: 8 }}>
        {/* Header: avatar + name + star pill */}
        <ContentLoader
          speed={1.5}
          width={CONTENT_WIDTH}
          height={60}
          viewBox={`0 0 ${CONTENT_WIDTH} 60`}
          backgroundColor={BASE}
          foregroundColor={HIGHLIGHT}
        >
          <Circle cx="28" cy="30" r="28" />
          <Rect x="68" y="12" rx="4" ry="4" width="140" height="18" />
          <Rect x="68" y="38" rx="3" ry="3" width="110" height="10" />
          <Rect
            x={CONTENT_WIDTH - 86}
            y="8"
            rx="22"
            ry="22"
            width="86"
            height="44"
          />
        </ContentLoader>

        {/* Daily target title row */}
        <View style={{ marginTop: 24 }}>
          <ContentLoader
            speed={1.5}
            width={CONTENT_WIDTH}
            height={20}
            viewBox={`0 0 ${CONTENT_WIDTH} 20`}
            backgroundColor={BASE}
            foregroundColor={HIGHLIGHT}
          >
            <Rect x="0" y="2" rx="4" ry="4" width="130" height="16" />
            <Rect
              x={CONTENT_WIDTH - 90}
              y="4"
              rx="4"
              ry="4"
              width="90"
              height="12"
            />
          </ContentLoader>
        </View>

        {/* Daily target card */}
        <View
          style={{
            marginTop: 10,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#F1F5F9",
            backgroundColor: "ffffff",
            padding: 20,
          }}
        >
          <ContentLoader
            speed={1.5}
            width={CONTENT_WIDTH - 42}
            height={56}
            viewBox={`0 0 ${CONTENT_WIDTH - 42} 56`}
            backgroundColor="#F5F5F5"
            foregroundColor="#F3EEFD"
          >
            {/* PROGRESS pill */}
            <Rect x="0" y="0" rx="12" ry="12" width="92" height="24" />
            {/* completed text */}
            <Rect
              x={CONTENT_WIDTH - 42 - 110}
              y="5"
              rx="4"
              ry="4"
              width="110"
              height="14"
            />
            {/* progress bar */}
            <Rect
              x="0"
              y="38"
              rx="6"
              ry="6"
              width={CONTENT_WIDTH - 42 - 40}
              height="10"
            />
            {/* star */}
            <Circle cx={CONTENT_WIDTH - 42 - 14} cy="43" r="14" />
          </ContentLoader>
        </View>
      </View>

      {/* Cards grid: 5 cards, 2 columns */}
      <View
        className="flex-row flex-wrap justify-between"
        style={{ paddingHorizontal: SCREEN_PADDING, marginTop: 24 }}
      >
        {[...Array(5)].map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

export default DashboardSkeleton;