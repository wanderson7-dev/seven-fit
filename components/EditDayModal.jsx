"use client";

import React, { useState, useEffect } from "react";

export default function EditDayModal({ isOpen, onClose, dayIndex, schedule, saveDayEdit, COLORS }) {
  const [typeName, setTypeName] = useState("");
  const [exerciseGroup, setExerciseGroup] = useState("");
  const [calType, setCalType] = useState("normal");
  const [selectedColor, setSelectedColor] = useState("");

  const dayObj = schedule && dayIndex !== null ? schedule[dayIndex] : null;

  useEffect(() => {
    if (dayObj) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTypeName(dayObj.type || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExerciseGroup(dayObj.group || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalType(dayObj.calType || "normal");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedColor(dayObj.color || COLORS[0]);
    }
  }, [dayObj, COLORS]);

  if (!isOpen || !dayObj) return null;

  const handleSave = () => {
    saveDayEdit(dayIndex, {
      ...dayObj,
      type: typeName,
      group: exerciseGroup || null,
      calType: calType,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200 }}>
      <div className="modal-sheet">
        <div className="syne" style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>
          Editar {dayObj.day}
        </div>
        
        <div className="label">Nome do treino</div>
        <input
          placeholder="Push, Pull, Legs..."
          value={typeName}
          onChange={(e) => setTypeName(e.target.value)}
          style={{ marginBottom: "12px" }}
        />

        <div className="label" style={{ marginTop: "4px" }}>Grupo de exercícios</div>
        <select
          value={exerciseGroup}
          onChange={(e) => setExerciseGroup(e.target.value)}
          style={{ marginBottom: "12px" }}
        >
          <option value="">— Nenhum —</option>
          <option value="Push">Push</option>
          <option value="Pull">Pull</option>
          <option value="Legs">Legs</option>
          <option value="Upper">Upper</option>
          <option value="Lower">Lower</option>
        </select>

        <div className="label">Calorias do dia</div>
        <select
          value={calType}
          onChange={(e) => setCalType(e.target.value)}
          style={{ marginBottom: "12px" }}
        >
          <option value="normal">2600 kcal — Normal</option>
          <option value="heavy">2800 kcal — Pesado</option>
          <option value="free">Livre 🍕</option>
        </select>

        <div className="label" style={{ marginBottom: "8px" }}>Cor</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-dot ${c === selectedColor ? "sel" : ""}`}
              style={{ background: c }}
              onClick={() => setSelectedColor(c)}
            />
          ))}
        </div>

        <div className="row" style={{ gap: "10px" }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
            Salvar
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
