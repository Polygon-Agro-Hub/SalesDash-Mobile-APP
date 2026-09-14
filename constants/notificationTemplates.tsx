import React from "react";
import { Text, TextStyle } from "react-native";

export const NOTIFICATION_TITLES = {
  ORDER_PLACED: "New Order Placed",
  ORDER_PROCESSING: "Order is Processing",
  ORDER_OUT_FOR_DELIVERY: "Order is Out for Delivery",
  ORDER_DELIVERED: "Order Delivered",
  PAYMENT_REMINDER: "Payment Reminder !!!",
  ORDER_CONFIRMED: "Order Confirmed",
  ORDER_CANCELLED: "Order Cancelled",
  CUSTOMER_REMINDER: "Customer Reminder",
  DELIVERY_ASSIGNED: "Delivery Assigned",
  STOCK_UPDATE: "Stock & Price Update",
} as const;

/**
 * Returns true ONLY if the notification requires an Action Required badge.
 */
export const isActionRequiredNotification = (title?: string): boolean => {
  if (!title) return false;
  const normalized = title.trim().toLowerCase();
  return (
    normalized.includes("payment reminder") ||
    normalized.includes("review") ||
    normalized.includes("urgent") ||
    normalized.includes("action required")
  );
};

export interface NotificationTemplateParams {
  invoiceNo?: string;
  orderId?: string | number;
  date?: string;
  amount?: string | number;
  customerName?: string;
  reason?: string;
  deadline?: string;
}

export const NOTIFICATION_TEMPLATES: Record<
  string,
  (params: NotificationTemplateParams) => string
> = {
  [NOTIFICATION_TITLES.ORDER_PLACED]: (p) =>
    `New order #${p.invoiceNo || p.orderId || "[Order No.]"} has been placed for customer ${p.customerName || "Customer"}.`,

  [NOTIFICATION_TITLES.ORDER_PROCESSING]: (p) =>
    `Order #${p.invoiceNo || p.orderId || "[Invoice No.]"} is now being processed for delivery.`,

  [NOTIFICATION_TITLES.ORDER_OUT_FOR_DELIVERY]: (p) =>
    `Order #${p.invoiceNo || p.orderId || "[Invoice No.]"} is now out for delivery.`,

  [NOTIFICATION_TITLES.ORDER_DELIVERED]: (p) =>
    `Order #${p.invoiceNo || p.orderId || "[Invoice No.]"} has been successfully delivered.`,

  [NOTIFICATION_TITLES.PAYMENT_REMINDER]: (p) =>
    `Payment reminder for order #${p.invoiceNo || p.orderId || "[Invoice No.]"} – Rs. ${p.amount || "0.00"}.`,

  [NOTIFICATION_TITLES.ORDER_CANCELLED]: (p) =>
    p.reason
      ? `Order #${p.invoiceNo || p.orderId || "[Invoice No.]"} has been cancelled. Reason: "${p.reason}"`
      : `Order #${p.invoiceNo || p.orderId || "[Invoice No.]"} has been cancelled.`,
};

/**
 * Parses message text to highlight invoice/order numbers (e.g. `#[Invoice No]`, `#[2609030012]`, `#2609030012`) in bold.
 */
export const renderBoldInvoiceMessage = (
  message: string,
  baseStyle?: TextStyle,
  boldStyle?: TextStyle
): React.ReactNode => {
  if (!message) return null;

  const regex = /(#\[?[A-Za-z0-9_\-\.\s]+\]?)/g;
  const parts = message.split(regex);

  return parts.map((part, index) => {
    const isInvoiceToken = regex.test(part);
    regex.lastIndex = 0; // reset regex test

    if (isInvoiceToken) {
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            { fontWeight: "700", color: "#111827" },
            boldStyle,
          ]}
        >
          {part}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
};
