"use client";
import { useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import MonthView from "./views/MonthView";
import WeekView from "./views/WeekView";
import DayView from "./views/DayView";
import ScheduleView from "./views/ScheduleView";

function useReminders(events = []) {
  useEffect(() => {
    if (!("Notification" in window)) return;
    Notification.requestPermission();
    const timers = [];
    events.forEach((event) => {
      if (!event.reminders?.length) return;
      const startMillis = new Date(event.start_time).getTime();
      if (isNaN(startMillis)) return;
      event.reminders.forEach((r) => {
        const mins = parseInt(r.minutes_before || 0, 10);
        if (isNaN(mins)) return;
        const delay = startMillis - mins * 60000 - Date.now();
        if (delay > 0) {
          timers.push(setTimeout(() => {
            new Notification(event.title || "Event Reminder", {
              body: `Starts at ${new Date(event.start_time).toLocaleTimeString()}`,
            });
          }, delay));
        }
      });
    });
    return () => timers.forEach(clearTimeout);
  }, [events]);
}

function CalendarView({ onEventClick, onEventContextMenu, onGridClick, placeholder }) {
  const { currentView, events } = useCalendarStore();
  useReminders(events);

  const viewProps = { onEventClick, onEventContextMenu, onGridClick, placeholder };

  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-[#202124]">
      {currentView === "month" && <MonthView {...viewProps} />}
      {currentView === "week" && <WeekView {...viewProps} />}
      {currentView === "day" && <DayView {...viewProps} />}
      {currentView === "schedule" && <ScheduleView onEventClick={onEventClick} />}
    </div>
  );
}

export default CalendarView;
