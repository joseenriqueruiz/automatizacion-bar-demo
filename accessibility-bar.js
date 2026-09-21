(() => {
  const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇦🇷', google: '' },
    { code: 'pt', label: 'Português', flag: '🇧🇷', google: 'pt' },
    { code: 'en', label: 'English', flag: '🇺🇸', google: 'en' },
    { code: 'zh', label: '中文', flag: '🇨🇳', google: 'zh-CN' },
  ]
  const FONT_STEPS = [87.5, 100, 112.5, 125, 137.5]
  const DEFAULT_FONT_INDEX = 1
  const STORAGE_KEY = 'automatizacion-bar-a11y-v1'

  const icons = {
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    language: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7M7.5 3v2c0 4-2 7-5 9M5 10c1 2 3 4 6 5M13 19l4-10 4 10M14.5 15h5"/></svg>',
    type: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
  }

  function readPreferences() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return value && typeof value === 'object' ? value : {}
    } catch {
      return {}
    }
  }

  function writePreferences(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // La accesibilidad sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  }

  function setTranslateCookie(language) {
    const host = window.location.hostname
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT;max-age=0'
    const domains = new Set([''])

    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      const parts = host.split('.')
      for (let index = 0; index < parts.length - 1; index += 1) {
        const domain = parts.slice(index).join('.')
        domains.add(domain)
        domains.add(`.${domain}`)
      }
    }

    domains.forEach((domain) => {
      const domainPart = domain ? `;domain=${domain}` : ''
      document.cookie = `googtrans=;path=/;${expired}${domainPart}`
    })

    if (!language) {
      document.body.style.top = '0px'
      return
    }

    const value = `/es/${language}`
    document.cookie = `googtrans=${value};path=/`
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      document.cookie = `googtrans=${value};path=/;domain=.${host}`
    }
  }

  function applyGoogleLanguage(language, attempt = 0) {
    setTranslateCookie(language)
    const select = document.querySelector('.goog-te-combo')
    if (select) {
      const value = language || ''
      if (select.value !== value) {
        select.value = value
        select.dispatchEvent(new Event('change'))
      }
      return
    }
    if (attempt < 25) {
      window.setTimeout(() => applyGoogleLanguage(language, attempt + 1), 120)
    }
  }

  function loadGoogleTranslate() {
    if (document.getElementById('google-translate-script')) return
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'es',
          includedLanguages: 'es,en,pt,zh-CN',
          autoDisplay: false,
        },
        'google_translate_element',
      )
    }
    const script = document.createElement('script')
    script.id = 'google-translate-script'
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    script.onerror = () => {
      const status = document.querySelector('[data-a11y-status]')
      if (status) status.textContent = 'La traducción necesita conexión a internet.'
    }
    document.body.appendChild(script)
  }

  function init() {
    if (document.querySelector('[data-accessibility-bar]')) return

    const stored = readPreferences()
    const state = {
      language: LANGUAGES.some((item) => item.code === stored.language) ? stored.language : 'es',
      fontIndex: Number.isInteger(stored.fontIndex)
        ? Math.min(Math.max(stored.fontIndex, 0), FONT_STEPS.length - 1)
        : DEFAULT_FONT_INDEX,
      highContrast: Boolean(stored.highContrast),
    }

    const host = document.createElement('div')
    host.dataset.accessibilityBar = ''
    host.className = 'a11y-bar'
    host.innerHTML = `
      <div id="google_translate_element" class="a11y-google-host" aria-hidden="true"></div>
      <section class="a11y-panel" id="accessibility-panel" aria-label="Acceso e idiomas" hidden>
        <header class="a11y-panel__header">
          <p>${icons.globe}<span>Acceso e idiomas</span></p>
          <button class="a11y-icon-button" type="button" data-a11y-close aria-label="Cerrar panel">${icons.close}</button>
        </header>
        <div class="a11y-panel__body">
          <div class="a11y-section">
            <h2>${icons.language}<span>Traducción automática</span></h2>
            <div class="a11y-languages">
              ${LANGUAGES.map((item) => `
                <button type="button" data-a11y-language="${item.code}" aria-pressed="false">
                  <span aria-hidden="true">${item.flag}</span><strong>${item.label}</strong>
                </button>
              `).join('')}
            </div>
            <p class="a11y-status" data-a11y-status aria-live="polite">La traducción usa Google y requiere internet.</p>
          </div>
          <div class="a11y-section">
            <h2>${icons.type}<span>Lectura</span></h2>
            <div class="a11y-setting">
              <span>Tamaño del texto</span>
              <div class="a11y-font-controls">
                <button type="button" data-a11y-font="decrease" aria-label="Disminuir tamaño del texto">−</button>
                <output data-a11y-font-value aria-live="polite"></output>
                <button type="button" data-a11y-font="increase" aria-label="Aumentar tamaño del texto">+</button>
              </div>
            </div>
            <div class="a11y-setting a11y-setting--contrast">
              <span><strong>Alto contraste</strong><small>Mejora la separación visual</small></span>
              <button class="a11y-switch" type="button" role="switch" aria-checked="false" data-a11y-contrast aria-label="Activar alto contraste">
                <span>${icons.sun}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <button class="a11y-trigger" type="button" aria-expanded="false" aria-controls="accessibility-panel" aria-label="Abrir acceso e idiomas" data-a11y-trigger>
        ${icons.globe}
      </button>
    `
    document.body.appendChild(host)

    const mobileLayout = window.matchMedia('(max-width: 680px)')
    const pageHeader = document.querySelector('header')
    const placeHost = () => {
      if (mobileLayout.matches && pageHeader) pageHeader.insertAdjacentElement('afterend', host)
      else document.body.appendChild(host)
    }
    placeHost()
    mobileLayout.addEventListener?.('change', placeHost)

    const panel = host.querySelector('.a11y-panel')
    const trigger = host.querySelector('[data-a11y-trigger]')
    const closeButton = host.querySelector('[data-a11y-close]')
    const contrastButton = host.querySelector('[data-a11y-contrast]')
    const fontOutput = host.querySelector('[data-a11y-font-value]')
    const decreaseButton = host.querySelector('[data-a11y-font="decrease"]')
    const increaseButton = host.querySelector('[data-a11y-font="increase"]')

    function saveAndApply() {
      document.documentElement.style.fontSize = `${FONT_STEPS[state.fontIndex]}%`
      document.documentElement.classList.toggle('a11y-high-contrast', state.highContrast)
      document.documentElement.lang = state.language === 'es' ? 'es-AR' : state.language
      fontOutput.value = `${FONT_STEPS[state.fontIndex]}%`
      fontOutput.textContent = `${FONT_STEPS[state.fontIndex]}%`
      decreaseButton.disabled = state.fontIndex === 0
      increaseButton.disabled = state.fontIndex === FONT_STEPS.length - 1
      contrastButton.setAttribute('aria-checked', String(state.highContrast))
      contrastButton.setAttribute('aria-label', `${state.highContrast ? 'Desactivar' : 'Activar'} alto contraste`)
      contrastButton.querySelector('span').innerHTML = state.highContrast ? icons.moon : icons.sun
      host.querySelectorAll('[data-a11y-language]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.a11yLanguage === state.language))
      })
      writePreferences(state)
    }

    function setOpen(open, restoreFocus = false) {
      panel.hidden = !open
      host.classList.toggle('is-open', open)
      trigger.setAttribute('aria-expanded', String(open))
      trigger.setAttribute('aria-label', `${open ? 'Cerrar' : 'Abrir'} acceso e idiomas`)
      trigger.innerHTML = open ? icons.close : icons.globe
      if (open) closeButton.focus()
      if (!open && restoreFocus) trigger.focus()
    }

    trigger.addEventListener('click', () => setOpen(panel.hidden, panel.hidden))
    closeButton.addEventListener('click', () => setOpen(false, true))
    decreaseButton.addEventListener('click', () => {
      state.fontIndex = Math.max(0, state.fontIndex - 1)
      saveAndApply()
    })
    increaseButton.addEventListener('click', () => {
      state.fontIndex = Math.min(FONT_STEPS.length - 1, state.fontIndex + 1)
      saveAndApply()
    })
    contrastButton.addEventListener('click', () => {
      state.highContrast = !state.highContrast
      saveAndApply()
    })
    host.querySelectorAll('[data-a11y-language]').forEach((button) => {
      button.addEventListener('click', () => {
        const option = LANGUAGES.find((item) => item.code === button.dataset.a11yLanguage)
        if (!option) return
        state.language = option.code
        saveAndApply()
        if (!option.google) {
          // Google no siempre expone una opción vacía para volver al idioma
          // original. Limpiar sus cookies y recargar restaura el HTML en español.
          setTranslateCookie('')
          window.location.reload()
          return
        }
        applyGoogleLanguage(option.google)
      })
    })
    document.addEventListener('pointerdown', (event) => {
      if (!panel.hidden && !host.contains(event.target)) setOpen(false)
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false, true)
    })

    saveAndApply()
    loadGoogleTranslate()
    const selected = LANGUAGES.find((item) => item.code === state.language)
    if (selected?.google) window.setTimeout(() => applyGoogleLanguage(selected.google), 400)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
