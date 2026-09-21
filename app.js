const products = {
  "tabla-regional": { name: "Mesa de sabores", price: 14500 },
  empanada: { name: "Empanada tucumana", price: 1200 },
  locro: { name: "Locro", price: 9800 },
  "milanesa-plato": { name: "Milanesa con papas", price: 11900 },
  limonada: { name: "Limonada de la casa", price: 4200 },
  "mini-milanesa": { name: "Mini milanesa", price: 7900 },
  "pasta-kids": { name: "Tirabuzones suaves", price: 6800 },
};

const requestedTable = new URLSearchParams(window.location.search).get("mesa");
const parsedTable = requestedTable && /^\d{1,2}$/.test(requestedTable) ? Number(requestedTable) : 7;
const tableNumber = String(parsedTable >= 1 && parsedTable <= 99 ? parsedTable : 7).padStart(2, "0");
const tableLabel = `Mesa ${tableNumber}`;
const setTextIfPresent = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};
setTextIfPresent("#table-number", tableNumber);
setTextIfPresent("#welcome-title", `Hola, estás en la ${tableLabel}`);
setTextIfPresent("#bill-title", `Resumen de la ${tableLabel}`);
setTextIfPresent("#order-table-label", `${tableLabel} · cuenta de Vos`);
setTextIfPresent("#waiter-table-label", `${tableLabel} · solicitud demostrativa`);
setTextIfPresent("#snapshot-table-number", tableNumber);

const extrasDetails = document.querySelector("#extras");
const extrasTargets = new Set(["#promociones", "#reservas", "#ruleta"]);

function revealExtrasTarget() {
  if (!extrasDetails || !extrasTargets.has(window.location.hash)) return;
  extrasDetails.open = true;
  const target = document.querySelector(window.location.hash);
  if (target) window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}

document.querySelectorAll('a[href="#promociones"], a[href="#reservas"], a[href="#ruleta"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (extrasDetails) extrasDetails.open = true;
  });
});
window.addEventListener("hashchange", revealExtrasTarget);
revealExtrasTarget();

const serviceHour = new Date().getHours();
const servicePeriod = serviceHour < 11 ? "Desayuno y cafetería" : serviceHour < 16 ? "Almuerzo" : serviceHour < 20 ? "Merienda" : "Cena";
setTextIfPresent("#service-period", `${servicePeriod} · demostración`);

const dinerState = {
  vos: { name: "Vos", subtotal: 0, cart: {} },
  ana: { name: "Ana", subtotal: 11000, cart: {} },
  lucas: { name: "Lucas", subtotal: 7600, cart: {} },
};
let currentDiner = "vos";
let cart = dinerState[currentDiner].cart;
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const orderBar = document.querySelector("#order-bar");
const itemCount = document.querySelector("#item-count");
const orderTotal = document.querySelector("#order-total");
const reviewBtn = document.querySelector("#review-btn");
const dialog = document.querySelector("#order-dialog");
const orderLines = document.querySelector("#order-lines");
const dialogTotal = document.querySelector("#dialog-total");
const toast = document.querySelector("#toast");
const selectedAllergens = new Set();
const allergyDetail = document.querySelector("#allergy-detail");
const orderNote = document.querySelector("#note");
const tracker = document.querySelector("#estado-pedido");
const trackerSummary = document.querySelector("#tracker-summary");
const waiterDialog = document.querySelector("#waiter-dialog");
const waiterStatus = document.querySelector("#waiter-status");
const waiterBtn = document.querySelector("#waiter-btn");
const sendServiceBtn = document.querySelector("#send-service-btn");
const serviceDetail = document.querySelector("#service-detail");
let selectedService = "";
const paymentSection = document.querySelector("#pago");
const paymentLines = document.querySelector("#payment-lines");
const paymentSubtotal = document.querySelector("#payment-subtotal");
const paymentTip = document.querySelector("#payment-tip");
const paymentTotal = document.querySelector("#payment-total");
const methodPlaceholder = document.querySelector("#method-placeholder");
const staffPaymentPanel = document.querySelector("#staff-payment-panel");
const transferPanel = document.querySelector("#transfer-panel");
const paymentStatus = document.querySelector("#payment-status");
const simulateStaffPayment = document.querySelector("#simulate-staff-payment");
const receiptInput = document.querySelector("#receipt-file");
const receiptPreview = document.querySelector("#receipt-preview");
const confirmTransfer = document.querySelector("#confirm-transfer");
const feedbackCard = document.querySelector("#feedback-card");
const feedbackForm = document.querySelector("#feedback-form");
const feedbackText = document.querySelector("#feedback-text");
const feedbackStatus = document.querySelector("#feedback-status");
const submitFeedback = document.querySelector("#submit-feedback");
let lastOrder = { entries: [], subtotal: 0 };
let tipPercent = 0;
let paymentMethod = "";
let billScope = "mine";
let selectedRating = 0;
let receiptObjectUrl = "";
let snapshotObjectUrl = "";
let snapshotFile = null;
let snapshotImageUrls = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateCart() {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const count = entries.reduce((sum, [, qty]) => sum + qty, 0);
  const total = entries.reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  itemCount.textContent = `${count} ${count === 1 ? "producto" : "productos"}`;
  orderTotal.textContent = money.format(total);
  reviewBtn.disabled = count === 0;
  orderBar.classList.toggle("visible", count > 0);
  const dinerTotal = document.querySelector(`#diner-total-${currentDiner}`);
  if (dinerTotal) dinerTotal.textContent = money.format(dinerState[currentDiner].subtotal + total);
}

