"use client";

import React from "react";
import { LayoutDashboard, Utensils, Dumbbell, Camera, Settings } from "lucide-react";

export default function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dash", icon: LayoutDashboard },
    { id: "diet", label: "Dieta", icon: Utensils },
    { id: "workout", label: "Treino", icon: Dumbbell },
    { id: "progress", label: "Progresso", icon: Camera },
    { id: "settings", label: "Config", icon: Settings },
  ];

  return (
    <div className="tab-bar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "24px" }}>
              <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <small>{tab.label}</small>
            {isActive && <div className="dot" />}
          </button>
        );
      })}
    </div>
  );
}
