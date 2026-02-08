/* store.js (Create listing + persist + notifications) */

const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// --- Checkout pricing / simulation knobs (demo) ---
const COURIER_FEE_EUR = 4.90;
const PICKUP_FEE_EUR = 0.00;
const PICKUP_READY_MIN = 60;
const PAYMENT_SIM_MS = 1100;

// listings persistence
const LS_LISTINGS_KEY = "ps_listings_v1";

function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatEur(v) {
  return Number(v || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function labelCategory(cat) {
  return ({
    analgesicos: "Analgésicos",
    antibioticos: "Antibióticos",
    dermo: "Dermo",
    gripe: "Gripe & Constipação",
    vitaminas: "Vitaminas",
    outros: "Outros",
  })[cat] || "Outros";
}

function badgeForExpiry(days) {
  if (days <= 3) return { cls: "badge--bad", text: `Expira em ${days} meses` };
  if (days <= 7) return { cls: "badge--warn", text: `Expira em ${days} meses` };
  return { cls: "badge--good", text: `Expira em ${days} meses` };
}

/* =========================
   LISTINGS persistence
   ========================= */

function loadListings() {
  try {
    const raw = localStorage.getItem(LS_LISTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // fallback seed do data.js
  const seed = Array.isArray(window.PS?.listings) ? window.PS.listings.slice() : [];
  saveListings(seed);
  return seed;
}

function saveListings(items) {
  try {
    localStorage.setItem(LS_LISTINGS_KEY, JSON.stringify(items || []));
  } catch {}
}

function setListings(items) {
  // manter também em memória (para compatibilidade com outros ficheiros)
  window.PS = window.PS || {};
  window.PS.listings = items;
  saveListings(items);
}

function ensureListingsLoaded() {
  const items = loadListings();
  setListings(items);
}

/* =========================
   Sorting / rendering
   ========================= */

function applySort(items, mode, query) {
  const arr = items.slice();

  if (mode === "price_asc") arr.sort((a, b) => a.price - b.price);
  else if (mode === "price_desc") arr.sort((a, b) => b.price - a.price);
  else if (mode === "expiry_asc") arr.sort((a, b) => a.expiresInDays - b.expiresInDays);
  else if (mode === "distance_asc") arr.sort((a, b) => a.distanceKm - b.distanceKm);
  else {
    const q = normalize(query || "");
    if (!q) return arr;

    const score = (it) => {
      const name = normalize(it.name);
      const sub = normalize(it.activeSubstance);
      const lab = normalize(it.lab);
      let s = 0;
      if (name.includes(q)) s += 3;
      if (sub.includes(q)) s += 2;
      if (lab.includes(q)) s += 1;
      s += Math.max(0, (30 - Number(it.expiresInDays || 999))) / 30;
      s += Math.max(0, (10 - Number(it.distanceKm || 999))) / 10;
      return s;
    };

    arr.sort((a, b) => score(b) - score(a));
  }
  return arr;
}

function renderCards(items) {
  const cards = document.querySelector("#cards");
  const emptyState = document.querySelector("#emptyState");
  const resultCount = document.querySelector("#resultCount");

  if (!cards || !emptyState || !resultCount) {
    console.warn("IDs em falta no index.html:", {
      cards: !!cards, emptyState: !!emptyState, resultCount: !!resultCount
    });
    return;
  }

  cards.innerHTML = "";

  if (!items.length) {
    emptyState.hidden = false;
    resultCount.textContent = "0 anúncios";
    return;
  }

  emptyState.hidden = true;
  resultCount.textContent = `${items.length} anúncio(s)`;

  for (const it of items) {
    const b = badgeForExpiry(Number(it.expiresInDays || 0));

    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="card__media">
        <img class="card__img" src="${it.image || "images/placeholder.jpg"}" alt="${it.name}" loading="lazy">
        <div class="badge ${b.cls}">${b.text}</div>
      </div>
      <div class="card__body">
        <div class="card__title">${it.name}</div>
        <div class="card__sub">
          ${it.seller} • ${it.city} • ${Number(it.distanceKm || 0).toFixed(1)} km • Stock: ${it.stock}
        </div>
        <div class="pills">
          <span class="pill">${labelCategory(it.category)}</span>
          <span class="pill">${it.discountPct}% desconto</span>
          <span class="pill">${it.lab}</span>
        </div>
      </div>
      <div class="card__footer">
        <div>
          <div class="price">${formatEur(it.price)}</div>
          <div class="small">ID: ${it.id}</div>
        </div>
        <div class="card__cta">
          <button class="btn btn--primary" data-action="order" data-id="${it.id}">Pedir</button>
        </div>
      </div>
    `;
    cards.appendChild(el);
  }
}

function applyFilters() {
  const q = normalize((document.querySelector("#searchInput")?.value || "").trim());
  const cat = document.querySelector("#categorySelect")?.value || "all";
  const dMax = Number(document.querySelector("#distanceSelect")?.value || 9999);

  const pMinRaw = document.querySelector("#priceMin")?.value ?? "";
  const pMaxRaw = document.querySelector("#priceMax")?.value ?? "";
  const pMin = pMinRaw === "" ? null : Number(pMinRaw);
  const pMax = pMaxRaw === "" ? null : Number(pMaxRaw);

  const sortMode = document.querySelector("#sortSelect")?.value || "relevance";

  let items = Array.isArray(window.PS?.listings) ? window.PS.listings.slice() : [];

  items = items.filter(it => Number(it.stock || 0) > 0); 

  if (q) {
    items = items.filter((it) =>
      normalize(`${it.name} ${it.activeSubstance} ${it.lab} ${it.seller} ${it.city}`).includes(q)
    );
  }
  if (cat !== "all") items = items.filter((it) => it.category === cat);
  items = items.filter((it) => Number(it.distanceKm || 0) <= dMax);
  if (pMin !== null && !Number.isNaN(pMin)) items = items.filter((it) => Number(it.price || 0) >= pMin);
  if (pMax !== null && !Number.isNaN(pMax)) items = items.filter((it) => Number(it.price || 0) <= pMax);

  items = applySort(items, sortMode, q);
  renderCards(items);
}

/* =========================
   Checkout
   ========================= */

function openReceiptSuccess(receipt) {
  const modal = document.querySelector("#checkoutModal");
  const body = document.querySelector("#checkoutBody");
  const payBtn = document.querySelector("#checkoutPay");

  if (!modal || !body || !payBtn) return;

  payBtn.disabled = false;
  payBtn.textContent = "Fechar";
  payBtn.onclick = () => close();

  const pickupHtml = receipt.pickupCode
    ? `<div class="kv">
         <div class="k">Código de levantamento</div>
         <div class="v"><span class="pickup-code">${receipt.pickupCode}</span></div>
         <div class="small">Pronto por volta das <strong>${receipt.pickupReadyAt || "—"}</strong> (~${PICKUP_READY_MIN} min).</div>
       </div>`
    : "";

  const trackingHtml = receipt.tracking
    ? `<div class="kv">
         <div class="k">Tracking</div>
         <div class="v">${receipt.tracking.code}</div>
         <div class="small">Vê mais em Recibos.</div>
       </div>`
    : "";

  body.innerHTML = `
    <div style="font-weight:950; font-size:18px;">✅ Pedido criado</div>
    <div class="small">Recibo: <strong>${receipt.id}</strong> • Referência: <strong>${receipt.ref}</strong></div>
    <div class="hr"></div>

    <div class="detail-grid">
      <div class="kv"><div class="k">Item</div><div class="v">${receipt.item}</div></div>
      <div class="kv"><div class="k">Quantidade</div><div class="v">${receipt.quantity}</div></div>
      <div class="kv"><div class="k">Subtotal</div><div class="v">${formatEur(receipt.subtotal ?? receipt.total)}</div></div>
      <div class="kv"><div class="k">Entrega</div><div class="v">${formatEur(receipt.deliveryFee ?? 0)}</div></div>
      <div class="kv"><div class="k">Total</div><div class="v">${formatEur(receipt.total)}</div></div>
      <div class="kv"><div class="k">Vendedor</div><div class="v">${receipt.counterparty}</div></div>
      <div class="kv"><div class="k">Método</div><div class="v">${receipt.deliveryMethod === "pickup" ? "Ir buscar" : "Estafeta"}</div></div>
    </div>

    <div class="hr"></div>
    ${pickupHtml}
    ${trackingHtml}
    <div class="small">Podes ver este movimento em <strong>Recibos</strong>.</div>
  `;

  function close() {
    modal.hidden = true;
    payBtn.textContent = "Confirmar";
  }

  document.querySelector("#checkoutClose").onclick = close;
  document.querySelector("#checkoutCancel").onclick = close;
  modal.onclick = (e) => { if (e.target.id === "checkoutModal") close(); };

  modal.hidden = false;
}

function openCheckoutModal(listing) {
  const modal = document.querySelector("#checkoutModal");
  const body = document.querySelector("#checkoutBody");
  const payBtn = document.querySelector("#checkoutPay");

  if (!modal || !body || !payBtn) {
    window.PS?.showToast?.("Checkout modal não encontrado (index.html)");
    return;
  }

  payBtn.textContent = "Confirmar";
  payBtn.disabled = false;

  const finalPrice = Math.max(0, (Number(listing.price || 0)) * (1 - (Number(listing.discountPct || 0)) / 100));

  body.innerHTML = `
    <div style="font-weight:900; margin-bottom:6px">${listing.name}</div>
    <div style="color:rgba(255,255,255,0.72); font-size:12px">
      Vendedor: ${listing.seller} • ${listing.city} • ${Number(listing.distanceKm || 0).toFixed(1)} km
    </div>

    <div class="hr"></div>

    <div class="detail-grid">
      <div class="kv">
        <div class="k">Preço unitário</div>
        <div class="v">${formatEur(finalPrice)}</div>
      </div>
      <div class="kv">
        <div class="k">Stock disponível</div>
        <div class="v">${listing.stock}</div>
      </div>
    </div>

    <div class="field">
      <label>Quantidade a comprar</label>
      <input id="ckQty" type="number" min="1" max="${listing.stock}" value="1" />
    </div>

    <div class="field">
      <label>Método de entrega</label>
      <select id="ckDelivery">
        <option value="courier">Entrega por estafeta (24–48h)</option>
        <option value="pickup">Ir buscar à farmácia — gera código</option>
      </select>
    </div>

    <div id="pickupBox" class="kv" style="display:none">
      <div class="k">Código de levantamento</div>
      <div class="v"><span id="pickupCode" class="pickup-code">—</span></div>
      <div class="small">Apresentar este código no balcão para levantar.</div>
    </div>

    <div class="hr"></div>

    <div class="field">
      <label>Dados de pagamento (falso)</label>
      <input id="ckName" placeholder="Nome" value="Farmácia Demo" />
      <div style="height:8px"></div>
      <input id="ckCard" placeholder="Nº cartão (demo) 4242 4242 4242 4242" value="4242 4242 4242 4242" />
      <div style="height:8px"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <input id="ckExp" placeholder="MM/AA" value="12/30" />
        <input id="ckCvv" placeholder="CVV" value="123" />
      </div>
      <div class="small">Isto é um protótipo: nenhum pagamento real é processado.</div>
    </div>

    <div class="detail-grid">
      <div class="kv">
        <div class="k">Subtotal</div>
        <div id="ckSubtotal" class="v">—</div>
      </div>
      <div class="kv">
        <div class="k">Entrega</div>
        <div id="ckFee" class="v">—</div>
      </div>
      <div class="kv">
        <div class="k">Total</div>
        <div id="ckTotal" class="v">—</div>
      </div>
    </div>

    <div id="payStatus" class="small" style="margin-top:10px;"></div>
  `;

  const qtyEl = document.querySelector("#ckQty");
  const delEl = document.querySelector("#ckDelivery");
  const pickupBox = document.querySelector("#pickupBox");
  const pickupCodeEl = document.querySelector("#pickupCode");
  const subtotalEl = document.querySelector("#ckSubtotal");
  const feeEl = document.querySelector("#ckFee");
  const totalEl = document.querySelector("#ckTotal");
  const payStatusEl = document.querySelector("#payStatus");

  let pickupCode = "";

  function recalc() {
    const qty = Math.max(1, Math.min(Number(qtyEl.value || 1), Number(listing.stock || 0)));
    qtyEl.value = String(qty);

    const isPickup = delEl.value === "pickup";
    const deliveryFee = isPickup ? PICKUP_FEE_EUR : COURIER_FEE_EUR;

    const subtotal = finalPrice * qty;
    const total = subtotal + deliveryFee;

    subtotalEl.textContent = formatEur(subtotal);
    feeEl.textContent = formatEur(deliveryFee);
    totalEl.textContent = formatEur(total);

    pickupBox.style.display = isPickup ? "" : "none";

    if (isPickup && !pickupCode) {
      pickupCode = window.PS?.genPickupCode?.() || "PUP-DEMO";
      pickupCodeEl.textContent = pickupCode;
    }
    if (!isPickup) pickupCode = "";
  }

  delEl.addEventListener("change", recalc);
  qtyEl.addEventListener("input", recalc);
  recalc();

  function close() { modal.hidden = true; }
  modal.hidden = false;

  document.querySelector("#checkoutClose").onclick = close;
  document.querySelector("#checkoutCancel").onclick = close;
  modal.onclick = (e) => { if (e.target.id === "checkoutModal") close(); };

  payBtn.onclick = () => {
    const qty = Number(qtyEl.value || 1);
    if (!qty || qty < 1 || qty > Number(listing.stock || 0)) { window.PS?.showToast?.("Quantidade inválida"); return; }

    const name = document.querySelector("#ckName").value.trim();
    const card = document.querySelector("#ckCard").value.trim();
    if (!name || card.replace(/\s/g, "").length < 12) { window.PS?.showToast?.("Preenche nome e cartão (demo)"); return; }

    const delivery = delEl.value;
    const isPickup = delivery === "pickup";

    const deliveryFee = isPickup ? PICKUP_FEE_EUR : COURIER_FEE_EUR;
    const subtotal = finalPrice * qty;
    const total = subtotal + deliveryFee;

    payBtn.disabled = true;
    const oldTxt = payBtn.textContent;
    payBtn.textContent = "A processar pagamento…";
    if (payStatusEl) payStatusEl.textContent = "A validar dados e a confirmar transação…";

    setTimeout(() => {
      const receipts = window.PS?.loadReceipts?.() || [];
      const now = new Date();
      const nowStr = now.toLocaleString("pt-PT");

      const rcId = `RC-${Math.floor(Math.random() * 9000 + 1000)}`;
      const ref = `ORD-${Math.floor(Math.random() * 9000 + 1000)}`;

      let pickupReadyAtTs = null;
      let pickupReadyAt = null;
      if (isPickup) {
        pickupReadyAtTs = now.getTime() + PICKUP_READY_MIN * 60 * 1000;
        pickupReadyAt = new Date(pickupReadyAtTs).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
      }

      const usedPickupCode = isPickup ? (pickupCode || (window.PS?.genPickupCode?.() || "PUP-DEMO")) : null;

      const receipt = {
        id: rcId,
        type: isPickup ? "purchase" : "delivery",
        status: isPickup ? "A levantar" : "A preparar",
        createdAt: nowStr,

        counterparty: listing.seller,
        city: listing.city,
        item: listing.name,
        quantity: qty,

        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),

        ref,
        deliveryMethod: delivery,

        notes: isPickup
          ? `Levantamento em loja. Código: ${usedPickupCode}. Pronto por volta das ${pickupReadyAt}.`
          : `Entrega por estafeta. Taxa: ${deliveryFee.toFixed(2)}€`,

        tracking: (!isPickup)
          ? {
              code: `TRK-PT-${Math.floor(Math.random() * 900000 + 100000)}`,
              stage: 1,
              steps: [
                { title: "A preparar", at: nowStr },
                { title: "A caminho", at: "" },
                { title: "Entregue", at: "" }
              ]
            }
          : null,

        pickupCode: usedPickupCode,
        pickupReadyAtTs,
        pickupReadyAt,

        // snapshot do anúncio (stats)
        listingId: listing.id,
        category: listing.category,
        discountPct: Number(listing.discountPct || 0),
        expiresInDays: Number(listing.expiresInDays ?? null),
        baseUnitPrice: Number((listing.price || 0).toFixed(2)),
        finalUnitPrice: Number(finalPrice.toFixed(2))
      };

      receipts.unshift(receipt);
      window.PS?.saveReceipts?.(receipts);

      // atualizar stock + persistir listings
      const all = Array.isArray(window.PS?.listings) ? window.PS.listings.slice() : [];
      const idx = all.findIndex(x => x.id === listing.id);
      if (idx >= 0) {
        all[idx].stock = Math.max(0, Number(all[idx].stock || 0) - qty);
        setListings(all);
      }

      // ✅ notificação para aparecer no menu (common.js)
      window.PS?.pushNotification?.({
        kind: "purchase",
        title: "Compra concluída (demo)",
        message: `${receipt.item} • ${qty} un. • Total ${formatEur(receipt.total)}`,
        href: "receipts.html"
      });

      if (payStatusEl) payStatusEl.textContent = "Pagamento aprovado ✅";
      payBtn.disabled = false;
      payBtn.textContent = oldTxt;

      modal.hidden = true;
      window.PS?.showToast?.(isPickup ? "Compra criada. Código de levantamento gerado." : "Compra criada. Entrega em andamento.");

      openReceiptSuccess(receipt);

      applyFilters();
    }, PAYMENT_SIM_MS);
  };
}

/* =========================
   Create listing modal
   ========================= */

function openCreateListingModal() {
  const modal = document.querySelector("#newListingModal");
  const body = document.querySelector("#newListingBody");
  const btnCreate = document.querySelector("#newListingCreate");
  if (!modal || !body || !btnCreate) {
    window.PS?.showToast?.("Modal de anúncio não encontrado. Confirma o HTML do newListingModal.");
    return;
  }

  // opções de imagem (as que tens)
  const imgOptions = [
    "images/paracetamol.jpg",
    "images/ibuprofeno.jpg",
    "images/amoxicilina.jpg",
    "images/vitamina-c.jpg",
    "images/spray-nasal.jpg",
    "images/antigripal.jpg",
    "images/dermo-creme.jpg",
    "images/probiotico.jpg"
  ];

  body.innerHTML = `
    <div class="field">
      <label>Nome do medicamento</label>
      <input id="nlName" placeholder="Ex.: Paracetamol 500mg (20 comp.)" />
    </div>

    <div class="field">
      <label>Categoria</label>
      <select id="nlCat">
        <option value="analgesicos">Analgésicos</option>
        <option value="antibioticos">Antibióticos</option>
        <option value="dermo">Dermo</option>
        <option value="gripe">Gripe &amp; Constipação</option>
        <option value="vitaminas">Vitaminas</option>
        <option value="outros">Outros</option>
      </select>
    </div>

    <div class="field">
      <label>Substância ativa</label>
      <input id="nlSub" placeholder="Ex.: paracetamol" />
    </div>

    <div class="field">
      <label>Laboratório / Marca</label>
      <input id="nlLab" placeholder="Ex.: Genéricos Lx" />
    </div>

    <div class="detail-grid">
      <div class="field">
        <label>Preço base (€)</label>
        <input id="nlPrice" type="number" min="0" step="0.1" value="5.0" />
      </div>
      <div class="field">
        <label>Desconto (%)</label>
        <input id="nlDisc" type="number" min="0" max="90" step="1" value="40" />
      </div>
    </div>

    <div class="detail-grid">
      <div class="field">
        <label>Validade (meses até expirar)</label>
        <input id="nlExp" type="number" min="1" step="1" value="14" />
      </div>
      <div class="field">
        <label>Stock</label>
        <input id="nlStock" type="number" min="1" step="1" value="10" />
      </div>
    </div>

    <div class="detail-grid">
      <div class="field">
        <label>Distância (km)</label>
        <input id="nlDist" type="number" min="0" step="0.1" value="3.5" />
      </div>
      <div class="field">
        <label>Cidade</label>
        <input id="nlCity" placeholder="Lisboa" value="Lisboa" />
      </div>
    </div>

    <div class="field">
      <label>Vendedor (farmácia)</label>
      <input id="nlSeller" placeholder="Farmácia Central" value="Farmácia Central (Demo)" />
    </div>

    <div class="field">
      <label>Imagem</label>
      <select id="nlImg">
        ${imgOptions.map(p => `<option value="${p}">${p.replace("images/","")}</option>`).join("")}
      </select>
      <div class="small">Escolhe uma das imagens já existentes no projeto.</div>
    </div>

    <div class="small">Protótipo: o anúncio fica guardado no teu browser (localStorage).</div>
  `;

  function close() { modal.hidden = true; }

  document.querySelector("#newListingClose").onclick = close;
  document.querySelector("#newListingCancel").onclick = close;
  modal.onclick = (e) => { if (e.target.id === "newListingModal") close(); };

  btnCreate.onclick = () => {
    const name = document.querySelector("#nlName").value.trim();
    if (!name) { window.PS?.showToast?.("Nome é obrigatório"); return; }

    const cat = document.querySelector("#nlCat").value;
    const sub = document.querySelector("#nlSub").value.trim();
    const lab = document.querySelector("#nlLab").value.trim() || "—";
    const price = Number(document.querySelector("#nlPrice").value || 0);
    const disc = Number(document.querySelector("#nlDisc").value || 0);
    const exp = Number(document.querySelector("#nlExp").value || 1);
    const stock = Number(document.querySelector("#nlStock").value || 1);
    const dist = Number(document.querySelector("#nlDist").value || 0);
    const city = document.querySelector("#nlCity").value.trim() || "Lisboa";
    const seller = document.querySelector("#nlSeller").value.trim() || "Farmácia Demo";
    const img = document.querySelector("#nlImg").value;

    if (!Number.isFinite(price) || price <= 0) { window.PS?.showToast?.("Preço inválido"); return; }
    if (!Number.isFinite(stock) || stock < 1) { window.PS?.showToast?.("Stock inválido"); return; }
    if (!Number.isFinite(exp) || exp < 1) { window.PS?.showToast?.("Validade inválida"); return; }

    const all = Array.isArray(window.PS?.listings) ? window.PS.listings.slice() : [];
    const nextId = `PS-${String(all.length + 1).padStart(3, "0")}-${Math.floor(Math.random() * 900 + 100)}`;

    const listing = {
      id: nextId,
      name,
      category: cat,
      activeSubstance: sub || name,
      lab,
      price: Number(price.toFixed(2)),
      discountPct: Math.max(0, Math.min(90, Math.round(disc))),
      expiresInDays: Math.round(exp),
      distanceKm: Number(dist.toFixed(1)),
      seller,
      city,
      stock: Math.round(stock),
      image: img
    };

    all.unshift(listing);
    setListings(all);

    // notificação (opcional, fica fixe)
    window.PS?.pushNotification?.({
      kind: "info",
      title: "Anúncio publicado",
      message: `${listing.name} • Stock ${listing.stock} • ${formatEur(listing.price)}`,
      href: "index.html"
    });

    close();
    window.PS?.showToast?.(`Anúncio criado: ${listing.id}`);
    applyFilters();
  };

  modal.hidden = false;
}

/* =========================
   Deep links
   ========================= */

function applyDeepLinkFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const q = params.get("q");
  const cat = params.get("cat");
  const pmax = params.get("pmax");
  const dmax = params.get("dmax");

  const searchInput = document.querySelector("#searchInput");
  const clearBtn = document.querySelector("#clearSearchBtn");

  if (q && searchInput) {
    searchInput.value = q;
    if (clearBtn) clearBtn.hidden = q.trim().length === 0;
  }
  if (cat && document.querySelector("#categorySelect")) document.querySelector("#categorySelect").value = cat;
  if (pmax && document.querySelector("#priceMax")) document.querySelector("#priceMax").value = pmax;

  if (dmax && document.querySelector("#distanceSelect")) {
    const ds = document.querySelector("#distanceSelect");
    const allowed = Array.from(ds.options).map(o => o.value);
    ds.value = allowed.includes(String(dmax)) ? String(dmax) : "9999";
  }

  if (params.get("from") === "request") {
    window.PS?.showToast?.("Filtros aplicados a partir de um pedido");
  }

  applyFilters();

  const openCheckout = params.get("openCheckout") === "1";
  const lid = params.get("lid");
  if (openCheckout && lid) {
    const it = window.PS?.listings?.find(x => x.id === lid);
    if (it) setTimeout(() => openCheckoutModal(it), 0);
  }
}

/* =========================
   Init
   ========================= */

function initStore() {
  window.PS?.initCommonUI?.();

  ensureListingsLoaded();

  const searchInput = document.querySelector("#searchInput");
  const clearBtn = document.querySelector("#clearSearchBtn");

  applyDeepLinkFromUrl();

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (clearBtn) clearBtn.hidden = searchInput.value.trim().length === 0;
      applyFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      clearBtn.hidden = true;
      applyFilters();
    });
  }

  ["#categorySelect", "#priceMin", "#priceMax", "#distanceSelect", "#sortSelect"].forEach((id) => {
    const el = document.querySelector(id);
    if (!el) return;
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  const resetBtn = document.querySelector("#resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (clearBtn) clearBtn.hidden = true;
      const cat = document.querySelector("#categorySelect"); if (cat) cat.value = "all";
      const pmin = document.querySelector("#priceMin"); if (pmin) pmin.value = "";
      const pmax = document.querySelector("#priceMax"); if (pmax) pmax.value = "";
      const dist = document.querySelector("#distanceSelect"); if (dist) dist.value = "9999";
      const sort = document.querySelector("#sortSelect"); if (sort) sort.value = "relevance";
      applyFilters();
      window.PS?.showToast?.("Filtros limpos");
    });
  }

  const newListingBtn = document.querySelector("#newListingBtn");
  if (newListingBtn) newListingBtn.addEventListener("click", openCreateListingModal);

  const cards = document.querySelector("#cards");
  if (cards) {
    cards.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "order") {
        const it = window.PS?.listings?.find((x) => x.id === id);
        if (it) openCheckoutModal(it);
      }
    });
  }

  applyFilters();
}

document.addEventListener("DOMContentLoaded", initStore);
