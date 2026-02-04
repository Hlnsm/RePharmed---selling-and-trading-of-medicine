const $ = (sel) => document.querySelector(sel);

function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatEur(v) {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function labelCategory(cat) {
  return ({
    analgesicos: "Analgésicos",
    antibioticos: "Antibióticos",
    dermo: "Dermo",
    gripe: "Gripe & Constipação",
    vitaminas: "Vitaminas"
  })[cat] || "Outros";
}

function buildStoreLinkFromRequest(r, extra = {}) {
  const params = new URLSearchParams();

  const q = (r.substance && r.substance.trim()) ? r.substance.trim() : r.title;
  if (q) params.set("q", q);

  if (r.category && r.category !== "all") params.set("cat", r.category);

  if (typeof r.maxPrice === "number") params.set("pmax", String(r.maxPrice));
  if (typeof r.distanceKm === "number") params.set("dmax", String(r.distanceKm));

  params.set("from", "request");
  params.set("rid", r.id);

  // extras opcionais (ex: abrir checkout num produto específico)
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v));
  });

  return `index.html?${params.toString()}`;
}

function matchListingsForRequest(r) {
  const listings = Array.isArray(PS.listings) ? PS.listings : [];
  const q = normalize((r.substance && r.substance.trim()) ? r.substance : r.title);

  return listings.filter((it) => {
    // categoria
    if (r.category && r.category !== "all" && it.category !== r.category) return false;

    // distância (usar o r.distanceKm como limite “até X km”)
    if (typeof r.distanceKm === "number" && it.distanceKm > r.distanceKm) return false;

    // stock mínimo: tenta satisfazer quantidade pedida
    if (typeof r.quantity === "number" && it.stock < r.quantity) return false;

    // preço (usa preço de tabela; se quiseres usar "finalPrice" com desconto, ajustamos)
    if (typeof r.maxPrice === "number" && it.price > r.maxPrice) return false;

    // query match (título/substância/lab)
    if (q) {
      const hay = normalize(`${it.name} ${it.activeSubstance} ${it.lab} ${it.seller} ${it.city}`);
      if (!hay.includes(q)) return false;
    }

    return true;
  }).sort((a, b) => {
    // ordenação: mais barato primeiro, depois mais perto
    if (a.price !== b.price) return a.price - b.price;
    return a.distanceKm - b.distanceKm;
  });
}

function openMatchesModal(requestObj) {
  const matches = matchListingsForRequest(requestObj);

  // header
  const header = `
    <div><strong>${requestObj.title}</strong></div>
    <div class="small">
      ${requestObj.requester} • ${requestObj.city}
      • Qtd: ${requestObj.quantity}
      • Até ${formatEur(requestObj.maxPrice)}
      • ${requestObj.distanceKm.toFixed(1)} km
    </div>
    <div class="hr"></div>
    <div style="font-weight:900; margin-bottom:8px;">
      ${matches.length ? `Encontrámos ${matches.length} oferta(s) compatível(eis)` : "Não encontrámos ofertas compatíveis"}
    </div>
  `;

  // lista de matches, cada um com 2 botões
  const list = matches.length
    ? matches.slice(0, 6).map((it) => {
        const buyLink = buildStoreLinkFromRequest(requestObj, { openCheckout: 1, lid: it.id });
        const storeLink = buildStoreLinkFromRequest(requestObj); // só filtros

        return `
          <div class="kv" style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
              <div>
                <div style="font-weight:900">${it.name}</div>
                <div class="small">${it.seller} • ${it.city} • ${it.distanceKm.toFixed(1)} km • Stock: ${it.stock}</div>
                <div class="small">${labelCategory(it.category)} • ${it.lab}</div>
              </div>
              <div style="text-align:right; white-space:nowrap;">
                <div style="font-weight:900">${formatEur(it.price)}</div>
                <div class="small">${it.discountPct}% desc.</div>
              </div>
            </div>

            <div style="display:flex; gap:10px; justify-content:flex-end;">
              <a class="btn" href="${storeLink}">Ver na loja</a>
              <a class="btn btn--primary" href="${buyLink}">Comprar</a>
            </div>
          </div>
        `;
      }).join("")
    : `<div class="small">Experimenta aumentar distância ou preço máximo.</div>`;

  const body = `
    ${header}
    ${list}
    <div class="hr"></div>
    <div class="small">Se quiseres, podes abrir a loja só com os filtros do pedido.</div>
  `;

  // ✅ Botão do fundo do modal (ok) passa a ser "Ver na loja"
  openModal("Ofertas encontradas", body, "Ver na loja");

  // ok -> vai para loja com filtros (sem checkout)
  $("#modalOk").onclick = () => {
    window.location.href = buildStoreLinkFromRequest(requestObj);
  };
}


