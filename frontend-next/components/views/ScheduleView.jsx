"use client";
import React, { useMemo } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";

const GS = '"Google Sans", Roboto, Arial, sans-serif';

// Google's compact time range, e.g. "8 – 9:30am", "9am – 9pm", "5:30 – 7pm".
const fmtPart = (d, withPeriod) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  let s = `${h}`;
  if (m) s += `:${String(m).padStart(2, "0")}`;
  if (withPeriod) s += period;
  return s;
};

const formatEventTime = (event) => {
  if (event.is_all_day) return "All day";
  try {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const sP = start.getHours() >= 12 ? "pm" : "am";
    const eP = end.getHours() >= 12 ? "pm" : "am";
    return `${fmtPart(start, sP !== eP)} – ${fmtPart(end, true)}`;
  } catch {
    return "All day";
  }
};

const getDateKey = (date) => {
  try { return new Date(date).toDateString(); } catch { return null; }
};

const rsvpOf = (e) => (e.rsvp_status || "").toLowerCase();

function ScheduleView({ onEventClick }) {
  const { events, showHolidays, showDeclinedEvents, currentDate, fetchEvents } = useCalendarStore();
  const { holidays } = useHolidayStore();

  const sortedDays = useMemo(() => {
    const grouped = new Map();
    const visible = showDeclinedEvents
      ? events
      : events.filter((e) => rsvpOf(e) !== "declined");
    const sortedEvents = [...visible].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );

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
  }, [events, holidays, showHolidays, showDeclinedEvents]);

  const horizon = useMemo(() => {
    let max = null;
    sortedDays.forEach(([dateStr]) => {
      const d = new Date(dateStr);
      if (!max || d > max) max = d;
    });
    return max || new Date(currentDate);
  }, [sortedDays, currentDate]);

  const horizonLabel = horizon.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const lookForMore = () => {
    const start = new Date(currentDate);
    const end = new Date(horizon);
    end.setMonth(end.getMonth() + 6);
    fetchEvents?.(start, end);
  };

  return (
    <div
      className="h-full flex flex-col overflow-auto bg-white dark:bg-[#131314] rounded-[28px] text-google-gray-800 dark:text-[#e3e3e3]"
      style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
    >
      {sortedDays.length > 0 ? (
        <>
          <div className="flex-1">
            {sortedDays.map(([dateStr, dayData]) => (
              <ScheduleDay
                key={dateStr}
                dateStr={dateStr}
                dayData={dayData}
                onEventClick={onEventClick}
              />
            ))}
          </div>
          {/* Footer (.s29) */}
          <div className="flex items-center p-2">
            <span className="text-google-gray-500 dark:text-[#e3e3e3]">
              Showing events until {horizonLabel}.
            </span>
            <div className="ml-3">
              <button
                onClick={lookForMore}
                className="inline-flex items-center justify-center my-1 px-3 min-w-[64px] h-10 rounded-[20px] border border-google-blue/60 dark:border-[#a8c7fa] text-google-blue dark:text-[#a8c7fa] font-medium text-[13.3333px] hover:bg-google-blue/5 dark:hover:bg-[#a8c7fa]/10 transition-colors"
                style={{ fontFamily: GS }}
              >
                Look for more
              </button>
            </div>
          </div>
        </>
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

// 12px status dot: filled (accepted/owned) vs hollow ring (needs RSVP).
const Dot = ({ color, hollow }) => (
  <div className="flex items-center w-[38px] flex-shrink-0">
    <div className="ml-[10px] mr-4 my-[10px] w-3 h-3">
      <div
        className="w-3 h-3 rounded-full"
        style={hollow
          ? { border: `1px solid ${color}` }
          : { backgroundColor: color }}
      />
    </div>
  </div>
);

// One event pill (.s13 / .s28). `indented` adds the 134px left offset that
// stands in for the absent date column on continuation rows.
const EventRow = ({ row, indented }) => (
  <div
    onClick={row.onClick || undefined}
    className={`flex flex-grow min-w-0 mr-[10px] rounded-[9999px] hover:bg-[#5f6368]/[0.12] dark:hover:bg-[#5f6368]/[0.12] ${row.onClick ? "cursor-pointer" : "cursor-default"}`}
    style={indented ? { marginLeft: 134 } : undefined}
  >
    <div className={`flex items-center w-[160px] flex-shrink-0 h-8 text-google-gray-600 dark:text-[#e3e3e3] ${row.declined ? "line-through" : ""}`}>
      {row.time}
    </div>
    <div className="flex items-center min-w-0 h-8">
      <div className={`flex-shrink-0 font-medium truncate ${row.declined ? "line-through" : ""}`}>
        {row.title}
      </div>
      {row.location && (
        <div className="ml-2 text-google-gray-500 dark:text-[#c4c7c5] truncate">
          {row.location}
        </div>
      )}
    </div>
    <Dot color={row.color} hollow={row.hollow} />
  </div>
);

// Current-time indicator line (.s27) with its red dot (.p3).
const NowLine = () => (
  <div className="relative ml-[126px] mr-[10px]" style={{ borderTop: "2px solid #f55e57" }}>
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#f55e57]" />
  </div>
);

const ScheduleDay = React.memo(({ dateStr, dayData, onEventClick }) => {
  const { events: dateEvents, holidays: dateHolidays } = dayData;
  const date = new Date(dateStr);
  const dayNum = date.getDate();
  const monthShort = date.toLocaleDateString("en-US", { month: "short" });
  const weekdayShort = date.toLocaleDateString("en-US", { weekday: "short" });
  const today = date.toDateString() === new Date().toDateString();

  const rows = [
    ...dateHolidays.map((h) => ({
      key: `h-${h.id || h.name}`,
      color: h.color || "#34a853",
      time: "All day",
      title: h.name,
      location: null,
      hollow: false,
      declined: false,
      onClick: null,
    })),
    ...dateEvents.map((e) => {
      const status = rsvpOf(e);
      return {
        key: `e-${e.id}`,
        color: e.color || e.calendar_color || "#4b99d2",
        time: formatEventTime(e),
        title: e.title,
        location: e.location || null,
        hollow: status === "pending" || status === "declined",
        declined: status === "declined",
        start: new Date(e.start_time),
        onClick: () => onEventClick?.(e),
      };
    }),
  ];

  // Insertion point of the now-line among today's rows.
  const now = new Date();
  const nowIndex = today
    ? rows.filter((r) => r.start && r.start <= now).length
    : -1;

  return (
    <div className="mt-2 pb-2 border-b border-google-gray-200 dark:border-[#333537]">
      {rows.map((row, i) => (
        <React.Fragment key={row.key}>
          {today && i === nowIndex && <NowLine />}
          <div className="flex">
            {/* Date column (.s6) — only on the first row of the day */}
            {i === 0 && (
              <div className="pl-[14px] w-[134px] flex-shrink-0">
                <h2
                  className={`flex items-center text-[21px] ${today ? "text-[#1a73e8] dark:text-[#a8c7fa]" : "text-google-gray-700 dark:text-[#c4c7c5]"}`}
                >
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-full text-[18px] leading-9 text-center"
                    style={{
                      fontFamily: GS,
                      ...(today
                        ? { backgroundColor: "#a8c7fa", color: "#062e6f" }
                        : {}),
                    }}
                  >
                    {dayNum}
                  </span>
                  <span className="flex flex-col justify-end font-medium tracking-[0.8px]">
                    <span className="ml-1.5 text-[11px] uppercase">
                      {monthShort}, {weekdayShort}
                    </span>
                  </span>
                </h2>
              </div>
            )}
            <EventRow row={row} indented={i !== 0} />
          </div>
        </React.Fragment>
      ))}
      {/* Now-line at end of day (all events already passed) */}
      {today && nowIndex >= rows.length && rows.length > 0 && <NowLine />}
    </div>
  );
});
