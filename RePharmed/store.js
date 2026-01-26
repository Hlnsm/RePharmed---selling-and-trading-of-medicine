const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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

function badgeForExpiry(days) {
  if (days <= 7) return { cls: "badge--bad", text: `Expira em ${days} dias` };
  if (days <= 21) return { cls: "badge--warn", text: `Expira em ${days} dias` };
  return { cls: "badge--good", text: `Expira em ${days} dias` };
}

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
      s += Math.max(0, (30 - it.expiresInDays)) / 30;
      s += Math.max(0, (10 - it.distanceKm)) / 10;
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

  cards.innerHTML = "";

  if (!items.length) {
    emptyState.hidden = false;
    resultCount.textContent = "0 anúncios";
    return;
  }

  emptyState.hidden = true;
  resultCount.textContent = `${items.length} anúncio(s)`;

  for (const it of items) {
    const b = badgeForExpiry(it.expiresInDays);

    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="card__media">
        <img class="card__img" src="${it.image || 'images/placeholder.jpg'}" alt="${it.name}" loading="lazy">
        <div class="badge ${b.cls}">${b.text}</div>
      </div>
      <div class="card__body">
        <div class="card__title">${it.name}</div>
        <div class="card__sub">
          ${it.seller} • ${it.city} • ${it.distanceKm.toFixed(1)} km • Stock: ${it.stock}
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
          <button class="btn" data-action="details" data-id="${it.id}">Ver</button>
          <button class="btn btn--primary" data-action="order" data-id="${it.id}">Pedir</button>
        </div>
      </div>
    `;
    cards.appendChild(el);
  }
}

function applyFilters() {
  const q = normalize(document.querySelector("#searchInput").value.trim());
  const cat = document.querySelector("#categorySelect").value;
  const dMax = Number(document.querySelector("#distanceSelect").value);
  const pMinRaw = document.querySelector("#priceMin").value;
  const pMaxRaw = document.querySelector("#priceMax").value;
  const pMin = pMinRaw === "" ? null : Number(pMinRaw);
  const pMax = pMaxRaw === "" ? null : Number(pMaxRaw);
  const sortMode = document.querySelector("#sortSelect").value;

  let items = PS.listings.slice();

  if (q) {
    items = items.filter((it) => normalize(`${it.name} ${it.activeSubstance} ${it.lab} ${it.seller} ${it.city}`).includes(q));
  }
  if (cat !== "all") items = items.filter((it) => it.category === cat);
  items = items.filter((it) => it.distanceKm <= dMax);
  if (pMin !== null && !Number.isNaN(pMin)) items = items.filter((it) => it.price >= pMin);
  if (pMax !== null && !Number.isNaN(pMax)) items = items.filter((it) => it.price <= pMax);

  items = applySort(items, sortMode, q);
  renderCards(items);
}

function addOrderFromListing(listingId) {
  const it = PS.listings.find((x) => x.id === listingId);
  if (!it) return;

  const orders = PS.loadOrders();
  const order = {
    id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
    itemName: it.name,
    seller: it.seller,
    status: "Enviado",
    createdAt: new Date().toLocaleString("pt-PT"),
    total: it.price
  };
  orders.unshift(order);
  PS.saveOrders(orders);

  PS.showToast(`Pedido criado: ${order.id}`);
  // navegar para pedidos
  window.location.href = "orders.html";
}

function initStore() {
  PS.initCommonUI();

  const searchInput = document.querySelector("#searchInput");
  const clearBtn = document.querySelector("#clearSearchBtn");

  searchInput.addEventListener("input", () => {
    clearBtn.hidden = searchInput.value.trim().length === 0;
    applyFilters();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.hidden = true;
    applyFilters();
  });

  ["#categorySelect", "#priceMin", "#priceMax", "#distanceSelect", "#sortSelect"].forEach((id) => {
    document.querySelector(id).addEventListener("input", applyFilters);
    document.querySelector(id).addEventListener("change", applyFilters);
  });

  document.querySelector("#resetBtn").addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.hidden = true;
    document.querySelector("#categorySelect").value = "all";
    document.querySelector("#priceMin").value = "";
    document.querySelector("#priceMax").value = "";
    document.querySelector("#distanceSelect").value = "9999";
    document.querySelector("#sortSelect").value = "relevance";
    applyFilters();
    PS.showToast("Filtros limpos");
  });

  document.querySelector("#newListingBtn").addEventListener("click", () => {
    PS.showToast("Demo: criar anúncio (próximo passo)");
  });

  document.querySelector("#cards").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "details") {
      const it = PS.listings.find((x) => x.id === id);
      if (it) PS.showToast(`${it.name} — ${formatEur(it.price)} — ${it.seller}`);
    } else if (action === "order") {
      addOrderFromListing(id);
    }
  });

  applyFilters();
}

initStore();
