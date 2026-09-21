const configuredPublicUrl = window.BAR_DEMO_CONFIG?.deployment?.publicUrl?.trim();
const siteOrigin = configuredPublicUrl
  ? `${configuredPublicUrl.replace(/\/$/, "")}/`
  : `${window.location.origin}/`;
const qrImagesReady = Boolean(configuredPublicUrl && window.BAR_DEMO_CONFIG?.deployment?.qrImagesReady);
const grid = document.querySelector("#qr-grid");
const toast = document.querySelector("#config-toast");
const printButton = document.querySelector("#print-all");
const destination = document.querySelector("#qr-destination");

destination.textContent = configuredPublicUrl
  ? `Destino: ${siteOrigin.replace("https://", "")}`
  : "Destino público pendiente";
if (!qrImagesReady) {
  printButton.innerHTML = '<span aria-hidden="true">!</span> Publicar para habilitar QR';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

for (let table = 1; table <= 12; table += 1) {
  const number = String(table).padStart(2, "0");
  const url = `${siteOrigin}?mesa=${number}`;
  const card = document.createElement("article");
  card.className = `qr-card${qrImagesReady ? "" : " qr-card--pending"}`;
  card.innerHTML = `
    <div class="qr-card-heading"><span>Mesa</span><strong>${number}</strong></div>
    ${qrImagesReady
      ? `<img src="assets/qr/mesa-${number}.png" alt="Código QR para abrir la carta de la Mesa ${number}" loading="lazy">`
      : `<div class="qr-pending" role="img" aria-label="Código QR pendiente para la Mesa ${number}"><span aria-hidden="true">▦</span><strong>QR al publicar</strong><small>Mesa ${number}</small></div>`}
    <p>${siteOrigin.replace("https://", "")}?mesa=${number}</p>
    <div class="qr-actions">
      <a href="index.html?mesa=${number}" target="_blank" rel="noreferrer">Probar carta</a>
      <button type="button" data-copy="${url}">${configuredPublicUrl ? "Copiar enlace" : "Copiar enlace local"}</button>
    </div>
  `;
  grid.append(card);
}

grid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    showToast("Enlace de la mesa copiado");
  } catch {
    showToast("No se pudo copiar automáticamente");
  }
});

printButton.addEventListener("click", () => {
  if (!qrImagesReady) {
    showToast("Primero definí la dirección pública y generá los QR definitivos");
    return;
  }
  window.print();
});
