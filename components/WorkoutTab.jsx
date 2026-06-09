"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle2, BookOpen, History, ArrowLeftRight, X, Plus, Save, Zap, Droplets, ChevronDown } from "lucide-react";

export default function WorkoutTab({
  state,
  saveSessionWorkout,
  removeWorkoutLog,
  getExercises,
  saveCustomExercise,
  SET_TYPES,
  today,
  fmtDate,
  openHistoryModal, // To view past records of a specific exercise
  openGuideModal, // To view exercise execution guide
}) {
  const [activeSubTab, setActiveSubTab] = useState("session");
  const [histWrkDate, setHistWrkDate] = useState("");
  const [sessionDate, setSessionDate] = useState(() => today());

  // Session State
  const [activeEx, setActiveEx] = useState(null);
  const [currentSets, setCurrentSets] = useState([]);
  const [sessionExs, setSessionExs] = useState([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [serieType, setSerieType] = useState("valida");
  const [serieWeight, setSerieWeight] = useState("");
  const [serieReps, setSerieReps] = useState("");

  const [showExPicker, setShowExPicker] = useState(false);
  const [customExName, setCustomExName] = useState("");
  const [swapForIndex, setSwapForIndex] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // override manual de grupo

  // Ícone de cada tipo de série
  const setTypeIcon = (id, size = 14) => {
    if (id === "aquecimento") return <Flame size={size} />;
    if (id === "pap")         return <Zap size={size} />;
    if (id === "feeder")      return <Droplets size={size} />;
    return <CheckCircle2 size={size} />;
  };

  // Retorna o cronograma do dia correspondente à data da sessão
  function schedForDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()];
    return state.schedule.find((x) => x.day === dow) || state.schedule[6];
  }

  const s = schedForDate(sessionDate);
  const activeGroup = selectedGroup || s.group;
  const exs = getExercises(activeGroup);
  const ALL_GROUPS = ["Push", "Pull", "Legs", "Upper", "Lower"];

  // Get previous performance hint for an exercise
  const getPrevPerf = (exName) => {
    const logs = state.workoutLogs || [];
    const perf = [];
    logs.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (ex.name === exName) {
          perf.push({ date: w.date, sets: ex.sets });
        }
      });
    });
    return perf;
  };

  const getPrevPerfHint = (exName) => {
    const prev = getPrevPerf(exName);
    if (!prev.length) return null;
    const last = prev[prev.length - 1];
    const vs = last.sets.filter((x) => x.type === "valida");
    if (!vs.length) return null;

    const mx = vs.reduce((a, x) => (x.weight > a.weight ? x : a), vs[0]);
    const vol = vs.reduce((a, x) => a + x.weight * x.reps, 0);

    return (
      <div
        style={{
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "12px",
          padding: "10px 14px",
          marginBottom: "16px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <History size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <span>Última: <strong style={{ color: "#fff" }}>{mx.weight}kg × {mx.reps}</strong> (válida) · Vol: {vol}kg</span>
      </div>
    );
  };

  // Add a set to current working exercise
  const handleAddSet = () => {
    const w = parseFloat(serieWeight);
    const r = parseInt(serieReps);
    if (isNaN(w) || isNaN(r)) return;

    setCurrentSets([...currentSets, { type: serieType, weight: w, reps: r }]);
    setSerieWeight("");
    setSerieReps("");
  };

  const handleRemoveSet = (index) => {
    setCurrentSets(currentSets.filter((_, i) => i !== index));
  };

  // Finish active exercise and add it to session
  const handleFinishEx = () => {
    if (!activeEx || !currentSets.length) return;
    setSessionExs([...sessionExs, { name: activeEx, sets: currentSets }]);
    setActiveEx(null);
    setCurrentSets([]);
  };

  const handleCancelEx = () => {
    setActiveEx(null);
    setCurrentSets([]);
  };

  // Swap exercise
  const handleSwapEx = (index, newExName) => {
    const updated = [...sessionExs];
    updated[index].name = newExName;
    setSessionExs(updated);
    setSwapForIndex(null);
  };

  const handleRemoveSessionEx = (index) => {
    setSessionExs(sessionExs.filter((_, i) => i !== index));
  };

  // Save the entire workout session
  const handleSaveWorkout = () => {
    // If there is an active exercise with sets, auto-conclude it first
    let finalExs = [...sessionExs];
    if (activeEx && currentSets.length) {
      finalExs.push({ name: activeEx, sets: currentSets });
    }

    if (!finalExs.length) return;

    // Calculate total volume (working sets only)
    const volume = finalExs.reduce((totVol, ex) => {
      const workingSets = ex.sets.filter((x) => x.type === "valida");
      return totVol + workingSets.reduce((a, x) => a + x.weight * x.reps, 0);
    }, 0);

    saveSessionWorkout({
      date: sessionDate,
      type: s.type,
      exercises: finalExs,
      notes: sessionNotes,
      volume,
    });

    // Reset states
    setSessionExs([]);
    setActiveEx(null);
    setCurrentSets([]);
    setSessionNotes("");
    setShowExPicker(false);
  };

  const handleAddCustomEx = () => {
    const name = customExName.trim();
    if (!name) return;
    
    // Save permanently in the current workout group
    if (saveCustomExercise && s.group) {
      saveCustomExercise(s.group, name);
    }
    
    // Auto select this newly created exercise
    setActiveEx(name);
    setCurrentSets([]);
    setCustomExName("");
    setShowExPicker(false);
  };

  const handleSelectEx = (exName) => {
    setActiveEx(exName);
    setCurrentSets([]);
    setShowExPicker(false);
  };

  // Setup historical dropdown date
  const dates = [...new Set(state.workoutLogs.map((w) => w.date))].sort().reverse();
  useEffect(() => {
    if (dates.length && !histWrkDate) {
      setHistWrkDate(dates[0]);
    }
  }, [dates, histWrkDate]);

  return (
    <div>
      {/* TODAY'S WORKOUT TARGET HEADER */}
      <div
        style={{
          background: `linear-gradient(135deg, ${s.color}18, rgba(255,255,255,0.02))`,
          border: `1px solid ${s.color}30`,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
          {sessionDate === today() ? "Treino de Hoje" : `Treino de ${fmtDate(sessionDate)}`}
        </div>
        <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>
          {s.type}
        </div>
        <div className="small" style={{ marginTop: "4px" }}>
          {activeGroup ? `${exs.length} exercícios — ${activeGroup}` : "Selecione um grupo muscular abaixo"}
        </div>
      </div>

      {/* SUB TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          className={`sub-tab ${activeSubTab === "session" ? "active" : ""}`}
          onClick={() => setActiveSubTab("session")}
        >
          Sessão
        </button>
        <button
          className={`sub-tab ${activeSubTab === "history" ? "active" : ""}`}
          onClick={() => setActiveSubTab("history")}
        >
          Histórico
        </button>
      </div>

      {/* SESSÃO SUB-TAB */}
      {activeSubTab === "session" && (
        <div>
          {/* Session Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", minWidth: 0 }}>
            <input
              type="date"
              value={sessionDate}
              max={today()}
              onChange={(e) => setSessionDate(e.target.value || today())}
              style={{ fontWeight: "600", fontSize: "13px", minWidth: 0, flex: 1, width: "100%" }}
            />
            {sessionDate !== today() && (
              <button
                className="btn btn-ghost"
                style={{ padding: "10px 12px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
                onClick={() => setSessionDate(today())}
              >
                Hoje
              </button>
            )}
          </div>

          {/* Active exercise editor */}
          {activeEx ? (
            <div className="card">
              <div className="row-sb" style={{ marginBottom: "16px" }}>
                <div>
                  <div className="small" style={{ marginBottom: "4px" }}>Exercício atual</div>
                  <div className="syne" style={{ fontSize: "18px", fontWeight: "700", color: s.color }}>
                    {activeEx}
                  </div>
                </div>
                <div className="row" style={{ gap: "6px" }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                    onClick={() => openGuideModal(activeEx)}
                  >
                    <BookOpen size={12} /> Guia
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                    onClick={() => openHistoryModal(activeEx)}
                  >
                    <History size={12} /> Histórico
                  </button>
                </div>
              </div>

              {/* Prev performance hint */}
              {getPrevPerfHint(activeEx)}

              {/* Set types — grid 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                {SET_TYPES.map((t) => {
                  const isActive = serieType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSerieType(t.id)}
                      style={{
                        padding: "9px 0",
                        borderRadius: "10px",
                        border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "700",
                        fontFamily: "'DM Sans',sans-serif",
                        background: isActive ? t.color : "rgba(255,255,255,0.04)",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        transition: "all 0.18s",
                      }}
                    >
                      {setTypeIcon(t.id)} {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Weight and Reps inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <div className="label">Peso (kg)</div>
                  <input
                    type="number"
                    placeholder="80"
                    value={serieWeight}
                    onChange={(e) => setSerieWeight(e.target.value)}
                  />
                </div>
                <div>
                  <div className="label">Repetições</div>
                  <input
                    type="number"
                    placeholder="10"
                    value={serieReps}
                    onChange={(e) => setSerieReps(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-ghost" style={{ width: "100%", marginBottom: "14px" }} onClick={handleAddSet}>
                + Adicionar Série
              </button>

              {/* Added sets list */}
              {currentSets.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div className="small" style={{ marginBottom: "8px" }}>
                    {currentSets.length} séries · Vol válido:{" "}
                    {currentSets.filter((x) => x.type === "valida").reduce((a, x) => a + x.weight * x.reps, 0)}
                    kg
                  </div>
                  {currentSets.map((set, index) => {
                    const typeSpec = SET_TYPES.find((x) => x.id === set.type);
                    return (
                      <div className="set-item" key={index}>
                        <div className="row" style={{ gap: "10px" }}>
                          <span className="tag" style={{ background: typeSpec.color, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                            {setTypeIcon(typeSpec.id, 11)} {typeSpec.label}
                          </span>
                          <span style={{ fontSize: "14px", color: typeSpec.color, fontWeight: "700" }}>
                            {set.weight}kg × {set.reps}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSet(index)}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center" }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="row" style={{ gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={handleFinishEx}
                >
                  <CheckCircle2 size={16} /> Concluir Exercício
                </button>
                <button
                  className="btn"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={handleCancelEx}
                >
                  <X size={16} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Seletor de grupo muscular */}
              <div style={{ marginBottom: "12px" }}>
                <div className="label" style={{ marginBottom: "6px" }}>Grupo muscular</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ALL_GROUPS.map((g) => (
                    <button key={g} onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
                      style={{ padding: "7px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s",
                        background: activeGroup === g ? s.color : "rgba(255,255,255,0.07)",
                        color: activeGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "16px", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={() => setShowExPicker(true)}
              >
                <Plus size={16} /> Adicionar Exercício
              </button>
            </div>
          )}

          {/* Exercise Picker Section */}
          {showExPicker && (
            <div className="card">
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                Selecionar Exercício
              </div>
              <div
                style={{
                  maxHeight: "240px",
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  marginBottom: "12px",
                }}
              >
                {exs.map((ex) => (
                  <div
                    key={ex}
                    className="ex-item"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onClick={() => handleSelectEx(ex)}
                  >
                    <div className="row" style={{ gap: "6px" }}>
                      <span>{ex}</span>
                      {getPrevPerf(ex).length > 0 && (
                        <span style={{ fontSize: "10px", color: "#10b981" }}>✓</span>
                      )}
                    </div>
                    <button
                      className="btn"
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px 8px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openGuideModal(ex);
                      }}
                    >
                      <BookOpen size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: "10px" }}>
                <input
                  placeholder="Outro exercício..."
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleAddCustomEx}>
                  Add
                </button>
              </div>
              <button
                onClick={() => setShowExPicker(false)}
                style={{
                  marginTop: "10px",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontSize: "13px",
                  width: "100%",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Session completed exercises list */}
          {sessionExs.length > 0 && (
            <div className="card">
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
                Sessão atual — {sessionExs.length} exercício(s)
              </div>
              {sessionExs.map((ex, index) => (
                <div className="workout-item" key={index}>
                  <div className="row-sb" style={{ marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{ex.name}</span>
                    <div className="row" style={{ gap: "8px" }}>
                      <button
                        onClick={() => setSwapForIndex(swapForIndex === index ? null : index)}
                        className="btn btn-ghost"
                        style={{ padding: "4px 10px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ArrowLeftRight size={12} />
                      </button>
                      <button className="btn-danger" onClick={() => handleRemoveSessionEx(index)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  {ex.sets.map((set, sIdx) => {
                    const typeSpec = SET_TYPES.find((x) => x.id === set.type);
                    return (
                      <div key={sIdx} style={{ fontSize: "12px", display: "flex", gap: "8px", padding: "3px 0", alignItems: "center" }}>
                        <span style={{ color: typeSpec.color, fontWeight: "600", width: "95px", display: "flex", alignItems: "center", gap: "4px" }}>
                          {setTypeIcon(typeSpec.id, 12)} {typeSpec.label}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>
                          {set.weight}kg × {set.reps}
                        </span>
                      </div>
                    );
                  })}
                  {/* Swap picker options */}
                  {swapForIndex === index && (
                    <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", maxHeight: "160px", overflowY: "auto" }}>
                      <div className="small" style={{ padding: "8px 12px" }}>Trocar por:</div>
                      {exs
                        .filter((e) => e !== ex.name)
                        .map((e) => (
                          <div key={e} className="ex-item" onClick={() => handleSwapEx(index, e)}>
                            <span>{e}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes and save workout */}
          {(sessionExs.length > 0 || (activeEx && currentSets.length > 0)) && (
            <div className="card">
              <textarea
                placeholder="Observações do treino..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                style={{ height: "60px", marginBottom: "12px" }}
              />
              <button
                className="btn btn-primary"
                style={{ width: "100%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={handleSaveWorkout}
              >
                <Save size={16} /> Salvar Treino Completo
              </button>
            </div>
          )}

          {/* Saved workouts for the selected session date */}
          {(() => {
            const todayWorkouts = state.workoutLogs.filter((w) => w.date === sessionDate);
            if (!todayWorkouts.length) return null;
            return (
              <div className="card">
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "#10b981" }} />
                  {sessionDate === today() ? "Treinos salvos hoje" : `Treinos salvos em ${fmtDate(sessionDate)}`}
                </div>
                {todayWorkouts.map((w) => (
                  <div className="workout-item" key={w.id}>
                    <div className="row-sb" style={{ marginBottom: "8px" }}>
                      <span style={{ fontWeight: "600" }}>{w.type}</span>
                      <div className="row" style={{ gap: "8px" }}>
                        <span className="small">Vol: {w.volume}kg</span>
                        <button className="btn-danger" onClick={() => removeWorkoutLog(w.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    {(w.exercises || []).map((ex, exIdx) => (
                      <div key={exIdx} style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "3px" }}>
                        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>{ex.name}</span> —{" "}
                        {ex.sets.filter((x) => x.type === "valida").length}s válidas ·{" "}
                        {ex.sets.filter((x) => x.type === "aquecimento").length}s aq.
                      </div>
                    ))}
                    {w.notes && (
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "8px", fontStyle: "italic" }}>
                        {w.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* HISTÓRICO SUB-TAB */}
      {activeSubTab === "history" && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>
              Selecionar data
            </div>
            <select value={histWrkDate} onChange={(e) => setHistWrkDate(e.target.value)}>
              <option value="">— Escolha uma data —</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {fmtDate(d)}
                </option>
              ))}
            </select>
          </div>

          {histWrkDate && (
            <div>
              {state.workoutLogs
                .filter((w) => w.date === histWrkDate)
                .map((w) => (
                  <div className="card" key={w.id}>
                    <div className="row-sb" style={{ marginBottom: "10px" }}>
                      <span className="syne" style={{ fontWeight: "700", fontSize: "16px" }}>
                        {w.type}
                      </span>
                      <span className="small">Vol total: {w.volume}kg</span>
                    </div>
                    {w.exercises.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          padding: "10px",
                          borderRadius: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>{ex.name}</div>
                        {ex.sets.map((set, sIdx) => {
                          const typeSpec = SET_TYPES.find((x) => x.id === set.type);
                          return (
                            <div key={sIdx} style={{ fontSize: "11px", display: "flex", gap: "8px", color: "rgba(255,255,255,0.5)", alignItems: "center" }}>
                              <span style={{ color: typeSpec.color, fontWeight: "600", width: "95px", display: "flex", alignItems: "center", gap: "4px" }}>
                                {setTypeIcon(typeSpec.id, 11)} {typeSpec.label}
                              </span>
                              <span>
                                {set.weight}kg × {set.reps}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {w.notes && (
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", marginTop: "8px", fontStyle: "italic" }}>
                        Obs: {w.notes}
                      </div>
                    )}
                  </div>
                ))}
              {!state.workoutLogs.filter((w) => w.date === histWrkDate).length && (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>
                  Sem treinos gravados nesta data.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
