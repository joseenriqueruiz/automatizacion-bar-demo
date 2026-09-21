const toast = document.querySelector("#panel-toast");
const requestsCount = document.querySelector("#requests-count");
const requestsBadge = document.querySelector("#requests-badge");
const openOrdersCount = document.querySelector("#open-orders-count");
const paymentsCount = document.querySelector("#payments-count");
const paymentsBadge = document.querySelector("#payments-badge");
const snapshotsPendingCount = document.querySelector("#snapshots-pending-count");
const moderationPendingBadge = document.querySelector("#moderation-pending-badge");
const moderationGrid = document.querySelector("#moderation-grid");
const moderationStatus = document.querySelector("#moderation-status");
let activeSnapshotFilter = "pending";
let moderationImageUrls = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function updateRequestCount() {
  const pending = document.querySelectorAll("[data-request]:not(.resolved)").length;
  requestsCount.textContent = String(pending);
  requestsBadge.textContent = `${pending} ${pending === 1 ? "pendiente" : "pendientes"}`;
}

function updateOrderCount() {
  const open = document.querySelectorAll("[data-order]:not([data-state='delivered'])").length;
  openOrdersCount.textContent = String(open);
}

document.querySelectorAll(".resolve-request").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("[data-request]");
    row.classList.add("resolved");
    row.querySelector(".request-state").textContent = "Atendida · demostración";
    button.textContent = "Atendida";
    button.disabled = true;
    updateRequestCount();
    showToast("Solicitud marcada como atendida");
  });
});

document.querySelectorAll(".advance-order").forEach((button) => {
  button.addEventListener("click", () => {
    const order = button.closest("[data-order]");
    const state = order.querySelector(".order-state");
    if (order.dataset.state === "kitchen") {
      order.dataset.state = "ready";
      state.className = "order-state ready";
      state.textContent = "Listo para servir";
      button.textContent = "Marcar entregado";
      showToast("Pedido marcado como listo");
    } else {
      order.dataset.state = "delivered";
      state.className = "order-state delivered";
      state.textContent = "Entregado · demostración";
      button.textContent = "Entregado";
      button.disabled = true;
      updateOrderCount();
      showToast("Pedido marcado como entregado");
    }
  });
});

function updatePaymentCount() {
  const pending = document.querySelectorAll("[data-payment]:not(.completed)").length;
  paymentsCount.textContent = String(pending);
  paymentsBadge.textContent = `${pending} ${pending === 1 ? "pendiente" : "pendientes"}`;
}

document.querySelectorAll(".confirm-payment").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("[data-payment]");
    row.classList.add("completed");
    row.querySelector(".payment-row-state").textContent = "Cobro confirmado · demostración";
    button.textContent = "Confirmado";
    button.disabled = true;
    updatePaymentCount();
    showToast("Cobro de prueba confirmado");
  });
});

function clearModerationImageUrls() {
  moderationImageUrls.forEach((url) => URL.revokeObjectURL(url));
  moderationImageUrls = [];
}

function moderationImageSource(snapshot) {
  if (snapshot.imageBlob) {
    const url = URL.createObjectURL(snapshot.imageBlob);
    moderationImageUrls.push(url);
    return url;
  }
  return snapshot.imageUrl;
}

function statusLabel(status) {
  if (status === "approved") return "Publicada";
  if (status === "rejected") return "No publicada";
  return "Pendiente de revisión";
}

