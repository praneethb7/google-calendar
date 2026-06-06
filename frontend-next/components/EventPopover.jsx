"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCalendarStore } from "@/store/useCalendarStore";

// ── Time helpers ─────────────────────────────────────────────────────────────
const fmt12 = (d) =>
  d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, "")
    .toLowerCase();
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

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function ordinalForDate(date) {
  const n = Math.ceil(date.getDate() / 7);
  return ["first", "second", "third", "fourth", "fifth"][n - 1] || "last";
}

function generateMeetCode() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const rand = (n) =>
    Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

function buildRecurrenceOptions(date) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const dayCode = WEEKDAY_CODES[date.getDay()];
  return [
    { label: "Does not repeat", value: null },
    { label: "Daily", value: "FREQ=DAILY;INTERVAL=1" },
    { label: `Weekly on ${dayName}`, value: `FREQ=WEEKLY;INTERVAL=1;BYDAY=${dayCode}` },
    { label: `Monthly on the ${ordinalForDate(date)} ${dayName}`, value: `FREQ=MONTHLY;INTERVAL=1;BYDAY=${ordinalForDate(date) === "last" ? "-1" : Math.ceil(date.getDate() / 7)}${dayCode}` },
    { label: `Annually on ${monthDay}`, value: "FREQ=YEARLY;INTERVAL=1" },
    { label: "Every weekday (Monday to Friday)", value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
  ];
}

// ── Dropdown component ───────────────────────────────────────────────────────
function DriveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 87.3 78" aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

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

function TimeMenu({ value, label, onSelect, showDurationFrom }) {
  const selectedRef = useRef(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center" });
    }
  }, [value]);

  return (
    <div
      className="absolute left-0 top-full z-[70] mt-2 w-[188px] h-[200px] bg-[#131314] text-[#e3e3e3] rounded-sm shadow-[0_4px_5px_rgba(0,0,0,0.14),0_1px_10px_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.2)] overflow-y-scroll overflow-x-hidden gc-time-menu"
      aria-label={label}
    >
      {TIME_SLOTS.map((slot) => {
        const selected = slot.hours === value.getHours() && slot.minutes === value.getMinutes();
        const candidate = new Date(value);
        candidate.setHours(slot.hours, slot.minutes, 0, 0);
        const dur = showDurationFrom && candidate > showDurationFrom ? durationLabel(showDurationFrom, candidate) : null;
        return (
          <button
            key={`${slot.hours}:${slot.minutes}`}
            ref={selected ? selectedRef : null}
            onClick={() => onSelect(slot)}
            className={`block w-[180px] min-h-10 px-[30px] text-left text-[14px] leading-10 font-normal ${
              selected ? "bg-[#333537]" : "hover:bg-[#2b2c2e]"
            }`}
            style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
          >
            {slot.label}
            {dur && <span className="ml-2 text-[#c4c7c5]">({dur})</span>}
          </button>
        );
      })}
    </div>
  );
}