function openModal(title, bodyHtml, okText = "Confirmar") {
  const modalWrap = $("#modal");
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHtml;
  $("#modalOk").textContent = okText;
  modalWrap.hidden = false;
  return modalWrap;
}

function closeModal() {
  $("#modal").hidden = true;
}

function wireModalClose() {
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
}

function renderRequestCards(items) {
  const cards = $("#reqCards");
  const empty = $("#reqEmpty");
  const count = $("#reqCount");

  cards.innerHTML = "";

  if (!items.length) {
    empty.hidden = false;
    count.textContent = "0 pedidos";
    return;
  }

  empty.hidden = true;
  count.textContent = `${items.length} pedido(s)`;

  for (const r of items) {
    const el = document.createElement("article");
    el.className = "card";

    const badgeHtml = r.urgent
      ? `<div class="badge badge--urgent">URGENTE</div>`
      : `<div class="badge badge--warn">Procura • Até ${formatEur(r.maxPrice)}</div>`;

    el.innerHTML = `
      <div class="card__media">
        ${badgeHtml}
      </div>

      <div class="card__body">
        <div class="card__title">${r.title}</div>
        <div class="card__sub">
          ${r.requester} • ${r.city} • ${r.distanceKm.toFixed(1)} km
        </div>
        <div class="pills">
          <span class="pill">${labelCategory(r.category)}</span>
          <span class="pill">Qtd: ${r.quantity}</span>
          <span class="pill">Prazo: ${r.deadlineDays} dias</span>
        </div>
      </div>

      <div class="card__footer">
        <div>
          <div class="price">Até ${formatEur(r.maxPrice)}</div>
          <div class="small">ID: ${r.id}</div>
        </div>
        <div class="card__cta">
          <button class="btn btn--primary" data-action="respond" data-id="${r.id}">Responder</button>
        </div>
      </div>
    `;

    cards.appendChild(el);
  }
}

function applyFilters() {
  const q = normalize($("#reqSearch").value.trim());
  const cat = $("#reqCategory").value;
  const dMax = Number($("#reqDistance").value);
  const sort = $("#reqSort").value;

  let reqs = PS.loadRequests();

  if (q) {
    reqs = reqs.filter((r) =>
      normalize(`${r.title} ${r.substance} ${r.requester} ${r.city}`).includes(q)
    );
  }
  if (cat !== "all") reqs = reqs.filter((r) => r.category === cat);
  reqs = reqs.filter((r) => r.distanceKm <= dMax);

  if (sort === "distance") {
    reqs.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sort === "maxprice_desc") {
    reqs.sort((a, b) => b.maxPrice - a.maxPrice);
  } else {
    // recent + urgentes primeiro
    reqs.sort((a, b) => {
      const au = !!a.urgent;
      const bu = !!b.urgent;
      if (au !== bu) return au ? -1 : 1;
      return (b.createdAtTs || 0) - (a.createdAtTs || 0);
    });
  }

  renderRequestCards(reqs);
}

