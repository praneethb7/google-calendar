"use client";

import { useEffect, useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";

import CalendarHeader from "./CalendarHeader";
import CalendarSidebar from "./CalendarSidebar";
import CalendarView from "./CalendarView";
import EventModal from "./EventModal";
import NotificationCenter from "./NotificationCenter";
import UpcomingEvents from "./UpcomingEvents";
import HolidaySettings from "./HolidaySettings";
import EventPopover from "./EventPopover";
import EventContextMenu from "./EventContextMenu";

function CalendarApp() {
  const user = { id: 1, name: "RL Agent", email: "agent@gcal-rl.local" };

  const {
    fetchCalendars,
    fetchSharedCalendars,
    fetchMyInvitations,
    fetchEvents,
    currentDate,
    currentView,
    selectedCalendars,
  } = useCalendarStore();

  const { fetchPreferences } = useHolidayStore();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const [showHolidaySettings, setShowHolidaySettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Popover for creating / editing events
  const [popoverState, setPopoverState] = useState({ show: false, x: 0, y: 0, date: null, event: null });
  // Placeholder blob shown in the grid before saving
  const [placeholder, setPlaceholder] = useState(null);
  // Right-click context menu
  const [contextMenu, setContextMenu] = useState(null);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await fetchCalendars();
        await fetchSharedCalendars();
        await fetchMyInvitations();
        await fetchPreferences();
      } catch (err) {
        console.error("Failed to initialize calendar:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCalendars.length === 0) return;
    const { start, end } = getDateRange(currentDate, currentView);
    fetchEvents(start, end).catch(console.error);
  }, [currentDate, currentView, selectedCalendars]);

  const getDateRange = (date, view) => {
    const start = new Date(date);
    const end = new Date(date);
    if (view === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === "week") {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (view === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay());
      end.setMonth(end.getMonth() + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Single click on an existing event → open popover for editing
  const handleEventClick = useCallback((event, x, y) => {
    setContextMenu(null);
    // If x/y provided (from view), use those; otherwise open full modal
    if (x !== undefined && y !== undefined) {
      setPopoverState({ show: true, x, y, date: new Date(event.start_time), event });
      const endDate = new Date(event.end_time);
      setPlaceholder({
        start: new Date(event.start_time),
        end: endDate,
        title: event.title || "(No title)",
        color: event.color || event.calendar_color || "#1a73e8",
        isExisting: true,
      });
    } else {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  }, []);

  // Right-click on event → context menu
  const handleEventContextMenu = useCallback((event, x, y) => {
    setPopoverState((p) => ({ ...p, show: false }));
    setPlaceholder(null);
    setContextMenu({ event, x, y });
  }, []);

  // Click on empty grid cell → create placeholder + popover
  const handleGridClick = useCallback((date, x, y) => {
    setContextMenu(null);
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(end.getHours() + 1);
    setPlaceholder({
      start,
      end,
      title: "(No title)",
      color: "#1a73e8",
      isExisting: false,
    });
    setPopoverState({ show: true, x, y, date: start, event: null });
  }, []);

  // Popover closed without saving → remove placeholder
  const handlePopoverClose = useCallback(() => {
    setPopoverState((p) => ({ ...p, show: false, event: null }));
    setPlaceholder(null);
  }, []);

  // Popover title changes → update placeholder blob text
  const handlePopoverTitleChange = useCallback((title) => {
    setPlaceholder((p) => (p ? { ...p, title: title || "(No title)" } : p));
  }, []);

  // Popover time changes → update placeholder blob position
  const handlePopoverTimeChange = useCallback((start, end) => {
    setPlaceholder((p) => (p ? { ...p, start, end } : p));
  }, []);

  // Popover saved → remove placeholder (real event takes over)
  const handlePopoverSaved = useCallback(() => {
    setPlaceholder(null);
    setPopoverState((p) => ({ ...p, show: false, event: null }));
  }, []);

  // Popover "More options" → open full EventModal
  const handlePopoverMoreOptions = (data) => {
    setSelectedEvent({
      _isNew: true,
      title: data.title,
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      location: data.location || "",
      description: data.description || "",
      is_all_day: false,
    });
    setPopoverState((p) => ({ ...p, show: false }));
    setPlaceholder(null);
    setShowEventModal(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen w-full bg-white dark:bg-[#202124] overflow-hidden text-google-gray-900 dark:text-gray-100">
        <CalendarHeader
          onCreateEvent={handleCreateEvent}
          onLogout={() => {}}
          user={user}
          onEventClick={(ev) => handleEventClick(ev)}
          onToggleUpcoming={() => setShowUpcomingEvents(!showUpcomingEvents)}
          onOpenHolidaySettings={() => setShowHolidaySettings(true)}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />

        <div className="flex flex-1 overflow-hidden h-full">
          {showSidebar && <CalendarSidebar onCreateEvent={handleCreateEvent} />}
          <CalendarView
            onEventClick={handleEventClick}
            onEventContextMenu={handleEventContextMenu}
            onGridClick={handleGridClick}
            placeholder={placeholder}
          />

          {showUpcomingEvents && (
            <div style={{ width: "320px", borderLeft: "1px solid var(--color-border-light)", background: "var(--color-bg-primary)", overflowY: "auto", padding: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-medium)", color: "var(--color-primary-text)", margin: 0 }}>
                  Upcoming Events
                </h2>
                <button onClick={() => setShowUpcomingEvents(false)} className="icon-button">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
                </button>
              </div>
              <UpcomingEvents onEventClick={(ev) => handleEventClick(ev)} />
            </div>
          )}
        </div>

        <NotificationCenter />

        {showEventModal && (
          <EventModal event={selectedEvent} onClose={() => setShowEventModal(false)} />
        )}

        {showHolidaySettings && (
          <HolidaySettings isOpen={showHolidaySettings} onClose={() => setShowHolidaySettings(false)} />
        )}

        {popoverState.show && (
          <EventPopover
            x={popoverState.x}
            y={popoverState.y}
            initialDate={popoverState.date}
            editEvent={popoverState.event}
            onClose={handlePopoverClose}
            onMoreOptions={handlePopoverMoreOptions}
            onTitleChange={handlePopoverTitleChange}
            onTimeChange={handlePopoverTimeChange}
            onSaved={handlePopoverSaved}
          />
        )}

        {contextMenu && (
          <EventContextMenu
            event={contextMenu.event}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onEdit={(ev) => handleEventClick(ev)}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default CalendarApp;
