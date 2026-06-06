"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

// ── Time helpers ─────────────────────────────────────────────────────────────
const fmt12 = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
const fmtDate = (d) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const toLocalISO = (d) => {
  const dt = new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
};

// Build time slot options in 15-min increments
function buildTimeSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const d = new Date(2000, 0, 1, h, m);
      slots.push({ label: fmt12(d), hours: h, minutes: m });
    }
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function durationLabel(start, end) {
  const diff = (end - start) / 60000;
  if (diff < 60) return `${diff} mins`;
  const hrs = diff / 60;
  return hrs === 1 ? "1 hr" : `${hrs} hrs`;
}

// ── Dropdown component ───────────────────────────────────────────────────────
function Dropdown({ trigger, children, open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return (
    <div ref={ref} className="relative inline-block">
      {trigger}
      {open && (
        <div className="absolute z-[60] mt-1 bg-white dark:bg-[#2d2e2f] border border-gray-200 dark:border-[#444746] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.24)] py-1 max-h-48 overflow-auto min-w-[200px] animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Recurrence options ───────────────────────────────────────────────────────
const RECURRENCE_OPTIONS = [
  { label: "Does not repeat", value: null },
  { label: "Daily", value: "FREQ=DAILY;INTERVAL=1" },
  { label: "Weekly", value: "FREQ=WEEKLY;INTERVAL=1" },
  { label: "Monthly", value: "FREQ=MONTHLY;INTERVAL=1" },
  { label: "Annually", value: "FREQ=YEARLY;INTERVAL=1" },
  { label: "Every weekday (Monday to Friday)", value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
];

// ── Tab configs ──────────────────────────────────────────────────────────────
const TABS = [
  "Event", "Task", "Out of office", "Focus time", "Working location", "Appointment schedule",
];

// ── Material-style checkbox / radio (dark) ───────────────────────────────────
function MCheckbox({ checked, onChange }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative w-5 h-5 shrink-0 rounded-[3px] flex items-center justify-center cursor-pointer transition-colors ${
        checked ? "bg-[#8ab4f8]" : "border-2 border-gray-500 dark:border-[#8e918f]"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#202124" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      )}
    </span>
  );
}

function MRadio({ checked, onChange }) {
  return (
    <span
      role="radio"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer"
    >
      {checked && <span className="absolute w-8 h-8 rounded-full bg-[#8ab4f8]/15 pointer-events-none" />}
      <span className={`relative w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? "border-[#8ab4f8]" : "border-gray-500 dark:border-[#8e918f]"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-[#8ab4f8]" />}
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
function EventPopover({ x, y, initialDate, editEvent, onClose, onMoreOptions, onTitleChange, onTimeChange, onTabChange, onSaved }) {
  const { createEvent, updateEvent, deleteEvent, calendars, fetchEvents, currentDate, currentView } =
    useCalendarStore();

  const isEditing = !!editEvent;

  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(editEvent?.title || "");
  const [activeTab, setActiveTab] = useState("Event");
  const [location, setLocation] = useState(editEvent?.location || "");
  const [description, setDescription] = useState(editEvent?.description || "");
  const [guests, setGuests] = useState("");
  const [isAllDay, setIsAllDay] = useState(editEvent?.is_all_day || false);
  const [recurrence, setRecurrence] = useState(editEvent?.recurrence_rule || null);
  const [autoDecline, setAutoDecline] = useState(true);
  const [declineScope, setDeclineScope] = useState("all");
  const [oooMessage, setOooMessage] = useState("Declined because I am out of office");
  const [doNotDisturb, setDoNotDisturb] = useState(true);
  const [focusDecline, setFocusDecline] = useState(false);
  const [apptChoice, setApptChoice] = useState("existing");
  // Booking pages / appointment schedules. Empty → "create your first" state.
  const [bookingPages] = useState([]);
  const [workingLoc, setWorkingLoc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inline expand states
  const [showLocation, setShowLocation] = useState(!!editEvent?.location);
  const [showDescription, setShowDescription] = useState(!!editEvent?.description);
  const [showGuests, setShowGuests] = useState(false);

  // Dropdown visibility
  const [openDrop, setOpenDrop] = useState(null);

  const popoverRef = useRef(null);
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: x, top: y };
    const grid = document.getElementById("calendar-grid-area");
    const area = grid
      ? grid.getBoundingClientRect()
      : { left: 0, width: window.innerWidth };
    return {
      left: Math.max(20, area.left + (area.width - 707) / 2),
      top: Math.max(20, window.innerHeight * 0.18),
    };
  });

  const [startTime, setStartTime] = useState(editEvent ? new Date(editEvent.start_time) : (initialDate || new Date()));
  const [endTime, setEndTime] = useState(() => {
    if (editEvent) return new Date(editEvent.end_time);
    const e = new Date(initialDate || new Date());
    e.setHours(e.getHours() + 1);
    return e;
  });

  // Notify parent of title changes (for placeholder blob)
  useEffect(() => { onTitleChange?.(title); }, [title]);
  // Notify parent of time changes
  useEffect(() => { onTimeChange?.(startTime, endTime); }, [startTime, endTime]);

  // Auto-set title for certain tabs
  useEffect(() => {
    if (activeTab === "Out of office" && !title) setTitle("Out of office");
    if (activeTab === "Focus time" && !title) setTitle("Focus time");
    // Working location title is static & non-editable
    if (activeTab === "Working location") setTitle("Working location");
  }, [activeTab]);

  // Notify parent of tab changes (so the grid placeholder can restyle)
  useEffect(() => { onTabChange?.(activeTab); }, [activeTab]);

  // Center popover within the calendar grid area (right of the sidebar)
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const grid = document.getElementById("calendar-grid-area");
    const area = grid
      ? grid.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const left = area.left + (area.width - rect.width) / 2;
    const top = area.top + (area.height - rect.height) / 2;
    setPos({
      left: Math.max(20, Math.min(left, window.innerWidth - rect.width - 20)),
      top: Math.max(20, Math.min(top, window.innerHeight - rect.height - 20)),
    });
  }, [x, y]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setTimeFromSlot = (slot, which) => {
    const d = new Date(which === "start" ? startTime : endTime);
    d.setHours(slot.hours, slot.minutes, 0, 0);
    if (which === "start") {
      setStartTime(d);
      if (d >= endTime) {
        const ne = new Date(d);
        ne.setHours(ne.getHours() + 1);
        setEndTime(ne);
      }
    } else {
      setEndTime(d);
    }
    setOpenDrop(null);
  };

  const setDateFromMini = (date) => {
    const ns = new Date(startTime);
    ns.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    const ne = new Date(endTime);
    ne.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setStartTime(ns);
    setEndTime(ne);
    setOpenDrop(null);
  };

  // ── Mini calendar for date picker ─────────────────────────────────────────
  const [miniMonth, setMiniMonth] = useState(new Date(startTime));
  const miniDays = useMemo(() => {
    const y = miniMonth.getFullYear(), m = miniMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days = [];
    for (let i = first.getDay() - 1; i >= 0; i--)
      days.push({ d: new Date(y, m, -i), cur: false });
    for (let i = 1; i <= last.getDate(); i++)
      days.push({ d: new Date(y, m, i), cur: true });
    while (days.length < 42)
      days.push({ d: new Date(y, m + 1, days.length - last.getDate() - first.getDay() + 1), cur: false });
    return days;
  }, [miniMonth]);

  const refreshEvents = () => {
    const s = new Date(currentDate), e = new Date(currentDate);
    if (currentView === "day") { s.setHours(0,0,0,0); e.setHours(23,59,59,999); }
    else if (currentView === "week") { s.setDate(s.getDate()-s.getDay()); s.setHours(0,0,0,0); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); }
    else if (currentView === "month") { s.setDate(1); s.setHours(0,0,0,0); s.setDate(s.getDate()-s.getDay()); e.setMonth(e.getMonth()+1,0); e.setDate(e.getDate()+(6-e.getDay())); e.setHours(23,59,59,999); }
    else { s.setHours(0,0,0,0); e.setDate(e.getDate()+30); e.setHours(23,59,59,999); }
    return fetchEvents(s, e);
  };

  const handleDelete = async () => {
    if (!isEditing) { onClose(); return; }
    await deleteEvent(editEvent.id);
    await refreshEvents();
    onSaved?.();
  };

  const handleSave = async () => {
    const t = title.trim() || activeTab;
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        calendar_id: calendars[0]?.id,
        title: t,
        description: description || null,
        location: location || workingLoc || null,
        start_time: toLocalISO(startTime),
        end_time: toLocalISO(endTime),
        is_all_day: isAllDay,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        status: activeTab === "Out of office" ? "outOfOffice" : activeTab === "Focus time" ? "focusTime" : "confirmed",
        is_recurring: !!recurrence,
        recurrence_rule: recurrence,
      };
      if (isEditing) {
        await updateEvent(editEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      await refreshEvents();
      onSaved?.();
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsSaving(false);
    }
  };

  // pill style
  const pill = "px-3 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors bg-[#e8eaed]/60 dark:bg-[#3c4043] hover:bg-[#d3d5d9] dark:hover:bg-[#4a4d51] text-gray-800 dark:text-gray-200";

  // recurrence label
  const recurrenceLabel = RECURRENCE_OPTIONS.find((r) => r.value === recurrence)?.label || "Does not repeat";

  // dynamic day name for recurrence
  const dayName = startTime.toLocaleDateString("en-US", { weekday: "long" });

  // editable text trigger (date / time) — plain text, underline only on hover
  const underline =
    "text-gray-900 dark:text-[#e3e3e3] leading-5 hover:underline focus:outline-none cursor-pointer";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={popoverRef}
        className="fixed z-50 bg-white dark:bg-[#1e1f20] rounded-[28px] shadow-[0_3px_4px_rgba(0,0,0,0.14),0_3px_3px_-2px_rgba(0,0,0,0.12),0_1px_8px_rgba(0,0,0,0.2)] w-[707px] max-w-[calc(100vw-40px)] flex flex-col font-sans animate-fadeIn"
        style={{ left: pos.left, top: pos.top, maxHeight: "calc(100vh - 40px)" }}
      >
        {/* ── Close ─────────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-[10px] right-[15px] w-7 h-7 rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 dark:text-[#c4c7c5] z-10"
          title="Close"
        >
          <span className="material-icons-outlined text-[20px]">close</span>
        </button>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="px-4 pt-[42px] pb-2.5 flex-1 overflow-y-auto">
          {/* Title */}
          <div className="pl-[52px] pt-2">
            {activeTab === "Working location" ? (
              <div
                className="w-full text-[22px] leading-7 font-normal text-gray-900 dark:text-[#e3e3e3] pb-1"
                style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
              >
                Working location
              </div>
            ) : activeTab === "Appointment schedule" && bookingPages.length > 0 ? (
              <div
                className="w-full min-h-[30px] text-[22px] leading-7 font-normal text-gray-400 dark:text-[rgba(227,227,227,0.38)] bg-black/[0.03] dark:bg-white/[0.04] rounded-sm pb-0.5 cursor-default"
                style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
              >
                {bookingPages[0]?.name || "Default"}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Add title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-full text-[22px] leading-7 font-normal text-gray-900 dark:text-[#e3e3e3] placeholder-gray-500 dark:placeholder-[#9aa0a6] border-b border-gray-300 dark:border-[#5f6368] focus:outline-none bg-transparent pb-1"
                style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                autoFocus
              />
            )}
          </div>

          {/* Tabs */}
          <div className="pl-[52px] flex items-center gap-2 mt-4 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-9 px-1.5 text-[14px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-gray-700 dark:text-[#c4c7c5] hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab Content ─────────────────────────────────────────────── */}
          <div className="flex flex-col text-[14px] text-gray-700 dark:text-[#c4c7c5] px-2">

            {/* ─── Time row (all tabs except Appointment schedule) ────── */}
            {activeTab !== "Appointment schedule" && (
              <div className="flex mt-2 mb-1 py-1 -mx-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] leading-5 pt-0.5">schedule</span>
                <div className="flex-1 min-w-0">
                  {/* Date + time (underlined editable text) */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
                    {/* Date */}
                    <Dropdown
                      open={openDrop === "date"}
                      onClose={() => setOpenDrop(null)}
                      trigger={
                        <button onClick={() => setOpenDrop(openDrop === "date" ? null : "date")} className={underline}>
                          {fmtDate(startTime)}
                        </button>
                      }
                    >
                      <div className="p-3 w-[280px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {miniMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                          <div className="flex gap-1">
                            <button onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1))} className="w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                              <span className="material-icons-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1))} className="w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                              <span className="material-icons-outlined text-[18px]">chevron_right</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                          {["S","M","T","W","T","F","S"].map((d,i)=><div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-y-0.5">
                          {miniDays.map(({d, cur}, i) => {
                            const sel = d.toDateString() === startTime.toDateString();
                            const today = d.toDateString() === new Date().toDateString();
                            return (
                              <button
                                key={i}
                                onClick={() => setDateFromMini(d)}
                                className={`w-8 h-8 mx-auto rounded-full text-xs flex items-center justify-center transition-colors
                                  ${sel ? "bg-google-blue text-white" : today ? "border border-google-blue text-google-blue" : cur ? "text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600" : "text-gray-400 dark:text-gray-600"}`}
                              >
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Dropdown>

                    {!isAllDay && (
                      <>
                        {/* Start time */}
                        <Dropdown
                          open={openDrop === "start"}
                          onClose={() => setOpenDrop(null)}
                          trigger={
                            <button onClick={() => setOpenDrop(openDrop === "start" ? null : "start")} className={underline}>
                              {fmt12(startTime)}
                            </button>
                          }
                        >
                          {TIME_SLOTS.map((s, i) => (
                            <button key={i} onClick={() => setTimeFromSlot(s, "start")}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${s.hours === startTime.getHours() && s.minutes === startTime.getMinutes() ? "bg-gray-100 dark:bg-gray-700 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                              {s.label}
                            </button>
                          ))}
                        </Dropdown>
                        <span className="text-gray-400 dark:text-[#c4c7c5]">–</span>
                        {/* End time */}
                        <Dropdown
                          open={openDrop === "end"}
                          onClose={() => setOpenDrop(null)}
                          trigger={
                            <button onClick={() => setOpenDrop(openDrop === "end" ? null : "end")} className={underline}>
                              {fmt12(endTime)}
                            </button>
                          }
                        >
                          {TIME_SLOTS.map((s, i) => {
                            const candidate = new Date(endTime);
                            candidate.setHours(s.hours, s.minutes, 0, 0);
                            const dur = candidate > startTime ? durationLabel(startTime, candidate) : null;
                            return (
                              <button key={i} onClick={() => setTimeFromSlot(s, "end")}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${s.hours === endTime.getHours() && s.minutes === endTime.getMinutes() ? "bg-gray-100 dark:bg-gray-700 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                {s.label}{dur && <span className="text-gray-400 ml-2">({dur})</span>}
                              </button>
                            );
                          })}
                        </Dropdown>
                      </>
                    )}
                  </div>

                  {/* Time zone · recurrence (compact subtitle) */}
                  <div className="flex items-center mt-1 text-[12px] leading-4 text-gray-500 dark:text-[#c4c7c5]">
                    {activeTab !== "Task" && activeTab !== "Working location" && (
                      <>
                        <span className="cursor-pointer hover:underline">Time zone</span>
                        <span className="px-1 font-bold text-[12px]">·</span>
                      </>
                    )}
                    <Dropdown
                      open={openDrop === "recurrence"}
                      onClose={() => setOpenDrop(null)}
                      trigger={
                        <button onClick={() => setOpenDrop(openDrop === "recurrence" ? null : "recurrence")}
                          className="cursor-pointer hover:underline text-gray-500 dark:text-[#c4c7c5]">
                          {recurrenceLabel}
                        </button>
                      }
                    >
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <button key={opt.label} onClick={() => { setRecurrence(opt.value); setOpenDrop(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${recurrence === opt.value ? "bg-gray-100 dark:bg-gray-700 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                          {opt.label.replace("Weekly", `Weekly on ${dayName}`).replace("Monthly", `Monthly on the last ${dayName}`).replace("Annually", `Annually on ${startTime.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`)}
                        </button>
                      ))}
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-[#444746]">
                        Custom...
                      </button>
                    </Dropdown>
                  </div>
                </div>
              </div>
            )}

            {/* ─── EVENT tab fields ──────────────────────────────────────── */}
            {activeTab === "Event" && (
              <>
                {/* Guests */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showGuests && setShowGuests(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">group</span>
                  {showGuests ? (
                    <input type="text" placeholder="Add guests" value={guests} onChange={(e) => setGuests(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] border-b border-gray-300 dark:border-[#444746] pb-1 mr-2" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add guests</span>}
                </div>
                {/* Meet */}
                <div className="flex items-center min-h-[40px]">
                  <span className="material-icons w-[52px] shrink-0 text-center text-[#1a73e8] text-[20px]">videocam</span>
                  <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add Google Meet video conferencing</span>
                </div>
                {/* Location */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] border-b border-gray-300 dark:border-[#444746] pb-1 mr-2" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add rooms or location</span>}
                </div>
                {/* Description */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">notes</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-lg p-2 resize-none mr-2 my-1" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add description or a Google Drive attachment</span>}
                </div>
              </>
            )}

            {/* ─── TASK tab fields ──────────────────────────────────────── */}
            {activeTab === "Task" && (
              <>
                {/* Deadline */}
                <div className="flex items-center min-h-[40px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">track_changes</span>
                  <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add deadline</span>
                </div>
                {/* Description */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">notes</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-lg p-2 resize-none mr-2 my-1" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add description or a Google Drive attachment</span>}
                </div>
                {/* Task list */}
                <div className="flex items-center min-h-[40px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">format_list_bulleted</span>
                  <button className="inline-flex items-center h-9 pl-4 pr-3 rounded bg-gray-100 dark:bg-[#333537] text-gray-800 dark:text-[#e3e3e3] text-[14px]" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
                    My Tasks
                    <span className="material-icons-outlined text-[20px] ml-3 text-gray-500 dark:text-[#c4c7c5]">arrow_drop_down</span>
                  </button>
                </div>
              </>
            )}

            {/* ─── OUT OF OFFICE tab ────────────────────────────────────── */}
            {activeTab === "Out of office" && (
              <>
                {/* Automatically decline meetings */}
                <label className="flex items-center gap-3 py-2 mt-1 -mx-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <MCheckbox checked={autoDecline} onChange={setAutoDecline} />
                  <span className="text-[14px] leading-5 text-gray-800 dark:text-[#e5e7eb]">Automatically decline meetings</span>
                </label>
                {autoDecline && (
                  <>
                    <div className="ml-[52px] mt-2 flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer text-[14px] leading-5 text-gray-700 dark:text-[#d1d5db] -mx-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                        <MRadio checked={declineScope === "new"} onChange={() => setDeclineScope("new")} />
                        Only new meeting invitations
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-[14px] leading-5 text-gray-700 dark:text-[#d1d5db] -mx-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                        <MRadio checked={declineScope === "all"} onChange={() => setDeclineScope("all")} />
                        New and existing meetings
                      </label>
                    </div>
                    {/* separator */}
                    <div className="ml-[52px] mr-2 mt-3 border-t border-gray-200 dark:border-[#444746]" />
                    {/* Message (filled field, label inside) — aligned with the Public box below */}
                    <div className="ml-[52px] mr-2 mt-3 rounded bg-gray-100 dark:bg-[#333537] px-4 pt-1.5 pb-2">
                      <label className="block text-[11px] leading-4 text-gray-500 dark:text-[#9aa0a6]">Message</label>
                      <input type="text" value={oooMessage} onChange={(e) => setOooMessage(e.target.value)}
                        className="w-full bg-transparent text-[15px] leading-6 text-gray-900 dark:text-[#e3e3e3] focus:outline-none" />
                    </div>
                  </>
                )}
                {/* Visibility */}
                <div className="flex items-center min-h-[44px] mt-1.5">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">lock</span>
                  <button className="inline-flex items-center rounded bg-gray-100 dark:bg-[#333537] text-gray-700 dark:text-[#e3e3e3] text-[14px] leading-6 py-1.5 pl-4 pr-2 hover:bg-gray-200 dark:hover:bg-[#3c4043] transition-colors">
                    Public <span className="material-icons-outlined text-[20px] ml-2 text-gray-500 dark:text-[#c4c7c5]">arrow_drop_down</span>
                  </button>
                  <span className="material-icons-outlined ml-3 text-[20px] text-gray-400 dark:text-[#c4c7c5] cursor-pointer">help_outline</span>
                </div>
              </>
            )}

            {/* ─── FOCUS TIME tab ───────────────────────────────────────── */}
            {activeTab === "Focus time" && (
              <>
                {/* Do not disturb */}
                <label className="flex items-start min-h-[44px] py-1.5 -mx-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <span className="w-[52px] shrink-0 flex justify-center pt-0.5">
                    <MCheckbox checked={doNotDisturb} onChange={setDoNotDisturb} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center text-[14px] leading-5 text-gray-800 dark:text-[#e3e3e3]">
                      <span className="material-icons text-[#f2b8b5] text-[18px] leading-[14px]">do_not_disturb_on</span>
                      <span className="ml-1.5">Do not disturb</span>
                    </div>
                    <div className="text-[12px] leading-[18px] text-gray-500 dark:text-[#c4c7c5]">Mute Chat notifications</div>
                  </div>
                </label>

                {/* Automatically decline meetings */}
                <label className="flex items-center min-h-[40px] py-1.5 -mx-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <span className="w-[52px] shrink-0 flex justify-center">
                    <MCheckbox checked={focusDecline} onChange={setFocusDecline} />
                  </span>
                  <span className="text-[14px] leading-5 text-gray-800 dark:text-[#e3e3e3]">Automatically decline meetings</span>
                </label>

                {/* Location */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] border-b border-gray-300 dark:border-[#444746] pb-1 mr-2" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add rooms or location</span>}
                </div>

                {/* Description */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">subject</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-400 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-lg p-2 resize-none mr-2 my-1" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add description or a Google Drive attachment</span>}
                </div>
              </>
            )}

            {/* ─── WORKING LOCATION tab ─────────────────────────────────── */}
            {activeTab === "Working location" && (
              <>
                {/* Choose a location */}
                <div className="flex items-center min-h-[40px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">location_on</span>
                  <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Choose a location</span>
                </div>
                {/* Quick-pick chips */}
                <div className="flex flex-wrap items-center gap-2 pl-[52px] pt-0.5 pb-1.5">
                  {[{ icon: "home", label: "Home" }, { icon: "business", label: "Office" }].map((loc) => {
                    const sel = workingLoc === loc.label;
                    return (
                      <button key={loc.label} onClick={() => setWorkingLoc(sel ? "" : loc.label)}
                        className={`inline-flex items-center h-9 rounded-full border pl-3.5 pr-5 text-[13px] font-medium transition-colors ${
                          sel
                            ? "border-transparent bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                            : "border-gray-300 dark:border-[#8e918f] text-[#1a73e8] dark:text-[#a8c7fa] hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}>
                        <span className="material-icons-outlined text-[16px] mr-1.5">{loc.icon}</span>
                        {loc.label}
                      </button>
                    );
                  })}
                  <button className="inline-flex items-center h-9 rounded-full border border-gray-300 dark:border-[#8e918f] pl-5 pr-3.5 text-[13px] text-gray-800 dark:text-[#e3e3e3] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    Other locations
                    <span className="material-icons-outlined text-[16px] ml-1.5 text-gray-600 dark:text-[#c4c7c5]">arrow_drop_down</span>
                  </button>
                </div>
              </>
            )}

            {/* ─── APPOINTMENT SCHEDULE tab ──────────────────────────────── */}
            {activeTab === "Appointment schedule" && (
              <>
                {/* Time row (date + time pills) */}
                <div className="flex items-center min-h-[44px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">schedule</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center h-10 px-4 rounded text-[14px] bg-gray-100 dark:bg-[#333537] text-gray-900 dark:text-[#e3e3e3] cursor-pointer">{fmtDate(startTime)}</span>
                    <span className="inline-flex items-center h-10 px-4 rounded text-[14px] bg-gray-100 dark:bg-[#333537] text-gray-900 dark:text-[#e3e3e3] cursor-pointer">{fmt12(startTime)}</span>
                    <span className="text-gray-400 dark:text-[#c4c7c5] px-0.5">–</span>
                    <span className="inline-flex items-center h-10 px-4 rounded text-[14px] bg-gray-100 dark:bg-[#333537] text-gray-900 dark:text-[#e3e3e3] cursor-pointer">{fmt12(endTime)}</span>
                  </div>
                </div>

                {bookingPages.length === 0 ? (
                  <>
                    {/* Empty state — create your first booking page */}
                    <div className="flex items-start mt-5 mb-3 pt-4 pr-4 pb-2 pl-2.5 rounded-lg border border-gray-200 dark:border-[#444746] bg-gray-50 dark:bg-[#131314]">
                      <span className="material-icons-outlined text-[20px] text-gray-500 dark:text-[#8e918f] pr-0.5 shrink-0">info</span>
                      <div className="ml-3 min-w-0">
                        <div className="text-[14px] leading-5 text-gray-800 dark:text-[#e3e3e3]" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
                          Create a booking page you can share with others so they can book time with you themselves
                        </div>
                        <div className="flex items-center -ml-3 pt-1">
                          <a href="https://support.google.com/calendar?p=appointment_schedule" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center h-8 px-3 rounded-full text-[14px] font-medium text-[#1a73e8] dark:text-[#a8c7fa] hover:bg-blue-50 dark:hover:bg-white/5 transition-colors">
                            See how it works
                          </a>
                          <a href="https://support.google.com/calendar?p=appointment_schedule" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center h-8 px-3 ml-2 rounded-full text-[14px] font-medium text-[#1a73e8] dark:text-[#a8c7fa] hover:bg-blue-50 dark:hover:bg-white/5 transition-colors">
                            Learn more
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="ml-[52px] mr-2 my-2.5 border-t border-gray-200 dark:border-[#444746]" />
                  </>
                ) : (
                  <>
                    {/* Description + Learn more */}
                    <p className="pl-[52px] pr-2 pt-3.5 pb-2 text-[14px] leading-5 text-gray-500 dark:text-[#ababab]" style={{ letterSpacing: "0.3px" }}>
                      Add availability or create a new appointment schedule, allowing you to share a booking page with others.{" "}
                      <span className="text-[#1a73e8] dark:text-[#a8c7fa] underline cursor-pointer">Learn more</span>
                    </p>

                    {/* Divider */}
                    <div className="ml-[52px] mr-2 my-2.5 border-t border-gray-200 dark:border-[#444746]" />

                    {/* Add to existing schedule */}
                    <label className="flex items-center min-h-[36px] cursor-pointer">
                      <span className="w-[52px] shrink-0 flex justify-center">
                        <MRadio checked={apptChoice === "existing"} onChange={() => setApptChoice("existing")} />
                      </span>
                      <span className="text-[14px] text-gray-800 dark:text-[#e3e3e3]" style={{ letterSpacing: "0.2px" }}>Add availability to an existing schedule</span>
                    </label>

                    {/* Schedule selector + edit / delete */}
                    {apptChoice === "existing" && (
                      <div className="flex items-center pl-[52px] gap-2 mt-1 mb-2.5">
                        <button className="inline-flex items-center h-10 rounded pl-3 pr-3 max-w-[280px] bg-gray-100 dark:bg-[#333537] hover:bg-gray-200 dark:hover:bg-[#3c4043] transition-colors">
                          <span className="material-icons-outlined text-[22px] text-gray-500 dark:text-[#c4c7c5] mr-3">grid_view</span>
                          <span className="text-[14px] text-gray-900 dark:text-[#e3e3e3] truncate" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>{bookingPages[0]?.name}</span>
                          <span className="material-icons-outlined text-[22px] text-gray-500 dark:text-[#c4c7c5] ml-3">arrow_drop_down</span>
                        </button>
                        <button title="Edit" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                          <span className="material-icons-outlined text-[20px] text-gray-500 dark:text-[#c4c7c5]">edit</span>
                        </button>
                        <button title="Delete" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                          <span className="material-icons-outlined text-[20px] text-gray-500 dark:text-[#c4c7c5]">delete</span>
                        </button>
                      </div>
                    )}

                    {/* Create a new schedule */}
                    <label className="flex items-center min-h-[36px] cursor-pointer">
                      <span className="w-[52px] shrink-0 flex justify-center">
                        <MRadio checked={apptChoice === "new"} onChange={() => setApptChoice("new")} />
                      </span>
                      <span className="text-[14px] text-gray-800 dark:text-[#e3e3e3]" style={{ letterSpacing: "0.2px" }}>Create a new appointment schedule</span>
                    </label>

                    {/* Divider */}
                    <div className="ml-[52px] mr-2 my-2.5 border-t border-gray-200 dark:border-[#444746]" />
                  </>
                )}
              </>
            )}

            {/* ─── Calendar info (hidden for Out of office) ──────────────── */}
            {activeTab !== "Out of office" && (() => {
              const noSubtitle = activeTab === "Working location" || activeTab === "Appointment schedule";
              return (
                <div className="flex items-center min-h-[44px] mt-1">
                  <span className={`material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] ${noSubtitle ? "" : "self-start mt-3"}`}>calendar_today</span>
                  <div>
                    <div className="flex items-center gap-2 text-[14px] text-gray-800 dark:text-[#e3e3e3]">
                      {calendars[0]?.name || "My Calendar"}
                      {activeTab !== "Appointment schedule" && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calendars[0]?.color || (activeTab === "Task" ? "#4285f4" : "#039be5") }} />
                      )}
                    </div>
                    {!noSubtitle && (
                      <div className="text-[12px] leading-4 text-gray-500 dark:text-[#c4c7c5]">
                        {activeTab === "Task" ? "Free \u00b7 Private \u00b7 Do not disturb is OFF"
                          : "Busy \u00b7 Default visibility \u00b7 Notify 10 minutes before"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {(activeTab === "Focus time" || activeTab === "Out of office") && (
              <div className="flex items-center text-[12px] text-gray-500 dark:text-[#c4c7c5] mt-1 pl-[52px]">
                Availability might be shown in other Google apps
                <span className="material-icons-outlined text-[16px] ml-1.5 cursor-pointer">help_outline</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-5 pt-2 pb-5">
          {isEditing && (
            <button onClick={handleDelete}
              className="w-9 h-9 mr-auto rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              title="Delete">
              <span className="material-icons-outlined text-gray-500 dark:text-[#c4c7c5] text-[20px]">delete</span>
            </button>
          )}
          {activeTab === "Event" && (
            <button
              onClick={() => onMoreOptions?.({ title, startTime, endTime, location, description })}
              className="text-blue-600 dark:text-[#a8c7fa] hover:bg-blue-50 dark:hover:bg-white/5 font-medium text-[14px] px-3 h-10 rounded-full transition-colors"
            >
              More options
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white dark:bg-[#a8c7fa] dark:hover:bg-[#bdd5fb] dark:text-[#062e6f] font-medium text-[14px] px-6 min-w-[64px] h-10 rounded-full transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditing ? "Save" : activeTab === "Appointment schedule" ? (bookingPages.length > 0 && apptChoice === "existing" ? "Add to existing schedule" : "Create appointment schedule") : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

export default EventPopover;
