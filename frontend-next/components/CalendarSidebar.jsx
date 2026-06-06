"use client";
import { useState, useRef, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";
import CalendarShareModal from "./CalendarShareModal";
import InsightsModal, { computeWeekInsights } from "./InsightsModal";

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
    events,
  } = useCalendarStore();

  const { getHolidaysForDate } = useHolidayStore();

  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [shareCalendar, setShareCalendar] = useState(null);
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  // Collapsible section state (reference shows all expanded — keyboard_arrow_up)
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  // Booking pages is a placeholder for now — no live data.
  const [showInsights, setShowInsights] = useState(false);

  // Real meeting time for the current week — drives the sidebar summary.
  const weekMeetingMinutes = computeWeekInsights(events, currentDate).totalMinutes;
  const weekMeetingLabel =
    weekMeetingMinutes === 0
      ? "0 hr in meetings"
      : weekMeetingMinutes < 60
      ? `${weekMeetingMinutes} min in meetings`
      : `${(weekMeetingMinutes / 60).toFixed(weekMeetingMinutes % 60 === 0 ? 0 : 1)} hr in meetings`;
  const [myCalExpanded, setMyCalExpanded] = useState(true);
  const [otherCalExpanded, setOtherCalExpanded] = useState(true);

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

  // Time Insights date range — current week (ref ".s74": "Jun 7 – 10, 2026")
  const insightsRange = (() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const month = (d) => d.toLocaleString("default", { month: "short" });
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${month(start)} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
      : `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${end.getFullYear()}`;
  })();

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
            onClick={() => onCreateEvent?.()}
            tabIndex={collapsed ? 0 : -1}
            title="Create"
            aria-label="Create"
          >
            <span className="material-icons-outlined text-[24px] text-google-gray-700 dark:text-[#e3e3e3]">add</span>
          </button>
        </div>
      </div>

      <aside
        className={`w-[256px] min-w-[256px] ${
          collapsed ? "ml-[-256px]" : "ml-0"
        } border-r border-google-gray-200 dark:border-transparent bg-white dark:bg-[#1b1b1b] transition-[margin] duration-300 ease-in-out h-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide`}
      >
        {/* === Create Button === */}
        {/* ref calendar-sidebar.html — 136px pill, Material elevation-1 shadow */}
        <div className="pl-4 pt-4 pb-3">
          <div className="relative inline-block" ref={createDropdownRef}>
            <div
              className="group flex items-center w-[136px] h-14 bg-white dark:bg-[#37393b] rounded-2xl border border-transparent transition-shadow hover:bg-google-gray-50 dark:hover:bg-[#444746]"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)" }}
            >
              <button
                className="flex items-center gap-3 pl-4 pr-1 h-full flex-1 rounded-l-2xl focus:outline-none"
                onClick={() => onCreateEvent?.()}
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
              /* ref calendar-sidebar dropdown — 176px, text-only rows, #1e1f20 */
              <div
                className="absolute top-[64px] left-0 w-44 bg-white dark:bg-[#1e1f20] rounded z-50 py-2 border border-google-gray-200 dark:border-transparent animate-fadeIn"
                style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)" }}
              >
                {["Event", "Task", "Out of office", "Focus time", "Working location", "Appointment schedule"].map((label) => (
                  <button
                    key={label}
                    className="flex items-center w-full px-4 py-2 min-h-10 rounded-lg text-sm whitespace-nowrap text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-[#37393b]"
                    onClick={() => {
                      onCreateEvent?.();
                      setShowCreateDropdown(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === Mini Calendar === */}
        {/* ref .s6 — padding: 6px 14px 16px 19px; nudged down + scaled 0.96 */}
        <div className="pt-3 pr-[14px] pb-4 pl-[19px] select-none origin-top scale-[0.96]">
          {/* ref .s7 — header row */}
          <div className="flex items-center mr-[3px] ml-1 mb-[2px]">
            {/* ref .s8 — month label */}
            <span className="flex-1 pl-[5px] text-google-gray-800 dark:text-[#e3e3e3] font-medium leading-5 [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
              {miniCalendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            {/* ref .s9 — nav arrows */}
            <div className="flex items-center">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-6 h-6 mr-[6px] rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] focus:outline-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"></path></svg>
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-6 h-6 rounded-full hover:bg-google-gray-100 dark:hover:bg-[#37393b] flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] focus:outline-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"></path></svg>
              </button>
            </div>
          </div>
          {/* ref .s19 — weekday header (10px / 500 / #c4c7c5) */}
          <div className="grid grid-cols-7 text-center">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-[10px] font-medium text-google-gray-500 dark:text-[#c4c7c5] leading-[28px]"
              >
                {day}
              </div>
            ))}
          </div>
          {/* ref .s23 — day grid (24px circles, 10px / 500 numbers) */}
          <div className="grid grid-cols-7 text-center">
            {days.map((day, index) => {
              const today = isToday(day.date);
              const selected = isSelected(day.date) && !today;
              return (
                <div key={index} className="flex items-center justify-center h-7">
                  <button
                    className={`relative flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium focus:outline-none transition-colors
                      ${today ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : ""}
                      ${selected ? "bg-google-blue/20 text-google-blue dark:bg-[#004a77] dark:text-[#c2e7ff]" : ""}
                      ${!today && !selected ? "hover:bg-google-gray-100 dark:hover:bg-[#37393b]" : ""}
                      ${!today && !selected && day.isCurrentMonth ? "text-google-gray-700 dark:text-[#e3e3e3]" : ""}
                      ${!today && !selected && !day.isCurrentMonth ? "text-google-gray-400 dark:text-[#c4c7c5]" : ""}
                    `}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <span>{day.date.getDate()}</span>
                    {hasHoliday(day.date) && (
                      <div
                        className={`absolute bottom-[-1px] w-1 h-1 rounded-full ${today || selected ? "bg-white dark:bg-current" : "bg-google-red"}`}
                        title="Holiday"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Meet with… === */}
        {/* ref .s32 — heading ml 28, box ml 28 / mr 20 */}
        <div className="mt-2 mb-2">
          {/* ref .s33 — heading */}
          <h3 className="mt-2 mr-5 ml-7 text-google-gray-800 dark:text-[#e3e3e3] font-medium leading-5 [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
            Meet with…
          </h3>
          <div className="relative mt-2 mr-5 ml-7" ref={peopleSearchRef}>
            {/* ref .s39 — search field (#282a2c, radius 4, h 40) */}
            <div className="flex items-center h-10 px-4 rounded bg-google-gray-100 dark:bg-[#282a2c] overflow-hidden">
              {/* ref .s44 — group icon at left 16, gap 12 */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="shrink-0 mr-3 fill-google-gray-600 dark:fill-[#c4c7c5] pointer-events-none"
              >
                <path d="M15 8c0-1.42-.5-2.73-1.33-3.76.42-.14.86-.24 1.33-.24 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.43 0-.84-.09-1.23-.21-.03-.01-.06-.02-.1-.03A5.98 5.98 0 0 0 15 8zm1.66 5.13C18.03 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.58-3.47-6.34-3.87zM9 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 9c-2.7 0-5.8 1.29-6 2.01V18h12v-1c-.2-.71-3.3-2-6-2M9 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 9c2.67 0 8 1.34 8 4v3H1v-3c0-2.66 5.33-4 8-4z"></path>
              </svg>
              {/* ref .s41 — input / placeholder "Search for people" #c4c7c5 */}
              <input
                value={peopleQuery}
                onChange={(e) => {
                  setPeopleQuery(e.target.value);
                  setShowPeopleResults(true);
                }}
                onFocus={() => setShowPeopleResults(true)}
                onKeyDown={handlePeopleKeyDown}
                type="text"
                placeholder="Search for people"
                aria-label="Search for people to meet"
                className="flex-1 min-w-0 bg-transparent text-google-gray-700 dark:text-[#e3e3e3] placeholder:text-google-gray-600 dark:placeholder:text-[#c4c7c5] placeholder:opacity-100 focus:outline-none leading-6 [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm"
              />
            </div>

            {/* Results dropdown */}
            {showPeopleResults && (peopleSuggestions.length > 0 || isValidEmail(peopleQuery.trim())) && (
              <div className="absolute left-0 right-0 top-[44px] z-50 bg-white dark:bg-[#2d2e2f] rounded-lg shadow-google-md border border-google-gray-200 dark:border-[#444746] py-1 max-h-64 overflow-y-auto animate-fadeIn">
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
        {/* ref .s46 — pl 4 */}
        <div className="pt-2 pb-2 pl-1 pr-1">
          {/* ref .s48 — section header pill */}
          <div className="relative flex items-center h-8 ml-2 pl-2 pr-2 rounded-[32px]">
            <div className="flex-1 flex items-center h-full text-left">
              <span className="text-google-gray-800 dark:text-[#e3e3e3] font-medium [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
                Booking pages
              </span>
            </div>
            {/* ref .s55 — create appointment schedule (+) — placeholder, no action */}
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-google-gray-700 dark:text-[#c4c7c5] focus:outline-none"
              aria-label="Create appointment schedule"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              <span className="material-icons-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>

        {/* === Time Insights === */}
        {/* ref .s70 — py 8 */}
        <div className="pt-2 pb-2 pl-1 pr-1">
          {/* ref .s48 — section header pill */}
          <div className="relative flex items-center h-8 ml-2 pl-2 pr-2 rounded-[32px] hover:bg-google-gray-100 dark:hover:bg-[#37393b]">
            <button
              className="flex-1 flex items-center h-full text-left focus:outline-none"
              onClick={() => setInsightsExpanded((v) => !v)}
            >
              <span className="text-google-gray-800 dark:text-[#e3e3e3] font-medium [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
                Time Insights
              </span>
            </button>
            {/* ref .s53 — collapse arrow */}
            <span
              className="material-icons-outlined text-[22px] text-google-gray-700 dark:text-[#e3e3e3] ml-1 cursor-pointer select-none"
              onClick={() => setInsightsExpanded((v) => !v)}
            >
              {insightsExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            </span>
          </div>

          {insightsExpanded && (
            /* ref .s73 — pl 28 */
            <div className="pl-7 pt-2">
              {/* ref .s74 — date range (11px / 500 / uppercase / ls 0.8) */}
              <div className="mb-2 text-[11px] font-medium leading-4 uppercase tracking-[0.8px] text-google-gray-700 dark:text-[#e3e3e3]">
                {insightsRange}
              </div>
              {/* ref .s75 — meetings summary */}
              <div className="mb-2 text-google-gray-600 dark:text-[#c4c7c5] [font-family:'Google_Sans',Arial,sans-serif] text-xs leading-4 tracking-[0.3px]">
                {weekMeetingLabel}
              </div>
              {/* ref .s77 — "More insights" pill */}
              <button
                onClick={() => setShowInsights(true)}
                className="inline-flex items-center mt-1 mb-1.5 py-1 pl-4 pr-6 min-w-[64px] rounded-[20px] border border-google-gray-400 dark:border-[#8e918f] hover:bg-google-gray-50 dark:hover:bg-[#37393b] focus:outline-none"
              >
                {/* ref .s81 — sparkle icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2 shrink-0 fill-google-blue dark:fill-[#a8c7fa]">
                  <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"></path>
                  <path d="M15 9l.94-2.07L18 6l-2.06-.93L15 3l-.92 2.07L12 6l2.08.93zM3.5 11L4 9l2-.5L4 8l-.5-2L3 8l-2 .5L3 9z"></path>
                </svg>
                {/* ref .s82 — label */}
                <span className="text-google-blue dark:text-[#a8c7fa] [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm font-medium">
                  More insights
                </span>
              </button>
            </div>
          )}
        </div>

        {/* === My Calendars === */}
        {/* ref .s83 — pt 8, pl 4 */}
        <div className="pt-2 pl-1 pr-1">
          {/* ref .s48 — section header pill */}
          <div className="relative flex items-center h-8 ml-2 pl-2 pr-2 rounded-[32px] hover:bg-google-gray-100 dark:hover:bg-[#37393b] group">
            <button
              className="flex-1 flex items-center h-full text-left focus:outline-none"
              onClick={() => setMyCalExpanded((v) => !v)}
            >
              <span className="text-google-gray-800 dark:text-[#e3e3e3] font-medium [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
                My calendars
              </span>
            </button>
            <button
              className="w-8 h-8 rounded-full hover:bg-google-gray-200 dark:hover:bg-[#444746] flex items-center justify-center text-google-gray-700 dark:text-[#c4c7c5] opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setShowNewCalendar(!showNewCalendar); }}
              aria-label="Add calendar"
            >
              <span className="material-icons-outlined text-[20px]">add</span>
            </button>
            <span
              className="material-icons-outlined text-[22px] text-google-gray-700 dark:text-[#e3e3e3] ml-1 cursor-pointer select-none"
              onClick={() => setMyCalExpanded((v) => !v)}
            >
              {myCalExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            </span>
          </div>

          {showNewCalendar && (
            <form className="py-2 px-2" onSubmit={handleCreateCalendar}>
              <input
                type="text"
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                className="w-full px-2 py-1 border border-google-gray-300 dark:border-[#444746] dark:bg-transparent dark:text-[#e3e3e3] rounded text-sm focus:outline-none focus:border-google-blue mb-2"
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

          {myCalExpanded && (
            /* ref .s84 — calendar list */
            <div className="ml-2 mt-1">
              {calendars.map((calendar) => {
                const checked = selectedCalendars.includes(calendar.id);
                return (
                  /* ref .s86 — row */
                  <div
                    key={calendar.id}
                    className="group relative flex items-center min-h-[32px] rounded-[40px] hover:bg-google-gray-100 dark:hover:bg-[#37393b] cursor-pointer"
                  >
                    <label className="flex items-center flex-1 min-w-0 cursor-pointer select-none">
                      {/* ref .s87 — checkbox area, pl 8 / w 44 */}
                      <div className="flex items-center pl-2 w-11 shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCalendar(calendar.id)}
                          className="sr-only"
                        />
                        {/* ref .s91 — colored square */}
                        <span
                          className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[2px] shrink-0"
                          style={{ border: `2px solid ${calendar.color}`, backgroundColor: checked ? calendar.color : "transparent" }}
                        >
                          {checked && (
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="#131314" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </span>
                      </div>
                      {/* ref .s95 — label */}
                      <span className="flex-1 min-w-0 py-[6px] leading-4 text-sm text-google-gray-700 dark:text-[#e3e3e3] whitespace-nowrap overflow-hidden text-ellipsis">
                        {calendar.name}
                      </span>
                    </label>
                    {calendar.owner_id && (
                      <button
                        className="w-8 h-8 mr-1 rounded-full hover:bg-google-gray-200 dark:hover:bg-[#444746] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-google-gray-600 dark:text-[#c4c7c5] focus:outline-none shrink-0"
                        onClick={() => setShareCalendar(calendar)}
                        title="Options"
                      >
                        <span className="material-icons-outlined text-[20px]">more_vert</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* === Other Calendars === */}
        {/* ref .s83 — pl 4 */}
        <div className="pt-2 pb-2 pl-1 pr-1">
          {/* ref .s48 — section header pill */}
          <div className="relative flex items-center h-8 ml-2 pl-2 pr-2 rounded-[32px] hover:bg-google-gray-100 dark:hover:bg-[#37393b]">
            <button
              className="flex-1 flex items-center h-full text-left focus:outline-none"
              onClick={() => setOtherCalExpanded((v) => !v)}
            >
              <span className="text-google-gray-800 dark:text-[#e3e3e3] font-medium [font-family:'Google_Sans',Roboto,Arial,sans-serif] text-sm">
                Other calendars
              </span>
            </button>
            {/* ref .s101/.s102 — add (+) */}
            <button
              className="w-8 h-8 rounded-full hover:bg-google-gray-200 dark:hover:bg-[#444746] flex items-center justify-center text-google-gray-700 dark:text-[#c4c7c5] focus:outline-none"
              aria-label="Add other calendars"
            >
              <span className="material-icons-outlined text-[20px]">add</span>
            </button>
            <span
              className="material-icons-outlined text-[22px] text-google-gray-700 dark:text-[#e3e3e3] ml-1 cursor-pointer select-none"
              onClick={() => setOtherCalExpanded((v) => !v)}
            >
              {otherCalExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            </span>
          </div>

          {otherCalExpanded && (
            <div className="ml-2 mt-1">
              {/* ref .s85 — Holidays in India */}
              <div className="group relative flex items-center min-h-[32px] rounded-[40px] hover:bg-google-gray-100 dark:hover:bg-[#37393b] cursor-pointer">
                <label className="flex items-center flex-1 min-w-0 cursor-pointer select-none">
                  <div className="flex items-center pl-2 w-11 shrink-0">
                    <input
                      type="checkbox"
                      checked={showHolidays}
                      onChange={toggleShowHolidays}
                      className="sr-only"
                    />
                    <span
                      className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[2px] shrink-0"
                      style={{ border: "2px solid #489160", backgroundColor: showHolidays ? "#489160" : "transparent" }}
                    >
                      {showHolidays && (
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="#131314" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="flex-1 min-w-0 py-[6px] leading-4 text-sm text-google-gray-700 dark:text-[#e3e3e3] whitespace-nowrap overflow-hidden text-ellipsis">
                    Holidays in India
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {shareCalendar && (
          <CalendarShareModal calendar={shareCalendar} onClose={() => setShareCalendar(null)} />
        )}
      </aside>

      {showInsights && <InsightsModal onClose={() => setShowInsights(false)} />}
    </>
  );
}

export default CalendarSidebar;
