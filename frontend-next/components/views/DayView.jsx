"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDrop } from "react-dnd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import { DraggableEvent, ItemTypes } from "../DraggableEvent";

const HOUR_H = 48;       // .s43 / .s48 hour cell height
const RAIL_W = 9;        // .s16 left rail; vertical line sits at this x
const BAND_H = 20;       // .s5 GMT band / all-day band height
const GUTTER_W = 71;     // .s3 time-gutter width
const HEADER_H = 84;     // .s2 day header height
const toLocalISO = (d) => {
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
};

function DayView({ onEventClick, onEventContextMenu, onGridClick, placeholder }) {
  const { currentDate, events, updateEvent, showHolidays, fetchEvents, selectedCalendars } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();

  const dayEvents = events.filter((e) => new Date(e.start_time).toDateString() === currentDate.toDateString());
  const dayHolidays = showHolidays ? getHolidaysForDate(currentDate) || [] : [];
  const allDayEvents = dayEvents.filter((e) => e.is_all_day);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(iv); }, []);

  const isTodayDate = () => currentDate.toDateString() === now.toDateString();
  const indicatorTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_H;

  // On open / day change, scroll so the current time (red line) sits in the
  // middle of the viewport instead of starting at the top (midnight).
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = isTodayDate()
      ? ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_H
      : 8 * HOUR_H; // non-today: land around 8 AM
    el.scrollTop = Math.max(0, target - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);
  const tz = (() => {
    const off = -new Date().getTimezoneOffset();
    const s = off >= 0 ? "+" : "-", a = Math.abs(off);
    return `GMT${s}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
  })();

  const refreshAfterDrop = useCallback(async () => {
    if (!selectedCalendars.length) return;
    const s = new Date(currentDate); s.setHours(0,0,0,0);
    const e = new Date(currentDate); e.setHours(23,59,59,999);
    await fetchEvents(s, e);
  }, [currentDate, selectedCalendars, fetchEvents]);

  const handleDrop = useCallback(async (event, hour) => {
    const ns = new Date(currentDate); ns.setHours(hour, 0, 0, 0);
    const dur = new Date(event.end_time) - new Date(event.start_time);
    const ne = new Date(ns.getTime() + dur);
    await updateEvent(event.id, { start_time: toLocalISO(ns), end_time: toLocalISO(ne) });
    await refreshAfterDrop();
  }, [currentDate, updateEvent, refreshAfterDrop]);

  const handleResize = useCallback(async (event, deltaMin) => {
    const ne = new Date(event.end_time); ne.setMinutes(ne.getMinutes() + deltaMin);
    await updateEvent(event.id, { end_time: toLocalISO(ne) });
    await refreshAfterDrop();
  }, [updateEvent, refreshAfterDrop]);

  const evStyle = (ev) => {
    const s = new Date(ev.start_time), e = new Date(ev.end_time || ev.start_time);
    const dur = Math.max((e - s) / 60000, 15);
    return {
      position: "absolute", top: ((s.getHours() * 60 + s.getMinutes()) / 60) * HOUR_H,
      height: Math.max((dur / 60) * HOUR_H, 20), left: "4px", right: "4px", borderRadius: "6px",
      backgroundColor: ev.color || ev.calendar_color || "#4b99d2",
    };
  };

  const ph = placeholder && placeholder.start.toDateString() === currentDate.toDateString()
    ? { top: ((placeholder.start.getHours() * 60 + placeholder.start.getMinutes()) / 60) * HOUR_H,
        height: Math.max(((placeholder.end - placeholder.start) / 60000 / 60) * HOUR_H, 20) }
    : null;

  function TimeSlot({ hour }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.EVENT,
      drop: (item) => handleDrop(item.event, hour),
      collect: (m) => ({ isOver: m.isOver() }),
    }), [hour]);
    return (
      <div ref={drop}
        onClick={(e) => { if (e.target.closest(".event-bubble")) return; const d = new Date(currentDate); d.setHours(hour, 0, 0, 0); onGridClick?.(d, e.clientX, e.clientY); }}
        className={`relative cursor-pointer transition-colors ${isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
        style={{ height: `${HOUR_H}px` }}
      />
    );
  }

  const isToday = isTodayDate();
  const headLabel = isToday
    ? "text-google-blue dark:text-[#a8c7fa]"
    : "text-google-gray-500 dark:text-[#c4c7c5]";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#131314] overflow-hidden rounded-[28px]">
      {/* === Day header (.s2 — 84px) ============================================
          gutter holds the GMT label pinned to its bottom 20px band; the day
          area carries the weekday/date heading plus the working-location row
          and any all-day events, with the rail vertical line in the band. */}
      <div
        className="flex shrink-0 sticky top-0 z-20 bg-white dark:bg-[#131314]"
        style={{ height: `${HEADER_H}px`, minHeight: `${HEADER_H}px` }}
      >
        {/* gutter (.s3) — GMT (.s7) sits in the bottom 20px band (.s6) */}
        <div className="relative shrink-0" style={{ width: `${GUTTER_W}px`, minWidth: `${GUTTER_W}px` }}>
          <div
            className="absolute left-0 right-0 bottom-0 flex items-center justify-end pr-0.5"
            style={{ height: `${BAND_H}px` }}
          >
            <span className="text-[11px] leading-4 font-medium tracking-[0.1px] text-google-gray-500 dark:text-[#c4c7c5] whitespace-nowrap">
              {tz}
            </span>
          </div>
        </div>

        {/* day area (.s8 / .s17) */}
        <div className="relative flex-1 overflow-hidden">
          {/* rail vertical line (.s18) — only across the bottom 20px band */}
          <div
            className="absolute border-l border-google-gray-200 dark:border-[#333537]"
            style={{ left: `${RAIL_W}px`, top: `${HEADER_H - BAND_H}px`, bottom: 0 }}
          />

          {/* content offset past the rail (.s16) */}
          <div className="flex h-full" style={{ marginLeft: `${RAIL_W}px` }}>
            {/* weekday + date (.s19 / .s20) */}
            <h2 className="ml-2 shrink-0 text-center" style={{ width: "46px" }} aria-label={currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}>
              <div className={`mt-2 text-[11px] font-medium uppercase leading-8 tracking-[0.8px] ${headLabel}`}>
                {currentDate.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <span
                className={`-mt-2 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : "text-google-gray-700 dark:text-[#e3e3e3]"}`}
                style={{ width: "46px", height: "46px", fontSize: "26px", lineHeight: "46px", fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
              >
                {currentDate.getDate()}
              </span>
            </h2>

            {/* working-location row + all-day events (.s23), bottom-aligned */}
            <div className="flex-1 min-w-0 flex flex-col justify-end gap-0.5 pb-1 pr-3">
              {allDayEvents.slice(0, 3).map((ev) => (
                <div key={ev.id}
                  onClick={() => onEventClick?.(ev, undefined, undefined)}
                  onContextMenu={(e) => { e.preventDefault(); onEventContextMenu?.(ev, e.clientX, e.clientY); }}
                  className="gc-event-chip px-1.5 py-0.5 rounded text-[11px] truncate text-white cursor-pointer hover:opacity-90 w-fit max-w-full"
                  style={{ backgroundColor: ev.color || ev.calendar_color || "#1a73e8" }}>
                  {ev.title}
                </div>
              ))}
              {dayHolidays.map((h) => <div key={h.id || h.name} className="text-[11px] text-google-green truncate">{h.name}</div>)}

              {/* Add location (.s28 / .s29) — chip revealed on hover */}
              <button
                type="button"
                aria-label="Add a working location"
                className="group flex items-center self-start max-w-full"
              >
                <span className="flex items-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-[#e8f0fe] dark:bg-[#2f4c63] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]" style={{ padding: "2px 8px" }}>
                  <span className="flex items-center justify-center text-[#1a73e8] dark:text-[#4b99d2]">
                    <svg focusable="false" viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "currentColor" }}>
                      <path d="M20 1v3h3v2h-3v3h-2V6h-3V4h3V1h2zm-8 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm1-9.94v2.02A6.53 6.53 0 0 0 12 5c-3.35 0-6 2.57-6 6.2 0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.79 6-9.14V11h2v.2c0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 6.22 7.8 3 12 3c.34 0 .67.02 1 .06z" />
                    </svg>
                  </span>
                  <span className="ml-1 mr-1 text-[11px] font-medium tracking-[0.3px] whitespace-nowrap select-none text-google-gray-700 dark:text-[#e3e3e3]">
                    Add location
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === Grid body (.s39) ================================================== */}
      <div ref={scrollRef} className="flex overflow-auto flex-1">
        {/* Time gutter (.s41 / .s43) — hour labels, right-aligned */}
        <div className="bg-white dark:bg-[#131314]" style={{ width: `${GUTTER_W}px`, minWidth: `${GUTTER_W}px` }}>
          {hours.map((h) => (
            <div key={h} className="text-right pr-2 text-[11px] font-medium tracking-[0.1px] text-google-gray-500 dark:text-[#c4c7c5] flex items-start justify-end" style={{ height: `${HOUR_H}px`, fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
              <span className="-mt-[6px]">{h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</span>
            </div>
          ))}
        </div>

        {/* Day area — horizontal lines (.s47/.s48) are full-width single
            elements; the single day column is offset by RAIL_W (.s49). */}
        <div className="flex-1 flex flex-col">
          {/* Hours */}
          <div id="calendar-hours-top" className="relative border-t border-google-gray-200 dark:border-[#333537]">
            {/* Horizontal hour lines — single full-width elements (line + nub identical) */}
            <div className="absolute inset-0 pointer-events-none">
              {hours.map((h) => (
                <div key={`line-${h}`} className="border-b border-google-gray-200 dark:border-[#333537]" style={{ height: `${HOUR_H}px` }} />
              ))}
            </div>

            {/* Day column — offset by RAIL_W; carries the left vertical line + interaction */}
            <div className="relative border-l border-google-gray-200 dark:border-[#333537]" style={{ marginLeft: `${RAIL_W}px` }}>
              {isTodayDate() && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${indicatorTop}px`, transform: "translateY(-50%)" }}>
                  <div className="w-3 h-3 rounded-full -ml-[6px]" style={{ backgroundColor: "#f55e57" }} />
                  <div className="flex-1 h-[2px]" style={{ backgroundColor: "#f55e57" }} />
                </div>
              )}
              {hours.map((h) => <TimeSlot key={h} hour={h} />)}

              {/* Placeholder blob */}
              {ph && (
                placeholder?.variant === "working" ? (
                  <div className="absolute left-1 right-1 z-10 rounded-md overflow-hidden pointer-events-none border border-[#5f6368]/50"
                    style={{
                      top: ph.top,
                      height: ph.height,
                      backgroundColor: "rgba(95,99,104,0.18)",
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(154,160,166,0.25) 0, rgba(154,160,166,0.25) 1px, transparent 1px, transparent 9px)",
                    }}>
                    <span className="material-icons-outlined text-[16px] text-[#8ab4f8] absolute top-0.5 left-0.5">location_on</span>
                  </div>
                ) : (
                  <div className="absolute left-1 right-1 z-10 rounded-md px-2 py-1 text-xs text-white opacity-70 pointer-events-none"
                    style={{ top: ph.top, height: ph.height, backgroundColor: placeholder?.color || "#1a73e8" }}>
                    <span className="truncate block">{placeholder?.title}</span>
                  </div>
                )
              )}

              {/* Events */}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.filter((e) => !e.is_all_day).map((ev) => (
                  <DraggableEvent key={ev.id} event={ev}
                    onEventClick={(e) => onEventClick?.(e, undefined, undefined)}
                    onResizeEnd={handleResize}
                    onContextMenu={onEventContextMenu}
                    className="gc-event-chip event-bubble absolute px-2 py-1 rounded-md text-xs text-white truncate shadow-sm pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
                    style={evStyle(ev)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayView;
