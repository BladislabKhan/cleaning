const views = [...document.querySelectorAll(".view")];
let navLinks = [...document.querySelectorAll(".nav a, .footer-nav a")];
let mobileNavLinks = [...document.querySelectorAll(".mobile-nav a")];
const brandLink = document.querySelector(".js-home-brand");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-nav");
const desktopMenu = document.querySelector(".desktop-nav");
const footerMenu = document.querySelector(".footer-nav");
const siteHeader = document.querySelector(".site-header");
const heroSection = document.querySelector(".hero");
let forms = [...document.querySelectorAll(".js-lead-form")];
let faqItems = [...document.querySelectorAll(".faq-item")];
let compareSliders = [...document.querySelectorAll(".compare-slider")];
const reviewTrack = document.querySelector('[data-slider="reviews"]');
const reviewPrev = document.querySelector(".reviews-prev");
const reviewNext = document.querySelector(".reviews-next");
const scrollTopButton = document.querySelector(".scroll-top");
const siteFooter = document.querySelector(".site-footer");
const orderModal = document.querySelector(".js-order-modal");
const cookieConsentModal = document.querySelector(".js-cookie-consent-modal");
let openOrderButtons = [...document.querySelectorAll(".js-open-order-modal")];
let closeOrderButtons = [...document.querySelectorAll(".js-close-order-modal")];
const cookieAcceptButton = document.querySelector(".js-cookie-accept");
const cookieCloseButtons = [...document.querySelectorAll(".js-cookie-close")];
const cookieConsentLinks = [...document.querySelectorAll(".cookie-consent-banner a")];
const limitedTexts = [...document.querySelectorAll(".js-limited-text")];
const revealSections = [...document.querySelectorAll(".js-reveal-section")];
const revealItems = [...document.querySelectorAll(".reveal-up")];
const parallaxPanels = [...document.querySelectorAll(".js-parallax-panel, .service-showcase, .advantages-section, .reviews-section, #contacts, .site-footer")];
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let mapEmbeds = [...document.querySelectorAll("[data-map-embed]")];
let mapAddressText = [...document.querySelectorAll("[data-map-address-text]")];
let mapTitles = [...document.querySelectorAll("[data-map-title]")];
let mapNotes = [...document.querySelectorAll("[data-map-note]")];
let mapRoutes = [...document.querySelectorAll("[data-map-route]")];
let sitePhoneLinks = [...document.querySelectorAll("[data-site-phone-link], .call-link")];
let siteHoursNodes = [...document.querySelectorAll("[data-site-hours]")];
let siteCityNodes = [...document.querySelectorAll("[data-site-city]")];
const siteBrandTexts = [...document.querySelectorAll(".brand-text")];
const siteBrandMarks = [...document.querySelectorAll(".brand-mark")];
const siteFooterBrandMarks = [...document.querySelectorAll(".footer-brand-mark")];
const siteBrandLogoShells = [...document.querySelectorAll("[data-site-logo-shell]")];
const siteBrandLogoNodes = [...document.querySelectorAll("[data-site-logo]")];
const siteFooterCopyNodes = [...document.querySelectorAll(".footer-copy")];
const footerNavigationTitleNodes = [...document.querySelectorAll("[data-footer-navigation-title]")];
const footerContactsTitleNodes = [...document.querySelectorAll("[data-footer-contacts-title]")];
const footerContactsNoteNodes = [...document.querySelectorAll("[data-footer-contacts-note]")];
const footerBottomCopyNodes = [...document.querySelectorAll("[data-footer-bottom-copy]")];
const footerPrivacyLabelNodes = [...document.querySelectorAll("[data-footer-privacy-label]")];
const footerAgreementLabelNodes = [...document.querySelectorAll("[data-footer-agreement-label]")];
const reviewCards = [...document.querySelectorAll("[data-review-card]")];
const HOME_HASH_PREFIX = "#home/";
const siteConfig = mergeSiteConfigObject(window.SITE_EDITOR_DEFAULTS?.settings || {}, window.SITE_CONFIG || {});
if (window.SITE_CONFIG?.seo?.title) {
  siteConfig.seo.global.title = window.SITE_CONFIG.seo.title;
}
if (window.SITE_CONFIG?.seo?.description) {
  siteConfig.seo.global.description = window.SITE_CONFIG.seo.description;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isAbsoluteUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(String(value || ""));
}

function normalizeMediaUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return raw;
  if (isAbsoluteUrl(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return raw.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
}

function normalizeTargetUrl(value, fallback = "#") {
  const normalized = normalizeMediaUrl(value);
  return normalized || fallback;
}

function parseReviewDateValue(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : { date: value, useUtc: false };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const numericDate = new Date(value);
    return Number.isNaN(numericDate.getTime()) ? null : { date: numericDate, useUtc: false };
  }

  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^\d{10,13}$/.test(raw)) {
    const timestamp = raw.length === 10 ? Number(raw) * 1000 : Number(raw);
    const timestampDate = new Date(timestamp);
    return Number.isNaN(timestampDate.getTime()) ? null : { date: timestampDate, useUtc: false };
  }

  const russianDateMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (russianDateMatch) {
    const [, day, month, year, hours = "00", minutes = "00", seconds = "00"] = russianDateMatch;
    const russianDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
    return Number.isNaN(russianDate.getTime()) ? null : { date: russianDate, useUtc: false };
  }

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const isoDate = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(isoDate.getTime()) ? null : { date: isoDate, useUtc: false };
  }

  const normalizedIso = raw.replace(/\.(\d{3})\d+(?=(?:Z|[+-]\d{2}:\d{2})$)/i, ".$1");
  const parsedDate = new Date(normalizedIso);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    date: parsedDate,
    useUtc: /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalizedIso),
  };
}

function formatReviewPublishedAt(value) {
  const parsed = parseReviewDateValue(value);
  if (!parsed) return "";

  const formatterOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  };

  if (parsed.useUtc) {
    formatterOptions.timeZone = "UTC";
  }

  return new Intl.DateTimeFormat("ru-RU", formatterOptions).format(parsed.date);
}

function getNormalizedReviewsIntegration() {
  const raw = siteConfig.reviewsIntegration || {};
  const yandex = raw.yandex || {};
  return {
    ...raw,
    yandex: {
      enabled: yandex.enabled !== undefined ? Boolean(yandex.enabled) : Boolean(raw.yandexWidgetUrl || yandex.widgetUrl),
      widgetUrl: yandex.widgetUrl || raw.yandexWidgetUrl || "",
      businessUrl: yandex.businessUrl || raw.yandexBusinessUrl || "",
      previewUrl: yandex.previewUrl || yandex.widgetUrl || yandex.businessUrl || raw.yandexWidgetUrl || raw.yandexBusinessUrl || "",
      mode: yandex.mode || "fallback_only",
      statusMessage: yandex.statusMessage || raw.note || "",
    },
  };
}

function hasRenderablePublicReviews(reviews = siteConfig.reviews) {
  return Array.isArray(reviews) && reviews.some((item) => item && String(item.text || "").trim());
}