function seedRequests() {
  // ✅ garante que não ficam pedidos antigos sem a flag urgent
  localStorage.removeItem("ps_requests");

  const now = Date.now();
  const demo = [
    {
      id: "REQ-1001",
      title: "Procuro Paracetamol 500mg (20 comp.)",
      category: "analgesicos",
      substance: "paracetamol",
      quantity: 40,
      maxPrice: 3.20,
      deadlineDays: 7,
      distanceKm: 999,
      requester: "Farmácia Central",
      city: "Lisboa",
      urgent: true,
      notes: "Preferência por lotes com validade > 2 meses. Entrega em horário laboral.",
      createdAt: new Date().toLocaleString("pt-PT"),
      createdAtTs: now - 1000 * 60 * 40
    },
    {
      id: "REQ-1002",
      title: "Procuro Spray Nasal (15ml) — solução salina",
      category: "gripe",
      substance: "solução salina",
      quantity: 12,
      maxPrice: 5.50,
      deadlineDays: 5,
      distanceKm: 8.9,
      requester: "Farmácia do Parque",
      city: "Oeiras",
      urgent: false,
      notes: "Pode ser marca equivalente. Pagamento por referência/transferência (demo).",
      createdAt: new Date().toLocaleString("pt-PT"),
      createdAtTs: now - 1000 * 60 * 15
    },
    {
      id: "REQ-1003",
      title: "Procuro Vitamina C 1000mg (30 comp.)",
      category: "vitaminas",
      substance: "áccido ascórbico",
      quantity: 25,
      maxPrice: 4.80,
      deadlineDays: 10,
      distanceKm: 2.4,
      requester: "Farmácia Luz",
      city: "Lisboa",
      urgent: false,
      notes: "Aceitamos várias marcas. Importante fatura simplificada (demo).",
      createdAt: new Date().toLocaleString("pt-PT"),
      createdAtTs: now - 1000 * 60 * 5
    }
  ];

  PS.saveRequests(demo);
  PS.showToast("Pedidos de exemplo gerados");
  applyFilters();
}

