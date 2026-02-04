// Common UI helpers (sidebar, backdrop, notifications, toast)
const $ = (sel) => document.querySelector(sel);

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
  const closeSidebarBtn = $("#closeSidebarBtn");
  const backdrop = $("#backdrop");

  menuBtn?.addEventListener("click", openSidebar);
  closeSidebarBtn?.addEventListener("click", closeSidebar);
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

document.addEventListener("DOMContentLoaded", initCommonUI);
