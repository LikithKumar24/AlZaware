import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  _id: string;
  user_email: string;
  message: string;
  type: string;
  status: 'unread' | 'read';
  timestamp: string;
}

interface NotificationsProps {
  maxDisplay?: number;
  showMarkAllRead?: boolean;
}

export default function Notifications({ maxDisplay = 3, showMarkAllRead = true }: NotificationsProps) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://127.0.0.1:8000/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const fetchedNotifications = response.data;
      const previousUnreadCount = notifications.filter(n => n.status === 'unread').length;
      const newUnreadCount = fetchedNotifications.filter((n: Notification) => n.status === 'unread').length;
      
      setNotifications(fetchedNotifications);
      
      // Show toast for new notifications
      if (newUnreadCount > previousUnreadCount && previousUnreadCount >= 0) {
        setToastMessage(`You have ${newUnreadCount} new notification${newUnreadCount > 1 ? 's' : ''} from your doctor!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
      
      console.log('[Notifications] Fetched', fetchedNotifications.length, 'notifications');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('[Notifications] Authentication failed - token may be invalid or expired');
        setNotifications([]);
      } else {
        console.error('[Notifications] Failed to fetch notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await axios.patch(
        'http://127.0.0.1:8000/notifications/mark-read',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      
      setToastMessage('All notifications marked as read');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      console.log('[Notifications] Marked all as read');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('[Notifications] Authentication failed - cannot mark as read');
        setToastMessage('Session expired. Please login again.');
      } else {
        console.error('[Notifications] Failed to mark as read:', error);
        setToastMessage('Failed to mark notifications as read');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  const displayNotifications = notifications.slice(0, maxDisplay);
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  if (loading) {
    return (
      <section className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Notifications</h4>
        <p className="text-xs text-gray-400">Loading...</p>
      </section>
    );
  }

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <section className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-700" />
            <h4 className="text-sm font-semibold text-gray-700">Notifications</h4>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {showMarkAllRead && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 px-2 hover:bg-blue-50"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 p-3 bg-gray-50 rounded-md text-center">
            No notifications yet
          </p>
        ) : (
          <div className="space-y-2">
            {displayNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`text-xs p-3 rounded-md border transition-all duration-200 ${
                  notification.status === 'unread'
                    ? 'bg-blue-50 text-blue-900 border-blue-200 font-medium shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {notification.status === 'unread' && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full mt-1 flex-shrink-0 animate-pulse" />
                  )}
                  <div className="flex-1">
                    <p className="leading-relaxed">{notification.message}</p>
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > maxDisplay && (
              <p className="text-xs text-gray-500 text-center pt-2 font-medium">
                +{notifications.length - maxDisplay} more notification{notifications.length - maxDisplay > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
