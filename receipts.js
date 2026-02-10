const $ = (sel) => document.querySelector(sel);

function normalize(str){
  return (str || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
function formatEur(v){
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function typeLabel(t){
  if (t === "purchase") return "Compra";
  if (t === "shipment") return "Envio";
  return "Entrega";
}
function typeTagClass(t){
  if (t === "purchase") return "tag--purchase";
  if (t === "shipment") return "tag--shipment";
  return "tag--delivery";
}

function ensureSeed(){
  if (PS.loadReceipts().length === 0) seedReceipts();
}

function seedReceipts(){
  localStorage.removeItem("ps_receipts");
  const now = Date.now();

  const demo = [
    {
      id: "RC-2001",
      type: "purchase",
      status: "Concluída",
      createdAt: "24/01/2026 10:22",
      counterparty: "Farmácia Luz",
      city: "Lisboa",
      item: "Paracetamol 500mg (20 comp.)",
      quantity: 40,
      total: 116.00,
      ref: "ORD-1842",
      notes: "Pagamento por referência.",
      tracking: null
    },
    {
      id: "RC-2002",
      type: "shipment",
      status: "Expedido",
      createdAt: "25/01/2026 14:05",
      counterparty: "Farmácia do Parque",
      city: "Oeiras",
      item: "Spray Nasal (15ml)",
      quantity: 12,
      total: 61.20,
      ref: "REQ-1002",
      notes: "Envio agendado para recolha 16:00.",
      tracking: {
        code: "TRK-PT-913872",
        stage: 2, // 1 a preparar, 2 a caminho, 3 entregue
        steps: [
          { title: "A preparar", at: "25/01/2026 14:05" },
          { title: "A caminho", at: "25/01/2026 18:40" },
          { title: "Entregue", at: "" }
        ]
      }
    },
    {
      id: "RC-2003",
      type: "delivery",
      status: "Entregue",
      createdAt: "22/01/2026 09:31",
      counterparty: "Farmácia Oriente",
      city: "Lisboa",
      item: "Vitamina C 1000mg (30 comp.)",
      quantity: 25,
      total: 105.00,
      ref: "ORD-9011",
      notes: "Receção confirmada.",
      tracking: {
        code: "TRK-PT-440102",
        stage: 3,
        steps: [
          { title: "A preparar", at: "22/01/2026 09:31" },
          { title: "A caminho", at: "22/01/2026 11:10" },
          { title: "Entregue", at: "22/01/2026 13:02" }
        ]
      }
    }
  ];

  PS.saveReceipts(demo);
  PS.showToast("Recibos de exemplo gerados");
  render();
}

function clearReceipts(){
  PS.saveReceipts([]);
  PS.showToast("Recibos limpos");
  render();
}

function renderList(items, activeId){
  const list = $("#rcList");
  list.innerHTML = "";

  if (!items.length){
    list.innerHTML = `
      <div class="empty" style="margin-top:10px">
        <div class="empty__title">Sem recibos</div>
        <div class="empty__text">Clica em “Gerar exemplos” para preencher.</div>
      </div>
    `;
    return;
  }

  for (const it of items){
    const el = document.createElement("div");
    el.className = "list-item" + (it.id === activeId ? " is-active" : "");
    el.dataset.id = it.id;

    el.innerHTML = `
      <div class="list-item__left">
        <div style="font-weight:900">${it.id} • ${typeLabel(it.type)} • ${it.status}</div>
        <div style="color:rgba(255,255,255,0.72); font-size:12px">
          ${it.item} — ${it.counterparty} (${it.city})
        </div>
      </div>
      <div class="list-item__right">
        <div>${formatEur(it.total)}</div>
        <div>${it.createdAt}</div>
      </div>
    `;

    list.appendChild(el);
  }
}

function renderTracking(tracking){
  if (!tracking) return "";

  const stage = Number(tracking.stage) || 1; // 1..3
  const s = tracking.steps || [];

  const stepHtml = (i) => {
    const step = s[i-1] || { title: ["A preparar","A caminho","Entregue"][i-1], at:"" };
    const cls = i < stage ? "is-done" : (i === stage ? "is-current" : "");
    return `
      <div class="track__step ${cls}">
        <div class="t">${step.title}</div>
        <div class="d">${step.at || "—"}</div>
      </div>
    `;
  };

  return `
    <div class="track">
      <div class="track__title">Tracking • ${tracking.code}</div>
      <div class="track__steps">
        ${stepHtml(1)}
        ${stepHtml(2)}
        ${stepHtml(3)}
      </div>
    </div>
  `;
}

function renderDetail(item){
  const detail = $("#rcDetail");
  const tag = $("#rcDetailTag");

  if (!item){
    tag.textContent = "";
    detail.innerHTML = `
      <div class="empty" style="margin-top:10px">
        <div class="empty__title">Seleciona um recibo</div>
        <div class="empty__text">Clica num item da lista para ver detalhes e tracking.</div>
      </div>
    `;
    return;
  }

  tag.innerHTML = `<span class="tag ${typeTagClass(item.type)}">${typeLabel(item.type)}</span>`;

  const dmHref =
    `dm.html?type=receipt&id=${encodeURIComponent(item.id)}&with=${encodeURIComponent(item.counterparty || "")}`;

  detail.innerHTML = `
    <div class="detail-grid">
      <div class="kv"><div class="k">ID</div><div class="v">${item.id}</div></div>
      <div class="kv"><div class="k">Estado</div><div class="v">${item.status}</div></div>
      <div class="kv"><div class="k">Data</div><div class="v">${item.createdAt}</div></div>
      <div class="kv"><div class="k">Referência</div><div class="v">${item.ref || "—"}</div></div>
      <div class="kv"><div class="k">Contraparte</div><div class="v">${item.counterparty}</div></div>
      <div class="kv"><div class="k">Local</div><div class="v">${item.city}</div></div>
      <div class="kv"><div class="k">Item</div><div class="v">${item.item}</div></div>
      <div class="kv"><div class="k">Quantidade</div><div class="v">${item.quantity}</div></div>
      <div class="kv"><div class="k">Total</div><div class="v">${formatEur(item.total)}</div></div>
      <div class="kv"><div class="k">Notas</div><div class="v">${item.notes || "—"}</div></div>
    </div>

    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px;">
      <a class="btn btn--primary" href="${dmHref}">Mensagem</a>
    </div>

    ${renderTracking(item.tracking)}
  `;
}


function getFiltered(){
  const q = normalize($("#rcSearch").value.trim());
  const type = $("#rcType").value;

  let items = PS.loadReceipts();

  if (type !== "all") items = items.filter(x => x.type === type);

  if (q){
    items = items.filter(x => normalize(`${x.id} ${x.item} ${x.counterparty} ${x.city} ${x.ref} ${x.tracking?.code || ""}`).includes(q));
  }

  // mais recentes primeiro (best-effort)
  items = items.slice().reverse();

  return items;
}

let activeId = null;

function render(){
  const items = getFiltered();

  // se o activeId desapareceu, escolhe o primeiro
  if (items.length && (!activeId || !items.some(x => x.id === activeId))){
    activeId = items[0].id;
  }
  if (!items.length) activeId = null;

  renderList(items, activeId);

  const selected = activeId ? items.find(x => x.id === activeId) : null;
  renderDetail(selected);
}

function initReceipts(){
  PS.initCommonUI();

  $("#seedReceiptsBtn").addEventListener("click", seedReceipts);
  $("#clearReceiptsBtn").addEventListener("click", clearReceipts);

  $("#rcSearch").addEventListener("input", render);
  $("#rcType").addEventListener("change", render);

  $("#rcList").addEventListener("click", (e) => {
    const row = e.target.closest(".list-item");
    if (!row) return;
    activeId = row.dataset.id;
    render();
  });

  ensureSeed();
  render();
}

initReceipts();