function MiniDatePicker({ month, days, selectedDate, onPrev, onNext, onSelect, anchorRef }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const menuH = 280;
      const below = window.innerHeight - r.bottom;
      const top = below >= menuH + 8 ? r.bottom + 8 : Math.max(8, r.top - menuH - 8);
      setPos({ left: r.left, top });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      data-event-picker-root
      className="fixed z-[100] w-[283px] min-h-[250px] bg-[#131314] text-[#c4c7c5] rounded-sm shadow-[0_4px_5px_rgba(0,0,0,0.14),0_1px_10px_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.2)] select-none"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="w-[283px] min-h-[250px] pt-1.5 pr-[14px] pb-4 pl-[19px]">
        <div className="flex items-center w-[243px] min-h-8 ml-1 mr-[3px]">
          <span
            className="flex-1 pl-[5px] text-[#e3e3e3] text-[14px] leading-5 font-medium"
            style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
          >
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <div className="flex items-center w-[54px] min-h-[25px]">
            <button
              onClick={onPrev}
              className="inline-flex w-6 h-6 mr-1.5 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Previous month"
            >
              <span className="material-icons-outlined text-[18px] text-[#c4c7c5]">chevron_left</span>
            </button>
            <button
              onClick={onNext}
              className="inline-flex w-6 h-6 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Next month"
            >
              <span className="material-icons-outlined text-[18px] text-[#c4c7c5]">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="mt-1 w-[243px] grid grid-cols-7 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="h-[34px] flex items-center justify-center text-[10px] leading-5 font-medium text-[#c4c7c5]"
              style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
            >
              {day}
            </div>
          ))}
          {days.map(({ d, cur }, index) => {
            const selected = d.toDateString() === selectedDate.toDateString();
            const today = d.toDateString() === new Date().toDateString();
            return (
              <button
                key={`${d.toISOString()}-${index}`}
                onClick={() => onSelect(d)}
                className="h-7 flex items-center justify-center"
                aria-label={d.toDateString()}
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[13px] leading-6 font-normal ${
                    selected
                      ? "bg-[#a8c7fa] text-[#062e6f]"
                      : today
                        ? "border border-[#c4c7c5] text-[#e3e3e3]"
                        : cur
                          ? "text-[#e3e3e3] hover:bg-white/10"
                          : "text-[#c4c7c5] hover:bg-white/10"
                  }`}
                  style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RecurrenceMenu({ options, selectedValue, onSelect, onCustom, anchorRef }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      // Open upward if it would overflow the bottom of the viewport.
      const menuH = 292;
      const below = window.innerHeight - r.bottom;
      const top = below >= menuH + 8 ? r.bottom + 4 : Math.max(8, r.top - menuH - 4);
      setPos({ left: r.left, top });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      data-event-picker-root
      className="fixed z-[100] h-[285px] w-[249px] min-w-[249px] max-w-[249px] overflow-hidden rounded bg-[#1e1f20] text-[#e3e3e3] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]"
      style={{ left: pos.left, top: pos.top }}
    >
      <ul
        className="w-[249px] h-[292px] rounded border border-transparent py-1.5 text-[16px] leading-4"
        aria-label="Recurrence"
        style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}
      >
        {options.map((opt) => {
          const selected = (opt.value || null) === (selectedValue || null);
          return (
            <li key={opt.label}>
              <button
                onClick={() => onSelect(opt.value)}
                className={`relative flex h-10 min-h-10 w-[249px] items-center overflow-hidden px-4 text-left text-[#e3e3e3] ${
                  selected ? "bg-[#444746] rounded-lg ring-[3px] ring-[#7fcfff]" : "hover:bg-white/[0.08]"
                }`}
                aria-label={opt.label}
              >
                <span className="block truncate text-[14px] leading-5">{opt.label}</span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            onClick={onCustom}
            className="flex h-10 min-h-10 w-[249px] items-center overflow-hidden px-4 text-left text-[#e3e3e3] hover:bg-white/[0.08]"
            aria-label="Custom..."
          >
            <span className="block truncate text-[14px] leading-5">Custom...</span>
          </button>
        </li>
      </ul>
    </div>,
    document.body,
  );
}

function VisibilityMenu({ anchorRef, options, value, onSelect }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const menuH = options.length * 40 + 16;
      const below = window.innerHeight - r.bottom;
      const top = below >= menuH + 8 ? r.bottom + 4 : Math.max(8, r.top - menuH - 4);
      setPos({ left: r.left, top });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, options.length]);

  if (!pos) return null;

  return createPortal(
    <div
      data-event-picker-root
      className="fixed z-[100] w-[163px] overflow-hidden rounded bg-[#1e1f20] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]"
      style={{ left: pos.left, top: pos.top }}
    >
      <ul className="py-2" aria-label="Visibility">
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <li key={opt}>
              <button
                onClick={() => onSelect(opt)}
                className={`relative flex h-10 min-h-10 w-[163px] items-center overflow-hidden px-4 text-left text-[#e3e3e3] ${
                  selected ? "bg-[#444746] rounded-lg ring-[3px] ring-[#7fcfff]" : "hover:bg-white/[0.08]"
                }`}
                aria-label={opt}
              >
                <span className="block truncate text-[14px] leading-5">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}

function OtherLocationsMenu({ anchorRef, onSelect, selected }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const menuH = 96;
      const below = window.innerHeight - r.bottom;
      const top = below >= menuH + 8 ? r.bottom + 4 : Math.max(8, r.top - menuH - 4);
      setPos({ left: r.left, top });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  const items = [
    {
      label: "Another office",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: "#c2e7ff" }} aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M4 4H14V8H20V20H4V4ZM12 6H6V8H12V6ZM12 10H6V12H12V10ZM6 14H12V16H6V14ZM18 14H14V16H18V14ZM14 10H18V12H14V10Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Another location",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: "#c2e7ff" }} aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
  ];

  return createPortal(
    <div
      data-event-picker-root
      className="fixed z-[100] w-[165px] overflow-hidden rounded bg-[#1e1f20] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]"
      style={{ left: pos.left, top: pos.top }}
    >
      <ul className="py-2" aria-label="Other locations">
        {items.map((it) => (
          <li key={it.label}>
            <button
              onClick={() => onSelect(it.label)}
              className={`flex w-[165px] min-h-10 items-center gap-4 px-3 py-2 text-left ${
                selected === it.label ? "bg-[#444746]" : "hover:bg-white/[0.08]"
              }`}
            >
              <span className="shrink-0 flex h-5 w-5 items-center justify-center">{it.icon}</span>
              <span className="block truncate text-[14px] leading-5 text-[#e3e3e3]" style={{ fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif' }}>
                {it.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}

function CustomRecurrenceDialog({ initialDate, onCancel, onDone }) {
  const [interval, setInterval] = useState(1);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [selectedDays, setSelectedDays] = useState(() => [WEEKDAY_CODES[initialDate.getDay()]]);
  const [ends, setEnds] = useState("NEVER");
  const [count, setCount] = useState(13);
  const untilDate = useMemo(() => {
    const d = new Date(initialDate);
    d.setMonth(d.getMonth() + 3);
    return d;
  }, [initialDate]);

  const setIntervalClamped = (value) => setInterval(Math.max(1, Number(value) || 1));
  const toggleDay = (code) => {
    setSelectedDays((prev) => {
      if (prev.includes(code) && prev.length > 1) return prev.filter((d) => d !== code);
      if (!prev.includes(code)) return [...prev, code];
      return prev;
    });
  };

  const buildRule = () => {
    const parts = [`FREQ=${frequency}`, `INTERVAL=${interval}`];
    if (frequency === "WEEKLY" && selectedDays.length) parts.push(`BYDAY=${selectedDays.join(",")}`);
    if (ends === "COUNT") parts.push(`COUNT=${count}`);
    if (ends === "ON") {
      const yyyy = untilDate.getFullYear();
      const mm = String(untilDate.getMonth() + 1).padStart(2, "0");
      const dd = String(untilDate.getDate()).padStart(2, "0");
      parts.push(`UNTIL=${yyyy}${mm}${dd}T235959Z`);
    }
    return parts.join(";");
  };

  return (
    <div className="flex h-[492px] w-[340px] flex-col overflow-hidden rounded-[28px] bg-[#282a2c] text-[#c4c7c5] shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_8px_3px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <h2
        className="shrink-0 px-6 pt-6 pb-4 text-[24px] leading-8 font-normal text-[#e3e3e3]"
        style={{ fontFamily: '"Google Sans Flex", "Google Sans", Roboto, Arial, sans-serif' }}
      >
        Custom recurrence
      </h2>

      {/* Body */}
      <div
        className="flex-1 overflow-hidden px-6 pb-5 text-[14px] leading-5"
        style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
      >
        <div className="flex flex-nowrap items-center gap-2 py-2">
          <span className="shrink-0 whitespace-nowrap text-[14px] text-[#c4c7c5]">Repeat every</span>
          <div className="flex shrink-0 items-center gap-0.5">
            <input
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setIntervalClamped(e.target.value)}
              className="h-9 w-[44px] rounded bg-[#333537] px-2 text-center text-[14px] text-[#e3e3e3] outline-none focus:border-b-2 focus:border-[#a8c7fa] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Interval"
            />
            <div className="flex h-9 w-4 flex-col justify-center">
              <button onClick={() => setIntervalClamped(interval + 1)} className="flex h-[18px] items-center text-[#c4c7c5]" aria-label="Increment">
                <span className="material-icons-outlined text-[16px] leading-none">arrow_drop_up</span>
              </button>
              <button onClick={() => setIntervalClamped(interval - 1)} className="flex h-[18px] items-center text-[#c4c7c5]" aria-label="Decrement">
                <span className="material-icons-outlined text-[16px] leading-none">arrow_drop_down</span>
              </button>
            </div>
          </div>
          <div className="relative shrink-0">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="h-9 w-[112px] appearance-none rounded bg-[#333537] pl-3 pr-8 text-[14px] text-[#e3e3e3] outline-none"
              aria-label="Frequency"
            >
              <option value="DAILY">day</option>
              <option value="WEEKLY">week</option>
              <option value="MONTHLY">month</option>
              <option value="YEARLY">year</option>
            </select>
            <span className="material-icons-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[20px] text-[#c4c7c5]">
              arrow_drop_down
            </span>
          </div>
        </div>

        {frequency === "WEEKLY" && (
          <>
            <div className="pt-2 text-[12px] text-[#c4c7c5]">Repeat on</div>
            <div className="-ml-1 flex py-2">
              {WEEKDAY_CODES.map((code, index) => {
                const selected = selectedDays.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggleDay(code)}
                    className={`mx-1 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-medium ${
                      selected ? "bg-[#a8c7fa] text-[#062e6f]" : "bg-[#333537] text-[#a8c7fa] hover:bg-[#3a3b3d]"
                    }`}
                  >
                    {WEEKDAY_SHORT[index]}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="pt-2 text-[14px] text-[#c4c7c5]">Ends</div>
        <div className="pt-1">
          <label onClick={() => setEnds("NEVER")} className="flex h-12 items-center gap-5 text-[14px] text-[#c4c7c5] cursor-pointer">
            <MRadio checked={ends === "NEVER"} onChange={() => setEnds("NEVER")} />
            Never
          </label>
          <label onClick={() => setEnds("ON")} className="flex h-12 items-center gap-5 text-[14px] text-[#c4c7c5] cursor-pointer">
            <MRadio checked={ends === "ON"} onChange={() => setEnds("ON")} />
            On
            <button
              type="button"
              disabled={ends !== "ON"}
              className={`ml-3 h-10 w-[104px] rounded px-3 text-left ${ends === "ON" ? "bg-[#333537] text-[#e3e3e3]" : "bg-[#333537] text-[#8e918f]"}`}
            >
              {untilDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </button>
          </label>
          <label onClick={() => setEnds("COUNT")} className="flex h-12 items-center gap-5 text-[14px] text-[#c4c7c5] cursor-pointer">
            <MRadio checked={ends === "COUNT"} onChange={() => setEnds("COUNT")} />
            After
            <div className="flex items-center gap-0.5">
              <div className={`flex h-9 w-[140px] items-center rounded bg-[#333537] px-3 ${ends === "COUNT" ? "text-[#e3e3e3]" : "text-[#8e918f]"}`}>
                <input
                  type="number"
                  min="1"
                  value={count}
                  disabled={ends !== "COUNT"}
                  onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-8 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="ml-3">occurrences</span>
              </div>
              <div className="flex h-9 w-4 flex-col justify-center">
                <button
                  type="button"
                  disabled={ends !== "COUNT"}
                  onClick={(e) => { e.stopPropagation(); setCount((c) => c + 1); }}
                  className="flex h-[18px] items-center text-[#c4c7c5] disabled:text-[#5f6368]"
                  aria-label="Increment occurrences"
                >
                  <span className="material-icons-outlined text-[16px] leading-none">arrow_drop_up</span>
                </button>
                <button
                  type="button"
                  disabled={ends !== "COUNT"}
                  onClick={(e) => { e.stopPropagation(); setCount((c) => Math.max(1, c - 1)); }}
                  className="flex h-[18px] items-center text-[#c4c7c5] disabled:text-[#5f6368]"
                  aria-label="Decrement occurrences"
                >
                  <span className="material-icons-outlined text-[16px] leading-none">arrow_drop_down</span>
                </button>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex min-h-[52px] shrink-0 items-center justify-end gap-2 px-6 pb-5">
        <button onClick={onCancel} className="h-10 min-w-[64px] rounded-[20px] px-3 text-[14px] font-medium text-[#a8c7fa] hover:bg-white/[0.08]">
          Cancel
        </button>
        <button
          onClick={() => onDone(buildRule())}
          className="h-10 min-w-[64px] rounded-[20px] bg-[#a8c7fa] px-6 text-[14px] font-medium text-[#062e6f] hover:bg-[#bdd5fb]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

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
  const [meetLink, setMeetLink] = useState(editEvent?.meet_link || null);
  const [taskLists] = useState(["My Tasks", "Work", "Personal", "Shopping"]);
  const [selectedTaskList, setSelectedTaskList] = useState("My Tasks");
  const [visibility, setVisibility] = useState(editEvent?.visibility || "Public");
  const openDrive = () => window.open("https://drive.google.com", "_blank", "noopener,noreferrer");
  const [isAllDay, setIsAllDay] = useState(editEvent?.is_all_day || false);
  const [recurrence, setRecurrence] = useState(editEvent?.recurrence_rule || null);
  const [autoDecline, setAutoDecline] = useState(true);
  const [declineScope, setDeclineScope] = useState("all");
  const [oooMessage, setOooMessage] = useState("Declined because I am out of office");
  const [doNotDisturb, setDoNotDisturb] = useState(true);
  const [focusDecline, setFocusDecline] = useState(false);
  const [focusDeclineScope, setFocusDeclineScope] = useState("all");
  const [focusMessage, setFocusMessage] = useState("Declined because I am in focus time");
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
  const [eventTimeExpanded, setEventTimeExpanded] = useState(false);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);

  const popoverRef = useRef(null);
  const recurBtnRef = useRef(null);
  const visBtnRef = useRef(null);
  const otherLocBtnRef = useRef(null);
  const dateBtnRef = useRef(null);
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: x, top: y };
    const grid = document.getElementById("calendar-grid-area");
    const area = grid
      ? grid.getBoundingClientRect()
      : { left: 0, width: window.innerWidth };
    return {
      left: Math.max(20, area.left + (area.width - 699) / 2),
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

  // Auto-set title for every tab — reset each time a tab is (re)entered, so the
  // placeholder/title always reflects the current tab. The first run (mount) is
  // skipped so an edited event's existing title is preserved.
  const didMountTabRef = useRef(false);
  useEffect(() => {
    if (!didMountTabRef.current) {
      didMountTabRef.current = true;
      return;
    }
    if (activeTab === "Out of office") setTitle("Out of office");
    else if (activeTab === "Focus time") setTitle("Focus time");
    else if (activeTab === "Working location") setTitle("Working location");
    else setTitle(""); // Event, Task, Appointment schedule → blank "Add title"
  }, [activeTab]);

  // Notify parent of tab changes (so the grid placeholder can restyle)
  useEffect(() => { onTabChange?.(activeTab); }, [activeTab]);

  useEffect(() => {
    if (!["date", "start", "end", "recurrence", "visibility", "otherlocations"].includes(openDrop)) return;
    const handler = (e) => {
      if (!e.target.closest("[data-event-picker-root]")) {
        setOpenDrop(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDrop]);

  // Center popover within the calendar grid area (right of the sidebar)
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const grid = document.getElementById("calendar-grid-area");
    const area = grid
      ? grid.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const left = area.left + (area.width - rect.width) / 2;
    // Vertically, start the card 2px above the first horizontal hour line.
    const hoursTop = document.getElementById("calendar-hours-top");
    const top = hoursTop
      ? hoursTop.getBoundingClientRect().top - 10
      : area.top + (area.height - rect.height) / 2;
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
        meet_link: meetLink || null,
        visibility: visibility || null,
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

  const recurrenceOptions = useMemo(() => buildRecurrenceOptions(startTime), [startTime]);
  const recurrenceLabel = recurrenceOptions.find((r) => r.value === recurrence)?.label || (recurrence ? "Custom recurrence" : "Does not repeat");

  // editable text trigger (date / time) — plain text, underline only on hover
  const underline =
    "text-gray-900 dark:text-[#e3e3e3] leading-5 hover:underline focus:outline-none cursor-pointer";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={popoverRef}
        className="fixed z-50 bg-white dark:bg-[#1e1f20] rounded-[28px] shadow-[0_3px_4px_rgba(0,0,0,0.14),0_3px_3px_-2px_rgba(0,0,0,0.12),0_1px_8px_rgba(0,0,0,0.2)] w-[699px] h-[513px] min-h-[513px] max-w-[calc(100vw-40px)] flex flex-col font-sans animate-fadeIn"
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
                className="w-full text-[22px] leading-7 font-normal text-gray-900 dark:text-[#e3e3e3] placeholder-gray-500 dark:placeholder-[#9aa0a6] border-b border-gray-300 dark:border-[#5f6368] focus:border-b-2 focus:border-[#8ab4f8] dark:focus:border-[#8ab4f8] focus:outline-none bg-transparent pb-1 focus:pb-[3px]"
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
            {(activeTab === "Event" || activeTab === "Task" || activeTab === "Out of office" || activeTab === "Focus time" || activeTab === "Working location") && (
              <div className={`flex ${eventTimeExpanded ? "items-start" : "items-center"}`}>
                <span className={`material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] ${eventTimeExpanded ? "leading-10" : ""}`}>schedule</span>
                {!eventTimeExpanded ? (
                  <button
                    type="button"
                    onClick={() => setEventTimeExpanded(true)}
                    className="flex-1 min-w-0 min-h-[52px] text-left rounded px-2 pt-2 pb-2 hover:bg-gray-100 dark:hover:bg-[#282b2c] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] leading-5 text-gray-900 dark:text-[#e3e3e3]">
                      <span>{fmtDate(startTime)}</span>
                      {!isAllDay && (
                        <span>
                          {fmt12(startTime)}
                          <span className="mx-2 text-gray-500 dark:text-[#c4c7c5]">–</span>
                          {fmt12(endTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[12px] leading-4 text-gray-500 dark:text-[#c4c7c5]">
                      <span>Time zone</span>
                      <span className="px-1 font-bold">·</span>
                      <span>{recurrenceLabel}</span>
                    </div>
                  </button>
                ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[14px]">
                    <div className="relative" data-event-picker-root>
                      <button
                        ref={dateBtnRef}
                        onClick={() => setOpenDrop(openDrop === "date" ? null : "date")}
                        className={`h-10 w-[139px] rounded bg-gray-100 dark:bg-[#333537] px-4 text-left text-[14px] leading-6 text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                          openDrop === "date" ? "border-b-4 border-[#a8c7fa] pb-0" : ""
                        }`}
                        style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                      >
                        <span className={openDrop === "date" ? "bg-[#5f7899] text-[#e3e3e3]" : ""}>
                          {fmtDate(startTime)}
                        </span>
                      </button>
                      {openDrop === "date" && (
                        <MiniDatePicker
                          anchorRef={dateBtnRef}
                          month={miniMonth}
                          days={miniDays}
                          selectedDate={startTime}
                          onPrev={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1))}
                          onNext={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1))}
                          onSelect={setDateFromMini}
                        />
                      )}
                    </div>

                    {!isAllDay && (
                      <>
                        <div className="relative" data-event-picker-root>
                          <button
                            onClick={() => setOpenDrop(openDrop === "start" ? null : "start")}
                            className={`h-10 w-[82px] rounded bg-gray-100 dark:bg-[#333537] px-4 text-left text-[14px] leading-6 text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                              openDrop === "start" ? "border-b-4 border-[#a8c7fa] pb-0" : ""
                            }`}
                            style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                          >
                            <span className={openDrop === "start" ? "bg-[#5f7899] text-[#e3e3e3]" : ""}>
                              {fmt12(startTime)}
                            </span>
                          </button>
                          {openDrop === "start" && (
                            <TimeMenu
                              value={startTime}
                              label="Start time"
                              onSelect={(slot) => setTimeFromSlot(slot, "start")}
                            />
                          )}
                        </div>

                        <span className="px-1 text-[18px] leading-10 text-gray-500 dark:text-[#c4c7c5]">-</span>

                        <div className="relative" data-event-picker-root>
                          <button
                            onClick={() => setOpenDrop(openDrop === "end" ? null : "end")}
                            className={`h-10 w-[82px] rounded bg-gray-100 dark:bg-[#333537] px-4 text-left text-[14px] leading-6 text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                              openDrop === "end" ? "border-b-4 border-[#a8c7fa] pb-0" : ""
                            }`}
                            style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                          >
                            <span className={openDrop === "end" ? "bg-[#5f7899] text-[#e3e3e3]" : ""}>
                              {fmt12(endTime)}
                            </span>
                          </button>
                          {openDrop === "end" && (
                            <TimeMenu
                              value={endTime}
                              label="End time"
                              showDurationFrom={startTime}
                              onSelect={(slot) => setTimeFromSlot(slot, "end")}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-7 min-h-6">
                    <label className="flex items-center gap-3 cursor-pointer text-[14px] leading-5 text-gray-800 dark:text-[#e3e3e3]">
                      <MCheckbox checked={isAllDay} onChange={setIsAllDay} />
                      <span>All day</span>
                    </label>
                    <button
                      type="button"
                      className="text-[14px] leading-5 font-medium text-[#1a73e8] dark:text-[#a8c7fa] hover:underline"
                      style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                    >
                      Time zone
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="relative inline-block" data-event-picker-root>
                        <button
                          ref={recurBtnRef}
                          onClick={() => setOpenDrop(openDrop === "recurrence" ? null : "recurrence")}
                          className={`inline-flex h-10 min-w-[166px] items-center justify-between rounded bg-gray-100 dark:bg-[#333537] pl-4 pr-2 text-[14px] leading-6 text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                            openDrop === "recurrence" ? "border-b-4 border-[#a8c7fa] pb-0" : ""
                          }`}
                          style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                        >
                          {recurrenceLabel}
                          <span className="material-icons-outlined ml-5 text-[20px] text-[#a8c7fa]">
                            {openDrop === "recurrence" ? "arrow_drop_up" : "arrow_drop_down"}
                          </span>
                        </button>
                      {openDrop === "recurrence" && (
                        <RecurrenceMenu
                          anchorRef={recurBtnRef}
                          options={recurrenceOptions}
                          selectedValue={recurrence}
                          onSelect={(value) => {
                            setRecurrence(value);
                            setOpenDrop(null);
                          }}
                          onCustom={() => {
                            setOpenDrop(null);
                            setShowCustomRecurrence(true);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {activeTab !== "Event" && activeTab !== "Task" && activeTab !== "Out of office" && activeTab !== "Focus time" && activeTab !== "Working location" && activeTab !== "Appointment schedule" && (
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
                    <div className="relative inline-block" data-event-picker-root>
                      <button
                        ref={recurBtnRef}
                        onClick={() => setOpenDrop(openDrop === "recurrence" ? null : "recurrence")}
                        className="cursor-pointer text-gray-500 hover:underline dark:text-[#c4c7c5]"
                      >
                        {recurrenceLabel}
                      </button>
                      {openDrop === "recurrence" && (
                        <RecurrenceMenu
                          anchorRef={recurBtnRef}
                          options={recurrenceOptions}
                          selectedValue={recurrence}
                          onSelect={(value) => {
                            setRecurrence(value);
                            setOpenDrop(null);
                          }}
                          onCustom={() => {
                            setOpenDrop(null);
                            setShowCustomRecurrence(true);
                          }}
                        />
                      )}
                    </div>
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
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] mr-2" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add guests</span>}
                </div>
                {/* Meet */}
                {meetLink ? (
                  <div className="flex items-start min-h-[40px]">
                    <span className="material-icons w-[52px] shrink-0 text-center text-[#e8a33d] text-[20px] mt-1">videocam</span>
                    <div className="flex-1 min-w-0">
                      <a href={`https://${meetLink}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-[14px] font-medium text-[#1a73e8] dark:text-[#a8c7fa] hover:underline" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
                        Join with Google Meet
                      </a>
                      <div className="text-[13px] text-gray-600 dark:text-[#c4c7c5] truncate">{meetLink}</div>
                      <div className="text-[13px] text-gray-500 dark:text-[#9aa0a6]">Up to 100 guest connections</div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0 text-gray-500 dark:text-[#c4c7c5]">
                      <button type="button" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center" title="Settings">
                        <span className="material-icons-outlined text-[18px]">settings</span>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(`https://${meetLink}`); }} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center" title="Copy link">
                        <span className="material-icons-outlined text-[18px]">content_copy</span>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMeetLink(null); }} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center" title="Remove">
                        <span className="material-icons-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => setMeetLink(`meet.google.com/${generateMeetCode()}`)}>
                    <span className="w-[52px] shrink-0 flex justify-center">
                      <img src="https://www.gstatic.com/images/branding/productlogos/meet_2026/v2/web/192px.svg" alt="" className="w-5 h-5" />
                    </span>
                    <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add Google Meet video conferencing</span>
                  </div>
                )}
                {/* Location */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] mr-2" />
                  ) : (
                    <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">
                      Add <span className="cursor-pointer hover:underline">rooms</span> or <span className="cursor-pointer hover:underline">location</span>
                    </span>
                  )}
                </div>
                {/* Description / Drive attachment (combined) */}
                <div className="flex items-start min-h-[40px] hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">notes</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] resize-none mr-2 my-1" />
                  ) : (
                    <span className="flex-1 text-gray-600 dark:text-[#c4c7c5] text-[14px] leading-10">
                      Add <span className="cursor-pointer hover:underline" onClick={() => setShowDescription(true)}>description</span> or <span className="cursor-pointer hover:underline" onClick={openDrive}>a Google Drive attachment</span>
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ─── TASK tab fields ──────────────────────────────────────── */}
            {activeTab === "Task" && (
              <>
                {/* Description */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">notes</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] resize-none mr-2 my-1" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add description</span>}
                </div>
                {/* Drive attachment */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={openDrive}>
                  <span className="w-[52px] shrink-0 flex justify-center">
                    <DriveIcon />
                  </span>
                  <span className="text-[14px] font-medium text-[#1a73e8] dark:text-[#a8c7fa]" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>Add a Google Drive attachment</span>
                </div>
                {/* Task list */}
                <div className="flex items-center min-h-[40px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">format_list_bulleted</span>
                  <Dropdown
                    open={openDrop === "tasklist"}
                    onClose={() => setOpenDrop(null)}
                    trigger={
                      <button onClick={() => setOpenDrop(openDrop === "tasklist" ? null : "tasklist")}
                        className="inline-flex items-center h-9 pl-4 pr-3 rounded bg-gray-100 dark:bg-[#333537] text-gray-800 dark:text-[#e3e3e3] text-[14px]" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
                        {selectedTaskList}
                        <span className="material-icons-outlined text-[20px] ml-3 text-gray-500 dark:text-[#c4c7c5]">arrow_drop_down</span>
                      </button>
                    }
                  >
                    {taskLists.map((list) => (
                      <button
                        key={list}
                        onClick={() => { setSelectedTaskList(list); setOpenDrop(null); }}
                        className={`flex w-full items-center px-4 py-2 text-left text-[14px] hover:bg-gray-100 dark:hover:bg-white/[0.06] ${
                          selectedTaskList === list ? "text-[#1a73e8] dark:text-[#a8c7fa] font-medium" : "text-gray-800 dark:text-[#e3e3e3]"
                        }`}
                      >
                        {list}
                      </button>
                    ))}
                  </Dropdown>
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
                    <div className="ml-[52px] mr-2 mt-3 rounded-t bg-gray-100 dark:bg-[#3c4043] px-4 pt-1.5 pb-2 border-b-2 border-[#8ab4f8]">
                      <label className="block text-[11px] leading-4 text-gray-500 dark:text-[#9aa0a6]">Message</label>
                      <input type="text" value={oooMessage} onChange={(e) => setOooMessage(e.target.value)}
                        className="w-full bg-transparent text-[15px] leading-6 text-gray-900 dark:text-[#e3e3e3] focus:outline-none" />
                    </div>
                  </>
                )}
                {/* Visibility */}
                <div className="flex items-center min-h-[44px] mt-1.5">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">lock</span>
                  <div className="relative inline-block" data-event-picker-root>
                    <button
                      ref={visBtnRef}
                      onClick={() => setOpenDrop(openDrop === "visibility" ? null : "visibility")}
                      className={`inline-flex items-center rounded bg-gray-100 dark:bg-[#333537] text-gray-700 dark:text-[#e3e3e3] text-[14px] leading-6 py-1.5 pl-4 pr-2 hover:bg-gray-200 dark:hover:bg-[#3c4043] transition-colors ${
                        openDrop === "visibility" ? "border-b-4 border-[#a8c7fa] pb-[2px]" : ""
                      }`}
                    >
                      {visibility} <span className="material-icons-outlined text-[20px] ml-2 text-[#a8c7fa]">{openDrop === "visibility" ? "arrow_drop_up" : "arrow_drop_down"}</span>
                    </button>
                    {openDrop === "visibility" && (
                      <VisibilityMenu
                        anchorRef={visBtnRef}
                        options={["Public", "Default visibility", "Private"]}
                        value={visibility}
                        onSelect={(v) => { setVisibility(v); setOpenDrop(null); }}
                      />
                    )}
                  </div>
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
                <label className="flex items-center gap-3 py-2 -mx-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <MCheckbox checked={focusDecline} onChange={setFocusDecline} />
                  <span className="text-[14px] leading-5 text-gray-800 dark:text-[#e5e7eb]">Automatically decline meetings</span>
                </label>
                {focusDecline && (
                  <>
                    <div className="ml-[52px] mt-2 flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer text-[14px] leading-5 text-gray-700 dark:text-[#d1d5db] -mx-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                        <MRadio checked={focusDeclineScope === "new"} onChange={() => setFocusDeclineScope("new")} />
                        Only new meeting invitations
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-[14px] leading-5 text-gray-700 dark:text-[#d1d5db] -mx-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                        <MRadio checked={focusDeclineScope === "all"} onChange={() => setFocusDeclineScope("all")} />
                        New and existing meetings
                      </label>
                    </div>
                    {/* separator */}
                    <div className="ml-[52px] mr-2 mt-3 border-t border-gray-200 dark:border-[#444746]" />
                    {/* Message (filled field, label inside) */}
                    <div className="ml-[52px] mr-2 mt-3 rounded-t bg-gray-100 dark:bg-[#3c4043] px-4 pt-1.5 pb-2 border-b-2 border-[#8ab4f8]">
                      <label className="block text-[11px] leading-4 text-gray-500 dark:text-[#9aa0a6]">Message</label>
                      <input type="text" value={focusMessage} onChange={(e) => setFocusMessage(e.target.value)}
                        className="w-full bg-transparent text-[15px] leading-6 text-gray-900 dark:text-[#e3e3e3] focus:outline-none" />
                    </div>
                  </>
                )}

                {/* Location */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showLocation && setShowLocation(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">location_on</span>
                  {showLocation ? (
                    <input type="text" placeholder="Add rooms or location" value={location} onChange={(e) => setLocation(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] mr-2" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add rooms or location</span>}
                </div>

                {/* Description */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => !showDescription && setShowDescription(true)}>
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] self-start mt-2.5">subject</span>
                  {showDescription ? (
                    <textarea placeholder="Add description" value={description} onChange={(e) => setDescription(e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} autoFocus
                      className="flex-1 bg-gray-100 dark:bg-[#3c4043] text-[14px] focus:outline-none placeholder-gray-500 dark:placeholder-[#9aa0a6] text-gray-900 dark:text-[#e3e3e3] rounded-t px-4 py-2.5 border-b-2 border-[#8ab4f8] resize-none mr-2 my-1" />
                  ) : <span className="text-gray-600 dark:text-[#c4c7c5] text-[14px]">Add description</span>}
                </div>
                {/* Drive attachment */}
                <div className="flex items-center min-h-[40px] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={openDrive}>
                  <span className="w-[52px] shrink-0 flex justify-center">
                    <DriveIcon />
                  </span>
                  <span className="text-[14px] font-medium text-[#1a73e8] dark:text-[#a8c7fa]" style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>Add a Google Drive attachment</span>
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
                  {(() => {
                    const otherSelected = workingLoc === "Another office" || workingLoc === "Another location";
                    return (
                  <div className="relative inline-block" data-event-picker-root>
                    <button
                      ref={otherLocBtnRef}
                      onClick={() => setOpenDrop(openDrop === "otherlocations" ? null : "otherlocations")}
                      className={`inline-flex items-center h-9 rounded-full border pl-5 pr-3 text-[13px] font-medium transition-colors ${
                        otherSelected
                          ? "border-transparent bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                          : "border-gray-300 dark:border-[#8e918f] text-[#1a73e8] dark:text-[#a8c7fa] hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}>
                      {otherSelected ? workingLoc : "Other locations"}
                      <span className="material-icons text-[18px] ml-1.5 text-current">arrow_drop_down</span>
                    </button>
                    {openDrop === "otherlocations" && (
                      <OtherLocationsMenu
                        anchorRef={otherLocBtnRef}
                        selected={workingLoc}
                        onSelect={(loc) => { setWorkingLoc(loc); setOpenDrop(null); }}
                      />
                    )}
                  </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* ─── APPOINTMENT SCHEDULE tab ──────────────────────────────── */}
            {activeTab === "Appointment schedule" && (
              <>
                {/* Time row (date + time pills) */}
                <div className="flex items-center min-h-[44px]">
                  <span className="material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px]">schedule</span>
                  <div className="flex items-center gap-2 text-[14px]">
                    <div className="relative" data-event-picker-root>
                      <button
                        ref={dateBtnRef}
                        onClick={() => setOpenDrop(openDrop === "date" ? null : "date")}
                        className={`inline-flex h-10 items-center whitespace-nowrap rounded-md bg-gray-100 dark:bg-[#333537] px-4 text-[14px] text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                          openDrop === "date" ? "border-b-2 border-[#a8c7fa]" : ""
                        }`}
                        style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                      >
                        {fmtDate(startTime)}
                      </button>
                      {openDrop === "date" && (
                        <MiniDatePicker
                          anchorRef={dateBtnRef}
                          month={miniMonth}
                          days={miniDays}
                          selectedDate={startTime}
                          onPrev={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1))}
                          onNext={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1))}
                          onSelect={setDateFromMini}
                        />
                      )}
                    </div>

                    <div className="relative" data-event-picker-root>
                      <button
                        onClick={() => setOpenDrop(openDrop === "start" ? null : "start")}
                        className={`inline-flex h-10 items-center whitespace-nowrap rounded-md bg-gray-100 dark:bg-[#333537] px-4 text-[14px] text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                          openDrop === "start" ? "border-b-2 border-[#a8c7fa]" : ""
                        }`}
                        style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                      >
                        {fmt12(startTime)}
                      </button>
                      {openDrop === "start" && (
                        <TimeMenu value={startTime} label="Start time" onSelect={(slot) => setTimeFromSlot(slot, "start")} />
                      )}
                    </div>

                    <span className="text-[18px] text-gray-500 dark:text-[#c4c7c5]">–</span>

                    <div className="relative" data-event-picker-root>
                      <button
                        onClick={() => setOpenDrop(openDrop === "end" ? null : "end")}
                        className={`inline-flex h-10 items-center whitespace-nowrap rounded-md bg-gray-100 dark:bg-[#333537] px-4 text-[14px] text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-200 dark:hover:bg-[#3c4043] ${
                          openDrop === "end" ? "border-b-2 border-[#a8c7fa]" : ""
                        }`}
                        style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                      >
                        {fmt12(endTime)}
                      </button>
                      {openDrop === "end" && (
                        <TimeMenu value={endTime} label="End time" showDurationFrom={startTime} onSelect={(slot) => setTimeFromSlot(slot, "end")} />
                      )}
                    </div>
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
                <div className="flex items-center min-h-[52px]">
                  <span className={`material-icons-outlined w-[52px] shrink-0 text-center text-gray-400 dark:text-[#c4c7c5] text-[20px] ${noSubtitle ? "" : "self-start mt-3"}`}>{activeTab === "Event" ? "event" : "calendar_today"}</span>
                  <div>
                    <div className="flex items-center gap-2 text-[14px] text-gray-800 dark:text-[#e3e3e3]">
                      {calendars[0]?.name || "My Calendar"}
                      {activeTab !== "Appointment schedule" && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calendars[0]?.color || (activeTab === "Task" ? "#4285f4" : "#039be5") }} />
                      )}
                    </div>
                    {!noSubtitle && (
                      <div className="flex items-center text-[12px] leading-4 text-gray-500 dark:text-[#c4c7c5]">
                        {(activeTab === "Task"
                          ? ["Free", "Private", "Do not disturb is OFF"]
                          : ["Busy", "Default visibility", "Notify 10 minutes before"]
                        ).map((item, i, arr) => (
                          <span key={item} className="flex items-center">
                            <span>{item}</span>
                            {i < arr.length - 1 && <span className="px-1 font-bold">\u00b7</span>}
                          </span>
                        ))}
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

        {showCustomRecurrence && (
          <div className="absolute inset-0 z-[80] flex items-center justify-start pl-[68px] pointer-events-none">
            <div className="pointer-events-auto">
              <CustomRecurrenceDialog
                initialDate={startTime}
                onCancel={() => setShowCustomRecurrence(false)}
                onDone={(rule) => {
                  setRecurrence(rule);
                  setShowCustomRecurrence(false);
                }}
              />
            </div>
          </div>
        )}

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