function resolveFooterBottomText(brandName, footerConfig = {}) {
  const fallback = `© ${new Date().getFullYear()} ${brandName}. Все права защищены.`;
  const raw = String(footerConfig.bottomText || "").trim();
  if (!raw) return fallback;
  return raw
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{brand}", brandName);
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
  return Array.isArray(siteConfig.pages?.home?.blocks) ? siteConfig.pages.home.blocks : [];
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

function resolveMenuItemHref(item, anchorMap = buildHomeBlockAnchorMap()) {
  if (item?.blockTarget) {
    const boundBlock = getHomeBlocks().find((block) => block.id === item.blockTarget);
    if (boundBlock) {
      return `${HOME_HASH_PREFIX}${getResolvedHomeBlockAnchor(boundBlock, anchorMap)}`;
    }
  }
  return item?.href || "";
}

function buildQrImageUrl(placeUrl) {
  const safeUrl = normalizeTargetUrl(placeUrl, "");
  if (!safeUrl || safeUrl === "#") return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=svg&data=${encodeURIComponent(safeUrl)}`;
}

const REVIEW_QR_FALLBACKS = {
  gis: "assets/qr-2gis.svg",
  "2gis": "assets/qr-2gis.svg",
  yandex: "assets/qr-yandex.svg",
};

function getReviewQrFallback(reviewKey, reviewConfig = {}) {
  const source = String(reviewConfig.source || reviewKey || "").toLowerCase();
  return REVIEW_QR_FALLBACKS[source] || REVIEW_QR_FALLBACKS[reviewKey] || "";
}

function resolveReviewQrSrc(reviewConfig, placeUrl, reviewKey = "") {
  const staticQr = normalizeMediaUrl(reviewConfig?.qrImage);
  if (staticQr) return staticQr;
  const fallbackQr = getReviewQrFallback(reviewKey, reviewConfig);
  if (fallbackQr) return fallbackQr;
  return buildQrImageUrl(placeUrl);
}

function preloadReviewCardAssets() {
  const reviewsConfig = siteConfig.reviewCards || {};
  Object.entries(reviewsConfig).forEach(([reviewKey, reviewConfig]) => {
    if (!reviewConfig) return;
    const placeUrl = normalizeTargetUrl(reviewConfig.placeUrl || reviewConfig.reviewUrl || reviewConfig.buttonUrl || reviewConfig.qrUrl, "#");
    const qrSrc = resolveReviewQrSrc(reviewConfig, placeUrl, reviewKey);
    if (!qrSrc) return;

    const hasPreload = [...document.head.querySelectorAll('link[rel="preload"][as="image"]')]
      .some((link) => link.getAttribute("href") === qrSrc);

    if (!hasPreload) return;
  });
}

function clampRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(5, numeric));
}

function formatRating(value) {
  const rating = clampRating(value);
  if (!rating) return "—";
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function formatReviewsCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return "";
  return `${count} ${new Intl.PluralRules("ru-RU").select(count) === "one" ? "отзыв" : (new Intl.PluralRules("ru-RU").select(count) === "few" ? "отзыва" : "отзывов")}`;
}

function buildStars(value) {
  const rating = Math.round(clampRating(value)) || 0;
  return rating ? `${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))}` : "";
}

function getReviewSourceMeta(source) {
  const normalized = String(source || "manual").toLowerCase();
  if (normalized === "2gis" || normalized === "gis") {
    return {
      source: "2gis",
      label: "",
      brandMark: "2GIS",
      cardClass: "review-card-gis",
      buttonClass: "gis-solid",
      iconLabel: "2GIS",
      preferMarkOnly: true,
    };
  }
  if (normalized === "yandex") {
    return {
      source: "yandex",
      label: "Яндекс Карты",
      brandMark: "",
      cardClass: "review-card-yandex",
      buttonClass: "yandex-solid",
      iconLabel: "Яндекс",
      preferLabelOnly: true,
    };
  }
  return {
    source: "manual",
    label: "Ручной источник",
    brandMark: "★",
    cardClass: "review-card-manual",
    buttonClass: "manual-solid",
    iconLabel: "★",
    preferMarkOnly: false,
    preferLabelOnly: false,
  };
}
const formatCards = [...document.querySelectorAll(".work-modes-panel .work-mode-card")];
const interactiveCards = [
  ...document.querySelectorAll(".compare-card, .review-card, .review-slide, .map-card, .contact-block"),
];
let maxLinks = [...document.querySelectorAll("[data-max-link]")];
const allImages = [...document.querySelectorAll("img")];
let reviewSliderBound = false;
const REVIEW_SLIDER_FALLBACK_STEP_PX = 320;
const REVIEW_SLIDER_DEFAULT_GAP_PX = 16;
const REVIEW_SLIDER_EDGE_TOLERANCE_PX = 4;
const REVIEW_SLIDER_END_SNAP_FACTOR = 0.5;
const REVIEW_SLIDER_GESTURE_THRESHOLD_PX = 10;
const heroStaticQuery = window.matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)");
const FORM_REQUEST_TIMEOUT_MS = 15000;
const FORM_MIN_FILL_MS = 1500;
const FORM_COOLDOWN_MS = 15000;
const FORM_DUPLICATE_TTL_MS = 120000;
const FORM_DUPLICATE_STORAGE_KEY = "aquablesk_lead_submit_cache";
const ANALYTICS_VISITOR_KEY = "aquablesk_visitor_id_v1";
const ANALYTICS_SESSION_KEY = "aquablesk_session_id_v1";
const SECURITY_CHECK_SESSION_KEY = "aquablesk_security_check_passed_v1";
const SECURITY_CHECK_ARM_DELAY_MS = 650;
const TURNSTILE_CONFIG_ENDPOINT = "/api/security/turnstile-config";
const TURNSTILE_VERIFY_ENDPOINT = "/api/security/turnstile-verify";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let lastTrackedPath = "";

function loadExternalScript(src) {
  const existing = [...document.scripts].find((script) => script.src === src);
  if (existing) {
    return existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initSecurityCheck() {
  const root = document.querySelector("[data-security-check]");
  if (!root) return;

  const form = root.querySelector("[data-security-form]");
  const checkbox = root.querySelector("[data-security-human-check]");
  const challenge = root.querySelector(".security-check__challenge");
  const turnstileContainer = root.querySelector("[data-turnstile-container]");
  const statusNode = root.querySelector("[data-security-status]");
  const domainNode = root.querySelector("[data-security-domain]");
  const providerNode = root.querySelector("[data-security-provider]");
  const trapInput = root.querySelector(".security-check__trap");
  const host = window.location.hostname || "aquablesk.local";
  let lastTrustedPointerAt = 0;

  if (domainNode) domainNode.textContent = host;

  const passCheck = () => {
    if (statusNode) statusNode.textContent = "Проверка выполнена. Открываем сайт.";
    root.classList.add("is-verified");
    try {
      sessionStorage.setItem(SECURITY_CHECK_SESSION_KEY, "1");
    } catch {
      // Session storage may be unavailable in strict browsers.
    }
    window.setTimeout(() => {
      root.classList.add("is-passed");
      root.setAttribute("aria-hidden", "true");
    }, 260);
  };

  try {
    if (sessionStorage.getItem(SECURITY_CHECK_SESSION_KEY) === "1") {
      root.classList.add("is-passed");
      root.setAttribute("aria-hidden", "true");
      return;
    }
  } catch {
    // Keep the visual check if storage is blocked.
  }

  const enableFallbackChallenge = () => {
    form.hidden = false;
    if (turnstileContainer) turnstileContainer.hidden = true;
    if (providerNode) providerNode.textContent = "Локальная проверка";
    if (statusNode) statusNode.textContent = "Поставьте галочку, чтобы пройти проверку.";
  };

  const tryTurnstileChallenge = async () => {
    let configResponse;
    try {
      configResponse = await fetch(TURNSTILE_CONFIG_ENDPOINT, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } catch {
      return false;
    }

    if (!configResponse.ok) return false;
    const config = await configResponse.json().catch(() => ({}));
    if (!config.enabled || !config.siteKey) return false;

    form.hidden = true;
    if (turnstileContainer) turnstileContainer.hidden = false;
    if (providerNode) providerNode.textContent = "Cloudflare Turnstile";
    if (statusNode) statusNode.textContent = "Загружаем Cloudflare Turnstile...";

    try {
      await loadExternalScript(TURNSTILE_SCRIPT_URL);
      if (!window.turnstile || !turnstileContainer) return false;
      window.turnstile.render(turnstileContainer, {
        sitekey: config.siteKey,
        action: "site_gate",
        theme: "light",
        callback: async (token) => {
          if (statusNode) statusNode.textContent = "Проверяем токен Cloudflare...";
          try {
            const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "same-origin",
              body: JSON.stringify({ token }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
              throw new Error(payload.error || "Cloudflare Turnstile не подтвердил проверку.");
            }
            passCheck();
          } catch (error) {
            if (statusNode) statusNode.textContent = error.message || "Проверка Cloudflare не пройдена.";
            root.classList.add("is-rejected");
            window.setTimeout(() => root.classList.remove("is-rejected"), 900);
            if (window.turnstile) window.turnstile.reset(turnstileContainer);
          }
        },
        "error-callback": () => {
          if (statusNode) statusNode.textContent = "Ошибка Cloudflare Turnstile. Попробуйте обновить страницу.";
          return true;
        },
        "expired-callback": () => {
          if (statusNode) statusNode.textContent = "Проверка устарела. Поставьте галочку ещё раз.";
        },
      });
      return true;
    } catch {
      enableFallbackChallenge();
      return false;
    }
  };

  const turnstileEnabled = await tryTurnstileChallenge();
  if (turnstileEnabled) return;

  enableFallbackChallenge();

  window.setTimeout(() => {
    root.classList.add("is-ready");
  }, SECURITY_CHECK_ARM_DELAY_MS);

  const rejectCheck = (message) => {
    if (checkbox) checkbox.checked = false;
    root.classList.remove("is-verified");
    root.classList.add("is-rejected");
    if (statusNode) statusNode.textContent = message;
    window.setTimeout(() => root.classList.remove("is-rejected"), 900);
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  const markTrustedInteraction = (event) => {
    if (event.isTrusted) {
      lastTrustedPointerAt = Date.now();
    }
  };

  challenge?.addEventListener("pointerdown", markTrustedInteraction);
  challenge?.addEventListener("mousedown", markTrustedInteraction);
  challenge?.addEventListener("touchstart", markTrustedInteraction, { passive: true });
  challenge?.addEventListener("keydown", (event) => {
    if (event.isTrusted && (event.key === " " || event.key === "Enter")) {
      lastTrustedPointerAt = Date.now();
    }
  });

  checkbox?.addEventListener("change", (event) => {
    const isHumanGesture = event.isTrusted || Date.now() - lastTrustedPointerAt < 1500;
    const trapFilled = Boolean(String(trapInput?.value || "").trim());

    if (!checkbox.checked) return;
    if (trapFilled) {
      rejectCheck("Проверка не пройдена. Обновите страницу и попробуйте снова.");
      return;
    }
    if (!isHumanGesture) {
      rejectCheck("Нужно поставить галочку вручную.");
      return;
    }

    passCheck();
  });
}

initSecurityCheck();

function syncHeroRuntimeClass() {
  document.body.classList.toggle("mobile-hero-static", heroStaticQuery.matches);
}

syncHeroRuntimeClass();
if (heroStaticQuery.addEventListener) {
  heroStaticQuery.addEventListener("change", syncHeroRuntimeClass);
} else if (heroStaticQuery.addListener) {
  heroStaticQuery.addListener(syncHeroRuntimeClass);
}

function mergeSiteConfigObject(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? JSON.parse(JSON.stringify(overrideValue)) : JSON.parse(JSON.stringify(baseValue));
  }
  if (!baseValue || typeof baseValue !== "object") {
    return overrideValue === undefined ? baseValue : JSON.parse(JSON.stringify(overrideValue));
  }
  const result = {};
  const keys = new Set([...Object.keys(baseValue || {}), ...Object.keys(overrideValue || {})]);
  keys.forEach((key) => {
    const baseEntry = baseValue?.[key];
    const overrideEntry = overrideValue?.[key];
    if (Array.isArray(baseEntry) || (baseEntry && typeof baseEntry === "object")) {
      result[key] = mergeSiteConfigObject(baseEntry, overrideEntry);
      return;
    }
    result[key] = overrideEntry === undefined ? baseEntry : JSON.parse(JSON.stringify(overrideEntry));
  });
  return result;
}

function mergeSiteConfig(source) {
  if (!source || typeof source !== "object") return;
  const merged = mergeSiteConfigObject(siteConfig, source);
  Object.keys(siteConfig).forEach((key) => {
    if (!(key in merged)) {
      delete siteConfig[key];
    }
  });
  Object.assign(siteConfig, merged);
}

function refreshRuntimeCollections() {
  navLinks = [...document.querySelectorAll(".nav a, .footer-nav a")];
  mobileNavLinks = [...document.querySelectorAll(".mobile-nav a")];
  forms = [...document.querySelectorAll(".js-lead-form")];
  faqItems = [...document.querySelectorAll(".faq-item")];
  openOrderButtons = [...document.querySelectorAll(".js-open-order-modal")];
  closeOrderButtons = [...document.querySelectorAll(".js-close-order-modal")];
  mapEmbeds = [...document.querySelectorAll("[data-map-embed]")];
  mapAddressText = [...document.querySelectorAll("[data-map-address-text]")];
  mapTitles = [...document.querySelectorAll("[data-map-title]")];
  mapNotes = [...document.querySelectorAll("[data-map-note]")];
  mapRoutes = [...document.querySelectorAll("[data-map-route]")];
  sitePhoneLinks = [...document.querySelectorAll("[data-site-phone-link], .call-link")];
  siteHoursNodes = [...document.querySelectorAll("[data-site-hours]")];
  siteCityNodes = [...document.querySelectorAll("[data-site-city]")];
  maxLinks = [...document.querySelectorAll("[data-max-link]")];
}

function applySiteBrandConfig() {
  const siteData = siteConfig.site || {};
  const brandName = siteData.brandName || siteData.title || "АкваБлеск";
  const brandMark = siteData.brandMark || "АБ";
  const footerConfig = siteData.footer || {};
  const logo = normalizeMediaUrl(siteConfig.media?.logo || "");
  const footerCopy = footerConfig.brandDescription || siteData.footerCopy || "Клининг квартир, домов и коммерческих помещений в Хабаровске. Понятные условия, фиксированная стоимость и аккуратный результат.";
  const footerContactsNote = footerConfig.contactsNote || "";
  const footerBottomCopy = resolveFooterBottomText(brandName, footerConfig);

  siteBrandTexts.forEach((node) => {
    node.textContent = brandName;
  });
  siteBrandMarks.forEach((node) => {
    node.textContent = brandMark;
    node.classList.toggle("is-hidden", Boolean(logo));
  });
  siteFooterBrandMarks.forEach((node) => {
    node.textContent = brandMark;
  });
  siteBrandLogoShells.forEach((node) => {
    node.classList.toggle("is-hidden", !logo);
  });
  siteBrandLogoNodes.forEach((node) => {
    node.alt = `${brandName} логотип`;
    if (logo) {
      node.src = logo;
      return;
    }
    node.removeAttribute("src");
  });
  siteFooterCopyNodes.forEach((node) => {
    node.textContent = footerCopy;
  });
  footerNavigationTitleNodes.forEach((node) => {
    node.textContent = footerConfig.navigationTitle || "Навигация";
  });
  footerContactsTitleNodes.forEach((node) => {
    node.textContent = footerConfig.contactsTitle || "Контакты";
  });
  footerContactsNoteNodes.forEach((node) => {
    node.textContent = footerContactsNote;
    node.classList.toggle("is-hidden", !footerContactsNote);
  });
  footerBottomCopyNodes.forEach((node) => {
    node.textContent = footerBottomCopy;
  });
  footerPrivacyLabelNodes.forEach((node) => {
    node.textContent = footerConfig.privacyLabel || "Политика конфиденциальности";
  });
  footerAgreementLabelNodes.forEach((node) => {
    node.textContent = footerConfig.agreementLabel || "Пользовательское соглашение";
  });
}

function createMenuMarkup(items = []) {
  const anchorMap = buildHomeBlockAnchorMap();
  return items
    .filter((item) => item && item.visible !== false && item.label && resolveMenuItemHref(item, anchorMap))
    .map((item) => `<a href="${escapeHtml(resolveMenuItemHref(item, anchorMap))}">${escapeHtml(item.label)}</a>`)
    .join("");
}

function applyMenuConfig() {
  const menus = siteConfig.menus || {};
  if (desktopMenu) {
    desktopMenu.innerHTML = createMenuMarkup(menus.primary || []);
  }
  if (mobileMenu) {
    const menuMarkup = createMenuMarkup(menus.primary || []);
    const phoneLinkMarkup = siteConfig.site?.phoneDisplay
      ? `<a class="phone-link call-link" data-site-phone-link data-site-phone-text href="${escapeHtml(siteConfig.site?.phoneHref || "#")}">${escapeHtml(siteConfig.site.phoneDisplay)}</a>`
      : "";
    mobileMenu.innerHTML = `${menuMarkup}${phoneLinkMarkup}`;
  }
  if (footerMenu) {
    footerMenu.innerHTML = createMenuMarkup(menus.footer || []);
  }
  refreshRuntimeCollections();
}