function cartEntries() {
  return Object.entries(cart).filter(([, qty]) => qty > 0);
}

function tableSubtotal() {
  return Object.values(dinerState).reduce((sum, diner) => sum + diner.subtotal, 0);
}

function selectedPaymentBase() {
  if (billScope === "table") return tableSubtotal();
  if (billScope === "equal") return Math.ceil(tableSubtotal() / Object.keys(dinerState).length);
  return dinerState[currentDiner].subtotal;
}

function renderPaymentScope() {
  const participantCount = Object.keys(dinerState).length;
  const total = tableSubtotal();
  document.querySelector("#equal-split-label").textContent = `Dividir en ${participantCount}`;
  document.querySelector("#bill-scope-mine").textContent = `Cuenta de ${dinerState[currentDiner].name}`;
  if (billScope === "table") {
    paymentLines.innerHTML = Object.values(dinerState).map((diner) => `
      <div class="payment-line"><span>${diner.name}</span><strong>${money.format(diner.subtotal)}</strong></div>
    `).join("");
    document.querySelector("#bill-title").textContent = `Cuenta completa de la ${tableLabel}`;
  } else if (billScope === "equal") {
    paymentLines.innerHTML = `<div class="payment-line"><span>1 de ${participantCount} partes iguales</span><strong>${money.format(Math.ceil(total / participantCount))}</strong></div>`;
    document.querySelector("#bill-title").textContent = `Parte de ${dinerState[currentDiner].name}`;
  } else {
    const entries = currentDiner === lastOrder.diner ? lastOrder.entries : [];
    paymentLines.innerHTML = entries.length ? entries.map(([id, qty]) => `
      <div class="payment-line"><span>${qty} × ${products[id].name}</span><strong>${money.format(products[id].price * qty)}</strong></div>
    `).join("") : `<div class="payment-line"><span>Consumo atribuido a ${dinerState[currentDiner].name}</span><strong>${money.format(dinerState[currentDiner].subtotal)}</strong></div>`;
    document.querySelector("#bill-title").textContent = `Cuenta de ${dinerState[currentDiner].name} · ${tableLabel}`;
  }
  updatePaymentTotal();
}

function updatePaymentTotal() {
  const base = selectedPaymentBase();
  const tip = Math.round(base * tipPercent / 100);
  paymentSubtotal.textContent = money.format(base);
  paymentTip.textContent = money.format(tip);
  paymentTotal.textContent = money.format(base + tip);
}

