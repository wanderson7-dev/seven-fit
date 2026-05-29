# 📱 Seven Fit — CuttingOS
### Documentação Completa do Projeto

---

## 🎯 Objetivo do App

Aplicativo de acompanhamento de **cutting** personalizado, desenvolvido do zero ao longo de uma conversa com base em dados reais do usuário (87kg, 1,76m, 23 anos, 6x/semana de treino + Jiu-Jitsu).

O app centraliza **dieta, treino e progresso** em um único lugar, seguindo a metodologia científica de déficit calórico semanal — não diário.

---

## 🧮 Lógica de Cutting (base científica)

### 1. Cálculo do TDEE
Usando a fórmula de **Mifflin-St Jeor**:

```
TMB = 10 × 87 + 6,25 × 176 − 5 × 23 + 5 = 1.972 kcal
Fator de atividade (6x/semana) = 1,725
TDEE = 1.972 × 1,725 = ~3.402 kcal/dia
```

### 2. Déficit Ideal
Baseado na regra de **0,5% a 1% do peso corporal por semana**:
- Alvo: **600g/semana** (meio-termo seguro)
- Cada kg de gordura = 7.700 kcal
- Déficit semanal necessário: `7.700 × 0,6 = 4.620 kcal/semana`

### 3. Calorias Semanais
```
Gasto semanal (6 dias controlados): 3.402 × 6 = 20.412 kcal
Meta semanal: 20.412 − 4.620 = 15.792 kcal
Média diária: ~2.630 kcal
```

> **Domingo = dia livre (não contabilizado)**
> A visão é semanal, não diária — conforme metodologia do vídeo de referência.

### 4. Ciclagem de Carboidrato
- **Dias pesados** (Legs/Lower): 2.800 kcal · 330g carbo
- **Dias normais** (Push/Pull/Upper/Jiu): 2.600 kcal · 290g carbo
- **Domingo**: livre

### 5. Proteína
- Alvo: **1,8g × 87kg = ~157g/dia**
- Abaixo de 2,2g/kg (mais viável) mas acima de 1,6g/kg (mínimo para preservar músculo em déficit)

---

## 🍽️ Plano Alimentar

### Horários definidos pelo usuário:
| Refeição | Horário | Alimentos base | kcal |
|----------|---------|---------------|------|
| Café da Manhã | 09:00 | 4 ovos, 2 fatias pão integral, 1 banana, 150g iogurte grego desnatado | 620 |
| Pré-Treino | 12:00 | 30g Whey, 1 fruta | 200 |
| Almoço/Pós-Treino | 17:30 | 200g frango, 250g arroz, salada | 780 |
| Jantar | 20:30 | 180g frango, 150g batata doce, 1 ovo + azeite | 620 |

**Principais substituições decididas:**
- Tilápia → **Frango** (mais prático, fonte proteica principal)
- 2 claras extras → **150g iogurte grego desnatado** (evita desperdício)
- Patinho/coxão mole mantido como variação opcional

---

## 💪 Divisão de Treino

| Dia | Treino | Calorias | Grupo |
|-----|--------|----------|-------|
| Seg | Push | 2.600 | Push |
| Ter | Pull | 2.600 | Pull |
| Qua | Legs 🦵 | 2.800 | Legs |
| Qui | Jiu-Jitsu 🥋 | 2.600 | Upper |
| Sex | Upper | 2.600 | Upper |
| Sab | Lower 🦵 | 2.800 | Lower |
| Dom | Descanso 🍕 | Livre | — |

> **Nota:** Jiu-Jitsu foi definido como dia de carbo moderado (não alto), pois não é estímulo de hipertrofia — é aeróbico/resistência.

---

## 📐 Estimativa de BF e Timeline

- **BF inicial estimado:** ~18-20% (avaliação visual por fotos)
- **Meta:** 10-12% BF
- **Gordura a perder:** ~7-9kg
- **Tempo estimado:** 12 a 15 semanas (3 a 4 meses)
- **Ponto fraco atual:** região abdominal/flancos (love handle) — coberto por gordura, não estrutural

---

## 🏗️ Arquitetura do App

### Stack
- **HTML5 puro** + CSS + JavaScript vanilla
- Sem frameworks, sem compilador — roda direto no browser
- **localStorage** para persistência de dados entre sessões
- **Vercel** para hospedagem estática

### Por que HTML puro?
Versões anteriores foram feitas em React (JSX), mas resultavam em tela branca por erros de compilação no ambiente do artifact. A versão HTML pura elimina essa dependência e garante funcionamento em qualquer browser.

---

## 📁 Estrutura do Projeto

```
seven-fit/
├── public/
│   └── index.html      ← App completo (HTML + CSS + JS em um arquivo)
├── vercel.json         ← Configuração de deploy estático
├── package.json        ← Metadados do projeto
└── README.md           ← Descrição geral
```

---

## 🗂️ Módulos do App

### 📊 Dashboard
- Anéis de progresso (kcal, proteína, carbo, gordura) com SVG puro
- Cards: peso atual, BF estimado, semanas de cutting, status do treino
- Barra de progresso BF (19% → 12%)
- Registro de peso diário
- Gráfico de barras de calorias dos últimos 7 dias

**Lógica de BF estimado:**
```javascript
bfNow = PROFILE.current_bf - (kgPerdidos * 0.15)
```
Estimativa simples: cada kg perdido reduz ~0,15% de BF.

