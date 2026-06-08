"use client";

import React, { useState, useEffect } from "react";
import { Search, Camera, Cloud, Upload, Download, Trash2, Settings, Flame, X } from "lucide-react";

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

export default function DietTab({
  state,
  saveCustomFood,
  addFoodLog,
  removeFoodLog,
  openScanner,
  todaySched,
  getTargets,
  todayFoodLogs,
  getTotals,
  allFoods,
  mealPlan,
  saveMealPlan,
  fmtDate,
  today,
  clearSelectedFood,
}) {
  const [activeSubTab, setActiveSubTab] = useState("log");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodQty, setFoodQty] = useState("100");
  const [logDate, setLogDate] = useState(() => today());
  const [histDietDate, setHistDietDate] = useState("");
  const [planStatus, setPlanStatus] = useState({ type: "", message: "" });

  // Live online food search state
  const [onlineFoods, setOnlineFoods] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  useEffect(() => {
    if (!foodSearch || foodSearch.trim().length < 2) {
      setOnlineFoods([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const response = await fetch(`/api/food-search?query=${encodeURIComponent(foodSearch)}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setOnlineFoods(data.foods);
        }
      } catch (err) {
        console.error("Online search error:", err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [foodSearch]);

  // Custom Food Form State
  const [cfName, setCfName] = useState("");
  const [cfKcal, setCfKcal] = useState("");
  const [cfProtein, setCfProtein] = useState("");
  const [cfCarbs, setCfCarbs] = useState("");
  const [cfFat, setCfFat] = useState("");

  const t = getTargets();
  const logs = state.foodLogs.filter((l) => l.date === logDate);
  const tot = getTotals(logs);

  // Initialize historical date
  const dates = [...new Set(state.foodLogs.map((l) => l.date))].sort().reverse();
  useEffect(() => {
    if (dates.length && !histDietDate) {
      setHistDietDate(dates[0]);
    }
  }, [dates, histDietDate]);

  // Synchronize foodSearch selections
  const filteredFoods = foodSearch
    ? allFoods().filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 7)
    : [];

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setFoodSearch(""); // Close dropdown after selection
  };

  const handleAddLog = () => {
    if (!selectedFood) return;
    const qty = parseFloat(foodQty) || 100;
    addFoodLog(selectedFood, qty, logDate);
    setSelectedFood(null);
    setFoodQty("100");
    setFoodSearch("");
  };

  const handleSaveCustom = () => {
    const name = cfName.trim();
    const kcal = parseFloat(cfKcal);
    if (!name || isNaN(kcal)) return;

    saveCustomFood({
      name,
      kcal,
      protein: parseFloat(cfProtein) || 0,
      carbs: parseFloat(cfCarbs) || 0,
      fat: parseFloat(cfFat) || 0,
    });

    // Reset Form
    setCfName("");
    setCfKcal("");
    setCfProtein("");
    setCfCarbs("");
    setCfFat("");
  };

  // If a scanned food is set externally (e.g. from ScannerModal) in parent state
  useEffect(() => {
    if (state.selectedFood) {
      setSelectedFood(state.selectedFood);
      setFoodSearch(state.selectedFood.name);
      if (clearSelectedFood) {
        clearSelectedFood();
      }
    }
  }, [state.selectedFood]);

  const handleExportMealPlan = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mealPlan, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "plano-alimentar-cutting.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setPlanStatus({
        type: "success",
        message: "Plano exportado com sucesso! Verifique os seus downloads. 💾"
      });
      setTimeout(() => {
        setPlanStatus({ type: "", message: "" });
      }, 5000);
    } catch (err) {
      setPlanStatus({
        type: "error",
        message: "Ocorreu um erro ao exportar o plano de dieta."
      });
    }
  };

  const handleImportMealPlan = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("O arquivo JSON deve ser um objeto.");
        }
        if (!Array.isArray(parsed.normal) || !Array.isArray(parsed.heavy)) {
          throw new Error("O plano de dieta deve conter as listas 'normal' e 'heavy'.");
        }
        
        const validateMeals = (meals) => {
          return meals.every(meal => 
            meal &&
            typeof meal === "object" && 
            typeof meal.time === "string" &&
            typeof meal.name === "string" &&
            Array.isArray(meal.foods) &&
            typeof meal.kcal === "number"
          );
        };
        
        if (!validateMeals(parsed.normal) || !validateMeals(parsed.heavy)) {
          throw new Error("Formato inválido. Cada refeição precisa conter: time, name, foods (lista) e kcal.");
        }
        
        saveMealPlan(parsed);
        setPlanStatus({
          type: "success",
          message: "Plano de dieta importado e atualizado com sucesso! 🎉"
        });
        setTimeout(() => {
          setPlanStatus({ type: "", message: "" });
        }, 5000);
      } catch (err) {
        setPlanStatus({
          type: "error",
          message: `Erro ao importar: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      {/* MACRO SUMMARY */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <ProgressBar val={tot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
        <ProgressBar val={tot.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
        <ProgressBar val={tot.carbs} max={t.carbs} color="#8b5cf6" label="Carboidrato" unit="g" />
        <ProgressBar val={tot.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
      </div>

      {/* SUB TABS */}
      <div className="sub-tabs">
        {[
          { id: "log", label: "Registrar" },
          { id: "plan", label: "Plano" },
          { id: "hist", label: "Histórico" },
          { id: "add", label: "+ Alimento" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`sub-tab ${activeSubTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveSubTab(tab.id);
              setSelectedFood(null);
              setFoodSearch("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REGISTRAR SUB-TAB */}
      {activeSubTab === "log" && (
        <div>
          {/* Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="date"
                value={logDate}
                max={today()}
                onChange={(e) => setLogDate(e.target.value || today())}
                style={{ paddingLeft: "14px", fontWeight: "600", fontSize: "13px" }}
              />
            </div>
            {logDate !== today() && (
              <button
                className="btn btn-ghost"
                style={{ padding: "10px 14px", fontSize: "12px", flexShrink: 0 }}
                onClick={() => setLogDate(today())}
              >
                Hoje
              </button>
            )}
          </div>

          <div className="row" style={{ gap: "10px", marginBottom: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
              <input
                id="food-search"
                type="text"
                placeholder="Buscar alimento..."
                value={foodSearch}
                onChange={(e) => {
                  setFoodSearch(e.target.value);
                  setSelectedFood(null);
                }}
                style={{ paddingLeft: "36px" }}
              />
            </div>
            <button
              className="btn"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "0 14px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              onClick={openScanner}
            >
              <Camera size={20} />
            </button>
          </div>

          {/* Search Dropdown Results */}
          {foodSearch && !selectedFood && (
            <div
              style={{
                background: "rgba(18,18,28,0.99)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                marginBottom: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Local Foods Section */}
              {filteredFoods.length > 0 && (
                <div>
                  <div className="small" style={{ padding: "8px 16px 4px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px" }}>
                    Alimentos Locais
                  </div>
                  {filteredFoods.map((f) => (
                    <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                      <span>{f.name}</span>
                      <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
                        {f.kcal} kcal/{f.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Online Foods Section */}
              {onlineFoods.length > 0 && (
                <div>
                  <div className="small" style={{ padding: "8px 16px 4px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", color: "#f97316", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Cloud size={10} /> Busca na Nuvem
                  </div>
                  {onlineFoods
                    // Avoid showing duplicates if already shown in local results
                    .filter((of) => !filteredFoods.some((lf) => lf.name.toLowerCase() === of.name.toLowerCase()))
                    .slice(0, 8)
                    .map((f) => (
                      <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                        <span>{f.name}</span>
                        <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
                          {f.kcal} kcal/{f.unit}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Searching online loader */}
              {isSearchingOnline && (
                <div style={{ padding: "12px 16px", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  <span>Buscando na nuvem...</span>
                </div>
              )}

              {/* No results placeholder */}
              {filteredFoods.length === 0 && onlineFoods.length === 0 && !isSearchingOnline && (
                <div style={{ 
                  padding: "20px", 
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                    Nenhum alimento encontrado com o nome "{foodSearch}".
                  </div>
                  <button
                    className="btn"
                    onClick={() => openScanner("label")}
                    style={{
                      background: "rgba(249, 115, 22, 0.1)",
                      border: "1px solid rgba(249, 115, 22, 0.3)",
                      color: "#f97316",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Camera size={14} /> Fotografar Tabela Nutricional
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected Food Widget */}
          {selectedFood && (
            <div
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "6px" }}>{selectedFood.name}</div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Flame size={12} style={{ color: "#f97316" }} /> {selectedFood.kcal} kcal</span>
                <span>P: {selectedFood.protein}g</span>
                <span>C: {selectedFood.carbs}g</span>
                <span>G: {selectedFood.fat}g</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>/{selectedFood.unit}</span>
              </div>
              <div className="row" style={{ gap: "10px" }}>
                <input
                  id="food-qty"
                  type="number"
                  placeholder="gramas"
                  value={foodQty}
                  onChange={(e) => setFoodQty(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleAddLog}>
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Registered Day List */}
          <div className="section-title">
            {logDate === today() ? "Registrado hoje" : `Registrado em ${fmtDate(logDate)}`}
          </div>
          {!logs.length ? (
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>
              Nenhum alimento registrado
            </div>
          ) : (
            logs.map((l) => (
              <div className="food-item" key={l.id}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500" }}>{l.foodName}</div>
                  <div className="small">
                    {l.qty}g · P:{l.protein}g C:{l.carbs}g G:{l.fat}g
                  </div>
                </div>
                <div className="row" style={{ gap: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#f97316" }}>{l.kcal}</span>
                  <button className="btn-danger" onClick={() => removeFoodLog(l.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", padding: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PLANO SUB-TAB */}
      {activeSubTab === "plan" && (
        <div>
          {/* Action Bar for Customizing Diet Plan */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            padding: "10px 12px",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}><Settings size={14} /> Personalizar Plano</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => document.getElementById("meal-plan-import-input").click()}
                className="btn"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Upload size={12} /> Importar
              </button>
              <button
                onClick={handleExportMealPlan}
                className="btn"
                style={{
                  background: "rgba(249, 115, 22, 0.15)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#f97316",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Download size={12} /> Exportar
              </button>
              <input
                id="meal-plan-import-input"
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImportMealPlan}
              />
            </div>
          </div>

          {/* Status Message */}
          {planStatus.message && (
            <div style={{
              background: planStatus.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${planStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "12px",
              color: planStatus.type === "success" ? "#10b981" : "#ef4444",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>{planStatus.message}</span>
              <button 
                onClick={() => setPlanStatus({ type: "", message: "" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {(() => {
            const currentPlan = (todaySched.calType === "heavy" ? mealPlan?.heavy : mealPlan?.normal) || [];
            const totalPlanKcal = currentPlan.reduce((sum, m) => sum + (m.kcal || 0), 0);
            
            return (
              <>
                <div className="small" style={{ marginBottom: "12px" }}>
                  {todaySched.calType === "heavy" ? `🦵 Dia Pesado — ${totalPlanKcal} kcal` : `Dia Normal — ${totalPlanKcal} kcal`}
                </div>
                {!currentPlan.length ? (
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "32px" }}>
                    Nenhuma refeição cadastrada para este tipo de dia.
                  </div>
                ) : (
                  currentPlan.map((meal, index) => (
                    <div className="card" key={index}>
                      <div className="row-sb" style={{ marginBottom: "10px" }}>
                        <div style={{ fontWeight: "600", fontSize: "15px" }}>{meal.name}</div>
                        <div className="small">
                          {meal.time} · {meal.kcal} kcal
                        </div>
                      </div>
                      {meal.foods?.map((food, fIdx) => (
                        <div
                          key={fIdx}
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.6)",
                            padding: "5px 0",
                            borderBottom: fIdx < meal.foods.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                        >
                          · {food}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* HISTÓRICO SUB-TAB */}
      {activeSubTab === "hist" && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>
              Selecionar data
            </div>
            <select
              value={histDietDate || today()}
              onChange={(e) => setHistDietDate(e.target.value)}
            >
              <option value={today()}>Hoje</option>
              {dates
                .filter((d) => d !== today())
                .map((d) => (
                  <option key={d} value={d}>
                    {fmtDate(d)}
                  </option>
                ))}
            </select>
          </div>

          {/* Show Historical details */}
          {(() => {
            const hLogs = state.foodLogs.filter((l) => l.date === histDietDate);
            const hTot = getTotals(hLogs);
            if (!hLogs.length) {
              return (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "32px" }}>
                  Nenhum registro nesta data
                </div>
              );
            }
            return (
              <div>
                <div className="card">
                  <ProgressBar val={hTot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
                  <ProgressBar val={hTot.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
                  <ProgressBar val={hTot.carbs} max={t.carbs} color="#8b5cf6" label="Carboidrato" unit="g" />
                  <ProgressBar val={hTot.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
                </div>
                {hLogs.map((l) => (
                  <div className="food-item" key={l.id}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>{l.foodName}</div>
                      <div className="small">
                        {l.qty}g · P:{l.protein}g C:{l.carbs}g G:{l.fat}g
                      </div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#f97316" }}>{l.kcal}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* + ALIMENTO SUB-TAB */}
      {activeSubTab === "add" && (
        <div>
          <div className="card">
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              Cadastrar Alimento Manual
            </div>
            {[
              { label: "Nome", val: cfName, set: setCfName, type: "text", placeholder: "Ex: Pasta de Amendoim" },
              { label: "Calorias (por 100g)", val: cfKcal, set: setCfKcal, type: "number", placeholder: "Ex: 588" },
              { label: "Proteína (g)", val: cfProtein, set: setCfProtein, type: "number", placeholder: "Ex: 24" },
              { label: "Carboidrato (g)", val: cfCarbs, set: setCfCarbs, type: "number", placeholder: "Ex: 20" },
              { label: "Gordura (g)", val: cfFat, set: setCfFat, type: "number", placeholder: "Ex: 49" },
            ].map((inputSpec, index) => (
              <div style={{ marginBottom: "10px" }} key={index}>
                <div className="label">{inputSpec.label}</div>
                <input
                  type={inputSpec.type}
                  value={inputSpec.val}
                  onChange={(e) => inputSpec.set(e.target.value)}
                  placeholder={inputSpec.placeholder}
                />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} onClick={handleSaveCustom}>
              Salvar Alimento
            </button>

            {/* Custom Foods list */}
            {state.customFoods.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <div className="section-title">Personalizados</div>
                {state.customFoods.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.6)",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {f.name} {f.scanned && <Camera size={12} style={{ color: "#10b981" }} />}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>{f.kcal} kcal/100g</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