function preparePayment(entries, subtotal) {
  lastOrder = { entries: entries.map(([id, qty]) => [id, qty]), subtotal, diner: currentDiner };
  dinerState[currentDiner].subtotal = subtotal;
  tipPercent = 0;
  paymentMethod = "";
  billScope = "mine";
  document.querySelectorAll(".bill-scope-option").forEach((button) => {
    const active = button.dataset.billScope === billScope;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".tip-option").forEach((button) => {
    const active = button.dataset.tip === "0";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".payment-method").forEach((button) => button.setAttribute("aria-pressed", "false"));
  methodPlaceholder.hidden = false;
  staffPaymentPanel.hidden = true;
  transferPanel.hidden = true;
  feedbackCard.hidden = true;
  paymentStatus.textContent = "";
  feedbackStatus.textContent = "";
  selectedRating = 0;
  document.querySelectorAll("#star-rating button").forEach((star) => {
    star.classList.remove("active");
    star.setAttribute("aria-pressed", "false");
  });
  submitFeedback.disabled = true;
  receiptInput.value = "";
  receiptPreview.hidden = true;
  receiptPreview.replaceChildren();
  confirmTransfer.disabled = true;
  paymentSection.hidden = false;
  renderPaymentScope();
}

function completePayment(label) {
  paymentStatus.textContent = `${label} registrado como demostración. No se movió dinero real.`;
  feedbackCard.hidden = false;
  showToast("Pago de prueba registrado · ya podés dejar una reseña");
  feedbackCard.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
}

function renderOrderDialog() {
  const entries = cartEntries();
  const total = entries.reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  orderLines.innerHTML = entries.map(([id, qty]) => `
    <div class="order-line">
      <div><strong>${products[id].name}</strong><small>${money.format(products[id].price)} cada uno</small></div>
      <div class="quantity-control" aria-label="Cantidad de ${products[id].name}">
        <button type="button" data-cart-action="decrease" data-id="${id}" aria-label="Quitar uno">−</button>
        <span>${qty}</span>
        <button type="button" data-cart-action="increase" data-id="${id}" aria-label="Agregar uno">+</button>
      </div>
      <strong>${money.format(products[id].price * qty)}</strong>
    </div>
  `).join("");
  dialogTotal.textContent = money.format(total);
  document.querySelector("#order-table-label").textContent = `${tableLabel} · cuenta de ${dinerState[currentDiner].name}`;
}

document.querySelectorAll(".add-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.id;
    cart[id] = (cart[id] || 0) + 1;
    updateCart();
    showToast(`${products[id].name} agregado a la cuenta de ${dinerState[currentDiner].name}`);
  });
});

function selectDiner(dinerId) {
  if (!dinerState[dinerId]) return;
  currentDiner = dinerId;
  cart = dinerState[currentDiner].cart;
  document.querySelectorAll(".diner-pill").forEach((button) => {
    const active = button.dataset.diner === currentDiner;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelector("#active-diner-copy").innerHTML = `<strong>Estás pidiendo como ${dinerState[currentDiner].name}.</strong> Los próximos productos quedarán en esta cuenta.`;
  setTextIfPresent("#order-table-label", `${tableLabel} · cuenta de ${dinerState[currentDiner].name}`);
  updateCart();
  if (!paymentSection.hidden) renderPaymentScope();
  showToast(`Cuenta activa: ${dinerState[currentDiner].name}`);
}

document.querySelectorAll(".diner-pill").forEach((button) => {
  button.addEventListener("click", () => selectDiner(button.dataset.diner));
});

document.querySelector("#add-diner-demo").addEventListener("click", () => {
  if (dinerState.sofia) {
    selectDiner("sofia");
    return;
  }
  dinerState.sofia = { name: "Sofía", subtotal: 0, cart: {} };
  const button = document.createElement("button");
  button.type = "button";
  button.className = "diner-pill";
  button.dataset.diner = "sofia";
  button.setAttribute("role", "tab");
  button.setAttribute("aria-selected", "false");
  button.innerHTML = '<span>SO</span><strong>Sofía</strong><small id="diner-total-sofia">$0</small>';
  button.addEventListener("click", () => selectDiner("sofia"));
  document.querySelector(".diner-switcher").append(button);
  document.querySelector("#add-diner-demo").textContent = "Sofía se sumó";
  renderPaymentScope();
  selectDiner("sofia");
  showToast("Sofía se sumó a la Mesa 07 · simulación");
});

document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".dish-card").forEach((card) => {
      card.hidden = filter !== "todos" && card.dataset.category !== filter;
    });
  });
});

reviewBtn.addEventListener("click", () => {
  renderOrderDialog();
  dialog.returnValue = "";
  dialog.showModal();
});

orderLines.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const id = button.dataset.id;
  cart[id] += button.dataset.cartAction === "increase" ? 1 : -1;
  if (cart[id] <= 0) delete cart[id];
  updateCart();
  if (cartEntries().length === 0) dialog.close("close");
  else renderOrderDialog();
});

document.querySelectorAll(".allergy-chip").forEach((button) => {
  button.addEventListener("click", () => {
    const allergen = button.dataset.allergen;
    const isSelected = selectedAllergens.has(allergen);
    if (isSelected) selectedAllergens.delete(allergen);
    else selectedAllergens.add(allergen);
    button.setAttribute("aria-pressed", String(!isSelected));
  });
});