---

### 🍽️ Dieta

#### Aba: Registrar
- Busca de alimentos por nome (banco local com 10 alimentos base)
- Seleção + quantidade em gramas → cálculo automático de macros proporcional
- Lista do dia com total consumido
- Remoção individual de itens

#### Aba: Plano
- Exibe o plano alimentar do dia (normal ou pesado) com horários e kcal

#### Aba: Histórico
- Dropdown com todas as datas com registros
- Exibe macros e alimentos de qualquer dia anterior

#### Aba: + Alimento
- Cadastro manual de alimentos personalizados
- Listagem dos alimentos já cadastrados

#### Scanner 📷 (modal com duas abas):

**🔢 Código de Barras:**
- Input manual do código EAN
- Busca na API Open Food Facts via proxy CORS (allorigins.win)
- Extrai: nome, kcal, proteína, carbo, gordura por 100g
- Adiciona automaticamente aos alimentos personalizados

**📋 Tabela Nutricional (IA):**
- Upload de foto da câmera ou galeria
- Preview da imagem capturada
- Envio para Claude Vision (API Anthropic) via `claude-sonnet-4-20250514`
- Prompt de extração retorna JSON com macros por 100g
- Funciona com qualquer rótulo/embalagem fotografado
- Alimento adicionado automaticamente com flag `aiRead: true`

---

### 💪 Treino

#### Aba: Sessão

**Fluxo de registro:**
1. Clica em "+ Adicionar Exercício"
2. Picker lista exercícios do grupo do dia (Push/Pull/Legs/Upper/Lower)
3. Verde ✓ indica exercícios com histórico registrado
4. Seleciona exercício → card de registro abre
5. Hint automático: mostra carga máxima da última sessão no mesmo exercício
6. Escolhe tipo de série:
   - 🔥 **Aquecimento** — não conta no volume
   - ✅ **Válida** — conta no volume total
7. Registra peso (kg) + repetições
8. Volume válido calculado em tempo real
9. "Concluir Exercício" → adiciona à sessão, abre próximo
10. "Salvar Treino Completo" → persiste no histórico com volume total

**Funcionalidades extras:**
- ↔ Trocar exercício já adicionado na sessão (sem perder as séries)
- 📊 Ver histórico de sessões anteriores do exercício (últimas 6)
- Adicionar exercício personalizado direto no picker (salva permanentemente no grupo)
- Campo de observações por sessão
- Remoção de séries individuais antes de concluir

#### Aba: Histórico
- Dropdown por data
- Exibe treino completo: exercícios, séries (aquecimento/válida), volume, observações

---

### 📸 Progresso

#### Aba: Peso
- Grid de stats: kg perdido, BF atual estimado, semanas restantes, total de treinos
- Gráfico de barras dos últimos 14 registros de peso
- Visualização da jornada de BF (início → atual → meta) com barra de progresso
- Tabela completa de todos os registros de peso

#### Aba: Fotos
- Upload de fotos por ângulo: **Frente, Lado, Costas**
- Nome da semana + data customizáveis
- Histórico de todas as semanas com visualização expandível
- Fotos salvas em base64 no localStorage

#### Aba: Stats
- Totalizadores: dias de dieta, treinos, registros de peso, semanas com foto
- Calorias totais consumidas
- Volume total levantado (kg)
- Metas do cutting (tabela de referência)

---

### ⚙️ Config
- Editar qualquer dia da semana:
  - Nome do treino
  - Grupo de exercícios (Push/Pull/Legs/Upper/Lower)
  - Tipo calórico (Normal/Pesado/Livre)
  - Cor do dia (8 opções)
- Permite mudar a divisão de treino sem perder dados históricos

---

## 💾 Persistência de Dados

Todos os dados salvos no `localStorage` com prefixo `co_`:

| Chave | Conteúdo |
|-------|----------|
| `co_foodLogs` | Array de registros alimentares por data |
| `co_workoutLogs` | Array de treinos com exercícios e séries |
| `co_weightLogs` | Array de registros de peso diário |
| `co_customFoods` | Alimentos cadastrados manualmente ou via scanner |
| `co_customExercises` | Exercícios adicionados por grupo |
| `co_schedule` | Configuração da semana de treino |
| `co_progressPhotos` | Fotos de progresso em base64 |

---

## 🚀 Deploy

- **Repositório:** [github.com/wanderson7-dev/seven-fit](https://github.com/wanderson7-dev/seven-fit)
- **Hospedagem:** Vercel (site estático)
- **Configuração:** `vercel.json` com `@vercel/static` builder

Para atualizar o app após mudanças:
```bash
cd seven-fit
git add -A
git commit -m "descrição da mudança"
git push origin main
# Vercel faz redeploy automático
```

---

## 📊 Dados do Usuário (base do app)

| Parâmetro | Valor |
|-----------|-------|
| Peso | 87 kg |
| Altura | 1,76 m |
| Idade | 23 anos |
| TDEE | ~3.402 kcal/dia |
| BF inicial | ~19% |
| Meta BF | 12% |
| Déficit semanal | 4.620 kcal |
| Meta de perda | 600g/semana |
| Proteína diária | 157g (1,8g/kg) |
| Dias normais | 2.600 kcal |
| Dias pesados | 2.800 kcal |
| Domingo | Livre |

---

*Documentação gerada em 28/05/2025 — Seven Fit CuttingOS v1.0*
