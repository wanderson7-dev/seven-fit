"use client";

import React, { useState, useEffect } from "react";
import { TrendingDown, Flame, Timer, Dumbbell, Camera, Calendar, Scale, Target, TrendingUp } from "lucide-react";

// Reusable StatCard Component
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div style={{ color: color || "rgba(255,255,255,0.5)", marginBottom: "8px", display: "flex", alignItems: "center" }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>{label}</div>
      <div className="syne" style={{ fontSize: "18px", fontWeight: "700", color }}>
        {value}
      </div>
      <div className="small" style={{ marginTop: "2px" }}>
        {sub}
      </div>
    </div>
  );
}

export default function ProgressTab({
  state,
  saveProgressPhotos,
  PROFILE,
  fmtDate,
  today,
  isSyncing,
}) {
  const [activeSubTab, setActiveSubTab] = useState("weight");
  const [photoWeekName, setPhotoWeekName] = useState("");
  const [photoDate, setPhotoDate] = useState(today());
  
  // Pending images state
  const [pendingImages, setPendingImages] = useState({ Frente: null, Lado: null, Costas: null });
  const [viewPhotoId, setViewPhotoId] = useState(null);

  const wl = state.weightLogs || [];
  const lastW = wl.length ? wl[wl.length - 1].value : PROFILE.weight;
  const firstW = wl.length ? wl[0].value : PROFILE.weight;
  const lost = Math.max(0, firstW - lastW).toFixed(1);
  const weeks = Math.max(1, Math.ceil(wl.length / 7));
  const bfNow = Math.max(10, PROFILE.current_bf - lost * 0.15).toFixed(1);
  const kgToGoal = Math.max(
    0,
    parseFloat(lastW) * (parseFloat(bfNow) / 100) - parseFloat(lastW) * (PROFILE.goal_bf / 100)
  ).toFixed(1);
  
  const weeklyLossRate = parseFloat(lost) / weeks;
  const weeksLeft = weeklyLossRate > 0.05 ? Math.ceil(parseFloat(kgToGoal) / weeklyLossRate) : "∞";

  const handlePhotoUpload = (angle, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPendingImages((prev) => ({
        ...prev,
        [angle]: uploadEvent.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotos = () => {
    const week = photoWeekName.trim() || `Semana ${(state.progressPhotos || []).length + 1}`;
    const date = photoDate || today();

    saveProgressPhotos({
      date,
      week,
      images: { ...pendingImages },
    });

    // Reset pending states
    setPendingImages({ Frente: null, Lado: null, Costas: null });
    setPhotoWeekName("");
    setPhotoDate(today());
  };

  const isSaveDisabled = isSyncing || (!pendingImages.Frente && !pendingImages.Lado && !pendingImages.Costas);

  // Chart data
  const last14 = wl.slice(-14);
  const minW = last14.length > 0 ? Math.min(...last14.map((x) => x.value)) : 0;
  const maxW = last14.length > 0 ? Math.max(...last14.map((x) => x.value)) : 0;
  const range = maxW - minW || 1;

  // Lifetime Stats
  const dietDaysCount = [...new Set(state.foodLogs.map((l) => l.date))].length;
  const totalCaloriesIntake = state.foodLogs.reduce((a, l) => a + l.kcal, 0);
  const totalWorkoutVolume = state.workoutLogs.reduce((a, w) => a + (w.volume || 0), 0);

  // --- Weekly Performance Stats (Last 7 Days) ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });

  // 1. Calorie Deficit
  const loggedDays = last7Days.filter(dateStr => 
    state.foodLogs.some(l => l.date === dateStr)
  );

  let avgDeficitStr = "Sem registros";
  let avgConsumed = 0;
  if (loggedDays.length > 0) {
    const totalLoggedKcal = loggedDays.reduce((acc, dateStr) => {
      const daySum = state.foodLogs
        .filter(l => l.date === dateStr)
        .reduce((sum, l) => sum + l.kcal, 0);
      return acc + daySum;
    }, 0);
    avgConsumed = Math.round(totalLoggedKcal / loggedDays.length);
    const realDeficit = PROFILE.tdee - avgConsumed;
    avgDeficitStr = realDeficit > 0 ? `${realDeficit} kcal/dia` : `${Math.abs(realDeficit)} kcal/dia (Superávit)`;
  }

  // 2. Sets per Muscle Group
  const weeklyWorkouts = state.workoutLogs.filter(w => last7Days.includes(w.date));
  
  const classifyMuscleGroup = (exName) => {
    const name = exName.toLowerCase();
    if (name.includes("rosca") || name.includes("bíceps") || name.includes("biceps") || name.includes("concentrada")) {
      return "Bíceps 🎯";
    }
    if (name.includes("tríceps") || name.includes("triceps") || name.includes("testa") || name.includes("corda") || name.includes("coice") || name.includes("supinado")) {
      return "Tríceps 💪";
    }
    if (name.includes("supino") || name.includes("crucifixo") || name.includes("crossover") || name.includes("peito") || name.includes("peitoral") || name.includes("flexão") || name.includes("fly")) {
      return "Peito 🦁";
    }
    if (name.includes("desenvolvimento") || name.includes("lateral") || name.includes("frontal") || name.includes("ombro") || name.includes("deltoide") || name.includes("trapezio") || name.includes("trapézio") || name.includes("manguito") || name.includes("face pull")) {
      return "Ombros 🛡️";
    }
    if (name.includes("puxada") || name.includes("remada") || name.includes("pulldown") || name.includes("costas") || name.includes("dorsal") || name.includes("barra fixa") || name.includes("pullover")) {
      return "Costas 🦅";
    }
    if (name.includes("agachamento") || name.includes("leg press") || name.includes("extensora") || name.includes("avanço") || name.includes("passada") || name.includes("afundo") || name.includes("quadriceps") || name.includes("quadríceps")) {
      return "Pernas (Quadríceps) 🦵";
    }
    if (name.includes("flexora") || name.includes("stiff") || name.includes("terra") || name.includes("gluteo") || name.includes("glúteo") || name.includes("pélvica") || name.includes("pelve") || name.includes("posterior")) {
      return "Pernas (Posterior/Glúteo) 🍑";
    }
    if (name.includes("panturrilha") || name.includes("gêmeos") || name.includes("gemeos")) {
      return "Panturrilhas 🦵";
    }
    return "Outros 🏋️";
  };

  const muscleGroupSets = {};
  weeklyWorkouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const group = classifyMuscleGroup(ex.name);
      const validSets = (ex.sets || []).filter(s => s.type === "valida").length;
      if (validSets > 0) {
        muscleGroupSets[group] = (muscleGroupSets[group] || 0) + validSets;
      }
    });
  });

  const sortedMuscleGroups = Object.entries(muscleGroupSets)
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      {/* SUB TABS */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[
          { id: "weight", label: "Peso" },
          { id: "photos", label: "Fotos" },
          { id: "stats", label: "Stats" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`sub-tab ${activeSubTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PESO SUB-TAB */}
      {activeSubTab === "weight" && (
        <div>
          <div className="grid2">
             <StatCard
               icon={TrendingDown}
               label="Perdido"
               value={`${lost} kg`}
               sub={`${weeklyLossRate.toFixed(2)}kg/sem`}
               color="#10b981"
             />
             <StatCard
               icon={Flame}
               label="BF Atual"
               value={`~${bfNow}%`}
               sub={`Meta: ${PROFILE.goal_bf}%`}
               color="#f97316"
             />
             <StatCard
               icon={Timer}
               label="Semanas Rest."
               value={weeksLeft === "∞" ? "Calculando" : `~${weeksLeft}w`}
               sub={`${kgToGoal}kg de gordura`}
               color="#3b82f6"
             />
             <StatCard
               icon={Dumbbell}
               label="Treinos"
               value={state.workoutLogs.length}
               sub={`${dietDaysCount} dias c/ dieta`}
               color="#8b5cf6"
             />
          </div>

          {/* Weight Log Bar Chart */}
          <div className="card">
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              Histórico de Peso (Últimos 14 registros)
            </div>
            {last14.length < 2 ? (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px" }}>
                Registre peso no Dashboard para ver o gráfico
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "90px" }}>
                {last14.map((w, i) => {
                  const h = 20 + ((w.value - minW) / range) * 60;
                  const isLast = i === last14.length - 1;
                  return (
                    <div
                      key={w.date + i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>{w.value}</div>
                      <div
                        style={{
                          width: "100%",
                          height: `${h}px`,
                          background: isLast ? "#10b981" : "rgba(16,185,129,0.3)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s ease",
                        }}
                      />
                      <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>
                        {fmtDate(w.date).slice(0, 5)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BF Progress Path */}
          <div className="card">
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
              Jornada BF
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              {[
                { label: "Início", value: `~${PROFILE.current_bf}%`, color: "#ef4444" },
                { label: "Atual", value: `~${bfNow}%`, color: "#f97316" },
                { label: "Meta", value: `${PROFILE.goal_bf}%`, color: "#10b981" },
              ].map((item, index) => (
                <div style={{ textAlign: "center" }} key={index}>
                  <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: item.color }}>
                    {item.value}
                  </div>
                  <div className="small">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(
                    ((PROFILE.current_bf - parseFloat(bfNow)) / (PROFILE.current_bf - PROFILE.goal_bf)) * 100,
                    100
                  ).toFixed(0)}%`,
                  background: "linear-gradient(90deg, #ef4444, #f97316, #10b981)",
                }}
              />
            </div>
          </div>

          {/* Weights table list */}
          <div className="card">
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
              Todos os Registros
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {!wl.length ? (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px" }}>
                  Nenhum registro
                </div>
              ) : (
                wl
                  .slice()
                  .reverse()
                  .map((w, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{fmtDate(w.date)}</span>
                      <span style={{ fontWeight: "700", color: "#10b981" }}>{w.value} kg</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOTOS SUB-TAB */}
      {activeSubTab === "photos" && (
        <div>
          {/* Picture register card */}
          <div className="card">
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Camera size={16} /> Registrar Fotos da Semana
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="label">Nome da semana</div>
              <input
                placeholder="Ex: Semana 1"
                value={photoWeekName}
                onChange={(e) => setPhotoWeekName(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div className="label" style={{ marginTop: "8px" }}>
                Data
              </div>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                style={{ minWidth: 0, width: "100%" }}
              />
            </div>

            {/* Three-angle photo selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {["Frente", "Lado", "Costas"].map((angle) => (
                <div key={angle}>
                  <div className="label" style={{ textAlign: "center" }}>
                    {angle}
                  </div>
                  <div
                    className="photo-slot"
                    onClick={() => document.getElementById(`photo-${angle}`).click()}
                  >
                    {pendingImages[angle] ? (
                      <img src={pendingImages[angle]} alt={angle} />
                    ) : (
                      <>
                        <Camera size={24} style={{ color: "rgba(255,255,255,0.4)" }} />
                        <span>{angle}</span>
                      </>
                    )}
                  </div>
                  <input
                    id={`photo-${angle}`}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handlePhotoUpload(angle, e)}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSavePhotos}
              disabled={isSaveDisabled}
            >
              {isSyncing ? "Enviando e Sincronizando..." : "Salvar Registro Semanal"}
            </button>
          </div>

          {/* Photo history card */}
          <div className="section-title">Histórico de Fotos</div>
          {!(state.progressPhotos || []).length ? (
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>
              Nenhuma foto registrada ainda
            </div>
          ) : (
            (state.progressPhotos || [])
              .slice()
              .reverse()
              .map((entry) => {
                const isViewing = viewPhotoId === entry.id;
                return (
                  <div className="card" key={entry.id}>
                    <div className="row-sb" style={{ marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "15px" }}>{entry.week}</div>
                        <div className="small">{fmtDate(entry.date)}</div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => setViewPhotoId(isViewing ? null : entry.id)}
                      >
                        {isViewing ? "Fechar" : "Ver fotos"}
                      </button>
                    </div>

                    {isViewing && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        {["Frente", "Lado", "Costas"].map((a) => (
                          <div key={a}>
                            <div className="label" style={{ textAlign: "center" }}>
                              {a}
                            </div>
                            {entry.images[a] ? (
                              <img
                                src={entry.images[a]}
                                alt={a}
                                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "10px" }}
                              />
                            ) : (
                              <div className="photo-slot" style={{ cursor: "default" }}>
                                Sem foto
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* STATS SUB-TAB */}
      {activeSubTab === "stats" && (
        <div>
          <div className="card">
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>Resumo Completo</div>
            {[
              { icon: Calendar, label: "Dias de dieta", value: dietDaysCount, color: "#f97316" },
              { icon: Dumbbell, label: "Treinos totais", value: state.workoutLogs.length, color: "#8b5cf6" },
              { icon: Scale, label: "Registros de peso", value: wl.length, color: "#10b981" },
              { icon: Camera, label: "Semanas com foto", value: (state.progressPhotos || []).length, color: "#3b82f6" },
              { icon: Flame, label: "Calorias consumidas (total)", value: totalCaloriesIntake.toLocaleString(), color: "#ef4444" },
              { icon: Dumbbell, label: "Volume total levantado", value: `${totalWorkoutVolume.toLocaleString()}kg`, color: "#a855f7" },
            ].map((row, idx) => {
              const Icon = row.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "14px",
                    alignItems: "center"
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon size={14} style={{ color: row.color }} /> {row.label}
                  </span>
                  <span style={{ fontWeight: "700" }}>{row.value}</span>
                </div>
              );
            })}
          </div>

          {/* WEEKLY PERFORMANCE RESUME */}
          <div className="card" style={{ marginTop: "16px" }}>
            <div className="syne" style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <TrendingUp size={14} /> Desempenho Semanal (Últimos 7 dias)
            </div>
            
            {/* Deficit card */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Déficit Calórico Médio Real</div>
              <div className="syne" style={{ fontSize: "18px", fontWeight: "700", color: avgConsumed > 0 && (PROFILE.tdee - avgConsumed) > 0 ? "#10b981" : "#f97316" }}>
                {avgDeficitStr}
              </div>
              {avgConsumed > 0 && (
                <div className="small" style={{ marginTop: "4px" }}>
                  Média de consumo: {avgConsumed} kcal / Gasto estimado (TDEE): {PROFILE.tdee} kcal
                </div>
              )}
            </div>

            {/* Sets per muscle group */}
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Séries Válidas por Grupo Muscular</div>
            {sortedMuscleGroups.length === 0 ? (
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", padding: "10px 0" }}>
                Nenhum treino com séries válidas registrado nos últimos 7 dias.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sortedMuscleGroups.map(({ group, count }) => {
                  const maxSets = Math.max(...sortedMuscleGroups.map(g => g.count), 1);
                  const pct = Math.min((count / maxSets) * 100, 100);
                  return (
                    <div key={group}>
                      <div className="row-sb" style={{ fontSize: "12px", marginBottom: "3px" }}>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{group}</span>
                        <span style={{ fontWeight: "700", color: "#3b82f6" }}>{count} {count === 1 ? "série" : "séries"}</span>
                      </div>
                      <div className="bar-track" style={{ height: "4px" }}>
                        <div className="bar-fill" style={{ width: `${pct}%`, background: "#3b82f6" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REFERENCE METAS TABLE */}
          <div className="card" style={{ marginTop: "16px" }}>
            <div className="syne" style={{ fontSize: "14px", fontWeight: "800", color: "#f97316", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Target size={14} /> Metas de Cutting (Referência Científica)
            </div>
            
            {[
              { label: "Peso Inicial / Altura", value: `${PROFILE.weight} kg / ${(PROFILE.height || 176) / 100} m` },
              { label: "Idade / BF Inicial", value: `${PROFILE.age} anos / ~${PROFILE.current_bf}%` },
              { label: "TDEE (Gasto Energético)", value: `~${PROFILE.tdee} kcal/dia` },
              { label: "Déficit Semanal Alvo", value: `${PROFILE.weeklyDeficitNeeded} kcal (~${(PROFILE.weeklyWeightLossTargetKg * 1000).toFixed(0)}g/semana)` },
              { label: "Proteína Diária", value: `${Math.round(PROFILE.proteinFactor * PROFILE.weight)}g (${PROFILE.proteinFactor}g/kg)` },
              { label: "Dias Normais (Carbo Mod.)", value: `${PROFILE.normal?.kcal || 2600} kcal (${PROFILE.normal?.carbs || 290}g carbo)` },
              { label: "Dias Pesados (Carbo Alto.)", value: `${PROFILE.heavy?.kcal || 2800} kcal (${PROFILE.heavy?.carbs || 330}g carbo)` },
              { label: "Domingo (Ref. Livre)", value: "Não contabilizado (Livre)" }
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: idx < 7 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.5)" }}>
                  {row.label}
                </span>
                <span style={{ fontWeight: "600", color: "#fff" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