dialog.addEventListener("close", () => {
  if (dialog.returnValue === "send") {
    const entries = cartEntries();
    const itemQuantity = entries.reduce((sum, [, qty]) => sum + qty, 0);
    const subtotal = entries.reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
    const hasAllergyNotice = selectedAllergens.size > 0 || allergyDetail.value.trim().length > 0;
    const allergyText = selectedAllergens.size > 0 ? ` Avisos: ${Array.from(selectedAllergens).join(", ")}.` : "";
    const detailText = allergyDetail.value.trim() ? ` Detalle: ${allergyDetail.value.trim()}.` : "";
    const noteText = orderNote.value.trim() ? ` Aclaración: ${orderNote.value.trim()}.` : "";
    trackerSummary.textContent = `${itemQuantity} ${itemQuantity === 1 ? "producto" : "productos"} de ${dinerState[currentDiner].name} para la ${tableLabel}.${allergyText}${detailText}${noteText}`;
    tracker.hidden = false;
    preparePayment(entries, subtotal);
    const steps = Array.from(document.querySelectorAll(".tracker-step"));
    steps.forEach((step) => step.classList.remove("complete", "current"));
    steps[0].classList.add("complete", "current");
    window.clearTimeout(tracker.stepOneTimer);
    window.clearTimeout(tracker.stepTwoTimer);
    tracker.stepOneTimer = window.setTimeout(() => {
      steps[0].classList.remove("current");
      steps[1].classList.add("complete", "current");
    }, 1400);
    tracker.stepTwoTimer = window.setTimeout(() => {
      steps[1].classList.remove("current");
      steps[2].classList.add("complete", "current");
    }, 3600);
    Object.keys(cart).forEach((id) => delete cart[id]);
    updateCart();
    showToast(hasAllergyNotice
      ? `Pedido de prueba recibido con aviso de alergias · ${tableLabel}`
      : `Pedido de prueba recibido · ${tableLabel}`);
    tracker.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
  }
});

document.querySelectorAll(".js-open-waiter").forEach((button) => {
  button.addEventListener("click", () => {
    waiterDialog.returnValue = "";
    waiterDialog.showModal();
  });
});

document.querySelectorAll(".service-option").forEach((button) => {
  button.addEventListener("click", () => {
    selectedService = button.dataset.service;
    document.querySelectorAll(".service-option").forEach((option) => {
      option.setAttribute("aria-pressed", String(option === button));
    });
    sendServiceBtn.disabled = false;
  });
});

waiterDialog.addEventListener("close", () => {
  if (waiterDialog.returnValue !== "send" || !selectedService) return;
  waiterBtn.classList.add("called");
  const detail = serviceDetail.value.trim();
  waiterStatus.textContent = `${selectedService} · solicitud de prueba enviada`;
  showToast(`${selectedService}: solicitud de prueba enviada para la ${tableLabel}${detail ? " con un detalle" : ""}`);
  window.clearTimeout(waiterBtn.resetTimer);
  waiterBtn.resetTimer = window.setTimeout(() => waiterBtn.classList.remove("called"), 1800);
});

document.querySelector("#open-payment-btn").addEventListener("click", () => {
  paymentSection.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
});

document.querySelectorAll(".bill-scope-option").forEach((button) => {
  button.addEventListener("click", () => {
    billScope = button.dataset.billScope;
    document.querySelectorAll(".bill-scope-option").forEach((option) => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    paymentStatus.textContent = "";
    renderPaymentScope();
  });
});

document.querySelectorAll(".tip-option").forEach((button) => {
  button.addEventListener("click", () => {
    tipPercent = Number(button.dataset.tip);
    document.querySelectorAll(".tip-option").forEach((option) => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    updatePaymentTotal();
  });
});

document.querySelectorAll(".payment-method").forEach((button) => {
  button.addEventListener("click", () => {
    paymentMethod = button.dataset.method;
    document.querySelectorAll(".payment-method").forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    methodPlaceholder.hidden = true;
    staffPaymentPanel.hidden = paymentMethod === "transfer";
    transferPanel.hidden = paymentMethod !== "transfer";
    paymentStatus.textContent = "";
    simulateStaffPayment.hidden = true;
    if (paymentMethod !== "transfer") {
      const isCash = paymentMethod === "cash";
      document.querySelector("#staff-payment-title").textContent = isCash ? "Pagar en efectivo" : "Pagar con QR en la mesa";
      document.querySelector("#staff-payment-copy").textContent = isCash
        ? "Avisaremos al mozo para que se acerque a cobrar."
        : "Avisaremos al mozo para que acerque el QR o confirme el cobro.";
    }
  });
});

document.querySelector("#request-payment-waiter").addEventListener("click", () => {
  const label = paymentMethod === "cash" ? "cobrar en efectivo" : "cobrar con QR";
  waiterBtn.classList.add("called");
  waiterStatus.textContent = `Mozo solicitado para ${label} · demostración`;
  paymentStatus.textContent = `Solicitud de prueba enviada: ${label}.`;
  simulateStaffPayment.hidden = false;
  showToast(`Mozo llamado para ${label} en la ${tableLabel}`);
  window.clearTimeout(waiterBtn.resetTimer);
  waiterBtn.resetTimer = window.setTimeout(() => waiterBtn.classList.remove("called"), 1800);
});

simulateStaffPayment.addEventListener("click", () => completePayment(paymentMethod === "cash" ? "Pago en efectivo" : "Pago con QR"));

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast("Dato demostrativo copiado");
    } catch {
      showToast("No se pudo copiar automáticamente");
    }
  });
});

