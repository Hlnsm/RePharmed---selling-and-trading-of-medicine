function eur(v){
  return Number(v || 0).toLocaleString("pt-PT", { style:"currency", currency:"EUR" });
}

function labelCategory(cat) {
  return ({
    analgesicos: "Analgésicos",
    antibioticos: "Antibióticos",
    dermo: "Dermo",
    gripe: "Gripe & Constipação",
    vitaminas: "Vitaminas",
    outros: "Outros"
  })[cat] || "Outros";
}

function safeDateFromReceipt(r){
  if (r && Number.isFinite(r.createdAtTs)) return new Date(r.createdAtTs);
  const d = new Date(r ? r.createdAt : "");
  if (!Number.isNaN(d.getTime())) return d;
  return new Date();
}

function monthKey(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2,"0");
  return `${y}-${m}`;
}

// pseudo-aleatório determinístico 0..1 (sem Math.random)
function hash01(str){
  let h = 2166136261;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function monthShort(yyyyMm){
  const [y,m] = yyyyMm.split("-");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[(Number(m)-1)||0]} ${y}`;
}

const PLATFORM_FEE_PCT = 0.06; // 6% comissão demo

function computeStats(receipts){
  const rxs = Array.isArray(receipts) ? receipts : [];

  const revenue = rxs.reduce((s,r)=> s + (Number(r.total) || 0), 0);
  const units   = rxs.reduce((s,r)=> s + (Number(r.quantity) || 0), 0);
  const profit  = revenue * PLATFORM_FEE_PCT;

  const saved = rxs.reduce((s,r)=>{
    const d = Number(r.expiresInDays);
    const q = Number(r.quantity) || 0;
    if (!Number.isFinite(d)) return s;
    return s + (d <= 21 ? q : 0);
  }, 0);

  const byMonth = new Map();
  const byCat = new Map();
  const byDelivery = { pickup: 0, courier: 0 };
  const profitByMonth = new Map();

  for (const r of rxs){
    const dt = safeDateFromReceipt(r);
    const k = monthKey(dt);

    const total = Number(r.total) || 0;
    byMonth.set(k, (byMonth.get(k) || 0) + total);

    const c = r.category || "outros";
    byCat.set(c, (byCat.get(c) || 0) + (Number(r.quantity) || 0));

    const m = r.deliveryMethod || (r.type === "purchase" ? "pickup" : "courier");
    if (m === "pickup") byDelivery.pickup += 1; else byDelivery.courier += 1;

    const p = total * PLATFORM_FEE_PCT;
    profitByMonth.set(k, (profitByMonth.get(k) || 0) + p);
  }

  // 2 pontos por mês (intra-mês)
  const profitPoints = [];
  const monthsSorted = Array.from(profitByMonth.keys()).sort();

  for (const k of monthsSorted){
    const base = profitByMonth.get(k) || 0;

    const r1 = 0.35 + 0.25 * hash01(k + "|a");
    const r2 = 0.85 + 0.25 * hash01(k + "|b");

    profitPoints.push({ label: `${monthShort(k)} • 05`, value: Number((base * r1).toFixed(2)) });
    profitPoints.push({ label: `${monthShort(k)} • 18`, value: Number((base * r2).toFixed(2)) });
  }

  return { revenue, profit, units, saved, byMonth, byCat, byDelivery, profitPoints };
}

/* =========================================================
   CANVAS FALLBACK (se Chart.js não carregar)
   ========================================================= */

function clearCanvas(canvas){
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);
  return { ctx, w: rect.width, h: rect.height };
}

function drawAxes(ctx, w, h, pad){
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLineChart(canvas, labels, values){
  const { ctx, w, h } = clearCanvas(canvas);
  const pad = 28;

  drawAxes(ctx, w, h, pad);

  const maxV = Math.max(1, ...values);
  const minV = Math.min(0, ...values);

  const xStep = (w - 2*pad) / Math.max(1, (values.length - 1));
  const yScale = (h - 2*pad) / (maxV - minV || 1);

  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * xStep;
    const y = h - pad - (v - minV) * yScale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((v, i) => {
    const x = pad + i * xStep;
    const y = h - pad - (v - minV) * yScale;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 0.7;
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textBaseline = "top";
  if (labels.length){
    ctx.fillText(labels[0], pad, h - pad + 6);
    const last = labels[labels.length - 1];
    const tw = ctx.measureText(last).width;
    ctx.fillText(last, w - pad - tw, h - pad + 6);
  }
  ctx.globalAlpha = 1;
}

function drawBarChart(canvas, labels, values){
  const { ctx, w, h } = clearCanvas(canvas);
  const pad = 28;

  drawAxes(ctx, w, h, pad);

  const maxV = Math.max(1, ...values);
  const barW = (w - 2*pad) / Math.max(1, values.length) * 0.7;
  const gap = (w - 2*pad) / Math.max(1, values.length) * 0.3;

  values.forEach((v, i) => {
    const x = pad + i * (barW + gap);
    const bh = (h - 2*pad) * (v / maxV);
    const y = h - pad - bh;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x, y, barW, bh);
  });

  ctx.globalAlpha = 0.7;
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textBaseline = "top";
  if (labels.length){
    ctx.fillText(labels[0], pad, h - pad + 6);
    const last = labels[labels.length - 1];
    const tw = ctx.measureText(last).width;
    ctx.fillText(last, w - pad - tw, h - pad + 6);
  }
  ctx.globalAlpha = 1;
}

function drawDoughnut(canvas, values, labels){
  const { ctx, w, h } = clearCanvas(canvas);
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  const rInner = r * 0.62;

  const sum = values.reduce((a,b)=>a+b,0) || 1;
  let a0 = -Math.PI / 2;

  values.forEach((v, idx) => {
    const a1 = a0 + (v / sum) * Math.PI * 2;
    ctx.globalAlpha = 0.9 - idx * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fill();
    a0 = a1;
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.globalAlpha = 0.8;
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  const txt = `${labels[0]}: ${values[0]}   |   ${labels[1]}: ${values[1]}`;
  const tw = ctx.measureText(txt).width;
  ctx.fillText(txt, Math.max(8, (w - tw)/2), h - 18);
  ctx.globalAlpha = 1;
}

/* =========================================================
   RENDER
   ========================================================= */

let charts = { spend:null, cats:null, delivery:null, profit:null };

function destroyCharts(){
  Object.values(charts).forEach(c => { if (c && typeof c.destroy === "function") c.destroy(); });
  charts = { spend:null, cats:null, delivery:null, profit:null };
}

function renderDashboard(){
  const receipts = (window.PS && typeof PS.loadReceipts === "function") ? PS.loadReceipts() : [];
  const s = computeStats(receipts);

  // KPIs (SEM optional chaining no lado esquerdo)
  const kpiProfit  = document.querySelector("#kpiProfit");
  const kpiSaved   = document.querySelector("#kpiSaved");
  const kpiUnits   = document.querySelector("#kpiUnits");
  const kpiRevenue = document.querySelector("#kpiRevenue");

  if (kpiProfit)  kpiProfit.textContent  = eur(s.profit);
  if (kpiSaved)   kpiSaved.textContent   = String(s.saved);
  if (kpiUnits)   kpiUnits.textContent   = String(s.units);
  if (kpiRevenue) kpiRevenue.textContent = eur(s.revenue);

  const months = Array.from(s.byMonth.keys()).sort();
  const monthLabels = months.length ? months.map(monthShort) : ["(sem dados)"];
  const monthVals   = months.length ? months.map(k => s.byMonth.get(k)) : [0];

  const catKeys = Array.from(s.byCat.keys());
  const catLabels = catKeys.length ? catKeys.map(labelCategory) : ["(sem dados)"];
  const catVals   = catKeys.length ? catKeys.map(k => s.byCat.get(k)) : [0];

  const pp = s.profitPoints || [];
  const pLabels = pp.length ? pp.map(x => x.label) : ["(sem dados)"];
  const pVals   = pp.length ? pp.map(x => x.value) : [0];

  const elSpend = document.querySelector("#chSpend");
  const elCats = document.querySelector("#chCats");
  const elDelivery = document.querySelector("#chDelivery");
  const elProfit = document.querySelector("#chProfit");

  if (!elSpend || !elCats || !elDelivery || !elProfit) {
    if (window.PS && typeof PS.showToast === "function") {
      PS.showToast("ERRO: canvases não encontrados. Confirma IDs: chSpend, chCats, chDelivery, chProfit.");
    }
    return;
  }

  if (window.Chart){
    destroyCharts();

    charts.spend = new Chart(elSpend, {
      type: "bar",
      data: { labels: monthLabels, datasets: [{ label: "€", data: monthVals }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });


    charts.cats = new Chart(elCats, {
      type: "bar",
      data: { labels: catLabels, datasets: [{ label: "Unidades", data: catVals }] },
      options: { responsive:true, plugins:{ legend:{ display:false } } }
    });

    charts.delivery = new Chart(elDelivery, {
      type: "doughnut",
      data: {
        labels: ["Pickup", "Estafeta"],
        datasets: [{ data: [s.byDelivery.pickup, s.byDelivery.courier] }]
      },
      options: { responsive:true, maintainAspectRatio:true, aspectRatio: 1 }
    });

    charts.profit = new Chart(elProfit, {
      type: "line",
      data: { labels: pLabels, datasets: [{ label: "Profit (€)", data: pVals }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        elements: {
          line: { tension: 0 },     // ✅ retas
          point: { radius: 4, hoverRadius: 6 }
        }
      }
    });

  } else {
    // Fallback sem Chart.js
    drawLineChart(elSpend, monthLabels, monthVals);
    drawBarChart(elCats, catLabels, catVals);
    drawDoughnut(elDelivery, [s.byDelivery.pickup, s.byDelivery.courier], ["Pickup", "Estafeta"]);
    drawLineChart(elProfit, pLabels, pVals);

    if (!renderDashboard._warned){
      renderDashboard._warned = true;
      if (window.PS && typeof PS.showToast === "function") {
        PS.showToast("Chart.js não carregou — a usar gráficos fallback (canvas).");
      }
    }
  }

  if (!receipts.length && window.PS && typeof PS.showToast === "function") {
    PS.showToast("Sem movimentos. Clica em “Gerar novos dados”.");
  }
}

function seedStatsDemo(){
  const now = new Date();

  // helper: random estável (mas pode ser Math.random também)
  const rnd = (min, max) => min + Math.random() * (max - min);

  const mk = (daysAgo, props) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    const createdAtTs = d.getTime();
    const createdAt = d.toLocaleString("pt-PT");

    return {
      id: `RC-${Math.floor(Math.random()*9000+1000)}`,
      type: props.deliveryMethod === "pickup" ? "purchase" : "delivery",
      status: props.status || "Concluída",
      createdAt,
      createdAtTs,

      counterparty: props.counterparty || "Farmácia Demo",
      city: props.city || "Lisboa",
      item: props.item || "Produto demo",
      quantity: props.quantity || 10,
      total: Number(props.total || 50),

      ref: props.ref || "ORD-DEMO",
      notes: props.notes || "demo",
      tracking: null,

      deliveryMethod: props.deliveryMethod || "courier",

      category: props.category || "analgesicos",
      expiresInDays: props.expiresInDays || 12
    };
  };

  // Catálogo demo (para variar nomes e preços)
  const catalog = [
    { item:"Paracetamol 500mg",       category:"analgesicos",  base:2.9 },
    { item:"Ibuprofeno 400mg",        category:"analgesicos",  base:3.8 },
    { item:"Amoxicilina 500mg",       category:"antibioticos", base:6.5 },
    { item:"Vitamina C 1000mg",       category:"vitaminas",    base:4.2 },
    { item:"Probiótico (14 cáps.)",   category:"vitaminas",    base:9.2 },
    { item:"Spray Nasal (15ml)",      category:"gripe",        base:5.1 },
    { item:"Antigripal (10 saquetas)",category:"gripe",        base:8.4 },
    { item:"Creme Dermo 200ml",       category:"dermo",        base:7.9 }
  ];

  // Gera muitos recibos ao longo de ~12 meses
  // 330 dias ≈ 11 meses; ajusta para 365 se quiseres 12 meses completos
  const N = 60;                 // <-- aumenta/diminui aqui (ex: 45, 60, 80)
  const maxDaysAgo = 330;

  const demo = [];
  for (let i=0; i<N; i++){
    const p = catalog[i % catalog.length];

    // espalhar ao longo do tempo (quase uniforme, com ruído)
    const t = i / (N - 1 || 1);                       // 0..1
    const daysAgo = Math.floor(t * maxDaysAgo + rnd(-6, 6));
    const safeDaysAgo = Math.max(0, Math.min(maxDaysAgo, daysAgo));

    // qty e desconto variáveis
    const quantity = Math.floor(rnd(3, 35));
    const discountPct = rnd(0.15, 0.65);              // 15%..65%
    const unitFinal = p.base * (1 - discountPct);

    // entrega
    const deliveryMethod = (Math.random() < 0.35) ? "pickup" : "courier";
    const deliveryFee = (deliveryMethod === "courier") ? 4.90 : 0.00;

    // validade: mistura alguns muito perto do prazo, outros não
    const expiresInDays =
      (Math.random() < 0.45)
        ? Math.floor(rnd(3, 21))                      // “salvos”
        : Math.floor(rnd(22, 120));

    // total (arredondado)
    const subtotal = unitFinal * quantity;
    const total = subtotal + deliveryFee;

    demo.push(mk(safeDaysAgo, {
      item: p.item,
      category: p.category,
      quantity,
      total: Number(total.toFixed(2)),
      deliveryMethod,
      expiresInDays,
      status: "Concluída",
      counterparty: ["Farmácia Luz","Farmácia Oriente","Farmácia do Parque","Farmácia Central"][i % 4],
      city: ["Lisboa","Oeiras","Amadora","Cascais"][i % 4],
      notes: deliveryMethod === "pickup" ? "Levantamento em loja (demo)." : "Entrega por estafeta (demo)."
    }));
  }

  // guarda + render
  if (window.PS && typeof PS.saveReceipts === "function") {
    PS.saveReceipts(demo);
    if (typeof PS.showToast === "function") PS.showToast("Dados demo (12 meses) gerados");
  }

  renderDashboard();
}

function initProfile() {
  if (window.PS && typeof PS.initCommonUI === "function") PS.initCommonUI();

  const prefNotif = document.querySelector("#prefNotif");
  const prefNear  = document.querySelector("#prefNear");
  const saveBtn   = document.querySelector("#savePrefsBtn");

  const prefs = JSON.parse(localStorage.getItem("ps_prefs") || "{}");
  if (prefNotif && typeof prefs.notif === "boolean") prefNotif.checked = prefs.notif;
  if (prefNear  && typeof prefs.near5 === "boolean") prefNear.checked = prefs.near5;

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      localStorage.setItem("ps_prefs", JSON.stringify({
        notif: prefNotif ? !!prefNotif.checked : true,
        near5: prefNear ? !!prefNear.checked : false
      }));
      if (window.PS && typeof PS.showToast === "function") PS.showToast("Preferências guardadas");
    });
  }

  const regenBtn = document.querySelector("#regenStatsBtn");
  if (regenBtn) regenBtn.addEventListener("click", seedStatsDemo);
  
  // se ainda não há dados (ou há poucos), gera automaticamente
  const current = PS.loadReceipts?.() || [];
  if (current.length < 12) {   // ajusta o threshold se quiseres
    seedStatsDemo();
  } else {
    setTimeout(renderDashboard, 0);
  }


  setTimeout(renderDashboard, 0);
}

initProfile();
