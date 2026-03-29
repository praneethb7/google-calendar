"use client";
// EventModal.jsx - Fixed version with proper reminder handling
import { useState, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import RecurringEventPicker from "./RecurringEventPicker";
import AttendeePicker from "./AttendeePicker";
import EventColorPicker from "./EventColorPicker";
import HolidayBadge from "./HolidayBadge";
import RecurringEditDialog from "./RecurringEditDialog";
import ReminderPicker from "./ReminderPicker";
import NotificationPopup from "./NotificationPopup";

function EventModal({ event, onClose, onEventSaved }) {
  const {
    calendars,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    currentDate,
    currentView,
  } = useCalendarStore();

  const isEditing = !!event && !event._isNew;
  const isRecurring = event?.recurrence_rule;

  const formatToDatetimeLocal = (date) => {
    if (!date) return "";
    if (!(date instanceof Date)) date = new Date(date);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const formatToDateOnly = (date) => {
    if (!date) return "";
    if (!(date instanceof Date)) date = new Date(date);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 10);
  };

  const toLocalDateTime = (utcString, isAllDay) => {
    if (!utcString) return "";
    const date = new Date(utcString);
    return isAllDay ? formatToDateOnly(date) : formatToDatetimeLocal(date);
  };

  const [formData, setFormData] = useState({
    calendarId: event?.calendar_id || calendars[0]?.id || "",
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    startTime:
      toLocalDateTime(event?.start_time, event?.is_all_day) ||
      formatToDatetimeLocal(new Date()),
    endTime: toLocalDateTime(event?.end_time, event?.is_all_day),
    isAllDay: event?.is_all_day || false,
    timezone: event?.timezone || "Asia/Kolkata",
    recurrenceRule: event?.recurrence_rule || null,
    color: event?.color || null,
  });

  // Initialize reminders properly from event data
  const [reminders, setReminders] = useState(() => {
    if (event?.reminders?.length) {
      return event.reminders.map((r) => ({
        id: r.id || `temp_${Date.now()}_${Math.random()}`,
        minutes_before: parseInt(r.minutes_before),
        method: r.method || "notification",
      }));
    }
    // Default reminder: 10 minutes before
    return [
      {
        id: `temp_${Date.now()}`,
        minutes_before: 10,
        method: "notification",
      },
    ];
  });

  const [attendees, setAttendees] = useState([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [recurringEditScope, setRecurringEditScope] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-fill endTime for new events
  useEffect(() => {
    if (!isEditing && formData.startTime && !formData.endTime) {
      const startDate = new Date(formData.startTime);
      if (formData.isAllDay) startDate.setDate(startDate.getDate() + 1);
      else startDate.setHours(startDate.getHours() + 1);
      setFormData((prev) => ({
        ...prev,
        endTime: formData.isAllDay
          ? formatToDateOnly(startDate)
          : formatToDatetimeLocal(startDate),
      }));
    }
  }, [formData.startTime, formData.isAllDay, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "isAllDay") {
      if (checked) {
        const startDate = formData.startTime
          ? formData.startTime.split("T")[0]
          : "";
        let endDate = formData.endTime ? formData.endTime.split("T")[0] : "";
        if (!endDate && startDate) {
          const next = new Date(startDate);
          next.setDate(next.getDate() + 1);
          endDate = formatToDateOnly(next);
        }
        setFormData((prev) => ({
          ...prev,
          isAllDay: true,
          startTime: startDate,
          endTime: endDate,
        }));
      } else {
        const now = new Date();
        const t = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;
        const startDt = formData.startTime ? `${formData.startTime}T${t}` : "";
        const endDt = formData.endTime ? `${formData.endTime}T${t}` : "";
        setFormData((prev) => ({
          ...prev,
          isAllDay: false,
          startTime: startDt,
          endTime: endDt,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleRecurrenceChange = (rrule) => {
    setFormData((prev) => ({ ...prev, recurrenceRule: rrule }));
    setShowRecurring(false);
  };

  const getRecurrenceText = () => {
    if (!formData.recurrenceRule) return "Does not repeat";
    const rule = formData.recurrenceRule;
    if (rule === "FREQ=DAILY;INTERVAL=1") return "Daily";
    if (rule === "FREQ=WEEKLY;INTERVAL=1") return "Weekly";
    if (rule === "FREQ=MONTHLY;INTERVAL=1") return "Monthly";
    if (rule === "FREQ=YEARLY;INTERVAL=1") return "Yearly";
    if (rule.includes("BYDAY=MO,TU,WE,TH,FR")) return "Every weekday";
    return "Custom";
  };

  const toISOString = (dateTimeStr, isAllDay) => {
    if (isAllDay) {
      const localDate = new Date(dateTimeStr + "T00:00:00");
      return localDate.toISOString();
    } else {
      const local = new Date(dateTimeStr);
      return new Date(
        local.getTime() - local.getTimezoneOffset() * 60000
      ).toISOString();
    }
  };

  const refreshEvents = async () => {
    const getDateRange = (date, view) => {
      const start = new Date(date);
      const end = new Date(date);
      if (view === "day") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (view === "week") {
        const d = start.getDay();
        start.setDate(start.getDate() - d);
        end.setDate(start.getDate() + 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (view === "month") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      } else {
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 30);
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    };
    const { start, end } = getDateRange(currentDate, currentView);
    await fetchEvents(start, end);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      alert("Please enter start and end times");
      return;
    }
    if (isEditing && isRecurring && !recurringEditScope) {
      setShowRecurringDialog(true);
      return;
    }

    setIsSubmitting(true);

    // Prepare reminders - filter out invalid ones
    const validReminders = reminders
      .filter((r) => {
        const mins = parseInt(r.minutes_before);
        return !isNaN(mins) && mins >= 0;
      })
      .map((r) => ({
        minutes_before: parseInt(r.minutes_before),
        method: r.method || "notification",
      }));

    const eventData = {
      calendarId: parseInt(formData.calendarId),
      title: formData.title,
      description: formData.description,
      location: formData.location,
      startTime: toISOString(formData.startTime, formData.isAllDay),
      endTime: toISOString(formData.endTime, formData.isAllDay),
      isAllDay: formData.isAllDay,
      timezone: formData.timezone,
      isRecurring: !!formData.recurrenceRule,
      recurrenceRule: formData.recurrenceRule,
      color: formData.color,
      reminders: validReminders,
      attendees: attendees.map((a) => a.email),
    };

    console.log("Submitting event with reminders:", validReminders);

    try {
      let eventId;
      if (isEditing) {
        const baseId = event.id.toString().split("_")[0];
        await updateEvent(baseId, eventData, recurringEditScope);
        eventId = baseId;
      } else {
        const result = await createEvent(eventData);
        eventId = result?.id || result?.data?.id;
      }

      await refreshEvents();
      onEventSaved?.();
      onClose();
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save event: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const baseId = event.id.toString().split("_")[0];
      const deleteAll =
        formData.recurrenceRule && window.confirm("Delete all occurrences?");
      await deleteEvent(baseId, deleteAll);
      await refreshEvents();
      onEventSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleRecurringDialogSelect = (scope) => {
    setRecurringEditScope(scope);
    setShowRecurringDialog(false);
    setTimeout(() => handleSubmit(), 0);
  };

  const selectedCalendar = calendars.find(
    (c) => c.id === parseInt(formData.calendarId)
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#303134] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
            <div
              className="w-4 h-4 rounded-sm mr-3"
              style={{
                backgroundColor:
                  formData.color || selectedCalendar?.color || "#1a73e8",
              }}
            />
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Add title"
              className="flex-1 text-lg font-normal text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
            />

            <button
              onClick={() => setShowNotifications((s) => !s)}
              className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/40 flex items-center justify-center mr-2"
              title="Notifications"
            >
              <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
                notifications
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              title="Close"
            >
              <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
                close
              </span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formData.startTime && <HolidayBadge date={formData.startTime} />}

            {/* Date/time */}
            <div className="flex gap-3">
              <span className="material-icons-outlined text-gray-500 mt-2">
                schedule
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type={formData.isAllDay ? "date" : "datetime-local"}
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="px-3 py-2 text-sm rounded-md border dark:border-gray-600 bg-white dark:bg-[#3c4043] text-gray-900 dark:text-gray-100 flex-1"
                  />
                  <span className="text-gray-500">–</span>
                  <input
                    type={formData.isAllDay ? "date" : "datetime-local"}
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="px-3 py-2 text-sm rounded-md border dark:border-gray-600 bg-white dark:bg-[#3c4043] text-gray-900 dark:text-gray-100 flex-1"
                  />
                </div>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="isAllDay"
                    checked={formData.isAllDay}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    All day
                  </span>
                </label>
              </div>
            </div>

            {/* Recurrence */}
            <div className="flex gap-3">
              <span className="material-icons-outlined text-gray-500 mt-2">
                repeat
              </span>
              <div className="flex-1">
                <button
                  onClick={() => setShowRecurring((s) => !s)}
                  className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                >
                  {getRecurrenceText()}
                  <span className="material-icons-outlined text-sm">
                    {showRecurring ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {showRecurring && (
                  <div className="mt-2">
                    <RecurringEventPicker
                      value={formData.recurrenceRule}
                      onChange={handleRecurrenceChange}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Reminders - ALWAYS VISIBLE */}
            <div className="flex gap-3">
              <span className="material-icons-outlined text-gray-500 mt-2">
                notifications
              </span>
              <div className="flex-1">
                <ReminderPicker reminders={reminders} onChange={setReminders} />
              </div>
            </div>

            {/* More options button */}
            <button
              onClick={() => setShowMoreOptions((s) => !s)}
              className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
            >
              <span className="material-icons-outlined text-sm">
                {showMoreOptions ? "expand_less" : "expand_more"}
              </span>
              {showMoreOptions ? "Less options" : "More options"}
            </button>

            {showMoreOptions && (
              <>
                <div className="flex gap-3 items-center">
                  <span className="material-icons-outlined text-gray-500">
                    calendar_today
                  </span>
                  <select
                    name="calendarId"
                    value={formData.calendarId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 rounded-md border dark:border-gray-600 bg-white dark:bg-[#3c4043] text-gray-900 dark:text-gray-100"
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-icons-outlined text-gray-500 mt-2">
                    palette
                  </span>
                  <EventColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData((p) => ({ ...p, color }))}
                  />
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-icons-outlined text-gray-500 mt-2">
                    people
                  </span>
                  <div className="flex-1">
                    <AttendeePicker
                      eventId={
                        event?.id ? event.id.toString().split("_")[0] : null
                      }
                      canEdit
                      onChange={setAttendees}
                    />
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-icons-outlined text-gray-500 mt-2">
                    subject
                  </span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add description"
                    className="flex-1 px-3 py-2 text-sm rounded-md border dark:border-gray-600 bg-white dark:bg-[#3c4043] text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>

                <div className="flex gap-3 items-start">
                  <span className="material-icons-outlined text-gray-500 mt-2">
                    location_on
                  </span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Add location"
                    className="flex-1 px-3 py-2 text-sm rounded-md border dark:border-gray-600 bg-white dark:bg-[#3c4043] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#292a2d]">
            <div>
              {isEditing && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRecurringDialog && (
        <RecurringEditDialog
          isOpen
          onClose={() => setShowRecurringDialog(false)}
          onSelect={handleRecurringDialogSelect}
          eventTitle={formData.title}
        />
      )}

      {showNotifications && (
        <NotificationPopup
          onClose={() => setShowNotifications(false)}
          eventId={event?.id ? event.id.toString().split("_")[0] : null}
        />
      )}
    </>
  );
}

export default EventModal;
