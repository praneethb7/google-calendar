"use client";
import { useMemo, useState } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHolidayStore } from "@/store/useHolidayStore";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthMatrix(year, month) {
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), cur: true });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), cur: false });
  }
  return cells;
}

const fmtTime = (e) => {
  if (e.is_all_day) return "All day";
  const d = new Date(e.start_time);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
};

function YearView({ onEventClick }) {
  const { currentDate, events = [], showHolidays } = useCalendarStore();
  const { getHolidaysForDate } = useHolidayStore();
  const year = currentDate.getFullYear();
  const today = new Date();
  const months = useMemo(() => MONTHS.map((_, m) => monthMatrix(year, m)), [year]);

  const [popup, setPopup] = useState(null); // { date, x, y }

  const isToday = (d) => d.toDateString() === today.toDateString();

  const handleDayClick = (e, date) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(r.left, window.innerWidth - 224 - 16);
    const y = Math.min(r.bottom + 4, window.innerHeight - 200);
    setPopup({ date: new Date(date), x, y });
  };

  const popupEvents = useMemo(() => {
    if (!popup) return { events: [], holidays: [] };
    const key = popup.date.toDateString();
    const evs = events
      .filter((e) => new Date(e.start_time).toDateString() === key)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const hols = showHolidays ? getHolidaysForDate(popup.date) || [] : [];
    return { events: evs, holidays: hols };
  }, [popup, events, showHolidays, getHolidaysForDate]);

  return (
    // Outer box (.s1): 1240px max-width 100%, height 721px, 28px radius,
    // 12px bottom margin, bg #131314, Google Sans Text 14/400, scrollable
    <div
      className="overflow-auto bg-white dark:bg-[#131314]"
      style={{
        width: "1240px",
        maxWidth: "100%",
        height: "721px",
        minHeight: "721px",
        marginBottom: "12px",
        borderRadius: "28px",
        fontFamily: '"Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif',
        fontSize: "14px",
        fontWeight: 400,
      }}
    >
      {/* Month grid (.s3): wrap, space-between, top-aligned, pad 8px top / 32px right */}
      <div className="flex flex-wrap content-start justify-between" style={{ paddingTop: "8px", paddingRight: "32px" }}>
        {MONTHS.map((name, m) => (
          // Month block (.s4 298px / 25%, .s5 pad 6/14/16/19)
          <div key={name} className="basis-1/4 min-w-[298px] pt-1.5 pr-3.5 pb-4 pl-[19px]">
            <div
              className="flex h-8 items-center pl-[9px] text-[15px] font-medium leading-5 text-google-gray-600 dark:text-[#c4c7c5]"
              style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
            >
              {name}
            </div>
            <table className="w-[256px] table-fixed border-collapse text-center">
              <thead>
                <tr>
                  {WEEKDAYS.map((w, i) => (
                    <th key={i} className="h-7 text-[12px] font-normal text-google-gray-500 dark:text-[#c4c7c5]">{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <tr key={row}>
                    {months[m].slice(row * 7, row * 7 + 7).map((cell, ci) => {
                      const td = isToday(cell.date);
                      return (
                        <td key={ci} className="h-7 p-0">
                          <button
                            onClick={(e) => handleDayClick(e, cell.date)}
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium transition-colors ${
                              td
                                ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]"
                                : cell.cur
                                ? "text-google-gray-800 dark:text-[#e3e3e3] hover:bg-google-gray-100 dark:hover:bg-[#2a2b2d]"
                                : "text-google-gray-400 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-[#2a2b2d]"
                            }`}
                          >
                            {cell.date.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {popup && (
        <DayPopup
          date={popup.date}
          x={popup.x}
          y={popup.y}
          items={popupEvents}
          onEventClick={onEventClick}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

function DayPopup({ date, x, y, items, onEventClick, onClose }) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const isToday = date.toDateString() === new Date().toDateString();
  const rows = [
    ...items.holidays.map((h) => ({ key: `h-${h.id || h.name}`, color: h.color || "#34a853", time: "All day", title: h.name, ev: null })),
    ...items.events.map((e) => ({ key: `e-${e.id}`, color: e.color || e.calendar_color || "#1a73e8", time: fmtTime(e), title: e.title, ev: e })),
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[224px] max-h-[calc(100%-32px)] flex flex-col rounded-[28px] bg-white dark:bg-[#282a2c] shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_8px_3px_rgba(0,0,0,0.15)]"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full text-google-gray-600 dark:text-[#c4c7c5] hover:bg-google-gray-100 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
        </button>

        {/* Header */}
        <div className="pt-3 text-center flex-shrink-0">
          <div className="text-[11px] uppercase tracking-[0.8px] text-google-gray-500 dark:text-[#c4c7c5]">{weekday}</div>
          <div className={`mt-1 mx-auto w-10 h-10 flex items-center justify-center rounded-full text-[26px] leading-10 ${isToday ? "bg-google-blue text-white dark:bg-[#a8c7fa] dark:text-[#062e6f]" : "text-google-gray-800 dark:text-[#e3e3e3]"}`}>
            {date.getDate()}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-3 pt-2 max-h-[480px] overflow-auto">
          {rows.length === 0 ? (
            <div className="pl-2 text-[12px] text-google-gray-700 dark:text-[#e3e3e3]">
              There are no events scheduled on this day.
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((r) => (
                <div
                  key={r.key}
                  onClick={() => r.ev && onEventClick?.(r.ev)}
                  className={`flex items-center gap-3 rounded px-2 py-1.5 ${r.ev ? "cursor-pointer hover:bg-google-gray-100 dark:hover:bg-white/5" : ""}`}
                >
                  <span className="w-[14px] h-[14px] rounded-full border-2 flex-shrink-0" style={{ borderColor: r.color }} />
                  <div className="flex-1 min-w-0 truncate text-[14px]">
                    <span className="text-google-gray-600 dark:text-[#c4c7c5]">{r.time}</span>
                    <span className="ml-2 text-google-gray-800 dark:text-[#e3e3e3]">{r.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default YearView;
