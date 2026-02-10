/* dm.js — Instagram/OLX-like DMs (threads + messages) */

const $ = (sel) => document.querySelector(sel);

const LS_THREADS = "ps_dm_threads_v1";
const LS_MESSAGES = "ps_dm_messages_v1";
const LS_ME = "ps_current_pharmacy_v1"; // demo: farmácia atual

const AUTO_REPLIES = [
  "Obrigado pela mensagem, vou analisar 👍",
  "Recebido! Vamos considerar a proposta.",
  "Obrigado, assim que possível damos feedback.",
  "Mensagem recebida, vamos avaliar internamente.",
  "Obrigado pelo contacto, vamos ter isso em conta.",
  "Recebido 👍 Iremos considerar a proposta.",
  "Obrigado, a equipa vai analisar.",
  "Mensagem recebida, voltamos em breve.",
  "Obrigado pelo interesse, vamos considerar.",
  "Recebido! Analisamos e dizemos algo."
];

function getAutoReply() {
  return AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
}


function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function nowStr() {
  return new Date().toLocaleString("pt-PT");
}

function getMe() {
  // default para bater com o teu profile.html
  const v = localStorage.getItem(LS_ME);
  return v && v.trim() ? v.trim() : "Farmácia Central";
}

function setMe(name) {
  localStorage.setItem(LS_ME, name);
}

function loadThreads() {
  try { return JSON.parse(localStorage.getItem(LS_THREADS) || "[]"); }
  catch { return []; }
}
function saveThreads(items) {
  localStorage.setItem(LS_THREADS, JSON.stringify(items || []));
}

function loadMessages() {
  try { return JSON.parse(localStorage.getItem(LS_MESSAGES) || "[]"); }
  catch { return []; }
}
function saveMessages(items) {
  localStorage.setItem(LS_MESSAGES, JSON.stringify(items || []));
}

function makeThreadId(contextType, contextId, a, b) {
  const parts = [String(a||""), String(b||"")].sort();
  return `TH-${contextType}-${contextId}-${normalize(parts.join("-")).replace(/\s+/g, "_").slice(0, 60)}`;
}

function upsertThread(thread) {
  const all = loadThreads();
  const idx = all.findIndex(t => t.threadId === thread.threadId);
  if (idx >= 0) all[idx] = { ...all[idx], ...thread };
  else all.unshift(thread);

  // sort inbox by lastMessageAtTs desc
  all.sort((x, y) => (y.lastMessageAtTs || 0) - (x.lastMessageAtTs || 0));
  saveThreads(all);
}

function pushMessage(msg) {
  const all = loadMessages();
  all.push(msg);
  saveMessages(all);
}

function getThreadById(threadId) {
  return loadThreads().find(t => t.threadId === threadId) || null;
}

function getMessagesForThread(threadId) {
  return loadMessages().filter(m => m.threadId === threadId).sort((a,b) => (a.createdAtTs||0)-(b.createdAtTs||0));
}

function contextLabel(type) {
  if (type === "listing") return "Anúncio";
  if (type === "request") return "Pedido";
  if (type === "receipt") return "Recibo";
  return "Contexto";
}

/* -------------------------
   Context resolvers (card + link)
------------------------- */

function getListing(id) {
  return (window.PS?.listings || []).find(x => x.id === id) || null;
}
function getRequest(id) {
  return (window.PS?.loadRequests?.() || []).find(x => x.id === id) || null;
}
function getReceipt(id) {
  return (window.PS?.loadReceipts?.() || []).find(x => x.id === id) || null;
}

function buildContextLink(ctx) {
  if (!ctx) return null;
  if (ctx.type === "listing") return `index.html?from=dm&lid=${encodeURIComponent(ctx.id)}`;
  if (ctx.type === "request") return `orders.html`;
  if (ctx.type === "receipt") return `receipts.html`;
  return null;
}

