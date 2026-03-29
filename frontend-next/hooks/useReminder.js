// src/hooks/useReminders.js
import { useEffect } from "react";

export default function useReminders(events, showToast) {
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      events.forEach((event) => {
        if (!event.reminders || event.reminders.length === 0) return;

        event.reminders.forEach((rem) => {
          const eventTime = new Date(event.startTime);
          const reminderTime = new Date(
            eventTime.getTime() - rem.minutes_before * 60000
          );

          // Trigger only once within a 30s window
          if (Math.abs(reminderTime - now) < 30000) {
            const msg = `“${event.title}” starts in ${
              rem.minutes_before
            } minute${rem.minutes_before !== 1 ? "s" : ""}!`;

            // Console log (for debugging)
            console.log(`🔔 Reminder fired for event: ${event.title}`, rem);

            // ✅ In-app toast popup
            if (typeof showToast === "function") {
              showToast({
                title: "Event Reminder",
                message: msg,
                method: rem.method,
              });
            }

            // ✅ Browser notification
            if (rem.method === "notification" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("Event Reminder", {
                  body: msg,
                  icon: "/calendar-icon.png",
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then((perm) => {
                  if (perm === "granted") {
                    new Notification("Event Reminder", { body: msg });
                  }
                });
              }
            }
          }
        });
      });
    }, 15000); // check every 15s

    return () => clearInterval(interval);
  }, [events, showToast]);
}