receiptInput.addEventListener("change", () => {
  if (receiptObjectUrl) URL.revokeObjectURL(receiptObjectUrl);
  receiptObjectUrl = "";
  receiptPreview.replaceChildren();
  const file = receiptInput.files[0];
  if (!file) {
    receiptPreview.hidden = true;
    confirmTransfer.disabled = true;
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    receiptInput.value = "";
    receiptPreview.hidden = true;
    confirmTransfer.disabled = true;
    paymentStatus.textContent = "El archivo supera 8 MB. Elegí una imagen o PDF más liviano.";
    return;
  }
  const name = document.createElement("strong");
  name.textContent = file.name;
  const detail = document.createElement("small");
  detail.textContent = `${file.type || "Archivo"} · ${(file.size / 1024).toFixed(0)} KB · sin enviar`;
  receiptPreview.append(name, detail);
  if (file.type.startsWith("image/")) {
    receiptObjectUrl = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.src = receiptObjectUrl;
    image.alt = "Vista previa local del comprobante elegido";
    receiptPreview.append(image);
  }
  receiptPreview.hidden = false;
  confirmTransfer.disabled = false;
  paymentStatus.textContent = "Comprobante preparado localmente; todavía no fue enviado.";
});

confirmTransfer.addEventListener("click", () => completePayment("Transferencia con comprobante"));

document.querySelectorAll("#star-rating button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.rating);
    document.querySelectorAll("#star-rating button").forEach((star) => {
      const active = Number(star.dataset.rating) <= selectedRating;
      star.classList.toggle("active", active);
      star.setAttribute("aria-pressed", String(star === button));
    });
    submitFeedback.disabled = false;
  });
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedRating) return;
  const card = document.createElement("article");
  card.className = "review-card session-review";
  const stars = document.createElement("div");
  stars.className = "review-stars";
  stars.setAttribute("aria-label", `${selectedRating} de 5 estrellas`);
  stars.textContent = `${"★".repeat(selectedRating)}${"☆".repeat(5 - selectedRating)}`;
  const copy = document.createElement("p");
  copy.textContent = feedbackText.value.trim() ? `“${feedbackText.value.trim()}”` : "“Gracias por la experiencia.”";
  const author = document.createElement("strong");
  author.textContent = `Cliente de ${tableLabel} · esta sesión`;
  card.append(stars, copy, author);
  document.querySelector("#reviews-track").prepend(card);
  feedbackStatus.textContent = "Reseña de prueba agregada sólo en esta pantalla; no quedó guardada.";
  submitFeedback.disabled = true;
  showToast("Gracias por tu reseña de prueba");
});

const snapshotDialog = document.querySelector("#snapshot-dialog");
const snapshotForm = document.querySelector("#snapshot-form");
const snapshotInput = document.querySelector("#snapshot-file");
const snapshotPreview = document.querySelector("#snapshot-preview");
const snapshotPreviewImage = document.querySelector("#snapshot-preview-image");
const snapshotFileError = document.querySelector("#snapshot-file-error");
const snapshotFormError = document.querySelector("#snapshot-form-error");
const snapshotText = document.querySelector("#snapshot-text");
const snapshotGrid = document.querySelector("#snapshots-grid");
const snapshotStatus = document.querySelector("#snapshot-status");

function clearSnapshotUrls() {
  snapshotImageUrls.forEach((url) => URL.revokeObjectURL(url));
  snapshotImageUrls = [];
}

function snapshotImageSource(snapshot) {
  if (snapshot.imageBlob) {
    const url = URL.createObjectURL(snapshot.imageBlob);
    snapshotImageUrls.push(url);
    return url;
  }
  return snapshot.imageUrl;
}

