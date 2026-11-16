import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
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
  isWholesale?: boolean;
}

// ─── SAFE DATE PARSING & TIMEZONE LOGIC ──────────────────────────────────────────
/**
 * Safely parses any date string (YYYY/MM/DD, YYYY-MM-DD, ISO, etc.) or Date object
 * into a local midnight Date (00:00:00). Avoids UTC midnight interpretation and
 * works reliably across Hermes/JSC without timezone shifting.
 */
export const parseLocalDate = (dateInput?: string | Date | null): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    const d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const str = String(dateInput).trim();
  if (!str) return null;

  // Extract date part before any 'T' or space
  const datePart = str.split(/[T\s]/)[0];
  const parts = datePart.split(/[\/-]/).map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
    let year = parts[0];
    let month = parts[1];
    let day = parts[2];
    // In case format is DD/MM/YYYY or DD-MM-YYYY
    if (year <= 31 && day > 1000) {
      const temp = year;
      year = day;
      day = temp;
    }
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    const d = new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
};

/**
 * Determines current time and cutoff in Asia/Colombo (UTC+5:30)
 */
export const getColomboNow = (): { now: Date; hours: number; isAfterCutoff: boolean } => {
  const now = new Date();
  try {
    const colomboString = now.toLocaleString("en-US", { timeZone: "Asia/Colombo" });
    const colomboDate = new Date(colomboString);
    if (!isNaN(colomboDate.getTime())) {
      const hours = colomboDate.getHours();
      return { now, hours, isAfterCutoff: hours >= 18 };
    }
  } catch (e) {
    // Fallback if device doesn't support timeZone
  }
  const hours = now.getHours();
  return { now, hours, isAfterCutoff: hours >= 18 };
};

// ─── WEB VALIDATION LOGIC REPLICATED ──────────────────────────────────────────
export const getMinDeliveryDate = (isWholesale?: boolean, referenceDate?: Date): Date => {
  const { now, isAfterCutoff } = getColomboNow();
  const base = referenceDate || now;
  const extraDays = isWholesale
    ? (isAfterCutoff ? 3 : 2)
    : (isAfterCutoff ? 4 : 3);

  const minDate = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + extraDays
  );
  minDate.setHours(0, 0, 0, 0);
  return minDate;
};

