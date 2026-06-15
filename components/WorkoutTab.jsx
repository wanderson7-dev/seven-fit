"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle2, BookOpen, History, X, Plus, Save, Zap, Droplets, Search, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

// Sub-grupamentos musculares por tipo de treino
const MUSCLE_SUBGROUPS = {
  Push: {
    "Peito":   ["Supino Reto","Supino Inclinado","Supino Declinado","Crucifixo","Crucifixo Inclinado","Pec Deck","Crossover"],
    "Ombro":   ["Desenvolvimento com Barra","Desenvolvimento com Halteres","Elevação Lateral","Elevação Frontal","Encolhimento","Face Pull"],
    "Tríceps": ["Tríceps Corda","Tríceps Testa","Tríceps Francês","Tríceps Banco","Mergulho","Extensão Tríceps"],
  },
  Pull: {
    "Costas":  ["Puxada Frente","Puxada Neutra","Puxada Fechada","Barra Fixa","Pullover","Remada Curvada","Remada Unilateral","Remada Cavalinho","Remada Sentado","Serrote"],
    "Bíceps":  ["Rosca Direta","Rosca Martelo","Rosca Concentrada","Rosca 21","Rosca Inversa","Rosca Scott"],
  },
  Legs: {
    "Quadríceps": ["Agachamento Livre","Agachamento Smith","Agachamento Sumô","Leg Press","Hack Squat","Cadeira Extensora","Avanço","Avanço com Barra","Agachamento Búlgaro"],
    "Posterior":  ["Stiff","Mesa Flexora"],
    "Adutores":   ["Cadeira Adutora","Cadeira Abdutora"],
    "Panturrilha":["Panturrilha em Pé","Panturrilha Sentado","Panturrilha no Leg Press"],
  },
  Upper: {
    "Peito":   ["Supino Reto","Supino Inclinado","Crucifixo","Pec Deck"],
    "Ombro":   ["Desenvolvimento com Halteres","Elevação Lateral","Face Pull"],
    "Tríceps": ["Tríceps Corda","Tríceps Testa"],
    "Costas":  ["Puxada Frente","Remada Curvada","Remada Unilateral","Pullover"],
  },
  Lower: {
    "Pernas":  ["Agachamento Livre","Leg Press","Cadeira Extensora","Mesa Flexora","Stiff","Avanço","Panturrilha em Pé","Panturrilha Sentado"],
    "Bíceps":  ["Rosca Direta","Rosca Martelo","Rosca Concentrada"],
  },
};

// Retorna o sub-músculo de um exercício dentro de um grupo
// customMap é passado em runtime para exercícios criados pelo usuário
function getMuscle(group, name, customMap = {}) {
  if (customMap[name]) return customMap[name];
  const subs = MUSCLE_SUBGROUPS[group] || {};
  for (const [muscle, list] of Object.entries(subs)) {
    if (list.includes(name)) return muscle;
  }
  return "Outros";
}

