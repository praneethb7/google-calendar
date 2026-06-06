"use client";
import { useState } from "react";

// ── Google Tasks surface ──────────────────────────────────────────────────────
// Replicates calendar.google.com/calendar/u/0/r/tasks — a left navigation rail
// (Create / All tasks / Starred / Lists) and a centered "My Tasks" panel with
// the empty-state illustration. Dark theme to match the reference capture.

const SANS = '"Google Sans", "Google Sans Text", Roboto, Arial, sans-serif';

function TasksView({ collapsed = false }) {
  const [activeNav, setActiveNav] = useState("all");
  const [listsOpen, setListsOpen] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-[#1b1b1b] select-none">
      {/* ── Left navigation rail ─────────────────────────────────────────── */}
      <nav
        className={`flex flex-col flex-shrink-0 w-[256px] min-w-[256px] ${
          collapsed ? "ml-[-256px]" : "ml-0"
        } pt-3 px-2 overflow-y-auto overflow-x-hidden transition-[margin] duration-300 ease-in-out`}
      >
        {/* Create */}
        <div className="pb-5 pl-2">
          <button
            className="inline-grid items-center max-w-full rounded-2xl bg-[#37393b] text-white hover:bg-[#3f4143] transition-colors"
            style={{
              gridTemplateColumns: "16px 24px 12px auto 0px 20px",
              gridTemplateRows: "24px",
              gridAutoFlow: "column",
              paddingTop: 16,
              paddingBottom: 16,
            }}
            title="Create"
          >
            <span
              className="material-icons-outlined text-[24px] text-[#e3e3e3]"
              style={{ gridColumn: "2 / 3", lineHeight: "24px" }}
            >
              add
            </span>
            <span
              className="text-[14px] font-medium text-[#e3e3e3] whitespace-nowrap"
              style={{ gridColumn: "4 / span 2", fontFamily: SANS }}
            >
              Create
            </span>
          </button>
        </div>

        {/* All tasks / Starred */}
        <div className="pt-3 pb-4">
          <NavItem
            icon="check_circle"
            label="All tasks"
            active={activeNav === "all"}
            onClick={() => setActiveNav("all")}
          />
          <NavItem
            icon="star_border"
            label="Starred"
            active={activeNav === "starred"}
            onClick={() => setActiveNav("starred")}
          />
        </div>

        {/* Lists header */}
        <div className="pb-2">
          <div className="flex items-center cursor-pointer" onClick={() => setListsOpen((o) => !o)}>
            <span
              className="flex-grow ml-4 py-1.5 text-[14px] font-medium leading-5 text-[#e3e3e3]"
              style={{ fontFamily: SANS, letterSpacing: "0.25px" }}
            >
              Lists
            </span>
            <span className="inline-flex items-center justify-center mr-3 ml-2 p-[5px] rounded-2xl text-[#c4c7c5] hover:bg-white/[0.08]">
              <span className="material-icons-outlined text-[22px] leading-[22px] text-[#80868b]">
                {listsOpen ? "expand_less" : "expand_more"}
              </span>
            </span>
          </div>
        </div>

        {/* Lists */}
        {listsOpen && (
          <div className="pt-2 pb-2">
            <NavItem
              icon="check_box"
              iconColor="#c4c7c5"
              label="My Tasks"
              active={activeNav === "my-tasks"}
              onClick={() => setActiveNav("my-tasks")}
            />
            <NavItem
              icon="add"
              iconColor="#c4c7c5"
              label="Create new list"
              active={false}
              onClick={() => {}}
            />
          </div>
        )}
      </nav>

      {/* ── Main panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 pb-2 overflow-x-auto">
        <div className="flex flex-1 justify-center items-start pl-3 pr-1 min-w-full">
          <div className="relative flex flex-col flex-grow mx-1 mb-1 min-w-[300px] max-w-[680px] rounded-2xl bg-[#131314] border border-[#444746] overflow-hidden">
            {/* Sticky header */}
            <div className="sticky top-0 z-[3000] bg-[#131314]">
              <div className="flex cursor-grab">
                <div
                  className="flex-grow mt-2 ml-4 py-2 text-[18px] leading-6 text-left text-[#e3e3e3] truncate"
                  style={{ fontFamily: SANS }}
                >
                  My Tasks
                </div>
                <div className="flex mt-2 px-2 py-1">
                  <button
                    className="inline-block relative w-8 h-8 rounded-full text-center hover:bg-white/[0.08]"
                    title="More"
                  >
                    <span className="material-icons-outlined text-[20px] leading-8 text-[#9aa0a6]">
                      more_vert
                    </span>
                  </button>
                </div>
              </div>

              {/* Add a task */}
              <div className="px-2 py-1">
                <button className="flex items-center w-full min-w-[64px] pl-2 pr-4 h-10 rounded-[20px] hover:bg-white/[0.04] transition-colors">
                  <span className="inline-flex mr-4 text-[20px] text-[#a8c7fa]">
                    <span className="material-icons-outlined text-[20px]">add</span>
                  </span>
                  <span
                    className="text-[14px] font-medium text-[#a8c7fa]"
                    style={{ fontFamily: SANS }}
                  >
                    Add a task
                  </span>
                </button>
              </div>
            </div>

            {/* Body — empty state */}
            <div className="flex flex-col items-center overflow-y-auto pb-2">
              <div className="h-[360px] max-h-[calc(100vh-180px)] flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="mb-3 w-[104px] h-[104px]"
                    style={{
                      backgroundImage:
                        'url("https://www.gstatic.com/tasks/empty-tasks-dark.svg")',
                      backgroundSize: "104px 104px",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <div
                    className="mb-4 text-[18px] leading-6 text-center text-[#e3e3e3]"
                    style={{ fontFamily: SANS }}
                  >
                    No tasks yet
                  </div>
                  <div
                    className="max-w-[260px] text-[14px] leading-5 text-center text-[#c4c7c5]"
                    style={{ fontFamily: SANS }}
                  >
                    Add your to-dos and keep track of them across Google Workspace
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, iconColor }) {
  return (
    <div className="pb-2">
      <button
        onClick={onClick}
        className={`flex items-center w-full min-h-8 pl-4 pr-6 gap-3 rounded-[100px] transition-colors ${
          active ? "bg-[#004a77]" : "hover:bg-white/[0.06]"
        }`}
        style={{ paddingTop: 4, paddingBottom: 4 }}
      >
        <span
          className="material-icons-outlined flex-shrink-0 text-[20px]"
          style={{ color: active ? "#c2e7ff" : iconColor || "#e3e3e3" }}
        >
          {icon}
        </span>
        <span
          className={`flex-grow text-left truncate text-[14px] leading-5 ${
            active ? "font-medium text-[#c2e7ff]" : "text-[#e3e3e3]"
          }`}
          style={{ fontFamily: SANS }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

export default TasksView;
