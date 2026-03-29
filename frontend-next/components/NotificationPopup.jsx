"use client";
import { useState, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

function NotificationPopup({ onClose }) {
  const { events, fetchMyInvitations, invitations, updateRsvp } =
    useCalendarStore();
  const [activeTab, setActiveTab] = useState("reminders");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (fetchMyInvitations) fetchMyInvitations();
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const reminders = await response.json();
      const formatted = reminders.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        location: r.location,
        startTime: new Date(r.start_time),
        calendarName: r.calendar_name,
        calendarColor: r.calendar_color || "#1a73e8",
        minutesBefore: r.minutes_before,
      }));
      setNotifications(formatted);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  };

  const formatDateTime = (date) =>
    date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const handleRsvp = async (eventId, status) => {
    try {
      await updateRsvp(eventId, status);
      if (fetchMyInvitations) await fetchMyInvitations();
    } catch (e) {
      console.error("RSVP failed:", e);
    }
  };

  const dismissNotification = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div
      className="absolute top-16 right-6 w-96 max-h-[80vh] overflow-y-auto
                 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl
                 border border-gray-200 dark:border-gray-700 z-[200]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
        <h3 className="font-medium text-gray-800 dark:text-gray-100">
          Notifications
        </h3>
        <button
          onClick={onClose}
          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1"
        >
          <span className="material-icons-outlined text-gray-600 dark:text-gray-300 text-lg">
            close
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1
            ${
              activeTab === "reminders"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-300"
            }`}
          onClick={() => setActiveTab("reminders")}
        >
          <span className="material-icons-outlined text-sm">notifications</span>
          Reminders
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1
            ${
              activeTab === "invitations"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-300"
            }`}
          onClick={() => setActiveTab("invitations")}
        >
          <span className="material-icons-outlined text-sm">mail</span>
          Invitations
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 overflow-y-auto max-h-[65vh] scrollbar-thin">
        {activeTab === "reminders" &&
          (notifications.length ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100
                           dark:hover:bg-gray-700 transition flex gap-3 relative"
              >
                <div
                  className="w-1 rounded-full mt-1"
                  style={{ backgroundColor: n.calendarColor }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                      {n.title}
                    </h4>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <span className="material-icons-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDateTime(n.startTime)}
                  </div>
                  {n.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="material-icons-outlined text-xs">
                        place
                      </span>
                      {n.location}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Reminder: {n.minutesBefore} minutes before
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              <span className="material-icons-outlined text-4xl mb-1 opacity-60">
                notifications_off
              </span>
              <p>No reminders</p>
            </div>
          ))}

        {activeTab === "invitations" &&
          (invitations && invitations.length ? (
            invitations.map((inv) => (
              <div
                key={inv.event_id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100
                           dark:hover:bg-gray-700 transition"
              >
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                  {inv.event_title}
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatDateTime(new Date(inv.event_start))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Organizer: {inv.organizer_name || inv.organizer_email}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleRsvp(inv.event_id, "accepted")}
                    className="flex-1 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleRsvp(inv.event_id, "maybe")}
                    className="flex-1 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium"
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRsvp(inv.event_id, "declined")}
                    className="flex-1 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-medium"
                  >
                    No
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              <span className="material-icons-outlined text-4xl mb-1 opacity-60">
                mail_outline
              </span>
              <p>No invitations</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default NotificationPopup;
