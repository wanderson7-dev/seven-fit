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
  const MEALS = ["Café da Manhã", "Almoço", "Jantar", "Lanches"];

  const [activeSubTab, setActiveSubTab] = useState("log");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodQty, setFoodQty] = useState("100");
  const [logDate, setLogDate] = useState(() => today());
  const [activeMeal, setActiveMeal] = useState(null); // qual refeição está com busca aberta
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
    addFoodLog(selectedFood, qty, logDate, activeMeal);
    setSelectedFood(null);
    setFoodQty("100");
    setFoodSearch("");
    setActiveMeal(null);
  };

  const openMealSearch = (meal) => {
    setActiveMeal(meal);
    setSelectedFood(null);
    setFoodSearch("");
    setFoodQty("100");
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", minWidth: 0 }}>
            <input
              type="date"
              value={logDate}
              max={today()}
              onChange={(e) => { setLogDate(e.target.value || today()); setActiveMeal(null); }}
              style={{ fontWeight: "600", fontSize: "13px", minWidth: 0, flex: 1, width: "100%" }}
            />
            {logDate !== today() && (
              <button
                className="btn btn-ghost"
                style={{ padding: "10px 12px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
                onClick={() => { setLogDate(today()); setActiveMeal(null); }}
              >
                Hoje
              </button>
            )}
          </div>

          {/* Search panel (aparece quando uma refeição está ativa) */}
          {activeMeal && (
            <div style={{
              background: "rgba(249,115,22,0.06)",
              border: "1px solid rgba(249,115,22,0.25)",
              borderRadius: "18px",
              padding: "14px",
              marginBottom: "14px",
            }}>
              <div className="row-sb" style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>
                  + {activeMeal}
                </span>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "2px" }}
                  onClick={() => { setActiveMeal(null); setSelectedFood(null); setFoodSearch(""); }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search bar */}
              {!selectedFood && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={15} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar alimento..."
                      value={foodSearch}
                      onChange={(e) => { setFoodSearch(e.target.value); setSelectedFood(null); }}
                      style={{ paddingLeft: "34px", fontSize: "13px" }}
                    />
                  </div>
                  <button
                    className="btn"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "0 12px", height: "42px", display: "flex", alignItems: "center", flexShrink: 0 }}
                    onClick={openScanner}
                  >
                    <Camera size={18} />
                  </button>
                </div>
              )}

              {/* Dropdown */}
              {foodSearch && !selectedFood && (
                <div style={{ background: "rgba(14,14,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", marginBottom: "8px", overflow: "hidden" }}>
                  {filteredFoods.length > 0 && (
                    <div>
                      <div className="small" style={{ padding: "7px 14px 3px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px" }}>Locais</div>
                      {filteredFoods.map((f) => (
                        <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                          <span>{f.name}</span>
                          <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>{f.kcal} kcal/{f.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {onlineFoods.length > 0 && (
                    <div>
                      <div className="small" style={{ padding: "7px 14px 3px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", color: "#f97316", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Cloud size={9} /> Nuvem
                      </div>
                      {onlineFoods.filter((of) => !filteredFoods.some((lf) => lf.name.toLowerCase() === of.name.toLowerCase())).slice(0, 8).map((f) => (
                        <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                          <span>{f.name}</span>
                          <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>{f.kcal} kcal/{f.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearchingOnline && (
                    <div style={{ padding: "10px 14px", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ width: "10px", height: "10px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      Buscando...
                    </div>
                  )}
                  {filteredFoods.length === 0 && onlineFoods.length === 0 && !isSearchingOnline && (
                    <div style={{ padding: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>Nenhum resultado para "{foodSearch}"</div>
                      <button className="btn" onClick={() => openScanner("label")} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: "12px", fontWeight: "700", padding: "7px 14px", borderRadius: "10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Camera size={13} /> Fotografar rótulo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected food confirm */}
              {selectedFood && (
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>{selectedFood.name}</div>
                  <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Flame size={11} style={{ color: "#f97316" }} /> {selectedFood.kcal} kcal</span>
                    <span>P:{selectedFood.protein}g</span>
                    <span>C:{selectedFood.carbs}g</span>
                    <span>G:{selectedFood.fat}g</span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>/{selectedFood.unit}</span>
                  </div>
                  <div className="row" style={{ gap: "10px" }}>
                    <input type="number" placeholder="gramas" value={foodQty} onChange={(e) => setFoodQty(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={handleAddLog}>Adicionar</button>
                    <button className="btn btn-ghost" style={{ padding: "10px 12px" }} onClick={() => setSelectedFood(null)}><X size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meal Cards */}
          {MEALS.map((meal) => {
            const mealLogs = logs.filter((l) => (l.meal || "Almoço") === meal);
            const mealTot  = getTotals(mealLogs);
            const isOpen   = activeMeal === meal;

            return (
              <div key={meal} className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "10px" }}>
                {/* Meal header */}
                <div style={{ padding: "14px 16px 10px", borderBottom: mealLogs.length ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div className="row-sb">
                    <span style={{ fontWeight: "700", fontSize: "14px" }}>{meal}</span>
                    <div className="row" style={{ gap: "10px" }}>
                      {mealLogs.length > 0 && (
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>
                          {mealTot.kcal} kcal
                        </span>
                      )}
                    </div>
                  </div>
                  {mealLogs.length > 0 && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      C:{mealTot.carbs}g · P:{mealTot.protein}g · G:{mealTot.fat}g
                    </div>
                  )}
                </div>

                {/* Food items */}
                {mealLogs.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.foodName}</div>
                      <div className="small">{l.qty}g · P:{l.protein}g C:{l.carbs}g G:{l.fat}g</div>
                    </div>
                    <div className="row" style={{ gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>{l.kcal}</span>
                      <button className="btn-danger" onClick={() => removeFoodLog(l.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", padding: 0 }}>
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={() => isOpen ? setActiveMeal(null) : openMealSearch(meal)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "11px 16px", display: "flex", alignItems: "center", gap: "6px", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Adicionar alimentos
                </button>
              </div>
            );
          })}
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
