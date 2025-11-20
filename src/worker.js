export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (url.pathname === "/api/tac-stream" && request.method === "POST") {
      return handleTacStream(request, env);
    }

    // Default: serve dashboard UI
    return new Response(renderHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
    });
  },
};

/**
 * Proxy/OpenAI streaming endpoint
 * TAC v3 (orchestration) + TAC v2 (dashboard) egy közös rendszerként
 */
async function handleTacStream(request, env) {
  const { prompt, mode } = await request.json();

  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is missing in Worker env." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const systemPrompt = `
You are the TAC Engine inside a production-grade observability & orchestration system.

TAC v2 = "TAC v2 Engine" (analysis + dashboard):
- Produces crisp, structured analysis of system state.
- Returns: bullet-point insights, risk levels (low/medium/high), suggested actions.
- Speak in short, punchy sentences.

TAC v3 = "Autonomous Orchestration Layer":
- Thinks in steps: PLAN -> CHECK -> ACT -> REFINE.
- Simulates multiple internal agents (Planner, Operator, Critic) but responds as ONE voice.
- Focus: deciding WHAT to run next and WHY.

When answering:
- Combine TAC v2 (clear diagnostic dashboard text) + TAC v3 (orchestration reasoning).
- First section: "TAC v2 DASHBOARD" – concise status summary.
- Second section: "TAC v3 ORCHESTRATION" – next actions, priorities, and reasoning.

Be high-end, elite, calm. Always assume this is a mission-critical system.
Mode hint from client: ${mode || "default"}.
`.trim();

  const body = {
    model: "gpt-4.1-mini",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt || "" },
    ],
  };

  const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!openaiResp.ok || !openaiResp.body) {
    const text = await openaiResp.text().catch(() => "Unknown error");
    return new Response(
      JSON.stringify({ error: "OpenAI error", detail: text }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // OpenAI SSE stream átcsövezése a kliens felé (TAC v2/v3 UI fogyasztja)
  const { readable, writable } = new TransformStream();
  openaiResp.body.pipeTo(writable).catch((err) => {
    console.error("Pipe error", err);
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * High-end TAC v2 dashboard + TAC v3 orchestration UI
 * Minden egy file-on belül, hogy Cloudflare-ben csak ezt a workert kelljen felhúzni.
 */
function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TAC v3 Orchestrator + TAC v2 Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      --bg: #020617;
      --bg-alt: #020617;
      --panel: #020617;
      --accent: #6366f1;
      --accent-soft: rgba(99,102,241,0.12);
      --accent-strong: rgba(129,140,248,0.6);
      --text: #e5e7eb;
      --muted: #6b7280;
      --border: rgba(148,163,184,0.2);
      --danger: #f97373;
      --success: #22c55e;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      background: radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%);
      color: var(--text);
      display: flex;
      align-items: stretch;
      justify-content: center;
    }

    .shell {
      max-width: 1240px;
      width: 100%;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    }

    .title-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: conic-gradient(from 180deg, #6366f1, #a855f7, #22d3ee, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(129,140,248,0.65);
    }

    .logo-inner {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #020617;
      border: 2px solid rgba(226,232,240,0.8);
    }

    .title-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .title-text h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .title-text span {
      font-size: 12px;
      color: var(--muted);
    }

    .badge-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.5);
      backdrop-filter: blur(12px);
      background: linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,64,175,0.2));
    }

    .badge-accent {
      border-color: rgba(129,140,248,0.9);
      background: radial-gradient(circle at top left, rgba(129,140,248,0.4), rgba(15,23,42,0.95));
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr);
      gap: 16px;
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .card {
      background: radial-gradient(circle at top left, rgba(30,64,175,0.30), rgba(15,23,42,0.98));
      border-radius: 16px;
      border: 1px solid rgba(148,163,184,0.38);
      box-shadow:
        0 0 60px rgba(37,99,235,0.2),
        0 22px 50px rgba(15,23,42,1);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: -40%;
      background:
        radial-gradient(circle at top left, rgba(129,140,248,0.18), transparent 55%),
        radial-gradient(circle at bottom right, rgba(14,165,233,0.15), transparent 65%);
      opacity: 0.75;
      pointer-events: none;
    }

    .card-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .card-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #c7d2fe;
    }

    .pill {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.5);
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      background: linear-gradient(120deg, rgba(15,23,42,0.9), rgba(30,64,175,0.3));
    }

    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 12px rgba(34,197,94,0.9);
    }

    .pill-dot.danger {
      background: var(--danger);
      box-shadow: 0 0 12px rgba(239,68,68,0.9);
    }

    .pill-dot.idle {
      background: #fbbf24;
      box-shadow: 0 0 12px rgba(251,191,36,0.9);
    }

    .subheader {
      font-size: 11px;
      color: var(--muted);
    }

    .input-card {
      background: radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(15,23,42,0.9));
      border-radius: 14px;
      border: 1px solid rgba(148,163,184,0.45);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
    }

    textarea {
      width: 100%;
      min-height: 80px;
      resize: vertical;
      border-radius: 10px;
      border: 1px solid rgba(148,163,184,0.5);
      background: rgba(15,23,42,0.96);
      color: var(--text);
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.5;
      outline: none;
    }

    textarea:focus {
      border-color: rgba(129,140,248,0.9);
      box-shadow: 0 0 0 1px rgba(129,140,248,0.5);
    }

    .mode-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    .mode-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .mode-btn {
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.5);
      font-size: 11px;
      padding: 6px 10px;
      background: linear-gradient(120deg, rgba(15,23,42,0.9), rgba(30,64,175,0.35));
      color: var(--muted);
      cursor: pointer;
      transition: all 0.15s ease-out;
    }

    .mode-btn.active {
      border-color: rgba(129,140,248,1);
      color: #e5e7eb;
      box-shadow: 0 0 14px rgba(129,140,248,0.8);
    }

    .run-btn {
      border-radius: 999px;
      border: none;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      padding: 8px 18px;
      background: radial-gradient(circle at top left, #6366f1, #22d3ee);
      color: #020617;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow:
        0 0 26px rgba(129,140,248,0.9),
        0 0 46px rgba(45,212,191,0.7);
    }

    .run-btn:disabled {
      opacity: 0.6;
      cursor: default;
      box-shadow: none;
    }

    .run-btn span.dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #020617;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 11px;
      color: var(--muted);
    }

    .status-row span strong {
      color: #e5e7eb;
    }

    .output-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }

    .stream-box {
      border-radius: 12px;
      border: 1px solid rgba(148,163,184,0.45);
      background: radial-gradient(circle at top, rgba(15,23,42,0.92), rgba(15,23,42,0.95));
      padding: 10px;
      font-size: 12px;
      line-height: 1.6;
      max-height: 320px;
      overflow: auto;
      white-space: pre-wrap;
      position: relative;
    }

    .stream-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--muted);
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tiny-pill {
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.7);
      padding: 2px 6px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #c7d2fe;
    }

    .log-line {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      color: #b0b6c4;
      line-height: 1.5;
    }

    .log-line span.ts {
      color: #6b7280;
      margin-right: 6px;
    }

    .log-line span.tag {
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.15em;
      color: #a5b4fc;
      margin-right: 6px;
    }

    .footer {
      font-size: 10px;
      color: var(--muted);
      text-align: right;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="header">
      <div class="title-block">
        <div class="logo"><div class="logo-inner"></div></div>
        <div class="title-text">
          <h1>TAC ORCHESTRATION CONSOLE</h1>
          <span>TAC v3 (Autonomous Orchestration) · TAC v2 (Streaming Dashboard)</span>
        </div>
      </div>
      <div class="badge-row">
        <div class="badge badge-accent">OpenAI · Streaming · Cloudflare Worker</div>
        <div class="badge">Autonomous Ops · Mission-Critical</div>
      </div>
    </header>

    <main class="layout">
      <!-- Bal oldal: input + TAC v3 orchestration stream -->
      <section class="card">
        <div class="card-inner">
          <div class="card-header">
            <div>
              <div class="card-title">TAC v3 · Autonomous Orchestration</div>
              <div class="subheader">PLAN → CHECK → ACT → REFINE – orchestrator thought stream</div>
            </div>
            <div class="pill">
              <span class="pill-dot" id="orch-dot"></span>
              <span id="orch-status-label">Idle</span>
            </div>
          </div>

          <form class="input-card" id="tac-form">
            <div>
              <label for="prompt">Scenario / incident / question</label>
              <textarea id="prompt" name="prompt" placeholder="Írd le, mit figyeljen a TAC (pl. &quot;Cloudflare Worker OpenAI hiba – debug workflow&quot;, &quot;Production deploy healthcheck&quot;, stb.)"></textarea>
            </div>

            <div class="mode-row">
              <div class="mode-buttons" id="mode-buttons">
                <button type="button" class="mode-btn active" data-mode="default">Balanced</button>
                <button type="button" class="mode-btn" data-mode="aggressive">Aggressive</button>
                <button type="button" class="mode-btn" data-mode="conservative">Conservative</button>
              </div>
              <button class="run-btn" type="submit" id="run-btn">
                <span class="dot"></span>
                RUN TAC
              </button>
            </div>

            <div class="status-row">
              <span>Last run: <strong id="last-run">never</strong></span>
              <span>Model: <strong>OpenAI · gpt-4.1-mini (stream)</strong></span>
            </div>
          </form>

          <div class="output-grid">
            <div class="stream-box" id="orch-stream">
              <div class="stream-label">
                <span>Orchestration stream</span>
                <span class="tiny-pill">TAC v3 live</span>
              </div>
              <div id="orch-log"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Jobb oldal: TAC v2 dashboard + TAC v3 actions stream -->
      <section class="card">
        <div class="card-inner">
          <div class="card-header">
            <div>
              <div class="card-title">TAC v2 · Streaming Dashboard</div>
              <div class="subheader">Live synthesis of system health, risk & actions.</div>
            </div>
            <div class="pill">
              <span class="pill-dot idle" id="dash-dot"></span>
              <span id="dash-status-label">Waiting</span>
            </div>
          </div>

          <div class="output-grid">
            <div class="stream-box">
              <div class="stream-label">
                <span>TAC v2 DASHBOARD</span>
                <span class="tiny-pill">Analysis</span>
              </div>
              <div id="dash-stream"></div>
            </div>
            <div class="stream-box">
              <div class="stream-label">
                <span>TAC v3 ORCHESTRATION</span>
                <span class="tiny-pill">Next actions</span>
              </div>
              <div id="actions-stream"></div>
            </div>
          </div>

          <div class="footer">
            TAC Engine running inside Cloudflare Workers · streaming directly from OpenAI
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const form = document.getElementById("tac-form");
    const promptInput = document.getElementById("prompt");
    const runBtn = document.getElementById("run-btn");
    const lastRun = document.getElementById("last-run");
    const orchDot = document.getElementById("orch-dot");
    const dashDot = document.getElementById("dash-dot");
    const orchStatusLabel = document.getElementById("orch-status-label");
    const dashStatusLabel = document.getElementById("dash-status-label");
    const orchLog = document.getElementById("orch-log");
    const dashStream = document.getElementById("dash-stream");
    const actionsStream = document.getElementById("actions-stream");
    const modeButtons = document.getElementById("mode-buttons");

    let currentMode = "default";

    modeButtons.addEventListener("click", (e) => {
      if (e.target.classList.contains("mode-btn")) {
        Array.from(modeButtons.children).forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        currentMode = e.target.dataset.mode || "default";
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const prompt = (promptInput.value || "").trim();
      if (!prompt) {
        alert("Adj meg egy szcenáriót / problémát a TAC-nek.");
        return;
      }

      orchLog.innerHTML = "";
      dashStream.innerHTML = "";
      actionsStream.innerHTML = "";

      setRunningState(true);

      try {
        const res = await fetch("/api/tac-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, mode: currentMode }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          appendLogLine("ERROR", err);
          setRunningState(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\\n\\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.startsWith("data:")) continue;
            const data = part.replace(/^data:\\s*/, "");
            if (data === "[DONE]") {
              break;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content || "";
              if (!delta) continue;

              routeToken(delta);
            } catch (_) {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        appendLogLine("ERROR", String(err));
      } finally {
        setRunningState(false);
      }
    });

    function setRunningState(running) {
      if (running) {
        runBtn.disabled = true;
        orchDot.classList.remove("idle");
        orchDot.classList.remove("danger");
        orchDot.style.background = "#22c55e";
        dashDot.classList.remove("idle");
        dashDot.classList.remove("danger");
        dashDot.style.background = "#22c55e";
        orchStatusLabel.textContent = "Streaming";
        dashStatusLabel.textContent = "Live";
        lastRun.textContent = new Date().toLocaleTimeString();
        appendLogLine("INFO", "TAC run started (" + currentMode + " mode)");
      } else {
        runBtn.disabled = false;
        orchDot.classList.add("idle");
        dashDot.classList.add("idle");
        orchStatusLabel.textContent = "Idle";
        dashStatusLabel.textContent = "Waiting";
        appendLogLine("INFO", "TAC run finished");
      }
    }

    function appendLogLine(tag, message) {
      const ts = new Date().toISOString().slice(11, 19);
      const line = document.createElement("div");
      line.className = "log-line";
      line.innerHTML =
        '<span class="ts">' + ts + "</span>" +
        '<span class="tag">' + tag + "</span>" +
        message;
      orchLog.appendChild(line);
      orchLog.scrollTop = orchLog.scrollHeight;
    }

    function routeToken(token) {
      // nagyon egyszerű routing TAC v2 / TAC v3 blokkok közé a headingek alapján
      const lower = token.toLowerCase();
      if (lower.includes("tac v2 dashboard")) {
        dashStream.innerHTML += "\\n";
      } else if (lower.includes("tac v3 orchestration")) {
        actionsStream.innerHTML += "\\n";
      }

      if (dashStream.textContent.length === 0 || dashStream.textContent.includes("TAC v2 DASHBOARD")) {
        dashStream.innerHTML += token.replace(/TAC v2 DASHBOARD:?/gi, "").replace(/^\\n+/, "");
      } else if (actionsStream.textContent.length === 0 || actionsStream.textContent.includes("TAC v3 ORCHESTRATION")) {
        actionsStream.innerHTML += token.replace(/TAC v3 ORCHESTRATION:?/gi, "").replace(/^\\n+/, "");
      } else {
        // fallback: mindkettőbe megy
        dashStream.innerHTML += token;
        actionsStream.innerHTML += token;
      }

      dashStream.scrollTop = dashStream.scrollHeight;
      actionsStream.scrollTop = actionsStream.scrollHeight;
    }
  </script>
</body>
</html>
  `.trim();
}