export default function WorkoutTab({
  state,
  saveSessionWorkout,
  removeWorkoutLog,
  getExercises,
  saveCustomExercise,
  workoutPlans,
  saveWorkoutPlan,
  DEFAULT_EXERCISES,
  customMuscleMap = {},
  saveCustomMuscleMap,
  SET_TYPES,
  today,
  fmtDate,
  openHistoryModal,
  openGuideModal,
}) {
  const ALL_GROUPS = ["Push", "Pull", "Legs", "Upper", "Lower"];

  const [activeSubTab, setActiveSubTab] = useState("session");
  const [histWrkDate, setHistWrkDate] = useState("");
  const [sessionDate, setSessionDate] = useState(() => today());
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Sessão: lista de exercícios com sets
  const [sessionExs, setSessionExs] = useState([]); // [{name, sets:[{type,weight,reps}]}]
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);

  const [expandedEx, setExpandedEx] = useState(null); // índice do card aberto
  const [serieType, setSerieType] = useState("valida");
  const [serieWeight, setSerieWeight] = useState("");
  const [serieReps, setSerieReps] = useState("");

  // Busca para adicionar exercício extra
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState("");
  const [newExName, setNewExName] = useState("");
  const [newExGroup, setNewExGroup] = useState(null);
  const [newExMuscle, setNewExMuscle] = useState(null);

  // Plano sub-tab
  const [planGroup, setPlanGroup] = useState("Push");
  const [planSearch, setPlanSearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  // Cardio & Gasto Calórico states
  const [weightDuration, setWeightDuration] = useState("60");
  const [weightKcal, setWeightKcal] = useState("360");
  const [cardios, setCardios] = useState([]);
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [cardioType, setCardioType] = useState("Corrida");
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioKcalOverride, setCardioKcalOverride] = useState("");

  const estimateCardioKcal = (type, min) => {
    const minutes = parseFloat(min);
    if (isNaN(minutes) || minutes <= 0) return 0;
    const rates = {
      "Corrida": 12.5,
      "Caminhada": 5.0,
      "Bicicleta": 8.0,
      "Elíptico": 9.5,
      "Outro": 7.0
    };
    const rate = rates[type] || 7.0;
    return Math.round(minutes * rate);
  };

  const estimateWeightKcal = (min) => {
    const minutes = parseFloat(min);
    if (isNaN(minutes) || minutes <= 0) return 0;
    return Math.round(minutes * 6.0);
  };

  // ── helpers ─────────────────────────────────────────────────
  const setTypeIcon = (id, size = 13) => {
    if (id === "aquecimento") return <Flame size={size} />;
    if (id === "pap")         return <Zap size={size} />;
    if (id === "feeder")      return <Droplets size={size} />;
    return <CheckCircle2 size={size} />;
  };

  function schedForDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()];
    return state.schedule.find((x) => x.day === dow) || state.schedule[6];
  }

  const s = schedForDate(sessionDate);
  const activeGroup = selectedGroup || s.group;

  // Inicializa sessão com exercícios do plano quando grupo muda
  useEffect(() => {
    if (!sessionStarted && activeGroup) {
      const plan = (workoutPlans && workoutPlans[activeGroup]) || [];
      setSessionExs(plan.map((name) => ({ name, sets: [] })));
    }
  }, [activeGroup, sessionStarted]);

  // Performance anterior
  const getPrevPerf = (exName) => {
    const logs = state.workoutLogs || [];
    const all = [];
    logs.forEach((w) => w.exercises.forEach((ex) => {
      if (ex.name === exName) all.push({ date: w.date, sets: ex.sets });
    }));
    if (!all.length) return null;
    const last = all[all.length - 1];
    const vs = last.sets.filter((x) => x.type === "valida");
    if (!vs.length) return null;
    const mx = vs.reduce((a, x) => (x.weight > a.weight ? x : a), vs[0]);
    const vol = vs.reduce((a, x) => a + x.weight * x.reps, 0);
    return { lastWeight: mx.weight, lastReps: mx.reps, vol };
  };

  // ── handlers de séries ───────────────────────────────────────
  const handleAddSet = (exIdx) => {
    const w = parseFloat(serieWeight);
    const r = parseInt(serieReps);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    setSessionStarted(true);
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { type: serieType, weight: w, reps: r }] } : ex
      )
    );
    setSerieWeight("");
    setSerieReps("");
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
      )
    );
  };

  const handleRemoveEx = (exIdx) => {
    setSessionExs((prev) => prev.filter((_, i) => i !== exIdx));
    if (expandedEx === exIdx) setExpandedEx(null);
    else if (expandedEx > exIdx) setExpandedEx((p) => p - 1);
  };

  const handleAddExToSession = (name) => {
    if (sessionExs.some((e) => e.name === name)) return;
    setSessionExs((prev) => [...prev, { name, sets: [] }]);
    setShowAddEx(false);
    setExSearch("");
  };

  const handleSaveWorkout = () => {
    const finalExs = sessionExs.filter((ex) => ex.sets.length > 0);
    
    const wDur = parseInt(weightDuration);
    const wKcal = parseInt(weightKcal);
    if (finalExs.length > 0 && wDur > 0) {
      finalExs.push({
        name: "Treino de Força (Info)",
        isMetadata: true,
        duration: wDur,
        kcal: wKcal
      });
    }
    
    cardios.forEach(c => {
      finalExs.push({
        name: `Cardio (${c.type})`,
        isCardio: true,
        cardioType: c.type,
        duration: c.duration,
        distance: c.distance,
        kcal: c.kcal
      });
    });

    if (!finalExs.length) return;

    const volume = finalExs
      .filter(ex => !ex.isCardio && !ex.isMetadata)
      .reduce((tot, ex) =>
        tot + ex.sets.filter((x) => x.type === "valida").reduce((a, x) => a + x.weight * x.reps, 0), 0);

    saveSessionWorkout({ date: sessionDate, type: s.type, exercises: finalExs, notes: sessionNotes, volume });
    setSessionExs(activeGroup ? (workoutPlans[activeGroup] || []).map((n) => ({ name: n, sets: [] })) : []);
    setSessionNotes("");
    setSessionStarted(false);
    setExpandedEx(null);
    setWeightDuration("60");
    setWeightKcal("360");
    setCardios([]);
    setShowCardioForm(false);
  };

  const resetSession = () => {
    setSessionExs(activeGroup ? (workoutPlans[activeGroup] || []).map((n) => ({ name: n, sets: [] })) : []);
    setSessionNotes("");
    setSessionStarted(false);
    setExpandedEx(null);
    setWeightDuration("60");
    setWeightKcal("360");
    setCardios([]);
    setShowCardioForm(false);
  };

  // ── handlers de plano ────────────────────────────────────────
  const planExercises = (workoutPlans && workoutPlans[planGroup]) || [];
  const libraryExs = (DEFAULT_EXERCISES && DEFAULT_EXERCISES[planGroup]) || [];
  const allForGroup = getExercises ? getExercises(planGroup) : libraryExs;
  const filteredLib = exSearch
    ? allForGroup.filter((e) => e.toLowerCase().includes(exSearch.toLowerCase()))
    : allForGroup;

  const addToPlan = (name) => {
    if (planExercises.includes(name)) return;
    saveWorkoutPlan(planGroup, [...planExercises, name]);
  };

  const removeFromPlan = (name) => {
    saveWorkoutPlan(planGroup, planExercises.filter((e) => e !== name));
  };

  // Histórico
  const dates = [...new Set(state.workoutLogs.map((w) => w.date))].sort().reverse();
  useEffect(() => {
    if (dates.length && !histWrkDate) setHistWrkDate(dates[0]);
  }, [dates, histWrkDate]);

  const hasSets = sessionExs.some((e) => e.sets.length > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${s.color}18, rgba(255,255,255,0.02))`, border: `1px solid ${s.color}30`, borderRadius: "20px", padding: "18px 20px", marginBottom: "14px" }}>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "3px" }}>
          {sessionDate === today() ? "Treino de Hoje" : `Treino de ${fmtDate(sessionDate)}`}
        </div>
        <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.type}</div>
        <div className="small" style={{ marginTop: "3px" }}>
          {activeGroup ? `${ALL_GROUPS.includes(activeGroup) ? activeGroup : activeGroup} · ${sessionExs.length} exercícios` : "Selecione um grupo abaixo"}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs" style={{ marginBottom: "14px" }}>
        {[{ id: "session", label: "Sessão" }, { id: "plan", label: "Plano" }, { id: "history", label: "Histórico" }].map((t) => (
          <button key={t.id} className={`sub-tab ${activeSubTab === t.id ? "active" : ""}`} onClick={() => setActiveSubTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ─────────── SESSÃO ─────────── */}
      {activeSubTab === "session" && (
        <div>
          {/* Date + group */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", minWidth: 0 }}>
            <input type="date" value={sessionDate} max={today()} onChange={(e) => { setSessionDate(e.target.value || today()); setSessionStarted(false); }}
              style={{ fontWeight: "600", fontSize: "13px", minWidth: 0, flex: 1, width: "100%" }} />
            {sessionDate !== today() && (
              <button className="btn btn-ghost" style={{ padding: "10px 12px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }} onClick={() => { setSessionDate(today()); setSessionStarted(false); }}>Hoje</button>
            )}
          </div>

          {/* Group selector */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {ALL_GROUPS.map((g) => (
              <button key={g} onClick={() => { if (!sessionStarted) { setSelectedGroup(selectedGroup === g ? null : g); } else { setSelectedGroup(g); } }}
                style={{ padding: "7px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s",
                  background: activeGroup === g ? "#f97316" : "rgba(255,255,255,0.07)", color: activeGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                {g}
              </button>
            ))}
          </div>

          {/* Exercise cards — agrupados por músculo */}
          {(() => {
            // Card compacto por padrão — toca para expandir e adicionar série
            const renderExCard = (ex, exIdx) => {
              const isOpen = expandedEx === exIdx;
              const prev = getPrevPerf(ex.name);
              // Resumo por tipo de série
              const setsByType = SET_TYPES.map((t) => {
                const ofType = ex.sets.filter((x) => x.type === t.id);
                const vol = ofType.reduce((a, x) => a + x.weight * x.reps, 0);
                return { ...t, count: ofType.length, vol };
              }).filter((t) => t.count > 0);

              return (
                <div key={exIdx} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? "#f97316" + "50" : "rgba(255,255,255,0.07)"}`, borderRadius: "16px", overflow: "hidden", marginBottom: "8px", transition: "border-color 0.2s" }}>

                  {/* Cabeçalho — toca para abrir/fechar */}
                  <div onClick={() => setExpandedEx(isOpen ? null : exIdx)}
                    style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "700", fontSize: "13px" }}>{ex.name}</div>
                      {ex.sets.length > 0 ? (
                        /* Resumo por tipo: "2 Válidas 1600kg · 1 Aq. 480kg" */
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                          {setsByType.map((t) => (
                            <span key={t.id} style={{ fontSize: "10px", fontWeight: "700", color: t.color, display: "flex", alignItems: "center", gap: "3px" }}>
                              {setTypeIcon(t.id, 10)}
                              {t.count}× {t.label}{t.vol > 0 ? ` · ${t.vol}kg` : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: "10px", marginTop: "2px", color: "rgba(255,255,255,0.3)" }}>
                          {prev ? `Última: ${prev.lastWeight}kg×${prev.lastReps}` : "Sem registro anterior"}
                        </div>
                      )}
                    </div>
                    <div className="row" style={{ gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost" style={{ padding: "4px 7px" }} onClick={() => openHistoryModal && openHistoryModal(ex.name)}><History size={12} /></button>
                      <button className="btn-danger" style={{ padding: "4px 7px", display: "flex", alignItems: "center" }} onClick={() => handleRemoveEx(exIdx)}><X size={11} /></button>
                    </div>
                  </div>

                  {/* Séries já registradas — com volume individual */}
                  {ex.sets.length > 0 && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {ex.sets.map((set, sIdx) => {
                        const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                        return (
                          <div key={sIdx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="row" style={{ gap: "7px" }}>
                              <span className="tag" style={{ background: ts.color + "22", color: ts.color, display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>{setTypeIcon(ts.id, 10)} {ts.label}</span>
                              <span style={{ fontWeight: "700", fontSize: "13px" }}>
                                {set.weight}kg <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "400" }}>×</span> {set.reps}
                              </span>
                            </div>
                            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: "2px" }} onClick={() => handleRemoveSet(exIdx, sIdx)}><X size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Formulário expansível — aparece ao tocar no card */}
                  {isOpen && (
                    <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                      {/* Tipo de série */}
                      <div style={{ display: "flex", gap: "5px", marginBottom: "9px" }}>
                        {SET_TYPES.map((t) => (
                          <button key={t.id} onClick={() => setSerieType(t.id)}
                            style={{ flex: 1, padding: "6px 2px", borderRadius: "8px", border: serieType === t.id ? "none" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontSize: "10px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                              background: serieType === t.id ? t.color : "rgba(255,255,255,0.04)", color: serieType === t.id ? "#fff" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                            {setTypeIcon(t.id, 11)} {t.label}
                          </button>
                        ))}
                      </div>
                      {/* Peso × Reps + botão confirmar */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input type="number" placeholder="Peso kg" value={serieWeight} onChange={(e) => setSerieWeight(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && document.getElementById(`reps-${exIdx}`)?.focus()}
                          style={{ flex: 1, textAlign: "center" }} />
                        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "700", flexShrink: 0 }}>×</span>
                        <input id={`reps-${exIdx}`} type="number" placeholder="Reps" value={serieReps} onChange={(e) => setSerieReps(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddSet(exIdx)}
                          style={{ flex: 1, textAlign: "center" }} />
                        <button onClick={() => handleAddSet(exIdx)}
                          style={{ flexShrink: 0, width: "42px", height: "42px", borderRadius: "12px", border: "none", cursor: "pointer", background: "#f97316", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            if (sessionExs.length === 0) return null;

            // Monta grupos musculares na ordem
            const muscleOrder = Object.keys(MUSCLE_SUBGROUPS[activeGroup] || {});
            // Exercícios que não pertencem a nenhum músculo → "Outros"
            const allRendered = new Set();

            return (
              <>
                {muscleOrder.map((muscle) => {
                  const inGroup = sessionExs.filter((ex) => getMuscle(activeGroup, ex.name, customMuscleMap) === muscle);
                  if (!inGroup.length) return null;
                  return (
                    <div key={muscle} style={{ marginBottom: "14px" }}>
                      {/* Header do músculo */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ height: "1px", flex: 1, background: "rgba(249,115,22,0.35)" }} />
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.8px", whiteSpace: "nowrap" }}>{muscle}</span>
                        <div style={{ height: "1px", flex: 1, background: "rgba(249,115,22,0.35)" }} />
                      </div>
                      {inGroup.map((ex) => {
                        const exIdx = sessionExs.indexOf(ex);
                        allRendered.add(exIdx);
                        return renderExCard(ex, exIdx);
                      })}
                    </div>
                  );
                })}
                {/* Outros (exercícios customizados não mapeados) */}
                {sessionExs.some((ex, i) => !allRendered.has(i)) && (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Outros</span>
                      <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
                    </div>
                    {sessionExs.map((ex, exIdx) => !allRendered.has(exIdx) ? renderExCard(ex, exIdx) : null)}
                  </div>
                )}
              </>
            );
          })()}

          {/* Cardio & Gasto Calórico */}
          {(hasSets || cardios.length > 0) && (
            <div className="card" style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#f97316" }}>
                <Flame size={16} /> Cardio & Gasto Calórico
              </div>

              {/* Musculação Info */}
              {hasSets && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ flex: 1 }}>
                    <div className="label" style={{ marginBottom: "4px" }}>Duração Musculação (min)</div>
                    <input
                      type="number"
                      value={weightDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightDuration(val);
                        setWeightKcal(estimateWeightKcal(val).toString());
                      }}
                      placeholder="60"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="label" style={{ marginBottom: "4px" }}>Est. Calorias Gastas (kcal)</div>
                    <input
                      type="number"
                      value={weightKcal}
                      onChange={(e) => setWeightKcal(e.target.value)}
                      placeholder="360"
                    />
                  </div>
                </div>
              )}

              {/* Cardios logged list */}
              {cardios.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div className="label" style={{ marginBottom: "6px" }}>Cardios Adicionados:</div>
                  {cardios.map((c, idx) => (
                    <div key={idx} className="row-sb" style={{ background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px", marginBottom: "6px", fontSize: "12px" }}>
                      <span>
                        🏃 **{c.type}** · {c.duration} min {c.distance ? `· ${c.distance} km` : ""} · ~{c.kcal} kcal
                      </span>
                      <button
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                        onClick={() => setCardios(prev => prev.filter((_, ci) => ci !== idx))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Cardio Form */}
              {showCardioForm ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "10px", color: "#10b981" }}>Adicionar Cardio</div>
                  
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Tipo</div>
                      <select
                        value={cardioType}
                        onChange={(e) => {
                          setCardioType(e.target.value);
                          const est = estimateCardioKcal(e.target.value, cardioDuration);
                          setCardioKcalOverride(est ? est.toString() : "");
                        }}
                        style={{ padding: "8px", fontSize: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", width: "100%" }}
                      >
                        {["Corrida", "Caminhada", "Bicicleta", "Elíptico", "Outro"].map(t => (
                          <option key={t} value={t} style={{ background: "#0a0a0f" }}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Duração (min)</div>
                      <input
                        type="number"
                        placeholder="min"
                        value={cardioDuration}
                        onChange={(e) => {
                          setCardioDuration(e.target.value);
                          const est = estimateCardioKcal(cardioType, e.target.value);
                          setCardioKcalOverride(est ? est.toString() : "");
                        }}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Distância (km - opcional)</div>
                      <input
                        type="number"
                        placeholder="km"
                        value={cardioDistance}
                        onChange={(e) => setCardioDistance(e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Calorias (kcal)</div>
                      <input
                        type="number"
                        placeholder="kcal"
                        value={cardioKcalOverride}
                        onChange={(e) => setCardioKcalOverride(e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ flex: 1, padding: "8px" }}
                      onClick={() => {
                        setShowCardioForm(false);
                        setCardioDuration("");
                        setCardioDistance("");
                        setCardioKcalOverride("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: "8px", background: "#10b981" }}
                      onClick={() => {
                        const dur = parseInt(cardioDuration);
                        if (isNaN(dur) || dur <= 0) return;
                        
                        const defaultEst = estimateCardioKcal(cardioType, cardioDuration);
                        const kcalVal = parseInt(cardioKcalOverride) || defaultEst;
                        
                        setCardios(prev => [...prev, {
                          type: cardioType,
                          duration: dur,
                          distance: parseFloat(cardioDistance) || 0,
                          kcal: kcalVal
                        }]);

                        setShowCardioForm(false);
                        setCardioDuration("");
                        setCardioDistance("");
                        setCardioKcalOverride("");
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", padding: "10px", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.1)", color: "#10b981", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  onClick={() => setShowCardioForm(true)}
                >
                  <Plus size={14} /> Adicionar Cardio
                </button>
              )}

              {/* Resumo Gasto Calórico Total */}
              {(() => {
                const totalBurn = (hasSets ? parseInt(weightKcal) || 0 : 0) + cardios.reduce((acc, c) => acc + c.kcal, 0);
                if (totalBurn > 0) {
                  return (
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                      <span>Gasto calórico total estimado:</span>
                      <span style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalBurn} kcal</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Salvar treino */}
          {(hasSets || cardios.length > 0) && (
            <div className="card">
              <textarea placeholder="Observações do treino..." value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} style={{ height: "56px", marginBottom: "10px" }} />
              <button className="btn btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={handleSaveWorkout}>
                <Save size={15} /> Salvar Treino
              </button>
            </div>
          )}

          {/* Saved workouts for selected date */}
          {(() => {
            const saved = state.workoutLogs.filter((w) => w.date === sessionDate);
            if (!saved.length) return null;
            return (
              <div className="card" style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                  {sessionDate === today() ? "Treinos salvos hoje" : `Treinos em ${fmtDate(sessionDate)}`}
                </div>
                {saved.map((w) => (
                  <div className="workout-item" key={w.id}>
                    <div className="row-sb" style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "700" }}>{w.type}</span>
                      <div className="row" style={{ gap: "8px" }}>
                        <span className="small">Vol total: {w.volume}kg</span>
                        {(() => {
                          const totalKcal = (w.exercises || []).reduce((acc, ex) => {
                            if (ex.isCardio || ex.isMetadata) {
                              return acc + (ex.kcal || 0);
                            }
                            return acc;
                          }, 0);
                          if (totalKcal > 0) {
                            return <span className="small" style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalKcal} kcal</span>;
                          }
                          return null;
                        })()}
                        <button className="btn-danger" onClick={() => removeWorkoutLog(w.id)} style={{ padding: "3px 7px", display: "flex", alignItems: "center" }}><X size={11} /></button>
                      </div>
                    </div>
                    {(w.exercises || []).map((ex, ei) => {
                      if (ex.isMetadata) {
                        return (
                          <div key={ei} style={{ marginBottom: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px" }}>
                            <div style={{ fontWeight: "700", color: "#f97316" }}>Musculação</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                              Duração: {ex.duration} min · Gasto: ~{ex.kcal} kcal
                            </div>
                          </div>
                        );
                      }
                      if (ex.isCardio) {
                        return (
                          <div key={ei} style={{ marginBottom: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px" }}>
                            <div style={{ fontWeight: "700", color: "#10b981" }}>Cardio ({ex.cardioType})</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                              Duração: {ex.duration} min {ex.distance ? `· Distância: ${ex.distance} km` : ""} · Gasto: ~{ex.kcal} kcal
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={ei} style={{ marginBottom: "10px" }}>
                          <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "5px" }}>{ex.name}</div>
                          {ex.sets.map((set, si) => {
                            const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                            return (
                              <div key={si} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ color: ts.color, display: "flex", alignItems: "center", gap: "3px", minWidth: "80px" }}>
                                  {setTypeIcon(ts.id, 11)} {ts.label}
                                </span>
                                <span style={{ fontWeight: "600" }}>{set.weight}kg × {set.reps}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─────────── PLANO ─────────── */}
      {activeSubTab === "plan" && (
        <div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {ALL_GROUPS.map((g) => (
              <button key={g} onClick={() => { setPlanGroup(g); setPlanSearch(""); setShowLibrary(false); }}
                style={{ padding: "7px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                  background: planGroup === g ? "#f97316" : "rgba(255,255,255,0.07)", color: planGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                {g}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "12px", lineHeight: 1.5 }}>
            {{
              Push: "Peito · Ombro · Tríceps",
              Pull: "Costas · Bíceps",
              Legs: "Pernas",
              Upper: "Peito · Ombro · Tríceps · Costas",
              Lower: "Pernas · Bíceps",
            }[planGroup]}
          </div>

          {/* Exercícios do plano */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
              Exercícios do treino {planGroup} ({planExercises.length})
            </div>
            {planExercises.length === 0 && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "16px 0" }}>Nenhum exercício no plano. Adicione da biblioteca abaixo.</div>
            )}
            {planExercises.map((name) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>{name}</span>
                <button className="btn-danger" style={{ padding: "4px 8px", display: "flex", alignItems: "center" }} onClick={() => removeFromPlan(name)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>

          {/* Biblioteca para adicionar */}
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <button onClick={() => setShowLibrary((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Plus size={15} /> Adicionar da biblioteca</span>
              {showLibrary ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showLibrary && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                  <input type="text" placeholder="Filtrar exercícios..." value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} style={{ paddingLeft: "32px" }} />
                </div>

                {/* Biblioteca agrupada por músculo */}
                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  {planSearch ? (
                    // Busca flat quando há filtro
                    filteredLib.map((name) => {
                      const inPlan = planExercises.includes(name);
                      return (
                        <div key={name} onClick={() => !inPlan && addToPlan(name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: inPlan ? "default" : "pointer", marginBottom: "2px", background: inPlan ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", opacity: inPlan ? 0.6 : 1 }}>
                          <span style={{ fontSize: "13px" }}>{name}</span>
                          {inPlan ? <CheckCircle2 size={13} style={{ color: "#10b981" }} /> : <Plus size={13} style={{ color: "#f97316" }} />}
                        </div>
                      );
                    })
                  ) : (
                    // Agrupado por músculo quando sem filtro
                    Object.entries(MUSCLE_SUBGROUPS[planGroup] || {}).map(([muscle, musclExs]) => {
                      const available = allForGroup.filter((e) => musclExs.includes(e));
                      if (!available.length) return null;
                      return (
                        <div key={muscle} style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "10px", fontWeight: "800", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", paddingLeft: "2px" }}>{muscle}</div>
                          {available.map((name) => {
                            const inPlan = planExercises.includes(name);
                            return (
                              <div key={name} onClick={() => !inPlan && addToPlan(name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: inPlan ? "default" : "pointer", marginBottom: "2px", background: inPlan ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", opacity: inPlan ? 0.6 : 1 }}>
                                <span style={{ fontSize: "13px" }}>{name}</span>
                                {inPlan ? <CheckCircle2 size={13} style={{ color: "#10b981" }} /> : <Plus size={13} style={{ color: "#f97316" }} />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Criar exercício novo */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "12px", paddingTop: "12px" }}>
                  <div className="label" style={{ marginBottom: "8px" }}>Criar exercício novo</div>
                  <input
                    type="text"
                    placeholder="Nome do exercício..."
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    style={{ marginBottom: "10px" }}
                  />

                  <div className="label" style={{ marginBottom: "6px" }}>Grupamento</div>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {ALL_GROUPS.map((g) => (
                      <button key={g} onClick={() => { setNewExGroup(g); setNewExMuscle(null); }}
                        style={{ padding: "6px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                          background: newExGroup === g ? "#f97316" : "rgba(255,255,255,0.07)", color: newExGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                        {g}
                      </button>
                    ))}
                  </div>

                  {/* Sub-músculo — aparece quando grupo é selecionado */}
                  {newExGroup && (
                    <>
                      <div className="label" style={{ marginBottom: "6px" }}>Músculo</div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {Object.keys(MUSCLE_SUBGROUPS[newExGroup] || {}).map((m) => (
                          <button key={m} onClick={() => setNewExMuscle(m)}
                            style={{ padding: "6px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                              background: newExMuscle === m ? "#3b82f6" : "rgba(255,255,255,0.07)", color: newExMuscle === m ? "#fff" : "rgba(255,255,255,0.5)" }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", opacity: (!newExName.trim() || !newExGroup || !newExMuscle) ? 0.5 : 1 }}
                    onClick={() => {
                      const name = newExName.trim();
                      if (!name || !newExGroup || !newExMuscle) return;
                      if (saveCustomExercise) saveCustomExercise(newExGroup, name, newExMuscle);
                      setNewExName("");
                      setNewExGroup(null);
                      setNewExMuscle(null);
                    }}
                  >
                    + Criar exercício
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────── HISTÓRICO ─────────── */}
      {activeSubTab === "history" && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>Selecionar data</div>
            <select value={histWrkDate} onChange={(e) => setHistWrkDate(e.target.value)}>
              <option value="">— Escolha uma data —</option>
              {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          </div>
          {histWrkDate && (
            <div>
              {state.workoutLogs.filter((w) => w.date === histWrkDate).map((w) => (
                <div className="card" key={w.id}>
                  <div className="row-sb" style={{ marginBottom: "10px" }}>
                    <span className="syne" style={{ fontWeight: "700", fontSize: "16px" }}>{w.type}</span>
                    <div className="row" style={{ gap: "10px" }}>
                      <span className="small">Vol: {w.volume}kg</span>
                      {(() => {
                        const totalKcal = (w.exercises || []).reduce((acc, ex) => {
                          if (ex.isCardio || ex.isMetadata) {
                            return acc + (ex.kcal || 0);
                          }
                          return acc;
                        }, 0);
                        if (totalKcal > 0) {
                          return <span className="small" style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalKcal} kcal</span>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  {(w.exercises || []).map((ex, eIdx) => {
                    if (ex.isMetadata) {
                      return (
                        <div key={eIdx} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px", fontSize: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#f97316" }}>Musculação</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                            Duração: {ex.duration} min · Gasto: ~{ex.kcal} kcal
                          </div>
                        </div>
                      );
                    }
                    if (ex.isCardio) {
                      return (
                        <div key={eIdx} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px", fontSize: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#10b981" }}>Cardio ({ex.cardioType})</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                            Duração: {ex.duration} min {ex.distance ? `· Distância: ${ex.distance} km` : ""} · Gasto: ~{ex.kcal} kcal
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={eIdx} style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>{ex.name}</div>
                        {ex.sets.map((set, sIdx) => {
                          const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                          return (
                            <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ color: ts.color, fontWeight: "600", minWidth: "80px", display: "flex", alignItems: "center", gap: "3px" }}>
                                {setTypeIcon(ts.id, 10)} {ts.label}
                              </span>
                              <span style={{ fontWeight: "600" }}>{set.weight}kg × {set.reps}</span>
                              <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>= {set.weight * set.reps}kg</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {w.notes && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", marginTop: "6px", fontStyle: "italic" }}>Obs: {w.notes}</div>}
                </div>
              ))}
              {!state.workoutLogs.filter((w) => w.date === histWrkDate).length && (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>Sem treinos gravados nesta data.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
