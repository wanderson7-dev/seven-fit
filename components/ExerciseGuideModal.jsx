"use client";

import React, { useState, useEffect } from "react";
import { Flame, Star, AlertTriangle, X } from "lucide-react";

export default function ExerciseGuideModal({ isOpen, onClose, exerciseName }) {
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !exerciseName) return;

    const fetchGuide = async () => {
      setLoading(true);
      setError("");
      setApiMessage("");
      try {
        const res = await fetch(`/api/exercise-guide?name=${encodeURIComponent(exerciseName)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setGuide(data.guide);
          if (data.message) {
            setApiMessage(data.message);
          }
        } else {
          setError(data.error || "Não foi possível carregar o guia.");
        }
      } catch (err) {
        setError("Erro de rede ao buscar o guia.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [isOpen, exerciseName]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.93)",
        zIndex: 600,
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="modal-sheet"
        style={{
          position: "relative",
          bottom: "auto",
          left: "auto",
          transform: "none",
          width: "100%",
          maxWidth: "460px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          className="row-sb"
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "#161624",
          }}
        >
          <div>
            <div className="small" style={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "1px" }}>
              Guia de Execução
            </div>
            <div className="syne" style={{ fontSize: "16px", fontWeight: "800", color: "#f97316" }}>
              {exerciseName}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: "12px", border: "none", background: "rgba(255,255,255,0.04)" }}
            onClick={onClose}
          >
            ✕ Fechar
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: "16px" }}>
              <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <div className="small" style={{ letterSpacing: "0.5px" }}>Analisando biomecânica do exercício...</div>
            </div>
          )}

          {error && (
            <div style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", padding: "20px" }}>
              {error}
            </div>
          )}

          {!loading && !error && guide && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              {/* Target Muscles */}
              <div>
                <div className="label">Foco Muscular</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", background: "rgba(249,115,22,0.15)", color: "#f97316", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(249,115,22,0.25)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Flame size={12} /> Primário: {guide.musclePrimary}
                  </span>
                  {guide.muscleSecondary && (
                    <span style={{ fontSize: "10px", fontWeight: "600", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Auxiliares: {guide.muscleSecondary}
                    </span>
                  )}
                </div>
              </div>

              {/* Setup checklist */}
              <div>
                <div className="label" style={{ marginBottom: "6px" }}>1. Preparação e Postura</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {guide.setup.map((step, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <span style={{ color: "#f97316", fontWeight: "700", minWidth: "15px" }}>{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution steps */}
              <div>
                <div className="label" style={{ marginBottom: "6px" }}>2. Execução do Movimento</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {guide.execution.map((step, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                      <span style={{ color: "#10b981", fontWeight: "700", minWidth: "15px" }}>✓</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              {guide.proTip && (
                <div
                  style={{
                    background: "rgba(249,115,22,0.04)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: "14px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#f97316", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Star size={12} fill="#f97316" /> Dica de Ouro
                  </div>
                  <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.85)", fontStyle: "italic", lineHeight: "1.4" }}>
                    {`"${guide.proTip}"`}
                  </div>
                </div>
              )}

              {/* Common mistakes */}
              <div>
                <div className="label" style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={14} /> Erros Comuns a Evitar</div>
                <div
                  style={{
                    background: "rgba(239,68,68,0.04)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "6px"
                  }}
                >
                  {guide.mistakes.map((mistake, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.8)", alignItems: "flex-start" }}>
                      <X size={12} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
                      <span>{mistake}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Info Message */}
              {apiMessage && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px", fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: "1.3" }}>
                  💡 {apiMessage}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
