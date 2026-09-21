(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const weatherSlides = [
    {
      icon: "☀️",
      temperature: "26°",
      moment: "Tarde soleada · ejemplo",
      eyebrow: "Algo fresco",
      title: "El calor pide sabores livianos",
      copy: "Una selección pensada para una tarde luminosa en la villa: bebidas frías, fruta y platos para compartir sin apuro.",
      tone: "warm",
      picks: [["Limonada de la casa", "product-limonada"], ["Licuado frutal", "carta"], ["Mesa de sabores", "product-tabla-regional"]],
    },
    {
      icon: "🌤️",
      temperature: "19°",
      moment: "Atardecer templado · ejemplo",
      eyebrow: "Hora de merendar",
      title: "Una pausa dulce cuando baja el sol",
      copy: "Café, quesillo con cayote y una bebida fresca combinan con la caminata y la charla de la tarde.",
      tone: "soft",
      picks: [["Café y algo dulce", "carta"], ["Quesillo con cayote", "carta"], ["Empanadas", "product-empanada"]],
    },
    {
      icon: "🌙",
      temperature: "14°",
      moment: "Noche fresca · ejemplo",
      eyebrow: "Algo calentito",
      title: "Cuando refresca, mandan los platos de olla",
      copy: "La recomendación cambia con el momento: locro, empanadas recién hechas y una mesa abundante para compartir.",
      tone: "cool",
      picks: [["Locro", "product-locro"], ["Empanadas", "product-empanada"], ["Milanesa con papas", "product-milanesa-plato"]],
    },
  ];

  function targetHref(target, context) {
    const prefix = context === "landing" ? "carta.html" : "";
    return `${prefix}#${target}`;
  }

  function initWeather(root) {
    const context = root.dataset.weatherContext || "menu";
    const track = root.querySelector("[data-weather-track]");
    const dots = root.querySelector("[data-weather-dots]");
    const status = root.querySelector("[data-weather-status]");
    if (!track || !dots) return;

    track.innerHTML = weatherSlides.map((slide, index) => `
      <article class="weather-slide" data-tone="${slide.tone}" aria-hidden="${index !== 0}">
        <div class="weather-slide__weather">
          <span class="weather-slide__icon" aria-hidden="true">${slide.icon}</span>
          <div><small>${slide.moment}</small><strong>${slide.temperature}</strong></div>
        </div>
        <div class="weather-slide__recommendation">
          <p class="eyebrow">${slide.eyebrow}</p>
          <h3>${slide.title}</h3>
          <p>${slide.copy}</p>
          <div class="weather-picks">${slide.picks.map(([label, target]) => `<a href="${targetHref(target, context)}">${label}</a>`).join("")}</div>
        </div>
      </article>
    `).join("");
    dots.innerHTML = weatherSlides.map((_, index) => `<button class="weather-carousel__dot" type="button" aria-label="Ver recomendación ${index + 1}" aria-current="${index === 0}" data-weather-dot="${index}"></button>`).join("");

    let index = 0;
    let timer = 0;
    let paused = false;
    const slides = [...track.children];
    const dotButtons = [...dots.children];

    function show(next, announce = false) {
      index = (next + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, slideIndex) => slide.setAttribute("aria-hidden", String(slideIndex !== index)));
      dotButtons.forEach((dot, dotIndex) => dot.setAttribute("aria-current", String(dotIndex === index)));
      if (announce && status) status.textContent = `Recomendación ${index + 1} de ${slides.length}: ${weatherSlides[index].title}`;
    }

    function stop() { window.clearInterval(timer); timer = 0; }
    function start() {
      stop();
      if (!reduceMotion.matches && !paused) timer = window.setInterval(() => show(index + 1), 5200);
    }

    root.querySelector("[data-weather-prev]")?.addEventListener("click", () => { show(index - 1, true); start(); });
    root.querySelector("[data-weather-next]")?.addEventListener("click", () => { show(index + 1, true); start(); });
    dotButtons.forEach((dot) => dot.addEventListener("click", () => { show(Number(dot.dataset.weatherDot), true); start(); }));
    root.addEventListener("mouseenter", () => { paused = true; stop(); });
    root.addEventListener("mouseleave", () => { paused = false; start(); });
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", () => window.setTimeout(() => { if (!root.contains(document.activeElement)) start(); }, 0));
    start();
  }

  function initBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-label", "Volver al inicio");
    button.innerHTML = '<span aria-hidden="true">↑<small>Inicio</small></span>';
    document.body.append(button);

    function update() {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, window.scrollY / scrollable);
      button.style.setProperty("--scroll-progress", `${progress * 360}deg`);
      button.classList.toggle("is-visible", window.scrollY > Math.min(620, window.innerHeight * .75));
    }

    button.addEventListener("click", () => {
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      });
    });
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  document.querySelectorAll("[data-weather-carousel]").forEach(initWeather);
  initBackToTop();
})();