const LEGACY_HASH_SECTION = {
  "services-page": "services",
  "reviews-page": "reviews",
  "contacts-page": "contacts",
};

const validViews = new Set([
  "home",
  "about",
  "privacy",
  "user-agreement",
  "thank-you",
]);

function normalizeLegacyHashInLocationBar() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw.includes("/")) return;
  const section = LEGACY_HASH_SECTION[raw];
  if (section) {
    history.replaceState(null, "", `#home/${section}`);
  }
}

function applyContactMapConfig() {
  const mapConfig = siteConfig.contactMap || {};
  const lat = Number(mapConfig.lat);
  const lng = Number(mapConfig.lng);
  const zoom = Number(mapConfig.zoom) || 15;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const address = mapConfig.address || "Хабаровск, центр города";
  const title = mapConfig.title || "АкваБлеск в Хабаровске";
  const note = mapConfig.note || "Откройте карту, посмотрите точку и постройте маршрут.";
  const routeUrl = normalizeTargetUrl(
    mapConfig.routeUrl || mapConfig.placeUrl ||
    (hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`),
    "https://www.google.com/maps",
  );
  const embedUrl = normalizeTargetUrl(
    mapConfig.embedUrl || mapConfig.iframeSrc ||
    (hasCoords
      ? `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`),
    "about:blank",
  );

  mapEmbeds.forEach((frame) => {
    frame.src = embedUrl;
    frame.title = title;
    frame.loading = "lazy";
    frame.setAttribute("allowfullscreen", "");
  });
  mapAddressText.forEach((node) => {
    node.textContent = address;
  });
  mapTitles.forEach((node) => {
    node.textContent = title;
  });
  mapNotes.forEach((node) => {
    node.textContent = note;
  });
  mapRoutes.forEach((link) => {
    link.href = routeUrl;
  });
}

function applySiteContactConfig() {
  const siteData = siteConfig.site || {};
  const fallbackPhone = siteData.phoneDisplay || "+7 (914) 582-63-17";
  const normalizedHref =
    siteData.phoneHref ||
    (() => {
      const digits = String(fallbackPhone).replace(/\D/g, "");
      return digits ? `tel:+${digits}` : "tel:+79145826317";
    })();
  const city = siteData.city || "Хабаровск";
  const hours = siteData.hours || "Ежедневно 09:00–22:00";
  const phoneAria = `Позвонить по номеру ${fallbackPhone}`;

  sitePhoneLinks.forEach((link) => {
    link.href = normalizedHref;
    link.setAttribute("aria-label", phoneAria);
    if (link.hasAttribute("data-site-phone-text") || link.classList.contains("phone-link")) {
      link.textContent = fallbackPhone;
    }
    if (link.title && /MAX/i.test(link.title) === false) {
      link.title = phoneAria;
    }
  });

  siteHoursNodes.forEach((node) => {
    node.textContent = hours;
  });

  siteCityNodes.forEach((node) => {
    node.textContent = city;
  });
}

function applyReviewCardConfig() {
  const reviewsConfig = siteConfig.reviewCards || {};

  reviewCards.forEach((card) => {
    const reviewKey = card.dataset.reviewCard;
    const reviewConfig = reviewsConfig[reviewKey];
    if (!reviewConfig) return;

    const sourceMeta = getReviewSourceMeta(reviewConfig.source || reviewKey);
    const titleNode = card.querySelector("[data-review-title]");
    const textNode = card.querySelector("[data-review-text]");
    const actionLink = card.querySelector("[data-review-link]");
    const qrLink = card.querySelector("[data-review-qr-link]");
    const qrImage = card.querySelector("[data-review-qr]");
    const sourceLabelNode = card.querySelector("[data-review-source-label]");
    const brandMarkNode = card.querySelector("[data-review-brand-mark]");
    const ratingNode = card.querySelector("[data-review-rating]");
    const starsNode = card.querySelector("[data-review-stars]");
    const countNode = card.querySelector("[data-review-count]");
    const ratingIconNode = card.querySelector("[data-review-rating-icon]");

    const title = reviewConfig.title || titleNode?.textContent || "";
    const text = reviewConfig.text || textNode?.textContent || "";
    const rawSourceLabel = reviewConfig.sourceLabel || sourceMeta.label;
    const sourceLabel = sourceMeta.preferMarkOnly ? "" : rawSourceLabel;
    const brandMark = sourceMeta.preferLabelOnly ? "" : (reviewConfig.icon || sourceMeta.brandMark);
    const placeUrl = normalizeTargetUrl(reviewConfig.placeUrl || reviewConfig.reviewUrl || reviewConfig.buttonUrl || reviewConfig.qrUrl, "#");
    const buttonLabel = reviewConfig.buttonLabel || actionLink?.textContent || "Перейти";
    const rating = formatRating(reviewConfig.rating);
    const stars = buildStars(reviewConfig.rating);
    const reviewsCount = formatReviewsCount(reviewConfig.reviewsCount);
    const qrFallbackSrc = getReviewQrFallback(reviewKey, reviewConfig);
    const qrImageSrc = resolveReviewQrSrc(reviewConfig, placeUrl, reviewKey);
    const openInNewTab = reviewConfig.openInNewTab !== false;

    card.dataset.reviewSource = sourceMeta.source;
    card.classList.remove("review-card-gis", "review-card-yandex", "review-card-manual");
    card.classList.add(sourceMeta.cardClass);

    if (titleNode) titleNode.textContent = title;
    if (textNode) textNode.textContent = text;
    if (sourceLabelNode) sourceLabelNode.textContent = sourceLabel;
    if (brandMarkNode) brandMarkNode.textContent = brandMark;
    if (ratingNode) ratingNode.textContent = rating;
    if (starsNode) starsNode.textContent = stars;
    if (countNode) countNode.textContent = reviewsCount || "Без счётчика отзывов";
    if (ratingIconNode) {
      ratingIconNode.setAttribute("aria-label", `${sourceLabel}: рейтинг ${rating}`);
      ratingIconNode.dataset.iconLabel = reviewConfig.icon || sourceMeta.iconLabel;
    }

    if (actionLink) {
      actionLink.textContent = buttonLabel;
      actionLink.href = placeUrl;
      actionLink.classList.remove("gis-solid", "yandex-solid", "manual-solid");
      actionLink.classList.add(sourceMeta.buttonClass);
      if (openInNewTab) {
        actionLink.target = "_blank";
        actionLink.rel = "noopener noreferrer";
      } else {
        actionLink.removeAttribute("target");
        actionLink.removeAttribute("rel");
      }
    }

    if (qrLink) {
      qrLink.href = placeUrl;
      if (openInNewTab) {
        qrLink.target = "_blank";
        qrLink.rel = "noopener noreferrer";
      } else {
        qrLink.removeAttribute("target");
        qrLink.removeAttribute("rel");
      }
      qrLink.setAttribute("aria-label", `${title}: открыть ссылку ${sourceLabel} по QR`);
    }

    if (qrImage) {
      if (qrFallbackSrc && qrImage.dataset.qrFallbackBound !== "true") {
        qrImage.dataset.qrFallbackBound = "true";
        qrImage.addEventListener("error", () => {
          if (qrImage.src.endsWith(qrFallbackSrc)) return;
          qrImage.src = qrFallbackSrc;
        });
      }
      qrImage.loading = "lazy";
      qrImage.decoding = "async";
      qrImage.removeAttribute("fetchpriority");
      qrImage.src = qrImageSrc;
      qrImage.alt = reviewConfig.qrAlt || `QR-код: ${title}`;
    }
  });
}

function applyMessengerConfig() {
  const messengerConfig = siteConfig.messenger || {};
  const messengerName = messengerConfig.name || "MAX";
  const messengerUrl = messengerConfig.url || "#";
  const openInNewTab = messengerConfig.openInNewTab !== false;

  maxLinks.forEach((link) => {
    const variant = link.dataset.maxVariant || "contacts";
    const label =
      variant === "hero"
        ? (messengerConfig.heroLabel || `Написать в ${messengerName}`)
        : (messengerConfig.contactsLabel || `Перейти в ${messengerName}`);
    const ariaLabel = messengerConfig.ariaLabel || label;

    link.href = messengerUrl;
    link.textContent = label;
    link.setAttribute("aria-label", ariaLabel);
    link.setAttribute("title", label);

    if (openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });
}

function splitTitleIntoLines(title = "", lineCount = 2) {
  const words = String(title || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  if (lineCount <= 1 || words.length <= lineCount) return [words.join(" ")];
  const result = [];
  const chunkSize = Math.ceil(words.length / lineCount);
  for (let index = 0; index < words.length; index += chunkSize) {
    result.push(words.slice(index, index + chunkSize).join(" "));
  }
  return result;
}

function getHeroTitleLayoutLines(title, layoutName) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) return [];
  if (layoutName === "desktop") return splitTitleIntoLines(normalizedTitle, 1);
  if (layoutName === "mobile" && normalizedTitle.includes("—")) {
    return normalizedTitle
      .split("—")
      .map((part, index) => (index === 0 ? part.trim() : `— ${part.trim()}`))
      .filter(Boolean);
  }
  return splitTitleIntoLines(normalizedTitle, 2);
}

function createHeroTitleLayout(layoutName, lines) {
  const layoutNode = document.createElement("span");
  layoutNode.className = `hero-title-layout hero-title-layout-${layoutName}`;
  layoutNode.dataset.titleLayout = layoutName;
  layoutNode.setAttribute("aria-hidden", "true");
  lines.forEach((line) => {
    const lineNode = document.createElement("span");
    lineNode.className = "hero-line";
    lineNode.textContent = line;
    layoutNode.append(lineNode);
  });
  return layoutNode;
}

function updateHeroTitleLayout(titleNode, layoutName, lines) {
  const layoutNode =
    titleNode.querySelector(`[data-title-layout="${layoutName}"]`) ||
    titleNode.querySelector(`.hero-title-layout-${layoutName}`);
  if (!layoutNode) return false;

  const lineNodes = [...layoutNode.querySelectorAll(".hero-line")];
  if (lineNodes.length !== lines.length) {
    layoutNode.replaceChildren(...lines.map((line) => {
      const lineNode = document.createElement("span");
      lineNode.className = "hero-line";
      lineNode.textContent = line;
      return lineNode;
    }));
    return true;
  }

  lineNodes.forEach((lineNode, index) => {
    if (lineNode.textContent !== lines[index]) {
      lineNode.textContent = lines[index];
    }
  });
  return true;
}

function renderHeroTitleLayouts(titleNode, title) {
  if (!titleNode) return;
  const normalizedTitle = String(title || "").trim();
  const layouts = {
    desktop: getHeroTitleLayoutLines(normalizedTitle, "desktop"),
    tablet: getHeroTitleLayoutLines(normalizedTitle, "tablet"),
    mobile: getHeroTitleLayoutLines(normalizedTitle, "mobile"),
  };

  titleNode.setAttribute("aria-label", normalizedTitle);
  const allLayoutsUpdated = Object.entries(layouts).every(([layoutName, lines]) =>
    updateHeroTitleLayout(titleNode, layoutName, lines)
  );
  if (allLayoutsUpdated) return;

  titleNode.replaceChildren(
    createHeroTitleLayout("desktop", layouts.desktop),
    createHeroTitleLayout("tablet", layouts.tablet),
    createHeroTitleLayout("mobile", layouts.mobile)
  );
}

function renderCustomHomeBlock(block) {
  const section = document.createElement("section");
  section.className = "section";
  section.dataset.customBlock = "true";
  section.id = getResolvedHomeBlockAnchor(block);
  const content = block.content || {};
  if (block.type === "rich-text") {
    const imgSrc = normalizeMediaUrl(content.image?.src);
    const imgAlt = escapeHtml(content.image?.alt || content.title || "");
    const figure = imgSrc
      ? `<figure class="custom-block-figure"><img src="${escapeHtml(imgSrc)}" alt="${imgAlt}" loading="lazy" decoding="async"></figure>`
      : "";
    const btnHref = escapeHtml(normalizeTargetUrl(content.buttonHref || "#home/contacts"));
    section.innerHTML = `<div class="container narrow"><h2 class="section-title">${escapeHtml(content.title || "")}</h2>${figure}<p class="lead muted center">${escapeHtml(content.text || "")}</p>${content.buttonLabel ? `<div class="button-row center"><a class="button primary" href="${btnHref}">${escapeHtml(content.buttonLabel)}</a></div>` : ""}</div>`;
    return section;
  }
  if (block.type === "feature-cards") {
    const cards = (content.cards || [])
      .map((item) => {
        const cSrc = normalizeMediaUrl(item.image?.src);
        const cAlt = escapeHtml(item.image?.alt || item.title || "");
        const thumb = cSrc
          ? `<div class="custom-card-thumb"><img src="${escapeHtml(cSrc)}" alt="${cAlt}" loading="lazy" decoding="async"></div>`
          : "";
        return `<article class="card advantage-tone custom-feature-card">${thumb}<h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.text || "")}</p></article>`;
      })
      .join("");
    section.innerHTML = `<div class="container"><h2 class="section-title">${escapeHtml(content.title || "")}</h2>${content.subtitle ? `<p class="lead muted center section-subtitle">${escapeHtml(content.subtitle)}</p>` : ""}<div class="grid three advantages-grid">${cards}</div></div>`;
    return section;
  }
  if (block.type === "showcase") {
    section.classList.add("custom-block-showcase");
    const imgSrc = normalizeMediaUrl(content.image?.src);
    const imgAlt = escapeHtml(content.image?.alt || content.title || "");
    const media = imgSrc
      ? `<div class="custom-block-showcase__media"><img src="${escapeHtml(imgSrc)}" alt="${imgAlt}" loading="lazy" decoding="async"></div>`
      : "";
    const subtitle = content.subtitle ? `<p class="lead muted center section-subtitle">${escapeHtml(content.subtitle)}</p>` : "";
    const lead = content.lead ? `<p class="lead muted custom-block-showcase__lead">${escapeHtml(content.lead)}</p>` : "";
    const titleHtml = content.title ? `<h2 class="section-title">${escapeHtml(content.title)}</h2>` : "";
    const cards = (content.cards || [])
      .map((item) => {
        const cSrc = normalizeMediaUrl(item.image?.src);
        const cAlt = escapeHtml(item.image?.alt || item.title || "");
        const thumb = cSrc
          ? `<div class="custom-card-thumb"><img src="${escapeHtml(cSrc)}" alt="${cAlt}" loading="lazy" decoding="async"></div>`
          : "";
        return `<article class="card advantage-tone custom-feature-card">${thumb}<h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.text || "")}</p></article>`;
      })
      .join("");
    section.innerHTML = `<div class="container"><div class="custom-block-showcase__intro">${titleHtml}${subtitle}${lead}</div><div class="custom-block-showcase__body">${media}<div class="custom-block-showcase__cards grid three advantages-grid">${cards}</div></div></div>`;
    return section;
  }
  if (block.type === "cta-banner") {
    section.classList.add("soft");
    section.innerHTML = `<div class="container narrow"><div class="card text-card"><p class="eyebrow">${escapeHtml(content.eyebrow || "")}</p><h2 class="section-title left">${escapeHtml(content.title || "")}</h2><p>${escapeHtml(content.text || "")}</p><div class="button-row">${content.primaryButtonLabel ? `<a class="button primary" href="${escapeHtml(content.primaryButtonHref || "#home/contacts")}">${escapeHtml(content.primaryButtonLabel)}</a>` : ""}${content.secondaryButtonLabel ? `<a class="button outline" href="${escapeHtml(content.secondaryButtonHref || "#home/contacts")}">${escapeHtml(content.secondaryButtonLabel)}</a>` : ""}</div></div></div>`;
    return section;
  }
  return section;
}

function applyHomePageBlocks() {
  const homePage = siteConfig.pages?.home;
  const homeMain = document.querySelector('main[data-view="home"]');
  if (!homeMain || !Array.isArray(homePage?.blocks) || !homePage.blocks.length) return;
  const anchorMap = buildHomeBlockAnchorMap(homePage.blocks);

  const selectors = {
    hero: "#hero",
    "about-company": "#about-company",
    advantages: ".advantages-section",
    "order-steps": "#order-steps",
    services: "#services",
    projects: "#projects",
    reviews: "#reviews",
    faq: "#faq",
    contacts: "#contacts",
  };

  const existingMap = new Map(Object.entries(selectors).map(([key, selector]) => {
    const node = homeMain.querySelector(`[data-home-block-key="${key}"]`) || homeMain.querySelector(selector);
    if (node) {
      node.dataset.homeBlockKey = key;
      node.id = getResolvedHomeBlockAnchor(key, anchorMap);
    }
    return [key, node];
  }));
  homeMain.querySelectorAll("[data-custom-block='true']").forEach((node) => node.remove());

  const heroBlock = homePage.blocks.find((item) => item.id === "hero");
  if (heroBlock) {
    const section = existingMap.get("hero");
    const titleNode = document.querySelector(".hero-title");
    renderHeroTitleLayouts(titleNode, heroBlock.content?.title || "");
    const subtitleNode = document.querySelector(".hero-subtitle");
    if (subtitleNode) {
      const subtitle = heroBlock.content?.subtitle || "";
      subtitleNode.innerHTML = escapeHtml(subtitle).replace(/офиса\s+и\s+объекта/gi, "офиса&nbsp;и&nbsp;объекта");
    }
    const noteNode = document.querySelector(".hero-note");
    if (noteNode) noteNode.textContent = heroBlock.content?.note || "";
    const imageNode = document.querySelector(".hero-visual img");
    if (imageNode) {
      imageNode.src = heroBlock.content?.image?.src || imageNode.src;
      imageNode.alt = heroBlock.content?.image?.alt || imageNode.alt;
    }
    const trustNode = document.querySelector(".trust-points");
    if (trustNode) {
      trustNode.innerHTML = (heroBlock.content?.trustPoints || []).map((item) => `<span>${escapeHtml(item.text || "")}</span>`).join("");
    }
    const heroButtons = section?.querySelectorAll(".button-row .button") || [];
    if (heroButtons[0]) heroButtons[0].textContent = heroBlock.content?.primaryButton?.label || heroButtons[0].textContent;
    if (heroButtons[1]) heroButtons[1].textContent = heroBlock.content?.secondaryButton?.label || heroButtons[1].textContent;
  }

  const aboutBlock = homePage.blocks.find((item) => item.id === "about-company");
  if (aboutBlock) {
    const section = existingMap.get("about-company");
    if (section) {
      const title = section.querySelector(".service-intro .section-title");
      const lead = section.querySelector(".service-intro .lead");
      const cardsTitle = section.querySelector(".work-modes-panel .sub-title");
      const grid = section.querySelector(".work-modes-grid");
      if (title) title.textContent = aboutBlock.content?.title || "";
      if (lead) lead.textContent = aboutBlock.content?.lead || "";
      if (cardsTitle) cardsTitle.textContent = aboutBlock.content?.cardsTitle || "";
      if (grid) {
        grid.innerHTML = (aboutBlock.content?.cards || []).map((item, index) => `<article class="work-mode-card reveal-up" style="--card-delay: ${index * 70}ms;"><span class="work-mode-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span><div class="work-mode-copy"><h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.text || "")}</p></div></article>`).join("");
      }
    }
  }

  const advantagesBlock = homePage.blocks.find((item) => item.id === "advantages");
  if (advantagesBlock) {
    const section = existingMap.get("advantages");
    if (section) {
      const title = section.querySelector(".section-title");
      const subtitle = section.querySelector(".section-subtitle");
      const grid = section.querySelector(".advantages-grid");
      if (title) title.textContent = advantagesBlock.content?.title || "";
      if (subtitle) subtitle.textContent = advantagesBlock.content?.subtitle || "";
      if (grid) grid.innerHTML = (advantagesBlock.content?.cards || []).map((item) => `<article class="card advantage-tone"><h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.text || "")}</p></article>`).join("");
    }
  }

  const stepsBlock = homePage.blocks.find((item) => item.id === "order-steps");
  if (stepsBlock) {
    const section = existingMap.get("order-steps");
    if (section) {
      const title = section.querySelector(".section-title");
      const subtitle = section.querySelector(".section-subtitle");
      const grid = section.querySelector(".centered-grid");
      if (title) title.textContent = stepsBlock.content?.title || "";
      if (subtitle) subtitle.textContent = stepsBlock.content?.subtitle || "";
      if (grid) grid.innerHTML = (stepsBlock.content?.steps || []).map((item) => `<article class="step-card"><span class="step-num">${escapeHtml(item.number || "")}</span><h3>${escapeHtml(item.title || "")}</h3><p>${escapeHtml(item.text || "")}</p></article>`).join("");
    }
  }

  const servicesBlock = homePage.blocks.find((item) => item.id === "services");
  if (servicesBlock) {
    const section = existingMap.get("services");
    if (section) {
      const title = section.querySelector(".section-title");
      const subtitle = section.querySelector(".section-subtitle");
      const grid = section.querySelector(".service-grid");
      if (title) title.textContent = servicesBlock.content?.title || "";
      if (subtitle) subtitle.textContent = servicesBlock.content?.subtitle || "";
      if (grid) {
        grid.innerHTML = (servicesBlock.content?.items || []).map((item) => `<article class="service-card"><div class="service-card-body"><h3>${escapeHtml(item.title || "")}</h3><div class="service-photo"><img src="${escapeHtml(item.image?.src || "")}" alt="${escapeHtml(item.image?.alt || item.title || "")}"></div><ul>${(item.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul></div></article>`).join("");
      }
    }
  }

  const projectsBlock = homePage.blocks.find((item) => item.id === "projects");
  if (projectsBlock) {
    const section = existingMap.get("projects");
    if (section) {
      const title = section.querySelector(".section-title");
      const subtitle = section.querySelector(".section-subtitle");
      if (title) title.textContent = projectsBlock.content?.title || "";
      if (subtitle) subtitle.textContent = projectsBlock.content?.subtitle || "";
    }
  }

  const reviewsBlock = homePage.blocks.find((item) => item.id === "reviews");
  if (reviewsBlock) {
    const section = existingMap.get("reviews");
    if (section) {
      const eyebrow = section.querySelector(".section-heading .eyebrow");
      const title = section.querySelector(".section-heading .section-title");
      const lead = section.querySelector(".reviews-lead");
      const widgetEyebrow = section.querySelector(".widget-eyebrow");
      const widgetTitle = section.querySelector(".reviews-widget h3");
      const widgetText = section.querySelector(".reviews-widget p:not(.eyebrow)");
      if (eyebrow) eyebrow.textContent = reviewsBlock.content?.eyebrow || "";
      if (title) title.textContent = reviewsBlock.content?.title || "";
      if (lead) lead.textContent = reviewsBlock.content?.lead || "";
      if (widgetEyebrow) widgetEyebrow.textContent = reviewsBlock.content?.widgetEyebrow || "";
      if (widgetTitle) widgetTitle.textContent = reviewsBlock.content?.widgetTitle || "";
      if (widgetText) widgetText.textContent = reviewsBlock.content?.widgetText || "";
    }
  }

  const faqBlock = homePage.blocks.find((item) => item.id === "faq");
  if (faqBlock) {
    const section = existingMap.get("faq");
    if (section) {
      const title = section.querySelector(".section-title");
      const list = section.querySelector(".faq-list");
      if (title) title.textContent = faqBlock.content?.title || "";
      if (list) list.innerHTML = (faqBlock.content?.items || []).map((item) => `<article class="faq-item"><button class="faq-trigger" type="button" aria-expanded="false">${escapeHtml(item.question || "")}</button><div class="faq-content"><p>${escapeHtml(item.answer || "")}</p></div></article>`).join("");
    }
  }

  const contactsBlock = homePage.blocks.find((item) => item.id === "contacts");
  if (contactsBlock) {
    const section = existingMap.get("contacts");
    if (section) {
      const title = section.querySelector(".section-title");
      const cardTitle = section.querySelector(".contact-block h3");
      const note = section.querySelector(".contact-block .muted");
      const mapEyebrow = section.querySelector(".map-meta .eyebrow");
      const buttons = section.querySelectorAll(".contact-block .button-row .button");
      const c = contactsBlock.content || {};
      if (title && c.title) title.textContent = c.title;
      if (cardTitle && c.cardTitle) cardTitle.textContent = c.cardTitle;
      if (note && c.note) note.textContent = c.note;
      if (mapEyebrow && c.mapEyebrow) mapEyebrow.textContent = c.mapEyebrow;
      if (buttons[0]) buttons[0].textContent = c.primaryButtonLabel || buttons[0].textContent;
      if (buttons[1]) buttons[1].textContent = c.secondaryButtonLabel || buttons[1].textContent;
      const form = section.querySelector(".js-lead-form");
      if (form) {
        const heading = form.querySelector("h2");
        const button = form.querySelector('button[type="submit"]');
        const disclaimer = form.querySelector(".tiny.muted");
        if (heading && c.formTitle) heading.textContent = c.formTitle;
        if (button && c.formButtonLabel) button.textContent = c.formButtonLabel;
        if (disclaimer && c.formDisclaimer) disclaimer.textContent = c.formDisclaimer;
        if (c.formPlaceholders?.name) form.querySelector('input[name="name"]')?.setAttribute("placeholder", c.formPlaceholders.name);
        if (c.formPlaceholders?.phone) form.querySelector('input[name="phone"]')?.setAttribute("placeholder", c.formPlaceholders.phone);
        if (c.formPlaceholders?.email) form.querySelector('input[name="email"]')?.setAttribute("placeholder", c.formPlaceholders.email);
        if (c.formPlaceholders?.message) form.querySelector('textarea[name="message"]')?.setAttribute("placeholder", c.formPlaceholders.message);
      }
    }
  }

  const orderedNodes = [];
  homePage.blocks.forEach((block) => {
    const existing = existingMap.get(block.id);
    if (existing) {
      existing.dataset.homeBlockKey = block.id;
      existing.id = getResolvedHomeBlockAnchor(block, anchorMap);
      existing.hidden = block.visible === false;
      orderedNodes.push(existing);
      return;
    }
    const customNode = renderCustomHomeBlock(block);
    customNode.hidden = block.visible === false;
    orderedNodes.push(customNode);
  });

  const orphans = [...homeMain.children].filter((node) => !orderedNodes.includes(node));
  [...orderedNodes, ...orphans].forEach((node) => homeMain.appendChild(node));
}

