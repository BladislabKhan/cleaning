const STORAGE_KEY = "aquablesk_admin_local_store_v3";
const SESSION_KEY = "aquablesk_admin_local_session_v3";
const DEMO_DATA_VERSION = 4;
const HOME_HASH_PREFIX = "#home/";
const SCREEN_META = {
  dashboard: { eyebrow: "Панель сайта", title: "Дашборд" },
  leads: { eyebrow: "CRM", title: "Заявки" },
  builder: { eyebrow: "Страницы и блоки", title: "Конструктор" },
  reviews: { eyebrow: "Сущности сайта", title: "Отзывы" },
  gallery: { eyebrow: "Сущности сайта", title: "Галерея" },
  beforeafter: { eyebrow: "Сущности сайта", title: "До и после" },
  menus: { eyebrow: "Навигация", title: "Меню сайта" },
  settings: { eyebrow: "Системные настройки", title: "Настройки сайта" },
};
const BUILDER_PAGES = [
  { id: "home", label: "Главная" },
  { id: "privacy", label: "Политика" },
  { id: "user-agreement", label: "Соглашение" },
  { id: "thank-you", label: "Спасибо" },
];
const CONSTRUCTOR_NAV_ITEMS = [
  { id: "home", kind: "builder", label: "Главная" },
  { id: "reviews", kind: "screen", label: "Отзывы" },
  { id: "gallery", kind: "screen", label: "Галерея" },
  { id: "beforeafter", kind: "screen", label: "До и после" },
  { id: "menus", kind: "screen", label: "Меню" },
  { id: "privacy", kind: "builder", label: "Политика" },
  { id: "user-agreement", kind: "builder", label: "Соглашение" },
  { id: "thank-you", kind: "builder", label: "Спасибо" },
];
const CRM_STATUSES = ["новая", "дозвон", "согласовано", "подтверждено", "выезд", "выполнено", "отменено"];
const CUSTOM_BLOCK_TEMPLATES = {
  "rich-text": {
    label: "Текстовый блок",
    defaults: {
      title: "Новый блок",
      text: "Добавьте сюда текст блока.",
      buttonLabel: "",
      buttonHref: "#home/contacts",
    },
  },
  "feature-cards": {
    label: "Блок с карточками",
    defaults: {
      title: "Новый блок",
      subtitle: "",
      cards: [
        { id: createId(), title: "Карточка 1", text: "Опишите ценность карточки." },
        { id: createId(), title: "Карточка 2", text: "Опишите ценность карточки." },
      ],
    },
  },
  "cta-banner": {
    label: "CTA-баннер",
    defaults: {
      eyebrow: "Новый блок",
      title: "Призыв к действию",
      text: "Коротко опишите, что должен сделать пользователь.",
      primaryButtonLabel: "Оставить заявку",
      primaryButtonHref: "#home/contacts",
      secondaryButtonLabel: "Написать в MAX",
      secondaryButtonHref: "https://max.ru/",
    },
  },
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const loginPanel = $("[data-login-panel]");
const loginForm = $("[data-login-form]");
const loginStatus = $("[data-login-status]");
const appShell = $("[data-app-shell]");
const saveAllButton = $("[data-save-all]");
const logoutButton = $("[data-logout]");
const openFrontendButton = $("[data-open-frontend]");
const resetSiteButton = $("[data-reset-site]");
const dirtyIndicator = $("[data-dirty-indicator]");
const currentUserNode = $("[data-current-user]");
const sidebarNav = $(".sidebar-nav");
const constructorTrigger = $("[data-open-constructor]");
const constructorNav = $("[data-constructor-nav]");
const screenTitleNode = $("[data-screen-title]");
const screenEyebrowNode = $("[data-screen-eyebrow]");
const screenPanels = $$("[data-screen-panel]");
const screenButtons = $$("[data-screen-target]");
const dashboardStats = $("[data-dashboard-stats]");
const dashboardActions = $("[data-dashboard-actions]");
const dashboardLogs = $("[data-dashboard-logs]");
const leadsEditor = $("[data-leads-editor]");
const builderPagesNode = $("[data-builder-pages]");
const builderAddBlockNode = $("[data-builder-add-block]");
const builderCanvas = $("[data-builder-canvas]");
const reviewsEditor = $("[data-reviews-editor]");
const galleryEditor = $("[data-gallery-editor]");
const beforeAfterEditor = $("[data-beforeafter-editor]");
const menusEditor = $("[data-menus-editor]");
const settingsEditor = $("[data-settings-editor]");

const runtime = {
  backendAvailable: false,
  saving: false,
};

function isStaticAdminHost() {
  const { hostname, protocol } = window.location;
  return protocol === "file:" || hostname.endsWith(".github.io");
}

function isDefaultLocalAdminCredentials(username, password) {
  return username === "admin" && password === "admin";
}

async function openLocalAdminSession(user) {
  runtime.backendAvailable = false;
  localStorage.setItem(SESSION_KEY, user.username);
  state.currentUser = user;
  await loadEditorState();
  applyScreenFromHash();
  openAdminPanel();
}

const state = {
  screen: "dashboard",
  builderPage: "home",
  seoPage: "home",
  navMode: "main",
  lastMainScreen: "dashboard",
  builderBlocksMenuOpen: false,
  currentUser: null,
  settings: {},
  reviews: [],
  beforeAfter: [],
  gallery: [],
  leads: [],
  analytics: null,
  logs: [],
  stats: {},
  snapshot: "",
  selectedLeadId: "",
  leadDraft: null,
  leadFilters: {
    search: "",
    status: "all",
  },
  reviewFilters: {
    source: "all",
  },
  profileDraft: {
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  },
};

function createId() {
  return `id-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? deepClone(overrideValue) : deepClone(baseValue);
  }

  if (!isObject(baseValue)) {
    return overrideValue === undefined ? baseValue : deepClone(overrideValue);
  }

  const result = {};
  const keys = new Set([...Object.keys(baseValue || {}), ...Object.keys(overrideValue || {})]);
  keys.forEach((key) => {
    const baseEntry = baseValue?.[key];
    const overrideEntry = overrideValue?.[key];
    if (isObject(baseEntry) || Array.isArray(baseEntry)) {
      result[key] = mergeDeep(baseEntry, overrideEntry);
      return;
    }
    result[key] = overrideEntry === undefined ? baseEntry : deepClone(overrideEntry);
  });
  return result;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("ru-RU").format(numeric);
}

function isAbsoluteUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(String(value || ""));
}

function normalizeAdminMediaUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("/") || isAbsoluteUrl(raw)) return raw;
  return raw.startsWith("../") ? raw : `../${raw.replace(/^(\.\/)+/, "")}`;
}

function getBrandPreviewData(settings = state.settings) {
  const site = settings.site || {};
  const media = settings.media || {};
  const brandName = site.brandName || site.title || "АкваБлеск";
  return {
    brandName,
    brandMark: site.brandMark || "АБ",
    logo: normalizeAdminMediaUrl(media.logo || ""),
    logoAlt: `${brandName} логотип`,
  };
}

function getFooterSettingsSnapshot(settings = state.settings) {
  const site = settings.site || {};
  const footer = isObject(site.footer) ? site.footer : {};
  return {
    brandDescription: footer.brandDescription || site.footerCopy || "Клининг квартир, домов и коммерческих помещений в Хабаровске. Понятные условия, фиксированная стоимость и аккуратный результат.",
    navigationTitle: footer.navigationTitle || "Навигация",
    contactsTitle: footer.contactsTitle || "Контакты",
    contactsNote: footer.contactsNote || "",
    bottomText: footer.bottomText || "",
    privacyLabel: footer.privacyLabel || "Политика конфиденциальности",
    agreementLabel: footer.agreementLabel || "Пользовательское соглашение",
  };
}

function renderAdminBrandPreviewMarkup(className = "") {
  const { brandName, brandMark, logo, logoAlt } = getBrandPreviewData();
  return `
    <div class="menu-brand-preview${className ? ` ${className}` : ""}">
      ${logo
        ? `<span class="menu-brand-preview__logo-shell"><img class="menu-brand-preview__logo" src="${escapeHtml(logo)}" alt="${escapeHtml(logoAlt)}"></span>`
        : `<span class="menu-brand-preview__mark">${escapeHtml(brandMark)}</span>`}
      <span class="menu-brand-preview__title">${escapeHtml(brandName)}</span>
    </div>`;
}

function renderMenuPreviewMarkup(scopeKey, items = []) {
  const visibleItems = items.filter((item) => item && item.visible !== false && String(item.label || "").trim());
  const linksMarkup = visibleItems.length
    ? visibleItems.map((item) => `<span class="menu-preview__link">${escapeHtml(item.label)}</span>`).join("")
    : `<p class="menu-preview__empty">Пока нет видимых пунктов меню.</p>`;

  if (scopeKey === "primary") {
    return `
      <div class="menu-preview menu-preview--primary">
        <p class="menu-preview__eyebrow">Превью основного меню</p>
        <div class="menu-preview__bar">
          ${renderAdminBrandPreviewMarkup()}
          <div class="menu-preview__links">${linksMarkup}</div>
        </div>
        <p class="menu-preview__helper">Логотип и бренд автоматически берутся из раздела «Бренд и медиа».</p>
      </div>`;
  }

  const site = state.settings.site || {};
  const brandName = site.brandName || site.title || "АкваБлеск";
  const footer = getFooterSettingsSnapshot();
  return `
    <div class="menu-preview menu-preview--footer">
      <p class="menu-preview__eyebrow">Превью футера</p>
      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-5">
          <span class="menu-preview__title">Бренд</span>
          <p class="menu-preview__copy">${escapeHtml(brandName)}</p>
          <p class="menu-preview__copy">${escapeHtml(footer.brandDescription)}</p>
        </div>
        <div class="col-12 col-md-4">
          <span class="menu-preview__title">${escapeHtml(footer.navigationTitle)}</span>
          <div class="menu-preview__links">${linksMarkup}</div>
        </div>
        <div class="col-12 col-md-3">
          <span class="menu-preview__title">${escapeHtml(footer.contactsTitle)}</span>
          <p class="menu-preview__contact">${escapeHtml(site.phoneDisplay || "Телефон не указан")}</p>
          <p class="menu-preview__contact">${escapeHtml(site.hours || "Режим работы не указан")}</p>
          <p class="menu-preview__contact">${escapeHtml(site.city || "Город не указан")}</p>
        </div>
      </div>
      ${footer.contactsNote ? `<p class="menu-preview__helper">${escapeHtml(footer.contactsNote)}</p>` : ""}
    </div>`;
}

function normalizeBlockAnchorInput(value, fallback = "section") {
  const normalize = (input) => String(input || "")
    .trim()
    .replace(/^#home\//i, "")
    .replace(/^home\//i, "")
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/[\\/]+/g, "-")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const resolved = normalize(value);
  const fallbackValue = normalize(fallback);
  return resolved || fallbackValue || "section";
}

function getHomeBlocks() {
  return Array.isArray(state.settings.pages?.home?.blocks) ? state.settings.pages.home.blocks : [];
}

function buildHomeBlockAnchorMap(blocks = getHomeBlocks()) {
  const anchorMap = new Map();
  const usedAnchors = new Set();
  blocks.forEach((block) => {
    if (!block?.id) return;
    const baseAnchor = normalizeBlockAnchorInput(block.anchor || block.id || block.label || "section", block.id || block.label || "section");
    let uniqueAnchor = baseAnchor;
    let suffix = 2;
    while (usedAnchors.has(uniqueAnchor)) {
      uniqueAnchor = `${baseAnchor}-${suffix}`;
      suffix += 1;
    }
    usedAnchors.add(uniqueAnchor);
    anchorMap.set(block.id, uniqueAnchor);
  });
  return anchorMap;
}

function getResolvedHomeBlockAnchor(blockOrId, anchorMap = buildHomeBlockAnchorMap()) {
  const blockId = typeof blockOrId === "string" ? blockOrId : blockOrId?.id;
  if (blockId && anchorMap.has(blockId)) {
    return anchorMap.get(blockId);
  }
  if (typeof blockOrId === "object" && blockOrId) {
    return normalizeBlockAnchorInput(blockOrId.anchor || blockOrId.id || blockOrId.label || "section", blockOrId.id || blockOrId.label || "section");
  }
  return normalizeBlockAnchorInput(blockId, "section");
}

function buildHomeBlockMenuHref(blockOrId, anchorMap = buildHomeBlockAnchorMap()) {
  const anchor = getResolvedHomeBlockAnchor(blockOrId, anchorMap);
  return anchor ? `${HOME_HASH_PREFIX}${anchor}` : "#home";
}

function createSuggestedHomeBlockAnchor(source) {
  const baseAnchor = normalizeBlockAnchorInput(source, "block");
  const usedAnchors = new Set(buildHomeBlockAnchorMap().values());
  let uniqueAnchor = baseAnchor;
  let suffix = 2;
  while (usedAnchors.has(uniqueAnchor)) {
    uniqueAnchor = `${baseAnchor}-${suffix}`;
    suffix += 1;
  }
  return uniqueAnchor;
}

function detectMenuBlockTargetByHref(href, anchorMap = buildHomeBlockAnchorMap()) {
  const resolvedHref = String(href || "").trim();
  if (!resolvedHref) return "";
  const match = getHomeBlocks().find((block) => buildHomeBlockMenuHref(block, anchorMap) === resolvedHref);
  return match?.id || "";
}

function getHomeBlockMenuOptions(anchorMap = buildHomeBlockAnchorMap()) {
  return getHomeBlocks().map((block) => ({
    value: block.id,
    label: `${block.label || BLOCK_SCHEMAS[block.type]?.label || "Блок"} (${buildHomeBlockMenuHref(block, anchorMap)})`,
  }));
}

function hydrateMenuBlockTargets() {
  const anchorMap = buildHomeBlockAnchorMap();
  ["primary", "footer"].forEach((scope) => {
    const items = state.settings.menus?.[scope];
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (!item.blockTarget) {
        item.blockTarget = detectMenuBlockTargetByHref(item.href, anchorMap);
      }
      if (item.blockTarget && !findHomeBlock(item.blockTarget)) {
        item.blockTarget = "";
      }
      if (item.blockTarget) {
        item.href = buildHomeBlockMenuHref(item.blockTarget, anchorMap);
      }
    });
  });
}

function formatDayLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(5);
  }
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date);
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function createEmptyAnalyticsSnapshot() {
  return {
    isDemo: false,
    kpi: {
      visitorsToday: 0,
      uniqueToday: 0,
      pageViewsToday: 0,
      visitors7d: 0,
      visitors30d: 0,
      unique30d: 0,
      onlineNow: 0,
    },
    trend: [],
    topPages: [],
    topReferrers: [],
    devices: [],
    totals: {
      pageViews: 0,
      visitors: 0,
      uniqueVisitors: 0,
    },
    generatedAt: "",
  };
}

function hasAnalyticsData(snapshot) {
  if (!snapshot) return false;
  const analytics = mergeDeep(createEmptyAnalyticsSnapshot(), snapshot);
  if (Number(analytics.totals?.pageViews || 0) > 0) return true;
  if (Number(analytics.totals?.visitors || 0) > 0) return true;
  if (Number(analytics.totals?.uniqueVisitors || 0) > 0) return true;
  return Array.isArray(analytics.trend)
    && analytics.trend.some((item) => Number(item?.pageViews || 0) > 0 || Number(item?.uniqueVisitors || 0) > 0);
}

function createFakeAnalyticsSnapshot() {
  const now = new Date();
  const trend = [];
  let totalPageViews = 0;
  let totalVisitors = 0;
  let totalUniqueVisitors = 0;

  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() - offset);
    const uniqueVisitors = 24 + ((offset * 11) % 17) + (offset % 3 === 0 ? 6 : 0);
    const visitors = uniqueVisitors + 7 + (offset % 4);
    const pageViews = visitors * 2 + 18 + (offset % 5) * 3;
    trend.push({
      day: day.toISOString(),
      uniqueVisitors,
      visitors,
      pageViews,
    });
    totalPageViews += pageViews;
    totalVisitors += visitors;
    totalUniqueVisitors += uniqueVisitors;
  }

  const today = trend[trend.length - 1] || { visitors: 0, uniqueVisitors: 0, pageViews: 0 };
  const trend7d = trend.slice(-7);

  return {
    isDemo: true,
    kpi: {
      visitorsToday: today.visitors,
      uniqueToday: today.uniqueVisitors,
      pageViewsToday: today.pageViews,
      visitors7d: trend7d.reduce((sum, item) => sum + Number(item.visitors || 0), 0),
      visitors30d: 1248,
      unique30d: 836,
      onlineNow: 4,
    },
    trend,
    topPages: [
      { path: "home", pageViews: 842 },
      { path: "services", pageViews: 516 },
      { path: "projects", pageViews: 337 },
      { path: "reviews", pageViews: 294 },
      { path: "contacts", pageViews: 258 },
    ],
    topReferrers: [
      { source: "direct", visits: 389 },
      { source: "google.com", visits: 271 },
      { source: "2gis.ru", visits: 124 },
      { source: "max.ru", visits: 87 },
    ],
    devices: [
      { device: "mobile", visits: 694 },
      { device: "desktop", visits: 421 },
      { device: "tablet", visits: 97 },
      { device: "other", visits: 36 },
    ],
    totals: {
      pageViews: totalPageViews,
      visitors: totalVisitors,
      uniqueVisitors: totalUniqueVisitors,
    },
    generatedAt: now.toISOString(),
  };
}

function normalizeLeadStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return CRM_STATUSES.includes(status) ? status : "новая";
}

function formatLeadStatus(value) {
  const status = normalizeLeadStatus(value);
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function isDemoLeadRecord(lead) {
  return /^lead-demo-/i.test(String(lead?.id || "").trim());
}

function getDemoLeadRecords(leads = state.leads) {
  return (Array.isArray(leads) ? leads : []).filter((lead) => isDemoLeadRecord(lead));
}

function getLeadMetrics(leads = []) {
  const statuses = leads.map((lead) => normalizeLeadStatus(lead.status));
  return {
    total: statuses.length,
    fresh: statuses.filter((status) => status === "новая").length,
    active: statuses.filter((status) => !["выполнено", "отменено"].includes(status)).length,
    confirmed: statuses.filter((status) => ["подтверждено", "выезд"].includes(status)).length,
    completed: statuses.filter((status) => status === "выполнено").length,
  };
}

function getLeadStatusBadgeClass(status) {
  const normalized = normalizeLeadStatus(status);
  if (normalized === "новая") return "is-attention";
  if (normalized === "выполнено") return "is-success";
  if (normalized === "отменено") return "is-muted";
  return "is-info";
}

function formatPathLabel(value) {
  const normalized = String(value || "/")
    .trim()
    .replace(/^#/, "")
    .replace(/\/+$/, "")
    .replace(/^\/+/, "");
  const labels = {
    "": "Главная",
    home: "Главная",
    privacy: "Политика",
    "user-agreement": "Соглашение",
    "thank-you": "Спасибо",
    contacts: "Контакты",
    services: "Услуги",
    gallery: "Галерея",
    reviews: "Отзывы",
  };
  return labels[normalized] || normalized || "Главная";
}

function formatReferrerLabel(value) {
  const source = String(value || "").trim();
  if (!source || source === "direct") return "Прямой заход";
  return source.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function formatDeviceLabel(value) {
  const device = String(value || "unknown").trim().toLowerCase();
  const labels = {
    mobile: "Mobile",
    desktop: "Desktop",
    tablet: "Tablet",
    unknown: "Неизвестно",
  };
  return labels[device] || device || "Неизвестно";
}

function buildLeadSearchText(lead) {
  return [
    lead?.name,
    lead?.phone,
    lead?.email,
    lead?.service,
    lead?.source,
    lead?.message,
    lead?.comment,
    lead?.adminComment,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getFilteredLeads() {
  const search = state.leadFilters.search.trim().toLowerCase();
  return [...state.leads]
    .filter((lead) => state.leadFilters.status === "all" || normalizeLeadStatus(lead.status) === state.leadFilters.status)
    .filter((lead) => !search || buildLeadSearchText(lead).includes(search))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function ensureLeadSelection() {
  if (state.leadDraft) {
    state.selectedLeadId = "";
    return;
  }
  if (state.selectedLeadId && state.leads.some((lead) => lead.id === state.selectedLeadId)) {
    return;
  }
  state.selectedLeadId = state.leads[0]?.id || "";
}

function getSelectedLead() {
  return state.leadDraft || state.leads.find((lead) => lead.id === state.selectedLeadId) || null;
}

function createEmptyLeadDraft() {
  return {
    id: "",
    name: "",
    phone: "",
    email: "",
    service: "",
    source: "site",
    status: "новая",
    confirmed: false,
    scheduledAt: "",
    adminComment: "",
    message: "",
    createdAt: "",
    updatedAt: "",
  };
}

function createDefaultDemoLeads() {
  const now = new Date();
  const toIso = (dayOffset, hour = 10, minute = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  return [
    {
      id: "lead-demo-001",
      name: "Анна М.",
      phone: "+7 914 120-45-18",
      email: "anna.demo@example.com",
      service: "Генеральная уборка квартиры",
      source: "demo",
      status: CRM_STATUSES[0],
      confirmed: false,
      scheduledAt: toIso(1, 11, 30),
      adminComment: "Перезвонить до обеда, уточнить площадь и наличие животных.",
      message: "Нужна генеральная уборка двухкомнатной квартиры после гостей.",
      createdAt: toIso(-1, 9, 12),
      updatedAt: toIso(-1, 9, 12),
    },
    {
      id: "lead-demo-002",
      name: "Дмитрий К.",
      phone: "+7 924 555-10-40",
      email: "dmitry.demo@example.com",
      service: "Уборка после ремонта",
      source: "demo",
      status: CRM_STATUSES[2],
      confirmed: true,
      scheduledAt: toIso(2, 15, 0),
      adminComment: "Согласована бригада на 15:00, нужны средства для плитки и окон.",
      message: "После ремонта в офисе нужно убрать пыль, окна и санузел.",
      createdAt: toIso(-2, 14, 35),
      updatedAt: toIso(-1, 16, 10),
    },
    {
      id: "lead-demo-003",
      name: "Елена С.",
      phone: "+7 902 331-78-22",
      email: "elena.demo@example.com",
      service: "Поддерживающая уборка",
      source: "demo",
      status: CRM_STATUSES[3],
      confirmed: true,
      scheduledAt: toIso(0, 18, 30),
      adminComment: "Клиент подтвердил выезд, предупредить за час.",
      message: "Нужна регулярная уборка раз в неделю, начать можно сегодня вечером.",
      createdAt: toIso(-3, 11, 20),
      updatedAt: toIso(0, 9, 40),
    },
    {
      id: "lead-demo-004",
      name: "Марина П.",
      phone: "+7 908 700-33-91",
      email: "marina.demo@example.com",
      service: "Уборка кухни и санузла",
      source: "demo",
      status: CRM_STATUSES[1],
      confirmed: false,
      scheduledAt: "",
      adminComment: "Не дозвонились с первого раза, повторить звонок вечером.",
      message: "Хочу узнать стоимость уборки кухни и ванной комнаты.",
      createdAt: toIso(-1, 18, 5),
      updatedAt: toIso(-1, 18, 5),
    },
    {
      id: "lead-demo-005",
      name: "Оксана В.",
      phone: "+7 914 880-64-09",
      email: "oksana.demo@example.com",
      service: "Мытьё окон",
      source: "demo",
      status: CRM_STATUSES[5],
      confirmed: true,
      scheduledAt: toIso(-1, 13, 0),
      adminComment: "Работа закрыта, клиент доволен, можно попросить отзыв.",
      message: "Нужно помыть окна в квартире и на балконе.",
      createdAt: toIso(-5, 10, 15),
      updatedAt: toIso(-1, 15, 45),
    },
  ];
}

function buildLeadPayload(form) {
  const existingLead = state.leads.find((lead) => lead.id === form.elements.leadId.value) || state.leadDraft;
  return {
    leadId: form.elements.leadId.value,
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim(),
    email: form.elements.email.value.trim(),
    service: form.elements.service.value.trim(),
    source: existingLead?.source || "site",
    status: normalizeLeadStatus(form.elements.status.value),
    scheduledAt: fromLocalDateTime(form.elements.scheduledAt.value),
    confirmed: form.elements.confirmed.checked,
    comment: form.elements.comment.value.trim(),
    message: form.elements.message.value.trim(),
  };
}

function renderMiniList(items, emptyMessage) {
  if (!items.length) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="mini-list">
      ${items.map((item) => `
        <div class="mini-list__row">
          <div class="mini-list__label">
            <span class="mini-list__title">${escapeHtml(item.title || "—")}</span>
            ${item.note ? `<span class="mini-list__note">${escapeHtml(item.note)}</span>` : ""}
          </div>
          <span class="mini-list__value">${escapeHtml(item.value || "0")}</span>
        </div>`).join("")}
    </div>`;
}

function renderTrendBars(trend = [], generatedAt = "", isDemo = false) {
  const items = Array.isArray(trend) ? trend.slice(-14) : [];
  if (!items.length) {
    return `<div class="analytics-trend-card"><div class="empty-state">Данные трафика появятся после первых посещений сайта.</div></div>`;
  }

  const maxViews = Math.max(...items.map((item) => Number(item.pageViews || 0)), 1);
  return `
    <div class="analytics-trend-card">
      <div class="analytics-trend-card__head">
        <div>
          <strong>Трафик за 14 дней</strong>
          <span class="analytics-trend-card__meta">Просмотры и уникальные посетители по дням</span>
        </div>
        <span class="analytics-trend-card__meta">${isDemo ? "Тестовые данные" : (generatedAt ? `Обновлено ${formatDateTime(generatedAt)}` : "Живая статистика")}</span>
      </div>
      <div class="analytics-trend-bars">
        ${items.map((item) => {
          const pageViews = Number(item.pageViews || 0);
          const height = Math.max(Math.round((pageViews / maxViews) * 160), 24);
          return `
            <div class="analytics-trend-bar">
              <span class="analytics-trend-bar__value">${escapeHtml(formatNumber(pageViews))}</span>
              <div class="analytics-trend-bar__column" style="height: ${height}px"></div>
              <span class="analytics-trend-bar__label">${escapeHtml(formatDayLabel(item.day))}</span>
            </div>`;
        }).join("")}
      </div>
    </div>`;
}

function prependDashboardLog(message, action) {
  state.logs = [
    {
      id: createId(),
      action,
      actor: state.currentUser?.username || "admin",
      message,
      createdAt: new Date().toISOString(),
    },
    ...state.logs.slice(0, 19),
  ];
}

function setStatus(node, message, status = "") {
  if (!node) return;
  node.className = "status-line";
  node.textContent = message || "";
  if (status) node.classList.add(`is-${status}`);
}

function getByPath(target, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function setByPath(target, path, value) {
  const keys = String(path || "").split(".").filter(Boolean);
  let cursor = target;
  while (keys.length > 1) {
    const key = keys.shift();
    if (!isObject(cursor[key]) && !Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[keys[0]] = value;
}

function loadLocalStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function persistAnalyticsPreview(snapshot = null) {
  const localStore = hydrateLocalStore(loadLocalStore());
  localStore.analyticsPreview = snapshot ? mergeDeep(createEmptyAnalyticsSnapshot(), snapshot) : null;
  saveLocalStore(localStore);
}

function createLegacyDefaultReviews() {
  return [
    {
      id: createId(),
      author: "Анна М.",
      source: "Яндекс Карты",
      rating: 5,
      text: "Заказывала генеральную уборку квартиры. Всё заранее обсудили, стоимость не менялась, результатом осталась довольна.",
      published: true,
      publishedAt: new Date().toISOString(),
      link: "https://yandex.ru/maps/",
      qrBinding: "yandex",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      author: "Дмитрий К.",
      source: "2ГИС",
      rating: 5,
      text: "Убирали офис после ремонта. Приехали вовремя, спокойно всё сделали и оставили после себя действительно чистое помещение.",
      published: true,
      publishedAt: new Date().toISOString(),
      link: "https://2gis.ru/",
      qrBinding: "gis",
      createdAt: new Date().toISOString(),
    },
  ];
}

function createDefaultBeforeAfter() {
  return [
    { id: createId(), title: "Диван", description: "", beforeAlt: "", afterAlt: "", before: "assets/before-living-gray-2026.jpg", after: "assets/after-living-gray-2026.jpg", published: true },
    { id: createId(), title: "Санузел", description: "", beforeAlt: "", afterAlt: "", before: "assets/before-shower-2026.jpg", after: "assets/after-shower-2026.jpg", published: true },
    { id: createId(), title: "Диван, крупный план", description: "", beforeAlt: "", afterAlt: "", before: "assets/before-living-beige-2026.jpg", after: "assets/after-living-beige-2026.jpg", published: true },
    { id: createId(), title: "Вентиляционная решётка", description: "", beforeAlt: "", afterAlt: "", before: "assets/before-vent-2026.jpg", after: "assets/after-vent-2026.jpg", published: true },
  ];
}

function ensureRequiredBeforeAfterItems(items = []) {
  const currentItems = Array.isArray(items) ? items : [];
  const existingTitles = new Set(currentItems.map((item) => String(item?.title || "").trim().toLowerCase()).filter(Boolean));
  const missingItems = createDefaultBeforeAfter().filter((item) => {
    const titleKey = String(item.title || "").trim().toLowerCase();
    return titleKey && !existingTitles.has(titleKey);
  });
  return [...currentItems, ...missingItems];
}

function createDefaultReviews() {
  return [
    {
      id: "review-seed-001",
      sourceType: "manual",
      sourceItemId: "",
      author: "Дмитрий К.",
      rating: 5,
      text: "Заказывали уборку после ремонта. Команда справилась отлично: убрали строительную пыль, отмыли плитку и окна.",
      date: "2026-04-17",
      sourceLabel: "Яндекс Карты",
      externalUrl: "https://yandex.ru/maps/",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: true,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-17T00:05:43.1252326Z",
      createdAt: "2026-04-17T00:05:43.1252326Z",
    },
    {
      id: "review-seed-002",
      sourceType: "manual",
      sourceItemId: "",
      author: "Елена М.",
      rating: 5,
      text: "Понравилась аккуратность и пунктуальность. Всё сделали спокойно, без лишней суеты, результат отличный.",
      date: "2026-04-17",
      sourceLabel: "2ГИС",
      externalUrl: "https://2gis.ru/",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: true,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-17T00:05:43.1252326Z",
      createdAt: "2026-04-17T00:05:43.1252326Z",
    },
    {
      id: "review-seed-003",
      sourceType: "manual",
      sourceItemId: "",
      author: "Ирина Л.",
      rating: 5,
      text: "Обращались для уборки квартиры перед сдачей. Понравилось, что заранее обсудили детали и список работ, а на выезде всё сделали без спешки и с аккуратной проверкой результата по комнатам.",
      date: "2026-04-18",
      sourceLabel: "Сайт",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: true,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-18T09:00:00.0000000Z",
      createdAt: "2026-04-18T09:00:00.0000000Z",
    },
    {
      id: "review-seed-004",
      sourceType: "manual",
      sourceItemId: "",
      author: "Андрей Т.",
      rating: 5,
      text: "После ремонта было много пыли в стыках и на подоконниках. Команда приехала вовремя, довела до чистого состояния полы, окна и плитку, по итогу помещение стало полностью готово к работе.",
      date: "2026-04-18",
      sourceLabel: "Сайт",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: false,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-18T10:00:00.0000000Z",
      createdAt: "2026-04-18T10:00:00.0000000Z",
    },
    {
      id: "review-seed-005",
      sourceType: "manual",
      sourceItemId: "",
      author: "Оксана В.",
      rating: 5,
      text: "Заказывала поддерживающую уборку для родителей. Отдельно отмечу вежливость и спокойный формат работы: ничего не затягивали, учли пожелания по химии и аккуратно прошли все чувствительные поверхности.",
      date: "2026-04-19",
      sourceLabel: "Сайт",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: false,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-19T08:30:00.0000000Z",
      createdAt: "2026-04-19T08:30:00.0000000Z",
    },
    {
      id: "review-seed-006",
      sourceType: "manual",
      sourceItemId: "",
      author: "Павел Н.",
      rating: 4,
      text: "Брали разовый выезд на кухню и санузел перед семейным мероприятием. Хорошо отмыли зоны, где обычно остаются сложные следы, и после уборки всё выглядело заметно опрятнее без резких запахов.",
      date: "2026-04-19",
      sourceLabel: "MAX",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: false,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-19T12:15:00.0000000Z",
      createdAt: "2026-04-19T12:15:00.0000000Z",
    },
    {
      id: "review-seed-007",
      sourceType: "manual",
      sourceItemId: "",
      author: "Марина С.",
      rating: 5,
      text: "Вызывали команду перед приездом гостей: важно было быстро привести в порядок квартиру и не повредить деликатные покрытия. Ребята приехали вовремя, заранее уточнили приоритетные зоны и очень аккуратно прошли кухню, санузел и прихожую.",
      date: "2026-04-20",
      sourceLabel: "Телефон",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: false,
      isImported: false,
      importedAt: "",
      updatedAt: "2026-04-20T01:00:00.0000000Z",
      createdAt: "2026-04-20T01:00:00.0000000Z",
    },
  ];
}

function getDefaultReviewsIntegration() {
  return {
    note: "Для Яндекс официально поддерживаются ссылка на карточку организации и виджет/бейдж. Прямой импорт отзывов в кастомный слайдер официально недоступен.",
    yandex: {
      enabled: false,
      provider: "yandex",
      connectionType: "businessUrl",
      businessUrl: "https://yandex.ru/maps/",
      organizationId: "",
      widgetCode: "",
      widgetUrl: "",
      previewTitle: "Яндекс Карты",
      previewUrl: "https://yandex.ru/maps/",
      status: "idle",
      mode: "fallback_only",
      statusMessage: "Интеграция не настроена.",
      lastCheckedAt: "",
      lastSyncedAt: "",
      lastError: "",
    },
    gisBusinessUrl: "https://2gis.ru/",
  };
}

function normalizeReviewSourceType(value) {
  return String(value || "manual").trim().toLowerCase() === "yandex" ? "yandex" : "manual";
}

function normalizeReviewConnectionType(value) {
  const normalized = String(value || "businessUrl").trim().toLowerCase();
  if (normalized === "organizationid") return "organizationId";
  if (normalized === "widgetcode") return "widgetCode";
  if (normalized === "widgeturl") return "widgetUrl";
  return "businessUrl";
}

function normalizeReviewDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString().slice(0, 10);
}

function normalizeReviewEntity(item = {}) {
  const sourceType = normalizeReviewSourceType(item.sourceType);
  const sourceLabel = String(item.sourceLabel || item.source || (sourceType === "yandex" ? "Яндекс Карты" : "Сайт")).trim();
  const sourceButtonLabel = String(item.sourceButtonLabel || item.buttonLabel || item.sourceActionLabel || "Источник").trim() || "Источник";
  const sourceUrl = String(item.sourceUrl || item.sourceLink || item.externalUrl || item.link || "").trim();
  const date = normalizeReviewDate(item.date || item.publishedAt || item.createdAt);
  const createdAt = String(item.createdAt || new Date().toISOString());
  const updatedAt = String(item.updatedAt || createdAt);
  const isPublished = item.isPublished !== undefined ? Boolean(item.isPublished) : item.published !== false;
  return {
    id: item.id || createId(),
    sourceType,
    sourceItemId: String(item.sourceItemId || "").trim(),
    author: String(item.author || "").trim(),
    rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
    text: String(item.text || "").trim(),
    date,
    sourceLabel,
    sourceButtonLabel,
    sourceUrl,
    externalUrl: sourceUrl,
    avatarUrl: String(item.avatarUrl || "").trim(),
    isPublished,
    isHidden: Boolean(item.isHidden),
    isFeatured: Boolean(item.isFeatured),
    isImported: item.isImported !== undefined ? Boolean(item.isImported) : sourceType !== "manual",
    importedAt: String(item.importedAt || ""),
    updatedAt,
    createdAt,
    source: sourceLabel,
    published: isPublished,
    publishedAt: date,
    buttonLabel: sourceButtonLabel,
    link: sourceUrl,
    qrBinding: sourceType === "yandex" || /яндекс/i.test(sourceLabel) ? "yandex" : (/2gis|2гис/i.test(sourceLabel) ? "gis" : ""),
  };
}

function normalizeReviewsCollection(items = []) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => normalizeReviewEntity(item))
    .filter((item) => {
      const dedupeKey = item.sourceItemId
        ? `${item.sourceType}:${item.sourceItemId}`
        : `${item.author.toLowerCase()}|${item.text.toLowerCase()}|${item.date}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
}

function ensureReviewsIntegrationShape(settings = state.settings) {
  if (!isObject(settings)) {
    state.settings = isObject(state.settings) ? state.settings : {};
    settings = state.settings;
  }
  const defaults = getDefaultReviewsIntegration();
  const legacy = settings.reviewsIntegration || {};
  const yandex = legacy.yandex || {};
  const nextValue = {
    note: legacy.note || defaults.note,
    yandex: {
      ...defaults.yandex,
      ...yandex,
      enabled: yandex.enabled !== undefined ? Boolean(yandex.enabled) : false,
      connectionType: normalizeReviewConnectionType(yandex.connectionType || defaults.yandex.connectionType),
      businessUrl: yandex.businessUrl || legacy.yandexBusinessUrl || defaults.yandex.businessUrl,
      organizationId: yandex.organizationId || "",
      widgetCode: yandex.widgetCode || "",
      widgetUrl: yandex.widgetUrl || legacy.yandexWidgetUrl || "",
      previewTitle: yandex.previewTitle || defaults.yandex.previewTitle,
      previewUrl: yandex.previewUrl || yandex.widgetUrl || yandex.businessUrl || legacy.yandexBusinessUrl || defaults.yandex.previewUrl,
      status: yandex.status || defaults.yandex.status,
      mode: yandex.mode || defaults.yandex.mode,
      statusMessage: yandex.statusMessage || defaults.yandex.statusMessage,
      lastCheckedAt: yandex.lastCheckedAt || "",
      lastSyncedAt: yandex.lastSyncedAt || "",
      lastError: yandex.lastError || "",
    },
    gisBusinessUrl: legacy.gisBusinessUrl || defaults.gisBusinessUrl,
  };
  settings.reviewsIntegration = nextValue;
  return nextValue;
}

function extractYandexWidgetUrlFromCode(value) {
  const raw = String(value || "");
  const match = raw.match(/src\\s*=\\s*["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function createBaseSettings() {
  const defaults = window.SITE_EDITOR_DEFAULTS?.settings || {};
  const siteConfig = window.SITE_CONFIG || {};
  const nextSettings = mergeDeep(defaults, siteConfig);
  if (siteConfig.seo?.title) nextSettings.seo.global.title = siteConfig.seo.title;
  if (siteConfig.seo?.description) nextSettings.seo.global.description = siteConfig.seo.description;
  return nextSettings;
}

function createDefaultGallery(settings, beforeAfter) {
  const entries = [];
  const pushImage = (src, alt = "", title = "", tags = []) => {
    if (!src || entries.some((item) => item.src === src)) return;
    entries.push({ id: createId(), src, alt, title, caption: "", published: true, tags });
  };

  getByPath(settings, "pages.home.blocks")
    ?.forEach((block) => {
      if (block.type === "hero") {
        pushImage(block.content?.image?.src, block.content?.image?.alt, "Hero image", ["hero"]);
      }
      if (block.type === "services-grid") {
        (block.content?.items || []).forEach((item) => {
          pushImage(item.image?.src, item.image?.alt, item.title, ["services"]);
        });
      }
    });
  (settings.pages?.["services-page"]?.items || []).forEach((item) => {
    pushImage(item.image?.src, item.image?.alt, item.title, ["services-page"]);
  });
  (beforeAfter || []).forEach((item) => {
    pushImage(item.before, item.beforeAlt || item.title, `До — ${item.title}`, ["before-after"]);
    pushImage(item.after, item.afterAlt || item.title, `После — ${item.title}`, ["before-after"]);
  });
  return entries;
}

function getFallbackEditorPages(base) {
  const homeBlocks = Array.isArray(base.pages?.home?.blocks) ? deepClone(base.pages.home.blocks) : [];
  const servicesBlock = homeBlocks.find((block) => block?.type === "services-grid");
  const reviewsBlock = homeBlocks.find((block) => block?.type === "reviews-hub");
  const reviewCards = isObject(base.reviewCards) ? base.reviewCards : {};

  const serviceItems = Array.isArray(servicesBlock?.content?.items)
    ? servicesBlock.content.items.map((item, index) => ({
      id: item?.id || `service-page-item-${index + 1}`,
      title: item?.title || `Услуга ${index + 1}`,
      text: Array.isArray(item?.bullets) ? item.bullets.join("\n") : "",
      image: {
        src: item?.image?.src || "",
        alt: item?.image?.alt || item?.title || "",
      },
      reverse: Boolean(index % 2),
      buttonLabel: "Вызвать клинера",
    }))
    : [];

  const reviewPlatforms = Object.entries(reviewCards).map(([platformKey, card], index) => ({
    id: `reviews-platform-${platformKey || index + 1}`,
    title: card?.title || platformKey || `Платформа ${index + 1}`,
    rating: card?.rating || "",
    buttonLabel: card?.buttonLabel || "Открыть",
  }));

  return {
    home: {
      blocks: homeBlocks,
    },
    "services-page": {
      title: servicesBlock?.content?.title || "Услуги",
      items: serviceItems,
    },
    "reviews-page": {
      title: reviewsBlock?.content?.title || "Отзывы",
      heading: reviewsBlock?.content?.widgetTitle || "Отзывы клиентов",
      platforms: reviewPlatforms,
      items: [],
    },
    "contacts-page": {
      title: base.contactMap?.title || "Контакты",
      formTitle: "Оставить заявку",
      formButtonLabel: "Отправить заявку",
      formDisclaimer: "Мы свяжемся с вами, уточним детали и согласуем удобное время.",
      formPlaceholders: {
        name: "Ваше имя",
        phone: "Телефон",
        email: "E-mail",
        message: "Опишите задачу",
      },
    },
    privacy: isObject(base.pages?.privacy)
      ? deepClone(base.pages.privacy)
      : {
        title: "Политика конфиденциальности",
        subtitle: "Обработка персональных данных",
        html: "",
      },
    "user-agreement": isObject(base.pages?.["user-agreement"])
      ? deepClone(base.pages["user-agreement"])
      : {
        title: "Пользовательское соглашение",
        subtitle: "Условия использования сайта",
        html: "",
      },
    "thank-you": isObject(base.pages?.["thank-you"])
      ? deepClone(base.pages["thank-you"])
      : {
        title: "Спасибо за заявку!",
        message: "Заявка принята. Мы скоро свяжемся с вами.",
        primaryButtonLabel: "На главную",
        primaryButtonHref: "#home",
        secondaryButtonLabel: "Позвонить сейчас",
      },
  };
}

function ensurePageDefaults(settings) {
  const base = createBaseSettings();
  const merged = mergeDeep(base, settings || {});
  const fallbackPages = getFallbackEditorPages(base);

  if (!isObject(merged.pages)) {
    merged.pages = {};
  }

  Object.entries(fallbackPages).forEach(([pageKey, fallbackPage]) => {
    merged.pages[pageKey] = mergeDeep(fallbackPage, merged.pages?.[pageKey] || {});
  });

  if (!Array.isArray(merged.pages.home?.blocks)) {
    merged.pages.home.blocks = deepClone(fallbackPages.home.blocks);
  }
  if (!Array.isArray(merged.pages["services-page"]?.items)) {
    merged.pages["services-page"].items = deepClone(fallbackPages["services-page"].items);
  }
  if (!Array.isArray(merged.pages["reviews-page"]?.platforms)) {
    merged.pages["reviews-page"].platforms = deepClone(fallbackPages["reviews-page"].platforms);
  }
  if (!Array.isArray(merged.pages["reviews-page"]?.items)) {
    merged.pages["reviews-page"].items = deepClone(fallbackPages["reviews-page"].items);
  }
  return merged;
}

function createDefaultLocalStore() {
  const settings = ensurePageDefaults(createBaseSettings());
  const beforeAfter = createDefaultBeforeAfter();
  return {
    demoVersion: DEMO_DATA_VERSION,
    settings,
    leads: createDefaultDemoLeads(),
    demoLeadArchive: [],
    reviews: createDefaultReviews(),
    beforeAfter,
    gallery: createDefaultGallery(settings, beforeAfter),
    analyticsPreview: null,
    logs: [],
    users: [
      { id: "admin", username: "admin", password: "admin", email: "admin@aquablesk.local", role: "admin" },
      { id: "moderator", username: "moderator", password: "moderator", email: "moderator@aquablesk.local", role: "moderator" },
    ],
  };
}

function createFactoryResetPayload() {
  const defaults = createDefaultLocalStore();
  return {
    settings: ensurePageDefaults(deepClone(defaults.settings)),
    reviews: deepClone(defaults.reviews),
    beforeAfter: deepClone(defaults.beforeAfter),
    gallery: deepClone(defaults.gallery),
  };
}

function normalizeLocalUsers(users = []) {
  const list = Array.isArray(users) ? deepClone(users) : [];
  const upsertUser = (template) => {
    const index = list.findIndex((entry) => String(entry?.username || "").trim().toLowerCase() === template.username);
    const normalized = {
      id: template.id,
      username: template.username,
      password: template.password,
      email: template.email,
      role: template.role,
      ...(index >= 0 && isObject(list[index]) ? list[index] : {}),
    };
    normalized.id = template.id;
    normalized.username = template.username;
    normalized.password = template.password;
    normalized.email = template.email;
    normalized.role = template.role;
    if (index >= 0) {
      list[index] = normalized;
    } else {
      list.unshift(normalized);
    }
  };

  upsertUser({ id: "admin", username: "admin", password: "admin", email: "admin@aquablesk.local", role: "admin" });
  upsertUser({ id: "moderator", username: "moderator", password: "moderator", email: "moderator@aquablesk.local", role: "moderator" });
  return list;
}

function hydrateLocalStore(store = {}) {
  const defaults = createDefaultLocalStore();
  const nextStore = mergeDeep(defaults, store || {});
  if (!Array.isArray(nextStore.leads)) {
    nextStore.leads = [];
  }
  if (!Array.isArray(nextStore.demoLeadArchive)) {
    nextStore.demoLeadArchive = [];
  }
  if (!nextStore.leads.length && !nextStore.demoLeadArchive.length) {
    nextStore.leads = createDefaultDemoLeads();
  }
  if (!Array.isArray(nextStore.reviews) || !nextStore.reviews.length) {
    nextStore.reviews = defaults.reviews;
  }
  nextStore.beforeAfter = ensureRequiredBeforeAfterItems(
    Array.isArray(nextStore.beforeAfter) && nextStore.beforeAfter.length ? nextStore.beforeAfter : defaults.beforeAfter
  );
  if (!Array.isArray(nextStore.gallery) || !nextStore.gallery.length) {
    nextStore.gallery = createDefaultGallery(nextStore.settings, nextStore.beforeAfter);
  }
  nextStore.analyticsPreview = hasAnalyticsData(nextStore.analyticsPreview)
    ? mergeDeep(createEmptyAnalyticsSnapshot(), nextStore.analyticsPreview)
    : null;
  nextStore.users = normalizeLocalUsers(nextStore.users);
  nextStore.settings = ensurePageDefaults(nextStore.settings);
  nextStore.demoVersion = DEMO_DATA_VERSION;
  return nextStore;
}

function serializePersistedState() {
  return JSON.stringify({
    settings: state.settings,
    reviews: state.reviews,
    beforeAfter: state.beforeAfter,
    gallery: state.gallery,
  });
}

function syncDirtyState(saved = false) {
  const isDirty = serializePersistedState() !== state.snapshot;
  dirtyIndicator.className = "dirty-indicator";
  if (saved) {
    dirtyIndicator.classList.add("is-saved");
    dirtyIndicator.textContent = "Изменения сохранены";
    return;
  }
  if (isDirty) {
    dirtyIndicator.classList.add("is-dirty");
    dirtyIndicator.textContent = "Есть несохранённые изменения";
    return;
  }
  dirtyIndicator.textContent = "Без изменений";
}

function computeStats() {
  const visibleBlocks = (state.settings.pages?.home?.blocks || []).filter((item) => item.visible !== false).length;
  state.stats = {
    blocks: visibleBlocks,
    reviews: state.reviews.length,
    gallery: state.gallery.length,
    beforeAfter: state.beforeAfter.length,
  };
}

async function probeBackend() {
  if (isStaticAdminHost()) {
    runtime.backendAvailable = false;
    return false;
  }

  try {
    const response = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const contentType = response.headers.get("content-type") || "";
    runtime.backendAvailable = (response.status === 200 || response.status === 401) && contentType.includes("application/json");
    return runtime.backendAvailable;
  } catch {
    runtime.backendAvailable = false;
    return false;
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Ошибка запроса");
  }
  return payload;
}

function getYandexReviewSettings() {
  return ensureReviewsIntegrationShape(state.settings).yandex;
}

function getReviewSourceFilterOptions() {
  const dynamicSources = [...new Set(state.reviews.map((item) => item.sourceType || "manual"))];
  return [
    { value: "all", label: "Все источники" },
    ...dynamicSources.map((sourceType) => ({
      value: sourceType,
      label: sourceType === "yandex" ? "Яндекс" : "Ручные / локальные",
    })),
  ];
}

function getFilteredReviews() {
  if (state.reviewFilters.source === "all") return state.reviews;
  return state.reviews.filter((item) => item.sourceType === state.reviewFilters.source);
}

function buildReviewStatusChips(item) {
  return [
    `<span class="chip">${item.sourceType === "yandex" ? "Яндекс" : "Ручной"}</span>`,
    `<span class="chip">${item.isImported ? "Импортированный" : "Локальный"}</span>`,
    `<span class="chip ${item.isPublished ? "" : "is-hidden"}">${item.isPublished ? "Опубликован" : "Снят с публикации"}</span>`,
    item.isHidden ? `<span class="chip is-hidden">Скрыт</span>` : "",
    item.isFeatured ? `<span class="chip">В слайдере</span>` : "",
    item.date ? `<span class="chip">${escapeHtml(item.date)}</span>` : "",
  ].filter(Boolean).join("");
}

function validateYandexConnectionLocally(config = getYandexReviewSettings()) {
  const connectionType = normalizeReviewConnectionType(config.connectionType);
  if (!config.enabled) {
    throw new Error("Сначала включите интеграцию Яндекс.");
  }
  if (connectionType === "businessUrl") {
    if (!String(config.businessUrl || "").trim()) throw new Error("Укажите ссылку на организацию в Яндекс Картах.");
    if (!/^https:\/\//i.test(config.businessUrl)) throw new Error("Ссылка на Яндекс должна начинаться с https://");
    if (!/yandex\.(ru|com)/i.test(config.businessUrl)) throw new Error("Укажите официальную ссылку Яндекс.");
  }
  if (connectionType === "organizationId" && !/^\d+$/.test(String(config.organizationId || "").trim())) {
    throw new Error("Идентификатор организации Яндекс должен содержать только цифры.");
  }
  if (connectionType === "widgetCode") {
    if (!/<iframe/i.test(String(config.widgetCode || ""))) throw new Error("Ожидается iframe-код официального виджета.");
    if (!config.widgetUrl) {
      config.widgetUrl = extractYandexWidgetUrlFromCode(config.widgetCode);
    }
  }
  if (connectionType === "widgetUrl") {
    if (!/^https:\/\//i.test(String(config.widgetUrl || "").trim())) throw new Error("URL виджета должен начинаться с https://");
  }
  return {
    previewTitle: connectionType === "organizationId" ? "ID организации" : (connectionType === "widgetCode" ? "Код виджета" : (connectionType === "widgetUrl" ? "URL виджета" : "Ссылка на организацию")),
    previewUrl: config.widgetUrl || config.businessUrl || "",
    message: "Прямой импорт отзывов Яндекс в кастомный слайдер официально недоступен. Используется fallback-режим с официальным виджетом или ссылкой на карточку.",
  };
}

async function saveReviewsSettings() {
  ensureReviewsIntegrationShape(state.settings);
  await saveAllChanges();
  renderReviewsEditor();
}

async function checkYandexConnection() {
  const yandex = getYandexReviewSettings();
  const statusNode = $("[data-review-yandex-status]", reviewsEditor);
  setStatus(statusNode, "Проверяем подключение...", "loading");
  try {
    const result = validateYandexConnectionLocally({ ...yandex });
    state.settings.reviewsIntegration.yandex = {
      ...yandex,
      enabled: true,
      previewTitle: result.previewTitle,
      previewUrl: result.previewUrl,
      status: "ready",
      mode: "fallback_only",
      statusMessage: result.message,
      lastCheckedAt: new Date().toISOString(),
      lastError: "",
    };
    renderReviewsEditor();
    setStatus($("[data-review-yandex-status]", reviewsEditor), state.settings.reviewsIntegration.yandex.statusMessage, "success");
  } catch (error) {
    state.settings.reviewsIntegration.yandex.status = "error";
    state.settings.reviewsIntegration.yandex.lastError = error.message;
    state.settings.reviewsIntegration.yandex.statusMessage = error.message;
    state.settings.reviewsIntegration.yandex.lastCheckedAt = new Date().toISOString();
    renderReviewsEditor();
    setStatus($("[data-review-yandex-status]", reviewsEditor), error.message, "error");
  }
}

async function syncYandexReviews() {
  const yandex = getYandexReviewSettings();
  const statusNode = $("[data-review-yandex-status]", reviewsEditor);
  setStatus(statusNode, "Синхронизируем настройки источника...", "loading");
  try {
    const result = validateYandexConnectionLocally({ ...yandex });
    state.settings.reviewsIntegration.yandex = {
      ...yandex,
      enabled: true,
      previewTitle: result.previewTitle,
      previewUrl: result.previewUrl,
      status: "fallback_only",
      mode: "fallback_only",
      statusMessage: result.message,
      lastSyncedAt: new Date().toISOString(),
      lastError: "",
    };
    saveToLocalStore();
    renderReviewsEditor();
    setStatus($("[data-review-yandex-status]", reviewsEditor), result.message, "success");
  } catch (error) {
    state.settings.reviewsIntegration.yandex.status = "error";
    state.settings.reviewsIntegration.yandex.lastError = error.message;
    state.settings.reviewsIntegration.yandex.statusMessage = error.message;
    renderReviewsEditor();
    setStatus($("[data-review-yandex-status]", reviewsEditor), error.message, "error");
  }
}

async function uploadFile(file) {
  if (!file) return "";
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

  if (!runtime.backendAvailable) {
    return dataUrl;
  }

  const payload = await api("/api/admin/upload", {
    method: "POST",
    body: JSON.stringify({
      name: file.name,
      type: file.type,
      dataUrl,
    }),
  });
  return payload.path || "";
}

function setScreen(nextScreen) {
  state.screen = SCREEN_META[nextScreen] ? nextScreen : "dashboard";
  state.navMode = isConstructorScreen(state.screen) ? "constructor" : "main";
  if (!isConstructorScreen(state.screen)) {
    state.lastMainScreen = state.screen;
  }
  screenPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.screenPanel !== state.screen);
  });
  screenButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenTarget === state.screen);
  });
  renderBuilderPageTabs();
  syncSidebarNavigation();
  screenTitleNode.textContent = SCREEN_META[state.screen].title;
  screenEyebrowNode.textContent = SCREEN_META[state.screen].eyebrow;
  if (appShell && !appShell.classList.contains("is-hidden")) {
    history.replaceState(null, "", `#${state.screen}`);
  }
}

function buildPreviewUrl() {
  const route = (() => {
    if (state.screen === "builder") return state.builderPage;
    if (state.screen === "reviews") return "home/reviews";
    if (state.screen === "gallery" || state.screen === "beforeafter") return "home/projects";
    if (state.screen === "leads") return "home/contacts";
    return "home";
  })();
  const siteUrl = new URL("../index.html", window.location.href);
  siteUrl.hash = route === "home" ? "home" : route;
  return siteUrl.href;
}

function syncCurrentUser() {
  if (!currentUserNode) return;
  if (!state.currentUser) {
    currentUserNode.textContent = "—";
    return;
  }
  currentUserNode.textContent = `${state.currentUser.username} · ${state.currentUser.role || "admin"}`;
}

function ensureProfileDraft() {
  state.profileDraft.username = state.currentUser?.username || "";
  state.profileDraft.email = state.currentUser?.email || "";
  state.profileDraft.currentPassword = "";
  state.profileDraft.newPassword = "";
}

function isConstructorScreen(screen) {
  return ["builder", "reviews", "gallery", "beforeafter", "menus"].includes(screen);
}

function syncSidebarNavigation() {
  const constructorMode = state.navMode === "constructor" || isConstructorScreen(state.screen);
  sidebarNav?.classList.toggle("is-constructor-mode", constructorMode);
  constructorNav?.classList.toggle("is-hidden", !constructorMode);
  constructorTrigger?.classList.toggle("is-active", constructorMode);
}

function applyScreenFromHash() {
  const hashScreen = window.location.hash.replace(/^#/, "");
  if (SCREEN_META[hashScreen]) {
    state.screen = hashScreen;
  }
}

async function loadEditorState(options = {}) {
  if (runtime.backendAvailable) {
    const localStore = hydrateLocalStore(loadLocalStore());
    saveLocalStore(localStore);
    if (options.user) {
      state.currentUser = options.user;
    } else {
      const sessionPayload = await api("/api/admin/session", { method: "GET" });
      state.currentUser = sessionPayload.user || null;
    }
    const [editorResult, analyticsResult, leadsResult] = await Promise.allSettled([
      api("/api/admin/editor", { method: "GET" }),
      api("/api/admin/dashboard", { method: "GET" }),
      api("/api/admin/leads", { method: "GET" }),
    ]);
    if (editorResult.status !== "fulfilled") {
      throw editorResult.reason;
    }
    const payload = editorResult.value;
    state.settings = ensurePageDefaults(payload.settings || {});
    ensureReviewsIntegrationShape(state.settings);
    state.reviews = normalizeReviewsCollection(Array.isArray(payload.reviews) ? payload.reviews : []);
    state.beforeAfter = Array.isArray(payload.beforeAfter) ? payload.beforeAfter : [];
    state.gallery = Array.isArray(payload.gallery) && payload.gallery.length
      ? payload.gallery
      : createDefaultGallery(state.settings, state.beforeAfter);
    state.logs = Array.isArray(payload.logs) ? payload.logs : [];
    const dashboardAnalytics = analyticsResult.status === "fulfilled"
      ? mergeDeep(createEmptyAnalyticsSnapshot(), analyticsResult.value || {})
      : createEmptyAnalyticsSnapshot();
    state.analytics = !hasAnalyticsData(dashboardAnalytics) && hasAnalyticsData(localStore.analyticsPreview)
      ? mergeDeep(createEmptyAnalyticsSnapshot(), localStore.analyticsPreview)
      : dashboardAnalytics;
    state.leads = leadsResult.status === "fulfilled" && Array.isArray(leadsResult.value?.items)
      ? leadsResult.value.items
      : [];
    hydrateMenuBlockTargets();
    ensureLeadSelection();
    computeStats();
    state.snapshot = serializePersistedState();
    ensureProfileDraft();
    return;
  }

  const localStore = hydrateLocalStore(loadLocalStore());
  saveLocalStore(localStore);
  const currentUsername = localStorage.getItem(SESSION_KEY);
  state.currentUser = (localStore.users || []).find((item) => item.username === currentUsername) || null;
  state.settings = localStore.settings;
  ensureReviewsIntegrationShape(state.settings);
  state.reviews = normalizeReviewsCollection(localStore.reviews || []);
  state.beforeAfter = ensureRequiredBeforeAfterItems(localStore.beforeAfter || []);
  state.gallery = localStore.gallery || [];
  state.leads = Array.isArray(localStore.leads) ? localStore.leads : [];
  state.analytics = hasAnalyticsData(localStore.analyticsPreview)
    ? mergeDeep(createEmptyAnalyticsSnapshot(), localStore.analyticsPreview)
    : createEmptyAnalyticsSnapshot();
  state.logs = localStore.logs || [];
  hydrateMenuBlockTargets();
  ensureLeadSelection();
  computeStats();
  state.snapshot = serializePersistedState();
  ensureProfileDraft();
}

function openAdminPanel() {
  setStatus(loginStatus, "");
  loginPanel.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  renderAll();
}

function saveToLocalStore() {
  hydrateMenuBlockTargets();
  ensureReviewsIntegrationShape(state.settings);
  state.reviews = normalizeReviewsCollection(state.reviews);
  const localStore = hydrateLocalStore(loadLocalStore());
  localStore.settings = deepClone(state.settings);
  localStore.reviews = deepClone(state.reviews);
  localStore.beforeAfter = deepClone(state.beforeAfter);
  localStore.gallery = deepClone(state.gallery);
  localStore.logs = [
    {
      id: createId(),
      action: "editor.saved",
      actor: state.currentUser?.username || "admin",
      message: "Сохранены данные конструктора сайта",
      createdAt: new Date().toISOString(),
    },
    ...(localStore.logs || []).slice(0, 19),
  ];
  saveLocalStore(localStore);
  state.logs = localStore.logs;
  state.snapshot = serializePersistedState();
}

async function restoreEditorStateAfterResetFailure(previousState) {
  if (runtime.backendAvailable) {
    try {
      await loadEditorState({ user: state.currentUser });
      renderAll();
      return;
    } catch {
      // Fall back to restoring local in-memory state when the backend state cannot be fetched.
    }
  }

  state.settings = previousState.settings;
  state.reviews = previousState.reviews;
  state.beforeAfter = previousState.beforeAfter;
  state.gallery = previousState.gallery;
  state.profileDraft = previousState.profileDraft;
  state.snapshot = previousState.snapshot;
  hydrateMenuBlockTargets();
  renderAll();
}

async function resetSiteToDefaults() {
  const confirmed = window.confirm("Сбросить сайт к базовой версии? Будут восстановлены блоки, меню, отзывы, галерея, тексты и настройки сайта. Заявки, аналитика и вход в админку не изменятся.");
  if (!confirmed) return;

  const previousState = {
    settings: deepClone(state.settings),
    reviews: deepClone(state.reviews),
    beforeAfter: deepClone(state.beforeAfter),
    gallery: deepClone(state.gallery),
    profileDraft: deepClone(state.profileDraft),
    snapshot: state.snapshot,
  };
  const defaults = createFactoryResetPayload();

  state.settings = defaults.settings;
  state.reviews = defaults.reviews;
  state.beforeAfter = defaults.beforeAfter;
  state.gallery = defaults.gallery;
  ensureProfileDraft();
  hydrateMenuBlockTargets();
  renderAll();

  dirtyIndicator.className = "dirty-indicator";
  dirtyIndicator.textContent = "Восстанавливаем базовую версию...";

  try {
    await saveAllChanges();
    window.alert("Сайт возвращён к базовой версии.");
  } catch (error) {
    await restoreEditorStateAfterResetFailure(previousState);
    throw error;
  }
}

async function persistLeadPayload(payload) {
  if (!payload.leadId) {
    if (runtime.backendAvailable) {
      const response = await api("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          service: payload.service,
          source: payload.source,
          status: payload.status,
          scheduledAt: payload.scheduledAt,
          confirmed: payload.confirmed,
          comment: payload.comment,
          message: payload.message,
        }),
      });
      const createdLead = response.item || {
        id: createId(),
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        service: payload.service,
        source: payload.source,
        status: payload.status,
        scheduledAt: payload.scheduledAt,
        confirmed: payload.confirmed,
        adminComment: payload.comment,
        message: payload.message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.leads = [createdLead, ...state.leads.filter((lead) => lead.id !== createdLead.id)];
      return createdLead.id;
    }

    const localStore = hydrateLocalStore(loadLocalStore());
    const createdLead = {
      id: createId(),
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service: payload.service,
      source: payload.source,
      status: payload.status,
      confirmed: payload.confirmed,
      scheduledAt: payload.scheduledAt,
      adminComment: payload.comment,
      message: payload.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStore.leads = [createdLead, ...(Array.isArray(localStore.leads) ? localStore.leads : [])];
    saveLocalStore(localStore);
    state.leads = [createdLead, ...state.leads];
    return createdLead.id;
  }

  if (runtime.backendAvailable) {
    const response = await api(`/api/admin/leads/${encodeURIComponent(payload.leadId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        service: payload.service,
        source: payload.source,
        status: payload.status,
        scheduledAt: payload.scheduledAt,
        confirmed: payload.confirmed,
        comment: payload.comment,
        message: payload.message,
      }),
    });
    const updatedLead = response.item || {
      ...(state.leads.find((lead) => lead.id === payload.leadId) || {}),
      id: payload.leadId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service: payload.service,
      source: payload.source,
      status: payload.status,
      scheduledAt: payload.scheduledAt,
      confirmed: payload.confirmed,
      adminComment: payload.comment,
      message: payload.message,
      updatedAt: new Date().toISOString(),
    };
    state.leads = state.leads.map((lead) => lead.id === updatedLead.id ? updatedLead : lead);
    return updatedLead.id;
  }

  const localStore = hydrateLocalStore(loadLocalStore());
  const updatedAt = new Date().toISOString();
  localStore.leads = (Array.isArray(localStore.leads) ? localStore.leads : []).map((lead) => {
    if (lead.id !== payload.leadId) return lead;
    return {
      ...lead,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service: payload.service,
      source: payload.source,
      status: payload.status,
      scheduledAt: payload.scheduledAt,
      confirmed: payload.confirmed,
      adminComment: payload.comment,
      message: payload.message,
      updatedAt,
    };
  });
  saveLocalStore(localStore);
  state.leads = state.leads.map((lead) => {
    if (lead.id !== payload.leadId) return lead;
    return {
      ...lead,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service: payload.service,
      source: payload.source,
      status: payload.status,
      scheduledAt: payload.scheduledAt,
      confirmed: payload.confirmed,
      adminComment: payload.comment,
      message: payload.message,
      updatedAt,
    };
  });
  return payload.leadId;
}

async function saveLeadForm(form, successText = "Карточка заявки сохранена") {
  const payload = buildLeadPayload(form);
  const statusNode = $("[data-lead-form-status]", leadsEditor);
  if (!payload.name || !payload.phone) {
    setStatus(statusNode, "Укажите имя и телефон для заявки.", "error");
    return;
  }

  setStatus(statusNode, "Сохраняем...", "loading");
  const leadId = await persistLeadPayload(payload);
  state.leadDraft = null;
  state.selectedLeadId = leadId;
  ensureLeadSelection();
  prependDashboardLog(successText, "lead.saved");
  renderDashboard();
  renderLeadsEditor();
  setStatus($("[data-lead-form-status]", leadsEditor), successText, "success");
}

async function deleteLeadRecord(leadId = "") {
  const targetId = leadId || state.selectedLeadId;
  if (!targetId) return;

  const targetLead = state.leads.find((lead) => lead.id === targetId);
  if (!window.confirm(`Удалить заявку${targetLead?.name ? ` «${targetLead.name}»` : ""}?`)) {
    return;
  }

  if (runtime.backendAvailable) {
    await api(`/api/admin/leads/${encodeURIComponent(targetId)}`, { method: "DELETE" });
  } else {
    const localStore = hydrateLocalStore(loadLocalStore());
    localStore.leads = (Array.isArray(localStore.leads) ? localStore.leads : []).filter((lead) => lead.id !== targetId);
    saveLocalStore(localStore);
  }

  state.leads = state.leads.filter((lead) => lead.id !== targetId);
  state.leadDraft = null;
  state.selectedLeadId = "";
  ensureLeadSelection();
  prependDashboardLog("Заявка удалена", "lead.deleted");
  renderDashboard();
  renderLeadsEditor();
}

async function clearDemoLeadRecords() {
  const demoLeads = getDemoLeadRecords();
  const statusNode = $("[data-leads-action-status]", leadsEditor);
  if (!demoLeads.length) {
    setStatus(statusNode, "Фейковых заявок сейчас нет.", "success");
    return;
  }

  if (!window.confirm(`Убрать из CRM ${demoLeads.length} фейковых заявок? Реальные обращения останутся.`)) {
    return;
  }

  setStatus(statusNode, "Убираем фейковые заявки...", "loading");
  if (runtime.backendAvailable) {
    const response = await api("/api/admin/leads/demo/clear", {
      method: "POST",
      body: "{}",
    });
    state.leads = Array.isArray(response.items) ? response.items : state.leads.filter((lead) => !isDemoLeadRecord(lead));
  } else {
    const localStore = hydrateLocalStore(loadLocalStore());
    localStore.demoLeadArchive = deepClone(demoLeads);
    localStore.leads = (Array.isArray(localStore.leads) ? localStore.leads : []).filter((lead) => !isDemoLeadRecord(lead));
    saveLocalStore(localStore);
    state.leads = localStore.leads;
  }

  state.leadDraft = null;
  if (isDemoLeadRecord(getSelectedLead())) {
    state.selectedLeadId = "";
  }
  ensureLeadSelection();
  prependDashboardLog("Фейковые заявки убраны из CRM", "lead.demo.clear");
  renderDashboard();
  renderLeadsEditor();
  setStatus($("[data-leads-action-status]", leadsEditor), "Фейковые заявки убраны.", "success");
}

async function restoreDemoLeadRecords() {
  const statusNode = $("[data-leads-action-status]", leadsEditor);
  setStatus(statusNode, "Возвращаем фейковые заявки...", "loading");

  if (runtime.backendAvailable) {
    const response = await api("/api/admin/leads/demo/restore", {
      method: "POST",
      body: "{}",
    });
    state.leads = Array.isArray(response.items) ? response.items : state.leads;
  } else {
    const localStore = hydrateLocalStore(loadLocalStore());
    const archivedDemoLeads = getDemoLeadRecords(localStore.demoLeadArchive);
    const demoLeadsToRestore = archivedDemoLeads.length ? archivedDemoLeads : createDefaultDemoLeads();
    const realLeads = (Array.isArray(localStore.leads) ? localStore.leads : []).filter((lead) => !isDemoLeadRecord(lead));
    localStore.leads = [...deepClone(demoLeadsToRestore), ...realLeads];
    localStore.demoLeadArchive = [];
    saveLocalStore(localStore);
    state.leads = localStore.leads;
  }

  state.leadDraft = null;
  ensureLeadSelection();
  prependDashboardLog("Фейковые заявки возвращены в CRM", "lead.demo.restore");
  renderDashboard();
  renderLeadsEditor();
  setStatus($("[data-leads-action-status]", leadsEditor), "Фейковые заявки снова видны в CRM.", "success");
}

async function resetAnalyticsData() {
  if (!window.confirm("Сбросить данные аналитики сайта?")) {
    return;
  }

  if (runtime.backendAvailable) {
    await api("/api/admin/analytics/reset", {
      method: "POST",
      body: "{}",
    });
  }

  state.analytics = createEmptyAnalyticsSnapshot();
  persistAnalyticsPreview(null);
  prependDashboardLog("Данные аналитики сброшены", "analytics.reset");
  renderDashboard();
}

function fillAnalyticsWithDemoData() {
  state.analytics = createFakeAnalyticsSnapshot();
  persistAnalyticsPreview(state.analytics);
  prependDashboardLog("В аналитику подставлены тестовые цифры", "analytics.demo");
  renderDashboard();
}

const BLOCK_SCHEMAS = {
  hero: {
    label: "Первый экран",
    fields: [
      { path: "content.title", label: "Заголовок", type: "textarea", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
      { path: "content.note", label: "Подпись", type: "text", wide: true },
      { path: "content.image.src", label: "Изображение", type: "image", wide: true },
      { path: "content.image.alt", label: "Alt изображения", type: "text", wide: true },
      { path: "content.primaryButton.label", label: "Основная кнопка", type: "text" },
      { path: "content.secondaryButton.label", label: "Вторичная кнопка", type: "text" },
    ],
    collections: [{ path: "content.trustPoints", label: "Тезисы", itemFields: [{ path: "text", label: "Текст", type: "text", wide: true }] }],
  },
  about: {
    label: "О сервисе",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.lead", label: "Основной текст", type: "textarea", wide: true },
      { path: "content.cardsTitle", label: "Заголовок карточек", type: "text", wide: true },
    ],
    collections: [{ path: "content.cards", label: "Карточки", itemFields: [{ path: "icon", label: "Иконка", type: "text" }, { path: "title", label: "Заголовок", type: "text" }, { path: "text", label: "Текст", type: "textarea", wide: true }] }],
  },
  advantages: {
    label: "Преимущества",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
    ],
    collections: [{ path: "content.cards", label: "Карточки", itemFields: [{ path: "title", label: "Заголовок", type: "text" }, { path: "text", label: "Текст", type: "textarea", wide: true }] }],
  },
  steps: {
    label: "Этапы",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
    ],
    collections: [{ path: "content.steps", label: "Шаги", itemFields: [{ path: "number", label: "Номер", type: "text" }, { path: "title", label: "Заголовок", type: "text" }, { path: "text", label: "Текст", type: "textarea", wide: true }] }],
  },
  "services-grid": {
    label: "Сетка услуг",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
    ],
    collections: [{ path: "content.items", label: "Услуги", itemFields: [{ path: "title", label: "Название", type: "text" }, { path: "image.src", label: "Изображение", type: "image", wide: true }, { path: "image.alt", label: "Alt изображения", type: "text", wide: true }], stringCollections: [{ path: "bullets", label: "Пункты" }] }],
  },
  "before-after-showcase": {
    label: "До и после",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
    ],
  },
  "reviews-hub": {
    label: "Отзывы",
    fields: [
      { path: "content.eyebrow", label: "Eyebrow", type: "text" },
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.lead", label: "Подзаголовок", type: "textarea", wide: true },
      { path: "content.widgetEyebrow", label: "Eyebrow виджета", type: "text" },
      { path: "content.widgetTitle", label: "Заголовок виджета", type: "text" },
      { path: "content.widgetText", label: "Текст виджета", type: "textarea", wide: true },
    ],
  },
  faq: {
    label: "FAQ",
    fields: [{ path: "content.title", label: "Заголовок", type: "text", wide: true }],
    collections: [{ path: "content.items", label: "Вопросы", itemFields: [{ path: "question", label: "Вопрос", type: "text", wide: true }, { path: "answer", label: "Ответ", type: "textarea", wide: true }] }],
  },
  contacts: {
    label: "Контакты",
    fields: [
      { path: "content.title", label: "Заголовок секции", type: "text", wide: true },
      { path: "content.cardTitle", label: "Заголовок карточки", type: "text", wide: true },
      { path: "content.note", label: "Пояснение", type: "textarea", wide: true },
      { path: "content.mapEyebrow", label: "Подпись над картой", type: "text" },
      { path: "content.primaryButtonLabel", label: "Кнопка телефона", type: "text" },
      { path: "content.secondaryButtonLabel", label: "Кнопка мессенджера", type: "text" },
    ],
  },
  "rich-text": {
    label: "Текстовый блок",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.text", label: "Текст", type: "textarea", wide: true },
      { path: "content.buttonLabel", label: "Текст кнопки", type: "text" },
      { path: "content.buttonHref", label: "Ссылка кнопки", type: "url" },
    ],
  },
  "feature-cards": {
    label: "Блок с карточками",
    fields: [
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.subtitle", label: "Подзаголовок", type: "textarea", wide: true },
    ],
    collections: [{ path: "content.cards", label: "Карточки", itemFields: [{ path: "title", label: "Заголовок", type: "text" }, { path: "text", label: "Текст", type: "textarea", wide: true }] }],
  },
  "cta-banner": {
    label: "CTA-баннер",
    fields: [
      { path: "content.eyebrow", label: "Eyebrow", type: "text" },
      { path: "content.title", label: "Заголовок", type: "text", wide: true },
      { path: "content.text", label: "Текст", type: "textarea", wide: true },
      { path: "content.primaryButtonLabel", label: "Основная кнопка", type: "text" },
      { path: "content.primaryButtonHref", label: "Ссылка основной кнопки", type: "url" },
      { path: "content.secondaryButtonLabel", label: "Вторичная кнопка", type: "text" },
      { path: "content.secondaryButtonHref", label: "Ссылка вторичной кнопки", type: "url" },
    ],
  },
};

function findHomeBlock(blockId) {
  return (state.settings.pages?.home?.blocks || []).find((item) => item.id === blockId) || null;
}

function findEntityById(collectionName, itemId) {
  return (state[collectionName] || []).find((item) => item.id === itemId) || null;
}

function findMenuItem(scope, itemId) {
  return (state.settings.menus?.[scope] || []).find((item) => item.id === itemId) || null;
}

function findPageCollectionItem(pageKey, collectionName, itemId) {
  return (state.settings.pages?.[pageKey]?.[collectionName] || []).find((item) => item.id === itemId) || null;
}

function renderFieldMarkup({ label, value, type = "text", data = {}, wide = false, helper = "", options = [] }) {
  const attrs = Object.entries(data)
    .map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`)
    .join(" ");
  const className = `field${wide ? " is-wide" : ""}`;
  const safeValue = escapeHtml(value);
  const tag = type === "textarea"
    ? `<textarea class="editor-textarea" ${attrs}>${safeValue}</textarea>`
    : type === "select"
      ? `<select class="editor-select" ${attrs}>${options.map((option) => `<option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>`
      : `<input class="editor-input" type="${type === "image" ? "text" : type}" value="${safeValue}" ${attrs}>`;
  const upload = type === "image"
    ? `<input class="editor-input" type="file" accept=".jpg,.jpeg,.png,.webp,.svg" data-upload-field="true" ${attrs}>`
    : "";
  const helperMarkup = helper ? `<p class="helper-line">${escapeHtml(helper)}</p>` : "";
  return `<label class="${className}"><span>${escapeHtml(label)}</span>${tag}${upload}${helperMarkup}</label>`;
}

function renderCheckboxMarkup(label, checked, data = {}, wide = false) {
  const attrs = Object.entries(data)
    .map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`)
    .join(" ");
  const className = `field${wide ? " is-wide" : ""}`;
  return `<div class="${className}"><label class="checkbox-row"><input type="checkbox" ${checked ? "checked" : ""} ${attrs}><span>${escapeHtml(label)}</span></label></div>`;
}

function renderStringCollection(items = [], data = {}) {
  const rows = items.length
    ? items.map((item, index) => `
      <div class="collection-item">
        <div class="collection-item__head">
          <strong>Пункт ${index + 1}</strong>
          <div class="collection-actions">
            <button class="icon-button" type="button" data-action="string-up" ${Object.entries(data).map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`).join(" ")} data-index="${index}">↑</button>
            <button class="icon-button" type="button" data-action="string-down" ${Object.entries(data).map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`).join(" ")} data-index="${index}">↓</button>
            <button class="icon-button" type="button" data-action="string-remove" ${Object.entries(data).map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`).join(" ")} data-index="${index}">×</button>
          </div>
        </div>
        ${renderFieldMarkup({ label: "Текст", value: item, wide: true, data: { ...data, action: "string-update", index } })}
      </div>`)
      .join("")
    : `<div class="empty-state">Список пуст. Добавьте первый пункт.</div>`;
  return `<div class="collection">${rows}<button class="button button-ghost button-small" type="button" data-action="string-add" ${Object.entries(data).map(([key, entry]) => `data-${key}="${escapeHtml(entry)}"`).join(" ")}>Добавить пункт</button></div>`;
}

function renderObjectCollection(collection = [], schema, context = {}) {
  const itemsMarkup = collection.length
    ? collection.map((item, index) => {
      const controls = `
        <div class="collection-actions">
          <button class="icon-button" type="button" data-action="collection-up" data-scope="${context.scope}" data-block-id="${context.blockId || ""}" data-page="${context.page || ""}" data-collection="${context.collectionPath}" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-action="collection-down" data-scope="${context.scope}" data-block-id="${context.blockId || ""}" data-page="${context.page || ""}" data-collection="${context.collectionPath}" data-id="${item.id}" ${index === collection.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button" type="button" data-action="collection-remove" data-scope="${context.scope}" data-block-id="${context.blockId || ""}" data-page="${context.page || ""}" data-collection="${context.collectionPath}" data-id="${item.id}">×</button>
        </div>`;

      const fields = schema.itemFields.map((field) => renderFieldMarkup({
        label: field.label,
        value: getByPath(item, field.path) || "",
        type: field.type,
        wide: field.wide,
        data: {
          scope: context.scope,
          model: "collection-item",
          blockId: context.blockId || "",
          page: context.page || "",
          collection: context.collectionPath,
          id: item.id,
          path: field.path,
        },
      })).join("");

      const stringCollections = (schema.stringCollections || []).map((stringSchema) => {
        const target = getByPath(item, stringSchema.path) || [];
        return `
          <div class="field is-wide">
            <span>${escapeHtml(stringSchema.label)}</span>
            ${renderStringCollection(target, {
              scope: context.scope,
              blockId: context.blockId || "",
              page: context.page || "",
              collection: context.collectionPath,
              itemId: item.id,
              nestedPath: stringSchema.path,
            })}
          </div>`;
      }).join("");

      return `
        <div class="collection-item">
          <div class="collection-item__head">
            <strong>${escapeHtml(item.title || item.question || item.number || `${schema.label || "Элемент"} ${index + 1}`)}</strong>
            ${controls}
          </div>
          <div class="editor-grid">
            ${fields}
            ${stringCollections}
          </div>
        </div>`;
    }).join("")
    : `<div class="empty-state">Список пуст. Добавьте первый элемент.</div>`;

  return `
    <div class="collection">
      <div class="collection-head">
        <strong>${escapeHtml(schema.label)}</strong>
        <button class="button button-ghost button-small" type="button" data-action="collection-add" data-scope="${context.scope}" data-block-id="${context.blockId || ""}" data-page="${context.page || ""}" data-collection="${context.collectionPath}">Добавить</button>
      </div>
      ${itemsMarkup}
    </div>`;
}

function renderBlockCard(block, index, total, anchorMap) {
  const schema = BLOCK_SCHEMAS[block.type];
  if (!schema) return "";
  const chips = [
    `<span class="chip">${escapeHtml(schema.label)}</span>`,
    block.visible === false ? `<span class="chip is-hidden">Скрыт</span>` : `<span class="chip">Виден</span>`,
    `<span class="chip">${escapeHtml(buildHomeBlockMenuHref(block, anchorMap))}</span>`,
  ].join("");

  const controls = `
    <div class="editor-card__controls">
      <button class="icon-button" type="button" data-action="block-up" data-block-id="${block.id}" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="icon-button" type="button" data-action="block-down" data-block-id="${block.id}" ${index === total - 1 ? "disabled" : ""}>↓</button>
      <button class="icon-button" type="button" data-action="block-toggle" data-block-id="${block.id}">${block.visible === false ? "Показать" : "Скрыть"}</button>
      ${(block.locked || !CUSTOM_BLOCK_TEMPLATES[block.type]) ? "" : `<button class="icon-button" type="button" data-action="block-duplicate" data-block-id="${block.id}">Дубль</button>`}
      ${(block.locked || !CUSTOM_BLOCK_TEMPLATES[block.type]) ? "" : `<button class="icon-button" type="button" data-action="block-remove" data-block-id="${block.id}">Удалить</button>`}
    </div>`;

  const fieldsMarkup = [
    renderFieldMarkup({
      label: "Ссылка блока в меню",
      value: block.anchor || getResolvedHomeBlockAnchor(block, anchorMap),
      wide: true,
      helper: `Можно указать только якорь или полный ${HOME_HASH_PREFIX}... Сейчас блок открывается по ${buildHomeBlockMenuHref(block, anchorMap)}.`,
      data: {
        model: "block",
        blockId: block.id,
        path: "anchor",
      },
    }),
    ...(schema.fields || []).map((field) => renderFieldMarkup({
      label: field.label,
      value: getByPath(block, field.path) || "",
      type: field.type,
      wide: field.wide,
      data: {
        model: "block",
        blockId: block.id,
        path: field.path,
      },
    })),
  ].join("");

  const collectionsMarkup = (schema.collections || []).map((collectionSchema) => {
    const value = getByPath(block, collectionSchema.path) || [];
    return renderObjectCollection(value, collectionSchema, { scope: "block", blockId: block.id, collectionPath: collectionSchema.path });
  }).join("");

  return `
    <article class="editor-card">
      <div class="editor-card__head">
        <div>
          <strong>${escapeHtml(block.label || schema.label)}</strong>
          <div class="editor-card__meta">${chips}</div>
        </div>
        ${controls}
      </div>
      <div class="editor-grid">
        ${fieldsMarkup}
      </div>
      ${collectionsMarkup}
    </article>`;
}

function renderHomeBuilder() {
  const blocks = state.settings.pages?.home?.blocks || [];
  if (!blocks.length) {
    return `<div class="empty-state">Блоки не найдены.</div>`;
  }
  const anchorMap = buildHomeBlockAnchorMap(blocks);
  return blocks.map((block, index) => renderBlockCard(block, index, blocks.length, anchorMap)).join("");
}

function renderDashboard() {
  const analytics = mergeDeep(createEmptyAnalyticsSnapshot(), state.analytics || {});
  const kpi = analytics.kpi || {};
  const totals = analytics.totals || {};
  const topReferrers = (analytics.topReferrers || []).slice(0, 4).map((item) => ({
    title: formatReferrerLabel(item.source),
    note: "Переходы",
    value: formatNumber(item.visits),
  }));
  const devices = (analytics.devices || []).slice(0, 4).map((item) => ({
    title: formatDeviceLabel(item.device),
    note: "Посещения",
    value: formatNumber(item.visits),
  }));

  dashboardStats.innerHTML = [
    { label: "Посетители сегодня", value: kpi.visitorsToday, hint: `Уникальных: ${formatNumber(kpi.uniqueToday)}`, accent: true },
    { label: "Просмотры сегодня", value: kpi.pageViewsToday, hint: `Сейчас на сайте: ${formatNumber(kpi.onlineNow)}` },
    { label: "Сессии за 7 дней", value: kpi.visitors7d, hint: `За 30 дней: ${formatNumber(kpi.visitors30d)}` },
    { label: "Уникальные за 30 дней", value: totals.uniqueVisitors || kpi.unique30d, hint: `Всего просмотров: ${formatNumber(totals.pageViews)}` },
  ].map((item, index) => `
      <div class="analytics-kpi-card ${item.accent && index === 0 ? "analytics-kpi-card--accent" : ""}">
        <span class="analytics-kpi-card__label">${escapeHtml(item.label)}</span>
        <strong class="analytics-kpi-card__value">${escapeHtml(formatNumber(item.value))}</strong>
        <span class="analytics-kpi-card__hint">${escapeHtml(item.hint)}</span>
      </div>`).join("") + renderTrendBars(analytics.trend, analytics.generatedAt, Boolean(analytics.isDemo));

  dashboardActions.innerHTML = [
    `
      <div class="dashboard-panel-card">
        <div class="dashboard-panel-card__head">
          <div>
            <strong>Источники и устройства</strong>
            <span class="dashboard-panel-card__meta">Откуда приходят пользователи и на чём заходят</span>
          </div>
          <span class="dashboard-panel-card__meta">30 дней</span>
        </div>
        <div class="dashboard-panel-card__split">
          <div class="dashboard-panel-card__section">
            <strong>Источники</strong>
            ${renderMiniList(topReferrers, "Пока нет переходов из внешних источников.")}
          </div>
          <div class="dashboard-panel-card__section">
            <strong>Устройства</strong>
            ${renderMiniList(devices, "Пока нет накопленных данных по устройствам.")}
          </div>
        </div>
        <div class="dashboard-actions__footer">
          <button class="button button-secondary button-small" type="button" data-action="analytics-demo">Тестовые цифры</button>
          <button class="button button-ghost button-small" type="button" data-action="reset-analytics">Сбросить аналитику</button>
        </div>
      </div>`,
  ].join("");

  if (dashboardLogs) {
    dashboardLogs.classList.add("timeline--compact");
    dashboardLogs.innerHTML = "";
  }
}

function renderLeadsEditor() {
  if (!leadsEditor) return;

  ensureLeadSelection();
  const filteredLeads = getFilteredLeads();
  const selectedLead = getSelectedLead();
  const demoLeadCount = getDemoLeadRecords().length;
  const localStore = hydrateLocalStore(loadLocalStore());
  const rowsMarkup = filteredLeads.length
    ? filteredLeads.map((lead) => `
      <tr class="${lead.id === state.selectedLeadId ? "is-selected" : ""}">
        <td>${escapeHtml(formatDateTime(lead.createdAt))}</td>
        <td>
          <strong>${escapeHtml(lead.name || "Без имени")}</strong>
          <span class="table-subline">${escapeHtml(lead.phone || "—")}</span>
        </td>
        <td>
          <strong>${escapeHtml(lead.service || "—")}</strong>
          <span class="table-subline">${escapeHtml(lead.email || "")}</span>
        </td>
        <td><span class="status-badge ${getLeadStatusBadgeClass(lead.status)}" data-status="${escapeHtml(normalizeLeadStatus(lead.status))}">${escapeHtml(normalizeLeadStatus(lead.status))}</span></td>
        <td>${escapeHtml(lead.scheduledAt ? formatDateTime(lead.scheduledAt) : "—")}</td>
        <td>
          <div class="table-actions">
            <button class="button button-secondary button-small" type="button" data-action="lead-open" data-lead-id="${escapeHtml(lead.id)}">Открыть</button>
          </div>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="6"><div class="empty-state">По текущим фильтрам заявок не найдено.</div></td></tr>`;

  leadsEditor.innerHTML = `
    <div class="leads-stack leads-stack--legacy">
      <div class="crm-panel-card">
        <div class="crm-panel-head">
          <div class="crm-panel-head__title">
            <span class="crm-eyebrow">CRM</span>
            <h3>Заявки</h3>
          </div>
          <div class="crm-toolbar-actions">
            <button class="button button-primary button-small" type="button" data-action="lead-add">Добавить заявку</button>
            <button class="button button-secondary button-small" type="button" data-action="lead-clear-demo"${demoLeadCount ? "" : " disabled"}>Очистить фейковые</button>
            <button class="button button-ghost button-small" type="button" data-action="lead-restore-demo">Вернуть заявки</button>
          </div>
        </div>
        <p class="status-line" data-leads-action-status></p>
        <div class="crm-toolbar">
          <label class="crm-field-inline">
            <span>Поиск по заявкам</span>
            <input class="editor-input" type="search" placeholder="Имя, телефон, услуга, комментарий" value="${escapeHtml(state.leadFilters.search)}" data-crm-search>
          </label>
          <label class="crm-field-inline">
            <span>Статус</span>
            <select class="editor-select" data-crm-status-filter>
              <option value="all"${state.leadFilters.status === "all" ? " selected" : ""}>Все статусы</option>
              ${CRM_STATUSES.map((status) => `<option value="${escapeHtml(status)}"${state.leadFilters.status === status ? " selected" : ""}>${escapeHtml(formatLeadStatus(status))}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="crm-shell">
          <div class="crm-stream">
            <div class="crm-table-wrap">
              <table class="admin-table crm-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Заявка</th>
                    <th>Услуга</th>
                    <th>Статус</th>
                    <th>Выезд</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>${rowsMarkup}</tbody>
              </table>
            </div>
          </div>
          <aside class="crm-detail">
            ${selectedLead ? `
              <form class="stack" data-lead-form novalidate>
                <input type="hidden" name="leadId" value="${escapeHtml(selectedLead.id || "")}">
                <div class="crm-detail__head">
                  <h3>${selectedLead.id ? "Заявка" : "Новая заявка"}</h3>
                  <button class="button button-secondary button-small" type="button" data-action="lead-confirm-dispatch">Подтвердить выезд</button>
                </div>
                <div class="crm-form-grid">
                  <label class="field"><span>Имя</span><input class="editor-input" type="text" name="name" value="${escapeHtml(selectedLead.name || "")}"></label>
                  <label class="field"><span>Телефон</span><input class="editor-input" type="text" name="phone" value="${escapeHtml(selectedLead.phone || "")}"></label>
                  <label class="field"><span>E-mail</span><input class="editor-input" type="email" name="email" value="${escapeHtml(selectedLead.email || "")}"></label>
                  <label class="field"><span>Услуга</span><input class="editor-input" type="text" name="service" value="${escapeHtml(selectedLead.service || "")}"></label>
                  <label class="field"><span>Статус</span>
                    <select class="editor-select" name="status">
                      ${CRM_STATUSES.map((status) => `<option value="${escapeHtml(status)}"${normalizeLeadStatus(selectedLead.status) === status ? " selected" : ""}>${escapeHtml(status)}</option>`).join("")}
                    </select>
                  </label>
                  <label class="field"><span>Дата и время записи / выезда</span><input class="editor-input" type="datetime-local" name="scheduledAt" value="${escapeHtml(toLocalDateTime(selectedLead.scheduledAt))}"></label>
                  <label class="field"><span>ID заявки</span><input class="editor-input" type="text" name="leadInfoId" value="${escapeHtml(selectedLead.id || "Будет присвоен после сохранения")}" readonly></label>
                  <label class="checkbox-field">
                    <input type="checkbox" name="confirmed" ${selectedLead.confirmed ? "checked" : ""}>
                    <span>Согласие на выезд подтверждено администратором</span>
                  </label>
                </div>
                <label class="field is-wide">
                  <span>Комментарий администратора</span>
                  <textarea class="editor-textarea" name="comment" placeholder="Комментарий после звонка, детали выезда, пожелания клиента">${escapeHtml(selectedLead.adminComment || "")}</textarea>
                </label>
                <label class="field is-wide">
                  <span>Сообщение клиента</span>
                  <textarea class="editor-textarea" name="message" placeholder="Что клиент оставил в форме">${escapeHtml(selectedLead.message || "")}</textarea>
                </label>
                <div class="crm-meta">
                  ${selectedLead.id
                    ? `
                      <span class="meta-chip">Дата создания: ${escapeHtml(formatDateTime(selectedLead.createdAt))}</span>
                      <span class="meta-chip">Дата обновления: ${escapeHtml(formatDateTime(selectedLead.updatedAt || selectedLead.createdAt))}</span>
                      <span class="meta-chip">ID заявки: ${escapeHtml(selectedLead.id)}</span>`
                    : `
                      <span class="meta-chip">Новая заявка</span>
                      <span class="meta-chip">После сохранения появится в панели заявок</span>`}
                </div>
                <div class="crm-form-actions">
                  <button class="button button-primary" type="submit">Сохранить карточку</button>
                  ${selectedLead.id ? `<button class="button button-ghost" type="button" data-action="lead-delete">Удалить заявку</button>` : ""}
                </div>
                <p class="status-line" data-lead-form-status></p>
              </form>`
              : `<div class="crm-detail__empty">Выберите заявку из потока, чтобы открыть CRM-карточку.</div>`}
          </aside>
        </div>
      </div>
    </div>`;
}

function renderBuilderPageTabs() {
  if (!builderPagesNode) return;
  builderPagesNode.innerHTML = CONSTRUCTOR_NAV_ITEMS
    .map((item) => {
      const isActive = item.kind === "builder"
        ? state.screen === "builder" && state.builderPage === item.id
        : state.screen === item.id;
      const actionMarkup = item.kind === "builder"
        ? `data-action="builder-page" data-page="${item.id}"`
        : `data-action="constructor-screen" data-screen="${item.id}"`;
      const addBlockAccordion = item.id === "home" && state.screen === "builder" && state.builderPage === "home"
        ? `
          <div class="sidebar-accordion">
            <button type="button" class="sidebar-link sidebar-link--page sidebar-link--accordion ${state.builderBlocksMenuOpen ? "is-active" : ""}" data-action="toggle-builder-blocks">
              <span>Добавить блок</span>
              <span class="sidebar-link__chevron">${state.builderBlocksMenuOpen ? "-" : "+"}</span>
            </button>
            <div class="sidebar-accordion__panel ${state.builderBlocksMenuOpen ? "" : "is-hidden"}">
              ${Object.entries(CUSTOM_BLOCK_TEMPLATES).map(([key, template]) => `
                <button type="button" class="sidebar-link sidebar-link--page sidebar-link--template" data-action="builder-add-block-direct" data-block-type="${escapeHtml(key)}">
                  ${escapeHtml(template.label)}
                </button>`).join("")}
            </div>
          </div>`
        : "";
      return `<div class="sidebar-page-group"><button type="button" class="sidebar-link sidebar-link--page ${isActive ? "is-active" : ""}" ${actionMarkup}>${escapeHtml(item.label)}</button>${addBlockAccordion}</div>`;
    })
    .join("");
}

function renderBuilderAddBlock() {
  if (builderAddBlockNode) {
    builderAddBlockNode.innerHTML = "";
  }
}

function renderServicesPageEditor() {
  const page = state.settings.pages["services-page"];
  const itemsMarkup = (page.items || []).map((item, index) => `
    <div class="entity-card">
      <div class="entity-card__head">
        <div>
          <strong>${escapeHtml(item.title || `Услуга ${index + 1}`)}</strong>
          <div class="entity-card__meta"><span class="chip">${item.reverse ? "Обратная сетка" : "Прямая сетка"}</span></div>
        </div>
        <div class="entity-card__controls">
          <button class="icon-button" type="button" data-action="page-item-up" data-page="services-page" data-collection="items" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-action="page-item-down" data-page="services-page" data-collection="items" data-id="${item.id}" ${index === page.items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button" type="button" data-action="page-item-remove" data-page="services-page" data-collection="items" data-id="${item.id}">×</button>
        </div>
      </div>
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Заголовок", value: item.title, data: { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "title" } })}
        ${renderCheckboxMarkup("Зеркальная раскладка", Boolean(item.reverse), { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "reverse" })}
        ${renderFieldMarkup({ label: "Описание", value: item.text, type: "textarea", wide: true, data: { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "text" } })}
        ${renderFieldMarkup({ label: "Изображение", value: item.image?.src || "", type: "image", wide: true, data: { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "image.src" } })}
        ${renderFieldMarkup({ label: "Alt изображения", value: item.image?.alt || "", wide: true, data: { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "image.alt" } })}
        ${renderFieldMarkup({ label: "Текст кнопки", value: item.buttonLabel || "", data: { model: "page-item", page: "services-page", collection: "items", id: item.id, path: "buttonLabel" } })}
      </div>
    </div>`).join("");

  return `
    <div class="entity-card">
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Заголовок страницы", value: page.title || "", wide: true, data: { model: "page", page: "services-page", path: "title" } })}
      </div>
    </div>
    <div class="collection">
      <div class="collection-head">
        <strong>Карточки услуг</strong>
        <button class="button button-ghost button-small" type="button" data-action="page-item-add" data-page="services-page" data-collection="items">Добавить услугу</button>
      </div>
      ${itemsMarkup || `<div class="empty-state">Нет карточек услуг.</div>`}
    </div>`;
}

function renderReviewsPageEditor() {
  const page = state.settings.pages["reviews-page"];
  const platforms = (page.platforms || []).map((item) => `
    <div class="entity-card">
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Платформа", value: item.title || "", data: { model: "page-item", page: "reviews-page", collection: "platforms", id: item.id, path: "title" } })}
        ${renderFieldMarkup({ label: "Рейтинг", value: item.rating || "", data: { model: "page-item", page: "reviews-page", collection: "platforms", id: item.id, path: "rating" } })}
        ${renderFieldMarkup({ label: "Кнопка", value: item.buttonLabel || "", wide: true, data: { model: "page-item", page: "reviews-page", collection: "platforms", id: item.id, path: "buttonLabel" } })}
      </div>
    </div>`).join("");
  const items = (page.items || []).map((item, index) => `
    <div class="entity-card">
      <div class="entity-card__head">
        <strong>${escapeHtml(item.author || `Отзыв ${index + 1}`)}</strong>
        <div class="entity-card__controls">
          <button class="icon-button" type="button" data-action="page-item-up" data-page="reviews-page" data-collection="items" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-action="page-item-down" data-page="reviews-page" data-collection="items" data-id="${item.id}" ${index === page.items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button" type="button" data-action="page-item-remove" data-page="reviews-page" data-collection="items" data-id="${item.id}">×</button>
        </div>
      </div>
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Автор", value: item.author || "", data: { model: "page-item", page: "reviews-page", collection: "items", id: item.id, path: "author" } })}
        ${renderFieldMarkup({ label: "Текст", value: item.text || "", type: "textarea", wide: true, data: { model: "page-item", page: "reviews-page", collection: "items", id: item.id, path: "text" } })}
      </div>
    </div>`).join("");
  return `
    <div class="entity-card">
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Заголовок страницы", value: page.title || "", data: { model: "page", page: "reviews-page", path: "title" }, wide: true })}
        ${renderFieldMarkup({ label: "Заголовок списка отзывов", value: page.heading || "", data: { model: "page", page: "reviews-page", path: "heading" }, wide: true })}
      </div>
    </div>
    <div class="collection"><div class="collection-head"><strong>Платформы</strong></div>${platforms}</div>
    <div class="collection"><div class="collection-head"><strong>Отзывы на странице</strong><button class="button button-ghost button-small" type="button" data-action="page-item-add" data-page="reviews-page" data-collection="items">Добавить отзыв</button></div>${items || `<div class="empty-state">Список пуст.</div>`}</div>`;
}

function renderSimplePageEditor(pageKey) {
  const page = state.settings.pages[pageKey];
  if (pageKey === "contacts-page") {
    return `
      <div class="entity-card">
        <div class="page-editor-grid">
          ${renderFieldMarkup({ label: "Заголовок", value: page.title || "", wide: true, data: { model: "page", page: pageKey, path: "title" } })}
          ${renderFieldMarkup({ label: "Заголовок формы", value: page.formTitle || "", wide: true, data: { model: "page", page: pageKey, path: "formTitle" } })}
          ${renderFieldMarkup({ label: "Кнопка формы", value: page.formButtonLabel || "", data: { model: "page", page: pageKey, path: "formButtonLabel" } })}
          ${renderFieldMarkup({ label: "Подпись под формой", value: page.formDisclaimer || "", type: "textarea", wide: true, data: { model: "page", page: pageKey, path: "formDisclaimer" } })}
          ${renderFieldMarkup({ label: "Placeholder имени", value: page.formPlaceholders?.name || "", data: { model: "page", page: pageKey, path: "formPlaceholders.name" } })}
          ${renderFieldMarkup({ label: "Placeholder телефона", value: page.formPlaceholders?.phone || "", data: { model: "page", page: pageKey, path: "formPlaceholders.phone" } })}
          ${renderFieldMarkup({ label: "Placeholder e-mail", value: page.formPlaceholders?.email || "", data: { model: "page", page: pageKey, path: "formPlaceholders.email" } })}
          ${renderFieldMarkup({ label: "Placeholder сообщения", value: page.formPlaceholders?.message || "", type: "textarea", wide: true, data: { model: "page", page: pageKey, path: "formPlaceholders.message" } })}
        </div>
      </div>`;
  }
  if (pageKey === "thank-you") {
    return `
      <div class="entity-card">
        <div class="page-editor-grid">
          ${renderFieldMarkup({ label: "Заголовок", value: page.title || "", wide: true, data: { model: "page", page: pageKey, path: "title" } })}
          ${renderFieldMarkup({ label: "Сообщение", value: page.message || "", type: "textarea", wide: true, data: { model: "page", page: pageKey, path: "message" } })}
          ${renderFieldMarkup({ label: "Основная кнопка", value: page.primaryButtonLabel || "", data: { model: "page", page: pageKey, path: "primaryButtonLabel" } })}
          ${renderFieldMarkup({ label: "Ссылка основной кнопки", value: page.primaryButtonHref || "", data: { model: "page", page: pageKey, path: "primaryButtonHref" } })}
          ${renderFieldMarkup({ label: "Вторичная кнопка", value: page.secondaryButtonLabel || "", data: { model: "page", page: pageKey, path: "secondaryButtonLabel" } })}
        </div>
      </div>`;
  }
  return `
    <div class="entity-card">
      <div class="page-editor-grid">
        ${renderFieldMarkup({ label: "Заголовок", value: page.title || "", wide: true, data: { model: "page", page: pageKey, path: "title" } })}
        ${renderFieldMarkup({ label: "Подзаголовок", value: page.subtitle || "", wide: true, data: { model: "page", page: pageKey, path: "subtitle" } })}
        ${renderFieldMarkup({ label: "HTML-контент", value: page.html || "", type: "textarea", wide: true, data: { model: "page", page: pageKey, path: "html" } })}
      </div>
    </div>`;
}

function renderBuilder() {
  renderBuilderPageTabs();
  renderBuilderAddBlock();
  if (state.builderPage === "home") {
    builderCanvas.innerHTML = renderHomeBuilder();
    return;
  }
  if (state.builderPage === "services-page") {
    builderCanvas.innerHTML = renderServicesPageEditor();
    return;
  }
  if (state.builderPage === "reviews-page") {
    builderCanvas.innerHTML = renderReviewsPageEditor();
    return;
  }
  builderCanvas.innerHTML = renderSimplePageEditor(state.builderPage);
}

function renderLegacyEntityList(items, collectionName, options) {
  if (!items.length) {
    return `<div class="empty-state">${escapeHtml(options.empty)}</div>`;
  }
  return items.map((item, index) => `
    <div class="entity-card">
      <div class="entity-card__head">
        <div>
          <strong>${escapeHtml(item[options.titleKey] || `${options.titleLabel} ${index + 1}`)}</strong>
          <div class="entity-card__meta">
            <span class="chip">${item.published === false ? "Скрыт" : "Опубликован"}</span>
          </div>
        </div>
        <div class="entity-card__controls">
          <button class="icon-button" type="button" data-action="entity-up" data-collection="${collectionName}" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-action="entity-down" data-collection="${collectionName}" data-id="${item.id}" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button" type="button" data-action="entity-remove" data-collection="${collectionName}" data-id="${item.id}">×</button>
        </div>
      </div>
      <div class="entity-card__grid">
        ${options.fields(item).join("")}
      </div>
    </div>`).join("");
}

function renderLegacyReviewsEditor() {
  const reviewCards = state.settings.reviewCards || {};
  const integration = state.settings.reviewsIntegration || {};
  const cardsSettings = `
    <div class="entity-card">
      <div class="entity-card__head"><strong>Интеграция и карточки платформ</strong></div>
      <div class="entity-card__grid">
        ${renderFieldMarkup({ label: "Ссылка на Яндекс Бизнес", value: integration.yandexBusinessUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.yandexBusinessUrl" } })}
        ${renderFieldMarkup({ label: "Ссылка на 2ГИС", value: integration.gisBusinessUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.gisBusinessUrl" } })}
        ${renderFieldMarkup({ label: "Iframe / badge Яндекс", value: integration.yandexWidgetUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.yandexWidgetUrl" } })}
        ${renderFieldMarkup({ label: "Заголовок карточки 2ГИС", value: reviewCards.gis?.title || "", wide: true, data: { model: "setting", path: "reviewCards.gis.title" } })}
        ${renderFieldMarkup({ label: "Текст карточки 2ГИС", value: reviewCards.gis?.text || "", type: "textarea", wide: true, data: { model: "setting", path: "reviewCards.gis.text" } })}
        ${renderFieldMarkup({ label: "Текст кнопки 2ГИС", value: reviewCards.gis?.buttonLabel || "", data: { model: "setting", path: "reviewCards.gis.buttonLabel" } })}
        ${renderFieldMarkup({ label: "Рейтинг 2ГИС", value: reviewCards.gis?.rating || "", data: { model: "setting", path: "reviewCards.gis.rating" } })}
        ${renderFieldMarkup({ label: "Количество отзывов 2ГИС", value: reviewCards.gis?.reviewsCount || "", data: { model: "setting", path: "reviewCards.gis.reviewsCount" } })}
        ${renderFieldMarkup({ label: "QR 2ГИС", value: reviewCards.gis?.qrImage || "", type: "image", wide: true, data: { model: "setting", path: "reviewCards.gis.qrImage" } })}
        ${renderFieldMarkup({ label: "Заголовок карточки Яндекс", value: reviewCards.yandex?.title || "", wide: true, data: { model: "setting", path: "reviewCards.yandex.title" } })}
        ${renderFieldMarkup({ label: "Текст карточки Яндекс", value: reviewCards.yandex?.text || "", type: "textarea", wide: true, data: { model: "setting", path: "reviewCards.yandex.text" } })}
        ${renderFieldMarkup({ label: "Текст кнопки Яндекс", value: reviewCards.yandex?.buttonLabel || "", data: { model: "setting", path: "reviewCards.yandex.buttonLabel" } })}
        ${renderFieldMarkup({ label: "Рейтинг Яндекс", value: reviewCards.yandex?.rating || "", data: { model: "setting", path: "reviewCards.yandex.rating" } })}
        ${renderFieldMarkup({ label: "Количество отзывов Яндекс", value: reviewCards.yandex?.reviewsCount || "", data: { model: "setting", path: "reviewCards.yandex.reviewsCount" } })}
        ${renderFieldMarkup({ label: "QR Яндекс", value: reviewCards.yandex?.qrImage || "", type: "image", wide: true, data: { model: "setting", path: "reviewCards.yandex.qrImage" } })}
      </div>
    </div>`;
  reviewsEditor.innerHTML = `${cardsSettings}${renderEntityList(state.reviews, "reviews", {
    titleKey: "author",
    titleLabel: "Отзыв",
    empty: "Пока нет отзывов. Добавьте первый отзыв.",
    fields: (item) => [
      renderFieldMarkup({ label: "Автор", value: item.author || "", data: { model: "entity", collection: "reviews", id: item.id, path: "author" } }),
      renderFieldMarkup({ label: "Источник", value: item.source || "", data: { model: "entity", collection: "reviews", id: item.id, path: "source" } }),
      renderFieldMarkup({ label: "Рейтинг", value: item.rating || "", data: { model: "entity", collection: "reviews", id: item.id, path: "rating" } }),
      renderFieldMarkup({ label: "Дата", value: (item.publishedAt || "").slice(0, 10), data: { model: "entity", collection: "reviews", id: item.id, path: "publishedAt" }, type: "date" }),
      renderFieldMarkup({ label: "Ссылка", value: item.link || "", wide: true, data: { model: "entity", collection: "reviews", id: item.id, path: "link" }, type: "url" }),
      renderFieldMarkup({ label: "Привязка QR", value: item.qrBinding || "", data: { model: "entity", collection: "reviews", id: item.id, path: "qrBinding" } }),
      renderCheckboxMarkup("Показывать на сайте", item.published !== false, { model: "entity", collection: "reviews", id: item.id, path: "published" }),
      renderFieldMarkup({ label: "Текст", value: item.text || "", type: "textarea", wide: true, data: { model: "entity", collection: "reviews", id: item.id, path: "text" } }),
    ],
  })}`;
}

function renderReviewsEditor() {
  const reviewCards = state.settings.reviewCards || {};
  const integration = ensureReviewsIntegrationShape(state.settings);
  const yandex = integration.yandex;
  const filteredReviews = getFilteredReviews();
  const filterOptions = getReviewSourceFilterOptions();
  const cardsSettings = `
    <div class="entity-card">
      <div class="entity-card__head">
        <div>
          <strong>Яндекс внутри раздела «Отзывы»</strong>
          <div class="entity-card__meta">
            <span class="chip">${yandex.enabled ? "Интеграция включена" : "Интеграция выключена"}</span>
            <span class="chip">${escapeHtml(yandex.mode || "fallback_only")}</span>
            ${yandex.status ? `<span class="chip ${yandex.status === "error" ? "is-hidden" : ""}">${escapeHtml(yandex.status)}</span>` : ""}
          </div>
        </div>
        <div class="entity-card__controls">
          <button class="button button-secondary button-small" type="button" data-action="reviews-yandex-check">Проверить подключение</button>
          <button class="button button-ghost button-small" type="button" data-action="reviews-save-settings">Сохранить настройки</button>
          <button class="button button-small" type="button" data-action="reviews-yandex-sync">Синхронизировать отзывы</button>
        </div>
      </div>
      <div class="entity-card__grid">
        ${renderCheckboxMarkup("Включить интеграцию Яндекс", yandex.enabled, { model: "setting", path: "reviewsIntegration.yandex.enabled" }, true)}
        ${renderFieldMarkup({ label: "Тип подключения", value: yandex.connectionType || "businessUrl", type: "select", options: [
          { value: "businessUrl", label: "Ссылка на организацию" },
          { value: "organizationId", label: "Идентификатор организации" },
          { value: "widgetCode", label: "Код виджета" },
          { value: "widgetUrl", label: "URL виджета" },
        ], data: { model: "setting", path: "reviewsIntegration.yandex.connectionType" } })}
        ${renderFieldMarkup({ label: "Ссылка на организацию Яндекс", value: yandex.businessUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.yandex.businessUrl" } })}
        ${renderFieldMarkup({ label: "Идентификатор организации", value: yandex.organizationId || "", data: { model: "setting", path: "reviewsIntegration.yandex.organizationId" } })}
        ${renderFieldMarkup({ label: "Код виджета", value: yandex.widgetCode || "", type: "textarea", wide: true, data: { model: "setting", path: "reviewsIntegration.yandex.widgetCode" }, helper: "Поддерживается официальный iframe/бейдж Яндекс." })}
        ${renderFieldMarkup({ label: "URL виджета", value: yandex.widgetUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.yandex.widgetUrl" } })}
        ${renderFieldMarkup({ label: "Ссылка на 2ГИС", value: integration.gisBusinessUrl || "", wide: true, data: { model: "setting", path: "reviewsIntegration.gisBusinessUrl" } })}
      </div>
      <p class="status-line ${yandex.status === "error" ? "is-error" : (yandex.status && yandex.status !== "idle" ? "is-success" : "")}" data-review-yandex-status>${escapeHtml(yandex.statusMessage || integration.note)}</p>
      <div class="reviews-admin-preview">
        <p><strong>Превью подключения:</strong> ${escapeHtml(yandex.previewTitle || "Яндекс Карты")}</p>
        <p>${escapeHtml(yandex.previewUrl || yandex.businessUrl || "Ссылка или виджет будут использованы после проверки.")}</p>
        <p>Прямой импорт отзывов Яндекс в кастомный слайдер официально недоступен. Используется fallback-режим.</p>
      </div>
    </div>
    <div class="entity-card">
      <div class="entity-card__head"><strong>Карточки платформ</strong></div>
      <div class="entity-card__grid">
        ${renderFieldMarkup({ label: "Заголовок карточки 2ГИС", value: reviewCards.gis?.title || "", wide: true, data: { model: "setting", path: "reviewCards.gis.title" } })}
        ${renderFieldMarkup({ label: "Текст карточки 2ГИС", value: reviewCards.gis?.text || "", type: "textarea", wide: true, data: { model: "setting", path: "reviewCards.gis.text" } })}
        ${renderFieldMarkup({ label: "Текст кнопки 2ГИС", value: reviewCards.gis?.buttonLabel || "", data: { model: "setting", path: "reviewCards.gis.buttonLabel" } })}
        ${renderFieldMarkup({ label: "Рейтинг 2ГИС", value: reviewCards.gis?.rating || "", data: { model: "setting", path: "reviewCards.gis.rating" } })}
        ${renderFieldMarkup({ label: "Количество отзывов 2ГИС", value: reviewCards.gis?.reviewsCount || "", data: { model: "setting", path: "reviewCards.gis.reviewsCount" } })}
        ${renderFieldMarkup({ label: "QR 2ГИС", value: reviewCards.gis?.qrImage || "", type: "image", wide: true, data: { model: "setting", path: "reviewCards.gis.qrImage" } })}
        ${renderFieldMarkup({ label: "Заголовок карточки Яндекс", value: reviewCards.yandex?.title || "", wide: true, data: { model: "setting", path: "reviewCards.yandex.title" } })}
        ${renderFieldMarkup({ label: "Текст карточки Яндекс", value: reviewCards.yandex?.text || "", type: "textarea", wide: true, data: { model: "setting", path: "reviewCards.yandex.text" } })}
        ${renderFieldMarkup({ label: "Текст кнопки Яндекс", value: reviewCards.yandex?.buttonLabel || "", data: { model: "setting", path: "reviewCards.yandex.buttonLabel" } })}
        ${renderFieldMarkup({ label: "Рейтинг Яндекс", value: reviewCards.yandex?.rating || "", data: { model: "setting", path: "reviewCards.yandex.rating" } })}
        ${renderFieldMarkup({ label: "Количество отзывов Яндекс", value: reviewCards.yandex?.reviewsCount || "", data: { model: "setting", path: "reviewCards.yandex.reviewsCount" } })}
        ${renderFieldMarkup({ label: "QR Яндекс", value: reviewCards.yandex?.qrImage || "", type: "image", wide: true, data: { model: "setting", path: "reviewCards.yandex.qrImage" } })}
      </div>
    </div>
    <div class="entity-card">
      <div class="entity-card__head">
        <div>
          <strong>Общий список отзывов</strong>
          <div class="entity-card__meta">
            <span class="chip">Всего: ${state.reviews.length}</span>
            <span class="chip">Показано: ${filteredReviews.length}</span>
          </div>
        </div>
        <div class="entity-card__controls">
          <label class="field field--inline">
            <span>Фильтр по источнику</span>
            <select class="editor-select" data-review-source-filter="true">
              ${filterOptions.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === state.reviewFilters.source ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>
    </div>`;
  reviewsEditor.innerHTML = `${cardsSettings}${renderEntityList(filteredReviews, "reviews", {
    titleKey: "author",
    titleLabel: "Отзыв",
    empty: "Пока нет отзывов. Добавьте первый отзыв.",
    meta: (item) => buildReviewStatusChips(item),
    fields: (item) => [
      renderFieldMarkup({ label: "Автор", value: item.author || "", data: { model: "entity", collection: "reviews", id: item.id, path: "author" } }),
      renderFieldMarkup({ label: "Текст кнопки источника", value: item.sourceButtonLabel || "Источник", data: { model: "entity", collection: "reviews", id: item.id, path: "sourceButtonLabel" } }),
      renderFieldMarkup({ label: "Ссылка кнопки источника", value: item.sourceUrl || "", wide: true, data: { model: "entity", collection: "reviews", id: item.id, path: "sourceUrl" }, type: "url" }),
      renderFieldMarkup({ label: "Тип источника", value: item.sourceType || "manual", type: "select", options: [
        { value: "manual", label: "Ручной / локальный" },
        { value: "yandex", label: "Yandex" },
      ], data: { model: "entity", collection: "reviews", id: item.id, path: "sourceType" } }),
      renderFieldMarkup({ label: "Рейтинг", value: item.rating || "", data: { model: "entity", collection: "reviews", id: item.id, path: "rating" } }),
      renderFieldMarkup({ label: "Дата", value: item.date || "", data: { model: "entity", collection: "reviews", id: item.id, path: "date" }, type: "date" }),
      renderFieldMarkup({ label: "ID во внешнем источнике", value: item.sourceItemId || "", data: { model: "entity", collection: "reviews", id: item.id, path: "sourceItemId" } }),
      renderCheckboxMarkup("Опубликовать на сайте", item.isPublished === true, { model: "entity", collection: "reviews", id: item.id, path: "isPublished" }),
      renderCheckboxMarkup("Скрыть без удаления", item.isHidden === true, { model: "entity", collection: "reviews", id: item.id, path: "isHidden" }),
      renderCheckboxMarkup("Избранный для слайдера", item.isFeatured === true, { model: "entity", collection: "reviews", id: item.id, path: "isFeatured" }),
      renderCheckboxMarkup("Пометить как импортированный", item.isImported === true, { model: "entity", collection: "reviews", id: item.id, path: "isImported" }),
      renderFieldMarkup({ label: "Текст", value: item.text || "", type: "textarea", wide: true, data: { model: "entity", collection: "reviews", id: item.id, path: "text" } }),
    ],
  })}`;
}

function renderEntityList(items, collectionName, options) {
  if (!items.length) {
    return `<div class="empty-state">${escapeHtml(options.empty)}</div>`;
  }
  return items.map((item, index) => `
    <div class="entity-card">
      <div class="entity-card__head">
        <div>
          <strong>${escapeHtml(item[options.titleKey] || `${options.titleLabel} ${index + 1}`)}</strong>
          <div class="entity-card__meta">
            ${options.meta ? options.meta(item) : `<span class="chip">${item.published === false ? "Скрыт" : "Опубликован"}</span>`}
          </div>
        </div>
        <div class="entity-card__controls">
          <button class="icon-button" type="button" data-action="entity-up" data-collection="${collectionName}" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-action="entity-down" data-collection="${collectionName}" data-id="${item.id}" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button" type="button" data-action="entity-remove" data-collection="${collectionName}" data-id="${item.id}">×</button>
        </div>
      </div>
      <div class="entity-card__grid">
        ${options.fields(item).join("")}
      </div>
    </div>`).join("");
}

function renderGalleryEditor() {
  galleryEditor.innerHTML = renderEntityList(state.gallery, "gallery", {
    titleKey: "title",
    titleLabel: "Изображение",
    empty: "Галерея пока пуста.",
    fields: (item) => [
      renderFieldMarkup({ label: "Название", value: item.title || "", data: { model: "entity", collection: "gallery", id: item.id, path: "title" } }),
      renderFieldMarkup({ label: "Путь к файлу", value: item.src || "", type: "image", wide: true, data: { model: "entity", collection: "gallery", id: item.id, path: "src" } }),
      renderFieldMarkup({ label: "Alt", value: item.alt || "", wide: true, data: { model: "entity", collection: "gallery", id: item.id, path: "alt" } }),
      renderFieldMarkup({ label: "Подпись", value: item.caption || "", type: "textarea", wide: true, data: { model: "entity", collection: "gallery", id: item.id, path: "caption" } }),
      renderFieldMarkup({ label: "Теги через запятую", value: (item.tags || []).join(", "), wide: true, data: { model: "entity-tags", collection: "gallery", id: item.id, path: "tags" } }),
      renderCheckboxMarkup("Показывать в библиотеке", item.published !== false, { model: "entity", collection: "gallery", id: item.id, path: "published" }),
    ],
  });
}

function renderBeforeAfterEditor() {
  beforeAfterEditor.innerHTML = renderEntityList(state.beforeAfter, "beforeAfter", {
    titleKey: "title",
    titleLabel: "Пара",
    empty: "Пары до и после пока не добавлены.",
    fields: (item) => [
      renderFieldMarkup({ label: "Название", value: item.title || "", data: { model: "entity", collection: "beforeAfter", id: item.id, path: "title" } }),
      renderCheckboxMarkup("Показывать на сайте", item.published !== false, { model: "entity", collection: "beforeAfter", id: item.id, path: "published" }),
      renderFieldMarkup({ label: "Описание", value: item.description || "", type: "textarea", wide: true, data: { model: "entity", collection: "beforeAfter", id: item.id, path: "description" } }),
      renderFieldMarkup({ label: "Фото до", value: item.before || "", type: "image", wide: true, data: { model: "entity", collection: "beforeAfter", id: item.id, path: "before" } }),
      renderFieldMarkup({ label: "Alt до", value: item.beforeAlt || "", wide: true, data: { model: "entity", collection: "beforeAfter", id: item.id, path: "beforeAlt" } }),
      renderFieldMarkup({ label: "Фото после", value: item.after || "", type: "image", wide: true, data: { model: "entity", collection: "beforeAfter", id: item.id, path: "after" } }),
      renderFieldMarkup({ label: "Alt после", value: item.afterAlt || "", wide: true, data: { model: "entity", collection: "beforeAfter", id: item.id, path: "afterAlt" } }),
    ],
  });
}

function renderMenusEditor() {
  const anchorMap = buildHomeBlockAnchorMap();
  const blockOptions = [{ value: "", label: "Своя ссылка" }, ...getHomeBlockMenuOptions(anchorMap)];
  const scopes = [
    { key: "primary", title: "Основное меню" },
    { key: "footer", title: "Футер" },
  ];
  menusEditor.innerHTML = scopes.map((scope) => {
    const items = state.settings.menus?.[scope.key] || [];
    const rows = items.length
      ? items.map((item, index) => `
        <div class="menu-card">
          <div class="entity-card__head">
            <strong>${escapeHtml(item.label || `Пункт ${index + 1}`)}</strong>
            <div class="entity-card__controls">
              <button class="icon-button" type="button" data-action="menu-up" data-scope="${scope.key}" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button>
              <button class="icon-button" type="button" data-action="menu-down" data-scope="${scope.key}" data-id="${item.id}" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
              <button class="icon-button" type="button" data-action="menu-remove" data-scope="${scope.key}" data-id="${item.id}">×</button>
            </div>
          </div>
          <div class="entity-card__grid">
            ${renderFieldMarkup({ label: "Название", value: item.label || "", data: { model: "menu-item", scope: scope.key, id: item.id, path: "label" } })}
            ${renderFieldMarkup({
              label: "Привязать к блоку главной",
              value: item.blockTarget || "",
              type: "select",
              wide: true,
              options: blockOptions,
              helper: "Если выбрать блок, ссылка будет обновляться автоматически при смене якоря.",
              data: { model: "menu-item", scope: scope.key, id: item.id, path: "blockTarget" },
            })}
            ${renderFieldMarkup({
              label: "Ссылка",
              value: item.blockTarget ? buildHomeBlockMenuHref(item.blockTarget, anchorMap) : (item.href || ""),
              wide: true,
              helper: item.blockTarget ? "Ручное изменение этого поля снимет привязку к блоку." : "Можно оставить произвольную ссылку вручную.",
              data: { model: "menu-item", scope: scope.key, id: item.id, path: "href" },
            })}
            ${renderCheckboxMarkup("Показывать пункт", item.visible !== false, { model: "menu-item", scope: scope.key, id: item.id, path: "visible" }, true)}
          </div>
        </div>`).join("")
      : `<div class="empty-state">Пункты не добавлены.</div>`;
    return `<div class="collection collection--menu-scope"><div class="collection-head"><strong>${escapeHtml(scope.title)}</strong><button class="button button-ghost button-small" type="button" data-action="menu-add" data-scope="${scope.key}">Добавить пункт</button></div>${renderMenuPreviewMarkup(scope.key, items)}${rows}</div>`;
  }).join("");
}

function renderSeoEditor() {
  const globalSeo = state.settings.seo?.global || {};
  if (!BUILDER_PAGES.some((page) => page.id === state.seoPage)) {
    state.seoPage = BUILDER_PAGES[0]?.id || "home";
  }
  const currentPage = BUILDER_PAGES.find((page) => page.id === state.seoPage) || BUILDER_PAGES[0];
  const pageSeo = state.settings.seo?.pages?.[currentPage.id] || {};
  const pageLinks = BUILDER_PAGES
    .map((page) => `
      <button class="seo-page-link ${page.id === currentPage.id ? "is-active" : ""}" type="button" data-action="seo-page" data-page="${page.id}">
        ${escapeHtml(page.label)}
      </button>`)
    .join("");

  seoEditor.innerHTML = `
    <div class="entity-card">
      <div class="entity-card__head"><strong>Базовые SEO-поля</strong></div>
      <div class="seo-grid">
        ${renderFieldMarkup({ label: "Title", value: globalSeo.title || "", wide: true, data: { model: "seo-global", path: "title" } })}
        ${renderFieldMarkup({ label: "Description", value: globalSeo.description || "", type: "textarea", wide: true, data: { model: "seo-global", path: "description" } })}
        ${renderFieldMarkup({ label: "Keywords", value: globalSeo.keywords || "", wide: true, data: { model: "seo-global", path: "keywords" } })}
        ${renderFieldMarkup({ label: "OG title", value: globalSeo.ogTitle || "", wide: true, data: { model: "seo-global", path: "ogTitle" } })}
        ${renderFieldMarkup({ label: "OG description", value: globalSeo.ogDescription || "", type: "textarea", wide: true, data: { model: "seo-global", path: "ogDescription" } })}
      </div>
    </div>
    <div class="entity-card">
      <div class="entity-card__head"><strong>SEO по страницам</strong></div>
      <div class="seo-pages-layout">
        <div class="seo-pages-nav">${pageLinks}</div>
        <div class="seo-pages-editor">
          <div class="entity-card entity-card--nested">
            <div class="entity-card__head"><strong>${escapeHtml(currentPage.label)}</strong></div>
            <div class="seo-grid">
              ${renderFieldMarkup({ label: "Title", value: pageSeo.title || "", wide: true, data: { model: "seo-page", page: currentPage.id, path: "title" } })}
              ${renderFieldMarkup({ label: "Description", value: pageSeo.description || "", type: "textarea", wide: true, data: { model: "seo-page", page: currentPage.id, path: "description" } })}
              ${renderFieldMarkup({ label: "OG title", value: pageSeo.ogTitle || "", wide: true, data: { model: "seo-page", page: currentPage.id, path: "ogTitle" } })}
              ${renderFieldMarkup({ label: "OG description", value: pageSeo.ogDescription || "", type: "textarea", wide: true, data: { model: "seo-page", page: currentPage.id, path: "ogDescription" } })}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderSettingsEditor() {
  const site = state.settings.site || {};
  const messenger = state.settings.messenger || {};
  const map = state.settings.contactMap || {};
  const notifications = state.settings.notifications || {};
  const media = state.settings.media || {};
  const globalSeo = state.settings.seo?.global || {};
  const footer = getFooterSettingsSnapshot();
  settingsEditor.innerHTML = `
    <div class="settings-layout row g-4">
      <div class="col-12">
        <div class="entity-card settings-card">
          <div class="entity-card__head"><strong>SEO</strong></div>
          <div class="seo-grid">
            ${renderFieldMarkup({ label: "Title", value: globalSeo.title || "", wide: true, data: { model: "seo-global", path: "title" } })}
            ${renderFieldMarkup({ label: "Description", value: globalSeo.description || "", type: "textarea", wide: true, data: { model: "seo-global", path: "description" } })}
            ${renderFieldMarkup({ label: "Keywords", value: globalSeo.keywords || "", wide: true, data: { model: "seo-global", path: "keywords" } })}
            ${renderFieldMarkup({ label: "OG title", value: globalSeo.ogTitle || "", wide: true, data: { model: "seo-global", path: "ogTitle" } })}
            ${renderFieldMarkup({ label: "OG description", value: globalSeo.ogDescription || "", type: "textarea", wide: true, data: { model: "seo-global", path: "ogDescription" } })}
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="entity-card settings-card">
          <div class="entity-card__head"><strong>Данные сайта</strong></div>
          <div class="settings-grid">
            ${renderFieldMarkup({ label: "Название сайта", value: site.title || "", data: { model: "setting", path: "site.title" } })}
            ${renderFieldMarkup({ label: "Телефон", value: site.phoneDisplay || "", data: { model: "setting", path: "site.phoneDisplay" } })}
            ${renderFieldMarkup({ label: "Ссылка телефона", value: site.phoneHref || "", data: { model: "setting", path: "site.phoneHref" } })}
            ${renderFieldMarkup({ label: "Город", value: site.city || "", data: { model: "setting", path: "site.city" } })}
            ${renderFieldMarkup({ label: "Режим работы", value: site.hours || "", data: { model: "setting", path: "site.hours" } })}
            ${renderFieldMarkup({ label: "Адрес", value: site.address || "", wide: true, data: { model: "setting", path: "site.address" } })}
            ${renderFieldMarkup({ label: "E-mail", value: site.email || "", data: { model: "setting", path: "site.email" } })}
            ${renderFieldMarkup({ label: "Юр. лицо", value: site.legalName || "", wide: true, data: { model: "setting", path: "site.legalName" } })}
            ${renderFieldMarkup({ label: "ИНН", value: site.legalInn || "", data: { model: "setting", path: "site.legalInn" } })}
            ${renderFieldMarkup({ label: "ОГРН / ОГРНИП", value: site.legalOgrn || "", data: { model: "setting", path: "site.legalOgrn" } })}
            ${renderFieldMarkup({ label: "Юридический адрес", value: site.legalAddress || "", wide: true, data: { model: "setting", path: "site.legalAddress" } })}
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="entity-card settings-card">
          <div class="entity-card__head"><strong>Бренд и медиа</strong></div>
          <div class="settings-brand-grid">
            <div class="settings-brand-preview">
              ${renderAdminBrandPreviewMarkup()}
              <p class="settings-preview-note">Здесь можно переименовать название рядом с логотипом и заменить «АкваБлеск» на любое другое. Логотип показывается в шапке сайта и превью меню.</p>
            </div>
            <div class="settings-grid">
              <div class="field is-wide">
                <span>Редактирование логотипа</span>
                <p class="helper-line">Измените название бренда рядом с логотипом и fallback-метку, если картинка логотипа не задана.</p>
              </div>
              ${renderFieldMarkup({ label: "Название рядом с логотипом", value: site.brandName || site.title || "", wide: true, data: { model: "setting", path: "site.brandName" } })}
              ${renderFieldMarkup({ label: "Метка бренда", value: site.brandMark || "", data: { model: "setting", path: "site.brandMark" }, helper: "Показывается как fallback, если логотип не задан." })}
              ${renderFieldMarkup({ label: "Логотип", value: media.logo || "", type: "image", wide: true, data: { model: "setting", path: "media.logo" } })}
              ${renderFieldMarkup({ label: "Favicon", value: media.favicon || "", type: "image", wide: true, data: { model: "setting", path: "media.favicon" } })}
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="entity-card settings-card">
          <div class="entity-card__head"><strong>Футер</strong></div>
          <div class="settings-footer-structure row g-3">
            <div class="col-12 col-md-6">
              <div class="settings-mini-card">
                <div class="settings-mini-card__head">
                  <h3>Брендовый блок</h3>
                  <p>Описание компании в первой колонке футера.</p>
                </div>
                ${renderFieldMarkup({ label: "Описание бренда", value: footer.brandDescription || "", type: "textarea", wide: true, data: { model: "setting", path: "site.footer.brandDescription" } })}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="settings-mini-card">
                <div class="settings-mini-card__head">
                  <h3>Блок навигации</h3>
                  <p>Заголовок списка ссылок в футере. Сами пункты редактируются в разделе «Меню».</p>
                </div>
                ${renderFieldMarkup({ label: "Заголовок навигации", value: footer.navigationTitle || "", wide: true, data: { model: "setting", path: "site.footer.navigationTitle" } })}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="settings-mini-card">
                <div class="settings-mini-card__head">
                  <h3>Контактный блок</h3>
                  <p>Заголовок и короткая подпись для контактной колонки футера.</p>
                </div>
                ${renderFieldMarkup({ label: "Заголовок контактов", value: footer.contactsTitle || "", wide: true, data: { model: "setting", path: "site.footer.contactsTitle" } })}
                ${renderFieldMarkup({ label: "Подпись блока", value: footer.contactsNote || "", type: "textarea", wide: true, data: { model: "setting", path: "site.footer.contactsNote" } })}
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="settings-mini-card">
                <div class="settings-mini-card__head">
                  <h3>Нижняя строка</h3>
                  <p>Текст копирайта и подписи юридических ссылок в самом низу футера.</p>
                </div>
                ${renderFieldMarkup({ label: "Копирайт", value: footer.bottomText || "", type: "textarea", wide: true, helper: "Если оставить пустым, будет использован стандартный текст с названием сайта и годом.", data: { model: "setting", path: "site.footer.bottomText" } })}
                ${renderFieldMarkup({ label: "Текст ссылки «Политика»", value: footer.privacyLabel || "", wide: true, data: { model: "setting", path: "site.footer.privacyLabel" } })}
                ${renderFieldMarkup({ label: "Текст ссылки «Соглашение»", value: footer.agreementLabel || "", wide: true, data: { model: "setting", path: "site.footer.agreementLabel" } })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div class="entity-card settings-card">
          <div class="entity-card__head"><strong>Коммуникации и карта</strong></div>
          <div class="settings-grid">
            ${renderFieldMarkup({ label: "MAX URL", value: messenger.url || "", wide: true, data: { model: "setting", path: "messenger.url" } })}
            ${renderFieldMarkup({ label: "Кнопка MAX в hero", value: messenger.heroLabel || "", data: { model: "setting", path: "messenger.heroLabel" } })}
            ${renderFieldMarkup({ label: "Кнопка MAX в контактах", value: messenger.contactsLabel || "", data: { model: "setting", path: "messenger.contactsLabel" } })}
            ${renderFieldMarkup({ label: "Заголовок карты", value: map.title || "", wide: true, data: { model: "setting", path: "contactMap.title" } })}
            ${renderFieldMarkup({ label: "Подпись карты", value: map.note || "", type: "textarea", wide: true, data: { model: "setting", path: "contactMap.note" } })}
            ${renderFieldMarkup({ label: "Ссылка маршрута", value: map.routeUrl || "", wide: true, data: { model: "setting", path: "contactMap.routeUrl" } })}
            ${renderFieldMarkup({ label: "Embed URL карты", value: map.embedUrl || "", wide: true, data: { model: "setting", path: "contactMap.embedUrl" } })}
            ${renderFieldMarkup({ label: "Owner e-mail", value: notifications.ownerEmail || "", data: { model: "setting", path: "notifications.ownerEmail" } })}
            ${renderCheckboxMarkup("Отправлять подтверждение клиенту", Boolean(notifications.sendClientConfirmation), { model: "setting", path: "notifications.sendClientConfirmation" }, true)}
            <div class="field is-wide">
              <span>Профиль администратора</span>
              <p class="helper-line">Если меняете логин или e-mail, введите текущий и новый пароль. После сохранения система попросит войти заново.</p>
            </div>
            ${renderFieldMarkup({ label: "Логин", value: state.profileDraft.username || "", data: { model: "profile", path: "username" } })}
            ${renderFieldMarkup({ label: "E-mail", value: state.profileDraft.email || "", data: { model: "profile", path: "email" } })}
            ${renderFieldMarkup({ label: "Текущий пароль", value: state.profileDraft.currentPassword || "", data: { model: "profile", path: "currentPassword" }, type: "password" })}
            ${renderFieldMarkup({ label: "Новый пароль", value: state.profileDraft.newPassword || "", data: { model: "profile", path: "newPassword" }, type: "password" })}
          </div>
        </div>
      </div>
    </div>`;
}

function renderAll() {
  hydrateMenuBlockTargets();
  computeStats();
  renderDashboard();
  renderLeadsEditor();
  renderBuilder();
  renderReviewsEditor();
  renderGalleryEditor();
  renderBeforeAfterEditor();
  renderMenusEditor();
  renderSettingsEditor();
  syncDirtyState();
  syncCurrentUser();
  setScreen(state.screen);
}

function moveItem(array, itemId, direction) {
  const index = array.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= array.length) return;
  [array[index], array[nextIndex]] = [array[nextIndex], array[index]];
}

function removeItem(array, itemId) {
  const index = array.findIndex((item) => item.id === itemId);
  if (index >= 0) array.splice(index, 1);
}

function addHomeBlock(type) {
  const template = CUSTOM_BLOCK_TEMPLATES[type];
  if (!template) return;
  state.settings.pages.home.blocks.push({
    id: createId(),
    anchor: createSuggestedHomeBlockAnchor(type),
    type,
    label: template.label,
    page: "home",
    visible: true,
    locked: false,
    content: deepClone(template.defaults),
  });
}

function addPageItem(pageKey, collectionName) {
  const page = state.settings.pages[pageKey];
  if (!page) return;
  if (!Array.isArray(page[collectionName])) page[collectionName] = [];
  if (pageKey === "services-page") {
    page.items.push({ id: createId(), title: "Новая услуга", text: "", image: { src: "", alt: "" }, reverse: false, buttonLabel: "Вызвать клинера" });
    return;
  }
  if (pageKey === "reviews-page" && collectionName === "items") {
    page.items.push({ id: createId(), author: "Новый отзыв", text: "" });
  }
}

function addEntity(collectionName) {
  if (collectionName === "reviews") {
    state.reviews.unshift(normalizeReviewEntity({
      id: createId(),
      sourceType: "manual",
      sourceItemId: "",
      author: "Новый отзыв",
      rating: 5,
      text: "",
      date: new Date().toISOString().slice(0, 10),
      sourceLabel: "Сайт",
      externalUrl: "",
      avatarUrl: "",
      isPublished: true,
      isHidden: false,
      isFeatured: false,
      isImported: false,
      importedAt: "",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }));
  }
  if (collectionName === "gallery") {
    state.gallery.unshift({ id: createId(), title: "Новое изображение", src: "", alt: "", caption: "", published: true, tags: [] });
  }
  if (collectionName === "beforeAfter") {
    state.beforeAfter.unshift({ id: createId(), title: "Новая пара", description: "", beforeAlt: "", afterAlt: "", before: "", after: "", published: true });
  }
}

function addMenuItem(scope) {
  if (!Array.isArray(state.settings.menus[scope])) state.settings.menus[scope] = [];
  state.settings.menus[scope].push({ id: createId(), label: "Новый пункт", href: "#home", blockTarget: "", visible: true });
}

function updateModelFromInput(input) {
  const model = input.dataset.model;
  const path = input.dataset.path;
  const value = input.type === "checkbox" ? input.checked : input.value;
  if (!model || !path) return;

  if (model === "block") {
    const block = findHomeBlock(input.dataset.blockId);
    if (block) {
      setByPath(block, path, value);
      if (path === "anchor") {
        hydrateMenuBlockTargets();
      }
    }
  }

  if (model === "collection-item") {
    const block = findHomeBlock(input.dataset.blockId);
    const collection = getByPath(block, input.dataset.collection) || [];
    const item = collection.find((entry) => entry.id === input.dataset.id);
    if (item) setByPath(item, path, value);
  }

  if (model === "page") {
    const page = state.settings.pages[input.dataset.page];
    if (page) setByPath(page, path, value);
  }

  if (model === "page-item") {
    const item = findPageCollectionItem(input.dataset.page, input.dataset.collection, input.dataset.id);
    if (item) setByPath(item, path, value);
  }

  if (model === "entity") {
    const item = findEntityById(input.dataset.collection, input.dataset.id);
    if (item) {
      setByPath(item, path, value);
      if (input.dataset.collection === "reviews") {
        Object.assign(item, normalizeReviewEntity(item));
      }
    }
  }

  if (model === "entity-tags") {
    const item = findEntityById(input.dataset.collection, input.dataset.id);
    if (item) {
      item.tags = String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
    }
  }

  if (model === "menu-item") {
    const item = findMenuItem(input.dataset.scope, input.dataset.id);
    if (item) {
      if (path === "blockTarget") {
        item.blockTarget = value;
        if (item.blockTarget) {
          item.href = buildHomeBlockMenuHref(item.blockTarget);
        }
      } else if (path === "href") {
        item.href = value;
        item.blockTarget = detectMenuBlockTargetByHref(value);
      } else {
        setByPath(item, path, value);
      }
    }
  }

  if (model === "seo-global") {
    setByPath(state.settings, `seo.global.${path}`, value);
  }

  if (model === "seo-page") {
    setByPath(state.settings, `seo.pages.${input.dataset.page}.${path}`, value);
  }

  if (model === "setting") {
    setByPath(state.settings, path, value);
    if (path.startsWith("reviewsIntegration.")) {
      ensureReviewsIntegrationShape(state.settings);
      const yandex = getYandexReviewSettings();
      if (path === "reviewsIntegration.yandex.widgetCode" && String(value || "").trim()) {
        yandex.widgetUrl = extractYandexWidgetUrlFromCode(value);
      }
    }
  }

  if (model === "profile") {
    setByPath(state.profileDraft, path, value);
  }
}

function updateStringCollection(input) {
  const block = findHomeBlock(input.dataset.blockId);
  if (!block) return;
  const [collectionPath, itemId, nestedPath] = String(input.dataset.collection || "").split(".");
  const collection = getByPath(block, collectionPath) || [];
  const item = collection.find((entry) => entry.id === itemId);
  if (!item) return;
  const nested = getByPath(item, nestedPath) || [];
  nested[Number(input.dataset.index || 0)] = input.value;
  setByPath(item, nestedPath, nested);
}

async function handleFileUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  const targetValue = await uploadFile(file);
  if (!targetValue) return;
  const twinInput = input.previousElementSibling;
  if (twinInput && twinInput.dataset.model) {
    twinInput.value = targetValue;
    updateModelFromInput(twinInput);
  }
}

async function saveAllChanges() {
  if (runtime.saving) return;
  runtime.saving = true;
  saveAllButton.disabled = true;
  if (resetSiteButton) resetSiteButton.disabled = true;
  dirtyIndicator.className = "dirty-indicator";
  dirtyIndicator.textContent = "Сохраняем...";
  try {
    hydrateMenuBlockTargets();
    ensureReviewsIntegrationShape(state.settings);
    state.reviews = normalizeReviewsCollection(state.reviews);
    const profileChanged = state.profileDraft.username !== (state.currentUser?.username || "")
      || state.profileDraft.email !== (state.currentUser?.email || "")
      || Boolean(state.profileDraft.newPassword);

    if (profileChanged) {
      if (!state.profileDraft.currentPassword || !state.profileDraft.newPassword) {
        throw new Error("Для обновления профиля введите текущий и новый пароль.");
      }
      if (state.profileDraft.newPassword.length < 8) {
        throw new Error("Новый пароль должен быть не короче 8 символов.");
      }
    }

    if (runtime.backendAvailable) {
      await api("/api/admin/editor", {
        method: "PUT",
        body: JSON.stringify({
          settings: state.settings,
          reviews: state.reviews,
          beforeAfter: state.beforeAfter,
          gallery: state.gallery,
        }),
      });
    } else {
      saveToLocalStore();
    }

    if (profileChanged) {
      if (runtime.backendAvailable) {
        await api("/api/admin/password", {
          method: "POST",
          body: JSON.stringify({
            username: state.profileDraft.username,
            email: state.profileDraft.email,
            currentPassword: state.profileDraft.currentPassword,
            newPassword: state.profileDraft.newPassword,
          }),
        });
        localStorage.removeItem(SESSION_KEY);
        state.snapshot = serializePersistedState();
        syncDirtyState(true);
        alert("Изменения сохранены. Данные профиля обновлены, выполните вход заново.");
        window.location.reload();
        return;
      }

      const localStore = hydrateLocalStore(loadLocalStore());
      const user = (localStore.users || []).find((item) => item.username === state.currentUser.username);
      if (!user || user.password !== state.profileDraft.currentPassword) {
        throw new Error("Текущий пароль указан неверно.");
      }
      user.username = state.profileDraft.username;
      user.email = state.profileDraft.email;
      user.password = state.profileDraft.newPassword;
      saveLocalStore(localStore);
      localStorage.removeItem(SESSION_KEY);
      state.snapshot = serializePersistedState();
      syncDirtyState(true);
      alert("Изменения сохранены. Данные профиля обновлены, выполните вход заново.");
      window.location.reload();
      return;
    }

    if (runtime.backendAvailable) {
      state.snapshot = serializePersistedState();
      state.logs = [
        {
          id: createId(),
          action: "editor.saved",
          actor: state.currentUser?.username || "admin",
          message: "Сохранены данные конструктора сайта",
          createdAt: new Date().toISOString(),
        },
        ...state.logs.slice(0, 19),
      ];
    }
    syncDirtyState(true);
    renderDashboard();
  } finally {
    runtime.saving = false;
    saveAllButton.disabled = false;
    if (resetSiteButton) resetSiteButton.disabled = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;
  if (isDefaultLocalAdminCredentials(username, password)) {
    try {
      const localStore = hydrateLocalStore(loadLocalStore());
      saveLocalStore(localStore);
      const adminUser = (localStore.users || []).find((entry) => entry.username === "admin") || {
        id: "admin",
        username: "admin",
        password: "admin",
        email: "admin@aquablesk.local",
        role: "admin",
      };
      await openLocalAdminSession(adminUser);
    } catch (error) {
      console.error("Default local admin login failed", error);
      setStatus(loginStatus, `\u041f\u0430\u043d\u0435\u043b\u044c \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043b\u0430\u0441\u044c: ${error.message}`, "error");
    }
    return;
  }
  if (!username || !password) {
    setStatus(loginStatus, "Заполните логин и пароль.", "error");
    return;
  }
  setStatus(loginStatus, "Проверяем доступ...", "loading");

  if (runtime.backendAvailable) {
    let payload;
    try {
      payload = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      console.error("Admin login request failed", error);
      const localStore = hydrateLocalStore(loadLocalStore());
      saveLocalStore(localStore);
      const localUser = (localStore.users || []).find((entry) => entry.username === username && entry.password === password);
      if (localUser) {
        runtime.backendAvailable = false;
        localStorage.setItem(SESSION_KEY, localUser.username);
        state.currentUser = localUser;
        await loadEditorState();
        applyScreenFromHash();
        openAdminPanel();
        return;
      }
      setStatus(loginStatus, error.message, "error");
      return;
    }

    try {
      state.currentUser = payload.user || null;
      setStatus(loginStatus, "Вход выполнен. Загружаем панель...", "success");
      await loadEditorState({ user: payload.user || null });
      applyScreenFromHash();
      openAdminPanel();
      return;
    } catch (error) {
      console.error("Admin panel bootstrap failed after successful login", error);
      setStatus(loginStatus, `Вход выполнен, но панель не загрузилась: ${error.message}`, "error");
      return;
    }
  }

  const localStore = hydrateLocalStore(loadLocalStore());
  saveLocalStore(localStore);
  const user = (localStore.users || []).find((entry) => entry.username === username && entry.password === password);
  if (!user) {
    setStatus(loginStatus, "Неверный логин или пароль.", "error");
    return;
  }
  localStorage.setItem(SESSION_KEY, user.username);
  state.currentUser = user;
  await loadEditorState();
  applyScreenFromHash();
  openAdminPanel();
}

async function logout() {
  if (runtime.backendAvailable) {
    try {
      await api("/api/admin/logout", { method: "POST", body: "{}" });
    } catch {
      // Ignore logout transport issues on explicit logout.
    }
  }
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

async function restoreSession() {
  if (runtime.backendAvailable) {
    try {
      await loadEditorState();
      applyScreenFromHash();
      openAdminPanel();
      return true;
    } catch {
      return false;
    }
  }

  const localStore = hydrateLocalStore(loadLocalStore());
  saveLocalStore(localStore);
  const currentUsername = localStorage.getItem(SESSION_KEY);
  const user = (localStore.users || []).find((item) => item.username === currentUsername);
  if (!user) return false;
  await loadEditorState();
  applyScreenFromHash();
  openAdminPanel();
  return true;
}

document.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) return;
  if (input.dataset.leadSearchInput !== undefined || input.dataset.crmSearch !== undefined) {
    state.leadFilters.search = input.value || "";
    renderLeadsEditor();
    return;
  }
  if (input.dataset.action === "string-update") {
    updateStringCollection(input);
    syncDirtyState();
    return;
  }
  if (input.dataset.model) {
    updateModelFromInput(input);
    if (input.type === "checkbox") {
      renderAll();
      return;
    }
    syncDirtyState();
  }
});

document.addEventListener("change", async (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
  if (input.dataset.reviewSourceFilter !== undefined) {
    state.reviewFilters.source = input.value || "all";
    renderReviewsEditor();
    return;
  }
  if (input.dataset.leadStatusFilter !== undefined || input.dataset.crmStatusFilter !== undefined) {
    state.leadFilters.status = input.value || "all";
    renderLeadsEditor();
    return;
  }
  if (input instanceof HTMLSelectElement && input.dataset.model) {
    updateModelFromInput(input);
    renderAll();
    return;
  }
  if (input.dataset.model === "menu-item") {
    renderMenusEditor();
    syncDirtyState();
    return;
  }
  if (input.dataset.model === "setting") {
    const previewPaths = [
      "site.title",
      "site.brandName",
      "site.brandMark",
      "site.phoneDisplay",
      "site.hours",
      "site.city",
      "media.logo",
    ];
    const path = String(input.dataset.path || "");
    if (previewPaths.includes(path) || path.startsWith("site.footer.")) {
      renderSettingsEditor();
      syncDirtyState();
      return;
    }
  }
  if (input.dataset.uploadField === "true") {
    await handleFileUpload(input);
    renderAll();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.dataset.leadForm === undefined) return;
  event.preventDefault();
  saveLeadForm(form).catch((error) => {
    setStatus($("[data-lead-form-status]", leadsEditor), error.message, "error");
  });
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action],[data-screen-target]");
  if (!target) return;

  if (target.dataset.screenTarget) {
    setScreen(target.dataset.screenTarget);
    return;
  }

  const action = target.dataset.action;
  if (action === "open-constructor") {
    if (!isConstructorScreen(state.screen)) {
      state.builderPage = "home";
      renderBuilder();
      setScreen("builder");
      return;
    }
    state.navMode = "constructor";
    syncSidebarNavigation();
    return;
  }
  if (action === "close-constructor") {
    setScreen(state.lastMainScreen || "dashboard");
    return;
  }
  if (action === "constructor-screen") {
    setScreen(target.dataset.screen || "reviews");
    return;
  }
  if (action === "toggle-builder-blocks") {
    state.builderBlocksMenuOpen = !state.builderBlocksMenuOpen;
    renderBuilderPageTabs();
    return;
  }
  if (action === "lead-open") {
    state.leadDraft = null;
    state.selectedLeadId = target.dataset.leadId || "";
    ensureLeadSelection();
    renderLeadsEditor();
    return;
  }
  if (action === "reset-site") {
    resetSiteToDefaults().catch((error) => window.alert(error.message));
    return;
  }
  if (action === "reset-analytics") {
    resetAnalyticsData().catch((error) => window.alert(error.message));
    return;
  }
  if (action === "lead-add") {
    state.selectedLeadId = "";
    state.leadDraft = createEmptyLeadDraft();
    renderLeadsEditor();
    return;
  }
  if (action === "lead-clear-demo") {
    clearDemoLeadRecords().catch((error) => {
      setStatus($("[data-leads-action-status]", leadsEditor), error.message, "error");
    });
    return;
  }
  if (action === "lead-restore-demo") {
    restoreDemoLeadRecords().catch((error) => {
      setStatus($("[data-leads-action-status]", leadsEditor), error.message, "error");
    });
    return;
  }
  if (action === "lead-confirm-dispatch") {
    const form = target.closest("[data-lead-form]");
    if (!form) return;
    form.elements.confirmed.checked = true;
    if (CRM_STATUSES.indexOf(normalizeLeadStatus(form.elements.status.value)) < CRM_STATUSES.indexOf("подтверждено")) {
      form.elements.status.value = "подтверждено";
    }
    saveLeadForm(form, "Согласие на выезд зафиксировано").catch((error) => {
      setStatus($("[data-lead-form-status]", leadsEditor), error.message, "error");
    });
    return;
  }
  if (action === "lead-delete") {
    deleteLeadRecord().catch((error) => {
      setStatus($("[data-lead-form-status]", leadsEditor), error.message, "error");
    });
    return;
  }
  if (action === "builder-page") {
    state.builderPage = target.dataset.page || "home";
    if (state.builderPage !== "home") {
      state.builderBlocksMenuOpen = false;
    }
    setScreen("builder");
    renderBuilder();
    return;
  }
  if (action === "builder-add-block-direct") {
    addHomeBlock(target.dataset.blockType || "rich-text");
    state.builderBlocksMenuOpen = true;
    setScreen("builder");
    renderBuilder();
    return;
  }
  if (action === "builder-add-block") {
    addHomeBlock($("[data-new-block-type]", builderAddBlockNode)?.value || "rich-text");
  }
  if (action === "block-up") moveItem(state.settings.pages.home.blocks, target.dataset.blockId, -1);
  if (action === "block-down") moveItem(state.settings.pages.home.blocks, target.dataset.blockId, 1);
  if (action === "block-toggle") {
    const block = findHomeBlock(target.dataset.blockId);
    if (block) block.visible = block.visible === false;
  }
  if (action === "block-remove") removeItem(state.settings.pages.home.blocks, target.dataset.blockId);
  if (action === "block-duplicate") {
    const block = findHomeBlock(target.dataset.blockId);
    if (block && CUSTOM_BLOCK_TEMPLATES[block.type]) {
      state.settings.pages.home.blocks.push({
        ...deepClone(block),
        id: createId(),
        anchor: createSuggestedHomeBlockAnchor(block.type || block.anchor || block.label),
        label: `${block.label} (копия)`,
        locked: false,
      });
    }
  }
  if (action === "collection-add") {
    const block = findHomeBlock(target.dataset.blockId);
    const collection = getByPath(block, target.dataset.collection) || [];
    const schema = (BLOCK_SCHEMAS[block.type].collections || []).find((item) => item.path === target.dataset.collection);
    const item = { id: createId() };
    (schema.itemFields || []).forEach((field) => setByPath(item, field.path, ""));
    (schema.stringCollections || []).forEach((field) => setByPath(item, field.path, []));
    collection.push(item);
    setByPath(block, target.dataset.collection, collection);
  }
  if (action === "collection-remove" || action === "collection-up" || action === "collection-down") {
    const block = findHomeBlock(target.dataset.blockId);
    const collection = getByPath(block, target.dataset.collection) || [];
    if (action === "collection-remove") removeItem(collection, target.dataset.id);
    if (action === "collection-up") moveItem(collection, target.dataset.id, -1);
    if (action === "collection-down") moveItem(collection, target.dataset.id, 1);
    setByPath(block, target.dataset.collection, collection);
  }
  if (action === "string-add" || action === "string-remove" || action === "string-up" || action === "string-down") {
    const block = findHomeBlock(target.dataset.blockId);
    const [collectionPath, itemId, nestedPath] = String(target.dataset.collection || "").split(".");
    const collection = getByPath(block, collectionPath) || [];
    const item = collection.find((entry) => entry.id === itemId);
    if (item) {
      const nested = getByPath(item, nestedPath) || [];
      const index = Number(target.dataset.index || 0);
      if (action === "string-add") nested.push("");
      if (action === "string-remove") nested.splice(index, 1);
      if (action === "string-up" && index > 0) [nested[index - 1], nested[index]] = [nested[index], nested[index - 1]];
      if (action === "string-down" && index < nested.length - 1) [nested[index + 1], nested[index]] = [nested[index], nested[index + 1]];
      setByPath(item, nestedPath, nested);
    }
  }
  if (action === "page-item-add") addPageItem(target.dataset.page, target.dataset.collection);
  if (action === "page-item-remove") removeItem(state.settings.pages[target.dataset.page][target.dataset.collection], target.dataset.id);
  if (action === "page-item-up") moveItem(state.settings.pages[target.dataset.page][target.dataset.collection], target.dataset.id, -1);
  if (action === "page-item-down") moveItem(state.settings.pages[target.dataset.page][target.dataset.collection], target.dataset.id, 1);
  if (action === "entity-up") moveItem(state[target.dataset.collection], target.dataset.id, -1);
  if (action === "entity-down") moveItem(state[target.dataset.collection], target.dataset.id, 1);
  if (action === "entity-remove") removeItem(state[target.dataset.collection], target.dataset.id);
  if (action === "menu-add") addMenuItem(target.dataset.scope);
  if (action === "menu-remove") removeItem(state.settings.menus[target.dataset.scope], target.dataset.id);
  if (action === "menu-up") moveItem(state.settings.menus[target.dataset.scope], target.dataset.id, -1);
  if (action === "menu-down") moveItem(state.settings.menus[target.dataset.scope], target.dataset.id, 1);
  if (action === "analytics-demo") fillAnalyticsWithDemoData();
  if (action === "reviews-save-settings") {
    saveReviewsSettings().catch((error) => {
      setStatus($("[data-review-yandex-status]", reviewsEditor), error.message, "error");
    });
    return;
  }
  if (action === "reviews-yandex-check") {
    checkYandexConnection().catch((error) => {
      setStatus($("[data-review-yandex-status]", reviewsEditor), error.message, "error");
    });
    return;
  }
  if (action === "reviews-yandex-sync") {
    syncYandexReviews().catch((error) => {
      setStatus($("[data-review-yandex-status]", reviewsEditor), error.message, "error");
    });
    return;
  }
  if (action === "builder-add-block" || action.startsWith("block") || action.startsWith("collection") || action.startsWith("string") || action.startsWith("page-item") || action.startsWith("entity") || action.startsWith("menu")) {
    renderAll();
  }
});

loginForm?.addEventListener("submit", handleLogin);
saveAllButton?.addEventListener("click", () => {
  saveAllChanges().catch((error) => {
    dirtyIndicator.className = "dirty-indicator is-dirty";
    dirtyIndicator.textContent = error.message;
  });
});
logoutButton?.addEventListener("click", logout);
openFrontendButton?.addEventListener("click", () => {
  window.open(buildPreviewUrl(), "_blank", "noopener,noreferrer");
});
$("[data-add-review]")?.addEventListener("click", () => { addEntity("reviews"); renderReviewsEditor(); syncDirtyState(); });
$("[data-add-gallery-item]")?.addEventListener("click", () => { addEntity("gallery"); renderGalleryEditor(); syncDirtyState(); });
$("[data-add-beforeafter-item]")?.addEventListener("click", () => { addEntity("beforeAfter"); renderBeforeAfterEditor(); syncDirtyState(); });

window.addEventListener("beforeunload", (event) => {
  if (serializePersistedState() === state.snapshot) return;
  event.preventDefault();
  event.returnValue = "";
});

(async function init() {
  await probeBackend();
  const restored = await restoreSession();
  if (!restored) {
    loginPanel.classList.remove("is-hidden");
    appShell.classList.add("is-hidden");
  }
})();
