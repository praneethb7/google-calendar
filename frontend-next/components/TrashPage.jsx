"use client";

import { useEffect, useState, useCallback } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

/* ──────────────────────────────────────────────────────────────────────────
   Trash page — pixel-for-pixel reproduction of the captured Google Calendar
   "Events in trash" screen. The captured class rules (.s* / .p*) are inlined
   below, prefixed with `tp-` so they don't collide with the rest of the app.
   ────────────────────────────────────────────────────────────────────────── */

const TRASH_CSS = `
.tp-s1 { display: flex; position: relative; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #e3e3e3; border-top-width: 1px; border-top-style: solid; border-top-color: #444746; font-family: "Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: normal; text-align: start; white-space: normal; word-break: normal; overflow-wrap: normal; hyphens: manual; tab-size: 8; text-indent: 0px; -webkit-font-smoothing: antialiased; text-rendering: geometricprecision; scrollbar-width: auto; scrollbar-color: auto; background-color: #131314; }
.tp-s2 { display: flex; position: relative; min-width: auto; min-height: auto; flex-direction: column; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; flex-shrink: 0; top: 0px; right: 0px; bottom: 0px; left: 0px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s3 { display: flex; min-width: auto; min-height: auto; flex-direction: column; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #131314; overflow: auto; overflow-x: auto; overflow-y: auto; }
.tp-s4 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; flex-grow: 1; }
.tp-s5 { display: block; margin-right: 8px; padding-top: 16px; padding-bottom: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; }
.tp-s6 { display: block; padding-top: 2px; padding-bottom: 10px; padding-left: 24px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; font-family: "Google Sans", Roboto, Arial, sans-serif; font-weight: 500; line-height: 20px; margin: 0; font-size: 14px; }
.tp-s7 { display: block; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; }
.tp-s8 { display: flex; position: relative; padding-right: 8px; padding-left: 24px; min-height: 40px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: center; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; background-color: #0842a0; border-radius: 2px 40px 40px 2px; cursor: pointer; }
.tp-s9 { display: flex; min-width: auto; min-height: auto; max-height: 40px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: center; align-content: normal; gap: normal; flex-shrink: 0; align-self: stretch; }
.tp-s10 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #4b99d2; border-radius: 50%; }
.tp-s11 { display: block; min-height: auto; flex-direction: row; flex-wrap: wrap; justify-content: normal; align-items: center; align-content: normal; gap: normal; flex-grow: 1; color: #d3e3fd; font-family: "Google Sans", Roboto, Arial, sans-serif; font-weight: 500; line-height: 20px; text-align: left; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s12 { display: block; position: relative; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; flex-grow: 1; top: 0px; right: 0px; bottom: 0px; left: 0px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s13 { display: block; position: absolute; margin-left: 8px; padding-top: 20px; padding-right: 32px; padding-bottom: 32px; padding-left: 32px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; background-color: #131314; overflow: auto hidden; overflow-x: auto; overflow-y: hidden; }
.tp-s14 { display: block; position: absolute; margin-right: 24px; margin-bottom: 10px; margin-left: 24px; min-width: 832px; max-width: 1200px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; overflow: auto; overflow-x: auto; overflow-y: auto; }
.tp-s15 { display: inline-block; position: relative; margin-top: 18.26px; margin-right: 8px; margin-left: 8px; padding-right: 8px; padding-left: 8px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; font-family: "Google Sans", Roboto, Arial, sans-serif; font-size: 22px; line-height: 28px; margin-bottom: 0; font-weight: 400; }
.tp-s16 { display: flex; padding-top: 8px; padding-right: 8px; padding-bottom: 4px; padding-left: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; align-items: center; align-content: normal; gap: normal; }
.tp-s17 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; }
.tp-s18 { display: flex; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: center; align-content: normal; gap: normal; }
.tp-s19 { display: inline-flex; position: relative; margin-top: 4px; margin-bottom: 4px; padding-right: 16px; padding-left: 12px; min-width: 64px; flex-direction: row; flex-wrap: nowrap; justify-content: center; align-items: center; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #ffffff; border-radius: 20px; font-family: Arial; font-size: 13.3333px; text-align: center; vertical-align: middle; cursor: pointer; user-select: none; }
.tp-s20 { display: block; position: absolute; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; border-radius: 20px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; pointer-events: none; user-select: none; }
.tp-s22 { display: flex; position: relative; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #a8c7fa; line-height: 0px; user-select: none; }
.tp-s23 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; user-select: none; }
.tp-s24 { display: inline-flex; position: relative; margin-right: 8px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; flex-shrink: 0; top: 0px; right: 0px; bottom: 0px; left: 0px; font-size: 18px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; user-select: none; }
.tp-s25 { display: block; position: relative; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #a8c7fa; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500; user-select: none; }
.tp-s26 { display: inline-flex; position: relative; flex-direction: column; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; border-width: 1px; border-style: solid; border-color: #444746; border-radius: 4px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s27 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; overflow: auto; overflow-x: auto; overflow-y: auto; }
.tp-s28 { display: table; min-width: 100%; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; white-space: nowrap; border-collapse: collapse; }
.tp-s29 { display: table-header-group; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; vertical-align: middle; }
.tp-s30 { display: table-row; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; vertical-align: middle; }
.tp-s31 { display: table-cell; padding-right: 4px; padding-left: 4px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #131314; color: #c4c7c5; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #444746; border-radius: 4px 0px 0px; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; font-weight: 500; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s32 { display: inline; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; }
.tp-s33 { display: inline-flex; position: relative; margin: 4px; flex-direction: row; flex-wrap: nowrap; justify-content: center; align-items: center; align-content: normal; gap: normal; flex-shrink: 0; top: 0px; right: 0px; bottom: 0px; left: 0px; z-index: 0; line-height: 0px; vertical-align: bottom; cursor: pointer; width: 40px; height: 40px; }
.tp-s34 { display: block; position: absolute; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #ffffff; opacity: 0; font-family: Arial; font-size: 13.3333px; font-weight: 400; line-height: normal; margin: 0; cursor: pointer; }
.tp-s35 { display: flex; position: absolute; flex-direction: row; flex-wrap: nowrap; justify-content: center; align-items: center; align-content: normal; gap: normal; top: 11px; left: 11px; width: 18px; height: 18px; border-width: 2px; border-style: solid; border-color: #c4c7c5; border-radius: 2px; pointer-events: none; box-sizing: border-box; }
.tp-s36 { display: block; position: absolute; padding: 0.976562px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #062e6f; overflow: hidden; overflow-x: hidden; overflow-y: hidden; pointer-events: none; }
.tp-s37 { display: block; margin-right: 2.09375px; margin-left: 2.09375px; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #062e6f; opacity: 0; border-width: 1px; border-style: solid; border-color: #062e6f; pointer-events: none; transform: matrix(0, 0, 0, 1, 0, 0); }
.tp-s38 { display: block; position: absolute; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; z-index: -1; border-radius: 50%; overflow: hidden; overflow-x: hidden; overflow-y: hidden; pointer-events: none; }
.tp-s39 { display: table-cell; padding-right: 16px; padding-left: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #131314; color: #c4c7c5; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #444746; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; font-weight: 500; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; text-align: left; }
.tp-s40 { display: table-cell; padding-right: 16px; padding-left: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #131314; color: #c4c7c5; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: #444746; border-radius: 0px 4px 0px 0px; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; font-weight: 500; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; text-align: left; }
.tp-s41 { display: table-row-group; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; vertical-align: middle; }
.tp-s42 { display: table-cell; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; vertical-align: middle; }
.tp-s43 { display: table-row; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: #131314; vertical-align: middle; }
.tp-s44 { display: table-cell; padding-right: 4px; padding-left: 4px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: rgba(227, 227, 227, 0.08); border-radius: 0px 0px 0px 4px; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s45 { display: block; position: absolute; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #ffffff; opacity: 0; font-family: Arial; font-size: 13.3333px; line-height: normal; margin: 0; cursor: pointer; }
.tp-s46 { display: table-cell; padding-right: 16px; padding-left: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: rgba(227, 227, 227, 0.08); font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s47 { display: table-cell; padding-right: 16px; padding-left: 16px; max-width: 260px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: rgba(227, 227, 227, 0.08); font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; font-weight: 400; text-align: left; }
.tp-s48 { display: table-cell; padding-right: 16px; padding-left: 16px; max-width: 160px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: rgba(227, 227, 227, 0.08); font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s49 { display: table-cell; padding-right: 16px; padding-left: 16px; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; background-color: rgba(227, 227, 227, 0.08); border-radius: 0px 0px 4px; font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif; line-height: 20px; text-overflow: ellipsis; vertical-align: middle; overflow: hidden; overflow-x: hidden; overflow-y: hidden; }
.tp-s50 { display: inline-flex; position: relative; padding: 10px; flex-direction: row; flex-wrap: nowrap; justify-content: center; align-items: center; align-content: normal; gap: normal; top: 0px; right: 0px; bottom: 0px; left: 0px; color: #c4c7c5; border-radius: 20px; font-family: Arial; font-size: 13.3333px; text-align: center; cursor: pointer; user-select: none; }
.tp-s51 { display: block; min-width: auto; min-height: auto; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; z-index: 1; line-height: 0px; user-select: none; }
.tp-s53 { display: inline; flex-direction: row; flex-wrap: nowrap; justify-content: normal; align-items: normal; align-content: normal; gap: normal; flex-shrink: 0; font-size: 20px; overflow: hidden; overflow-x: hidden; overflow-y: hidden; user-select: none; }

.tp-s50:hover { background-color: rgba(227, 227, 227, 0.08); }
.tp-s19:hover .tp-p3-bg { opacity: 0.08; }
.tp-s33:hover .tp-p4-bg { opacity: 0.08; }

.tp-p1::after { content: ''; display: block; position: absolute; top: -2px; right: 0px; left: 0px; height: 2px; pointer-events: none; }
.tp-p2 { border: 1px solid #8e918f; }
.tp-p3-bg { position: absolute; inset: 0; background-color: #a8c7fa; border-radius: 20px; opacity: 0; pointer-events: none; }
.tp-p4-bg { position: absolute; inset: 0; background-color: #e3e3e3; border-radius: 50%; opacity: 0; pointer-events: none; }

.tp-empty { display: block; margin-top: 16px; color: #e3e3e3; font-family: "Google Sans Text", "Google Sans", Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: normal; }
`;