export const validateDeliveryDate = (
  dateStr?: string | null,
  isWholesale?: boolean
): { isValid: boolean; error: string } => {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: "Delivery date is required." };
  }

  const selected = parseLocalDate(dateStr);
  if (!selected) {
    return { isValid: false, error: "Invalid delivery date format." };
  }

  const minDate = getMinDeliveryDate(isWholesale);
  const { isAfterCutoff } = getColomboNow();

  if (selected < minDate) {
    if (isWholesale) {
      return {
        isValid: false,
        error: isAfterCutoff
          ? "Please select a date at least 3 days from today after 6:00 PM cutoff."
          : "Please select a date at least 2 days from today.",
      };
    }
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
  isWholesale = false,
}) => {
  // Freshly evaluated minDate to prevent stale dates if modal stays open past cutoff or midnight
  const [currentMinDate, setCurrentMinDate] = useState<Date>(() =>
    customMinDate
      ? parseLocalDate(customMinDate) || getMinDeliveryDate(isWholesale)
      : getMinDeliveryDate(isWholesale)
  );

  const maxDate = useMemo(() => {
    if (customMaxDate) {
      const parsed = parseLocalDate(customMaxDate);
      if (parsed) {
        parsed.setHours(23, 59, 59, 999);
        return parsed;
      }
    }
    const max = new Date();
    max.setDate(max.getDate() + 60); // 60 days in advance
    max.setHours(23, 59, 59, 999);
    return max;
  }, [customMaxDate]);

  // Safe initial state: parse date with local time, guaranteed null on invalid input
  const initialSelected = useMemo(
    () => parseLocalDate(selectedDate),
    [selectedDate]
  );
  const initialDate = initialSelected || currentMinDate;

  const [currentYear, setCurrentYear] = useState<number>(() =>
    initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(() =>
    initialDate.getMonth()
  );
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    () => initialSelected
  );

  // Sync state whenever modal opens or selectedDate changes
  useEffect(() => {
    if (visible) {
      const freshMin = customMinDate
        ? parseLocalDate(customMinDate) || getMinDeliveryDate(isWholesale)
        : getMinDeliveryDate(isWholesale);
      setCurrentMinDate(freshMin);

      const parsed = parseLocalDate(selectedDate);
      if (parsed) {
        setInternalSelectedDate(parsed);
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
      } else {
        // Reset state so previous unconfirmed selection is not retained
        setInternalSelectedDate(null);
        setCurrentYear(freshMin.getFullYear());
        setCurrentMonth(freshMin.getMonth());
      }
    }
  }, [visible, selectedDate, customMinDate, isWholesale]);

  // Robust month navigation comparison using (year * 12 + month)
  const canGoPrev = useMemo(() => {
    const currentMonthVal = currentYear * 12 + currentMonth;
    const minMonthVal =
      currentMinDate.getFullYear() * 12 + currentMinDate.getMonth();
    return currentMonthVal > minMonthVal;
  }, [currentYear, currentMonth, currentMinDate]);

  const canGoNext = useMemo(() => {
    const currentMonthVal = currentYear * 12 + currentMonth;
    const maxMonthVal = maxDate.getFullYear() * 12 + maxDate.getMonth();
    return currentMonthVal < maxMonthVal;
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

    const { now } = getColomboNow();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);

      const isDisabled = date < currentMinDate || date > maxDate;
      const isSelected =
        internalSelectedDate !== null &&
        !isNaN(internalSelectedDate.getTime()) &&
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

    // Pad the END of the grid so the array length is always a multiple of 7
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
  }, [currentYear, currentMonth, currentMinDate, maxDate, internalSelectedDate]);

  const handleDayPress = (dayItem: { date: Date; isDisabled: boolean }) => {
    if (dayItem.isDisabled) return;
    setInternalSelectedDate(dayItem.date);
  };

  const handleConfirm = () => {
    if (!internalSelectedDate || isNaN(internalSelectedDate.getTime())) return;
    const yyyy = internalSelectedDate.getFullYear();
    const mm = String(internalSelectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(internalSelectedDate.getDate()).padStart(2, "0");
    const formatted = `${yyyy}/${mm}/${dd}`;
    onSelectDate(formatted);
    onClose();
  };

  // Split calendar days into explicit 7-day rows (weeks) to guarantee exactly 7 columns
  const calendarWeeks = useMemo(() => {
    const weeks: (typeof calendarDays)[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  const isConfirmValid =
    !!internalSelectedDate && !isNaN(internalSelectedDate.getTime());

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
              {isWholesale
                ? "Wholesale orders require at least 2 days preparation (3 days after 6:00 PM cutoff)."
                : "Orders require at least 3 days preparation (4 days after 6:00 PM cutoff)."}
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
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <View
                key={d}
                style={{
                  flex: 1,
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

          {/* Calendar Grid (Strict 7 columns per row) */}
          <View style={{ paddingHorizontal: 4 }}>
            {calendarWeeks.map((week, weekIndex) => (
              <View
                key={`week-${weekIndex}`}
                style={{
                  flexDirection: "row",
                  marginVertical: 2,
                }}
              >
                {week.map((item, dayIndex) => {
                  if (!item.isCurrentMonth) {
                    return (
                      <View
                        key={`blank-${weekIndex}-${dayIndex}`}
                        style={{
                          flex: 1,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    );
                  }

                  return (
                    <View
                      key={`day-col-${item.day}`}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={item.isDisabled ? 1 : 0.7}
                        disabled={item.isDisabled}
                        onPress={() => handleDayPress(item)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
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
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Confirm Date Button */}
          <TouchableOpacity
            activeOpacity={isConfirmValid ? 0.85 : 1}
            disabled={!isConfirmValid}
            onPress={handleConfirm}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: isConfirmValid ? "#000000" : "#9CA3AF",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isConfirmValid ? 0.15 : 0,
              shadowRadius: 4,
              elevation: isConfirmValid ? 3 : 0,
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
