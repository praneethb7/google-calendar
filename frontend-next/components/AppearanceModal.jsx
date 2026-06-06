"use client";
import React, { useState, useEffect, useRef } from "react";

const GS = '"Google Sans", Roboto, Arial, sans-serif';

// Theme preview image dimensions — identical for all three cards.
const IMG_W = 140;
const IMG_H = 162;

const THEMES = [
  {
    id: "light",
    label: "Light",
    img: "https://ssl.gstatic.com/calendar/images/theme/theme_picker_light.svg",
  },
  {
    id: "dark",
    label: "Dark",
    img: "https://ssl.gstatic.com/calendar/images/theme/theme_picker_dark.svg",
  },
  {
    id: "device",
    label: "Device default",
    // Split preview: left half light, right half dark.
    imgLight: "https://ssl.gstatic.com/calendar/images/theme/theme_picker_device_light.svg",
    imgDark: "https://ssl.gstatic.com/calendar/images/theme/theme_picker_device_dark.svg",
  },
];

// Caret used on the filled dropdown fields. Points down; flips up when open.
function Caret({ up = false }) {
  return (
    <svg
      width="11"
      height="7"
      viewBox="0 0 11 7"
      focusable="false"
      aria-hidden="true"
      style={{
        fill: "currentColor",
        display: "block",
        transform: up ? "rotate(180deg)" : "none",
        transition: "transform 0.15s ease",
      }}
    >
      <polygon points="0,0 11,0 5.5,7" />
    </svg>
  );
}

const DENSITY_OPTIONS = [
  { id: "responsive", label: "Responsive to your screen" },
  { id: "compact", label: "Compact" },
];

const COLOR_SETS = [
  { id: "modern", label: "Modern (with white text)" },
  { id: "classic", label: "Classic (with black text)" },
];