function applyAdditionalPageContent() {
  ["privacy", "user-agreement"].forEach((pageKey) => {
    const page = siteConfig.pages?.[pageKey];
    const container = document.querySelector(`main[data-view="${pageKey}"] .container`);
    if (page && container) {
      container.innerHTML = `<h1 class="section-title left">${escapeHtml(page.title || "")}</h1><p class="policy-subtitle">${escapeHtml(page.subtitle || "")}</p>${page.html || ""}`;
    }
  });

  const thankYouPage = siteConfig.pages?.["thank-you"];
  const thankYouNode = document.querySelector('main[data-view="thank-you"] .container');
  if (thankYouPage && thankYouNode) {
    thankYouNode.innerHTML = `<div class="thanks-badge">✓</div><h1 class="section-title">${escapeHtml(thankYouPage.title || "")}</h1><p class="lead muted center">${escapeHtml(thankYouPage.message || "")} (<span data-site-hours>${escapeHtml(siteConfig.site?.hours || "")}</span>)</p><div class="button-row center"><a class="button primary" href="${escapeHtml(thankYouPage.primaryButtonHref || "#home")}">${escapeHtml(thankYouPage.primaryButtonLabel || "")}</a><a class="button outline call-link" data-site-phone-link href="${escapeHtml(siteConfig.site?.phoneHref || "#")}">${escapeHtml(thankYouPage.secondaryButtonLabel || "")}</a></div>`;
  }

  refreshRuntimeCollections();
}

