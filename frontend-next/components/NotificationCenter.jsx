"use client";
import { useState, useEffect } from 'react';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Notification reminders are handled client-side via CalendarView's useReminders hook.
    // No server polling needed in this RL environment.
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (notifications.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-[100] w-96 max-h-[80vh] overflow-y-auto scrollbar-thin">
      <div className="bg-white rounded-lg shadow-2xl border border-google-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-google-gray-200">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-google-blue-600">notifications</span>
            <h3 className="text-sm font-medium text-google-gray-700">
              Event Reminders ({notifications.length})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={dismissAll}
              className="text-xs text-google-blue-600 hover:underline px-2 py-1"
            >
              Clear all
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="btn-icon w-8 h-8"
            >
              <span className="material-icons-outlined text-google-gray-600 text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-google-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 hover:bg-google-gray-50 transition-colors"
            >
              <div className="flex gap-3">
                <div
                  className="w-1 h-full rounded-full flex-shrink-0"
                  style={{ backgroundColor: notification.calendarColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-google-gray-700 line-clamp-2">
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-google-gray-500 hover:text-google-gray-700 flex-shrink-0"
                    >
                      <span className="material-icons-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="text-xs text-google-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">schedule</span>
                      <span>
                        {formatDate(notification.startTime)} at {formatTime(notification.startTime)}
                      </span>
                    </div>

                    {notification.location && (
                      <div className="flex items-center gap-1">
                        <span className="material-icons-outlined text-xs">location_on</span>
                        <span className="truncate">{notification.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">alarm</span>
                      <span>{notification.minutesBefore} minutes before</span>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: notification.calendarColor }}
                      />
                      <span className="text-xs text-google-gray-500">
                        {notification.calendarName}
                      </span>
                    </div>
                  </div>

                  {notification.description && (
                    <p className="text-xs text-google-gray-600 mt-2 line-clamp-2">
                      {notification.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