function renderContextCard(thread) {
  const card = $("#dmContextCard");
  const link = $("#dmContextLink");
  if (!card || !link) return;

  const ctx = thread?.context;
  if (!ctx) {
    card.hidden = true;
    link.style.display = "none";
    return;
  }

  link.style.display = "";
  link.textContent = `Ver ${contextLabel(ctx.type)}`;
  link.href = buildContextLink(ctx) || "#";

  // Build card by type
  let html = "";
  if (ctx.type === "listing") {
    const it = getListing(ctx.id);
    if (!it) {
      html = `<div class="kv"><div class="k">Anúncio</div><div class="v">ID ${ctx.id} (não encontrado)</div></div>`;
    } else {
      html = `
        <div class="dm-context__grid">
          <img class="dm-context__img" src="${it.image || "images/logo.png"}" alt="${it.name}">
          <div>
            <div class="dm-context__title">${it.name}</div>
            <div class="small">${it.seller} • ${it.city} • ${Number(it.distanceKm||0).toFixed(1)} km • Stock: ${it.stock}</div>
            <div class="small">Expira em ${it.expiresInDays} meses • ${it.discountPct}% desconto</div>
            <div class="small">ID: ${it.id}</div>
          </div>
        </div>
      `;
    }
  } else if (ctx.type === "request") {
    const r = getRequest(ctx.id);
    if (!r) {
      html = `<div class="kv"><div class="k">Pedido</div><div class="v">ID ${ctx.id} (não encontrado)</div></div>`;
    } else {
      html = `
        <div class="dm-context__grid">
          <div class="dm-context__badge">${r.urgent ? "URGENTE" : "Procura"}</div>
          <div>
            <div class="dm-context__title">${r.title}</div>
            <div class="small">${r.requester} • ${r.city} • até ${r.distanceKm.toFixed(1)} km</div>
            <div class="small">Qtd: ${r.quantity} • Máx: ${r.maxPrice.toFixed(2)}€ • Prazo: ${r.deadlineDays} meses</div>
            <div class="small">ID: ${r.id}</div>
          </div>
        </div>
      `;
    }
  } else if (ctx.type === "receipt") {
    const rc = getReceipt(ctx.id);
    if (!rc) {
      html = `<div class="kv"><div class="k">Recibo</div><div class="v">ID ${ctx.id} (não encontrado)</div></div>`;
    } else {
      html = `
        <div class="dm-context__grid">
          <div>
            <div class="dm-context__title">${rc.id} • ${rc.type}</div>
            <div class="small">${rc.item} • ${rc.quantity} un. • Total ${Number(rc.total||0).toFixed(2)}€</div>
            <div class="small">Contraparte: ${rc.counterparty} • Ref: ${rc.ref || "—"} • Estado: ${rc.status}</div>
          </div>
        </div>
      `;
    }
  }

  card.innerHTML = html;
  card.hidden = false;
}

/* -------------------------
   Inbox rendering
------------------------- */

let activeThreadId = null;

function renderThreadList() {
  const list = $("#dmThreadList");
  if (!list) return;

  const me = getMe();
  const q = normalize($("#dmSearch")?.value?.trim() || "");
  const filter = $("#dmFilter")?.value || "all";

  let threads = loadThreads().filter(t => (t.participants || []).includes(me));

  if (filter !== "all") threads = threads.filter(t => (t.context?.type || "") === filter);

  if (q) {
    threads = threads.filter(t => {
      const other = (t.participants || []).find(p => p !== me) || "—";
      const ctx = t.context || {};
      const hay = normalize(`${other} ${t.lastMessageText || ""} ${ctx.type||""} ${ctx.id||""} ${t.threadId||""}`);
      return hay.includes(q);
    });
  }

  list.innerHTML = "";

  if (!threads.length) {
    list.innerHTML = `
      <div class="empty" style="margin-top:10px">
        <div class="empty__title">Sem conversas</div>
        <div class="empty__text">Abre uma conversa a partir da Loja/Recibos/Pedidos.</div>
      </div>
    `;
    return;
  }

  for (const t of threads) {
    const other = (t.participants || []).find(p => p !== me) || "—";
    const ctx = t.context || {};
    const ctxText = ctx.type ? `${contextLabel(ctx.type)} • ${ctx.id}` : "—";

    const el = document.createElement("div");
    el.className = "list-item" + (t.threadId === activeThreadId ? " is-active" : "");
    el.dataset.threadId = t.threadId;

    el.innerHTML = `
      <div class="list-item__left">
        <div style="font-weight:900">${other}</div>
        <div style="color:rgba(16,24,40,0.70); font-size:12px">
          ${ctxText} • ${t.lastMessageAt || "—"}
        </div>
        <div style="color:rgba(16,24,40,0.55); font-size:12px; margin-top:4px;">
          ${t.lastMessageText ? t.lastMessageText : "Sem mensagens ainda."}
        </div>
      </div>
      <div class="list-item__right">
        <div style="font-weight:900;">${t.unreadBy?.[me] ? `(${t.unreadBy[me]})` : ""}</div>
      </div>
    `;

    list.appendChild(el);
  }
}

