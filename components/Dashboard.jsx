"use client";

import React, { useState } from "react";
import { Scale, Flame, Calendar, Dumbbell } from "lucide-react";

// Reusable MacroRing Component
function MacroRing({ val, max, color, size, stroke, label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(val / Math.max(max, 1), 1) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease-in-out" }}
        />
      </svg>
      <div style={{ marginTop: `-${size * 0.62}px`, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: `${size * 0.18}px`, fontWeight: "700", color: "#fff", fontFamily: "'Syne',sans-serif" }}>
          {Math.round(val)}
        </div>
        <div style={{ fontSize: `${size * 0.13}px`, color: "rgba(255,255,255,0.5)" }}>
          /{max}
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600", marginTop: `${size * 0.6}px` }}>
        {label}
      </div>
    </div>
  );
}

// Reusable ProgressBar Component
function ProgressBar({ val, max, color, label, unit = "" }) {
  const pct = Math.min((val / Math.max(max, 1)) * 100, 100);
  return (
    <div className="bar-wrap">
      <div className="row-sb" style={{ fontSize: "12px", marginBottom: "4px" }}>
        <span style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ color: "#fff" }}>
          {Math.round(val)}
          {unit} <span style={{ color: "rgba(255,255,255,0.4)" }}>/ {max}{unit}</span>
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

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

export default function Dashboard({
  state,
  saveWeightLog,
  todaySched,
  getTargets,
  todayFoodLogs,
  getTotals,
  PROFILE,
}) {
  const [weightInput, setWeightInput] = useState("");

  const s = todaySched;
  const t = getTargets();
  const logs = todayFoodLogs();
  const tot = getTotals(logs);

  const wl = state.weightLogs || [];

  // Peso atual = último log registrado, ou peso inicial do perfil se ainda não logou nada
  const lastW = wl.length ? wl[wl.length - 1].value : PROFILE.weight;

  // Peso inicial = SEMPRE o peso cadastrado no perfil (referência real de onde começou)
  const firstW = PROFILE.weight;

  // Kg perdidos desde o início (nunca negativo — se ganhou peso, lost=0)
  const lost = Math.max(0, firstW - lastW);

  // Semanas desde o primeiro log de peso (ou 1 se ainda não tem logs)
  const weeks = (() => {
    if (!wl.length) return 1;
    const firstDate = new Date(wl[0].date + "T12:00:00");
    const today = new Date();
    const diffDays = Math.max(1, Math.round((today - firstDate) / (1000 * 60 * 60 * 24)));
    return Math.max(1, Math.ceil(diffDays / 7));
  })();

  // BF estimado: para cada 1kg perdido, assume redução proporcional à gordura corporal atual
  // Usa a proporção: gordura perdida = lost * (current_bf / 100) * 0.75
  // (estimativa conservadora: ~75% da perda vem de gordura, 25% de água/massa magra)
  const fatKgLost = lost * (PROFILE.current_bf / 100) * 0.75;
  const bfNow = Math.max(
    PROFILE.goal_bf,
    (PROFILE.current_bf - (fatKgLost / lastW) * 100)
  ).toFixed(1);

  const bfDiffTotal = PROFILE.current_bf - PROFILE.goal_bf;
  const bfLost = PROFILE.current_bf - Number(bfNow);
  const bfProg = bfDiffTotal > 0 ? Math.min((bfLost / bfDiffTotal) * 100, 100).toFixed(0) : 100;

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasTrained = (state.workoutLogs || []).some((w) => w.date === todayStr);

  // Calorie history for the last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const k = (state.foodLogs || []).filter((l) => l.date === ds).reduce((a, l) => a + l.kcal, 0);
    return {
      ds,
      k,
      lbl: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()],
    };
  }).reverse();

  const maxK = Math.max(...last7.map((d) => d.k), 2800);

  const handleSaveWeight = () => {
    const v = parseFloat(weightInput);
    if (isNaN(v)) return;
    saveWeightLog(v);
    setWeightInput("");
  };

  return (
    <div>
      {/* TODAY OVERVIEW */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
          Hoje — {s.calType === "heavy" ? "Dia Pesado 🦵" : s.calType === "free" ? "Dia Livre 🍕" : "Dia Normal"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <MacroRing val={tot.kcal} max={t.kcal} color="#f97316" size={110} stroke={10} label="kcal" />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <MacroRing val={tot.protein} max={t.protein} color="#3b82f6" size={68} stroke={7} label="Prot." />
            <MacroRing val={tot.carbs} max={t.carbs} color="#8b5cf6" size={68} stroke={7} label="Carbo" />
            <MacroRing val={tot.fat} max={t.fat} color="#f59e0b" size={68} stroke={7} label="Gord." />
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <ProgressBar val={tot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid2">
        <StatCard
          icon={Scale}
          label="Peso Atual"
          value={`${lastW} kg`}
          sub={lost > 0 ? `-${lost}kg perdido` : "Sem variação"}
          color="#10b981"
        />
        <StatCard
          icon={Flame}
          label="BF Estimado"
          value={`~${bfNow}%`}
          sub={`Meta: ${PROFILE.goal_bf}%`}
          color="#f97316"
        />
        <StatCard
          icon={Calendar}
          label="Semanas"
          value={`${weeks}w`}
          sub={`${(lost / weeks).toFixed(2)}kg/sem`}
          color="#3b82f6"
        />
        <StatCard
          icon={Dumbbell}
          label="Treino hoje"
          value={hasTrained ? "Feito" : "Pendente"}
          sub=""
          color="#8b5cf6"
        />
      </div>

      {/* BF PROGRESS BAR */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
          Progresso até {PROFILE.goal_bf}% BF
        </div>
        <div className="row-sb" style={{ fontSize: "12px", marginBottom: "6px" }}>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            {PROFILE.current_bf}% → {PROFILE.goal_bf}%
          </span>
          <span style={{ color: "#f97316", fontWeight: "700" }}>{bfProg}%</span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{ width: `${bfProg}%`, background: "linear-gradient(90deg, #f97316, #ec4899)" }}
          />
        </div>
      </div>

      {/* REGISTER WEIGHT */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
          Registrar Peso de Hoje
        </div>
        <div className="row" style={{ gap: "10px" }}>
          <input
            id="inp-weight"
            type="number"
            placeholder={`${lastW} kg`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSaveWeight}>
            Salvar
          </button>
        </div>
      </div>

      {/* 7 DAYS CALORIE CHART */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "14px" }}>
          Calorias — 7 dias
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
          {last7.map((d, index) => {
            const isToday = d.ds === todayStr;
            const barHeight = d.k > 0 ? Math.max(4, (d.k / maxK) * 60) : 4;
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>
                  {d.k > 0 ? d.k : ""}
                </div>
                <div
                  style={{
                    width: "100%",
                    background: isToday ? "#f97316" : "rgba(255,255,255,0.12)",
                    borderRadius: "4px 4px 0 0",
                    height: `${barHeight}px`,
                    minHeight: "4px",
                    transition: "height 0.3s ease",
                  }}
                />
                <div
                  style={{
                    fontSize: "9px",
                    color: isToday ? "#f97316" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {d.lbl}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
