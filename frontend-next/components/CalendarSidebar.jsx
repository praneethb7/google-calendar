"use client";
import { useState, useRef, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import CalendarShareModal from "./CalendarShareModal";
import EventModal from "./EventModal";

function CalendarSidebar({ onCreateEvent }) {
  const {
    calendars,
    sharedCalendars,
    selectedCalendars,
    showHolidays,
    toggleShowHolidays,
    toggleCalendar,
    createCalendar,
    currentDate,
    setDate,
    fetchEvents,
    currentView,
  } = useCalendarStore();

  const { getHolidaysForDate } = useHolidayStore();

  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [shareCalendar, setShareCalendar] = useState(null);
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  const createDropdownRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        createDropdownRef.current &&
        !createDropdownRef.current.contains(e.target)
      ) {
        setShowCreateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refresh events after modal closes
  const handleEventSaved = async () => {
    const getDateRange = (date, view) => {
      const start = new Date(date);
      const end = new Date(date);

      if (view === "day") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (view === "week") {
        const day = start.getDay();
        start.setDate(start.getDate() - day);
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

  // Calendar List Handlers
  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    if (!newCalendarName.trim()) return;
    try {
      await createCalendar({
        name: newCalendarName,
        description: "",
        color: getRandomColor(),
      });
      setNewCalendarName("");
      setShowNewCalendar(false);
    } catch (error) {
      console.error("Failed to create calendar:", error);
    }
  };

  const getRandomColor = () => {
    const colors = [
      "#1a73e8",
      "#d93025",
      "#f4b400",
      "#0f9d58",
      "#ab47bc",
      "#ff6d00",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Mini Calendar Logic
  const getMiniCalendarDays = () => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date) =>
    date.toDateString() === currentDate.toDateString();
  const handlePrevMonth = () =>
    setMiniCalendarDate(
      new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() - 1)
    );
  const handleNextMonth = () =>
    setMiniCalendarDate(
      new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() + 1)
    );
  const handleDateClick = (date) => setDate(date);

  // Check if a date has holidays
  const hasHoliday = (date) => {
    if (!showHolidays) return false;
    const holidays = getHolidaysForDate(date);
    return holidays && holidays.length > 0;
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const days = getMiniCalendarDays();

  return (
    <>
      <aside className="w-[256px] min-w-[256px] border-r border-google-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] transition-colors h-full flex flex-col overflow-y-auto scrollbar-hide">
        {/* === Create Button === */}
        <div className="pl-4 pt-4 pb-2">
          <div className="relative inline-block" ref={createDropdownRef}>
            <div className="flex items-center bg-white dark:bg-[#3c4043] rounded-full shadow-google-sm hover:shadow-google-md transition-shadow h-12 border border-transparent hover:bg-google-gray-50 dark:hover:bg-[#4a4d51]">
              <button
                className="flex items-center gap-3 pl-3 pr-3 h-full rounded-l-full focus:outline-none"
                onClick={() => setShowEventModal(true)}
              >
                <svg width="32" height="32" viewBox="0 0 36 36">
                  <path fill="#34A853" d="M16 16v14h4V20z" />
                  <path fill="#4285F4" d="M30 16H20l-4 4h14z" />
                  <path fill="#FBBC04" d="M6 16v4h10l4-4z" />
                  <path fill="#EA4335" d="M20 16V6h-4v14z" />
                  <path fill="none" d="M0 0h36v36H0z" />
                </svg>
                <span className="text-sm font-medium text-google-gray-700 dark:text-gray-100">Create</span>
              </button>
              <button
                className="flex items-center justify-center px-2 h-full rounded-r-full hover:bg-google-gray-200 dark:hover:bg-[#5f6368] focus:outline-none"
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                aria-haspopup="true"
                aria-expanded={showCreateDropdown}
              >
                <span className="material-icons-outlined text-google-gray-700 dark:text-gray-300">arrow_drop_down</span>
              </button>
            </div>

            {showCreateDropdown && (
              <div className="absolute top-14 left-0 w-48 bg-white dark:bg-[#303134] rounded-lg shadow-google-md z-50 py-2 border border-google-gray-200 dark:border-gray-700 animate-fadeIn">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-google-gray-700 hover:bg-google-gray-100"
                  onClick={() => {
                    setShowEventModal(true);
                    setShowCreateDropdown(false);
                  }}
                >
                  <span className="material-icons-outlined text-[20px] text-google-gray-600">event</span>
                  <span>Event</span>
                </button>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-google-gray-700 hover:bg-google-gray-100"
                  onClick={() => {
                    setShowEventModal(true);
                    setShowCreateDropdown(false);
                  }}
                >
                  <span className="material-icons-outlined text-[20px] text-google-gray-600">task_alt</span>
                  <span>Task</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* === Mini Calendar === */}
        <div className="px-4 py-4 mb-2">
          <div className="flex justify-between items-center mb-2 pl-2">
            <span className="text-sm font-medium text-google-gray-700 dark:text-gray-100">
              {miniCalendarDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#3c4043] flex items-center justify-center text-google-gray-700 dark:text-gray-300 transition-colors"
                onClick={handlePrevMonth}
              >
                <span className="material-icons-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#3c4043] flex items-center justify-center text-google-gray-700 dark:text-gray-300 transition-colors"
                onClick={handleNextMonth}
              >
                <span className="material-icons-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-[11px] font-medium text-google-gray-500 dark:text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, index) => {
              const selected = isSelected(day.date);
              const today = isToday(day.date);
              return (
                <button
                  key={index}
                  className={`relative flex items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium focus:outline-none transition-colors
                    ${selected ? "bg-google-blue-light text-google-blue-dark dark:bg-blue-900/40 dark:text-blue-200" : 
                      today ? "bg-google-blue text-white" : "hover:bg-google-gray-100 dark:hover:bg-[#3c4043]"}
                    ${!day.isCurrentMonth && !selected && !today ? "text-google-gray-400 dark:text-gray-600" : ""}
                    ${day.isCurrentMonth && !selected && !today ? "text-google-gray-700 dark:text-gray-200" : ""}
                  `}
                  onClick={() => handleDateClick(day.date)}
                >
                  <span>{day.date.getDate()}</span>
                  {hasHoliday(day.date) && (
                    <div
                      className={`absolute bottom-[-2px] w-1 h-1 rounded-full ${today ? "bg-white" : "bg-google-red"}`}
                      title="Holiday"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* === My Calendars === */}
        <div className="px-4 py-2 mt-4">
          <div className="flex justify-between items-center mb-1 group cursor-pointer hover:bg-google-gray-50 dark:hover:bg-[#3c4043] rounded px-2 -mx-2">
            <h3 className="text-sm font-medium text-google-gray-700 dark:text-gray-100 py-1 flex-1">
              My calendars
            </h3>
            <button
              className="w-6 h-6 rounded hover:bg-google-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-google-gray-600 dark:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); setShowNewCalendar(!showNewCalendar); }}
            >
              <span className="material-icons-outlined text-[16px]">add</span>
            </button>
          </div>

          {showNewCalendar && (
            <form
              className="py-2"
              onSubmit={handleCreateCalendar}
            >
              <input
                type="text"
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                className="w-full px-2 py-1 border border-google-gray-300 rounded text-sm focus:outline-none focus:border-google-blue mb-2"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="submit" className="bg-google-blue text-white rounded px-3 py-1 text-xs font-medium hover:bg-google-blue-dark">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCalendar(false)}
                  className="bg-google-gray-100 text-google-gray-700 rounded px-3 py-1 text-xs font-medium hover:bg-google-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-[2px]">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center gap-1 rounded hover:bg-google-gray-100 dark:hover:bg-[#3c4043] transition-colors group px-2 -mx-2"
              >
                <label className="flex items-center gap-3 py-1.5 flex-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCalendars.includes(calendar.id)}
                    onChange={() => toggleCalendar(calendar.id)}
                    className="cursor-pointer w-[18px] h-[18px] rounded-sm appearance-none border-2 checked:border-0 flex items-center justify-center relative bg-white"
                    style={{
                      borderColor: calendar.color,
                      backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color : "white"
                    }}
                  />
                  <div className={`absolute w-[18px] h-[18px] pointer-events-none flex items-center justify-center left-[${/* magic alignment */'16'}px]`} style={{ display: selectedCalendars.includes(calendar.id) ? 'flex' : 'none' }}>
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-google-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis ml-[-4px]">
                    {calendar.name}
                  </span>
                </label>
                {calendar.owner_id && (
                  <button
                    className="w-6 h-6 rounded hover:bg-google-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-google-gray-600 focus:outline-none"
                    onClick={() => setShareCalendar(calendar)}
                    title="Options"
                  >
                    <span className="material-icons-outlined text-[16px]">more_vert</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* === Other Calendars === */}
        <div className="px-4 py-2 mt-2">
          <div className="flex justify-between items-center mb-1 group cursor-pointer hover:bg-google-gray-50 dark:hover:bg-[#3c4043] rounded px-2 -mx-2">
            <h3 className="text-sm font-medium text-google-gray-700 dark:text-gray-100 py-1">
              Other calendars
            </h3>
          </div>

          <div className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-1 rounded hover:bg-google-gray-100 dark:hover:bg-[#3c4043] transition-colors group px-2 -mx-2">
              <label className="flex items-center gap-3 py-1.5 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHolidays}
                  onChange={toggleShowHolidays}
                  className="cursor-pointer w-[18px] h-[18px] rounded-sm appearance-none border-2 border-google-green checked:border-0 flex items-center justify-center relative bg-white dark:bg-transparent"
                  style={{
                    backgroundColor: showHolidays ? "#188038" : "transparent"
                  }}
                />
                <div className="absolute w-[18px] h-[18px] pointer-events-none" style={{ display: showHolidays ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', left: '16px' }}>
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <span className="flex-1 text-sm text-google-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis ml-[-4px]">
                  Holidays
                </span>
              </label>
            </div>
          </div>
        </div>

        {shareCalendar && (
          <CalendarShareModal calendar={shareCalendar} onClose={() => setShareCalendar(null)} />
        )}
      </aside>

      {/* EventModal - Single unified modal */}
      {showEventModal && (
        <EventModal
          event={null}
          onClose={() => setShowEventModal(false)}
          onEventSaved={handleEventSaved}
        />
      )}
    </>
  );
}

export default CalendarSidebar;