function makeSnapshotCard(snapshot) {
  const card = document.createElement("article");
  card.className = "snapshot-card";
  const image = document.createElement("img");
  image.src = snapshotImageSource(snapshot);
  image.alt = `${snapshot.dishName || "Plato compartido"}, instantánea aprobada por el bar`;
  image.loading = "lazy";

  const body = document.createElement("div");
  body.className = "snapshot-card-body";
  const badges = document.createElement("div");
  badges.className = "snapshot-card-top";
  const approved = document.createElement("span");
  approved.className = "approved-badge";
  approved.textContent = "✓ Aprobada por el bar";
  badges.append(approved);
  if (snapshot.demo) {
    const demo = document.createElement("span");
    demo.className = "demo-content-badge";
    demo.textContent = "Contenido ficticio";
    badges.append(demo);
  }

  const title = document.createElement("h3");
  title.textContent = snapshot.dishName || "Desde la mesa";
  const copy = document.createElement("p");
  copy.textContent = `“${snapshot.text}”`;
  const meta = document.createElement("div");
  meta.className = "snapshot-card-meta";
  const alias = document.createElement("span");
  alias.textContent = snapshot.alias || "Sin alias";
  const table = document.createElement("span");
  table.textContent = `Mesa ${snapshot.table}`;
  meta.append(alias, table);

  const actions = document.createElement("div");
  actions.className = "snapshot-card-actions";
  if (snapshot.dishId) {
    const link = document.createElement("a");
    link.href = `#product-${snapshot.dishId}`;
    link.textContent = "Ver este plato";
    actions.append(link);
  }
  const removal = document.createElement("button");
  removal.type = "button";
  removal.textContent = snapshot.removalRequested ? "Eliminación solicitada" : "Solicitar eliminación";
  removal.disabled = Boolean(snapshot.removalRequested);
  removal.addEventListener("click", async () => {
    try {
      await window.SnapshotsDB.update(snapshot.id, { removalRequested: true });
      removal.textContent = "Eliminación solicitada";
      removal.disabled = true;
      snapshotStatus.textContent = "Solicitud registrada en esta demostración. El bar podrá verla en el panel de este navegador.";
    } catch {
      snapshotStatus.textContent = "No se pudo registrar la solicitud en este navegador.";
    }
  });
  actions.append(removal);
  body.append(badges, title, copy, meta, actions);
  card.append(image, body);
  return card;
}

async function renderSnapshots() {
  snapshotGrid.setAttribute("aria-busy", "true");
  try {
    const records = await window.SnapshotsDB.getAll();
    const approved = records.filter((snapshot) => snapshot.status === "approved");
    clearSnapshotUrls();
    snapshotGrid.replaceChildren();
    if (!approved.length) {
      const empty = document.createElement("p");
      empty.className = "snapshot-empty";
      empty.textContent = "Todavía no hay instantáneas aprobadas en este navegador.";
      snapshotGrid.append(empty);
    } else {
      approved.forEach((snapshot) => snapshotGrid.append(makeSnapshotCard(snapshot)));
    }
  } catch {
    snapshotGrid.innerHTML = '<p class="snapshot-empty">No pudimos abrir las instantáneas locales. Probá en un navegador compatible con almacenamiento local.</p>';
  } finally {
    snapshotGrid.setAttribute("aria-busy", "false");
  }
}

function resetSnapshotForm() {
  snapshotForm.reset();
  snapshotFile = null;
  if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
  snapshotObjectUrl = "";
  snapshotPreview.hidden = true;
  snapshotPreviewImage.removeAttribute("src");
  snapshotFileError.textContent = "";
  snapshotFormError.textContent = "";
  document.querySelector("#snapshot-character-count").textContent = "0/120";
}

function closeSnapshotForm() {
  snapshotDialog.close();
  resetSnapshotForm();
}

document.querySelector("#open-snapshot-form").addEventListener("click", () => {
  resetSnapshotForm();
  snapshotDialog.showModal();
});
document.querySelector("#close-snapshot-form").addEventListener("click", closeSnapshotForm);
document.querySelector("#cancel-snapshot-form").addEventListener("click", closeSnapshotForm);

document.querySelector("#remove-snapshot-photo").addEventListener("click", () => {
  snapshotInput.value = "";
  snapshotFile = null;
  if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
  snapshotObjectUrl = "";
  snapshotPreview.hidden = true;
  snapshotPreviewImage.removeAttribute("src");
  snapshotFileError.textContent = "";
});

