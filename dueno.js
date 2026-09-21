const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const toast = document.querySelector("#owner-toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

const periods = {
  hoy: { sales: "$684.200", note: "+12% vs. martes anterior", ticket: "$13.420", margin: "61%", tables: "18" },
  semana: { sales: "$4.382.000", note: "+8% vs. semana anterior", ticket: "$13.880", margin: "59%", tables: "126" },
  mes: { sales: "$18.940.000", note: "+14% vs. mes anterior", ticket: "$14.120", margin: "60%", tables: "548" },
};

document.querySelectorAll("[data-period]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-period]").forEach((option) => option.classList.toggle("active", option === button));
    const data = periods[button.dataset.period];
    document.querySelector("#metric-sales").textContent = data.sales;
    document.querySelector("#metric-sales-note").textContent = data.note;
    document.querySelector("#metric-ticket").textContent = data.ticket;
    document.querySelector("#metric-margin").textContent = data.margin;
    document.querySelector("#metric-tables").textContent = data.tables;
    showToast(`Período demostrativo: ${button.textContent}`);
  });
});

document.querySelectorAll(".campaign-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const active = !button.classList.contains("active");
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = active ? "Activa" : "Pausada";
    showToast(`Campaña ${active ? "activada" : "pausada"} sólo en esta demostración`);
  });
});

document.querySelector("#scenario-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const price = Number(document.querySelector("#scenario-price").value);
  const cost = Number(document.querySelector("#scenario-cost").value);
  const units = Number(document.querySelector("#scenario-units").value);
  const sales = price * units;
  const margin = Math.max(0, price - cost) * units;
  const unitMargin = price > 0 ? Math.max(0, (price - cost) / price * 100) : 0;
  document.querySelector("#scenario-result").innerHTML = `<span>Venta proyectada <strong>${money.format(sales)}</strong></span><span>Margen proyectado <strong>${money.format(margin)}</strong></span><span>Margen unitario <strong>${unitMargin.toFixed(1).replace(".", ",")}%</strong></span>`;
  showToast("Escenario recalculado con valores ilustrativos");
});
