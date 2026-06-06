"use client";
import { useState, useRef, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import SearchBar from "./SearchBar";
import SettingsModal from "./SettingsModal";
import AppearanceModal from "./AppearanceModal";
import TrashPage from "./TrashPage";

function CalendarHeader({
  onCreateEvent,
  onLogout,
  user,
  onEventClick,
  onToggleUpcoming,
  onOpenHolidaySettings,
  onToggleSidebar,
  activeApp = "calendar",
  onChangeApp = () => {},
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const helpMenuRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  const {
    currentView,
    setView,
    currentDate,
    setDate,
    showWeekends,
    showDeclinedEvents,
    showCompletedTasks,
    toggleShowWeekends,
    toggleShowDeclinedEvents,
    toggleShowCompletedTasks,
  } = useCalendarStore();

  // Google Calendar product logo changes by month (and the favicon with it).
  const calendarIconUrl = (() => {
    const d = new Date();
    const ym = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `https://www.gstatic.com/images/branding/productlogos/calendar_${ym}/v2/png/calendar_${ym}_96dp.png`;
  })();

  // Tasks uses its own favicon, matching Google Calendar's behaviour when you
  // switch to the Tasks surface.
  const tasksIconUrl =
    "https://www.gstatic.com//tasks/31bf352b350141ee0437b2e7770c70c9/favicon.ico";

  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = activeApp === "tasks" ? tasksIconUrl : calendarIconUrl;
  }, [calendarIconUrl, tasksIconUrl, activeApp]);

  const VIEW_ITEMS = [
    { id: "day", label: "Day", key: "D" },
    { id: "week", label: "Week", key: "W" },
    { id: "month", label: "Month", key: "M" },
    { id: "year", label: "Year", key: "Y" },
    { id: "schedule", label: "Schedule", key: "A" },
    { id: "4days", label: "4 days", key: "X" },
  ];

  const CheckIcon = () => (
    <svg className="vp-s13" viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "rgb(194, 231, 255)" }}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );

  const currentViewLabel =
    VIEW_ITEMS.find((v) => v.id === currentView)?.label || "Month";

  // Close help menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target)) {
        setShowHelpMenu(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === "day") newDate.setDate(newDate.getDate() - 1);
    else if (currentView === "week") newDate.setDate(newDate.getDate() - 7);
    else if (currentView === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (currentView === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    else if (currentView === "4days") newDate.setDate(newDate.getDate() - 4);
    else if (currentView === "schedule") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "day") newDate.setDate(newDate.getDate() + 1);
    else if (currentView === "week") newDate.setDate(newDate.getDate() + 7);
    else if (currentView === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (currentView === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    else if (currentView === "4days") newDate.setDate(newDate.getDate() + 4);
    else if (currentView === "schedule") newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
  };

  const handleToday = () => setDate(new Date());

  const getDateDisplay = () => {
    if (currentView === "year") {
      return String(currentDate.getFullYear());
    }
    if (currentView === "month") {
      return currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
    if (currentView === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: "long" })} ${end.getFullYear()}`;
      }
      return `${startMonth} – ${endMonth} ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleViewChange = (view) => {
    setView(view);
    setShowViewDropdown(false);
  };

  return (
    <>
      <header
        className="flex items-center justify-between bg-white dark:bg-[#1b1b1b] transition-colors"
        style={{ padding: "8px", minHeight: "64px" }}
      >
        {/* === Left section (s4): drawer + brand === */}
        <div className="flex items-center" style={{ paddingRight: "25px" }}>
          {/* Brand cluster — fixed width so the Today pill begins above the grid */}
          <div className="flex items-center w-[248px] min-w-[248px]">
            {/* hamburger (s5): 48px circle, 12px padding */}
            <button
              title="Main menu"
              aria-label="Main drawer"
              onClick={onToggleSidebar}
              className="flex items-center justify-center shrink-0 rounded-full text-google-gray-700 dark:text-white hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
              style={{ width: "48px", height: "48px", margin: "0 4px", padding: "12px" }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            {/* brand (s7/s9): logo 44x40 + "Calendar" 22px/48 */}
            <div className="flex items-center" style={{ height: "48px" }}>
              <img
                src={calendarIconUrl}
                alt="Google Calendar"
                style={{ width: "44px", height: "40px", paddingRight: "4px", marginBottom: "4px", objectFit: "contain" }}
              />
              <span
                className="text-google-gray-700 dark:text-white whitespace-nowrap hidden sm:block"
                style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif', fontSize: "22px", lineHeight: "48px", paddingLeft: "4px" }}
              >
                Calendar
              </span>
            </div>
          </div>

          {activeApp !== "tasks" && (
            <div className="flex items-center">
              {/* Today (s21): border #8e918f, radius 20px, 24px side padding */}
              <button
                onClick={handleToday}
                aria-label="Today"
                className="flex items-center justify-center border border-google-gray-300 dark:border-[#8e918f] text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors"
                style={{ minWidth: "64px", minHeight: "40px", paddingLeft: "24px", paddingRight: "24px", margin: "4px 20px 4px 0", borderRadius: "20px", fontSize: "14px", fontWeight: 500, fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
              >
                Today
              </button>

              {/* prev/next (s25): 32px circle, 4px padding, chevron 24px #c4c7c5 */}
              <button
                onClick={handlePrevious}
                aria-label="Previous"
                title="Previous"
                className="flex items-center justify-center shrink-0 rounded-full text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
                style={{ width: "32px", height: "32px", padding: "4px" }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                aria-label="Next"
                title="Next"
                className="flex items-center justify-center shrink-0 rounded-full text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
                style={{ width: "32px", height: "32px", padding: "4px" }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
                </svg>
              </button>

              {/* date (s33): Google Sans 22px / 28px */}
              <h1
                className="text-google-gray-700 dark:text-[#e3e3e3] hidden md:block whitespace-nowrap"
                style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif', fontSize: "22px", lineHeight: "28px", marginLeft: "8px" }}
              >
                {getDateDisplay()}
              </h1>
            </div>
          )}
        </div>

        {/* === Right section === */}
        <div className="flex items-center" ref={helpMenuRef}>
          {/* search (s37): 40px circle, material-icon 24px */}
          {activeApp !== "tasks" && (
            <div className="relative">
              <button
                aria-label="Search"
                title="Search"
                onClick={() => setShowSearch((p) => !p)}
                className="flex items-center justify-center rounded-full text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
                style={{ width: "40px", height: "40px", padding: "8px" }}
              >
                <span className="material-icons" style={{ fontSize: "24px" }}>search</span>
              </button>
              {showSearch && (
                <div className="absolute right-0 top-[48px] z-50 bg-white dark:bg-[#2d2e2f] rounded-lg shadow-google-md border border-google-gray-200 dark:border-[#444746] p-2 animate-fadeIn">
                  <SearchBar onEventClick={onEventClick} user={user} />
                </div>
              )}
            </div>
          )}

          {/* help (s37): 40px circle */}
          <div className="relative">
            <button
              className="flex items-center justify-center rounded-full text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
              style={{ width: "40px", height: "40px", padding: "8px" }}
              title="Support"
              aria-label="Support"
              onClick={() => setShowHelpMenu((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
              </svg>
            </button>
            {showHelpMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2d2e2f] border border-google-gray-200 dark:border-[#444746] shadow-google-md py-2 rounded-lg z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Help
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Training
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Send feedback to Google
                </button>
              </div>
            )}
          </div>

          {activeApp !== "tasks" && (
          <div className="relative" ref={settingsDropdownRef} style={{ marginLeft: "4px" }}>
            <button
              onClick={() => setShowSettingsDropdown((prev) => !prev)}
              className="flex items-center justify-center rounded-full text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
              style={{ width: "40px", height: "40px", padding: "8px" }}
              title="Settings menu"
              aria-label="Settings menu"
            >
              <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
                <path d="M13.85 22.25h-3.7c-.74 0-1.36-.54-1.45-1.27l-.27-1.89c-.27-.14-.53-.29-.79-.46l-1.8.72c-.7.26-1.47-.03-1.81-.65L2.2 15.53c-.35-.66-.2-1.44.36-1.88l1.53-1.19c-.01-.15-.02-.3-.02-.46 0-.15.01-.31.02-.46l-1.52-1.19c-.59-.45-.74-1.26-.37-1.88l1.85-3.19c.34-.62 1.11-.9 1.79-.63l1.81.73c.26-.17.52-.32.78-.46l.27-1.91c.09-.7.71-1.25 1.44-1.25h3.7c.74 0 1.36.54 1.45 1.27l.27 1.89c.27.14.53.29.79.46l1.8-.72c.71-.26 1.48.03 1.82.65l1.84 3.18c.36.66.2 1.44-.36 1.88l-1.52 1.19c.01.15.02.3.02.46s-.01.31-.02.46l1.52 1.19c.56.45.72 1.23.37 1.86l-1.86 3.22c-.34.62-1.11.9-1.8.63l-1.8-.72c-.26.17-.52.32-.78.46l-.27 1.91c-.1.68-.72 1.22-1.46 1.22zm-3.23-2h2.76l.37-2.55.53-.22c.44-.18.88-.44 1.34-.78l.45-.34 2.38.96 1.38-2.4-2.03-1.58.07-.56c.03-.26.06-.51.06-.78s-.03-.53-.06-.78l-.07-.56 2.03-1.58-1.39-2.4-2.39.96-.45-.35c-.42-.32-.87-.58-1.33-.77l-.52-.22-.37-2.55h-2.76l-.37 2.55-.53.21c-.44.19-.88.44-1.34.79l-.45.33-2.38-.95-1.39 2.39 2.03 1.58-.07.56a7 7 0 0 0-.06.79c0 .26.02.53.06.78l.07.56-2.03 1.58 1.38 2.4 2.39-.96.45.35c.43.33.86.58 1.33.77l.53.22.38 2.55z" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </button>
            {showSettingsDropdown && (
              <div className="absolute left-0 top-[52px] w-[110px] bg-white dark:bg-[#1e1f20] border border-google-gray-200 dark:border-transparent shadow-google-md dark:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] py-2 rounded z-50">
                <button
                  onClick={() => { setShowSettings(true); setShowSettingsDropdown(false); }}
                  className="w-full flex items-center text-left min-h-[40px] px-3 py-2 text-[14px] leading-5 text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-white/[0.08]"
                >
                  Settings
                </button>
                <button
                  onClick={() => { setShowTrash(true); setShowSettingsDropdown(false); }}
                  className="w-full flex items-center text-left min-h-[40px] px-3 py-2 text-[14px] leading-5 text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-white/[0.08]"
                >
                  Trash
                </button>
                <div className="h-px my-2 bg-google-gray-200 dark:bg-[#444746]"></div>
                <button
                  onClick={() => { setShowAppearanceModal(true); setShowSettingsDropdown(false); }}
                  className="w-full flex items-center text-left min-h-[40px] px-3 py-2 text-[14px] leading-5 text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-white/[0.08]"
                >
                  Appearance
                </button>
                <button className="w-full flex items-center text-left min-h-[40px] px-3 py-2 text-[14px] leading-5 text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-white/[0.08]">
                  Print
                </button>
                <div className="h-px my-2 bg-google-gray-200 dark:bg-[#444746]"></div>
                <button className="w-full flex items-center text-left min-h-[40px] px-3 py-2 text-[14px] leading-5 text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-white/[0.08]">
                  Get add-ons
                </button>
              </div>
            )}
          </div>
          )}

          {/* View Switcher Button (s46): border #8e918f, radius 20px, 18px padding */}
          {activeApp !== "tasks" && (
          <div className="relative" style={{ marginLeft: "12px" }}>
            <button
              className="flex items-center justify-center border border-google-gray-300 dark:border-[#8e918f] text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors"
              style={{ minWidth: "64px", minHeight: "40px", paddingLeft: "18px", paddingRight: "18px", margin: "4px 0", borderRadius: "20px", fontSize: "14px", fontWeight: 500, fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              <span>{currentViewLabel}</span>
              <span className="material-icons" style={{ fontSize: "18px", marginLeft: "8px" }}>
                arrow_drop_down
              </span>
            </button>

            {showViewDropdown && (
              <div className="vp-s14 absolute right-0 mt-1 z-50">
                <ul className="vp-s1 vp-p1" style={{ width: 202, maxWidth: "100%" }}>
                  {VIEW_ITEMS.map((item) => (
                    <li
                      key={item.id}
                      className="vp-s3"
                      onClick={() => handleViewChange(item.id)}
                    >
                      <span className="vp-s4 vp-p3" />
                      <span className="vp-s5">
                        <span className="vp-s6">{item.label}</span>
                      </span>
                      <span className="vp-s7">{item.key}</span>
                    </li>
                  ))}

                  <li className="vp-s8" aria-hidden="true" />

                  <li className="vp-s9">
                    <ul className="vp-s2" aria-label="View options">
                      {[
                        { label: "Show weekends", checked: showWeekends, toggle: toggleShowWeekends },
                        { label: "Show declined events", checked: showDeclinedEvents, toggle: toggleShowDeclinedEvents },
                        { label: "Show completed tasks", checked: showCompletedTasks, toggle: toggleShowCompletedTasks },
                      ].map((opt) => (
                        <li
                          key={opt.label}
                          className="vp-s3"
                          role="menuitemcheckbox"
                          aria-checked={opt.checked}
                          onClick={(e) => { e.stopPropagation(); opt.toggle(); }}
                        >
                          <span className="vp-s4 vp-p3" />
                          <span className="vp-s10">
                            <span className="vp-s11">
                              <span className="vp-s12">
                                {opt.checked && <CheckIcon />}
                              </span>
                            </span>
                          </span>
                          <span className="vp-s5">
                            <span className="vp-s6">{opt.label}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </div>
            )}
          </div>
          )}

          {/* Calendar / Tasks segmented toggle (s50/s51/s55): pill ends, 20px svg */}
          <div className="hidden sm:flex items-center" style={{ marginLeft: "12px" }}>
            <button
              onClick={() => onChangeApp("calendar")}
              title="Calendar"
              aria-label="Switch to Calendar"
              className={`flex items-center justify-center border border-google-gray-300 dark:border-[#8e918f] transition-colors ${
                activeApp === "calendar"
                  ? "bg-google-blue-light text-white dark:bg-[#004a77] dark:text-white"
                  : "text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-50 dark:hover:bg-[#37393b]"
              }`}
              style={{ minHeight: "40px", paddingLeft: "18px", paddingRight: "14px", borderRadius: "9999px 0 0 9999px" }}
            >
              <svg viewBox="0 -960 960 960" style={{ width: 20, height: 20, fill: "currentColor" }}>
                <path d="M320-400q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm160 0q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm160 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
              </svg>
            </button>
            <button
              onClick={() => onChangeApp("tasks")}
              title="Tasks"
              aria-label="Switch to Tasks"
              className={`flex items-center justify-center border border-l-0 border-google-gray-300 dark:border-[#8e918f] transition-colors ${
                activeApp === "tasks"
                  ? "bg-google-blue-light text-white dark:bg-[#004a77] dark:text-white"
                  : "text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-50 dark:hover:bg-[#37393b]"
              }`}
              style={{ minHeight: "40px", paddingLeft: "14px", paddingRight: "18px", borderRadius: "0 9999px 9999px 0" }}
            >
              <svg viewBox="0 -960 960 960" style={{ width: 20, height: 20, fill: "currentColor" }}>
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" />
              </svg>
            </button>
          </div>

          {/* Google apps (s61): 40px circle, 24px svg */}
          <button
            className="flex items-center justify-center rounded-full text-google-gray-700 dark:text-white hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
            style={{ width: "40px", height: "40px", padding: "8px", marginLeft: "4px" }}
            title="Google apps"
            aria-label="Google apps"
          >
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "currentColor" }}>
              <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z" />
            </svg>
          </button>

          {/* Google account pill (s62): border #e3e3e3, radius 28px, 48px tall */}
          <div
            className="flex items-center border border-google-gray-300 dark:border-[#e3e3e3] hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors cursor-pointer"
            style={{ height: "48px", borderRadius: "28px", paddingLeft: "16px", paddingRight: "4px", paddingTop: "7px", marginLeft: "10px", marginRight: "4px" }}
          >
            {/* Google logo box (s63): white, radius 6px */}
            <span className="bg-white flex items-center select-none" style={{ borderRadius: "6px", padding: "2px" }}>
              <img
                src="https://www.google.com/u/0/ac/images/logo.gif?uid=102332194607365647406&service=google_gsuite"
                alt="Google"
                style={{ height: "24px", width: "74px", maxWidth: "74px", objectFit: "contain" }}
              />
            </span>
            {/* avatar (s67/s68): 32px circle */}
            <span
              className="bg-[#1a73e8] text-white flex items-center justify-center font-medium select-none"
              style={{ width: "32px", height: "32px", borderRadius: "9999px", marginLeft: "9px", fontSize: "16px" }}
            >
              {(user?.name || user?.email || "P").charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Invisible backdrop to dismiss View Dropdown */}
      {showViewDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowViewDropdown(false)}
        />
      )}

      {/* Invisible backdrop to dismiss Search popover */}
      {showSearch && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearch(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAppearanceModal && <AppearanceModal onClose={() => setShowAppearanceModal(false)} />}
      {showTrash && <TrashPage user={user} onClose={() => setShowTrash(false)} />}
    </>
  );
}

export default CalendarHeader;