function applySeoConfig(view = "home") {
  const pageSeo = siteConfig.seo?.pages?.[view] || siteConfig.seo?.pages?.home || {};
  const globalSeo = siteConfig.seo?.global || {};
  const title = pageSeo.title || globalSeo.title;
  const description = pageSeo.description || globalSeo.description;
  const ogTitle = pageSeo.ogTitle || globalSeo.ogTitle || title;
  const ogDescription = pageSeo.ogDescription || globalSeo.ogDescription || description;
  const ogImage = pageSeo.ogImage || globalSeo.ogImage || siteConfig.media?.ogImage;
  const canonical = pageSeo.canonical || globalSeo.canonical;

  if (title) document.title = title;
  if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  if (globalSeo.keywords) document.querySelector('meta[name="keywords"]')?.setAttribute("content", globalSeo.keywords);
  if (ogTitle) document.querySelector('meta[property="og:title"]')?.setAttribute("content", ogTitle);
  if (ogDescription) document.querySelector('meta[property="og:description"]')?.setAttribute("content", ogDescription);
  document.querySelector('meta[property="og:image"]')?.setAttribute("content", ogImage || "");
  if (canonical) document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
  if (canonical) document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
}

function loadLocalPublicConfig() {
  try {
    const raw = localStorage.getItem("aquablesk_admin_local_store_v3");
    if (!raw) return;
    const store = JSON.parse(raw);
    if (!store || typeof store !== "object") return;
    mergeSiteConfig({
      settings: undefined,
      site: store.settings?.site,
      messenger: store.settings?.messenger,
      contactMap: store.settings?.contactMap,
      formService: store.settings?.formService,
      reviewCards: store.settings?.reviewCards,
      reviewsIntegration: store.settings?.reviewsIntegration,
      media: store.settings?.media,
      menus: store.settings?.menus,
      seo: store.settings?.seo,
      pages: store.settings?.pages,
      reviews: store.reviews,
      beforeAfter: store.beforeAfter,
      gallery: store.gallery,
    });
  } catch (error) {
    console.warn("Local public config not loaded", error);
  }
}

