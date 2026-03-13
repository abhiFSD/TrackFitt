import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { type Notification as AppNotification, WebSocketMessage } from '../interfaces';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { parseUTCDate } from '../utils/dateUtils';

// Base API URL
const API_URL = 'http://localhost:8000/api';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const websocketRef = useRef<WebSocket | null>(null);
  
  // Get token from localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('token');
  };

  // Function to fetch notifications from the API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(response.data);
      
      // Get unread count
      const unreadResponse = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isAuthenticated]);
  
  // Function to mark a notification as read
  const markAsRead = useCallback(async (id: number) => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [isAuthenticated]);
  
  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [isAuthenticated]);
  
  // Function to delete a notification
  const deleteNotification = useCallback(async (id: number) => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update state
      const notificationToDelete = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [isAuthenticated, notifications]);
  
  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;
    
    // Close existing connection if any
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    // Create a new WebSocket connection
    const wsUrl = `ws://localhost:8000/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle connection confirmation
        if (message.type === 'connection_established') {
          console.log('WebSocket connection confirmed:', message.message);
          return;
        }
        
        // Handle notifications
        if (message.type === 'notification' && message.notification_id) {
          // Get the timestamp from the message or use current time as fallback
          let timestamp = message.timestamp || new Date().toISOString();
          
          // Direct fix for the 2025 bug
          if (timestamp.includes('2025-')) {
            console.warn('Received notification with year 2025 date, using current time instead');
            timestamp = new Date().toISOString();
          }
          
          // Use our improved date parsing - this handles future dates automatically
          const validDate = parseUTCDate(timestamp);
          
          // Create a new notification object
          const newNotification: AppNotification = {
            id: message.notification_id,
            user_id: 0, // Will be set by the server
            type: message.notification_type as any,
            title: message.title || 'New Notification',
            message: message.message || '',
            data: message.data ? JSON.stringify(message.data) : undefined,
            is_read: false,
            created_at: validDate.toISOString() // Use the validated timestamp
          };
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
    };
    
    websocketRef.current = ws;
    
    // Fetch initial notifications
    fetchNotifications();
    
    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [isAuthenticated, fetchNotifications]);

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 