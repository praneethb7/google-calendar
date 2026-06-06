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
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [activeApp, setActiveApp] = useState("calendar");
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

  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = calendarIconUrl;
  }, [calendarIconUrl]);

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
    setDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "day") newDate.setDate(newDate.getDate() + 1);
    else if (currentView === "week") newDate.setDate(newDate.getDate() + 7);
    else if (currentView === "month") newDate.setMonth(newDate.getMonth() + 1);
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
      <header className="flex items-center justify-between px-2 h-16 border-b border-google-gray-300 dark:border-transparent bg-white dark:bg-[#1b1b1b] transition-colors">
        {/* Left Section */}
        <div className="flex items-center">
          {/* Brand cluster — fixed width so the Today pill begins exactly above
              the main view (8px header padding + 248px = 256px sidebar width) */}
          <div className="flex items-center w-[248px] min-w-[248px]">
            <button
              className="icon-button mx-2"
              title="Main menu"
              onClick={onToggleSidebar}
            >
              <span className="material-icons-outlined">menu</span>
            </button>

            <div className="flex items-center ml-1">
              <img
                src={calendarIconUrl}
                alt="Google Calendar"
                className="w-11 h-10 object-contain"
              />
              <span className="text-[22px] text-google-gray-700 dark:text-white ml-1 tracking-tight whitespace-nowrap hidden sm:block">
                Calendar
              </span>
            </div>
          </div>

          <button
            onClick={handleToday}
            className="border border-google-gray-300 dark:border-[#8e918f] rounded-full px-6 py-2 text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] hover:bg-google-gray-50 dark:hover:bg-[#37393b] mr-5 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center -space-x-1">
            <button
              onClick={handlePrevious}
              className="icon-button"
              title="Previous"
            >
              <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              className="icon-button"
              title="Next"
            >
              <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">chevron_right</span>
            </button>
          </div>

          <h1 className="text-[22px] leading-7 text-google-gray-700 dark:text-[#e3e3e3] ml-5 hidden md:block whitespace-nowrap" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
            {getDateDisplay()}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 pr-2" ref={helpMenuRef}>
          <div className="hidden lg:block mr-2">
            <SearchBar onEventClick={onEventClick} user={user} />
          </div>

          <div className="relative">
            <button
              className="icon-button"
              title="Support"
              onClick={() => setShowHelpMenu((prev) => !prev)}
            >
              <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">help_outline</span>
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

          <div className="relative" ref={settingsDropdownRef}>
            <button
              onClick={() => setShowSettingsDropdown((prev) => !prev)}
              className="icon-button"
              title="Settings menu"
            >
              <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">settings</span>
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

          {/* View Switcher Button */}
          <div className="relative ml-2 mr-2">
            <button
              className="flex items-center justify-between border border-google-gray-300 dark:border-[#8e918f] rounded-full px-[18px] h-[40px] min-w-[64px] hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              <span className="text-sm font-medium text-google-gray-700 dark:text-[#e3e3e3] mr-2">
                {currentViewLabel}
              </span>
              <span className="material-icons-outlined text-[18px] text-google-gray-700 dark:text-[#e3e3e3]">
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

          {/* Calendar / Tasks segmented toggle */}
          <div className="hidden sm:flex items-center ml-2">
            <button
              onClick={() => setActiveApp("calendar")}
              title="Calendar"
              className={`flex items-center justify-center w-[54px] h-[40px] rounded-l-full border border-google-gray-300 dark:border-[#8e918f] transition-colors ${
                activeApp === "calendar"
                  ? "bg-google-blue-light text-white dark:bg-[#004a77] dark:text-white"
                  : "text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-50 dark:hover:bg-[#37393b]"
              }`}
            >
              <span className="material-icons-outlined text-[20px]">calendar_today</span>
            </button>
            <button
              onClick={() => setActiveApp("tasks")}
              title="Tasks"
              className={`flex items-center justify-center w-[54px] h-[40px] rounded-r-full border border-l-0 border-google-gray-300 dark:border-[#8e918f] transition-colors ${
                activeApp === "tasks"
                  ? "bg-google-blue-light text-white dark:bg-[#004a77] dark:text-white"
                  : "text-google-gray-700 dark:text-[#c4c7c5] hover:bg-google-gray-50 dark:hover:bg-[#37393b]"
              }`}
            >
              <span className="material-icons-outlined text-[20px]">task_alt</span>
            </button>
          </div>

          <button className="icon-button ml-2" title="Google apps">
            <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">apps</span>
          </button>

          {/* Google account pill */}
          <div className="flex items-center gap-2 border border-google-gray-300 dark:border-[#e3e3e3] rounded-full pl-3 pr-1 py-[3px] ml-2 hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors cursor-pointer">
            <span className="bg-white rounded-[6px] px-1.5 py-1 flex items-center select-none">
              <img
                src="https://www.google.com/u/0/ac/images/logo.gif?uid=102332194607365647406&service=google_gsuite"
                alt="Google"
                className="h-5 w-auto"
              />
            </span>
            <span className="bg-[#1a73e8] text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-medium select-none">
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAppearanceModal && <AppearanceModal onClose={() => setShowAppearanceModal(false)} />}
      {showTrash && <TrashPage user={user} onClose={() => setShowTrash(false)} />}
    </>
  );
}

export default CalendarHeader;
