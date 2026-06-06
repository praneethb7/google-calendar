"use client";
import { useState, useEffect, useRef } from "react";
import { useCalendarStore } from "@/store/useCalendarStore";

const GS = '"Google Sans", Roboto, Arial, sans-serif';

function SearchBar({ onEventClick, user }) {
  const { searchEvents } = useCalendarStore();

  const [expanded, setExpanded] = useState(false); // search mode mounted
  const [shown, setShown] = useState(false); // animation flag
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef(null);

  const open = () => {
    setExpanded(true);
    requestAnimationFrame(() => setShown(true));
  };

  const close = () => {
    setShown(false);
    setShowResults(false);
    setTimeout(() => {
      setExpanded(false);
      setQuery("");
      setResults([]);
    }, 200);
  };

  // Focus the input once the bar has mounted; close on Escape.
  useEffect(() => {
    if (!expanded) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    try {
      const events = await searchEvents(q);
      setResults(events || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (event) => {
    onEventClick?.(event);
    close();
  };

  return (
    <>
      {/* Collapsed trigger */}
      <button className="icon-button" title="Search" aria-label="Search" onClick={open}>
        <svg viewBox="0 0 24 24" width="24" height="24" className="dark:text-[#c4c7c5]">
          <path
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Full-header search mode */}
      {expanded && (
        <div
          className={`fixed top-0 inset-x-0 h-16 z-[60] flex items-center px-2 bg-white dark:bg-[#1b1b1b] transition-[opacity,transform] duration-200 ease-out ${
            shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
          {/* Left: back + Search */}
          <div className="flex items-center" style={{ minWidth: 238 }}>
            <button
              onClick={close}
              title="Go back"
              aria-label="Go back"
              className="w-12 h-12 mx-1 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="fill-[#444746] dark:fill-white">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <span
              className="pl-1 text-[#444746] dark:text-white"
              style={{ fontFamily: GS, fontSize: 20, letterSpacing: "0.25px" }}
            >
              Search
            </span>
          </div>

          {/* Center: search pill */}
          <div className="flex-1 flex justify-center px-4 min-w-0">
            <div className="relative w-full" style={{ maxWidth: 720 }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(query);
                }}
                className="flex items-center bg-white dark:bg-[#131314] border border-google-gray-200 dark:border-[rgba(95,99,104,0.45)]"
                style={{
                  height: 48,
                  borderRadius: 28,
                  boxShadow:
                    "rgba(65,69,73,0.3) 0px 1px 1px 0px, rgba(65,69,73,0.15) 0px 1px 3px 1px",
                }}
              >
                {/* Magnifier (submit) */}
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex items-center justify-center shrink-0 rounded-full m-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ width: 40, height: 40 }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="fill-[#5f6368] dark:fill-[#c4c7c5]">
                    <path d="M20.49,19l-5.73-5.73C15.53,12.2,16,10.91,16,9.5C16,5.91,13.09,3,9.5,3S3,5.91,3,9.5C3,13.09,5.91,16,9.5,16 c1.41,0,2.7-0.47,3.77-1.24L19,20.49L20.49,19z M5,9.5C5,7.01,7.01,5,9.5,5S14,7.01,14,9.5S11.99,14,9.5,14S5,11.99,5,9.5z" />
                  </svg>
                </button>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => runSearch(e.target.value)}
                  onFocus={() => query && setShowResults(true)}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[#202124] dark:text-[#e3e3e3] placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6]"
                  style={{ fontFamily: GS, fontSize: 16 }}
                />

                {/* Dropdown arrow (search options) */}
                <button
                  type="button"
                  aria-label="Search options"
                  className="flex items-center justify-center shrink-0 rounded-full m-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ width: 40, height: 40 }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="fill-[#5f6368] dark:fill-[#c4c7c5]">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
              </form>

              {/* Results dropdown */}
              {showResults && (
                <div className="absolute left-0 right-0 top-[56px] z-10 max-h-[60vh] overflow-y-auto bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-google-md border border-google-gray-200 dark:border-[#444746]">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-google-gray-500 dark:text-[#9aa0a6]">
                      Searching…
                    </div>
                  ) : results.length > 0 ? (
                    results.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleResultClick(event)}
                        className="flex items-start gap-3 w-full text-left px-4 py-3 hover:bg-google-gray-100 dark:hover:bg-[#37393b] transition-colors"
                      >
                        <span
                          className="mt-0.5 w-1 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: event.calendar_color || event.color || "#1a73e8" }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-google-gray-800 dark:text-[#e3e3e3]">
                            {event.title || "(No title)"}
                          </span>
                          <span className="block truncate text-xs text-google-gray-500 dark:text-[#9aa0a6]">
                            {event.start_time &&
                              new Date(event.start_time).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            {event.location ? ` • ${event.location}` : ""}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-google-gray-500 dark:text-[#9aa0a6]">
                      No events found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: apps grid + account */}
          <div className="flex items-center shrink-0">
            <button className="icon-button" title="Google apps">
              <span className="material-icons-outlined text-[24px] dark:text-[#c4c7c5]">apps</span>
            </button>
            <div className="flex items-center gap-2 border border-google-gray-300 dark:border-[#e3e3e3] rounded-full pl-3 pr-1 py-[3px] ml-2 hover:bg-google-gray-50 dark:hover:bg-[#37393b] transition-colors cursor-pointer">
              <span className="bg-white rounded-[6px] px-1.5 py-1 flex items-center select-none">
                <img
                  src="https://www.google.com/u/0/ac/images/logo.gif?uid=102332194607365647406&service=google_gsuite"
                  alt="Google"
                  className="h-5 w-auto"
                />
              </span>
              <span className="bg-[#1a73e8] text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-medium select-none">
                {(user?.name || user?.email || "P").charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchBar;