function renderBeforeAfterCards(items) {
  const wrapper = document.querySelector(".before-after-sliders");
  if (!wrapper || !Array.isArray(items) || !items.length) return;

  wrapper.innerHTML = items
    .filter((item) => item && item.before && item.after)
    .map((item, index) => {
      const start = [52, 48, 58, 44][index % 4];
      const title = escapeHtml(item.title || `Сравнение ${index + 1}`);
      const beforeImage = normalizeMediaUrl(item.before);
      const afterImage = normalizeMediaUrl(item.after);
      const beforeAlt = escapeHtml(item.beforeAlt || `До — ${title}`);
      const afterAlt = escapeHtml(item.afterAlt || `После — ${title}`);
      return `
        <article class="compare-card">
          <p class="center strong">${title}</p>
          <div class="compare-slider" data-start="${start}">
            <img class="compare-base" src="${afterImage}" alt="${afterAlt}">
            <div class="compare-overlay" style="width:${start}%;">
              <img src="${beforeImage}" alt="${beforeAlt}">
            </div>
            <span class="compare-label before">До</span>
            <span class="compare-label after">После</span>
            <div class="compare-divider" style="left:${start}%;"><span></span></div>
            <input class="compare-range" type="range" min="0" max="100" value="${start}" aria-label="Сравнение фото: ${title}">
          </div>
        </article>
      `;
    })
    .join("");

  compareSliders = [...wrapper.querySelectorAll(".compare-slider")];
}

function renderPublicReviews(reviews) {
  if (!reviewTrack || !hasRenderablePublicReviews(reviews)) return;
  reviewTrack.innerHTML = reviews
    .filter((item) => item && item.isPublished !== false && item.isHidden !== true && String(item.text || "").trim())
    .map((item) => {
      const author = escapeHtml(item.author || "\u041a\u043b\u0438\u0435\u043d\u0442");
      const publishedAt = formatReviewPublishedAt(item.date || item.publishedAt || item.createdAt);
      const link = normalizeTargetUrl(item.sourceUrl || item.sourceLink || item.externalUrl || item.link || "#home/reviews", "#home/reviews");
      const buttonLabel = escapeHtml(item.sourceButtonLabel || item.buttonLabel || "\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a");
      const safeText = escapeHtml(item.text || "");
      const isExternalLink = isAbsoluteUrl(link);
      const linkTarget = isExternalLink ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `
        <article class="review-slide">
          <div class="review-slide-head">
            <strong>${author}</strong>
          </div>
          <p>${safeText}</p>
          <div class="review-slide-meta">
            <div class="review-slide-meta-details">
              <span class="review-slide-meta-item">
                <span class="review-slide-meta-label">&#1044;&#1072;&#1090;&#1072; &#1087;&#1091;&#1073;&#1083;&#1080;&#1082;&#1072;&#1094;&#1080;&#1080;</span>
                <span class="review-slide-meta-value">${escapeHtml(publishedAt || "\u0414\u0430\u0442\u0430 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430")}</span>
              </span>
            </div>
            <a class="review-slide-link" href="${escapeHtml(link)}"${linkTarget}>${buttonLabel}</a>
          </div>
        </article>
      `;
    })
    .join("");
}
function renderYandexWidget(widgetUrl) {
  if (!widgetUrl) return;
  const widgetRoot = document.querySelector(".reviews-widget");
  if (!widgetRoot || widgetRoot.querySelector(".yandex-widget-shell")) return;

  const shell = document.createElement("div");
  shell.className = "yandex-widget-shell";
  shell.innerHTML = `
    <p class="eyebrow widget-eyebrow">Отзывы клиентов</p>
    <div class="yandex-widget-frame-shell">
      <iframe
        class="yandex-widget-frame"
        src="${widgetUrl}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Виджет отзывов клиентов"
      ></iframe>
    </div>
  `;
  widgetRoot.appendChild(shell);
}

function renderYandexWidget(widgetUrl) {
  if (!widgetUrl) return;
  const widgetRoot = document.querySelector(".reviews-widget");
  if (!widgetRoot || widgetRoot.querySelector(".yandex-widget-shell")) return;

  const shell = document.createElement("div");
  shell.className = "yandex-widget-shell";
  shell.innerHTML = `
    <p class="eyebrow widget-eyebrow">Отзывы клиентов</p>
    <p class="reviews-widget-note">Официальный блок Яндекс подключен в fallback-режиме: прямой импорт отзывов в кастомный слайдер недоступен.</p>
    <div class="yandex-widget-frame-shell">
      <iframe
        class="yandex-widget-frame"
        src="${widgetUrl}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Виджет отзывов клиентов"
      ></iframe>
    </div>
  `;
  widgetRoot.appendChild(shell);
}

async function loadServerPublicConfig() {
  try {
    const response = await fetch(new URL("api/public/settings", document.baseURI), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return false;
    const payload = await response.json();
    mergeSiteConfig(payload);
    if (Array.isArray(payload.beforeAfter)) {
      renderBeforeAfterCards(payload.beforeAfter);
    }
    return true;
  } catch (error) {
    console.warn("Public backend config not loaded", error);
    return false;
  }
}

async function loadStaticPublicReviews() {
  try {
    const response = await fetch(new URL("assets/public-reviews.json", document.baseURI), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return false;

    const payload = await response.json();
    const reviews = Array.isArray(payload) ? payload : payload?.reviews;
    if (!hasRenderablePublicReviews(reviews)) {
      return false;
    }

    mergeSiteConfig({ reviews });
    return true;
  } catch (error) {
    console.warn("Static public reviews not loaded", error);
    return false;
  }
}

async function loadPublicRuntimeData() {
  await loadServerPublicConfig();

  if (hasRenderablePublicReviews()) {
    return;
  }

  await loadStaticPublicReviews();
}

function initImageLoading() {
  allImages.forEach((image) => {
    image.decoding = "async";

    if (image.closest(".hero-visual")) {
      image.loading = "eager";
      image.fetchPriority = "high";
      return;
    }

    image.loading = "lazy";
  });
}

function closeMenu() {
  if (!mobileMenu || !menuToggle) return;
  mobileMenu.classList.add("is-hidden");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  if (!mobileMenu || !menuToggle) return;
  const open = mobileMenu.classList.toggle("is-hidden");
  menuToggle.setAttribute("aria-expanded", open ? "false" : "true");
}

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { view: "home", section: "hero" };
  if (!hash.includes("/") && LEGACY_HASH_SECTION[hash]) {
    return { view: "home", section: LEGACY_HASH_SECTION[hash] };
  }
  const [view, section] = hash.split("/");
  if (validViews.has(view)) return { view, section: section || "" };
  if (document.getElementById(view)) {
    return { view: "home", section: view };
  }
  return { view: "home", section: view };
}

function setActiveLinks(view, section) {
  const target = view === "home" && section ? `#home/${section}` : `#${view}`;
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === target);
  });
}

function getScrollOffset() {
  const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
  return headerHeight + 18;
}

function scrollToSection(sectionNode, behavior = "smooth") {
  if (!sectionNode) return;
  const targetTop = window.scrollY + sectionNode.getBoundingClientRect().top - getScrollOffset();
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });
}

