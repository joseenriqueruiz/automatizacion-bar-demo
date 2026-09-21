(function applySiteConfig() {
  const config = window.BAR_DEMO_CONFIG;
  if (!config) return;
  const read = (path) => path.split(".").reduce((value, key) => value && value[key], config);
  document.querySelectorAll("[data-config]").forEach((element) => {
    const value = read(element.dataset.config);
    if (value !== undefined && value !== null) element.textContent = value;
  });
  const page = document.body.dataset.page || "landing";
  const suffixes = { landing: config.identity.tagline, menu: "Carta digital demo", team: "Panel del equipo demo", owner: "Panel del dueño demo", setup: "QR de mesas demo" };
  document.title = `${config.identity.name} · ${suffixes[page] || "Demo"}`;
  document.querySelectorAll("[data-config-brand-label]").forEach((element) => element.setAttribute("aria-label", `${config.identity.name}, volver al inicio`));
})();
