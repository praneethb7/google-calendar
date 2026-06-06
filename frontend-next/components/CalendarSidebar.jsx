"use client";
import { useState, useRef, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import CalendarShareModal from "./CalendarShareModal";
import EventModal from "./EventModal";

function CalendarSidebar({ onCreateEvent, collapsed = false }) {
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

  // "Meet with…" people search
  const [peopleQuery, setPeopleQuery] = useState("");
  const [showPeopleResults, setShowPeopleResults] = useState(false);
  const [meetingWith, setMeetingWith] = useState([]);
  const [recentPeople, setRecentPeople] = useState([]);

  const createDropdownRef = useRef();
  const peopleSearchRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        createDropdownRef.current &&
        !createDropdownRef.current.contains(e.target)
      ) {
        setShowCreateDropdown(false);
      }
      if (
        peopleSearchRef.current &&
        !peopleSearchRef.current.contains(e.target)
      ) {
        setShowPeopleResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load previously-met people from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meetWithPeople") || "[]");
      if (Array.isArray(saved)) setRecentPeople(saved);
    } catch {
      // ignore malformed storage
    }
  }, []);

  // "Meet with…" helpers
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const personName = (email) => {
    const local = email.split("@")[0];
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  };

  const personColor = (email) => {
    const palette = ["#1a73e8", "#d93025", "#f4b400", "#0f9d58", "#ab47bc", "#ff6d00"];
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };

  const q = peopleQuery.trim().toLowerCase();
  const peopleSuggestions = recentPeople.filter(
    (p) =>
      !meetingWith.some((m) => m.email === p.email) &&
      (p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
  );

  const addPerson = (person) => {
    if (meetingWith.some((m) => m.email === person.email)) return;
    setMeetingWith((prev) => [...prev, person]);
    setRecentPeople((prev) => {
      const next = [person, ...prev.filter((p) => p.email !== person.email)].slice(0, 20);
      try {
        localStorage.setItem("meetWithPeople", JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
    setPeopleQuery("");
    setShowPeopleResults(false);
  };

  const removePerson = (email) =>
    setMeetingWith((prev) => prev.filter((p) => p.email !== email));

  const handlePeopleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (peopleSuggestions.length > 0) {
        addPerson(peopleSuggestions[0]);
      } else if (isValidEmail(peopleQuery.trim())) {
        const email = peopleQuery.trim();
        addPerson({ email, name: personName(email) });
      }
    } else if (e.key === "Escape") {
      setShowPeopleResults(false);
    }
  };

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
      {/* Collapsed "+" Create FAB — floats over the grid, fades in when the
          sidebar is collapsed. Rendered as a sibling of <aside> so it isn't
          clipped when the aside animates to zero width. */}
      <div
        className={`absolute left-4 top-3 z-30 transition-opacity duration-300 ${
          collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative inline-block">
          <button
            className="flex items-center justify-center w-14 h-14 bg-white dark:bg-[#37393b] rounded-2xl shadow-google-md hover:shadow-google-lg transition-shadow hover:bg-google-gray-50 dark:hover:bg-[#444746] focus:outline-none"
            onClick={() => setShowEventModal(true)}
            tabIndex={collapsed ? 0 : -1}
            title="Create"
            aria-label="Create"
          >
            <span className="material-icons-outlined text-[24px] text-google-gray-700 dark:text-[#e3e3e3]">add</span>
          </button>
        </div>
      </div>

      <aside
        className={`w-[250px] min-w-[250px] ${
          collapsed ? "ml-[-250px]" : "ml-0"
        } border-r border-google-gray-200 dark:border-transparent bg-white dark:bg-[#1b1b1b] transition-[margin] duration-300 ease-in-out h-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide`}
      >
        {/* === Create Button === */}
        <div className="pl-4 pt-4 pb-3">
          <div className="relative inline-block" ref={createDropdownRef}>
            <div className="flex items-center w-[140px] h-14 bg-white dark:bg-[#37393b] rounded-2xl shadow-google-sm hover:shadow-google-md transition-shadow border border-transparent hover:bg-google-gray-50 dark:hover:bg-[#444746]">
              <button
                className="flex items-center gap-3 pl-4 pr-1 h-full flex-1 rounded-l-2xl focus:outline-none"
                onClick={() => setShowEventModal(true)}
              >
                <span className="material-icons-outlined text-[24px] text-google-gray-700 dark:text-[#e3e3e3]">add</span>
                <span className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3]">Create</span>
              </button>
              <button
                className="flex items-center justify-center pr-3 h-full rounded-r-2xl focus:outline-none"
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                aria-haspopup="true"
                aria-expanded={showCreateDropdown}
              >
                <span className="material-icons-outlined text-[20px] text-google-gray-700 dark:text-[#c4c7c5]">arrow_drop_down</span>
              </button>
            </div>

            {showCreateDropdown && (
              <div className="absolute top-[72px] left-0 w-48 bg-white dark:bg-[#2d2e2f] rounded-lg shadow-google-md z-50 py-2 border border-google-gray-200 dark:border-[#444746] animate-fadeIn">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-[#37393b]"
                  onClick={() => {
                    setShowEventModal(true);
                    setShowCreateDropdown(false);
                  }}
                >
                  <span className="material-icons-outlined text-[20px] text-google-gray-600 dark:text-[#c4c7c5]">event</span>
                  <span>Event</span>
                </button>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-[#37393b]"
                  onClick={() => {
                    setShowEventModal(true);
                    setShowCreateDropdown(false);
                  }}
                >
                  <span className="material-icons-outlined text-[20px] text-google-gray-600 dark:text-[#c4c7c5]">task_alt</span>
                  <span>Task</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* === Mini Calendar === */}
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-google-gray-800 dark:text-[#e3e3e3]">
              {miniCalendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] focus:outline-none"
              >
                <span className="material-icons-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] focus:outline-none"
              >
                <span className="material-icons-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-[10px] font-medium text-google-gray-500 dark:text-[#c4c7c5] py-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const selected = isSelected(day.date);
              const today = isToday(day.date);
              const hi = selected || today;
              return (
                <button
                  key={index}
                  className={`relative flex items-center justify-center w-6 h-6 mx-auto my-[1px] rounded-full text-[10px] font-medium focus:outline-none transition-colors
                    ${hi ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : "hover:bg-google-gray-100 dark:hover:bg-[#37393b]"}
                    ${!day.isCurrentMonth && !hi ? "text-google-gray-400 dark:text-[#9aa0a6]" : ""}
                    ${day.isCurrentMonth && !hi ? "text-google-gray-700 dark:text-[#e3e3e3]" : ""}
                  `}
                  onClick={() => handleDateClick(day.date)}
                >
                  <span>{day.date.getDate()}</span>
                  {hasHoliday(day.date) && (
                    <div
                      className={`absolute bottom-[-1px] w-1 h-1 rounded-full ${hi ? "bg-white dark:bg-[#062e6f]" : "bg-google-red"}`}
                      title="Holiday"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* === Meet with… === */}
        <div className="px-4 pt-1 pb-2">
          <h3 className="text-sm font-medium text-google-gray-800 dark:text-[#e3e3e3] mb-2">Meet with…</h3>
          <div className="relative" ref={peopleSearchRef}>
            <div className="flex items-center gap-3 h-12 rounded-lg bg-google-gray-100 dark:bg-[#37393b] px-3">
              <span className="material-icons-outlined text-[20px] text-google-gray-600 dark:text-[#c4c7c5]">group</span>
              <input
                value={peopleQuery}
                onChange={(e) => {
                  setPeopleQuery(e.target.value);
                  setShowPeopleResults(true);
                }}
                onFocus={() => setShowPeopleResults(true)}
                onKeyDown={handlePeopleKeyDown}
                placeholder="Search for people"
                aria-label="Search for people to meet"
                className="flex-1 min-w-0 bg-transparent text-sm text-google-gray-700 dark:text-[#e3e3e3] placeholder:text-google-gray-500 dark:placeholder:text-[#9aa0a6] outline-none"
              />
            </div>

            {/* Results dropdown */}
            {showPeopleResults && (peopleSuggestions.length > 0 || isValidEmail(peopleQuery.trim())) && (
              <div className="absolute left-0 right-0 top-[52px] z-50 bg-white dark:bg-[#2d2e2f] rounded-lg shadow-google-md border border-google-gray-200 dark:border-[#444746] py-1 max-h-64 overflow-y-auto animate-fadeIn">
                {peopleSuggestions.map((person) => (
                  <button
                    key={person.email}
                    type="button"
                    onClick={() => addPerson(person)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-google-gray-100 dark:hover:bg-[#37393b]"
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: personColor(person.email) }}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-google-gray-700 dark:text-[#e3e3e3] truncate">{person.name}</span>
                      <span className="block text-xs text-google-gray-500 dark:text-[#9aa0a6] truncate">{person.email}</span>
                    </span>
                  </button>
                ))}
                {isValidEmail(peopleQuery.trim()) &&
                  !peopleSuggestions.some((p) => p.email === peopleQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() =>
                        addPerson({ email: peopleQuery.trim(), name: personName(peopleQuery.trim()) })
                      }
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-google-gray-100 dark:hover:bg-[#37393b]"
                    >
                      <span className="material-icons-outlined text-[20px] text-google-gray-600 dark:text-[#c4c7c5] w-7 text-center shrink-0">person_add</span>
                      <span className="text-sm text-google-gray-700 dark:text-[#e3e3e3] truncate">
                        Add &ldquo;{peopleQuery.trim()}&rdquo;
                      </span>
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Selected people chips */}
          {meetingWith.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {meetingWith.map((person) => (
                <span
                  key={person.email}
                  className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full bg-google-gray-100 dark:bg-[#37393b] text-xs text-google-gray-700 dark:text-[#e3e3e3] max-w-full"
                  title={person.email}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: personColor(person.email) }}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{person.name}</span>
                  <button
                    type="button"
                    onClick={() => removePerson(person.email)}
                    className="material-icons-outlined text-[14px] text-google-gray-500 dark:text-[#9aa0a6] hover:text-google-gray-700 dark:hover:text-[#e3e3e3] shrink-0"
                    aria-label={`Remove ${person.name}`}
                  >
                    close
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* === Booking pages === */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-google-gray-800 dark:text-[#e3e3e3]">Booking pages</h3>
            <button className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-700 dark:text-[#c4c7c5]">
              <span className="material-icons-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>

        {/* === Time Insights === */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-google-gray-800 dark:text-[#e3e3e3]">Time Insights</h3>
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-[20px] text-google-gray-600 dark:text-[#c4c7c5]">insights</span>
              <button className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-700 dark:text-[#c4c7c5]">
                <span className="material-icons-outlined text-[20px]">expand_more</span>
              </button>
            </div>
          </div>
        </div>

        {/* === My Calendars === */}
        <div className="px-4 py-2 mt-2">
          <div className="flex justify-between items-center mb-1 group">
            <h3 className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] py-1 flex-1">
              My calendars
            </h3>
            <button
              className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowNewCalendar(!showNewCalendar); }}
            >
              <span className="material-icons-outlined text-[20px]">expand_less</span>
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
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] py-1 flex-1">
              Other calendars
            </h3>
            <div className="flex items-center -space-x-1">
              <button className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5]">
                <span className="material-icons-outlined text-[20px]">add</span>
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5]">
                <span className="material-icons-outlined text-[20px]">expand_less</span>
              </button>
            </div>
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