/* -------------------------
   Thread rendering
------------------------- */

function setActiveThread(threadId) {
  activeThreadId = threadId;

  const t = getThreadById(threadId);
  const me = getMe();
  if (!t) return;

  // mark read
  const threads = loadThreads();
  const idx = threads.findIndex(x => x.threadId === threadId);
  if (idx >= 0) {
    threads[idx].unreadBy = threads[idx].unreadBy || {};
    threads[idx].unreadBy[me] = 0;
    saveThreads(threads);
  }

  const other = (t.participants || []).find(p => p !== me) || "—";
  $("#dmTitle").textContent = other;
  $("#dmSub").textContent = `${contextLabel(t.context?.type)} • ${t.context?.id || "—"}`;

  renderContextCard(t);
  renderMessages(t);

  renderThreadList();
}

function renderMessages(thread) {
  const box = $("#dmMessages");
  if (!box) return;

  const me = getMe();
  const msgs = getMessagesForThread(thread.threadId);

  if (!msgs.length) {
    box.innerHTML = `
      <div class="empty" style="margin-top:10px">
        <div class="empty__title">Sem mensagens</div>
        <div class="empty__text">Envia a primeira mensagem para iniciar a negociação.</div>
      </div>
    `;
    return;
  }

  box.innerHTML = msgs.map(m => {
    const isMe = m.from === me;
    const cls = isMe ? "dm-bubble dm-bubble--me" : "dm-bubble";
    const meta = `${m.from} • ${m.createdAt}`;
    return `
      <div class="dm-row ${isMe ? "dm-row--me" : ""}">
        <div class="${cls}">
          <div class="dm-text">${escapeHtml(m.text || "")}</div>
          <div class="dm-meta">${escapeHtml(meta)}</div>
        </div>
      </div>
    `;
  }).join("");

  // scroll to bottom
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

/* -------------------------
   Create/open thread from URL
------------------------- */

function parseUrlIntent() {
  const p = new URLSearchParams(window.location.search);
  const type = p.get("type");           // listing|request|receipt
  const id = p.get("id");               // PS-xxx | REQ-xxx | RC-xxx
  const withWho = p.get("with");        // optional: other pharmacy name
  const seed = p.get("seed");           // optional: message seed
  if (!type || !id) return null;
  return { type, id, withWho, seed };
}

function inferOtherParty(intent) {
  const me = getMe();
  if (intent.withWho) return intent.withWho;

  if (intent.type === "listing") {
    const it = getListing(intent.id);
    if (it?.seller && it.seller !== me) return it.seller;
  }
  if (intent.type === "request") {
    const r = getRequest(intent.id);
    if (r?.requester && r.requester !== me) return r.requester;
  }
  if (intent.type === "receipt") {
    const rc = getReceipt(intent.id);
    if (rc?.counterparty && rc.counterparty !== me) return rc.counterparty;
  }
  return "Farmácia (Desconhecida)";
}

function ensureThreadForIntent(intent) {
  const me = getMe();
  const other = inferOtherParty(intent);

  const threadId = makeThreadId(intent.type, intent.id, me, other);

  const existing = getThreadById(threadId);
  if (existing) return existing;

  const thread = {
    threadId,
    participants: [me, other],
    context: { type: intent.type, id: intent.id },
    createdAt: nowStr(),
    createdAtTs: Date.now(),
    lastMessageAt: "",
    lastMessageAtTs: 0,
    lastMessageText: "",
    unreadBy: { [me]: 0, [other]: 0 }
  };

  upsertThread(thread);

  // opcional: mensagem seed
  if (intent.seed) {
    const m = {
      id: `MSG-${Math.floor(Math.random()*900000+100000)}`,
      threadId,
      from: me,
      text: intent.seed,
      createdAt: nowStr(),
      createdAtTs: Date.now()
    };
    pushMessage(m);
    thread.lastMessageAt = m.createdAt;
    thread.lastMessageAtTs = m.createdAtTs;
    thread.lastMessageText = intent.seed.slice(0, 80);
    upsertThread(thread);
  }

  return thread;
}

/* -------------------------
   Send message
------------------------- */

function sendAutoReply(threadId) {
  const thread = getThreadById(threadId);
  if (!thread) return;

  const me = getMe();
  const other = (thread.participants || []).find(p => p !== me) || "—";
  const reply = getAutoReply();

  setTimeout(() => {
    const m = {
      id: `MSG-${Math.floor(Math.random() * 900000 + 100000)}`,
      threadId,
      from: other,                 // ✅ agora é o nome real do "outro"
      text: reply,
      createdAt: nowStr(),
      createdAtTs: Date.now()
    };

    pushMessage(m);

    // update thread (para aparecer na inbox sem refresh)
    thread.lastMessageAt = m.createdAt;
    thread.lastMessageAtTs = m.createdAtTs;
    thread.lastMessageText = reply.slice(0, 120);

    thread.unreadBy = thread.unreadBy || {};
    thread.unreadBy[me] = (thread.unreadBy[me] || 0) + 1; // ✅ unread para ti (se estiveres noutra thread)

    upsertThread(thread);

    // se estiveres a ver esta thread, re-render imediato
    if (activeThreadId === threadId) renderMessages(thread);
    renderThreadList();
  }, 800);
}



function sendMessage() {
  if (!activeThreadId) {
    window.PS?.showToast?.("Seleciona uma conversa primeiro.");
    return;
  }

  const input = $("#dmInput");
  const text = (input?.value || "").trim();
  if (!text) return;

  const me = getMe();
  const thread = getThreadById(activeThreadId);
  if (!thread) return;

  const other = (thread.participants || []).find(p => p !== me) || "—";

  const m = {
    id: `MSG-${Math.floor(Math.random()*900000+100000)}`,
    threadId: activeThreadId,
    from: me,
    text,
    createdAt: nowStr(),
    createdAtTs: Date.now()
  };
  pushMessage(m);

  // update thread
  thread.lastMessageAt = m.createdAt;
  thread.lastMessageAtTs = m.createdAtTs;
  thread.lastMessageText = text.slice(0, 120);

  thread.unreadBy = thread.unreadBy || {};
  thread.unreadBy[other] = (thread.unreadBy[other] || 0) + 1;

  upsertThread(thread);

  input.value = "";
  sendAutoReply(activeThreadId);


  renderMessages(thread);
  renderThreadList();
}

/* -------------------------
   Clear (demo)
------------------------- */

function clearDmStorage() {
  localStorage.removeItem(LS_THREADS);
  localStorage.removeItem(LS_MESSAGES);
  activeThreadId = null;
  $("#dmTitle").textContent = "Seleciona uma conversa";
  $("#dmSub").textContent = "—";
  $("#dmContextCard").hidden = true;
  $("#dmContextLink").style.display = "none";
  $("#dmMessages").innerHTML = `
    <div class="empty" style="margin-top:10px">
      <div class="empty__title">Limpo</div>
      <div class="empty__text">Sem conversas. Abre uma a partir da Loja/Recibos/Pedidos.</div>
    </div>
  `;
  renderThreadList();
  window.PS?.showToast?.("Mensagens limpas (demo).");
}

/* -------------------------
   Init
------------------------- */

function initDm() {
  window.PS?.initCommonUI?.();

  const me = getMe();
  $("#dmMeTag").textContent = `Tu: ${me}`;

  $("#dmSearch")?.addEventListener("input", renderThreadList);
  $("#dmFilter")?.addEventListener("change", renderThreadList);

  $("#dmThreadList")?.addEventListener("click", (e) => {
    const row = e.target.closest(".list-item");
    if (!row) return;
    const tid = row.dataset.threadId;
    if (tid) setActiveThread(tid);
  });

  $("#dmSendBtn")?.addEventListener("click", sendMessage);
  $("#dmInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  $("#dmClearBtn")?.addEventListener("click", clearDmStorage);

  // Open from URL intent
  const intent = parseUrlIntent();
  renderThreadList();

  if (intent) {
    const t = ensureThreadForIntent(intent);
    setActiveThread(t.threadId);
  } else {
    // auto-open most recent
    const threads = loadThreads().filter(t => (t.participants||[]).includes(me));
    if (threads.length) setActiveThread(threads[0].threadId);
  }
}

document.addEventListener("DOMContentLoaded", initDm);
