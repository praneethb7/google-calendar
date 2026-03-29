"use client";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import { DraggableEvent, ItemTypes } from "../DraggableEvent";
import WorkingHoursOverlay from "../WorkingHoursOverlay";

const HOUR_H = 64;
const toLocalISO = (d) => {
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
};

function WeekView({ onEventClick, onEventContextMenu, onGridClick, placeholder }) {
  const { currentDate, events = [], updateEvent, showHolidays, fetchEvents, selectedCalendars } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();

  const weekDays = useMemo(() => {
    const s = new Date(currentDate);
    s.setDate(s.getDate() - s.getDay());
    s.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(iv); }, []);

  const indicatorTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_H;
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
    const s = new Date(currentDate); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0);
    const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
    await fetchEvents(s, e);
  }, [currentDate, selectedCalendars, fetchEvents]);

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
        className={`relative border-b border-google-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
        style={{ height: `${HOUR_H}px` }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#202124] overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex border-b border-google-gray-200 dark:border-gray-700 sticky top-0 z-20 bg-white dark:bg-[#202124]">
        <div className="w-[72px] min-w-[72px] border-r border-google-gray-200 dark:border-gray-700 flex items-center justify-center">
          <div className="text-[11px] text-google-gray-500 dark:text-gray-400 font-medium">{tz}</div>
        </div>
        <div className="flex-1 grid grid-cols-7 divide-x divide-google-gray-200 dark:divide-gray-700">
          {weekDays.map((day) => {
            const isToday = now.toDateString() === day.toDateString();
            const allDay = (allDayByDay.get(day.toDateString()) || []).slice(0, 2);
            const holidays = showHolidays ? getHolidaysForDate(day) || [] : [];
            return (
              <div key={day} className="px-1 py-2 text-center">
                <div className="text-[11px] uppercase text-google-gray-500 dark:text-gray-400 font-medium tracking-wide">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="flex justify-center mt-1">
                  <span className={`w-[46px] h-[46px] flex items-center justify-center rounded-full text-[26px] font-normal ${isToday ? "bg-google-blue text-white" : "text-google-gray-700 dark:text-gray-200"}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="mt-1 min-h-[28px] flex flex-col gap-0.5 items-center">
                  {allDay.map((ev) => (
                    <div key={ev.id}
                      onClick={() => onEventClick?.(ev, undefined, undefined)}
                      onContextMenu={(e) => { e.preventDefault(); onEventContextMenu?.(ev, e.clientX, e.clientY); }}
                      className="px-1.5 py-0.5 rounded text-[11px] truncate w-full text-center text-white cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: ev.color || ev.calendar_color || "#1a73e8" }}>
                      {ev.title}
                    </div>
                  ))}
                  {holidays.map((h) => <div key={h.id || h.name} className="text-[11px] text-google-green truncate w-full text-center">{h.name}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex overflow-auto flex-1">
        <div className="w-[72px] min-w-[72px] border-r border-google-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124]">
          {hours.map((h) => (
            <div key={h} className="border-b border-google-gray-200 dark:border-gray-700 text-right pr-3 text-[11px] text-google-gray-500 dark:text-gray-400 flex items-start justify-end" style={{ height: `${HOUR_H}px` }}>
              <span className="-mt-[6px]">{h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 relative">
          <div className="absolute inset-0 z-0"><WorkingHoursOverlay date={currentDate} viewType="week" /></div>
          {weekDays.map((day, i) => {
            const timed = eventsByDay.get(day.toDateString()) || [];
            const ph = placeholderForDay(day);
            return (
              <div key={day.toISOString()} className="relative border-r border-google-gray-200 dark:border-gray-700 last:border-r-0">
                {hours.map((h) => <TimeSlot key={`${i}-${h}`} date={day} hour={h} />)}

                {/* Current time line */}
                {now.toDateString() === day.toDateString() && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${indicatorTop}px`, transform: "translateY(-50%)" }}>
                    <div className="w-3 h-3 bg-google-red rounded-full -ml-[6px]" />
                    <div className="flex-1 h-[2px] bg-google-red" />
                  </div>
                )}

                {/* Placeholder blob */}
                {ph && (
                  <div className="absolute left-1 right-1 z-10 rounded-md px-2 py-1 text-xs text-white opacity-70 pointer-events-none"
                    style={{ top: ph.top, height: ph.height, backgroundColor: placeholder.color || "#1a73e8" }}>
                    <span className="truncate block">{placeholder.title}</span>
                  </div>
                )}

                {/* Real events */}
                <div className="absolute inset-0 pointer-events-none">
                  {timed.map((ev) => (
                    <DraggableEvent key={ev.id} event={ev}
                      onEventClick={(e) => onEventClick?.(e, undefined, undefined)}
                      onResizeEnd={handleResize}
                      onContextMenu={onEventContextMenu}
                      className="absolute px-2 py-1 rounded-md text-xs text-white truncate shadow-sm pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
                      style={evStyle(ev)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeekView;
