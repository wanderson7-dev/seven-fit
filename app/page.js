"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import Dashboard from "@/components/Dashboard";
import DietTab from "@/components/DietTab";
import WorkoutTab from "@/components/WorkoutTab";
import ProgressTab from "@/components/ProgressTab";
import SettingsTab from "@/components/SettingsTab";

// Modals
import { supabase } from "@/lib/supabase";
import * as db from "@/lib/db";
import ScannerModal from "@/components/ScannerModal";
import EditDayModal from "@/components/EditDayModal";
import HistoryModal from "@/components/HistoryModal";
import ExerciseGuideModal from "@/components/ExerciseGuideModal";

// ── SYSTEM CONSTANTS ─────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  weight: 87,
  height: 176,
  age: 23,
  current_bf: 19,
  goal_bf: 12,
  activityFactor: 1.725,
  gender: "male",
  proteinFactor: 1.8
};
const DEFAULT_MEAL_PLAN = {
  normal: [
    { time: "09:00", name: "Café da Manhã", foods: ["4 ovos inteiros", "2 fatias pão integral", "1 banana", "150g iogurte grego desnatado"], kcal: 620 },
    { time: "12:00", name: "Pré-Treino", foods: ["30g Whey", "1 fruta"], kcal: 200 },
    { time: "17:30", name: "Almoço / Pós-Treino", foods: ["200g frango grelhado", "250g arroz branco", "Salada à vontade"], kcal: 780 },
    { time: "20:30", name: "Jantar", foods: ["180g frango grelhado", "150g batata doce", "1 ovo + fio de azeite"], kcal: 620 }
  ],
  heavy: [
    { time: "09:00", name: "Café da Manhã", foods: ["4 ovos inteiros", "3 fatias pão integral", "1 banana", "150g iogurte grego desnatado"], kcal: 700 },
    { time: "12:00", name: "Pré-Treino", foods: ["30g Whey", "1 banana", "1 maçã"], kcal: 260 },
    { time: "17:30", name: "Almoço / Pós-Treino", foods: ["200g frango grelhado", "300g arroz branco", "Salada à vontade"], kcal: 880 },
    { time: "20:30", name: "Jantar", foods: ["180g frango grelhado", "200g batata doce", "1 ovo + fio de azeite"], kcal: 700 }
  ]
};
const DEFAULT_EXERCISES = {
  Push: ["Supino Reto", "Supino Inclinado", "Crucifixo", "Desenvolvimento", "Elevação Lateral", "Tríceps Corda", "Tríceps Testa", "Tríceps Francês"],
  Pull: ["Puxada Frente", "Puxada Neutra", "Remada Curvada", "Remada Unilateral", "Rosca Direta", "Rosca Martelo", "Face Pull", "Pullover"],
  Legs: ["Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Stiff", "Avanço", "Panturrilha em Pé", "Panturrilha Sentado"],
  Upper: ["Supino Reto", "Desenvolvimento", "Elevação Lateral", "Puxada Frente", "Remada Curvada", "Rosca Direta", "Tríceps Corda"],
  Lower: ["Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Stiff", "Panturrilha em Pé"]
};
const DEFAULT_SCHEDULE = [
  { day: "Seg", type: "Push", color: "#f97316", calType: "normal", group: "Push" },
  { day: "Ter", type: "Pull", color: "#3b82f6", calType: "normal", group: "Pull" },
  { day: "Qua", type: "Legs 🦵", color: "#8b5cf6", calType: "heavy", group: "Legs" },
  { day: "Qui", type: "Jiu-Jitsu 🥋", color: "#10b981", calType: "normal", group: "Upper" },
  { day: "Sex", type: "Upper", color: "#f59e0b", calType: "normal", group: "Upper" },
  { day: "Sab", type: "Lower 🦵", color: "#ec4899", calType: "heavy", group: "Lower" },
  { day: "Dom", type: "Descanso 🍕", color: "#6b7280", calType: "free", group: null }
];
const DEFAULT_FOODS = [
  { id: "f1", name: "Frango Grelhado", kcal: 165, protein: 31, carbs: 0, fat: 3.6, unit: "100g" },
  { id: "f2", name: "Arroz Branco Cozido", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "100g" },
  { id: "f3", name: "Batata Doce Cozida", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "100g" },
  { id: "f4", name: "Ovo Inteiro", kcal: 155, protein: 13, carbs: 1.1, fat: 11, unit: "100g" },
  { id: "f5", name: "Whey Protein", kcal: 120, protein: 24, carbs: 3, fat: 2, unit: "30g" },
  { id: "f6", name: "Iogurte Grego Desnatado", kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "100g" },
  { id: "f7", name: "Pão Integral", kcal: 247, protein: 9, carbs: 41, fat: 3.4, unit: "100g" },
  { id: "f8", name: "Banana", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "100g" },
  { id: "f9", name: "Patinho / Coxão Mole", kcal: 158, protein: 28, carbs: 0, fat: 5, unit: "100g" },
  { id: "f10", name: "Azeite de Oliva", kcal: 884, protein: 0, carbs: 0, fat: 100, unit: "100ml" }
];
const COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6b7280", "#ef4444"];
const SET_TYPES = [
  { id: "aquecimento", label: "Aquecimento", emoji: "🔥", color: "#f59e0b" },
  { id: "valida", label: "Válida", emoji: "✅", color: "#10b981" }
];

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Global State (matching DB representation)
  const [state, setState] = useState({
    foodLogs: [],
    workoutLogs: [],
    weightLogs: [],
    customFoods: [],
    customExercises: {},
    schedule: DEFAULT_SCHEDULE,
    progressPhotos: [],
    // Session state
    selectedFood: null,
    profile: DEFAULT_PROFILE,
    mealPlan: DEFAULT_MEAL_PLAN,
  });

  // Modal control states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialTab, setScannerInitialTab] = useState("barcode");
  const [isEditDayOpen, setIsEditDayOpen] = useState(false);
  const [editDayIndex, setEditDayIndex] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyExName, setHistoryExName] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideExName, setGuideExName] = useState("");
  // ── HYDRATION & LOADING STATE ──────────────────────────────────────────────
  const loadLocalState = () => {
    try {
      const foodLogs = localStorage.getItem("co_foodLogs");
      const workoutLogs = localStorage.getItem("co_workoutLogs");
      const weightLogs = localStorage.getItem("co_weightLogs");
      const customFoods = localStorage.getItem("co_customFoods");
      const customExercises = localStorage.getItem("co_customExercises");
      const schedule = localStorage.getItem("co_schedule");
      const progressPhotos = localStorage.getItem("co_progressPhotos");
      const profile = localStorage.getItem("co_profile");
      const mealPlan = localStorage.getItem("co_mealPlan");

      const parsedSchedule = schedule ? JSON.parse(schedule) : null;
      const parsedProfile = profile ? JSON.parse(profile) : null;
      const parsedMealPlan = mealPlan ? JSON.parse(mealPlan) : null;

      return {
        foodLogs: foodLogs ? JSON.parse(foodLogs) : [],
        workoutLogs: workoutLogs ? JSON.parse(workoutLogs) : [],
        weightLogs: weightLogs ? JSON.parse(weightLogs) : [],
        customFoods: customFoods ? JSON.parse(customFoods) : [],
        customExercises: customExercises ? JSON.parse(customExercises) : {},
        schedule: (parsedSchedule && parsedSchedule.length === 7) ? parsedSchedule : DEFAULT_SCHEDULE,
        progressPhotos: progressPhotos ? JSON.parse(progressPhotos) : [],
        selectedFood: null,
        profile: parsedProfile ? parsedProfile : DEFAULT_PROFILE,
        mealPlan: parsedMealPlan ? parsedMealPlan : DEFAULT_MEAL_PLAN,
      };
    } catch (error) {
      console.error("Error loading localStorage state:", error);
      return null;
    }
  };

  const cacheToLocal = (data) => {
    try {
      localStorage.setItem("co_foodLogs", JSON.stringify(data.foodLogs || []));
      localStorage.setItem("co_workoutLogs", JSON.stringify(data.workoutLogs || []));
      localStorage.setItem("co_weightLogs", JSON.stringify(data.weightLogs || []));
      localStorage.setItem("co_customFoods", JSON.stringify(data.customFoods || []));
      localStorage.setItem("co_customExercises", JSON.stringify(data.customExercises || {}));
      localStorage.setItem("co_schedule", JSON.stringify(data.schedule || DEFAULT_SCHEDULE));
      localStorage.setItem("co_progressPhotos", JSON.stringify(data.progressPhotos || []));
      localStorage.setItem("co_profile", JSON.stringify(data.profile || DEFAULT_PROFILE));
      localStorage.setItem("co_mealPlan", JSON.stringify(data.mealPlan || DEFAULT_MEAL_PLAN));
    } catch (e) {
      console.error("Error writing to localStorage cache:", e);
    }
  };

  const saveState = (updatedState) => {
    setState(updatedState);
    cacheToLocal(updatedState);
  };

  const handleUserSignIn = async (currUser) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const dbData = await db.fetchUserData(currUser.id);
      if (dbData) {
        setState((prev) => {
          const newState = {
            ...prev,
            foodLogs: dbData.foodLogs || [],
            workoutLogs: dbData.workoutLogs || [],
            weightLogs: dbData.weightLogs || [],
            customFoods: dbData.customFoods || [],
            customExercises: dbData.customExercises || {},
            progressPhotos: dbData.progressPhotos || [],
            schedule: (dbData.schedule && dbData.schedule.length === 7) ? dbData.schedule : prev.schedule,
            profile: dbData.profile ? { ...prev.profile, ...dbData.profile } : prev.profile,
            mealPlan: dbData.mealPlan || prev.mealPlan,
            selectedFood: null
          };
          cacheToLocal(newState);
          return newState;
        });
      } else {
        const currentLocal = loadLocalState();
        if (currentLocal) {
          await db.migrateLocalData(currUser.id, currentLocal);
          const syncedData = await db.fetchUserData(currUser.id);
          if (syncedData) {
            setState((prev) => {
              const newState = {
                ...prev,
                ...syncedData,
                schedule: (syncedData.schedule && syncedData.schedule.length === 7) ? syncedData.schedule : prev.schedule,
                selectedFood: null
              };
              cacheToLocal(newState);
              return newState;
            });
          }
        }
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
      setSyncError(error.message || String(error));
    } finally {
      setIsHydrated(true);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          handleUserSignIn(session.user);
        } else {
          const local = loadLocalState();
          if (local) setState((prev) => ({ ...prev, ...local }));
          setIsHydrated(true);
        }
      });

      // Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setUser(session.user);
          await handleUserSignIn(session.user);
        } else {
          setUser(null);
          const local = loadLocalState();
          if (local) setState((prev) => ({ ...prev, ...local }));
          setIsHydrated(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      const local = loadLocalState();
      if (local) setState((prev) => ({ ...prev, ...local }));
      setIsHydrated(true);
    }
  }, []);

  // ── CORE UTILS & HELPERS ───────────────────────────────────────────────────
  const today = () => new Date().toISOString().slice(0, 10);
  const getDOW = () => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][new Date().getDay()];
  const fmtDate = (d) => {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return d;
    }
  };

  const todaySched = () => {
    return state.schedule.find((s) => s.day === getDOW()) || state.schedule[6];
  };

  // ── DYNAMIC METABOLIC CALCULATION UTILS ─────────────────────────────────────
  const calculateMetabolicTargets = (p) => {
    const profile = p || state.profile || DEFAULT_PROFILE;
    
    // TMB (Mifflin-St Jeor)
    let tmb = 10 * profile.weight + 6.25 * (profile.height || 176) - 5 * profile.age;
    if (profile.gender === "female") {
      tmb -= 161;
    } else {
      tmb += 5;
    }
    
    // TDEE
    const tdee = Math.round(tmb * (parseFloat(profile.activityFactor) || 1.725));
    
    // Weekly safe weight loss target (0.7% of body weight)
    const weeklyWeightLossTargetKg = profile.weight * 0.007;
    
    // 1kg of fat = 7700 kcal. Deficit needed per week:
    const weeklyDeficitNeeded = Math.round(weeklyWeightLossTargetKg * 7700);
    
    // Sunday is a free day (not counted/regulated). Total regulated energy target per week:
    // 6 controlled days = TDEE * 6 - weeklyDeficitNeeded
    // Daily average controlled target = (TDEE * 6 - weeklyDeficitNeeded) / 6
    const dailyAverageControlledTarget = tdee - Math.round(weeklyDeficitNeeded / 6);
    
    // Macros factor
    const pFactor = parseFloat(profile.proteinFactor) || 1.8;
    const proteinGrams = Math.round(pFactor * profile.weight);
    const fatGrams = Math.round(0.8 * profile.weight);
    
    // Split into normal and heavy training days
    // Normal days are average - 30 (arredondado para múltiplos de 50)
    // Heavy days are average + 170
    const kcalNormal = Math.round((dailyAverageControlledTarget - 30) / 50) * 50;
    const kcalHeavy = kcalNormal + 200;
    
    // Carbohydrates calculated by remaining calories:
    // (Kcal - Prot * 4 - Fat * 9) / 4
    const carbsNormal = Math.max(0, Math.round((kcalNormal - (proteinGrams * 4) - (fatGrams * 9)) / 4));
    const carbsHeavy = Math.max(0, Math.round((kcalHeavy - (proteinGrams * 4) - (fatGrams * 9)) / 4));
    
    return {
      tmb,
      tdee,
      weeklyWeightLossTargetKg: Math.round(weeklyWeightLossTargetKg * 1000) / 1000,
      weeklyDeficitNeeded,
      dailyAverageControlledTarget,
      proteinGrams,
      fatGrams,
      normal: {
        kcal: kcalNormal,
        protein: proteinGrams,
        carbs: carbsNormal,
        fat: fatGrams
      },
      heavy: {
        kcal: kcalHeavy,
        protein: proteinGrams,
        carbs: carbsHeavy,
        fat: fatGrams
      }
    };
  };

  const getTargets = () => {
    const s = todaySched();
    const targets = calculateMetabolicTargets(state.profile);
    return s.calType === "heavy"
      ? targets.heavy
      : s.calType === "free"
      ? { kcal: 9999, protein: 0, carbs: 0, fat: 0 }
      : targets.normal;
  };

  const todayFoodLogs = () => {
    return state.foodLogs.filter((l) => l.date === today());
  };

  const getTotals = (logs) => {
    return logs.reduce(
      (a, l) => ({
        kcal: a.kcal + l.kcal,
        protein: a.protein + (l.protein || 0),
        carbs: a.carbs + (l.carbs || 0),
        fat: a.fat + (l.fat || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const allFoods = () => {
    return [...DEFAULT_FOODS, ...state.customFoods];
  };

  const getExercises = (group) => {
    if (!group) return [];
    return [
      ...new Set([
        ...(DEFAULT_EXERCISES[group] || []),
        ...(state.customExercises[group] || []),
      ]),
    ];
  };

  // ── STATE MUTATIONS ────────────────────────────────────────────────────────
  const saveWeightLog = async (value) => {
    const localId = Date.now();
    const logObj = { id: localId, date: today(), value };
    
    const updated = {
      ...state,
      weightLogs: [...state.weightLogs, logObj],
    };
    saveState(updated);

    if (user) {
      try {
        const savedLog = await db.addWeightLog(user.id, logObj);
        if (savedLog && savedLog.id) {
          setState(prev => ({
            ...prev,
            weightLogs: prev.weightLogs.map(w => w.id === localId ? { ...w, id: savedLog.id } : w)
          }));
        }
      } catch (err) {
        console.error("Failed to save weight log to cloud:", err);
      }
    }
  };

  const saveCustomFood = async (foodSpec) => {
    const localId = "c" + Date.now();
    const newFood = {
      id: localId,
      name: foodSpec.name,
      kcal: foodSpec.kcal,
      protein: foodSpec.protein,
      carbs: foodSpec.carbs,
      fat: foodSpec.fat,
      unit: "100g",
    };
    
    const updated = {
      ...state,
      customFoods: [...state.customFoods, newFood],
    };
    saveState(updated);

    if (user) {
      try {
        const savedFood = await db.addCustomFood(user.id, newFood);
        if (savedFood && savedFood.id) {
          setState(prev => ({
            ...prev,
            customFoods: prev.customFoods.map(f => f.id === localId ? { ...f, id: savedFood.id } : f)
          }));
        }
      } catch (err) {
        console.error("Failed to save custom food to cloud:", err);
      }
    }
  };

  const addFoodLog = async (food, qty) => {
    const ratio = qty / 100;
    const localId = Date.now();
    const newLog = {
      id: localId,
      date: today(),
      foodName: food.name,
      qty,
      kcal: Math.round(food.kcal * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };
    
    const updated = {
      ...state,
      foodLogs: [...state.foodLogs, newLog],
      selectedFood: null,
    };
    saveState(updated);

    if (user) {
      try {
        const savedLog = await db.addFoodLog(user.id, newLog);
        if (savedLog && savedLog.id) {
          setState(prev => ({
            ...prev,
            foodLogs: prev.foodLogs.map(l => l.id === localId ? {
              ...l,
              id: savedLog.id,
              foodName: savedLog.food_name,
              qty: Number(savedLog.qty),
              kcal: Number(savedLog.kcal),
              protein: Number(savedLog.protein),
              carbs: Number(savedLog.carbs),
              fat: Number(savedLog.fat)
            } : l)
          }));
        }
      } catch (err) {
        console.error("Failed to add food log to cloud:", err);
      }
    }
  };

  const removeFoodLog = async (id) => {
    const updated = {
      ...state,
      foodLogs: state.foodLogs.filter((l) => l.id !== id),
    };
    saveState(updated);

    if (user) {
      try {
        await db.deleteFoodLog(user.id, id);
      } catch (err) {
        console.error("Failed to delete food log from cloud:", err);
      }
    }
  };

  const saveSessionWorkout = async (workoutSpec) => {
    const localId = Date.now();
    const newWorkout = {
      id: localId,
      date: today(),
      type: workoutSpec.type,
      exercises: workoutSpec.exercises,
      notes: workoutSpec.notes,
      volume: workoutSpec.volume,
    };
    
    const updated = {
      ...state,
      workoutLogs: [...state.workoutLogs, newWorkout],
    };
    saveState(updated);

    if (user) {
      try {
        const savedWorkout = await db.addWorkoutLog(user.id, newWorkout);
        if (savedWorkout && savedWorkout.id) {
          setState(prev => ({
            ...prev,
            workoutLogs: prev.workoutLogs.map(w => w.id === localId ? {
              ...w,
              id: savedWorkout.id,
              date: savedWorkout.date,
              type: savedWorkout.type,
              exercises: savedWorkout.exercises,
              notes: savedWorkout.notes,
              volume: Number(savedWorkout.volume)
            } : w)
          }));
        }
      } catch (err) {
        console.error("Failed to save workout to cloud:", err);
      }
    }
  };

  const removeWorkoutLog = async (id) => {
    const updated = {
      ...state,
      workoutLogs: state.workoutLogs.filter((w) => w.id !== id),
    };
    saveState(updated);

    if (user) {
      try {
        await db.deleteWorkoutLog(user.id, id);
      } catch (err) {
        console.error("Failed to delete workout from cloud:", err);
      }
    }
  };

  const saveProgressPhotos = async (photosSpec) => {
    const localId = Date.now();
    const localRecord = {
      id: localId,
      date: photosSpec.date,
      week: photosSpec.week,
      images: photosSpec.images,
    };
    
    const updated = {
      ...state,
      progressPhotos: [...state.progressPhotos, localRecord],
    };
    saveState(updated);

    if (user) {
      try {
        setIsSyncing(true);
        const uploadedImages = {};
        for (const [angle, base64] of Object.entries(photosSpec.images || {})) {
          if (base64) {
            const url = await db.uploadBase64Photo(user.id, base64, `${photosSpec.week}-${angle}.jpg`);
            uploadedImages[angle] = url;
          } else {
            uploadedImages[angle] = null;
          }
        }
        const photoRecord = {
          date: photosSpec.date,
          week: photosSpec.week,
          images: uploadedImages
        };
        const savedPhoto = await db.addProgressPhoto(user.id, photoRecord);
        if (savedPhoto && savedPhoto.id) {
          setState(prev => ({
            ...prev,
            progressPhotos: prev.progressPhotos.map(p => p.id === localId ? {
              ...p,
              id: savedPhoto.id,
              images: savedPhoto.image_urls
            } : p)
          }));
        }
      } catch (err) {
        console.error("Failed to upload/save progress photos to cloud:", err);
        setSyncError(`Fotos de progresso: ${err.message || String(err)}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const saveDayEdit = async (dayIndex, updatedDayObj) => {
    const updatedSched = [...state.schedule];
    updatedSched[dayIndex] = updatedDayObj;
    
    const updated = {
      ...state,
      schedule: updatedSched,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveSchedule(user.id, updatedSched);
      } catch (err) {
        console.error("Failed to save schedule to cloud:", err);
      }
    }
  };

  const saveProfile = async (updatedProfile) => {
    const updated = {
      ...state,
      profile: updatedProfile,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveProfile(user.id, updatedProfile, state.mealPlan);
      } catch (err) {
        console.error("Failed to save profile to cloud:", err);
      }
    }
  };

  const saveMealPlan = async (newMealPlan) => {
    const updated = {
      ...state,
      mealPlan: newMealPlan,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveProfile(user.id, state.profile, newMealPlan);
      } catch (err) {
        console.error("Failed to save meal plan to cloud:", err);
      }
    }
  };

  const onFoodScanned = async (scannedFood) => {
    const alreadyExists = state.customFoods.some((f) => f.id === scannedFood.id);
    const updatedCustomFoods = alreadyExists
      ? state.customFoods
      : [...state.customFoods, scannedFood];

    const updated = {
      ...state,
      customFoods: updatedCustomFoods,
      selectedFood: scannedFood,
    };
    saveState(updated);

    if (!alreadyExists && user) {
      try {
        await db.addCustomFood(user.id, scannedFood);
      } catch (err) {
        console.error("Failed to save scanned food to cloud:", err);
      }
    }
  };

  const clearSelectedFood = () => {
    setState((prev) => ({
      ...prev,
      selectedFood: null,
    }));
  };

  const openScanner = (tab = "barcode") => {
    setScannerInitialTab(tab);
    setIsScannerOpen(true);
  };

  const saveCustomExercise = async (group, name) => {
    if (!group || !name) return;
    
    const updatedCustomExs = { ...state.customExercises };
    if (!updatedCustomExs[group]) {
      updatedCustomExs[group] = [];
    }
    if (!updatedCustomExs[group].includes(name)) {
      updatedCustomExs[group].push(name);
    }
    const updated = {
      ...state,
      customExercises: updatedCustomExs,
    };
    saveState(updated);

    if (user) {
      try {
        await db.addCustomExercise(user.id, group, name);
      } catch (err) {
        console.error("Failed to save custom exercise to cloud:", err);
      }
    }
  };

  // ── MODAL HELPERS ──────────────────────────────────────────────────────────
  const openEditDayModal = (index) => {
    setEditDayIndex(index);
    setIsEditDayOpen(true);
  };

  const openHistoryModal = (exName) => {
    setHistoryExName(exName);
    setIsHistoryOpen(true);
  };

  const openGuideModal = (exName) => {
    setGuideExName(exName);
    setIsGuideOpen(true);
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f", gap: "16px" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div className="syne" style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)" }}>
          CARREGANDO CUTTINGOS...
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        padding: "24px",
        color: "#fff",
        fontFamily: "var(--font-sans, sans-serif)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glowing Background Orbs */}
        <div style={{
          position: "absolute",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(0,0,0,0) 70%)",
          top: "20%",
          left: "15%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 70%)",
          bottom: "20%",
          right: "15%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />

        <div className="card" style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          padding: "40px 32px",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
        }}>
          {/* Logo */}
          <div className="syne" style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "8px" }}>
            CuttingOS <span style={{ color: "#f97316", textShadow: "0 0 12px #f97316" }}>●</span>
          </div>
          <div className="syne" style={{ fontSize: "12px", fontWeight: "800", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "24px" }}>
            Alta Performance
          </div>

          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.6", marginBottom: "32px" }}>
            Monitore seus treinos, gerencie suas metas calóricas, calcule seu déficit diário e acompanhe sua evolução física de forma segura na nuvem.
          </p>

          {!supabase ? (
            <div style={{
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "left",
              fontSize: "12.5px",
              lineHeight: "1.45",
              color: "rgba(255,255,255,0.8)"
            }}>
              <div style={{ fontWeight: "700", color: "#ef4444", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚠️ Supabase Não Configurado
              </div>
              Certifique-se de configurar as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code>.env.local</code> para habilitar o login.
            </div>
          ) : (
            <button
              className="btn-login-google"
              style={{
                width: "100%",
                background: "#fff",
                color: "#0a0a0f",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px",
                borderRadius: "16px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(255,255,255,0.15)"
              }}
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) throw error;
                } catch (err) {
                  console.error("Erro no login:", err.message);
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </button>
          )}

          <div style={{ marginTop: "32px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            Ao entrar, você concorda com o salvamento seguro dos seus dados.
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .btn-login-google:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255,255,255,0.25);
            background: #f4f4f5 !important;
          }
          .btn-login-google:active {
            transform: translateY(0);
          }
        ` }} />
      </div>
    );
  }

  const currentSched = todaySched();

  return (
    <div style={{ padding: "16px 20px 80px" }}>
      {/* GLOBAL HEADER */}
      <Header todaySched={currentSched} user={user} isSyncing={isSyncing} />

      {/* VIEWPORT AREA */}
      <div style={{ padding: "16px 0" }}>
        {(() => {
          const calculatedMetabolism = calculateMetabolicTargets(state.profile);
          const activeProfile = {
            ...state.profile,
            tdee: calculatedMetabolism.tdee,
            tmb: calculatedMetabolism.tmb,
            weeklyDeficitNeeded: calculatedMetabolism.weeklyDeficitNeeded,
            weeklyWeightLossTargetKg: calculatedMetabolism.weeklyWeightLossTargetKg,
            normal: calculatedMetabolism.normal,
            heavy: calculatedMetabolism.heavy,
          };
          return (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  state={state}
                  saveWeightLog={saveWeightLog}
                  todaySched={currentSched}
                  getTargets={getTargets}
                  todayFoodLogs={todayFoodLogs}
                  getTotals={getTotals}
                  PROFILE={activeProfile}
                />
              )}
              {activeTab === "diet" && (
                <DietTab
                  state={state}
                  saveCustomFood={saveCustomFood}
                  addFoodLog={addFoodLog}
                  removeFoodLog={removeFoodLog}
                  openScanner={(tab) => openScanner(tab)}
                  todaySched={currentSched}
                  getTargets={getTargets}
                  todayFoodLogs={todayFoodLogs}
                  getTotals={getTotals}
                  allFoods={allFoods}
                  mealPlan={state.mealPlan}
                  saveMealPlan={saveMealPlan}
                  fmtDate={fmtDate}
                  today={today}
                  clearSelectedFood={clearSelectedFood}
                />
              )}
              {activeTab === "workout" && (
                <WorkoutTab
                  state={state}
                  saveSessionWorkout={saveSessionWorkout}
                  removeWorkoutLog={removeWorkoutLog}
                  getExercises={getExercises}
                  saveCustomExercise={saveCustomExercise}
                  SET_TYPES={SET_TYPES}
                  today={today}
                  fmtDate={fmtDate}
                  openHistoryModal={openHistoryModal}
                  openGuideModal={openGuideModal}
                />
              )}
              {activeTab === "progress" && (
                <ProgressTab
                  state={state}
                  saveProgressPhotos={saveProgressPhotos}
                  PROFILE={activeProfile}
                  fmtDate={fmtDate}
                  today={today}
                  isSyncing={isSyncing}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab
                  state={state}
                  user={user}
                  supabase={supabase}
                  syncError={syncError}
                  clearSyncError={() => setSyncError(null)}
                  openEditDayModal={openEditDayModal}
                  onImportSchedule={async (importedSchedule) => {
                    if (user) {
                      try {
                        await db.saveSchedule(user.id, importedSchedule);
                      } catch (err) {
                        console.error("Failed to save imported schedule to cloud:", err);
                      }
                    }
                    const updated = {
                      ...state,
                      schedule: importedSchedule,
                    };
                    saveState(updated);
                  }}
                  saveProfile={saveProfile}
                  calculateMetabolicTargets={calculateMetabolicTargets}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* TAB BAR Bottom Navigation */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* GLOBAL MODALS */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onFoodScanned={onFoodScanned}
        allFoods={allFoods()}
        initialTab={scannerInitialTab}
      />

      <EditDayModal
        isOpen={isEditDayOpen}
        onClose={() => setIsEditDayOpen(false)}
        dayIndex={editDayIndex}
        schedule={state.schedule}
        saveDayEdit={saveDayEdit}
        COLORS={COLORS}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        exerciseName={historyExName}
        state={state}
        SET_TYPES={SET_TYPES}
      />

      <ExerciseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        exerciseName={guideExName}
      />
    </div>
  );
}
