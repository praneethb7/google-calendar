"use client";
import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useDrop } from "react-dnd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import { DraggableEvent, ItemTypes } from "../DraggableEvent";
import WorkingHoursOverlay from "../WorkingHoursOverlay";

const HOUR_H = 48;       // .s54 / .s59 hour cell height
const RAIL_W = 9;        // .s16 left rail; vertical lines sit at this x
const BAND_H = 20;       // .s5 GMT band / header divider-stub band
const HEADER_H = 102;    // .s2 week header height
const NAME_H = 84;       // .s14 day-name row height
const toLocalISO = (d) => {
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
};

function WeekView({ onEventClick, onEventContextMenu, onGridClick, placeholder, numDays = 7, anchor = "week" }) {
  const { currentDate, events = [], updateEvent, showHolidays, fetchEvents, selectedCalendars } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();

  const weekDays = useMemo(() => {
    const s = new Date(currentDate);
    if (anchor === "week") s.setDate(s.getDate() - s.getDay());
    s.setHours(0, 0, 0, 0);
    return Array.from({ length: numDays }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [currentDate, numDays, anchor]);

  const colsStyle = { gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(iv); }, []);

  const indicatorTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_H;

  // The body grid scrolls vertically, so its day area is narrower than the
  // (non-scrolling) header by the scrollbar width. Measure it and pull the
  // header's nub grid in by the same amount so the nubs land on the body lines.
  const scrollRef = useRef(null);
  const [sbw, setSbw] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = scrollRef.current;
      if (el) setSbw(el.offsetWidth - el.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const tz = useMemo(() => {
    const off = -new Date().getTimezoneOffset();
    const s = off >= 0 ? "+" : "-", a = Math.abs(off);
    return `GMT${s}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
  }, []);

  const { eventsByDay, allDayByDay } = useMemo(() => {
    const dm = new Map(), am = new Map();
    weekDays.forEach((d) => { const k = d.toDateString(); dm.set(k, []); am.set(k, []); });
    for (const ev of events) {
      const k = new Date(ev.start_time).toDateString();
      if (ev.is_all_day) am.get(k)?.push(ev); else dm.get(k)?.push(ev);
    }
    return { eventsByDay: dm, allDayByDay: am };
  }, [events, weekDays]);

  const refreshAfterDrop = useCallback(async () => {
    if (!selectedCalendars.length) return;
    const s = new Date(weekDays[0]); s.setHours(0,0,0,0);
    const e = new Date(weekDays[weekDays.length - 1]); e.setHours(23,59,59,999);
    await fetchEvents(s, e);
  }, [weekDays, selectedCalendars, fetchEvents]);

  const handleDrop = useCallback(async (event, date, hour) => {
    const ns = new Date(date); ns.setHours(hour, 0, 0, 0);
    const dur = new Date(event.end_time) - new Date(event.start_time);
    const ne = new Date(ns.getTime() + dur);
    await updateEvent(event.id, { start_time: toLocalISO(ns), end_time: toLocalISO(ne) });
    await refreshAfterDrop();
  }, [updateEvent, refreshAfterDrop]);

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
      height: (dur / 60) * HOUR_H, left: "4px", right: "4px", borderRadius: "6px",
      backgroundColor: ev.color || ev.calendar_color || "#1a73e8",
    };
  };

  // Placeholder blob style
  const placeholderForDay = (day) => {
    if (!placeholder) return null;
    if (placeholder.start.toDateString() !== day.toDateString()) return null;
    const s = placeholder.start, e = placeholder.end;
    const dur = Math.max((e - s) / 60000, 15);
    return {
      top: ((s.getHours() * 60 + s.getMinutes()) / 60) * HOUR_H,
      height: (dur / 60) * HOUR_H,
    };
  };

  function TimeSlot({ date, hour }) {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.EVENT,
      drop: (item) => handleDrop(item.event, date, hour),
      collect: (m) => ({ isOver: m.isOver() }),
    }), [date, hour]);
    return (
      <div ref={drop}
        onClick={(e) => { const d = new Date(date); d.setHours(hour, 0, 0, 0); onGridClick?.(d, e.clientX, e.clientY); }}
        className={`relative cursor-pointer transition-colors ${isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
        style={{ height: `${HOUR_H}px` }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#131314] overflow-hidden rounded-[28px]" style={{ paddingLeft: "8px" }}>
      {/* === Week header (.s2 — 102px) ==========================================
          gutter holds the GMT label pinned to the day-name row's bottom 20px
          band (.s6 top:64). The day area carries the weekday/date headings, the
          short divider stubs in that band, and a per-day working-location row. */}
      <div
        className="flex shrink-0 sticky top-0 z-20 bg-white dark:bg-[#131314]"
        style={{ height: `${HEADER_H}px`, minHeight: `${HEADER_H}px` }}
      >
        {/* gutter (.s3) — GMT (.s7) in the bottom 20px band of the name row */}
        <div className="relative shrink-0" style={{ width: "71px", minWidth: "71px" }}>
          <div
            className="absolute left-0 right-0 flex items-center justify-end pr-0.5"
            style={{ top: `${NAME_H - BAND_H}px`, height: `${BAND_H}px` }}
          >
            <span className="text-[11px] leading-4 font-medium tracking-[0.1px] text-google-gray-500 dark:text-[#c4c7c5] whitespace-nowrap">
              {tz}
            </span>
          </div>
        </div>

        {/* day area (.s8) */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          {/* vertical divider stubs (.s18–.s30) — bottom 20px of the header, so
              they reach the body grid lines below. Same border structure as the
              body columns (container border-l + per-cell border-r) so the nubs
              sit exactly on those lines. */}
          <div
            className="absolute grid pointer-events-none border-l border-google-gray-200 dark:border-[#333537]"
            style={{ ...colsStyle, top: `${HEADER_H - BAND_H}px`, bottom: 0, left: `${RAIL_W}px`, right: `${sbw}px` }}
          >
            {weekDays.map((day) => (
              <div key={`stub-${day.toISOString()}`} className="border-r border-google-gray-200 dark:border-[#333537] last:border-r-0" />
            ))}
          </div>

          {/* weekday + date row (.s14 — 84px) */}
          <div className="grid" style={{ ...colsStyle, marginLeft: `${RAIL_W}px`, height: `${NAME_H}px` }}>
            {weekDays.map((day) => {
              const isToday = now.toDateString() === day.toDateString();
              return (
                <h2
                  key={`name-${day.toISOString()}`}
                  className="text-center"
                  aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                >
                  <div className={`mt-0.5 text-[11px] font-medium uppercase leading-8 tracking-[0.8px] ${isToday ? "text-google-blue dark:text-[#a8c7fa]" : "text-google-gray-500 dark:text-[#c4c7c5]"}`}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <span
                    className={`-mt-1 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : "text-google-gray-700 dark:text-[#e3e3e3]"}`}
                    style={{ width: "46px", height: "46px", fontSize: "26px", lineHeight: "46px", fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                  >
                    {day.getDate()}
                  </span>
                </h2>
              );
            })}
          </div>

          {/* working-location row + all-day events (.s31 / .s42) */}
          <div className="grid flex-1 min-h-0" style={{ ...colsStyle, marginLeft: `${RAIL_W}px` }}>
            {weekDays.map((day) => {
              const allDay = (allDayByDay.get(day.toDateString()) || []).slice(0, 2);
              const holidays = showHolidays ? getHolidaysForDate(day) || [] : [];
              return (
                <div key={`wl-${day.toISOString()}`} className="px-2 flex flex-col justify-end gap-0.5 pb-0.5 min-w-0">
                  {allDay.map((ev) => (
                    <div key={ev.id}
                      onClick={() => onEventClick?.(ev, undefined, undefined)}
                      onContextMenu={(e) => { e.preventDefault(); onEventContextMenu?.(ev, e.clientX, e.clientY); }}
                      className="gc-event-chip px-1.5 py-0.5 rounded text-[11px] truncate text-white cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: ev.color || ev.calendar_color || "#1a73e8" }}>
                      {ev.title}
                    </div>
                  ))}
                  {holidays.map((h) => <div key={h.id || h.name} className="text-[11px] text-google-green truncate">{h.name}</div>)}

                  {/* Add location (.s36 / .s37) — chip revealed on hover */}
                  <button type="button" aria-label="Add a working location" className="group flex items-center self-start max-w-full">
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
              );
            })}
          </div>
        </div>
      </div>

      {/* === Grid body (.s50) ================================================== */}
      <div className="relative flex flex-1 min-h-0">
        {/* Top scroll-shadow line with gradient "nub" fades at each end (.p2/.p3).
            Spans the day+gutter area up to the scrollbar (right: sbw) so the nubs
            land on the changed 4-/7-column ratio; 80px fades cap both ends. */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-30"
          style={{
            right: `${sbw}px`,
            height: "4px",
            boxShadow:
              "inset 0 1px 1px 0 rgba(0,0,0,0.14), inset 0 2px 1px -1px rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="absolute left-0 top-0 bg-gradient-to-r from-white dark:from-[#131314] to-transparent"
            style={{ width: "80px", height: "2px" }}
          />
          <div
            className="absolute right-0 top-0 bg-gradient-to-l from-white dark:from-[#131314] to-transparent"
            style={{ width: "80px", height: "2px" }}
          />
        </div>
        <div ref={scrollRef} className="flex overflow-auto flex-1">
        {/* Time gutter (.s52 / .s54) — hour labels, right-aligned */}
        <div className="bg-white dark:bg-[#131314]" style={{ width: "71px", minWidth: "71px" }}>
          {hours.map((h) => (
            <div key={h} className="text-right pr-2 text-[11px] font-medium tracking-[0.1px] text-google-gray-500 dark:text-[#c4c7c5] flex items-start justify-end" style={{ height: `${HOUR_H}px`, fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
              <span className="-mt-[6px]">{h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</span>
            </div>
          ))}
        </div>

        {/* Day area — horizontal lines (.s58/.s59) are single full-width
            elements; columns are offset by RAIL_W (.s60) so the vertical lines
            sit RAIL_W px right of where the h-lines start. */}
        <div className="flex-1 flex flex-col">
          {/* Hours */}
          <div id="calendar-hours-top" className="relative border-t border-google-gray-200 dark:border-[#333537]">
            {/* Horizontal hour lines — single full-width elements (line + nub identical) */}
            <div className="absolute inset-0 pointer-events-none">
              {hours.map((h) => (
                <div key={`line-${h}`} className="border-b border-google-gray-200 dark:border-[#333537]" style={{ height: `${HOUR_H}px` }} />
              ))}
            </div>

            {/* Day columns — offset by RAIL_W; carry vertical lines + interaction */}
            <div className="grid relative border-l border-google-gray-200 dark:border-[#333537]" style={{ ...colsStyle, marginLeft: `${RAIL_W}px` }}>
              <div className="absolute inset-0 z-0"><WorkingHoursOverlay date={currentDate} viewType="week" /></div>
              {weekDays.map((day, i) => {
                const timed = eventsByDay.get(day.toDateString()) || [];
                const ph = placeholderForDay(day);
                return (
                  <div key={day.toISOString()} className="relative border-r border-google-gray-200 dark:border-[#333537] last:border-r-0">
                    {hours.map((h) => <TimeSlot key={`${i}-${h}`} date={day} hour={h} />)}

                    {/* Current time line */}
                    {now.toDateString() === day.toDateString() && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${indicatorTop}px`, transform: "translateY(-50%)" }}>
                        <div className="w-3 h-3 rounded-full -ml-[6px]" style={{ backgroundColor: "#f55e57" }} />
                        <div className="flex-1 h-[2px]" style={{ backgroundColor: "#f55e57" }} />
                      </div>
                    )}

                    {/* Placeholder blob */}
                    {ph && (
                      placeholder.variant === "working" ? (
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
                          style={{ top: ph.top, height: ph.height, backgroundColor: placeholder.color || "#1a73e8" }}>
                          <span className="truncate block">{placeholder.title}</span>
                        </div>
                      )
                    )}

                    {/* Real events */}
                    <div className="absolute inset-0 pointer-events-none">
                      {timed.map((ev) => (
                        <DraggableEvent key={ev.id} event={ev}
                          onEventClick={(e) => onEventClick?.(e, undefined, undefined)}
                          onResizeEnd={handleResize}
                          onContextMenu={onEventContextMenu}
                          className="gc-event-chip absolute px-2 py-1 rounded-md text-xs text-white truncate shadow-sm pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
                          style={evStyle(ev)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default WeekView;