function makeModerationItem(snapshot) {
  const item = document.createElement("article");
  item.className = "moderation-item";
  const image = document.createElement("img");
  image.src = moderationImageSource(snapshot);
  image.alt = `Vista previa de ${snapshot.dishName || "plato sin asociar"}`;

  const content = document.createElement("div");
  const state = document.createElement("span");
  state.className = "moderation-state";
  state.textContent = `${statusLabel(snapshot.status)}${snapshot.demo ? " · contenido ficticio" : ""}`;
  const title = document.createElement("h3");
  title.textContent = snapshot.dishName || "Plato sin asociar";
  const copy = document.createElement("p");
  copy.textContent = `“${snapshot.text}”`;
  const meta = document.createElement("div");
  meta.className = "moderation-meta";
  const alias = document.createElement("span");
  alias.textContent = `Alias: ${snapshot.alias || "sin alias"}`;
  const table = document.createElement("span");
  table.textContent = `Mesa ${snapshot.table}`;
  const date = document.createElement("time");
  date.dateTime = snapshot.createdAt;
  date.textContent = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(snapshot.createdAt));
  meta.append(alias, table, date);
  content.append(state, title, copy, meta);
  if (snapshot.removalRequested) {
    const removal = document.createElement("span");
    removal.className = "removal-badge";
    removal.textContent = "El cliente solicitó eliminarla";
    content.append(removal);
  }

  const actions = document.createElement("div");
  actions.className = "moderation-actions";
  if (snapshot.status !== "approved") {
    const approve = document.createElement("button");
    approve.type = "button";
    approve.className = "approve";
    approve.textContent = "Aprobar";
    approve.addEventListener("click", () => moderateSnapshot(snapshot.id, "approved", "Instantánea aprobada y añadida al feed del cliente."));
    actions.append(approve);
  }
  if (snapshot.status !== "rejected") {
    const reject = document.createElement("button");
    reject.type = "button";
    reject.className = "reject";
    reject.textContent = "No publicar";
    reject.addEventListener("click", () => moderateSnapshot(snapshot.id, "rejected", "Instantánea marcada como no publicada."));
    actions.append(reject);
  }
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.textContent = "Eliminar";
  remove.addEventListener("click", () => deleteSnapshot(snapshot));
  actions.append(remove);
  item.append(image, content, actions);
  return item;
}

async function renderModeration() {
  moderationGrid.setAttribute("aria-busy", "true");
  try {
    const records = await window.SnapshotsDB.getAll();
    const pending = records.filter((snapshot) => snapshot.status === "pending").length;
    snapshotsPendingCount.textContent = String(pending);
    moderationPendingBadge.textContent = `${pending} ${pending === 1 ? "pendiente" : "pendientes"}`;
    const visible = records.filter((snapshot) => snapshot.status === activeSnapshotFilter);
    clearModerationImageUrls();
    moderationGrid.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "moderation-empty";
      empty.textContent = activeSnapshotFilter === "pending"
        ? "No hay instantáneas pendientes en este navegador."
        : activeSnapshotFilter === "approved" ? "No hay instantáneas publicadas." : "No hay instantáneas rechazadas.";
      moderationGrid.append(empty);
    } else {
      visible.forEach((snapshot) => moderationGrid.append(makeModerationItem(snapshot)));
    }
  } catch {
    moderationGrid.innerHTML = '<p class="moderation-empty">No se pudo abrir la moderación local en este navegador.</p>';
  } finally {
    moderationGrid.setAttribute("aria-busy", "false");
  }
}

async function moderateSnapshot(id, status, message) {
  try {
    await window.SnapshotsDB.update(id, { status, moderatedAt: new Date().toISOString() });
    moderationStatus.textContent = message;
    showToast(message);
    await renderModeration();
  } catch {
    moderationStatus.textContent = "No se pudo guardar la decisión en este navegador.";
  }
}

async function deleteSnapshot(snapshot) {
  const confirmed = window.confirm(`¿Eliminar definitivamente esta instantánea de ${snapshot.dishName || `Mesa ${snapshot.table}`} en este navegador?`);
  if (!confirmed) return;
  try {
    await window.SnapshotsDB.remove(snapshot.id);
    moderationStatus.textContent = "Instantánea eliminada de este navegador.";
    showToast("Instantánea eliminada");
    await renderModeration();
  } catch {
    moderationStatus.textContent = "No se pudo eliminar la instantánea.";
  }
}

document.querySelectorAll("[data-snapshot-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeSnapshotFilter = button.dataset.snapshotFilter;
    document.querySelectorAll("[data-snapshot-filter]").forEach((option) => option.setAttribute("aria-selected", String(option === button)));
    moderationStatus.textContent = "";
    renderModeration();
  });
});

renderModeration();

document.querySelectorAll(".account-ready").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("done");
    button.textContent = button.classList.contains("done") ? "Cuenta lista" : (button.closest(".shared-products") ? "Asignar" : "Marcar lista");
    showToast(button.classList.contains("done") ? "Cuenta marcada como lista" : "Cuenta reabierta");
  });
});

document.querySelectorAll("[data-account-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-account-mode]").forEach((option) => option.classList.toggle("active", option === button));
    const labels = {
      individual: "Cierre preparado: cada comensal paga su consumo · demostración",
      equal: "Cierre preparado: 3 partes iguales de $15.700 · demostración",
      single: "Cierre preparado: una cuenta total de $47.100 · demostración",
    };
    document.querySelector("#account-state").textContent = labels[button.dataset.accountMode];
    showToast("Modalidad de cuenta actualizada");
  });
});