function parseTargetHash(rawHash) {
  const cleanHash = rawHash.replace(/^#/, "");
  if (!cleanHash) return { view: "home", section: "hero" };
  if (!cleanHash.includes("/") && LEGACY_HASH_SECTION[cleanHash]) {
    return { view: "home", section: LEGACY_HASH_SECTION[cleanHash] };
  }
  const [view, section] = cleanHash.split("/");
  if (validViews.has(view)) {
    return { view, section: section || "" };
  }
  if (document.getElementById(view)) {
    return { view: "home", section: view };
  }
  return { view: "home", section: view };
}

function normalizeHashTarget(rawHash) {
  const { view, section } = parseTargetHash(rawHash);
  return view === "home" && section ? `#home/${section}` : `#${view}`;
}

function ensureAnalyticsIdentity(storageKey) {
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getDeviceType() {
  const width = window.innerWidth || 1280;
  if (width < 760) return "mobile";
  if (width < 1180) return "tablet";
  return "desktop";
}

function buildAnalyticsPath(view, section) {
  if (view === "home" && section) return `/home/${section}`;
  return `/${view || "home"}`;
}

function trackPageView(view, section) {
  const path = buildAnalyticsPath(view, section);
  if (!path || path === lastTrackedPath) return;
  lastTrackedPath = path;
  const payload = {
    event: "page_view",
    path,
    referrer: document.referrer || "",
    visitorId: ensureAnalyticsIdentity(ANALYTICS_VISITOR_KEY),
    sessionId: ensureAnalyticsIdentity(ANALYTICS_SESSION_KEY),
    deviceType: getDeviceType(),
  };
  fetch("/api/analytics/page-view", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

function showView(view, section, options = {}) {
  const { skipSectionScroll = false } = options;
  const current = validViews.has(view) ? view : "home";
  views.forEach((node) => {
    node.classList.toggle("is-hidden", node.dataset.view !== current);
  });
  setActiveLinks(current, section);
  closeMenu();
  applySeoConfig(current);

  requestAnimationFrame(() => {
    syncHeaderVisualState();
    if (current === "home" && section && !skipSectionScroll) {
      const sectionNode = document.getElementById(section);
      if (sectionNode) {
        scrollToSection(sectionNode, "smooth");
        return;
      }
      if (window.location.hash) {
        history.replaceState(null, "", "#home/hero");
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

function syncView() {
  normalizeLegacyHashInLocationBar();
  const { view, section } = parseHash();
  showView(view, section);
  trackPageView(view, section);
}

function syncInitialView() {
  normalizeLegacyHashInLocationBar();
  const { view, section } = parseHash();
  showView(view, section, { skipSectionScroll: view === "home" });
  trackPageView(view, section);
}

function applyPublicConfigAndMedia() {
  applySiteBrandConfig();
  applyMenuConfig();
  applyHomePageBlocks();
  applyAdditionalPageContent();
  refreshRuntimeCollections();
  applySiteContactConfig();
  applyContactMapConfig();
  applyReviewCardConfig();
  if (hasRenderablePublicReviews()) {
    renderPublicReviews(siteConfig.reviews);
  }
  const reviewsIntegration = getNormalizedReviewsIntegration();
  if (reviewsIntegration.yandex.enabled && reviewsIntegration.yandex.widgetUrl) {
    renderYandexWidget(reviewsIntegration.yandex.widgetUrl);
  }
  applyMessengerConfig();
  initImageLoading();
}

window.addEventListener("hashchange", syncView);
window.addEventListener("load", syncInitialView);

if (brandLink) {
  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    const cleanLocation = `${window.location.pathname}${window.location.search}`;
    window.location.assign(cleanLocation);
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest(".nav a, .footer-nav a");
  if (!link) return;
  const href = link.getAttribute("href") || "";
  if (!href.startsWith("#")) return;

  event.preventDefault();
  const targetHash = normalizeHashTarget(href);
  const currentHash = normalizeHashTarget(window.location.hash || "#home");
  const { view, section } = parseTargetHash(targetHash);

  if (currentHash === targetHash) {
    showView(view, section);
    return;
  }

  window.location.hash = targetHash;
});

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("is-visible", window.scrollY >= 280);
  if (siteFooter) {
    const footerRect = siteFooter.getBoundingClientRect();
    const nearFooter = footerRect.top < window.innerHeight + 120;
    scrollTopButton.classList.toggle("is-near-footer", nearFooter);
  }
}

function syncHeaderVisualState() {
  if (!siteHeader) return;
  const heroIsVisible = Boolean(heroSection) && heroSection.offsetParent !== null;
  if (!heroIsVisible) {
    siteHeader.classList.add("is-solid");
    return;
  }

  const shouldSolid = window.scrollY > 8;
  siteHeader.classList.toggle("is-solid", shouldSolid);
}

window.addEventListener("scroll", syncScrollTopButton, { passive: true });
window.addEventListener("load", syncScrollTopButton);
window.addEventListener("scroll", syncHeaderVisualState, { passive: true });
window.addEventListener("load", syncHeaderVisualState);
window.addEventListener("resize", syncHeaderVisualState);

document.addEventListener("click", (event) => {
  const link = event.target.closest(".mobile-nav a");
  if (link) {
    closeMenu();
  }
});

function openOrderModal() {
  if (!orderModal) return;
  orderModal.classList.remove("is-hidden");
  orderModal.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
}

function closeOrderModal() {
  if (!orderModal) return;
  orderModal.classList.add("is-hidden");
  orderModal.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();
}

function isModalOpen(element) {
  return Boolean(element) && !element.classList.contains("is-hidden");
}

function syncBodyScrollLock() {
  document.body.classList.toggle("modal-open", isModalOpen(orderModal));
}

function sanitizeInput(value) {
  return value.replace(/[<>]/g, "").trim();
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeMultilineInput(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLeadPayloadFromForm(form) {
  const formData = new FormData(form);
  return {
    form_name: formData.get("form_name") || "",
    name: sanitizeInput(String(formData.get("name") || "")),
    phone: sanitizeInput(String(formData.get("phone") || "")),
    email: sanitizeInput(String(formData.get("email") || "")),
    service: sanitizeInput(String(formData.get("service") || "")),
    message: sanitizeMultilineInput(String(formData.get("message") || "")),
    page_url: window.location.href,
    page_title: document.title,
    submitted_at: new Date().toISOString(),
  };
}

function createLeadFingerprint(payload) {
  return [
    String(payload.name || "").toLowerCase(),
    String(payload.phone || "").replace(/\D/g, ""),
    String(payload.email || "").toLowerCase(),
    String(payload.service || "").toLowerCase(),
    String(payload.message || "").toLowerCase(),
  ].join("|");
}

function readRecentLeadCache() {
  try {
    const raw = window.localStorage.getItem(FORM_DUPLICATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch (error) {
    return {};
  }
}

function writeRecentLeadCache(cache) {
  try {
    window.localStorage.setItem(FORM_DUPLICATE_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Ignore storage failures for graceful degradation.
  }
}

function hasRecentLeadDuplicate(payload) {
  const cache = readRecentLeadCache();
  const fingerprint = createLeadFingerprint(payload);
  const savedAt = Number(cache[fingerprint] || 0);
  if (!savedAt) return false;
  return Date.now() - savedAt < FORM_DUPLICATE_TTL_MS;
}

function rememberLeadSubmission(payload) {
  const cache = readRecentLeadCache();
  const now = Date.now();
  const freshCache = Object.fromEntries(
    Object.entries(cache).filter(([, savedAt]) => now - Number(savedAt) < FORM_DUPLICATE_TTL_MS),
  );
  freshCache[createLeadFingerprint(payload)] = now;
  writeRecentLeadCache(freshCache);
}

function getFormServiceConfig() {
  return siteConfig.formService || {};
}

function setFormStatus(form, state, message) {
  const statusNode = form.querySelector(".form-status");
  if (!statusNode) return;

  statusNode.className = "form-status";
  if (!message) {
    statusNode.textContent = "";
    return;
  }

  statusNode.textContent = message;
  statusNode.classList.add("is-visible");
  if (state) {
    statusNode.classList.add(`is-${state}`);
  }
}

function setFormLoading(form, isLoading) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
}

async function submitLeadForm(form) {
  const formService = getFormServiceConfig();
  const endpoint = String(formService.endpoint || "").trim();
  const method = String(formService.method || "POST").toUpperCase();
  const accept = formService.accept || "application/json";
  const provider = String(formService.provider || "").trim().toLowerCase();
  const successMessage =
    formService.successMessage || "Ваша заявка принята, ожидайте звонка, мы скоро с вами свяжемся.";
  const loadingMessage = formService.loadingMessage || "Отправляем заявку...";
  const errorMessage =
    formService.errorMessage || "Не удалось отправить заявку. Попробуйте ещё раз позже или свяжитесь с нами по телефону.";
  const missingEndpointMessage =
    formService.missingEndpointMessage || "Форма ещё не подключена к сервису заявок. Укажите endpoint в site-config.js.";
  const redirectHash = formService.redirectHash || "#thank-you";

  if (!endpoint) {
    setFormStatus(form, "error", missingEndpointMessage);
    return false;
  }

  if (form.dataset.submitting === "true") {
    setFormStatus(form, "error", "Заявка уже отправляется. Подождите несколько секунд.");
    return false;
  }

  const lastSubmittedAt = Number(form.dataset.lastSubmittedAt || 0);
  if (lastSubmittedAt && Date.now() - lastSubmittedAt < FORM_COOLDOWN_MS) {
    setFormStatus(form, "error", "Повторная отправка временно недоступна. Подождите и попробуйте ещё раз.");
    return false;
  }

  const formData = new FormData(form);
  const payload = getLeadPayloadFromForm(form);

  if (hasRecentLeadDuplicate(payload)) {
    setFormStatus(form, "error", "Похожая заявка уже была отправлена недавно. Если нужен новый запрос, подождите немного и отправьте снова.");
    return false;
  }

  setFormLoading(form, true);
  setFormStatus(form, "loading", loadingMessage);
  form.dataset.submitting = "true";
  let timeoutId = 0;

  try {
    const controller = new AbortController();
    timeoutId = window.setTimeout(() => controller.abort(), FORM_REQUEST_TIMEOUT_MS);
    const requestOptions =
      provider === "aquablesk-backend" || endpoint === "/api/leads"
        ? {
            method,
            body: JSON.stringify(payload),
            headers: {
              Accept: accept,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        : {
            method,
            body: formData,
            headers: {
              Accept: accept,
            },
            signal: controller.signal,
          };

    const response = await fetch(endpoint, requestOptions);
    window.clearTimeout(timeoutId);

    let responsePayload = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responsePayload = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const providerError =
        responsePayload?.errors?.map((entry) => entry.message).join(" ") ||
        responsePayload?.error ||
        responsePayload?.message ||
        errorMessage;
      throw new Error(providerError);
    }

    setFormStatus(form, "success", successMessage);
    rememberLeadSubmission(payload);
    form.dataset.lastSubmittedAt = String(Date.now());
    form.reset();
    limitedTexts.forEach((field) => {
      const counter = field.parentElement?.querySelector(".js-char-count");
      if (counter) counter.textContent = "0";
    });
    form.dataset.startedAt = String(Date.now());

    window.setTimeout(() => {
      closeOrderModal();
      if (redirectHash) {
        window.location.hash = redirectHash;
      }
    }, 900);

    return true;
  } catch (error) {
    const resolvedMessage =
      error?.name === "AbortError"
        ? "Сервер отвечает слишком долго. Попробуйте ещё раз чуть позже."
        : (error.message || errorMessage);
    setFormStatus(form, "error", resolvedMessage);
    return false;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    form.dataset.submitting = "false";
    setFormLoading(form, false);
  }
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest(".js-open-order-modal");
  if (openButton) {
    openOrderModal();
    return;
  }
  const closeButton = event.target.closest(".js-close-order-modal");
  if (closeButton) {
    closeOrderModal();
  }
});

if (orderModal) {
  orderModal.addEventListener("click", (event) => {
    if (event.target === orderModal) {
      closeOrderModal();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOrderModal();
    closeCookieConsentModal(false);
  }
});

document.addEventListener("focusin", (event) => {
  const form = event.target.closest?.(".js-lead-form");
  if (form && !form.dataset.startedAt) {
    form.dataset.startedAt = String(Date.now());
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches(".js-lead-form")) return;
  event.preventDefault();
  const trackedStartedAt = Number(form.dataset.startedAt || 0);
  const elapsed = trackedStartedAt > 0 ? Date.now() - trackedStartedAt : Number.POSITIVE_INFINITY;
  const honeypot = form.querySelector(".hp-field");
  const nameField = form.querySelector('input[name="name"]');
  const phoneField = form.querySelector('input[name="phone"]');
  const emailField = form.querySelector('input[name="email"]');
  const messageField = form.querySelector('textarea[name="message"]');

  setFormStatus(form, "", "");

  if (honeypot && honeypot.value.trim() !== "") {
    return;
  }

  if (trackedStartedAt > 0 && elapsed < FORM_MIN_FILL_MS) {
    alert("Пожалуйста, заполните форму чуть внимательнее.");
    return;
  }

  if (nameField) {
    nameField.value = sanitizeInput(nameField.value);
    if (nameField.value.length < 2) {
      alert("Укажите имя не короче 2 символов.");
      nameField.focus();
      return;
    }
  }

  if (phoneField) {
    phoneField.value = sanitizeInput(phoneField.value);
    if (!isValidPhone(phoneField.value)) {
      alert("Укажите корректный номер телефона.");
      phoneField.focus();
      return;
    }
  }

  if (emailField) {
    emailField.value = sanitizeInput(emailField.value);
    if (!isValidEmail(emailField.value)) {
      setFormStatus(form, "error", "Укажите корректный e-mail или оставьте поле пустым.");
      emailField.focus();
      return;
    }
  }

  if (messageField) {
    messageField.value = sanitizeInput(messageField.value);
    if (messageField.value.length > 280) {
      alert("Описание не должно превышать 280 символов.");
      messageField.focus();
      return;
    }
  }

  submitLeadForm(form);
});

limitedTexts.forEach((field) => {
  const counter = field.parentElement?.querySelector(".js-char-count");
  const syncCounter = () => {
    if (counter) counter.textContent = String(field.value.length);
  };
  syncCounter();
  field.addEventListener("input", syncCounter);
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".faq-trigger");
  if (!trigger) return;
  const item = trigger.closest(".faq-item");
  if (!item) return;
  const items = [...document.querySelectorAll(".faq-item")];
  const isOpen = item.classList.contains("open");
  items.forEach((entry) => {
    entry.classList.remove("open");
    const button = entry.querySelector(".faq-trigger");
    if (button) button.setAttribute("aria-expanded", "false");
  });
  if (!isOpen) {
    item.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }
});

document.querySelectorAll(".js-year").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

function initCompareSliders() {
  compareSliders.forEach((slider) => {
    if (slider.dataset.bound === "true") return;
    slider.dataset.bound = "true";

    const range = slider.querySelector(".compare-range");
    const overlay = slider.querySelector(".compare-overlay");
    const divider = slider.querySelector(".compare-divider");
    if (!range || !overlay || !divider) return;

    let dragging = false;
    let activePointerId = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let gestureResolved = false;
    let ignorePointer = false;

    const updateSlider = (value) => {
      const numericValue = Math.max(0, Math.min(100, Number(value || 0)));
      const safeValue = `${numericValue}%`;
      overlay.style.width = safeValue;
      divider.style.left = safeValue;
      range.value = String(numericValue);
      range.setAttribute("aria-valuenow", String(numericValue));
    };

    const updateFromClientX = (clientX) => {
      const rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      updateSlider(percent);
    };

    const stopDragging = () => {
      dragging = false;
      activePointerId = null;
      gestureResolved = false;
      ignorePointer = false;
      slider.classList.remove("is-dragging");
    };

    slider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType !== "touch") return;
      activePointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      gestureResolved = event.pointerType !== "touch";
      ignorePointer = false;

      if (event.pointerType !== "touch") {
        dragging = true;
        slider.classList.add("is-dragging");
        if (slider.setPointerCapture) {
          slider.setPointerCapture(event.pointerId);
        }
        updateFromClientX(event.clientX);
      }
    });

    slider.addEventListener("pointermove", (event) => {
      if (activePointerId !== event.pointerId) return;

      if (!gestureResolved && event.pointerType === "touch") {
        const deltaX = Math.abs(event.clientX - pointerStartX);
        const deltaY = Math.abs(event.clientY - pointerStartY);
        const activationThreshold = 10;

        if (deltaX < activationThreshold && deltaY < activationThreshold) {
          return;
        }

        gestureResolved = true;
        if (deltaY > deltaX) {
          ignorePointer = true;
          stopDragging();
          return;
        }

        dragging = true;
        slider.classList.add("is-dragging");
        if (slider.setPointerCapture) {
          slider.setPointerCapture(event.pointerId);
        }
      }

      if (ignorePointer || !dragging) return;
      updateFromClientX(event.clientX);
    });

    slider.addEventListener("pointerup", stopDragging);
    slider.addEventListener("pointercancel", stopDragging);
    slider.addEventListener("lostpointercapture", stopDragging);
    range.addEventListener("input", () => updateSlider(range.value));
    range.addEventListener("change", () => updateSlider(range.value));

    updateSlider(range.value || slider.dataset.start || 50);
  });
}

function observeDynamicCompareSliders() {
  const projectsRoot = document.querySelector("#projects .before-after-sliders") || document.querySelector(".before-after-sliders");
  if (!projectsRoot || projectsRoot.dataset.compareObserverBound === "true") return;
  projectsRoot.dataset.compareObserverBound = "true";

  const observer = new MutationObserver(() => {
    compareSliders = [...document.querySelectorAll(".compare-slider")];
    initCompareSliders();
  });

  observer.observe(projectsRoot, { childList: true, subtree: true });
}

function initReviewSlider() {
  if (!reviewTrack || reviewSliderBound) return;
  reviewSliderBound = true;

  const getRawMaxScroll = () => Math.max(0, reviewTrack.scrollWidth - reviewTrack.clientWidth);

  const getMaxScroll = () => {
    const lastCard = reviewTrack.querySelector(".review-slide:last-of-type");
    if (!lastCard) return getRawMaxScroll();
    const lastCardStart = Math.max(0, lastCard.offsetLeft - reviewTrack.offsetLeft);
    return Math.min(getRawMaxScroll(), lastCardStart);
  };

  const getStep = () => {
    const firstCard = reviewTrack.querySelector(".review-slide");
    if (!firstCard) return REVIEW_SLIDER_FALLBACK_STEP_PX;
    const styles = window.getComputedStyle(reviewTrack);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || String(REVIEW_SLIDER_DEFAULT_GAP_PX)) || REVIEW_SLIDER_DEFAULT_GAP_PX;
    return firstCard.getBoundingClientRect().width + gap;
  };

  const syncReviewNavState = () => {
    const maxScroll = getMaxScroll();
    const canScrollPrev = reviewTrack.scrollLeft > REVIEW_SLIDER_EDGE_TOLERANCE_PX;
    const canScrollNext = reviewTrack.scrollLeft < maxScroll - REVIEW_SLIDER_EDGE_TOLERANCE_PX;

    const applyState = (button, isActive) => {
      if (!button) return;
      button.disabled = !isActive;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-inactive", !isActive);
      button.setAttribute("aria-disabled", isActive ? "false" : "true");
      button.tabIndex = isActive ? 0 : -1;
    };

    applyState(reviewPrev, canScrollPrev);
    applyState(reviewNext, canScrollNext);
  };

  const slideReviews = (direction) => {
    const maxScroll = getMaxScroll();
    const step = getStep();
    let nextScroll = reviewTrack.scrollLeft + (step * direction);

    if (direction > 0 && maxScroll - nextScroll < step * REVIEW_SLIDER_END_SNAP_FACTOR) {
      nextScroll = maxScroll;
    }

    nextScroll = Math.max(0, Math.min(maxScroll, nextScroll));

    reviewTrack.scrollTo({
      left: nextScroll,
      behavior: "smooth",
    });
  };

  if (reviewPrev) {
    reviewPrev.addEventListener("click", () => {
      if (reviewPrev.disabled) return;
      slideReviews(-1);
    });
  }

  if (reviewNext) {
    reviewNext.addEventListener("click", () => {
      if (reviewNext.disabled) return;
      slideReviews(1);
    });
  }

  let isDragging = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let touchGestureResolved = false;
  let ignorePointer = false;

  const releasePointerCapture = (pointerId) => {
    if (pointerId === null || !reviewTrack.releasePointerCapture) return;
    if (reviewTrack.hasPointerCapture?.(pointerId)) {
      reviewTrack.releasePointerCapture(pointerId);
    }
  };

  const beginDragging = (event) => {
    isDragging = true;
    reviewTrack.classList.add("is-dragging");
    if (reviewTrack.setPointerCapture) {
      reviewTrack.setPointerCapture(event.pointerId);
    }
  };

  const stopDragging = (event) => {
    releasePointerCapture(event?.pointerId ?? activePointerId);
    isDragging = false;
    activePointerId = null;
    touchGestureResolved = false;
    ignorePointer = false;
    reviewTrack.classList.remove("is-dragging");
    syncReviewNavState();
  };

  reviewTrack.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = reviewTrack.scrollLeft;
    touchGestureResolved = event.pointerType !== "touch";
    ignorePointer = false;

    if (event.pointerType !== "touch") {
      beginDragging(event);
    }
  });

  reviewTrack.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId || ignorePointer) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!touchGestureResolved && event.pointerType === "touch") {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX < REVIEW_SLIDER_GESTURE_THRESHOLD_PX && absDeltaY < REVIEW_SLIDER_GESTURE_THRESHOLD_PX) {
        return;
      }

      touchGestureResolved = true;
      if (absDeltaY > absDeltaX) {
        ignorePointer = true;
        activePointerId = null;
        reviewTrack.classList.remove("is-dragging");
        syncReviewNavState();
        return;
      }

      beginDragging(event);
    }

    if (!isDragging) return;
    reviewTrack.scrollLeft = Math.max(0, Math.min(getMaxScroll(), startScrollLeft - deltaX));
    syncReviewNavState();
  });

  reviewTrack.addEventListener("pointerup", stopDragging);
  reviewTrack.addEventListener("pointercancel", stopDragging);
  reviewTrack.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") stopDragging(event);
  });
  reviewTrack.addEventListener("scroll", syncReviewNavState, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(syncReviewNavState));
  window.addEventListener("load", () => requestAnimationFrame(syncReviewNavState), { once: true });
  requestAnimationFrame(syncReviewNavState);
}

