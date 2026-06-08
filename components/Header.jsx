import React from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export default function Header({ todaySched, user, isSyncing }) {
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const schedColor = todaySched?.color || "#f97316";

  return (
    <div style={{ padding: "24px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div className="small" style={{ marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{getFormattedDate()}</span>
          {isSyncing && (
            <span style={{ display: "inline-flex", alignItems: "center", color: "#f97316", gap: "4px" }}>
              <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "9px" }}>sincronizando...</span>
            </span>
          )}
          {!isSyncing && user && (
            <span style={{ display: "inline-flex", alignItems: "center", color: "#10b981", gap: "3px" }}>
              <Cloud size={11} />
              <span style={{ fontSize: "9px" }}>nuvem ativa</span>
            </span>
          )}
          {!isSyncing && !user && (
            <span style={{ display: "inline-flex", alignItems: "center", color: "rgba(255,255,255,0.3)", gap: "3px" }}>
              <CloudOff size={11} />
              <span style={{ fontSize: "9px" }}>modo visitante</span>
            </span>
          )}
        </div>
        <div className="syne" style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>
          CuttingOS <span style={{ color: schedColor }}>●</span>
        </div>
      </div>
      {todaySched && (
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "8px 14px",
            fontSize: "11px",
            fontWeight: "600",
            color: schedColor,
            border: `1px solid ${schedColor}30`,
          }}
        >
          {todaySched.type}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

