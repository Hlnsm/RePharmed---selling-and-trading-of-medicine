function formatEur(v) {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function renderOrders() {
  const list = document.querySelector("#ordersList");
  const orders = PS.loadOrders();

  if (!orders.length) {
    list.innerHTML = `
      <div class="empty" style="margin-top:10px">
        <div class="empty__title">Sem pedidos ainda</div>
        <div class="empty__text">Volta à loja e clica em “Pedir” num anúncio.</div>
      </div>
    `;
    return;
  }

  list.innerHTML = orders.map((o) => `
    <div class="list-item">
      <div class="list-item__left">
        <div style="font-weight:900">${o.id} • ${o.status}</div>
        <div style="color:rgba(255,255,255,0.72); font-size:12px">
          ${o.itemName} — ${o.seller}
        </div>
      </div>
      <div class="list-item__right">
        <div>${formatEur(o.total)}</div>
        <div>${o.createdAt}</div>
      </div>
    </div>
  `).join("");
}

function seedOrders() {
  const demo = [
    { id: "ORD-1842", itemName: "Ibuprofeno 400mg (20 comp.)", seller: "Farmácia Oriente", status: "Aceite", createdAt: "25/01/2026 16:12", total: 3.80 },
    { id: "ORD-9011", itemName: "Spray Nasal (15ml)", seller: "Farmácia Tejo", status: "Enviado", createdAt: "25/01/2026 11:03", total: 5.10 }
  ];
  PS.saveOrders(demo);
  renderOrders();
  PS.showToast("Pedidos de exemplo gerados");
}

function clearOrders() {
  PS.saveOrders([]);
  renderOrders();
  PS.showToast("Pedidos limpos");
}

function initOrders() {
  PS.initCommonUI();
  document.querySelector("#seedOrdersBtn").addEventListener("click", seedOrders);
  document.querySelector("#clearOrdersBtn").addEventListener("click", clearOrders);
  renderOrders();
}

initOrders();
