import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

// ─── WEB VALIDATION LOGIC REPLICATED ──────────────────────────────────────────
export const getMinDeliveryDate = (): Date => {
  const now = new Date();
  const isAfterCutoff = now.getHours() >= 18; // 6:00 PM cutoff
  const extraDays = isAfterCutoff ? 4 : 3;

  const minDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + extraDays
  );
  minDate.setHours(0, 0, 0, 0);
  return minDate;
};

export const validateDeliveryDate = (dateStr?: string | null): { isValid: boolean; error: string } => {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: "Delivery date is required." };
  }

  const normalized = dateStr.replace(/\//g, "-");
  const selected = new Date(normalized);
  selected.setHours(0, 0, 0, 0);

  const minDate = getMinDeliveryDate();
  const now = new Date();
  const isAfterCutoff = now.getHours() >= 18;

  if (selected < minDate) {
    return {
      isValid: false,
      error: isAfterCutoff
        ? "Please select a date at least 4 days from today after 6:00 PM cutoff."
        : "Please select a date at least 3 days from today.",
    };
  }

  return { isValid: true, error: "" };
};

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  minDate: customMinDate,
  maxDate: customMaxDate,
}) => {
  const minDate = useMemo(() => customMinDate || getMinDeliveryDate(), [customMinDate]);
  const maxDate = useMemo(() => {
    if (customMaxDate) return customMaxDate;
    const max = new Date();
    max.setDate(max.getDate() + 60); // 60 days in advance
    max.setHours(23, 59, 59, 999);
    return max;
  }, [customMaxDate]);

  // Parse initially selected date or fallback to minDate
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const parsed = new Date(selectedDate.replace(/\//g, "-"));
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return minDate;
  }, [selectedDate, minDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    selectedDate ? new Date(selectedDate.replace(/\//g, "-")) : null
  );

  useEffect(() => {
    if (visible) {
      if (selectedDate) {
        const d = new Date(selectedDate.replace(/\//g, "-"));
        if (!isNaN(d.getTime())) {
          setInternalSelectedDate(d);
          setCurrentYear(d.getFullYear());
          setCurrentMonth(d.getMonth());
          return;
        }
      }
      setCurrentYear(minDate.getFullYear());
      setCurrentMonth(minDate.getMonth());
    }
  }, [visible, selectedDate, minDate]);

  const canGoPrev = useMemo(() => {
    const prevMonthDate = new Date(currentYear, currentMonth, 0);
    return prevMonthDate >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }, [currentYear, currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    return nextMonthDate <= maxDate;
  }, [currentYear, currentMonth, maxDate]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar grid calculations
 const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const days: Array<{
      day: number;
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: 0,
        date: new Date(0),
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);

      const isDisabled = date < minDate || date > maxDate;
      const isSelected =
        internalSelectedDate !== null &&
        internalSelectedDate.getFullYear() === date.getFullYear() &&
        internalSelectedDate.getMonth() === date.getMonth() &&
        internalSelectedDate.getDate() === date.getDate();

      const isToday =
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate();

      days.push({
        day,
        date,
        isCurrentMonth: true,
        isDisabled,
        isSelected,
        isToday,
      });
    }

    // ✅ Pad the END of the grid too, so the last row always has 7 slots.
    // Without this, `space-between` stretches a short final row (e.g. 4 items)
    // across the full width instead of aligning it under the real weekday columns.
    const trailingBlanks = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < trailingBlanks; i++) {
      days.push({
        day: 0,
        date: new Date(0),
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, minDate, maxDate, internalSelectedDate]);

  const handleDayPress = (dayItem: { date: Date; isDisabled: boolean }) => {
    if (dayItem.isDisabled) return;
    setInternalSelectedDate(dayItem.date);
  };

  const handleConfirm = () => {
    if (!internalSelectedDate) return;
    const yyyy = internalSelectedDate.getFullYear();
    const mm = String(internalSelectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(internalSelectedDate.getDate()).padStart(2, "0");
    const formatted = `${yyyy}/${mm}/${dd}`;
    onSelectDate(formatted);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            width: "100%",
            maxWidth: 380,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#111827",
              }}
            >
              Select Schedule Date
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Web Validation Info Badge */}
          <View
            style={{
              backgroundColor: "#FFF7ED",
              borderColor: "#FFEDD5",
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 7,
              paddingHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons
              name="information-circle"
              size={17}
              color="#EA580C"
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontSize: 11,
                color: "#C2410C",
                flex: 1,
                lineHeight: 15,
                fontWeight: "500",
              }}
            >
              Orders require 3 days preparation (4 days after 6:00 PM cutoff).
            </Text>
          </View>

          {/* Month & Year Navigator */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              paddingHorizontal: 4,
            }}
          >
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={!canGoPrev}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: canGoPrev ? "#F3F4F6" : "#FAFAFA",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={canGoPrev ? "#111827" : "#D1D5DB"}
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {`${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={!canGoNext}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: canGoNext ? "#F3F4F6" : "#FAFAFA",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={canGoNext ? "#111827" : "#D1D5DB"}
              />
            </TouchableOpacity>
          </View>

          {/* Days of Week Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <View
                key={d}
                style={{
                  width: 40,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#9CA3AF",
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            {calendarDays.map((item, index) => {
              if (!item.isCurrentMonth) {
                return (
                  <View
                    key={`blank-${index}`}
                    style={{
                      width: 40,
                      height: 40,
                      marginVertical: 2,
                    }}
                  />
                );
              }

              return (
                <TouchableOpacity
                  key={`day-${item.day}`}
                  activeOpacity={item.isDisabled ? 1 : 0.7}
                  disabled={item.isDisabled}
                  onPress={() => handleDayPress(item)}
                  style={{
                    width: 40,
                    height: 40,
                    marginVertical: 2,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.isSelected
                      ? "#000000"
                      : "transparent",
                    borderWidth: item.isToday && !item.isSelected ? 1 : 0,
                    borderColor: "#111827",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: item.isSelected ? "700" : "500",
                      color: item.isDisabled
                        ? "#D1D5DB"
                        : item.isSelected
                        ? "#FFFFFF"
                        : "#111827",
                    }}
                  >
                    {String(item.day)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Date Button */}
          <TouchableOpacity
            activeOpacity={internalSelectedDate ? 0.85 : 1}
            disabled={!internalSelectedDate}
            onPress={handleConfirm}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: internalSelectedDate ? "#000000" : "#9CA3AF",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: internalSelectedDate ? 0.15 : 0,
              shadowRadius: 4,
              elevation: internalSelectedDate ? 3 : 0,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Confirm Date
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomCalendarModal;
