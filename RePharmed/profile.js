function initProfile() {
  PS.initCommonUI();

  const prefNotif = document.querySelector("#prefNotif");
  const prefNear = document.querySelector("#prefNear");
  const saveBtn = document.querySelector("#savePrefsBtn");

  // carregar prefs
  const prefs = JSON.parse(localStorage.getItem("ps_prefs") || "{}");
  if (typeof prefs.notif === "boolean") prefNotif.checked = prefs.notif;
  if (typeof prefs.near5 === "boolean") prefNear.checked = prefs.near5;

  saveBtn.addEventListener("click", () => {
    localStorage.setItem("ps_prefs", JSON.stringify({
      notif: prefNotif.checked,
      near5: prefNear.checked
    }));
    PS.showToast("Preferências guardadas");
  });
}

initProfile();
