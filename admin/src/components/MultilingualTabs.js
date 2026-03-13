"use client";
import { useState } from "react";

export default function MultilingualTabs({ children, activeTab, onTabChange }) {
  const tabs = [
    { key: "en", label: "English", flag: "EN" },
    { key: "ps", label: "پښتو", flag: "PS" },
    { key: "dr", label: "دری", flag: "DR" },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-gray-50 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-white text-primary shadow-sm"
                : "text-body hover:text-navy"
            }`}
          >
            <span className="mr-1.5 text-xs font-bold opacity-60">{tab.flag}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div dir={activeTab === "en" ? "ltr" : "rtl"}>
        {children}
      </div>
    </div>
  );
}
