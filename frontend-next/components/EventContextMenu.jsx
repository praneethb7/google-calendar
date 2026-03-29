"use client";
import { useEffect, useRef } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

const COLORS = [
  { name: "Tomato", value: "#d50000" },
  { name: "Flamingo", value: "#e67c73" },
  { name: "Tangerine", value: "#f4511e" },
  { name: "Banana", value: "#f6bf26" },
  { name: "Sage", value: "#33b679" },
  { name: "Basil", value: "#0b8043" },
  { name: "Peacock", value: "#039be5" },
  { name: "Blueberry", value: "#3f51b5" },
  { name: "Lavender", value: "#7986cb" },
  { name: "Grape", value: "#8e24aa" },
  { name: "Graphite", value: "#616161" },
];

export default function EventContextMenu({ event, x, y, onClose, onEdit }) {
  const { deleteEvent, updateEvent } = useCalendarStore();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const handleDelete = async () => {
    await deleteEvent(event.id);
    onClose();
  };

  const handleColor = async (color) => {
    await updateEvent(event.id, { ...event, color });
    onClose();
  };

  // Position: keep on screen
  const style = {
    position: "fixed",
    left: Math.min(x, typeof window !== "undefined" ? window.innerWidth - 220 : x),
    top: Math.min(y, typeof window !== "undefined" ? window.innerHeight - 380 : y),
    zIndex: 1000,
  };

  return (
    <>
      <div className="fixed inset-0 z-[999]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div ref={ref} style={style} className="z-[1000] bg-white dark:bg-[#303134] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.24)] border border-gray-200 dark:border-gray-700 py-1.5 w-[210px] animate-fadeIn">
        {/* Edit */}
        <button
          onClick={() => { onEdit(event); onClose(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
        >
          <span className="material-icons-outlined text-[18px] text-gray-500">edit</span>
          Edit
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3"
        >
          <span className="material-icons-outlined text-[18px] text-gray-500">delete</span>
          Delete
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Color label heading */}
        <div className="px-4 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Label
        </div>

        {/* Color swatches */}
        <div className="flex flex-wrap gap-1.5 px-4 py-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              title={c.name}
              onClick={() => handleColor(c.value)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                event.color === c.value ? "ring-2 ring-offset-1 ring-gray-800 dark:ring-white dark:ring-offset-[#303134]" : ""
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