function ThemeRadio({ selected }) {
  return (
    <span className="relative block shrink-0" style={{ width: 20, height: 20, margin: "4px 4px 4px 0" }}>
      <span
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${selected ? "#a8c7fa" : "#c4c7c5"}` }}
      />
      {selected && (
        <span
          className="absolute rounded-full"
          style={{ width: 10, height: 10, top: 5, left: 5, backgroundColor: "#a8c7fa" }}
        />
      )}
    </span>
  );
}

function AppearanceModal({ onClose }) {
  const [theme, setTheme] = useState("light");
  const [density, setDensity] = useState("responsive");

  // Read current theme + density on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("themePreference") : null;
    if (stored === "light" || stored === "dark" || stored === "device") {
      setTheme(stored);
    } else {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }
    const d = typeof window !== "undefined" ? localStorage.getItem("densityPreference") : null;
    if (d === "compact" || d === "responsive") setDensity(d);
    else setDensity(document.documentElement.classList.contains("density-compact") ? "compact" : "responsive");
  }, []);

  const handleDensityChange = (d) => {
    setDensity(d);
    try {
      localStorage.setItem("densityPreference", d);
    } catch {
      // ignore storage failures
    }
    document.documentElement.classList.toggle("density-compact", d === "compact");
  };

  const [colorSet, setColorSet] = useState("modern");
  useEffect(() => {
    const c = typeof window !== "undefined" ? localStorage.getItem("colorSetPreference") : null;
    if (c === "modern" || c === "classic") setColorSet(c);
    else setColorSet(document.documentElement.classList.contains("colorset-classic") ? "classic" : "modern");
  }, []);

  const handleColorSetChange = (c) => {
    setColorSet(c);
    try {
      localStorage.setItem("colorSetPreference", c);
    } catch {
      // ignore storage failures
    }
    document.documentElement.classList.toggle("colorset-classic", c === "classic");
  };

  // Color set is only configurable when the effective theme is light
  // (Light, or Device default resolving to a light system theme).
  const systemDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const colorSetEnabled = theme === "light" || (theme === "device" && !systemDark);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("themePreference", newTheme);
    } catch {
      // ignore storage failures
    }
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isSystemDark);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col bg-[#f0f4f9] dark:bg-[#282a2c] shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)]"
        style={{
          width: 640,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 32px)",
          borderRadius: 28,
        }}
      >
        {/* Title */}
        <h2
          className="text-[#1f1f1f] dark:text-[#e3e3e3]"
          style={{ padding: "24px 24px 16px 24px", fontFamily: GS, fontSize: 24, lineHeight: "32px" }}
        >
          Appearance
        </h2>

        {/* Body (scrollable) */}
        <div className="overflow-y-auto" style={{ padding: "0 24px 20px 24px" }}>
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* Theme cards */}
            <div className="flex" style={{ marginTop: 10, marginBottom: 20 }}>
              {THEMES.map((t) => {
                const selected = theme === t.id;
                return (
                  <div key={t.id} className="flex flex-col items-center flex-1 basis-0">
                    <button
                      type="button"
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex flex-col ${selected ? "bg-[#d3e3fd] dark:bg-[#0842a0]" : "bg-transparent"}`}
                      style={{
                        padding: "10px 10px 5px 10px",
                        borderRadius: 16,
                      }}
                    >
                      {t.id === "device" ? (
                        <span
                          className="relative block"
                          style={{ width: IMG_W, height: IMG_H, marginBottom: 5 }}
                        >
                          {/* Left half: device_light is natively 70×162 (the left slice). */}
                          <img
                            src={t.imgLight}
                            alt=""
                            aria-hidden="true"
                            draggable="false"
                            className="absolute top-0 left-0 block"
                            style={{ width: IMG_W / 2, height: IMG_H }}
                          />
                          {/* Right half: device_dark is the full 140×162, clipped to its right side. */}
                          <img
                            src={t.imgDark}
                            alt=""
                            aria-hidden="true"
                            draggable="false"
                            className="absolute top-0 left-0 block"
                            style={{ width: IMG_W, height: IMG_H, clipPath: "inset(0 0 0 50%)" }}
                          />
                        </span>
                      ) : (
                        <img
                          src={t.img}
                          alt=""
                          aria-hidden="true"
                          draggable="false"
                          style={{ width: IMG_W, height: IMG_H, objectFit: "fill", marginBottom: 5, display: "block" }}
                        />
                      )}
                      {/* Radio + label row (inside the frame) */}
                      <span className="flex items-center" style={{ width: 140, gap: 8 }}>
                        <ThemeRadio selected={selected} />
                        <span
                          className="text-[#1f1f1f] dark:text-[#e3e3e3]"
                          style={{ fontSize: 16, letterSpacing: "0.2px", fontFamily: GS }}
                        >
                          {t.label}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Color set — enabled only in light / device-light */}
            <SelectField
              label="Color set"
              options={COLOR_SETS}
              value={colorSet}
              onChange={handleColorSetChange}
              disabled={!colorSetEnabled}
            />

            {/* Information density — interactive dropdown */}
            <SelectField
              label="Information density"
              options={DENSITY_OPTIONS}
              value={density}
              onChange={handleDensityChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end flex-wrap"
          style={{ padding: "0 24px 20px 24px", gap: 8, minHeight: 52 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-[20px] hover:bg-[#0b57d0]/10 dark:hover:bg-[#a8c7fa]/10 transition-colors"
            style={{
              minWidth: 64,
              height: 40,
              padding: "0 12px",
              margin: "4px 0",
            }}
          >
            <span
              className="text-[#0b57d0] dark:text-[#a8c7fa]"
              style={{ fontSize: 14, fontWeight: 500, fontFamily: GS }}
            >
              Done
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Filled dropdown field. Interactive when enabled; dimmed/static when disabled.
function SelectField({ label, options, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const fieldRef = useRef(null);
  const menuRef = useRef(null);

  const currentLabel = options.find((o) => o.id === value)?.label ?? "";

  const measure = () => {
    const r = fieldRef.current?.getBoundingClientRect();
    if (r) setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  // Close on outside click; reposition while open. (No-op when not open.)
  useEffect(() => {
    if (!open && !focused) return undefined;
    const onDown = (e) => {
      if (fieldRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
      setFocused(false);
    };
    const onReflow = () => open && measure();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, focused]);

  // Disabled: render a static, dimmed field with no interaction.
  if (disabled) {
    return (
      <div className="flex relative" style={{ minHeight: 52 }}>
        <div
          className="relative flex items-baseline flex-1 overflow-hidden cursor-default bg-black/[0.04] dark:bg-[rgba(227,227,227,0.04)]"
          style={{ height: 52, paddingLeft: 16, borderRadius: 4 }}
        >
          <span
            className="absolute whitespace-nowrap text-black/40 dark:text-[rgba(227,227,227,0.38)]"
            style={{ top: 8, left: 16, fontSize: 12, lineHeight: "16px", fontFamily: GS }}
          >
            {label}
          </span>
          <span className="flex flex-1" style={{ paddingTop: 23 }}>
            <span
              className="truncate text-black/40 dark:text-[rgba(227,227,227,0.38)]"
              style={{ fontSize: 14, lineHeight: "24px", fontFamily: GS }}
            >
              {currentLabel}
            </span>
          </span>
          <span
            className="flex items-center justify-center self-center shrink-0 text-black/40 dark:text-[rgba(227,227,227,0.38)]"
            style={{ margin: "0 12px" }}
          >
            <Caret />
          </span>
        </div>
      </div>
    );
  }

  const toggle = () => {
    if (open) {
      setOpen(false);
    } else {
      measure();
      setOpen(true);
      setFocused(true);
    }
  };

  const select = (id) => {
    onChange(id);
    setOpen(false);
  };

  const accent = focused
    ? "text-[#0b57d0] dark:text-[#a8c7fa]"
    : "text-[#444746] dark:text-[#c4c7c5]";

  return (
    <div className="flex relative" style={{ minHeight: 52 }}>
      <button
        type="button"
        ref={fieldRef}
        onClick={toggle}
        className="relative flex items-baseline flex-1 overflow-hidden text-left bg-[#e1e3e6] dark:bg-[#333537]"
        style={{ height: 52, paddingLeft: 16, borderRadius: 4, cursor: "pointer" }}
      >
        {/* Floating label */}
        <span
          className={`absolute whitespace-nowrap ${accent}`}
          style={{ top: 8, left: 16, fontSize: 12, lineHeight: "16px", fontFamily: GS }}
        >
          {label}
        </span>
        {/* Value */}
        <span className="flex flex-1" style={{ paddingTop: 23 }}>
          <span
            className="truncate text-[#1f1f1f] dark:text-[#e3e3e3]"
            style={{ fontSize: 14, lineHeight: "24px", fontFamily: GS }}
          >
            {currentLabel}
          </span>
        </span>
        {/* Caret — flips up when open */}
        <span className={`flex items-center justify-center self-center shrink-0 ${accent}`} style={{ margin: "0 12px" }}>
          <Caret up={open} />
        </span>
        {/* Active indicator underline */}
        {focused && (
          <span
            className="absolute left-0 right-0 bottom-0 bg-[#0b57d0] dark:bg-[#a8c7fa]"
            style={{ height: 2 }}
          />
        )}
      </button>

      {open && menuRect && (
        <div
          ref={menuRef}
          className="fixed z-[110] bg-white dark:bg-[#1e1f20] shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.3)]"
          style={{
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
            borderRadius: 4,
            padding: "8px 0",
          }}
        >
          {options.map((o) => {
            const isSel = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => select(o.id)}
                className={`group relative flex items-center w-full text-left ${isSel ? "bg-[#e8eaed] dark:bg-[#444746]" : ""}`}
                style={{ minHeight: 40, padding: "8px 16px", gap: 12, borderRadius: isSel ? 8 : 0 }}
              >
                {/* Hover overlay */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] bg-[#1f1f1f] dark:bg-[#e3e3e3] pointer-events-none"
                  style={{ borderRadius: isSel ? 8 : 0 }}
                />
                {/* Focus ring — only on hover */}
                <span
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{ border: "3px solid #7fcfff", borderRadius: 8 }}
                />
                <span
                  className="relative truncate text-[#1f1f1f] dark:text-[#e3e3e3]"
                  style={{ fontSize: 14, lineHeight: "20px", fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AppearanceModal;
