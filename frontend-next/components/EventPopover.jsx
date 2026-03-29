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
        <div className="absolute z-[60] mt-1 bg-white dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.24)] py-1 max-h-48 overflow-auto min-w-[200px] animate-fadeIn">
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

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
function EventPopover({ x, y, initialDate, editEvent, onClose, onMoreOptions, onTitleChange, onTimeChange, onSaved }) {
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
  const [workingLoc, setWorkingLoc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inline expand states
  const [showLocation, setShowLocation] = useState(!!editEvent?.location);
  const [showDescription, setShowDescription] = useState(!!editEvent?.description);
  const [showGuests, setShowGuests] = useState(false);

  // Dropdown visibility
  const [openDrop, setOpenDrop] = useState(null);

  const popoverRef = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

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
    if (activeTab === "Working location" && !title) setTitle("Working location");
  }, [activeTab]);

  // Position popover on screen
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    let cx = x + 10, cy = y + 10;
    if (cx + rect.width > window.innerWidth) cx = window.innerWidth - rect.width - 20;
    if (cy + rect.height > window.innerHeight) cy = window.innerHeight - rect.height - 20;
    setPos({ left: Math.max(20, cx), top: Math.max(20, cy) });
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={popoverRef}
        className="fixed z-50 bg-white dark:bg-[#303134] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.28)] w-[480px] flex flex-col font-sans animate-fadeIn"
        style={{ left: pos.left, top: pos.top, maxHeight: "calc(100vh - 40px)" }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2 rounded-t-2xl bg-[#f0f4f9] dark:bg-[#3c4043]">
          <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[20px]">drag_handle</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
            <span className="material-icons-outlined text-gray-500 dark:text-gray-400 text-[20px]">close</span>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-2 flex-1 overflow-y-auto">
          {/* Title */}
          <input
            type="text"
            placeholder="Add title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full text-[22px] font-normal text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border-b-2 border-blue-500 focus:outline-none bg-transparent pb-1 mb-4"
            autoFocus
          />

          {/* Tabs */}
          <div className="flex gap-1 mb-5 overflow-x-auto no-scrollbar pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1.5 px-3 text-[13px] font-medium rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab Content ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 text-[14px] text-gray-700 dark:text-gray-300">

            {/* ─── Time row (all tabs except Appointment schedule) ────── */}
            {activeTab !== "Appointment schedule" && (
              <div className="flex items-start gap-4">
                <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px] mt-1">schedule</span>
                <div className="flex-1">
                  {/* Date + time pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Date pill */}
                    <Dropdown
                      open={openDrop === "date"}
                      onClose={() => setOpenDrop(null)}
                      trigger={
                        <button onClick={() => setOpenDrop(openDrop === "date" ? null : "date")} className={pill}>
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
                        {/* Start time pill */}
                        <Dropdown
                          open={openDrop === "start"}
                          onClose={() => setOpenDrop(null)}
                          trigger={
                            <button onClick={() => setOpenDrop(openDrop === "start" ? null : "start")} className={pill}>
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
                        <span className="text-gray-400">–</span>
                        {/* End time pill */}
                        <Dropdown
                          open={openDrop === "end"}
                          onClose={() => setOpenDrop(null)}
                          trigger={
                            <button onClick={() => setOpenDrop(openDrop === "end" ? null : "end")} className={pill}>
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

                  {/* All day + timezone + recurrence */}
                  <div className="flex items-center gap-3 mt-2 text-[13px]">
                    {(activeTab === "Event" || activeTab === "Focus time") && (
                      <>
                        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-400">
                          <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-400 dark:border-gray-500 accent-blue-600" />
                          All day
                        </label>
                        <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Time zone</span>
                      </>
                    )}
                  </div>

                  {/* Recurrence dropdown */}
                  <div className="mt-2">
                    <Dropdown
                      open={openDrop === "recurrence"}
                      onClose={() => setOpenDrop(null)}
                      trigger={
                        <button onClick={() => setOpenDrop(openDrop === "recurrence" ? null : "recurrence")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] bg-[#e8eaed]/60 dark:bg-[#3c4043] hover:bg-[#d3d5d9] dark:hover:bg-[#4a4d51] text-gray-700 dark:text-gray-300 transition-colors">
                          {recurrenceLabel}
                          <span className="material-icons-outlined text-[16px]">arrow_drop_down</span>
                        </button>
                      }
                    >
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <button key={opt.label} onClick={() => { setRecurrence(opt.value); setOpenDrop(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${recurrence === opt.value ? "bg-gray-100 dark:bg-gray-700 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                          {opt.label.replace("Weekly", `Weekly on ${dayName}`).replace("Monthly", `Monthly on the last ${dayName}`).replace("Annually", `Annually on ${startTime.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`)}
                        </button>
                      ))}
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
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
                <div className="flex items-center gap-4 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1" onClick={() => !showGuests && setShowGuests(true)}>
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">group_add</span>
                  {showGuests ? (
                    <input type="text" placeholder="Add guests" value={guests} onChange={(e) => setGuests(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-1" />
                  ) : <span className="text-gray-600 dark:text-gray-400">Add guests</span>}
                </div>
                {/* Meet */}
                <div className="flex items-center gap-4 py-1">
                  <span className="material-icons text-blue-500 text-[22px]">videocam</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Add Google Meet video conferencing</span>
                </div>
                {/* Location */}
                <div className="flex items-center gap-4 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-1" />
                  ) : <span className="text-gray-600 dark:text-gray-400">Add rooms or location</span>}
                </div>
                {/* Description */}
                <div className="flex items-start gap-4 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px] mt-0.5">subject</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 rounded-lg p-2 resize-none" />
                  ) : <span className="text-gray-600 dark:text-gray-400">Add description or a Google Drive attachment</span>}
                </div>
              </>
            )}

            {/* ─── TASK tab fields ──────────────────────────────────────── */}
            {activeTab === "Task" && (
              <>
                <div className="flex items-center gap-4 py-1.5">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">assignment_turned_in</span>
                  <span className="text-gray-600 dark:text-gray-400">Add deadline</span>
                </div>
                <div className="flex items-start gap-4 py-1.5">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px] mt-0.5">subject</span>
                  <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 rounded-lg p-3 resize-none" />
                </div>
                <div className="flex items-center gap-4 py-1.5">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">list</span>
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-[#e8eaed]/60 dark:bg-[#3c4043] text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    My Tasks <span className="material-icons-outlined text-[16px]">arrow_drop_down</span>
                  </span>
                </div>
              </>
            )}

            {/* ─── OUT OF OFFICE tab ────────────────────────────────────── */}
            {activeTab === "Out of office" && (
              <>
                <div className="flex items-center gap-4 py-1.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={autoDecline} onChange={(e) => setAutoDecline(e.target.checked)}
                      className="w-5 h-5 rounded accent-blue-600" />
                    <span className="text-gray-800 dark:text-gray-200 text-sm">Automatically decline meetings</span>
                  </label>
                </div>
                {autoDecline && (
                  <div className="ml-12 flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="radio" name="decline" checked={declineScope === "new"} onChange={() => setDeclineScope("new")} className="w-4 h-4 accent-blue-600" />
                      Only new meeting invitations
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="radio" name="decline" checked={declineScope === "all"} onChange={() => setDeclineScope("all")} className="w-4 h-4 accent-blue-600" />
                      New and existing meetings
                    </label>
                    <div className="mt-1">
                      <label className="text-[12px] text-gray-500 dark:text-gray-400">Message</label>
                      <input type="text" value={oooMessage} onChange={(e) => setOooMessage(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#e8eaed]/40 dark:bg-[#3c4043] text-sm text-gray-800 dark:text-gray-200 focus:outline-none border border-transparent focus:border-blue-500" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 py-1.5 mt-1">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">lock</span>
                  <span className="px-3 py-1.5 rounded-lg text-sm bg-[#e8eaed]/60 dark:bg-[#3c4043] text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Public <span className="material-icons-outlined text-[16px]">arrow_drop_down</span>
                  </span>
                </div>
              </>
            )}

            {/* ─── FOCUS TIME tab ───────────────────────────────────────── */}
            {activeTab === "Focus time" && (
              <>
                <div className="flex items-center gap-4 py-1.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={doNotDisturb} onChange={(e) => setDoNotDisturb(e.target.checked)}
                      className="w-5 h-5 rounded accent-blue-600" />
                    <div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-red-500 text-[16px]">&#9940;</span> Do not disturb
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400">Mute Chat notifications</div>
                    </div>
                  </label>
                </div>
                <div className="flex items-center gap-4 py-1.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Automatically decline meetings</span>
                  </label>
                </div>
                {/* Location */}
                <div className="flex items-center gap-4 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-transparent text-sm focus:outline-none text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-1" />
                  ) : <span className="text-gray-600 dark:text-gray-400">Add rooms or location</span>}
                </div>
                {/* Description */}
                <div className="flex items-start gap-4 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg px-1 -mx-1" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px] mt-0.5">subject</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-[#e8eaed]/40 dark:bg-[#3c4043] text-sm focus:outline-none text-gray-900 dark:text-gray-100 rounded-lg p-2 resize-none" />
                  ) : <span className="text-gray-600 dark:text-gray-400">Add description or a Google Drive attachment</span>}
                </div>
              </>
            )}

            {/* ─── WORKING LOCATION tab ─────────────────────────────────── */}
            {activeTab === "Working location" && (
              <>
                <div className="flex items-center gap-4 py-1.5">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">location_on</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Choose a location</span>
                </div>
                <div className="flex gap-2 ml-10">
                  {[{ icon: "home", label: "Home" }, { icon: "business", label: "Office" }].map((loc) => (
                    <button key={loc.label} onClick={() => setWorkingLoc(loc.label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${workingLoc === loc.label ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                      <span className="material-icons-outlined text-[18px]">{loc.icon}</span>
                      {loc.label}
                    </button>
                  ))}
                  <button className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Other locations <span className="material-icons-outlined text-[16px]">arrow_drop_down</span>
                  </button>
                </div>
              </>
            )}

            {/* ─── APPOINTMENT SCHEDULE tab ──────────────────────────────── */}
            {activeTab === "Appointment schedule" && (
              <>
                {/* Time row for appointment */}
                <div className="flex items-start gap-4">
                  <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px] mt-1">schedule</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={pill}>{fmtDate(startTime)}</span>
                    <span className={pill}>{fmt12(startTime)}</span>
                    <span className="text-gray-400">–</span>
                    <span className={pill}>{fmt12(endTime)}</span>
                  </div>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 ml-10">
                  Add availability or create a new appointment schedule, allowing you to share a booking page with others.
                </p>
                <div className="ml-10 flex flex-col gap-3 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="appt" defaultChecked className="w-4 h-4 accent-blue-600" />
                    Add availability to an existing schedule
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="appt" className="w-4 h-4 accent-blue-600" />
                    Create a new appointment schedule
                  </label>
                </div>
              </>
            )}

            {/* ─── Calendar info (always) ────────────────────────────────── */}
            <div className="flex items-center gap-4 mt-2 py-1.5">
              <span className="material-icons-outlined text-gray-400 dark:text-gray-500 text-[22px]">calendar_today</span>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {calendars[0]?.name || "My Calendar"}
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendars[0]?.color || "#1a73e8" }} />
                </div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400">
                  {activeTab === "Out of office" ? "Free \u00b7 Private \u00b7 Do not disturb is OFF"
                    : activeTab === "Focus time" ? "Busy \u00b7 Default visibility \u00b7 Notify 10 minutes before"
                    : "Busy \u00b7 Default visibility \u00b7 Notify 10 minutes before"}
                </div>
              </div>
            </div>

            {(activeTab === "Focus time" || activeTab === "Out of office") && (
              <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                Availability might be shown in other Google apps &#9432;
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1">
            {isEditing && (
              <button onClick={handleDelete}
                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                title="Delete">
                <span className="material-icons-outlined text-gray-500 dark:text-gray-400 text-[20px]">delete</span>
              </button>
            )}
            {activeTab === "Event" && (
              <button
                onClick={() => onMoreOptions?.({ title, startTime, endTime, location, description })}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium text-[14px] px-4 py-2 rounded-full transition-colors"
              >
                More options
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#c2e7ff] hover:bg-[#a8d8f8] dark:bg-[#004a77] dark:hover:bg-[#005a91] text-[#001d35] dark:text-[#c2e7ff] font-medium text-[14px] px-6 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditing ? "Save" : activeTab === "Appointment schedule" ? "Add to existing schedule" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

export default EventPopover;
