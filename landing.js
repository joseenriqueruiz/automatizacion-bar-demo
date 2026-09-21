const incomingTable = new URLSearchParams(window.location.search).get("mesa");
if (incomingTable && /^\d{1,2}$/.test(incomingTable)) {
  const parsedTable = Number(incomingTable);
  if (parsedTable >= 1 && parsedTable <= 99) window.location.replace(`carta.html?mesa=${parsedTable}`);
}

const menuToggle = document.querySelector(".menu-toggle");
const landingNav = document.querySelector("#landing-nav");
const bookingDialog = document.querySelector("#booking-dialog");
const bookingForm = document.querySelector("#booking-form");
const bookingDate = document.querySelector("#booking-date");
const bookingStatus = document.querySelector("#booking-status");
const contactStatus = document.querySelector("#contact-status");
const menuToggleLabel = menuToggle.querySelector(".sr-only");

function setMenuOpen(open) {
  landingNav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggleLabel.textContent = open ? "Cerrar navegación" : "Abrir navegación";
}

document.querySelector(".dialog-close").addEventListener("click", (event) => {
  event.preventDefault();
  bookingDialog.close();
});

menuToggle.addEventListener("click", () => {
  setMenuOpen(!landingNav.classList.contains("open"));
});

landingNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setMenuOpen(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && landingNav.classList.contains("open")) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

document.querySelectorAll(".js-open-booking").forEach((button) => {
  button.addEventListener("click", () => bookingDialog.showModal());
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
bookingDate.min = tomorrow.toISOString().slice(0, 10);

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#booking-name").value.trim();
  const guests = document.querySelector("#booking-guests").value;
  const date = new Date(`${bookingDate.value}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
  const time = document.querySelector("#booking-time").value;
  bookingStatus.innerHTML = `<strong>Reserva de prueba preparada.</strong> ${name}, ${guests} personas, ${date} a las ${time}. No se enviaron datos.`;
});

document.querySelector("#whatsapp-demo").addEventListener("click", () => {
  const contact = window.BAR_DEMO_CONFIG && window.BAR_DEMO_CONFIG.contact;
  if (contact && contact.whatsappEnabled && contact.whatsappNumber) {
    window.location.href = `https://wa.me/${contact.whatsappNumber}`;
    return;
  }
  contactStatus.textContent = "WhatsApp se habilita con el número real de cada establecimiento. En esta demo no se abre ningún chat.";
});

const hour = new Date().getHours();
const daypartCopy = document.querySelector("#daypart-copy");
if (hour < 12) daypartCopy.textContent = "Buen día: café, pan casero y una carta clara para empezar sin apuro.";
else if (hour < 17) daypartCopy.textContent = "Es hora de almorzar: regionales, minutas y platos para compartir.";
else if (hour < 20) daypartCopy.textContent = "La tarde pide una pausa: merienda, algo dulce y tiempo para conversar.";
else daypartCopy.textContent = "La noche invita a quedarse: cena, luces cálidas y una sobremesa tranquila.";
