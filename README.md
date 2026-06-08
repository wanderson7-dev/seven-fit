# Seven Fit — CuttingOS (Next.js Edition)

App de acompanhamento de cutting personalizado, agora transformado em uma aplicação robusta de produção usando **Node.js** e **React** com o framework **Next.js (App Router)**.

---

## ✨ Funcionalidades Supercarregadas

- **Dashboard com Macros e Gráficos**: Progresso diário de calorias, proteína, carboidrato e gordura, histórico de 7 dias e registro simplificado de peso.
- **Busca de Alimentos Híbrida em Tempo Real**: A barra de pesquisa na aba de dieta faz uma busca simultânea local e na nuvem usando a base brasileira do **Open Food Facts** para retornar milhares de produtos reais de supermercado em 1 clique.
- **Leitor de Código de Barras com Fallback Inteligente (IA)**:
  * Busca e extrai macros de alimentos usando códigos de barras (EAN/UPC).
  * Se o produto for brasileiro e estiver com macros incompletos ou zerados na base pública, o backend **Node.js consulta o Claude 3.5 Sonnet automaticamente** para resgatar os macros estimados com alta fidelidade!
- **Leitor de Tabela Nutricional por Imagem via IA (Claude Vision)**: Envie uma foto ou arquivo da tabela nutricional e o Claude Vision extrairá os macros por 100g instantaneamente de forma segura no backend.
- **Registro de Treino Avançado**: Controle de séries aquecimento vs. válidas, cálculo automático de volume total levantado, notas e histórico de cargas de cada exercício.
- **Acompanhamento de Progresso**: Linha do tempo de peso, fotos semanais (frente/lado/costas) e estatísticas vitais acumuladas da sua jornada.
- **Personalização de Cronograma**: Planejador semanal de treinos, metas de macros separadas para dias normais vs. dias pesados e seletor de cores de status.

---

## 🏗️ Arquitetura do Projeto

O código agora está totalmente modularizado, limpo e em conformidade com as melhores práticas de React moderno:

```text
├── app/
│   ├── api/
│   │   ├── analyze-label/route.js   # API Node.js para leitura de tabelas com Claude Vision
│   │   ├── barcode/route.js         # API Node.js para buscar EAN (OFF + Fallback IA)
│   │   └── food-search/route.js     # API Node.js para busca de produtos por texto (OFF Brasil)
│   ├── globals.css                  # Folha de estilo central com variáveis e tema Dark Premium
│   ├── layout.js                    # Layout raiz do Next.js com SEO e internacionalização pt-BR
│   └── page.js                      # Controlador de estado global reativo (LocalStorage)
├── components/
│   ├── Dashboard.jsx                # Componente da página principal e gráficos de macros
│   ├── DietTab.jsx                  # Painel de controle de dieta e busca híbrida
│   ├── EditDayModal.jsx             # Modal bottom-sheet para planejar dias de treino
│   ├── Header.jsx                   # Top bar com data em português e status
│   ├── HistoryModal.jsx             # Modal de histórico detalhado de cargas de um exercício
│   ├── ProgressTab.jsx              # Painel de evolução física (peso, fotos e histórico)
│   ├── ScannerModal.jsx             # Modal do leitor de códigos e fotos de tabelas
│   ├── SettingsTab.jsx              # Painel de configurações semanais e metas
│   └── TabBar.jsx                   # Barra de navegação inferior fluida
```

---

## 🚀 Como Rodar Localmente

### 1. Requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em seu sistema (v18 ou superior).

### 2. Clonar e Instalar dependências
```bash
git clone https://github.com/wanderson7-dev/seven-fit.git
cd seven-fit
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto e insira a sua chave de API da Anthropic para liberar as funcionalidades do leitor de tabelas por foto e o fallback de códigos de barras:
```env
ANTHROPIC_API_KEY=sua_chave_de_api_do_claude_aqui
```

### 4. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Abra **[http://localhost:3000](http://localhost:3000)** no seu navegador e aproveite!

---

## 📦 Deploy na Vercel

O projeto está totalmente otimizado e configurado para deploy com zero esforço na Vercel:
1. Conecte seu repositório GitHub à Vercel.
2. Nas configurações do projeto, adicione `ANTHROPIC_API_KEY` na seção de **Environment Variables** (Variáveis de Ambiente).
3. A Vercel detectará automaticamente que é um projeto Next.js e fará o build e deploy instantâneo!
