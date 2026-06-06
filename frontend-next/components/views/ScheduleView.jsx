"use client";
import React, { useMemo } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";

const formatEventTime = (event) => {
  if (event.is_all_day) return "All day";
  try {
    const options = { hour: "numeric", minute: "2-digit" };
    const start = new Date(event.start_time).toLocaleTimeString("en-US", options);
    const end = new Date(event.end_time).toLocaleTimeString("en-US", options);
    return `${start} – ${end}`;
  } catch {
    return "All day";
  }
};

const getDateKey = (date) => {
  try { return new Date(date).toDateString(); } catch { return null; }
};

function ScheduleView({ onEventClick }) {
  const { events, showHolidays } = useCalendarStore();
  const { holidays } = useHolidayStore();

  const sortedDays = useMemo(() => {
    const grouped = new Map();
    const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    sortedEvents.forEach((event) => {
      const dateKey = getDateKey(event.start_time);
      if (!dateKey) return;
      if (!grouped.has(dateKey)) grouped.set(dateKey, { events: [], holidays: [] });
      grouped.get(dateKey).events.push(event);
    });

    if (showHolidays) {
      holidays.forEach((holiday) => {
        const dateKey = getDateKey(holiday.date);
        if (!dateKey) return;
        if (!grouped.has(dateKey)) grouped.set(dateKey, { events: [], holidays: [] });
        grouped.get(dateKey).holidays.push(holiday);
      });
    }

    const allEntries = Array.from(grouped.entries());
    allEntries.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    return allEntries;
  }, [events, holidays, showHolidays]);

  return (
    <div className="h-full overflow-auto bg-white dark:bg-[#131314] rounded-[28px] py-2">
      {sortedDays.length > 0 ? (
        sortedDays.map(([dateStr, dayData]) => (
          <ScheduleDay key={dateStr} dateStr={dateStr} dayData={dayData} onEventClick={onEventClick} />
        ))
      ) : (
        <div className="text-center py-12 text-zinc-500 dark:text-[#c4c7c5]">
          <span className="material-icons-outlined text-5xl mb-3 opacity-30">event_busy</span>
          <div className="text-lg">No events or holidays scheduled</div>
        </div>
      )}
    </div>
  );
}
export default ScheduleView;

const ScheduleDay = React.memo(({ dateStr, dayData, onEventClick }) => {
  const { events: dateEvents, holidays: dateHolidays } = dayData;
  const date = new Date(dateStr);
  const dayNum = date.getDate();
  const monthShort = date.toLocaleDateString("en-US", { month: "short" });
  const weekdayShort = date.toLocaleDateString("en-US", { weekday: "short" });
  const today = date.toDateString() === new Date().toDateString();

  const rows = [
    ...dateHolidays.map((h) => ({ key: `h-${h.id || h.name}`, color: h.color || "#34a853", time: "All day", title: h.name, onClick: null })),
    ...dateEvents.map((e) => ({ key: `e-${e.id}`, color: e.color || e.calendar_color || "#1a73e8", time: formatEventTime(e), title: e.title, onClick: () => onEventClick?.(e) })),
  ];

  return (
    <div className="flex pl-[14px] pr-4 mt-2 pb-2 border-b border-google-gray-200 dark:border-[#333537]">
      {/* Date column */}
      <div className="flex items-end gap-1.5 w-[120px] flex-shrink-0 pt-1">
        <span
          className={`text-[22px] leading-9 font-normal text-google-gray-800 dark:text-[#e3e3e3] text-center ${today ? "rounded-full px-2 dark:bg-[#004a77] dark:text-[#c2e7ff]" : ""}`}
          style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
        >
          {dayNum}
        </span>
        <span className="pb-2 text-[11px] font-medium uppercase tracking-[0.8px] text-google-gray-500 dark:text-[#c4c7c5]">
          {monthShort}, {weekdayShort}
        </span>
      </div>

      {/* Events column */}
      <div className="flex-1 min-w-0 pt-1">
        {rows.map((r) => (
          <div
            key={r.key}
            onClick={r.onClick || undefined}
            className={`flex items-center min-h-[36px] gap-3 ${r.onClick ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
            <span className="w-[120px] flex-shrink-0 text-[14px] text-google-gray-600 dark:text-[#c4c7c5] truncate">{r.time}</span>
            <span className="flex-1 min-w-0 text-[14px] text-google-gray-800 dark:text-[#e3e3e3] truncate">{r.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
