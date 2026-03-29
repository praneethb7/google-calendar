"use client";
import React, { useState, useEffect } from "react";

function AppearanceModal({ onClose }) {
  const [theme, setTheme] = useState("light");

  // Read current theme on mount
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    } else {
      setTheme("light"); // We can default to light if not dark, ignoring OS for this mock
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // For device default, we would normally check window.matchMedia
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="bg-[#f0f4f9] dark:bg-[#1f1f1f] rounded-[24px] wfull max-w-[500px] p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[22px] font-normal text-google-gray-900 dark:text-gray-100 mb-6">
          Appearance
        </h2>

        {/* Theme Cards Container */}
        <div className="flex justify-between gap-4 mb-8">
          {/* Light Theme Card */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => handleThemeChange("light")}>
            <div className={`w-36 h-40 rounded-xl mb-3 flex flex-col pt-3 px-3 shadow-md ${theme === 'light' ? 'bg-[#d3e3fd]' : 'bg-white border border-gray-200'} transition-all`}>
              <div className="bg-white flex-1 rounded-t-lg shadow-sm border border-gray-100 p-2 flex flex-col gap-2 relative overflow-hidden">
                {/* Mock UI */}
                <div className="w-5 h-5 bg-blue-500 rounded-sm mb-1"></div>
                <div className="w-8 h-8 rounded-full shadow-sm bg-white flex items-center justify-center border border-gray-100">
                  <span className="text-xl">+</span>
                </div>
                <div className="h-1 bg-gray-200 rounded w-full mt-2"></div>
                <div className="h-1 bg-gray-200 rounded w-full"></div>
                <div className="h-1 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'light' ? 'border-blue-600' : 'border-gray-500'}`}>
                {theme === 'light' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </div>
              Light
            </div>
          </div>

          {/* Dark Theme Card */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => handleThemeChange("dark")}>
            <div className={`w-36 h-40 rounded-xl mb-3 flex flex-col pt-3 px-3 shadow-md ${theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#1f1f1f] border border-gray-700'} transition-all`}>
              <div className="bg-[#202124] flex-1 rounded-t-lg shadow-sm border border-gray-800 p-2 flex flex-col gap-2 relative overflow-hidden">
                <div className="w-5 h-5 bg-blue-500 rounded-sm mb-1"></div>
                <div className="w-8 h-8 rounded-full shadow-sm bg-[#3c4043] text-white flex items-center justify-center border border-gray-700">
                  <span className="text-xl">+</span>
                </div>
                <div className="h-1 bg-gray-600 rounded w-full mt-2"></div>
                <div className="h-1 bg-gray-600 rounded w-full"></div>
                <div className="h-1 bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'dark' ? 'border-blue-600' : 'border-gray-500'}`}>
                {theme === 'dark' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </div>
              Dark
            </div>
          </div>

          {/* Device Default Card */}
          <div className="flex flex-col items-center cursor-pointer" onClick={() => handleThemeChange("device")}>
            <div className={`w-36 h-40 rounded-xl mb-3 flex flex-col pt-3 px-3 shadow-md ${theme === 'device' ? 'bg-[#d3e3fd]' : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'} transition-all`}>
              <div className="flex flex-1 rounded-t-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-white flex-1 p-2 flex flex-col gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-sm mb-1"></div>
                  <div className="w-8 h-8 rounded-full shadow-sm bg-white flex items-center justify-center border border-gray-100">
                    <span className="text-xl">+</span>
                  </div>
                </div>
                <div className="bg-[#202124] flex-1 p-2 flex flex-col gap-2 items-end">
                  <div className="h-1 bg-gray-600 rounded w-full mt-[44px]"></div>
                  <div className="h-1 bg-gray-600 rounded w-full"></div>
                  <div className="h-1 bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${theme === 'device' ? 'border-blue-600' : 'border-gray-500'}`}>
                {theme === 'device' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </div>
              Device default
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="space-y-4">
          <div className="flex flex-col border border-gray-300 dark:border-gray-600 bg-[#f8fafd] dark:bg-[#3c4043] rounded-t-lg p-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Color set</span>
            <select className="bg-transparent text-sm w-full outline-none text-gray-800 dark:text-gray-200 cursor-pointer appearance-none">
              <option>Modern (with white text)</option>
              <option>Classic (with black text)</option>
            </select>
            {/* Absolute positioning for select arrow could go here */}
          </div>
          
          <div className="flex flex-col border-b border-x border-gray-300 dark:border-gray-600 bg-[#f8fafd] dark:bg-[#3c4043] rounded-b-lg p-3 -mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Information density</span>
            <select className="bg-transparent text-sm w-full outline-none text-gray-800 dark:text-gray-200 cursor-pointer appearance-none">
              <option>Responsive to your screen</option>
              <option>Compact</option>
            </select>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end mt-8">
          <button 
            onClick={onClose}
            className="text-blue-600 dark:text-blue-400 font-medium text-sm px-6 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppearanceModal;
