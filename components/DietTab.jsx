"use client";

import React, { useState, useEffect } from "react";
import { Search, Camera, Cloud, Upload, Download, Trash2, Settings, Flame, X, Plus, ChevronDown, ChevronUp, History } from "lucide-react";

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
  const [foodsTab, setFoodsTab] = useState("meus"); // "meus" | "biblioteca"
  const [showAddForm, setShowAddForm] = useState(false);
  const [libSearch, setLibSearch] = useState("");
  const [libFoods, setLibFoods] = useState([]);
  const [isLibSearching, setIsLibSearching] = useState(false);
  // food picked from Alimentos tab (needs meal + qty selection)
  const [pickedFood, setPickedFood] = useState(null);
  const [pickedQty, setPickedQty] = useState("100");
  const [pickedMeal, setPickedMeal] = useState("Almoço");
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

  // Biblioteca search debounce
  useEffect(() => {
    if (!libSearch || libSearch.trim().length < 2) { setLibFoods([]); return; }
    const t = setTimeout(async () => {
      setIsLibSearching(true);
      try {
        const res = await fetch(`/api/food-search?query=${encodeURIComponent(libSearch)}`);
        const data = await res.json();
        if (res.ok && data.success) setLibFoods(data.foods);
      } catch { /* ignore */ } finally { setIsLibSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [libSearch]);

  const handleAddPicked = () => {
    if (!pickedFood) return;
    addFoodLog(pickedFood, parseFloat(pickedQty) || 100, logDate, pickedMeal);
    setPickedFood(null);
    setPickedQty("100");
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
          { id: "foods", label: "Alimentos" },
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

          {/* Painel de adição de alimento (aparece ao clicar "+ Adicionar alimentos") */}
          {activeMeal && (
            <div style={{ background: "rgba(12,12,20,0.98)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: "20px", marginBottom: "14px", overflow: "hidden" }}>

              {/* Header */}
              <div className="row-sb" style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>+ {activeMeal}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "2px" }}
                  onClick={() => { setActiveMeal(null); setSelectedFood(null); setFoodSearch(""); setFoodsTab("meus"); }}>
                  <X size={16} />
                </button>
              </div>

              {/* Selected food confirm */}
              {selectedFood ? (
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{selectedFood.name}</div>
                  <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ color: "#f97316" }}><Flame size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {selectedFood.kcal} kcal</span>
                    <span>C:{selectedFood.carbs}g</span><span>P:{selectedFood.protein}g</span><span>G:{selectedFood.fat}g</span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>/{selectedFood.unit}</span>
                  </div>
                  <div className="row" style={{ gap: "8px" }}>
                    <input type="number" placeholder="gramas" value={foodQty} onChange={(e) => setFoodQty(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={handleAddLog}>Adicionar</button>
                    <button className="btn btn-ghost" style={{ padding: "10px 12px" }} onClick={() => setSelectedFood(null)}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Inner tabs: Meus Alimentos / Biblioteca */}
                  <div style={{ display: "flex", gap: "4px", padding: "10px 12px 0", background: "transparent" }}>
                    {[{ id: "meus", label: "Meus Alimentos" }, { id: "biblioteca", label: "Biblioteca" }].map((t) => (
                      <button key={t.id} onClick={() => { setFoodsTab(t.id); setFoodSearch(""); setLibSearch(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", background: foodsTab === t.id ? "#f97316" : "rgba(255,255,255,0.06)", color: foodsTab === t.id ? "#fff" : "rgba(255,255,255,0.45)" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: "10px 12px 14px" }}>

                    {/* ── Meus Alimentos ── */}
                    {foodsTab === "meus" && (
                      <div>
                        {/* Search local */}
                        <div style={{ position: "relative", marginBottom: "10px" }}>
                          <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                          <input type="text" placeholder="Filtrar meus alimentos..." value={foodSearch}
                            onChange={(e) => setFoodSearch(e.target.value)}
                            style={{ paddingLeft: "32px", fontSize: "13px" }} />
                        </div>

                        {/* Recently used */}
                        {!foodSearch && (() => {
                          const usedNames = [...new Set(state.foodLogs.map(l => l.foodName))];
                          const recent = usedNames.map(name => allFoods().find(f => f.name === name)).filter(Boolean).slice(0, 5);
                          return recent.length > 0 ? (
                            <div style={{ marginBottom: "6px" }}>
                              <div style={{ fontSize: "9px", fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <History size={10} /> Recentes
                              </div>
                              {recent.map((f) => (
                                <div key={f.id} onClick={() => handleSelectFood(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", marginBottom: "2px", background: "rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g</div>
                                  </div>
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginLeft: "8px", flexShrink: 0 }}>{f.kcal} kcal</span>
                                </div>
                              ))}
                              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                            </div>
                          ) : null;
                        })()}

                        {/* Full list filtered */}
                        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                          {(foodSearch
                            ? allFoods().filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()))
                            : allFoods()
                          ).map((f) => (
                            <div key={f.id} onClick={() => handleSelectFood(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", marginBottom: "2px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                                  {f.name} {f.scanned && <Camera size={10} style={{ color: "#10b981" }} />}
                                </div>
                                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g</div>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginLeft: "8px", flexShrink: 0 }}>{f.kcal} kcal</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Biblioteca ── */}
                    {foodsTab === "biblioteca" && (
                      <div>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ position: "relative", flex: 1 }}>
                            <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                            <input autoFocus type="text" placeholder="Buscar na base de dados..." value={libSearch}
                              onChange={(e) => setLibSearch(e.target.value)}
                              style={{ paddingLeft: "32px", fontSize: "13px" }} />
                          </div>
                          <button className="btn" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", padding: "0 11px", height: "42px", display: "flex", alignItems: "center", flexShrink: 0 }} onClick={openScanner}>
                            <Camera size={17} />
                          </button>
                        </div>

                        {isLibSearching && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                            <div style={{ width: "10px", height: "10px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                            Buscando...
                          </div>
                        )}

                        {!libSearch && !isLibSearching && (
                          <div style={{ textAlign: "center", padding: "24px 12px", color: "rgba(255,255,255,0.22)", fontSize: "12px" }}>
                            <Cloud size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.25 }} />
                            Digite para buscar na base externa
                          </div>
                        )}

                        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                          {libFoods.map((f) => (
                            <div key={f.id} onClick={() => handleSelectFood(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", marginBottom: "2px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g</div>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginLeft: "8px", flexShrink: 0 }}>{f.kcal} kcal</span>
                            </div>
                          ))}
                        </div>

                        {libSearch && !isLibSearching && libFoods.length === 0 && (
                          <div style={{ textAlign: "center", padding: "20px 12px" }}>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "10px" }}>Nenhum resultado para "{libSearch}"</div>
                            <button className="btn" onClick={() => openScanner("label")} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: "11px", fontWeight: "700", padding: "7px 14px", borderRadius: "10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Camera size={12} /> Fotografar rótulo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                <div style={{ padding: "14px 16px 12px", borderBottom: mealLogs.length ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div className="row-sb" style={{ marginBottom: mealLogs.length ? "10px" : "0" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px" }}>{meal}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: mealLogs.length ? "#f97316" : "rgba(255,255,255,0.2)" }}>
                      {mealLogs.length ? `${mealTot.kcal} kcal` : "0 kcal"}
                    </span>
                  </div>

                  {/* Macros row — sempre visível */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Carboidratos", value: mealTot.carbs, color: "#ec4899" },
                      { label: "Proteína",     value: mealTot.protein, color: "#3b82f6" },
                      { label: "Gordura",      value: mealTot.fat,    color: "#f59e0b" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "7px 10px" }}>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color }}>{parseFloat(value.toFixed(1))}<span style={{ fontSize: "10px", fontWeight: "400", color: "rgba(255,255,255,0.35)" }}>g</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Food items */}
                {mealLogs.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.foodName}</div>
                      <div className="small">{l.qty}g · P:{parseFloat((l.protein||0).toFixed(1))}g C:{parseFloat((l.carbs||0).toFixed(1))}g G:{parseFloat((l.fat||0).toFixed(1))}g</div>
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
      {activeSubTab === "foods" && (
        <div>
          {/* Inner tabs */}
          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.045)", padding: "4px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "14px" }}>
            {[{ id: "meus", label: "Meus Alimentos" }, { id: "biblioteca", label: "Biblioteca" }].map((t) => (
              <button key={t.id} onClick={() => setFoodsTab(t.id)} style={{ flex: 1, padding: "9px 0", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", background: foodsTab === t.id ? "#f97316" : "transparent", color: foodsTab === t.id ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: foodsTab === t.id ? "0 2px 12px rgba(249,115,22,0.32)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Picked food confirm panel */}
          {pickedFood && (
            <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "16px", padding: "14px", marginBottom: "14px" }}>
              <div className="row-sb" style={{ marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "14px" }}>{pickedFood.name}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }} onClick={() => setPickedFood(null)}><X size={16} /></button>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ color: "#f97316" }}><Flame size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {pickedFood.kcal} kcal</span>
                <span>C:{pickedFood.carbs}g</span><span>P:{pickedFood.protein}g</span><span>G:{pickedFood.fat}g</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>/{pickedFood.unit}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div>
                  <div className="label">Quantidade</div>
                  <input type="number" value={pickedQty} onChange={(e) => setPickedQty(e.target.value)} placeholder="gramas" />
                </div>
                <div>
                  <div className="label">Refeição</div>
                  <select value={pickedMeal} onChange={(e) => setPickedMeal(e.target.value)}>
                    {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleAddPicked}>
                Adicionar ao {pickedMeal}
              </button>
            </div>
          )}

          {/* ── MEUS ALIMENTOS ── */}
          {foodsTab === "meus" && (
            <div>
              {/* Recently used (from logs) */}
              {(() => {
                const usedNames = [...new Set(state.foodLogs.map(l => l.foodName))];
                const recentFoods = usedNames.map(name => allFoods().find(f => f.name === name)).filter(Boolean);
                return recentFoods.length > 0 ? (
                  <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                      <History size={14} style={{ color: "#f97316" }} />
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Usados recentemente</span>
                    </div>
                    {recentFoods.map((f) => (
                      <div key={f.id} onClick={() => { setPickedFood(f); setPickedQty("100"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                            C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", flexShrink: 0, marginLeft: "8px" }}>{f.kcal} kcal</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* All foods (default + custom) */}
              <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  Todos os Alimentos ({allFoods().length})
                </div>
                {allFoods().map((f) => (
                  <div key={f.id} onClick={() => { setPickedFood(f); setPickedQty("100"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                        {f.name}
                        {f.scanned && <Camera size={11} style={{ color: "#10b981", flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                        C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", flexShrink: 0 }}>{f.kcal} kcal</span>
                  </div>
                ))}
              </div>

              {/* Add custom food form */}
              <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "10px" }}>
                <button onClick={() => setShowAddForm((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Plus size={16} /> Cadastrar Alimento Manual</span>
                  {showAddForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAddForm && (
                  <div style={{ padding: "0 16px 16px" }}>
                    {[
                      { label: "Nome", val: cfName, set: setCfName, type: "text", placeholder: "Ex: Pasta de Amendoim" },
                      { label: "Calorias (por 100g)", val: cfKcal, set: setCfKcal, type: "number", placeholder: "Ex: 588" },
                      { label: "Proteína (g)", val: cfProtein, set: setCfProtein, type: "number", placeholder: "Ex: 24" },
                      { label: "Carboidrato (g)", val: cfCarbs, set: setCfCarbs, type: "number", placeholder: "Ex: 20" },
                      { label: "Gordura (g)", val: cfFat, set: setCfFat, type: "number", placeholder: "Ex: 49" },
                    ].map((s, i) => (
                      <div style={{ marginBottom: "10px" }} key={i}>
                        <div className="label">{s.label}</div>
                        <input type={s.type} value={s.val} onChange={(e) => s.set(e.target.value)} placeholder={s.placeholder} />
                      </div>
                    ))}
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} onClick={() => { handleSaveCustom(); setShowAddForm(false); }}>
                      Salvar Alimento
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BIBLIOTECA ── */}
          {foodsTab === "biblioteca" && (
            <div>
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={16} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar na base de dados..."
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  style={{ paddingLeft: "38px" }}
                />
              </div>

              {isLibSearching && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                  <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Buscando na biblioteca...
                </div>
              )}

              {!libSearch && !isLibSearching && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>
                  <Cloud size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
                  Digite o nome de um alimento para buscar na base de dados externa
                </div>
              )}

              {libFoods.length > 0 && (
                <div className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Cloud size={11} style={{ color: "#f97316" }} /> {libFoods.length} resultados encontrados
                  </div>
                  {libFoods.map((f) => (
                    <div key={f.id} onClick={() => { setPickedFood(f); setPickedQty("100"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                          C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}
                        </div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", flexShrink: 0 }}>{f.kcal} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              {libSearch && !isLibSearching && libFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>
                    Nenhum resultado para "{libSearch}"
                  </div>
                  <button className="btn" onClick={() => openScanner("label")} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: "12px", fontWeight: "700", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Camera size={14} /> Fotografar rótulo nutricional
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
