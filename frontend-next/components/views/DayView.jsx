"use client";
import { useEffect, useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import { DraggableEvent, ItemTypes } from "../DraggableEvent";

const HOUR_H = 64;
const toLocalISO = (d) => {
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
};

function DayView({ onEventClick, onEventContextMenu, onGridClick, placeholder }) {
  const { currentDate, events, updateEvent, showHolidays, fetchEvents, selectedCalendars } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();

  const dayEvents = events.filter((e) => new Date(e.start_time).toDateString() === currentDate.toDateString());
  const dayHolidays = showHolidays ? getHolidaysForDate(currentDate) : [];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(iv); }, []);

  const isTodayDate = () => currentDate.toDateString() === now.toDateString();
  const indicatorTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_H;

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

  // Placeholder for this day
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
        className={`relative border-b border-google-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
        style={{ height: `${HOUR_H}px` }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#202124] overflow-hidden rounded-lg">
      {/* Header */}
      <div className="border-b border-google-gray-200 dark:border-gray-700 py-3 px-6 sticky top-0 z-10 bg-white dark:bg-[#202124]">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[11px] uppercase text-google-gray-500 dark:text-gray-400 font-medium tracking-wide">
              {currentDate.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div className={`w-[46px] h-[46px] flex items-center justify-center rounded-full text-[26px] font-normal mx-auto mt-1 ${isTodayDate() ? "bg-google-blue text-white" : "text-google-gray-700 dark:text-gray-200"}`}>
              {currentDate.getDate()}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-google-gray-700 dark:text-gray-200">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            {isTodayDate() && <span className="text-xs text-google-blue font-medium">Today</span>}
          </div>
        </div>
        {dayHolidays.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {dayHolidays.map((h) => (
              <div key={h.id} className="px-2 py-0.5 rounded text-xs font-medium bg-google-green-light text-google-green truncate w-fit">{h.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative">
          <div className="w-[72px] min-w-[72px] border-r border-google-gray-200 dark:border-gray-700">
            {hours.map((h) => (
              <div key={h} className="border-b border-google-gray-200 dark:border-gray-700 text-right pr-3 text-[11px] text-google-gray-500 dark:text-gray-400 flex items-start justify-end" style={{ height: `${HOUR_H}px` }}>
                <span className="-mt-[6px]">{h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 relative">
            {isTodayDate() && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${indicatorTop}px`, transform: "translateY(-50%)" }}>
                <div className="w-3 h-3 bg-google-red rounded-full -ml-[6px]" /><div className="flex-1 h-[2px] bg-google-red" />
              </div>
            )}
            {hours.map((h) => <TimeSlot key={h} hour={h} />)}

            {/* Placeholder blob */}
            {ph && (
              <div className="absolute left-1 right-1 z-10 rounded-md px-2 py-1 text-xs text-white opacity-70 pointer-events-none"
                style={{ top: ph.top, height: ph.height, backgroundColor: placeholder?.color || "#1a73e8" }}>
                <span className="truncate block">{placeholder?.title}</span>
              </div>
            )}

            {/* Events */}
            <div className="absolute inset-0 pointer-events-none">
              {dayEvents.filter((e) => !e.is_all_day).map((ev) => (
                <DraggableEvent key={ev.id} event={ev}
                  onEventClick={(e) => onEventClick?.(e, undefined, undefined)}
                  onResizeEnd={handleResize}
                  onContextMenu={onEventContextMenu}
                  className="event-bubble absolute px-2 py-1 rounded-md text-xs text-white truncate shadow-sm pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
                  style={evStyle(ev)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayView;
