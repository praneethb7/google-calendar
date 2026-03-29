"use client";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

/**
 * EventPopup - Google Calendar-style quick event view popup
 * Shows event details in a small popup when clicking an event
 */
function EventPopup({ event, position, onClose, onEdit, onDelete }) {
  const popupRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!event) return null;

  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);

  const formatEventTime = () => {
    if (event.is_all_day) {
      return format(startTime, "EEEE, MMMM d");
    }

    const sameDay =
      format(startTime, "yyyy-MM-dd") === format(endTime, "yyyy-MM-dd");

    if (sameDay) {
      return `${format(startTime, "EEEE, MMMM d")} ⋅ ${format(
        startTime,
        "h:mm a"
      )} – ${format(endTime, "h:mm a")}`;
    }

    return `${format(startTime, "EEE, MMM d, h:mm a")} – ${format(
      endTime,
      "EEE, MMM d, h:mm a"
    )}`;
  };

  // Calculate popup position (try to keep it on screen)
  const popupStyle = {
    position: "fixed",
    left: `${Math.min(position.x, window.innerWidth - 320)}px`,
    top: `${Math.min(position.y, window.innerHeight - 400)}px`,
    zIndex: 1000,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[999]" onClick={onClose} />

      {/* Popup */}
      <div
        ref={popupRef}
        style={popupStyle}
        className="bg-white rounded-lg shadow-2xl border border-google-gray-200 w-[320px] overflow-hidden animate-fadeIn"
      >
        {/* Header with color bar */}
        <div
          className="h-2"
          style={{
            backgroundColor: event.color || event.calendar_color || "#1a73e8",
          }}
        />

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-medium text-google-gray-900 mb-3 pr-8">
            {event.title}
          </h3>

          {/* Time */}
          <div className="flex items-start gap-3 mb-3">
            <span className="material-icons-outlined text-google-gray-600 text-[20px] mt-0.5">
              schedule
            </span>
            <div className="flex-1">
              <div className="text-sm text-google-gray-700">
                {formatEventTime()}
              </div>
              {event.timezone && !event.is_all_day && (
                <div className="text-xs text-google-gray-600 mt-0.5">
                  {event.timezone}
                </div>
              )}
              {event.is_recurring && (
                <div className="flex items-center gap-1 text-xs text-google-gray-600 mt-1">
                  <span className="material-icons-outlined text-[14px]">
                    repeat
                  </span>
                  <span>Recurring event</span>
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="material-icons-outlined text-google-gray-600 text-[20px]">
              calendar_today
            </span>
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: event.calendar_color || "#1a73e8" }}
              />
              <span className="text-sm text-google-gray-700">
                {event.calendar_name || "Calendar"}
              </span>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 mb-3">
              <span className="material-icons-outlined text-google-gray-600 text-[20px]">
                location_on
              </span>
              <div className="flex-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    event.location
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-google-blue-600 hover:underline"
                >
                  {event.location}
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3 mb-3">
              <span className="material-icons-outlined text-google-gray-600 text-[20px]">
                subject
              </span>
              <div className="flex-1 text-sm text-google-gray-700 whitespace-pre-wrap max-h-[100px] overflow-y-auto scrollbar-thin">
                {event.description}
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendee_count > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <span className="material-icons-outlined text-google-gray-600 text-[20px]">
                people
              </span>
              <span className="text-sm text-google-gray-700">
                {event.attendee_count}{" "}
                {event.attendee_count === 1 ? "guest" : "guests"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-google-gray-200 bg-google-gray-50">
          <button
            onClick={onDelete}
            className="btn-icon w-8 h-8"
            title="Delete event"
          >
            <span className="material-icons-outlined text-google-gray-600 text-[20px]">
              delete
            </span>
          </button>

          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-4 py-1.5 bg-google-blue-600 text-white rounded hover:bg-google-blue-700 transition-colors text-sm font-medium"
          >
            <span className="material-icons-outlined text-[18px]">edit</span>
            Edit
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 btn-icon w-8 h-8 bg-white"
        >
          <span className="material-icons-outlined text-google-gray-600 text-[20px]">
            close
          </span>
        </button>
      </div>
    </>
  );
}

export default EventPopup;