function openCreateRequest() {
  const body = `
    <div class="field">
      <label>Título</label>
      <input id="fTitle" placeholder="Ex.: Procuro Ibuprofeno 400mg (20 comp.)" />
    </div>
    <div class="field">
      <label>Categoria</label>
      <select id="fCategory">
        <option value="analgesicos">Analgésicos</option>
        <option value="antibioticos">Antibióticos</option>
        <option value="dermo">Dermo</option>
        <option value="gripe">Gripe &amp; Constipação</option>
        <option value="vitaminas">Vitaminas</option>
      </select>
    </div>
    <div class="field">
      <label>Substância ativa (opcional)</label>
      <input id="fSub" placeholder="Ex.: ibuprofeno" />
    </div>
    <div class="field">
      <label>Quantidade</label>
      <input id="fQty" type="number" min="1" value="10" />
    </div>
    <div class="field">
      <label>Preço máximo (€)</label>
      <input id="fMax" type="number" min="0" step="0.1" value="5.0" />
    </div>
    <div class="field">
      <label>Prazo (dias)</label>
      <input id="fDeadline" type="number" min="1" value="7" />
    </div>
    <div class="field">
      <label>Urgente?</label>
      <select id="fUrgent">
        <option value="false" selected>Não</option>
        <option value="true">Sim</option>
      </select>
    </div>
    <div class="field">
      <label>Notas</label>
      <textarea id="fNotes" placeholder="Condições, validade mínima, entrega, etc."></textarea>
    </div>
  `;

  openModal("Criar pedido", body, "Publicar");

  $("#modalOk").onclick = () => {
    const title = $("#fTitle").value.trim();
    if (!title) {
      PS.showToast("Título é obrigatório");
      return;
    }

    const reqs = PS.loadRequests();
    const id = `REQ-${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = Date.now();

    reqs.unshift({
      id,
      title,
      category: $("#fCategory").value,
      substance: $("#fSub").value.trim(),
      quantity: Number($("#fQty").value) || 1,
      maxPrice: Number($("#fMax").value) || 0,
      deadlineDays: Number($("#fDeadline").value) || 7,
      urgent: $("#fUrgent").value === "true",
      distanceKm: 999.0,
      requester: "Farmácia Central (Demo)",
      city: "Lisboa",
      notes: $("#fNotes").value.trim(),
      createdAt: new Date().toLocaleString("pt-PT"),
      createdAtTs: now
    });

    PS.saveRequests(reqs);
  closeModal();
  PS.showToast(`Pedido publicado: ${id}`);
  applyFilters();

  // ✅ depois de publicar, mostrar matches (menuzinho)
  openMatchesModal(reqs[0]); // como fizeste unshift, o novo pedido está em [0]

  };
}

function openRespond(requestId) {
  const reqs = PS.loadRequests();
  const r = reqs.find((x) => x.id === requestId);
  if (!r) return;

  const body = `
    <div><strong>${r.title}</strong></div>
    <div style="color:rgba(255,255,255,0.65); font-size:12px">
      ${r.requester} • ${r.city} • Qtd: ${r.quantity} • Máx: ${formatEur(r.maxPrice)}
    </div>
    <div class="field">
      <label>Preço proposto (€)</label>
      <input id="pPrice" type="number" min="0" step="0.1"
             value="${Math.min(r.maxPrice, r.maxPrice * 0.95).toFixed(2)}" />
    </div>
    <div class="field">
      <label>Quantidade disponível</label>
      <input id="pQty" type="number" min="1" value="${Math.min(r.quantity, 10)}" />
    </div>
    <div class="field">
      <label>Validade (dias até expirar)</label>
      <input id="pExpiry" type="number" min="1" value="30" />
    </div>
    <div class="field">
      <label>Mensagem</label>
      <textarea id="pMsg" placeholder="Condições, horário de recolha/entrega, lote, etc."></textarea>
    </div>
  `;

  openModal("Responder ao pedido", body, "Enviar proposta");

  $("#modalOk").onclick = () => {
    const responses = PS.loadResponses();
    const resp = {
      id: `RSP-${Math.floor(Math.random() * 9000 + 1000)}`,
      requestId: r.id,
      responder: "Farmácia Oriente (Demo)",
      price: Number($("#pPrice").value) || 0,
      quantity: Number($("#pQty").value) || 1,
      expiryDays: Number($("#pExpiry").value) || 30,
      message: $("#pMsg").value.trim(),
      createdAt: new Date().toLocaleString("pt-PT")
    };

    responses.unshift(resp);
    PS.saveResponses(responses);

    closeModal();
    PS.showToast(`Proposta enviada: ${resp.id}`);
  };
}

function openDetails(requestId) {
  const reqs = PS.loadRequests();
  const r = reqs.find((x) => x.id === requestId);
  if (!r) return;

  const body = `
    <div><strong>${r.title}</strong></div>
    <div style="color:rgba(255,255,255,0.65); font-size:12px">
      ${r.requester} • ${r.city} • ${r.distanceKm.toFixed(1)} km
    </div>
    <div class="pills" style="margin-top:10px">
      <span class="pill">${labelCategory(r.category)}</span>
      <span class="pill">Qtd: ${r.quantity}</span>
      <span class="pill">Máx: ${formatEur(r.maxPrice)}</span>
      <span class="pill">Prazo: ${r.deadlineDays} dias</span>
      ${r.urgent ? `<span class="pill" style="border-color: rgba(231,76,60,0.45); color:#e74c3c;">URGENTE</span>` : ""}
    </div>
    <div style="margin-top:10px; color:rgba(255,255,255,0.78)">
      ${r.notes ? r.notes : "Sem notas adicionais."}
    </div>
  `;

  openModal("Ofertas encontradas", body, "Fechar");
  $("#modalOk").onclick = closeModal;



  
}

function initOrdersMarketplace() {
  PS.initCommonUI();
  wireModalClose();

  $("#createRequestBtn").addEventListener("click", openCreateRequest);
  $("#seedRequestsBtn").addEventListener("click", seedRequests);

  $("#resetReqBtn").addEventListener("click", () => {
    $("#reqSearch").value = "";
    $("#reqCategory").value = "all";
    $("#reqDistance").value = "9999";
    $("#reqSort").value = "recent";
    applyFilters();
    PS.showToast("Filtros limpos");
  });

  ["#reqSearch", "#reqCategory", "#reqDistance", "#reqSort"].forEach((id) => {
    $(id).addEventListener("input", applyFilters);
    $(id).addEventListener("change", applyFilters);
  });

  $("#reqCards").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "respond") openRespond(id);
  });

  if (PS.loadRequests().length === 0) {
    seedRequests();
    return;
  }

  applyFilters();
}

initOrdersMarketplace();
