"use client";
import { useState, useRef, useEffect } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import SearchBar from "./SearchBar";
import SettingsModal from "./SettingsModal";
import AppearanceModal from "./AppearanceModal";

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
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const helpMenuRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  const { currentView, setView, currentDate, setDate } = useCalendarStore();

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
    const options =
      currentView === "month"
        ? { year: "numeric", month: "long" }
        : { year: "numeric", month: "long", day: "numeric" };
    return currentDate.toLocaleDateString("en-US", options);
  };

  const handleViewChange = (view) => {
    setView(view);
    setShowViewDropdown(false);
  };

  return (
    <>
      <header className="flex items-center justify-between px-2 h-16 border-b border-google-gray-300 dark:border-gray-700 bg-white dark:bg-[#202124] transition-colors">
        {/* Left Section */}
        <div className="flex items-center">
          <button
            className="icon-button mx-2"
            title="Main menu"
            onClick={onToggleSidebar}
          >
            <span className="material-icons-outlined">menu</span>
          </button>

          <div className="flex items-center ml-1">
            <svg
              className="w-10 h-10"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#4285F4" d="M29 6H20.5v24H29c1.65 0 3-1.35 3-3V9c0-1.65-1.35-3-3-3z"/>
              <path fill="#34A853" d="M7 6h8.5v24H7c-1.65 0-3-1.35-3-3V9c0-1.65 1.35-3 3-3z"/>
              <path fill="#FBBC04" d="M15.5 6h5v24h-5z"/>
              <path fill="#EA4335" d="M15.5 6V2h5v4z"/>
              <path fill="#188038" d="M20.5 30v4h-5v-4z"/>
              <text x="50%" y="60%" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle" dy=".3em">{currentDate.getDate()}</text>
            </svg>
            <span className="text-[22px] text-google-gray-700 dark:text-gray-100 ml-2 tracking-tight whitespace-nowrap hidden sm:block">
              Calendar
            </span>
          </div>

          <button
            onClick={handleToday}
            className="border border-google-gray-300 dark:border-gray-600 rounded-[4px] px-3.5 py-[7px] text-sm font-medium text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-50 dark:hover:bg-gray-800 ml-6 mr-4 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              className="icon-button"
              title="Previous"
            >
              <span className="material-icons-outlined text-[20px] dark:text-gray-300">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              className="icon-button"
              title="Next"
            >
              <span className="material-icons-outlined text-[20px] dark:text-gray-300">chevron_right</span>
            </button>
          </div>

          <h1 className="text-[22px] text-google-gray-700 dark:text-gray-100 ml-4 hidden md:block whitespace-nowrap">
            {getDateDisplay()}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 pr-2" ref={helpMenuRef}>
          <div className="hidden lg:block mr-2">
            <SearchBar onEventClick={onEventClick} />
          </div>

          <div className="relative">
            <button
              className="icon-button"
              title="Support"
              onClick={() => setShowHelpMenu((prev) => !prev)}
            >
              <span className="material-icons-outlined text-[24px] dark:text-gray-300">help_outline</span>
            </button>
            {showHelpMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#303134] border border-google-gray-200 dark:border-gray-700 shadow-google-md py-2 rounded-lg z-50">
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
              <span className="material-icons-outlined text-[24px] dark:text-gray-300">settings</span>
            </button>
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#303134] border border-google-gray-200 dark:border-gray-700 shadow-google-md py-2 rounded-lg z-50">
                <button 
                  onClick={() => { setShowSettings(true); setShowSettingsDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50"
                >
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Trash
                </button>
                <div className="border-t border-google-gray-200 my-1"></div>
                <button 
                  onClick={() => { setShowAppearanceModal(true); setShowSettingsDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50"
                >
                  Appearance
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Print
                </button>
                <div className="border-t border-google-gray-200 my-1"></div>
                <button className="w-full text-left px-4 py-2 text-sm text-google-gray-700 dark:text-gray-200 hover:bg-google-gray-100 dark:hover:bg-gray-700/50">
                  Get add-ons
                </button>
              </div>
            )}
          </div>

          {/* View Switcher Button */}
          <div className="relative ml-2 mr-2">
            <button
              className="flex items-center justify-between border border-google-gray-300 dark:border-gray-600 rounded-[4px] px-3 h-[36px] min-w-[80px] hover:bg-google-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              <span className="text-sm font-medium text-google-gray-700 dark:text-gray-200 capitalize mr-2">
                {currentView}
              </span>
              <span className="material-icons-outlined text-[18px] text-google-gray-700 dark:text-gray-300">
                arrow_drop_down
              </span>
            </button>

            {showViewDropdown && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#303134] shadow-google-md rounded-[8px] py-2 z-50 text-sm border border-google-gray-200 dark:border-gray-700">
                {["day", "week", "month", "schedule"].map((view) => (
                  <button
                    key={view}
                    className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-google-gray-100 dark:hover:bg-gray-700/50"
                    onClick={() => handleViewChange(view)}
                  >
                    <span className="capitalize text-google-gray-700 dark:text-gray-200">{view}</span>
                    <span className="text-google-gray-500 dark:text-gray-400 text-xs">
                      {view.charAt(0).toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="icon-button" title="Google apps">
            <span className="material-icons-outlined text-[24px] dark:text-gray-300">apps</span>
          </button>

          <button className="ml-2 bg-google-blue text-white rounded-full w-8 h-8 flex items-center justify-center font-medium shadow overflow-hidden hover:shadow-google-md">
            P
          </button>
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
    </>
  );
}

export default CalendarHeader;