loadLocalPublicConfig();

loadPublicRuntimeData().finally(() => {
  applyPublicConfigAndMedia();
  initCompareSliders();
  observeDynamicCompareSliders();
  initReviewSlider();
});

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (revealSections.length || revealItems.length) {
  if (reduceMotionQuery.matches) {
    revealSections.forEach((section) => section.classList.add("is-visible"));
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (entry.target.classList.contains("js-reveal-section")) {
            entry.target
              .querySelectorAll(".reveal-up")
              .forEach((item) => item.classList.add("is-visible"));
          }
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    revealSections.forEach((section) => revealObserver.observe(section));
    revealItems.forEach((item) => {
      if (!item.closest(".js-reveal-section")) {
        revealObserver.observe(item);
      }
    });
  }
}

let parallaxFrame = 0;

function syncParallaxPanels() {
  if (reduceMotionQuery.matches || !parallaxPanels.length) return;
  const viewportHeight = window.innerHeight || 1;
  parallaxPanels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
    const limitedOffset = Math.max(-14, Math.min(14, centerOffset * -0.035));
    panel.style.setProperty("--parallax-offset", `${limitedOffset}px`);
  });
}

function scheduleParallaxSync() {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(() => {
    parallaxFrame = 0;
    syncParallaxPanels();
  });
}

if (parallaxPanels.length) {
  syncParallaxPanels();
  window.addEventListener("scroll", scheduleParallaxSync, { passive: true });
  window.addEventListener("resize", scheduleParallaxSync);
}

function bindPremiumCardEffects(cards, { tilt = false } = {}) {
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!cards.length || reduceMotionQuery.matches || !finePointerQuery.matches) return;

  const resetCard = (card) => {
    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
    card.style.setProperty("--fx-x", "50%");
    card.style.setProperty("--fx-y", "50%");
    if (tilt) {
      card.style.setProperty("--fx-tilt-x", "0deg");
      card.style.setProperty("--fx-tilt-y", "0deg");
    }
  };

  cards.forEach((card) => {
    resetCard(card);

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      card.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);
      card.style.setProperty("--fx-x", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--fx-y", `${(y * 100).toFixed(2)}%`);

      if (tilt) {
        const tiltX = (0.5 - y) * 2.2;
        const tiltY = (x - 0.5) * 2.6;
        card.style.setProperty("--fx-tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--fx-tilt-y", `${tiltY.toFixed(2)}deg`);
      }
    });

    card.addEventListener("pointerleave", () => resetCard(card));
  });
}

bindPremiumCardEffects(formatCards, { tilt: true });
bindPremiumCardEffects(interactiveCards);

function openCookieConsentModal() {
  if (!cookieConsentModal) return;
  cookieConsentModal.classList.remove("is-hidden");
  cookieConsentModal.setAttribute("aria-hidden", "false");
}

function closeCookieConsentModal(remember = false) {
  if (!cookieConsentModal) return;
  cookieConsentModal.classList.add("is-hidden");
  cookieConsentModal.setAttribute("aria-hidden", "true");
}

function initCookieConsentModal() {
  if (!cookieConsentModal) return;

  openCookieConsentModal();

  if (cookieAcceptButton && !cookieAcceptButton.dataset.cookieBound) {
    cookieAcceptButton.dataset.cookieBound = "true";
    cookieAcceptButton.addEventListener("click", () => {
      closeCookieConsentModal(false);
    });
  }

  cookieCloseButtons.forEach((button) => {
    if (button.dataset.cookieBound) return;
    button.dataset.cookieBound = "true";
    button.addEventListener("click", () => {
      closeCookieConsentModal(false);
    });
  });

  cookieConsentLinks.forEach((link) => {
    if (link.dataset.cookieBound) return;
    link.dataset.cookieBound = "true";
    link.addEventListener("click", () => {
      closeCookieConsentModal(false);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCookieConsentModal, { once: true });
} else {
  initCookieConsentModal();
}