/* ── helpers ──────────────────────────────────────────────────────────────── */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmtDateParts(d) {
  return { wd: DAYS[d.getDay()], rest: `${MONTHS[d.getMonth()]} ${d.getDate()}` };
}
function fmtDateAria(d) {
  return `${DAYS_FULL[d.getDay()]}, ${MONTHS_FULL[d.getMonth()]} ${d.getDate()}`;
}
function fmtTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")}${ampm}`;
}

function RestoreIcon() {
  return (
    <svg className="tp-s53" focusable="false" width="20" height="20" viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#c4c7c5" }}>
      <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.96 8.96 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z"></path>
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg className="tp-s53" focusable="false" width="20" height="20" viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#c4c7c5" }}>
      <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z"></path>
      <path d="M9 8h2v9H9zm4 0h2v9h-2z"></path>
    </svg>
  );
}

export default function TrashPage({ onClose, user }) {
  const [items, setItems] = useState([]);
  const { createEvent, fetchCalendars } = useCalendarStore();
  const ownerName = user?.name || user?.email || "My Calendar";

  const load = useCallback(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("calendarTrash") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("calendar-trash-updated", load);
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("calendar-trash-updated", load);
      window.removeEventListener("keydown", onKey);
    };
  }, [load, onClose]);

  const persist = (next) => {
    localStorage.setItem("calendarTrash", JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("calendar-trash-updated"));
  };

  const handleEmptyTrash = () => persist([]);

  const handleDelete = (trashId) => persist(items.filter((i) => i.trashId !== trashId));

  const handleRestore = async (item) => {
    try {
      const { trashId, deleted_at, id, ...data } = item;
      await createEvent(data);
    } catch (e) {
      console.error("Restore failed:", e);
    }
    persist(items.filter((i) => i.trashId !== item.trashId));
  };

  const hasItems = items.length > 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "#131314", overflow: "auto" }}
    >
      <style>{TRASH_CSS}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", height: 64, padding: "0 16px", background: "#131314", color: "#e3e3e3" }}>
        <button
          onClick={onClose}
          aria-label="Back"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", color: "#e3e3e3" }}
          className="tp-s50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ fill: "#e3e3e3" }}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
        </button>
        <span style={{ marginLeft: 16, fontFamily: '"Google Sans", Roboto, Arial, sans-serif', fontSize: 22, lineHeight: "28px", color: "#e3e3e3" }}>
          Trash
        </span>
      </div>

      <div className="tp-s1" style={{ width: "100%", minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <div className="tp-s2" style={{ width: 256, minWidth: 256 }}>
          <div className="tp-s3" style={{ width: 256, minWidth: 256 }}>
            <div className="tp-s4" style={{ width: 256, minWidth: 256 }}>
              <div className="tp-s5" style={{ width: 240, minWidth: 240 }}>
                <h2 className="tp-s6">Trash for my calendars</h2>
                <ul className="tp-s7" style={{ width: 240, minWidth: 240 }}>
                  <li className="tp-s7" style={{ minWidth: 240 }}>
                    <a className="tp-s8" style={{ minWidth: 240 }} href="#" onClick={(e) => e.preventDefault()}>
                      <div className="tp-s9" style={{ width: 24, minWidth: 24 }}>
                        <div className="tp-s10" style={{ width: 12, minWidth: 12, height: 12 }}></div>
                      </div>
                      <div className="tp-s11" style={{ width: 184, minWidth: 184, height: 20 }}>
                        {ownerName}
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="tp-s12" style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ position: "absolute", inset: 0, marginLeft: 8, paddingTop: 20, paddingRight: 32, paddingBottom: 32, paddingLeft: 32, background: "#131314", overflow: "auto" }}>
            {!hasItems ? (
              <div className="tp-empty">There are no deleted events</div>
            ) : (
              <div className="tp-s7" style={{ maxWidth: 1200 }}>
                <h2 className="tp-s15">Events in trash</h2>
                <div className="tp-s16">
                  <span className="tp-s17">These will be deleted after 30 days</span>
                  <div className="tp-s18">
                    <div className="tp-s17">
                      <button className="tp-s19 tp-p2" aria-label="Empty trash" onClick={handleEmptyTrash}>
                        <span className="tp-s20"><span className="tp-p3-bg" /></span>
                        <span className="tp-s22">
                          <span className="tp-s23">
                            <svg className="tp-s24" focusable="false" width="20" height="20" viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#a8c7fa" }}>
                              <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z"></path>
                              <path d="M9 8h2v9H9zm4 0h2v9h-2z"></path>
                            </svg>
                          </span>
                        </span>
                        <span className="tp-s25">Empty trash</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tp-s26" style={{ width: "100%" }}>
                  <div className="tp-s27" style={{ width: "100%" }}>
                    <table className="tp-s28" aria-label="Events in trash">
                      <thead className="tp-s29">
                        <tr className="tp-s30">
                          <td className="tp-s31">
                            <div className="tp-s32">
                              <div className="tp-s33">
                                <input className="tp-s34" type="checkbox" aria-label="Select all" />
                                <div className="tp-s35">
                                  <svg className="tp-s36" aria-hidden="true" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "rgb(0,0,0)" }}>
                                    <path fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
                                  </svg>
                                  <div className="tp-s37" style={{ width: 10, minWidth: 10, height: 2 }}></div>
                                </div>
                                <span className="tp-s38"></span>
                              </div>
                            </div>
                          </td>
                          <th className="tp-s39">Date</th>
                          <th className="tp-s39">Time</th>
                          <th className="tp-s39">Title</th>
                          <th className="tp-s39">Organizer</th>
                          <th className="tp-s39">Deletion date</th>
                          <th className="tp-s40">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="tp-s41">
                        <tr className="tp-s30">
                          <td className="tp-s42"><div className="tp-s7" style={{ width: 56, minWidth: 56 }}></div></td>
                        </tr>
                      </tbody>
                      <tbody className="tp-s41">
                        {items.map((item) => {
                          const start = new Date(item.start_time);
                          const del = new Date(item.deleted_at);
                          del.setDate(del.getDate() + 30);
                          const dp = fmtDateParts(start);
                          const ddp = fmtDateParts(del);
                          const organizer = item.organizer || item.organizer_email || user?.email || "";
                          return (
                            <tr className="tp-s43" key={item.trashId}>
                              <td className="tp-s44">
                                <div className="tp-s32">
                                  <div className="tp-s33">
                                    <input className="tp-s45" type="checkbox" aria-label="Select item" />
                                    <div className="tp-s35">
                                      <svg className="tp-s36" aria-hidden="true" viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "rgb(0,0,0)" }}>
                                        <path fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
                                      </svg>
                                      <div className="tp-s37" style={{ width: 10, minWidth: 10, height: 2 }}></div>
                                    </div>
                                    <span className="tp-s38"></span>
                                  </div>
                                </div>
                              </td>
                              <td className="tp-s46">
                                <div className="tp-s7" aria-label={fmtDateAria(start)}>
                                  <div className="tp-s7">{dp.wd}, {dp.rest}</div>
                                </div>
                              </td>
                              <td className="tp-s46">
                                <div className="tp-s7">{item.is_all_day ? "All day" : fmtTime(start)}</div>
                              </td>
                              <th className="tp-s47">{item.title || "(No title)"}</th>
                              <td className="tp-s48">{organizer}</td>
                              <td className="tp-s46">
                                <div className="tp-s7" aria-label={fmtDateAria(del)}>
                                  <div className="tp-s7">{ddp.wd}, {ddp.rest}</div>
                                </div>
                              </td>
                              <td className="tp-s49">
                                <span className="tp-s50" role="button" aria-label="Restore" onClick={() => handleRestore(item)}>
                                  <span className="tp-s51"><RestoreIcon /></span>
                                </span>
                                <span className="tp-s50" role="button" aria-label="Delete forever" onClick={() => handleDelete(item.trashId)}>
                                  <span className="tp-s51"><DeleteIcon /></span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
