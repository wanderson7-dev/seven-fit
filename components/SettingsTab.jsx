"use client";

import React, { useState } from "react";
import { Sparkles, Camera, FileText, User, TrendingUp, Edit, Cloud, CloudOff, LogOut } from "lucide-react";

export default function SettingsTab({
  state,
  user,
  supabase,
  openEditDayModal,
  onImportSchedule,
  saveProfile,
  calculateMetabolicTargets
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("rgba(255,255,255,0.5)");

  // User Profile Form states
  const [weight, setWeight] = useState(state.profile?.weight || "");
  const [height, setHeight] = useState(state.profile?.height || "");
  const [age, setAge] = useState(state.profile?.age || "");
  const [currentBf, setCurrentBf] = useState(state.profile?.current_bf || "");
  const [goalBf, setGoalBf] = useState(state.profile?.goal_bf || "");
  const [activityFactor, setActivityFactor] = useState(state.profile?.activityFactor || 1.725);
  const [gender, setGender] = useState(state.profile?.gender || "male");
  const [proteinFactor, setProteinFactor] = useState(state.profile?.proteinFactor || 1.8);
  const [profileSavedStatus, setProfileSavedStatus] = useState("");

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Erro no login com o Google:", err.message);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao sair da conta:", err.message);
    }
  };

  const handleSaveProfile = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const cb = parseFloat(currentBf);
    const gb = parseFloat(goalBf);
    
    if (isNaN(w) || isNaN(h) || isNaN(a) || isNaN(cb) || isNaN(gb)) {
      setProfileSavedStatus("Preencha todos os campos numéricos corretamente.");
      return;
    }
    
    saveProfile({
      weight: w,
      height: h,
      age: a,
      current_bf: cb,
      goal_bf: gb,
      activityFactor: parseFloat(activityFactor),
      gender,
      proteinFactor: parseFloat(proteinFactor)
    });
    
    setProfileSavedStatus("✓ Perfil e metas nutricionais atualizados!");
    setTimeout(() => setProfileSavedStatus(""), 3000);
  };

  // Live computed targets based on current state variables
  const liveMeta = (() => {
    try {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseInt(age);
      if (isNaN(w) || isNaN(h) || isNaN(a)) return null;
      return calculateMetabolicTargets({
        weight: w,
        height: h,
        age: a,
        gender,
        activityFactor: parseFloat(activityFactor),
        proteinFactor: parseFloat(proteinFactor)
      });
    } catch {
      return null;
    }
  })();

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setStatusColor("rgba(255,255,255,0.5)");
    setStatus("Processando arquivo com a Inteligência Artificial...");

    const reader = new FileReader();

    if (type === "image") {
      reader.onload = async (event) => {
        const base64Image = event.target.result;
        await submitBulkRequest({
          image: base64Image,
          fileType: "image",
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = async (event) => {
        const textContent = event.target.result;
        // Check if JSON file uploaded
        if (file.name.endsWith(".json")) {
          try {
            const parsed = JSON.parse(textContent);
            if (parsed.schedule && Array.isArray(parsed.schedule) && parsed.schedule.length === 7) {
              onImportSchedule(parsed.schedule);
              setStatusColor("#10b981");
              setStatus("✓ Cronograma JSON importado com sucesso localmente!");
              setIsLoading(false);
              return;
            }
          } catch (jsonErr) {
            console.error("JSON Direct Parse failed. Sending as text to AI...", jsonErr);
          }
        }
        await submitBulkRequest({
          fileContent: textContent,
          fileType: file.name.endsWith(".json") ? "json" : "text",
        });
      };
      reader.readAsText(file);
    }
  };

  const submitBulkRequest = async (payload) => {
    try {
      const response = await fetch("/api/bulk-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onImportSchedule(data.schedule);
        setStatusColor("#10b981");
        setStatus("✓ Cronograma semanal atualizado e configurado com sucesso via IA!");
      } else {
        throw new Error(data.error || "Falha ao processar cronograma.");
      }
    } catch (err) {
      setStatusColor("#ef4444");
      setStatus(err.message || "Erro ao importar. Certifique-se de configurar a ANTHROPIC_API_KEY no arquivo .env.local.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* CLOUD SYNC & AUTHENTICATION CARD */}
      {!supabase ? (
        <div className="card" style={{ background: "rgba(255, 255, 255, 0.02)", borderStyle: "dashed", borderColor: "rgba(255, 255, 255, 0.15)", marginBottom: "16px" }}>
          <div className="syne" style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "rgba(255, 255, 255, 0.6)" }}>
            <CloudOff size={16} /> Sincronização em Nuvem
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.4" }}>
            Configure as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no arquivo <code>.env.local</code> para habilitar o login com o Google e salvar seus dados na nuvem.
          </div>
        </div>
      ) : !user ? (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(255,255,255,0.01))", borderColor: "rgba(59,130,246,0.15)", marginBottom: "16px" }}>
          <div className="syne" style={{ fontSize: "15px", fontWeight: "800", color: "#3b82f6", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Cloud size={16} /> Sincronização em Nuvem
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", lineHeight: "1.45", marginBottom: "16px" }}>
            Faça login com sua conta do Google para salvar suas metas, dieta, treinos e fotos de progresso na nuvem. Seus dados existentes serão migrados automaticamente!
          </div>
          <button
            className="btn"
            style={{
              width: "100%",
              background: "#fff",
              color: "#0a0a0f",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px"
            }}
            onClick={handleGoogleSignIn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com o Google
          </button>
        </div>
      ) : (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(255,255,255,0.01))", borderColor: "rgba(16,185,129,0.15)", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #10b981" }}
              />
            ) : (
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700" }}>
                {user.email ? user.email[0].toUpperCase() : "U"}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "14px" }}>
                {user.user_metadata?.full_name || "Usuário Conectado"}
              </div>
              <div className="small" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                {user.email}
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "8px", fontWeight: "600" }}>
              <Cloud size={10} /> Nuvem Ativa
            </span>
          </div>
          <button
            className="btn btn-ghost"
            style={{
              width: "100%",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              fontSize: "12.5px"
            }}
            onClick={handleSignOut}
          >
            <LogOut size={14} /> Sair da Conta
          </button>
        </div>
      )}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(255,255,255,0.01))", borderColor: "rgba(249,115,22,0.15)" }}>
        <div className="syne" style={{ fontSize: "15px", fontWeight: "800", color: "#f97316", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Sparkles size={16} /> Importação Rápida via IA
        </div>
        <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", lineHeight: "1.45", marginBottom: "16px" }}>
          Tire foto da ficha da sua academia, envie um print de um plano feito no Bloco de Notas ou suba um arquivo (.txt/.json) contendo seus treinos e metas calóricas. A inteligência artificial configurará toda sua semana (segunda a domingo) automaticamente!
        </div>

        <div className="row" style={{ gap: "10px", marginBottom: "12px" }}>
          {/* hidden file inputs */}
          <input
            id="bulk-img-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            id="bulk-text-input"
            type="file"
            accept=".txt,.json"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e, "text")}
          />

          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: "10px 0", fontSize: "12px", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            onClick={() => document.getElementById("bulk-img-input").click()}
            disabled={isLoading}
          >
            <Camera size={14} /> Foto da Ficha
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, padding: "10px 0", fontSize: "12px", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            onClick={() => document.getElementById("bulk-text-input").click()}
            disabled={isLoading}
          >
            <FileText size={14} /> Arquivo Texto / JSON
          </button>
        </div>

        {/* LOADING & STATUS BANNERS */}
        {isLoading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <span>{status}</span>
          </div>
        )}

        {!isLoading && status && (
          <div style={{ marginTop: "8px", fontSize: "12.5px", color: statusColor, lineHeight: "1.4" }}>
            {status}
          </div>
        )}
      </div>

      {/* USER PROFILE CARD */}
      <div className="card">
        <div className="syne" style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
          <User size={16} /> Perfil do Usuário & Metas
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <div className="label">Peso Atual (kg)</div>
            <input
              type="number"
              placeholder="Ex: 87"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Altura (cm)</div>
            <input
              type="number"
              placeholder="Ex: 176"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <div className="label">Idade (anos)</div>
            <input
              type="number"
              placeholder="Ex: 23"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Gênero</div>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <div className="label">BF Atual (%)</div>
            <input
              type="number"
              placeholder="Ex: 19"
              value={currentBf}
              onChange={(e) => setCurrentBf(e.target.value)}
            />
          </div>
          <div>
            <div className="label">BF Meta (%)</div>
            <input
              type="number"
              placeholder="Ex: 12"
              value={goalBf}
              onChange={(e) => setGoalBf(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div className="label">Frequência / Nível de Atividade</div>
          <select value={activityFactor} onChange={(e) => setActivityFactor(e.target.value)}>
            <option value="1.2">Sedentário (Sem exercícios)</option>
            <option value="1.375">Levemente Ativo (Exercício 1-3x/sem)</option>
            <option value="1.55">Moderadamente Ativo (Exercício 3-5x/sem)</option>
            <option value="1.725">Muito Ativo (Exercício 6-7x/sem ou Jiu-Jitsu)</option>
            <option value="1.9">Extremamente Ativo (Atleta, 2 treinos por dia)</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div className="label">Fator de Proteína</div>
          <select value={proteinFactor} onChange={(e) => setProteinFactor(e.target.value)}>
            <option value="1.6">1,6 g/kg (Min. científico recomendável)</option>
            <option value="1.8">1,8 g/kg (Recomendado CuttingOS)</option>
            <option value="2.0">2,0 g/kg (Consumo moderadamente alto)</option>
            <option value="2.2">2,2 g/kg (Meta extrema de fisiculturista)</option>
          </select>
        </div>

        {/* Live calculated outputs preview */}
        {liveMeta && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "14px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12.5px"
            }}
          >
            <div style={{ fontWeight: "700", color: "#f97316", marginBottom: "8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp size={14} /> Metas Metabólicas Calculadas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className="row-sb">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Taxa Metabólica Basal (TMB):</span>
                <span style={{ fontWeight: "600" }}>{liveMeta.tmb} kcal</span>
              </div>
              <div className="row-sb">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Gasto Total Diário (TDEE):</span>
                <span style={{ fontWeight: "600", color: "#3b82f6" }}>{liveMeta.tdee} kcal</span>
              </div>
              <div className="row-sb">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Déficit Semanal Alvo:</span>
                <span style={{ fontWeight: "600", color: "#10b981" }}>-{liveMeta.weeklyDeficitNeeded} kcal (~{liveMeta.weeklyWeightLossTargetKg}kg/sem)</span>
              </div>
              <div className="row-sb" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px", marginTop: "4px" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Meta de Carboidrato (Normal / Pesado):</span>
                <span style={{ fontWeight: "600" }}>{liveMeta.normal.carbs}g / {liveMeta.heavy.carbs}g</span>
              </div>
              <div className="row-sb">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Meta de Proteína Diária:</span>
                <span style={{ fontWeight: "600" }}>{liveMeta.proteinGrams}g (x{proteinFactor})</span>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSaveProfile}>
          Salvar Dados do Perfil
        </button>

        {profileSavedStatus && (
          <div style={{ color: "#10b981", fontSize: "13px", marginTop: "10px", textAlign: "center", fontWeight: "600" }}>
            {profileSavedStatus}
          </div>
        )}
      </div>

      {/* WEEK SCHEDULE LIST */}
      <div className="card">
        <div className="syne" style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
          Personalizar Semana
        </div>
        {(state.schedule || []).map((day, index) => {
          const calText =
            day.calType === "free"
              ? "Livre"
              : day.calType === "heavy"
              ? "Pesado (2800 kcal)"
              : "Normal (2600 kcal)";

          return (
            <div
              key={day.day}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: index < 6 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "12px",
                    color: day.color,
                    fontWeight: "700",
                    width: "28px",
                  }}
                >
                  {day.day}
                </span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500" }}>{day.type}</div>
                  <div className="small">{calText}</div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 14px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => openEditDayModal(index)}
              >
                <Edit size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

