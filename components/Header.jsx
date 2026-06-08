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
    <div style={{ padding: "28px 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        {/* Date + sync badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "500", textTransform: "capitalize" }}>
            {getFormattedDate()}
          </span>

          {isSyncing && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.25)",
              color: "#f97316", borderRadius: "99px", padding: "2px 8px", fontSize: "9px", fontWeight: "700",
            }}>
              <RefreshCw size={9} style={{ animation: "spin 1s linear infinite" }} />
              SINCRONIZANDO
            </span>
          )}

          {!isSyncing && user && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)",
              color: "#10b981", borderRadius: "99px", padding: "2px 8px", fontSize: "9px", fontWeight: "700",
            }}>
              <Cloud size={9} />
              NUVEM ATIVA
            </span>
          )}

          {!isSyncing && !user && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)", borderRadius: "99px", padding: "2px 8px", fontSize: "9px", fontWeight: "700",
            }}>
              <CloudOff size={9} />
              VISITANTE
            </span>
          )}
        </div>

        {/* App name */}
        <div className="syne" style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.8px", lineHeight: 1.1 }}>
          CuttingOS{" "}
          <span style={{
            color: schedColor,
            filter: `drop-shadow(0 0 8px ${schedColor}88)`,
          }}>●</span>
        </div>
      </div>

      {/* Today's workout badge */}
      {todaySched && (
        <div style={{
          background: `${schedColor}18`,
          border: `1px solid ${schedColor}35`,
          borderRadius: "14px",
          padding: "9px 14px",
          fontSize: "11px",
          fontWeight: "700",
          color: schedColor,
          maxWidth: "130px",
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "0.1px",
        }}>
          {todaySched.type}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