snapshotInput.addEventListener("change", () => {
  snapshotFileError.textContent = "";
  const file = snapshotInput.files[0];
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!file) return;
  if (!allowedTypes.includes(file.type)) {
    snapshotInput.value = "";
    snapshotFile = null;
    snapshotPreview.hidden = true;
    snapshotFileError.textContent = "Elegí una imagen JPG, PNG o WebP.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    snapshotInput.value = "";
    snapshotFile = null;
    snapshotPreview.hidden = true;
    snapshotFileError.textContent = "La foto supera 5 MB. Elegí una imagen más liviana.";
    return;
  }
  snapshotFile = file;
  if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
  snapshotObjectUrl = URL.createObjectURL(file);
  snapshotPreviewImage.src = snapshotObjectUrl;
  document.querySelector("#snapshot-file-name").textContent = file.name;
  document.querySelector("#snapshot-file-detail").textContent = `${(file.size / 1024).toFixed(0)} KB · vista previa local`;
  snapshotPreview.hidden = false;
});

snapshotText.addEventListener("input", () => {
  document.querySelector("#snapshot-character-count").textContent = `${snapshotText.value.length}/120`;
});

async function reprocessImage(file) {
  const bitmap = await createImageBitmap(file);
  const maximum = 1600;
  const scale = Math.min(1, maximum / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  return blob;
}

snapshotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  snapshotFormError.textContent = "";
  if (!snapshotFile) {
    snapshotFileError.textContent = "Elegí una foto para continuar.";
    snapshotInput.focus();
    return;
  }
  if (!snapshotForm.reportValidity()) return;
  const submit = document.querySelector("#submit-snapshot");
  submit.disabled = true;
  submit.textContent = "Preparando foto…";
  try {
    const imageBlob = await reprocessImage(snapshotFile);
    const dishSelect = document.querySelector("#snapshot-dish");
    const snapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: "pending",
      demo: false,
      dishId: dishSelect.value,
      dishName: dishSelect.value ? dishSelect.options[dishSelect.selectedIndex].text : "",
      imageBlob,
      text: snapshotText.value.trim(),
      alias: document.querySelector("#snapshot-alias").value.trim(),
      table: tableNumber,
      createdAt: new Date().toISOString(),
      consent: true,
      removalRequested: false,
    };
    await window.SnapshotsDB.put(snapshot);
    closeSnapshotForm();
    snapshotStatus.textContent = "Instantánea recibida. El bar debe aprobarla antes de que sea visible.";
    showToast("Instantánea guardada como pendiente");
  } catch {
    snapshotFormError.textContent = "No pudimos guardar la instantánea en este navegador. Revisá el espacio disponible e intentá otra vez.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Enviar para revisión";
  }
});

renderSnapshots();

const stage = document.querySelector("#food-stage");
const frame = document.querySelector("#food-frame");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const snapshotCarousel = document.querySelector(".snapshot-carousel");
const snapshotPrevious = document.querySelector("[data-snapshot-prev]");
const snapshotNext = document.querySelector("[data-snapshot-next]");
let snapshotCarouselIndex = 0;
let snapshotCarouselTimer = 0;

function snapshotCards() {
  return [...snapshotGrid.querySelectorAll(".snapshot-card")];
}

function snapshotLastStartIndex(cards = snapshotCards()) {
  if (!cards.length) return 0;
  const gap = Number.parseFloat(getComputedStyle(snapshotGrid).gap) || 0;
  const visibleCards = Math.max(1, Math.floor((snapshotGrid.clientWidth + gap) / (cards[0].offsetWidth + gap)));
  return Math.max(0, cards.length - visibleCards);
}

function showSnapshotCard(nextIndex, announce = false) {
  const cards = snapshotCards();
  if (!cards.length) return;
  const lastStartIndex = snapshotLastStartIndex(cards);
  snapshotCarouselIndex = (nextIndex + lastStartIndex + 1) % (lastStartIndex + 1);
  const target = cards[snapshotCarouselIndex];
  snapshotGrid.scrollTo({ left: target.offsetLeft - snapshotGrid.offsetLeft, behavior: reduceMotion.matches ? "auto" : "smooth" });
  if (announce) snapshotStatus.textContent = `Vista ${snapshotCarouselIndex + 1} de ${lastStartIndex + 1} del carrusel.`;
}

