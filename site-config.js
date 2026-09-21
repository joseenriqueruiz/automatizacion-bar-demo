window.BAR_DEMO_CONFIG = Object.freeze({
  identity: {
    name: "La Posta del Valle",
    primaryName: "La Posta",
    secondaryName: "del Valle",
    mark: "LP",
    descriptor: "demo adaptable",
    tagline: "Una tradición en San Pedro de Colalao",
  },
  location: { town: "San Pedro de Colalao", province: "Tucumán", display: "San Pedro de Colalao, Tucumán" },
  service: { schedule: "Todos los días · 08:00 a 00:00", shortSchedule: "08:00 a 00:00" },
  contact: { whatsappEnabled: false, whatsappNumber: "", display: "Se configura para cada bar" },
  deployment: { publicUrl: "https://joseenriqueruiz.github.io/automatizacion-bar-demo/", qrImagesReady: true },
  theme: {
    ink: "#251a12", paper: "#f6efe3", paperDeep: "#ead7bb", surface: "#fffaf2", line: "#d7c1a6",
    accent: "#11d9e7", accentDark: "#087b83", warm: "#b95c32", dark: "#1b2118",
  },
});

const demoTheme = window.BAR_DEMO_CONFIG.theme;
const themeMap = { ink: "--ink", paper: "--paper", paperDeep: "--paper-deep", surface: "--surface", line: "--line", accent: "--accent", accentDark: "--accent-dark", warm: "--warm", dark: "--dark" };
Object.entries(themeMap).forEach(([key, variable]) => document.documentElement.style.setProperty(variable, demoTheme[key]));
