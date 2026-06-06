"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

const fmt12 = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, "").toLowerCase();
const fmtTimeNoMeridiem = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[ap]m/i, "");
const fmtDateLong = (d) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

function HeaderButton({ icon, label, onClick, size = 40 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex items-center justify-center rounded-full text-[#c4c7c5] hover:bg-white/[0.08] transition-colors"
      style={{ width: size, height: size }}
    >
      <span className="material-icons-outlined text-[20px]">{icon}</span>
    </button>
  );
}

function EventDetailsPopover({ event, x, y, onClose, onEdit }) {
  const { calendars, deleteEvent, fetchEvents } = useCalendarStore();
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });

  // Close on outside click / escape
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Clamp within viewport
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const m = 12;
    let left = x;
    let top = y;
    if (left + w + m > window.innerWidth) left = window.innerWidth - w - m;
    if (top + h + m > window.innerHeight) top = window.innerHeight - h - m;
    setPos({ left: Math.max(m, left), top: Math.max(m, top), ready: true });
  }, [x, y]);

  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const color = event.color || event.calendar_color || "#4b99d2";
  const calendarName =
    calendars.find((c) => c.id === event.calendar_id)?.name || calendars[0]?.name || "My Calendar";

  const timeText = event.is_all_day
    ? "All day"
    : `${fmtTimeNoMeridiem(start)} – ${fmt12(end)}`;

  const reminderMinutes =
    Array.isArray(event.reminders) && event.reminders.length
      ? event.reminders[0].minutes ?? event.reminders[0]
      : 10;

  const handleDelete = async () => {
    if (event.recurrence_rule && !window.confirm("Delete this recurring event?")) {
      // still allow simple delete
    }
    await deleteEvent(event.id);
    await fetchEvents?.();
    onClose();
  };

  const Row = ({ icon, children, iconColor }) => (
    <div className="flex">
      <div className="flex w-[68px] shrink-0 justify-center pl-[28px]">
        <span className={`material-icons-outlined text-[20px] ${iconColor || "text-[#c4c7c5]"}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0 pr-4">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        ref={ref}
        className="fixed w-[496px] max-w-[calc(100vw-24px)] rounded-[28px] bg-[#1e1f20] text-[#e3e3e3] shadow-[0_3px_4px_rgba(0,0,0,0.14),0_3px_3px_-2px_rgba(0,0,0,0.12),0_1px_8px_rgba(0,0,0,0.2)] overflow-hidden"
        style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden", fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
      >
        {/* Header actions */}
        <div className="flex flex-row-reverse items-center px-3 pt-3 pb-1">
          <HeaderButton icon="close" label="Close" onClick={onClose} />
          <div className="flex items-center mr-auto">
            <HeaderButton icon="edit" label="Edit event" onClick={() => onEdit(event)} />
            <HeaderButton icon="delete" label="Delete event" onClick={handleDelete} />
            <HeaderButton icon="mail" label="Email guests" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(event.title || "Event")}`; }} />
            <HeaderButton icon="more_vert" label="Options" size={32} onClick={() => {}} />
          </div>
        </div>

        {/* Body */}
        <div className="pb-4">
          {/* Title + date/time */}
          <div className="flex pr-4 mb-3">
            <div className="flex w-[68px] shrink-0 items-start justify-center pl-[28px] pt-1.5">
              <span className="mt-[3px] h-[14px] w-[14px] rounded-[4px]" style={{ backgroundColor: color }} />
            </div>
            <div className="flex-1 min-w-0 py-1.5">
              <div className="text-[22px] leading-7 break-words" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
                {event.title || "(No title)"}
              </div>
              <div className="mt-[3px] text-[14px] leading-[18px] text-[#e3e3e3]">
                {fmtDateLong(start)}
                <span className="mx-2 font-bold">⋅</span>
                <span>{timeText}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description ? (
            <Row icon="description">
              <div className="py-1.5 text-[14px] leading-5 text-[#e3e3e3] whitespace-pre-wrap break-words">{event.description}</div>
            </Row>
          ) : (
            <Row icon="description">
              <div className="py-1.5">
                <a href="https://doc.new" target="_blank" rel="noreferrer" className="text-[14px] leading-5 font-medium text-[#a8c7fa] hover:underline cursor-pointer">Take meeting notes</a>
                <div className="text-[12px] leading-[18px] text-[#c4c7c5]">Start a new document to capture notes</div>
              </div>
            </Row>
          )}

          {/* Location */}
          {event.location && (
            <Row icon="location_on">
              <div className="py-1.5 text-[14px] leading-5 text-[#e3e3e3] break-words">{event.location}</div>
            </Row>
          )}

          {/* Meet link */}
          {event.meet_link && (
            <Row icon="videocam" iconColor="text-[#e8a33d]">
              <div className="py-1.5">
                <a href={`https://${event.meet_link}`} target="_blank" rel="noreferrer" className="text-[14px] leading-5 font-medium text-[#a8c7fa] hover:underline">Join with Google Meet</a>
                <div className="text-[12px] leading-[18px] text-[#c4c7c5]">{event.meet_link}</div>
              </div>
            </Row>
          )}

          {/* Reminder */}
          <Row icon="notifications">
            <div className="py-1.5 text-[14px] leading-5 text-[#e3e3e3]">{reminderMinutes} minutes before</div>
          </Row>

          {/* Calendar / owner */}
          <Row icon="event">
            <div className="py-1.5 text-[14px] leading-5 text-[#e3e3e3]">{calendarName}</div>
          </Row>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPopover;
