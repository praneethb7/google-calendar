"use client";
import { useEffect, useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import { DraggableEvent, ItemTypes } from "../DraggableEvent";

const HOUR_H = 46;
const RAIL_W = 9;
const BAND_H = 18;
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
      backgroundColor: ev.color || ev.calendar_color || "#1a73e8",
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#131314] overflow-hidden rounded-[28px]">
      {/* Header — weekday name + date number (left-aligned with the day column) */}
      <div className="flex sticky top-0 z-20 bg-white dark:bg-[#131314]">
        <div className="w-[80px] min-w-[80px]" />
        <div className="flex-1 pt-2 pb-1 pl-1">
          <div className={`text-[11px] uppercase font-medium tracking-[0.8px] ${isTodayDate() ? "text-google-blue dark:text-[#a8c7fa]" : "text-google-gray-500 dark:text-[#c4c7c5]"}`}>
            {currentDate.toLocaleDateString("en-US", { weekday: "short" })}
          </div>
          <div className="flex mt-1">
            <span className={`w-[46px] h-[46px] flex items-center justify-center rounded-full text-[26px] font-normal ${isTodayDate() ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : "text-google-gray-700 dark:text-[#e3e3e3]"}`}>
              {currentDate.getDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex overflow-auto flex-1">
        {/* Time gutter: all-day band cell (with GMT) above the hour labels */}
        <div className="w-[71px] min-w-[71px] bg-white dark:bg-[#131314]">
          <div className="flex items-start justify-end pr-0.5 pt-1" style={{ minHeight: `${BAND_H}px` }}>
            <span className="text-[11px] text-google-gray-500 dark:text-[#c4c7c5] font-medium tracking-[0.1px] whitespace-nowrap">{tz}</span>
          </div>
          {hours.map((h) => (
            <div key={h} className="text-right pr-2 text-[11px] font-medium tracking-[0.1px] text-google-gray-500 dark:text-[#c4c7c5] flex items-start justify-end" style={{ height: `${HOUR_H}px` }}>
              <span className="-mt-[6px]">{h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</span>
            </div>
          ))}
        </div>

        {/* Day area — horizontal lines (incl. left nub) are full-width single
            elements; the single day column is offset by RAIL_W. */}
        <div className="flex-1 flex flex-col">
          {/* All-day band */}
          <div className="relative" style={{ minHeight: `${BAND_H}px` }}>
            <div className="absolute left-0 right-0 bottom-0 border-b border-google-gray-200 dark:border-[#333537]" />
            <div className="h-full border-l border-google-gray-200 dark:border-[#333537] px-1 py-0.5 flex flex-col gap-0.5" style={{ marginLeft: `${RAIL_W}px` }}>
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
            </div>
          </div>

          {/* Hours */}
          <div className="relative">
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
