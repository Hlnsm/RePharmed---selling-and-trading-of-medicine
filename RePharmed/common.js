(function () {
  const $ = (sel) => document.querySelector(sel);

  window.PS = window.PS || {};

  function showToast(msg) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.hidden = true), 2200);
  }

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

  function initCommonUI() {
    const menuBtn = $("#menuBtn");
    const closeBtn = $("#closeSidebarBtn");
    const backdrop = $("#backdrop");

    // Se algum estiver null, o problema é HTML diferente / ids errados
    if (!menuBtn) console.warn("[PS] Falta #menuBtn nesta página.");
    if (!closeBtn) console.warn("[PS] Falta #closeSidebarBtn nesta página.");
    if (!backdrop) console.warn("[PS] Falta #backdrop nesta página.");

    menuBtn?.addEventListener("click", openSidebar);
    closeBtn?.addEventListener("click", closeSidebar);
    backdrop?.addEventListener("click", closeSidebar);

    const notifBtn = $("#notifBtn");
    const notifDot = $("#notifDot");
    notifBtn?.addEventListener("click", () => {
      if (!notifDot) return;
      const wasVisible = !notifDot.hidden;
      notifDot.hidden = wasVisible;
      showToast(wasVisible ? "Notificações marcadas como vistas" : "Tens novas notificações (demo)");
    });
  }

  PS.showToast = showToast;
  PS.initCommonUI = initCommonUI;

  // ✅ auto init em todas as páginas
  document.addEventListener("DOMContentLoaded", initCommonUI);
})();
