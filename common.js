  (() => {
    const $ = (sel) => document.querySelector(sel);

    // Namespace
    window.PS = window.PS || {};

    // -------------------------
    // Toast
    // -------------------------
    function showToast(msg) {
      const toast = $("#toast");
      if (!toast) return;
      toast.textContent = msg;
      toast.hidden = false;
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => (toast.hidden = true), 2200);
    }
    PS.showToast = showToast;

    // -------------------------
    // Sidebar
    // -------------------------
    function openSidebar() {
      const sidebar = $("#sidebar");
      const backdrop = $("#backdrop");
      if (!sidebar || !backdrop) return;
      sidebar.classList.add("is-open");
      sidebar.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
    }

    function closeSidebar() {
      const sidebar = $("#sidebar");
      const backdrop = $("#backdrop");
      if (!sidebar || !backdrop) return;
      sidebar.classList.remove("is-open");
      sidebar.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
    }

    // -------------------------
    // Notifications storage
    // -------------------------
    PS.loadNotifications = function () {
      try { return JSON.parse(localStorage.getItem("ps_notifications") || "[]"); }
      catch { return []; }
    };

    PS.saveNotifications = function (items) {
      localStorage.setItem("ps_notifications", JSON.stringify(items));
    };

    PS.pushNotification = function ({ title, message, kind = "info", href = "" }) {
      const items = PS.loadNotifications();
      const n = {
        id: `NTF-${Math.floor(Math.random() * 900000 + 100000)}`,
        title: title || "Notificação",
        message: message || "",
        kind,              // purchase | request | shipment | info
        href,              // link opcional
        createdAt: new Date().toLocaleString("pt-PT"),
        createdAtTs: Date.now(),
        read: false
      };
      items.unshift(n);
      PS.saveNotifications(items);
      PS.updateNotifBadge();
    };

    PS.markAllNotificationsRead = function () {
      const items = PS.loadNotifications().map(n => ({ ...n, read: true }));
      PS.saveNotifications(items);
      PS.updateNotifBadge();
      PS.renderNotifMenu();
    };

    PS.updateNotifBadge = function () {
      const bell = $("#notifBtn");
      if (!bell) return;

      const unread = PS.loadNotifications().filter(n => !n.read).length;
      const dot = bell.querySelector(".dot");

      if (unread > 0) {
        if (!dot) {
          const d = document.createElement("span");
          d.className = "dot";
          bell.appendChild(d);
        }
      } else {
        if (dot) dot.remove();
      }
    };

    PS.renderNotifMenu = function () {
      const menu = $("#notifMenu");
      const list = $("#notifList");
      const empty = $("#notifEmpty");
      if (!menu || !list || !empty) return;

      const items = PS.loadNotifications().slice(0, 10);
      list.innerHTML = "";

      if (!items.length) {
        empty.hidden = false;
        return;
      }
      empty.hidden = true;

      for (const n of items) {
        const icon =
          n.kind === "purchase" ? "🧾" :
          n.kind === "shipment" ? "🚚" :
          n.kind === "request" ? "📩" : "🔔";

        const row = document.createElement("button");
        row.type = "button";
        row.className = "notif-item" + (n.read ? "" : " is-unread");
        row.innerHTML = `
          <div class="notif-item__icon">${icon}</div>
          <div class="notif-item__main">
            <div class="notif-item__title">${n.title}</div>
            <div class="notif-item__msg">${n.message}</div>
            <div class="notif-item__meta">${n.createdAt}</div>
          </div>
        `;

        row.addEventListener("click", (e) => {
          e.stopPropagation();

          // marcar como lida
          const all = PS.loadNotifications();
          const idx = all.findIndex(x => x.id === n.id);
          if (idx >= 0) {
            all[idx].read = true;
            PS.saveNotifications(all);
            PS.updateNotifBadge();
          }

          // fechar menu
          menu.hidden = true;

          // navegar ou toast
          if (n.href) window.location.href = n.href;
          else PS.showToast(n.title);
        });

        list.appendChild(row);
      }
    };

    PS.toggleNotifMenu = function () {
      const menu = $("#notifMenu");
      if (!menu) return;

      const willOpen = menu.hidden;
      if (!willOpen) {
        menu.hidden = true;
        return;
      }

      PS.renderNotifMenu();
      menu.hidden = false;
    };

    PS.seedNotifications = function () {
      localStorage.removeItem("ps_notifications");
      PS.pushNotification({
        kind: "purchase",
        title: "Compra feita no seu anúncio",
        message: "Prepare a encomenda para recolha (pickup).",
        href: "receipts.html"
      });
      PS.pushNotification({
        kind: "shipment",
        title: "O seu pedido foi respondido",
        message: "A encomenda está a caminho (estafeta).",
        href: "orders.html"
      });
      PS.showToast("Notificações de exemplo geradas");
    };

    // -------------------------
    // Common UI init
    // -------------------------
    // -------------------------
// Ensure notification menu exists (inject if missing)
// -------------------------
function ensureNotifMenuMarkup() {
  const notifBtn = document.querySelector("#notifBtn");
  if (!notifBtn) return;

  // Se já existe o menu, não faz nada
  if (document.querySelector("#notifMenu")) return;

  // Preferimos um wrapper .notif (como no index). Se não existir, criamos um.
  let wrapper = notifBtn.closest(".notif");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "notif";

    // inserir wrapper no sítio do botão e mover o botão para dentro
    notifBtn.parentNode.insertBefore(wrapper, notifBtn);
    wrapper.appendChild(notifBtn);
  }

  // Criar o menu
  const menu = document.createElement("div");
  menu.id = "notifMenu";
  menu.className = "notif-menu";
  menu.hidden = true;

  menu.innerHTML = `
    <div class="notif-menu__head">
      <div class="notif-menu__title">Notificações</div>
      <button id="notifMarkAll" class="btn btn--ghost" type="button">Marcar como lidas</button>
    </div>
    <div id="notifEmpty" class="notif-empty" hidden>Sem notificações.</div>
    <div id="notifList" class="notif-list"></div>
  `;

  wrapper.appendChild(menu);

  // Se nas páginas tens um <span id="notifDot" class="dot"> fixo, remove-o.
  // O common.js gere a bolinha dinamicamente.
  const oldFixedDot = document.querySelector("#notifDot");
  if (oldFixedDot) oldFixedDot.remove();
}

    function initCommonUI() {
       ensureNotifMenuMarkup();

      // sidebar
      $("#menuBtn")?.addEventListener("click", openSidebar);
      $("#closeSidebarBtn")?.addEventListener("click", closeSidebar);
      $("#backdrop")?.addEventListener("click", closeSidebar);

      // notif badge ao arrancar
      PS.updateNotifBadge();

      // notif open/close
      const notifBtn = $("#notifBtn");
      const notifMenu = $("#notifMenu");
      const notifMarkAll = $("#notifMarkAll");

      if (notifBtn && notifMenu) {
        notifBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();            // <- CRUCIAL: não deixar o click “subir”
          PS.toggleNotifMenu();
        });
      }

      if (notifMarkAll) {
        notifMarkAll.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          PS.markAllNotificationsRead();
        });
      }

      // click fora fecha menu (mas sem interferir com o click do botão)
      document.addEventListener("click", (e) => {
        const menu = $("#notifMenu");
        const btn = $("#notifBtn");
        if (!menu || !btn) return;

        const inside = menu.contains(e.target) || btn.contains(e.target);
        if (!inside) menu.hidden = true;
      });
    }

    PS.initCommonUI = initCommonUI;

    document.addEventListener("DOMContentLoaded", initCommonUI);
  })();
  // =====================================================
  // HARD FIX: Notification click handler (capture phase)
  // - Apanha cliques no sino mesmo se outros scripts bloquearem
  // =====================================================
  (function hardFixNotifClicks(){
    function $(sel){ return document.querySelector(sel); }

    // handler em captura: corre ANTES de bubble/stopPropagation de outros
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#notifBtn");
      if (!btn) return;

      // Se o click foi no sino, não deixar o browser fazer nada estranho
      e.preventDefault();
      e.stopPropagation();

      if (window.PS && typeof PS.toggleNotifMenu === "function") {
        PS.toggleNotifMenu();
      } else {
        console.warn("[PS] toggleNotifMenu não existe");
      }
    }, true); // <- CAPTURE = true

    // botão "Marcar como lidas" também em captura
    document.addEventListener("click", (e) => {
      const mark = e.target.closest("#notifMarkAll");
      if (!mark) return;

      e.preventDefault();
      e.stopPropagation();

      if (window.PS && typeof PS.markAllNotificationsRead === "function") {
        PS.markAllNotificationsRead();
      }
    }, true);

    // click fora fecha menu (em captura, mas sem interferir com o sino)
    document.addEventListener("click", (e) => {
      const menu = $("#notifMenu");
      const btn  = $("#notifBtn");
      if (!menu || !btn) return;

      const inside = menu.contains(e.target) || btn.contains(e.target);
      if (!inside) menu.hidden = true;
    }, true);
  })();
