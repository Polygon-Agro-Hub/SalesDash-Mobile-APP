import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";

export interface ServerNotificationItem {
  id: number;
  orderId?: number;
  processOrderId?: number;
  invNo?: string;
  invoiceNo?: string;
  title: string;
  message: string;
  isRead?: number | boolean;
  createdAt?: string;
  date?: string;
  amount?: string | number;
  unreadCount?: number;
  [key: string]: any;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: ServerNotificationItem[];
    unreadCount: number;
  };
}

class NotificationService {
  private async getAuthHeaders() {
    const rawToken = await AsyncStorage.getItem("authToken");
    const token = rawToken ? rawToken.replace(/^["']|["']$/g, "").trim() : "";
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async getNotifications() {
    const headers = await this.getAuthHeaders();
    const response = await axios.get<NotificationResponse>(
      `${environment.API_BASE_URL}api/notifications`,
      { headers }
    );
    return response.data;
  }

  async markAsReadByOrderId(orderId: number | string) {
    const headers = await this.getAuthHeaders();
    const response = await axios.patch(
      `${environment.API_BASE_URL}api/notifications/mark-read/${orderId}`,
      {},
      { headers }
    );
    return response.data;
  }

  async deleteByOrderId(orderId: number | string) {
    const headers = await this.getAuthHeaders();
    const response = await axios.delete(
      `${environment.API_BASE_URL}api/notifications/delete/${orderId}`,
      { headers }
    );
    return response.data;
  }
}

export default new NotificationService();