function nearestSnapshotCardIndex() {
  const cards = snapshotCards();
  if (!cards.length) return 0;
  const gridLeft = snapshotGrid.getBoundingClientRect().left;
  const nearest = cards.reduce((best, card, index) => {
    const distance = Math.abs(card.getBoundingClientRect().left - gridLeft);
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  return Math.min(nearest, snapshotLastStartIndex(cards));
}

function stopSnapshotCarousel() {
  window.clearInterval(snapshotCarouselTimer);
  snapshotCarouselTimer = 0;
}

function startSnapshotCarousel() {
  stopSnapshotCarousel();
  if (!reduceMotion.matches) {
    snapshotCarouselTimer = window.setInterval(() => {
      if (snapshotCards().length > 1) showSnapshotCard(snapshotCarouselIndex + 1);
    }, 3600);
  }
}

snapshotPrevious?.addEventListener("click", () => { snapshotCarouselIndex = nearestSnapshotCardIndex(); showSnapshotCard(snapshotCarouselIndex - 1, true); startSnapshotCarousel(); });
snapshotNext?.addEventListener("click", () => { snapshotCarouselIndex = nearestSnapshotCardIndex(); showSnapshotCard(snapshotCarouselIndex + 1, true); startSnapshotCarousel(); });
snapshotGrid.addEventListener("scroll", () => { snapshotCarouselIndex = nearestSnapshotCardIndex(); }, { passive: true });
snapshotCarousel?.addEventListener("focusin", stopSnapshotCarousel);
snapshotCarousel?.addEventListener("focusout", () => window.setTimeout(() => {
  if (!snapshotCarousel.contains(document.activeElement)) startSnapshotCarousel();
}, 0));
startSnapshotCarousel();

document.querySelectorAll(".occasion-action").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#reservation-note").value = `Consulta por propuesta para ${button.dataset.occasion}`;
    document.querySelector("#reservas").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    showToast("Completá los datos para simular la consulta");
  });
});

const reservationDate = document.querySelector("#reservation-date");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
reservationDate.min = tomorrow.toISOString().slice(0, 10);
reservationDate.value = reservationDate.min;

document.querySelector("#reservation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#reservation-name").value.trim();
  const time = document.querySelector("#reservation-time").value;
  const guests = document.querySelector("#reservation-guests").value;
  const date = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date(`${reservationDate.value}T12:00:00`));
  document.querySelector("#reservation-status").innerHTML = `<strong>Reserva demostrativa preparada.</strong> ${name}, ${guests} personas el ${date} a las ${time}. No se enviaron datos ni se bloqueó una mesa real.`;
  showToast("Reserva de prueba confirmada en pantalla");
});

const prizeWheel = document.querySelector("#prize-wheel");
const spinWheel = document.querySelector("#spin-wheel");
const wheelResult = document.querySelector("#wheel-result");
const wheelPrizes = ["un café de cortesía", "10% de descuento", "un postre para compartir", "otra oportunidad", "una limonada", "5% de descuento", "una empanada", "una sorpresa del bar"];
let wheelRotation = 0;

spinWheel.addEventListener("click", () => {
  if (spinWheel.disabled) return;
  const random = new Uint32Array(1);
  window.crypto.getRandomValues(random);
  const winnerIndex = random[0] % wheelPrizes.length;
  const segment = 360 / wheelPrizes.length;
  wheelRotation += 1800 + (360 - (winnerIndex * segment + segment / 2));
  spinWheel.disabled = true;
  spinWheel.textContent = "Girando…";
  wheelResult.textContent = "La ruleta está girando…";
  prizeWheel.style.transform = `rotate(${wheelRotation}deg)`;
  window.setTimeout(() => {
    wheelResult.innerHTML = `<strong>Resultado demostrativo:</strong> ganaste ${wheelPrizes[winnerIndex]}. En una operación real quedaría asociado al ticket y sujeto a disponibilidad.`;
    spinWheel.disabled = false;
    spinWheel.textContent = "Girar otra demostración";
  }, reduceMotion.matches ? 120 : 3200);
});

function moveFood(clientX, clientY) {
  if (reduceMotion.matches) return;
  const rect = stage.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width - .5;
  const y = (clientY - rect.top) / rect.height - .5;
  frame.style.setProperty("--ry", `${x * 16}deg`);
  frame.style.setProperty("--rx", `${y * -12}deg`);
  frame.style.setProperty("--z", "34px");
  frame.style.setProperty("--scale", "1.035");
}

stage.addEventListener("pointermove", (event) => moveFood(event.clientX, event.clientY));
stage.addEventListener("pointerleave", () => {
  frame.style.setProperty("--ry", "0deg");
  frame.style.setProperty("--rx", "0deg");
  frame.style.setProperty("--z", "0px");
  frame.style.setProperty("--scale", "1");
});

window.addEventListener("deviceorientation", (event) => {
  if (reduceMotion.matches || event.beta == null || event.gamma == null) return;
  const x = Math.max(-1, Math.min(1, event.gamma / 30));
  const y = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
  frame.style.setProperty("--ry", `${x * 12}deg`);
  frame.style.setProperty("--rx", `${y * -9}deg`);
  frame.style.setProperty("--z", "24px");
});

window.addEventListener("scroll", () => {
  if (reduceMotion.matches) return;
  const rect = stage.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
  frame.style.setProperty("--scale", String(1 + progress * .045));
});
