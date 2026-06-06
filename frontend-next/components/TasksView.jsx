"use client";
import { useState } from "react";

// ── Google Tasks surface ──────────────────────────────────────────────────────
// Pixel-faithful replica of calendar.google.com/calendar/u/0/r/tasks.
// The captured DOM + CSS (classes s15..s86) are reproduced verbatim via
// styled-jsx so spacing, sizing and colors match exactly. Icon <i> elements
// additionally carry `material-icons-outlined` so the glyphs actually render.

function TasksView({ collapsed = false }) {
  const [activeNav, setActiveNav] = useState("all");
  const [listsOpen, setListsOpen] = useState(true);

  return (
    <div className="tasks-root">
      {/* ── Sidebar (.s9 → .s11 → .s15) ────────────────────────────────────── */}
      <div className="s9" style={{ marginLeft: collapsed ? -257 : 0 }}>
        <div className="s11" aria-label="Sidebar">
          <div className="s15">
            {/* Create (.s16 → .s18) */}
            <div className="s16">
              <button className="s18" type="button" title="Create">
                <span className="s23">
                  <i className="s24 material-icons-outlined">add</i>
                </span>
                <span className="s25">Create</span>
              </button>
            </div>

            {/* All tasks / Starred (.s27) */}
            <div className="s26">
              <ul className="s27" aria-label="Select tasks to show">
                <li
                  className={activeNav === "all" ? "s28" : "s34"}
                  onClick={() => setActiveNav("all")}
                >
                  <span className={activeNav === "all" ? "s30" : "s35"}>
                    <i className="s31 material-icons-outlined">task_alt</i>
                  </span>
                  <span className="s32">
                    <span className={activeNav === "all" ? "s33" : "s36"}>All tasks</span>
                  </span>
                </li>
                <li
                  className={activeNav === "starred" ? "s28" : "s34"}
                  onClick={() => setActiveNav("starred")}
                >
                  <span className={activeNav === "starred" ? "s30" : "s35"}>
                    <i className="s31 material-icons-outlined">star_border</i>
                  </span>
                  <span className="s32">
                    <span className={activeNav === "starred" ? "s33" : "s36"}>Starred</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Lists (.s37) */}
            <div className="s37">
              <div className="s26">
                <div className="s26">
                  <div className="s7">
                    {/* header (.s38) */}
                    <div className="s38" onClick={() => setListsOpen((o) => !o)}>
                      <div className="s39">Lists</div>
                      <div className="s40">
                        <button
                          className="s41"
                          type="button"
                          aria-label="Toggle collapsing lists"
                        >
                          <span className="s42">
                            <i className="s43 material-icons-outlined">
                              {listsOpen ? "expand_less" : "expand_more"}
                            </i>
                          </span>
                        </button>
                      </div>
                    </div>

                    {listsOpen && (
                      <div className="s45">
                        {/* My Tasks (.s46 → .s34 + checkbox) */}
                        <ul className="s46" aria-label="Select task lists to show">
                          <li
                            className={activeNav === "my-tasks" ? "s28" : "s34"}
                            aria-label="My Tasks"
                            onClick={() => setActiveNav("my-tasks")}
                          >
                            <span className="s47">
                              <div className="s48">
                                <div className="s50">
                                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                                    <path
                                      fill="none"
                                      stroke="#1b1b1b"
                                      strokeWidth="3"
                                      d="M1.73,12.91 8.1,19.28 22.79,4.59"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </span>
                            <span className="s32">
                              <span className="s54">My Tasks</span>
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {listsOpen && (
                  <div className="s26">
                    {/* Create new list (.s46 → .s34, 24px add) */}
                    <ul className="s46" aria-label="Select task lists to show">
                      <li className="s34">
                        <span className="s55">
                          <i className="s56 material-icons-outlined">add</i>
                        </span>
                        <span className="s32">
                          <span className="s57">Create new list</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main panel (.s58 → .s59 → .s60) ────────────────────────────────── */}
      <div className="s58">
        <div className="s58">
          <div className="s59">
            <div className="s40" />
            <div className="s60">
              {/* Card (.s61) */}
              <div className="s61">
                {/* Sticky header (.s62) */}
                <div className="s62">
                  <div className="s63">
                    <h2 className="s64">My Tasks</h2>
                    <div className="s65">
                      <div className="s40">
                        <div className="s66" role="button" aria-label="List options">
                          <span className="s67">
                            <span className="s68">
                              <i className="s69 material-icons-outlined">more_vert</i>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add a task (.s70 → .s71) */}
                  <div className="s70">
                    <div className="s26">
                      <button className="s71" type="button">
                        <span className="s73">
                          <span className="s40">
                            <svg
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              style={{ width: 20, height: 20, fill: "#a8c7fa" }}
                            >
                              <rect fill="none" height="24" width="24" />
                              <path d="M22,5.18L10.59,16.6l-4.24-4.24l1.41-1.41l2.83,2.83l10-10L22,5.18z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8 c1.57,0,3.04,0.46,4.28,1.25l1.45-1.45C16.1,2.67,14.13,2,12,2C6.48,2,2,6.48,2,12s4.48,10,10,10c1.73,0,3.36-0.44,4.78-1.22 l-1.5-1.5C14.28,19.74,13.17,20,12,20z M19,15h-3v2h3v3h2v-3h3v-2h-3v-3h-2V15z" />
                            </svg>
                          </span>
                        </span>
                        <span className="s75">Add a task</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body — empty state (.s76 → .s82) */}
                <div className="s76">
                  <div className="s77">
                    <div className="s40" />
                    <div className="s78">
                      <div className="s79">
                        <div className="s82">
                          <div className="s83">
                            <div className="s84" />
                          </div>
                          <div className="s85">No tasks yet</div>
                          <div className="s86">
                            Add your to-dos and keep track of them across Google Workspace
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tasks-root {
          display: flex;
          flex: 1 1 auto;
          min-width: 0;
          background-color: #1b1b1b;
          overflow: hidden;
          user-select: none;
        }

        /* ── Sidebar ── */
        .s9 {
          flex-shrink: 0;
          border-right: 1px solid rgba(0, 0, 0, 0.87);
          transition: margin 0.25s ease;
        }
        .s11 {
          display: flex;
          position: relative;
          width: 256px;
          min-width: 256px;
          height: 100%;
          border-radius: 0 16px 16px 0;
          overflow: hidden auto;
        }
        .s15 {
          width: 256px;
          padding: 12px 8px 0 8px;
        }
        .s16 {
          padding-bottom: 20px;
          padding-left: 8px;
        }
        .s18 {
          display: inline-grid;
          position: relative;
          max-width: 100%;
          align-items: center;
          grid-template-columns: 16px 24px 12px auto 0px 20px;
          grid-template-rows: 24px;
          grid-auto-flow: column;
          padding-top: 16px;
          padding-bottom: 16px;
          background-color: #37393b;
          color: #ffffff;
          border-radius: 16px;
          cursor: pointer;
        }
        .s18:hover {
          background-color: #3f4143;
        }
        .s23 {
          display: flex;
          align-items: center;
          grid-column: 2 / 3;
          color: #e3e3e3;
          font-size: 24px;
        }
        .s24 {
          line-height: 24px;
        }
        .s25 {
          grid-column: 4 / span 2;
          color: #e3e3e3;
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── All tasks / Starred + list rows ── */
        .s27 {
          padding-top: 12px;
          padding-bottom: 16px;
        }
        .s28,
        .s34 {
          display: flex;
          position: relative;
          padding-right: 24px;
          padding-left: 16px;
          min-height: 32px;
          align-items: center;
          gap: 12px;
          border-radius: 100px;
          cursor: pointer;
        }
        .s28 {
          background-color: #004a77;
        }
        .s34:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }
        .s30 {
          display: flex;
          flex-shrink: 0;
          color: #c2e7ff;
          font-size: 20px;
        }
        .s35 {
          display: flex;
          flex-shrink: 0;
          color: #e3e3e3;
          font-size: 20px;
        }
        .s31 {
          line-height: 20px;
        }
        .s32 {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1 1 0%;
          align-self: stretch;
          color: #e3e3e3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .s33 {
          color: #c2e7ff;
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .s36 {
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          line-height: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Lists section ── */
        .s37 {
          padding-bottom: 8px;
        }
        .s7 {
          display: flex;
          flex-direction: column;
        }
        .s38 {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          cursor: pointer;
        }
        .s39 {
          margin-left: 16px;
          padding-top: 6px;
          padding-bottom: 6px;
          flex-grow: 1;
          color: #e3e3e3;
          font-family: "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0.25px;
        }
        .s41 {
          display: inline-flex;
          position: relative;
          margin-right: 12px;
          margin-left: 8px;
          padding: 5px;
          justify-content: center;
          align-items: center;
          color: #c4c7c5;
          border-radius: 16px;
          cursor: pointer;
        }
        .s41:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .s42 {
          z-index: 1;
          line-height: 0;
        }
        .s43 {
          color: #80868b;
          font-size: 22px;
          line-height: 22px;
        }
        .s46 {
          padding-top: 8px;
          padding-bottom: 8px;
        }
        .s47 {
          display: flex;
          flex-shrink: 0;
        }
        .s48 {
          display: flex;
          position: relative;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          line-height: 0;
        }
        .s50 {
          display: flex;
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          justify-content: center;
          align-items: center;
          background-color: #c4c7c5;
          border: 2px solid #c4c7c5;
          border-radius: 2px;
        }
        .s54 {
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0.2px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .s55 {
          display: flex;
          flex-shrink: 0;
          color: #c4c7c5;
          font-size: 24px;
        }
        .s56 {
          line-height: 24px;
        }
        .s57 {
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Main panel ── */
        .s58 {
          display: flex;
          flex-direction: column;
          flex: 1 1 100%;
          min-width: 0;
        }
        .s59 {
          display: flex;
          flex-direction: column;
          flex: 1 1 100%;
          padding-bottom: 8px;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .s60 {
          display: flex;
          padding-right: 4px;
          padding-left: 12px;
          min-width: 100%;
          justify-content: center;
          align-items: flex-start;
        }
        .s61 {
          display: flex;
          position: relative;
          flex-direction: column;
          flex-grow: 1;
          margin: 0 4px 4px 4px;
          min-width: 300px;
          max-width: 680px;
          max-height: 100%;
          background-color: #131314;
          border: 1px solid rgba(0, 0, 0, 0.87);
          border-radius: 16px;
          overflow: hidden;
        }
        .s62 {
          position: sticky;
          top: 0;
          z-index: 3000;
          background-color: #131314;
        }
        .s63 {
          display: flex;
          cursor: grab;
        }
        .s64 {
          margin-top: 8px;
          margin-left: 16px;
          padding-top: 8px;
          padding-bottom: 8px;
          flex: 1 1 0%;
          color: #e3e3e3;
          font-family: "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 24px;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .s65 {
          display: flex;
          margin-top: 8px;
          padding: 4px 8px;
        }
        .s66 {
          display: inline-flex;
          position: relative;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
        }
        .s66:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .s69 {
          color: #9aa0a6;
          font-size: 20px;
          line-height: 20px;
        }
        .s70 {
          padding: 4px 8px;
        }
        .s71 {
          display: flex;
          position: relative;
          padding-right: 16px;
          padding-left: 8px;
          min-width: 64px;
          min-height: 32px;
          align-items: center;
          color: #ffffff;
          border-radius: 20px;
          cursor: pointer;
        }
        .s71:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }
        .s73 {
          display: flex;
          flex-shrink: 0;
          color: #a8c7fa;
          line-height: 0;
        }
        .s73 .s40 {
          display: inline-flex;
          margin-right: 16px;
        }
        .s75 {
          color: #a8c7fa;
          font-family: "Google Sans Flex", "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
        }

        /* ── Empty state ── */
        .s76 {
          display: flex;
          position: relative;
          flex-direction: column;
          align-items: center;
          flex-grow: 1;
          padding-bottom: 8px;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .s77 {
          display: flex;
          flex-direction: column;
        }
        .s78 {
          flex-grow: 1;
          flex-shrink: 0;
        }
        .s79 {
          display: flex;
          position: relative;
          justify-content: center;
          align-items: center;
          min-height: 336px;
        }
        .s82 {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .s83 {
          margin-bottom: 12px;
        }
        .s84 {
          width: 104px;
          height: 104px;
          background-image: url("https://www.gstatic.com/tasks/empty-tasks-dark.svg");
          background-size: 104px 104px;
          background-repeat: no-repeat;
        }
        .s85 {
          margin-bottom: 16px;
          color: #e3e3e3;
          font-family: "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 18px;
          line-height: 24px;
          text-align: center;
        }
        .s86 {
          max-width: 260px;
          color: #c4c7c5;
          font-family: "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
          font-size: 14px;
          line-height: 20px;
          text-align: center;
        }

        /* Icon font: render glyphs at the size set by the s-class */
        :global(.s24),
        :global(.s31),
        :global(.s43),
        :global(.s56),
        :global(.s69) {
          font-family: "Material Icons Outlined", "Material Icons" !important;
        }
      `}</style>
    </div>
  );
}

export default TasksView;
