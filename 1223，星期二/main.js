import { links, profile, resume, works } from "./content.js";

const state = {
  modalIndex: 0,
  isModalOpen: false,
  lastFocusedElement: null
};

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setLink(id, href) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!href) {
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("tabindex", "-1");
    el.classList.add("is-disabled");
    el.href = "#";
    return;
  }
  el.removeAttribute("aria-disabled");
  el.removeAttribute("tabindex");
  el.classList.remove("is-disabled");
  el.href = href;
}

function mountProfile() {
  setText("profileName", profile.name);
  setText("footerName", profile.name);
  setText("profileBio", profile.bio);
  setText("profileNameInline", profile.name);

  const avatar = $("#profileAvatar");
  if (avatar) {
    avatar.decoding = "async";
    avatar.loading = "eager";
    avatar.referrerPolicy = "no-referrer";
    avatar.src = buildAvatarUrl(getStableSeed("jp_avatar_seed", profile.avatarSeed || profile.name || "user"));
  }

  const xhsBtn = $("#xhsCta");
  if (xhsBtn && profile.xiaohongshuUrl) xhsBtn.setAttribute("href", profile.xiaohongshuUrl);

  setLink("resumeDownload", resume.pdfUrl || profile.resumePdfUrl);
  setLink("resumeOnline", resume.onlineUrl || profile.resumeOnlineUrl || resume.pdfUrl || profile.resumePdfUrl);

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function mountResume() {
  const wrap = $("#resumeEmbedWrap");
  if (!wrap) return;

  if (resume.pdfUrl) {
    wrap.innerHTML = `<iframe class="resume__iframe" title="简历" src="${escapeAttr(resume.pdfUrl)}"></iframe>`;
    return;
  }

  const basics = resume.basics || {};
  const edu = Array.isArray(resume.education) ? resume.education : [];
  const exp = Array.isArray(resume.experience) ? resume.experience : [];

  wrap.innerHTML = `
    <div class="resume-card">
      <div class="resume-card__top">
        <div>
          <div class="resume-card__name">${escapeHtml(basics.name || "")}</div>
          <div class="resume-card__meta">
            <span>年龄：${escapeHtml(basics.age || "")}</span>
            <span>民族：${escapeHtml(basics.ethnicity || "")}</span>
            <span>学历：${escapeHtml(basics.education || "")}</span>
            <span>籍贯：${escapeHtml(basics.hometown || "")}</span>
          </div>
        </div>
        <div class="resume-card__contact">
          <div>电话：${escapeHtml(basics.phone || "")}</div>
          <div>邮箱：${escapeHtml(basics.email || "")}</div>
        </div>
      </div>

      <div class="resume-card__section">
        <div class="resume-card__section-title">教育背景</div>
        <div class="resume-card__section-body">
          ${
            edu.length
              ? edu
                  .map(
                    (e) => `
                      <div class="resume-row">
                        <div class="resume-row__time">${escapeHtml(e.start || "")}–${escapeHtml(e.end || "")}</div>
                        <div class="resume-row__main">
                          <div class="resume-row__headline">
                            <span class="resume-row__strong">${escapeHtml(e.school || "")}</span>
                            <span class="resume-row__weak">${escapeHtml(e.major || "")}</span>
                          </div>
                        </div>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="resume-empty">暂未填写</div>`
          }
        </div>
      </div>

      <div class="resume-card__section">
        <div class="resume-card__section-title">工作经历</div>
        <div class="resume-card__section-body">
          ${
            exp.length
              ? exp
                  .map((e) => {
                    const bullets = Array.isArray(e.bullets) ? e.bullets : [];
                    return `
                      <div class="resume-row">
                        <div class="resume-row__time">${escapeHtml(e.start || "")}–${escapeHtml(e.end || "")}</div>
                        <div class="resume-row__main">
                          <div class="resume-row__headline">
                            <span class="resume-row__strong">${escapeHtml(e.company || "")}</span>
                            <span class="resume-row__weak">${escapeHtml(e.title || "")}</span>
                          </div>
                          <div class="resume-row__summary">${escapeHtml(e.summary || "")}</div>
                          ${
                            bullets.length
                              ? `<ul class="resume-bullets">${bullets
                                  .map((b) => `<li>${escapeHtml(b)}</li>`)
                                  .join("")}</ul>`
                              : ""
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="resume-empty">暂未填写</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function mountWorks() {
  const grid = $("#worksGrid");
  if (!grid) return;

  grid.innerHTML = works
    .map(
      (w, idx) => `
        <article class="work-card reveal" tabindex="0" role="button" aria-label="打开作品：${escapeHtml(w.title)}" data-work-index="${idx}">
          <div class="work-card__media">
            <img alt="${escapeAttr(w.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${escapeAttr(buildWorkPhotoUrl(w, idx))}" />
          </div>
          <div class="work-card__body">
            <h3 class="work-card__title">${escapeHtml(w.title)}</h3>
            <div class="work-card__meta">
              <span>${escapeHtml(w.tag)}</span>
              <span>${escapeHtml(w.year)}</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-work-index]");
    if (!card) return;
    const idx = Number(card.getAttribute("data-work-index"));
    openModal(idx);
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("[data-work-index]");
    if (!card) return;
    e.preventDefault();
    const idx = Number(card.getAttribute("data-work-index"));
    openModal(idx);
  });
}

function mountLinks() {
  const grid = $("#linksGrid");
  if (!grid) return;

  const computed = links.map((l) => {
    if (l.name === "小红书" && profile.xiaohongshuUrl) return { ...l, url: profile.xiaohongshuUrl };
    return l;
  });

  grid.innerHTML = computed
    .map(
      (l) => `
        <a class="link-card reveal" href="${escapeAttr(l.url)}" target="_blank" rel="noreferrer">
          <div class="link-card__top">
            <div class="link-card__name">${escapeHtml(l.name)}</div>
            <div class="link-card__icon" aria-hidden="true">${linkIconSvg(l.name)}</div>
          </div>
          <p class="link-card__hint">${escapeHtml(l.hint || "")}</p>
        </a>
      `
    )
    .join("");
}

function linkIconSvg(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("小红书") || n.includes("red")) {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M7 8.5c0-1.38 1.12-2.5 2.5-2.5h5C15.88 6 17 7.12 17 8.5V15c0 1.66-1.34 3-3 3H10c-1.66 0-3-1.34-3-3V8.5Z" stroke="currentColor" stroke-width="1.8"/><path d="M9 11h6M9 14h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }
  if (n.includes("mail") || n.includes("邮箱")) {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" stroke-width="1.8"/><path d="m6.5 8 5.5 4 5.5-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10a4 4 0 0 0-5.66 0L5.5 12.83a4 4 0 1 0 5.66 5.66L12 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

function mountNav() {
  const navList = $("#navList");
  const slider = $("#navSlider");
  const items = $all(".nav__item", navList).filter((li) => !li.classList.contains("nav__item--button"));

  function moveSliderTo(li) {
    if (!slider) return;
    const link = li.querySelector(".nav__link");
    if (!link) return;
    const r = link.getBoundingClientRect();
    const parentR = navList.getBoundingClientRect();
    const width = Math.max(76, r.width + 30);
    const x = r.left - parentR.left + (r.width - width) / 2;
    slider.style.width = `${width}px`;
    slider.style.setProperty("--slider-x", `${x}px`);
  }

  function setActiveByHash(hash) {
    const h = hash || "#home";
    items.forEach((li) => li.classList.remove("is-active"));
    const target = items.find((li) => li.querySelector(".nav__link")?.getAttribute("href") === h) || items[0];
    if (target) target.classList.add("is-active");
    if (target) moveSliderTo(target);
  }

  function observeSections() {
    const sectionIds = ["home", "works", "resume", "links"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setActiveByHash(`#${visible.target.id}`);
      },
      { root: null, threshold: [0.2, 0.35, 0.5, 0.65] }
    );
    sections.forEach((s) => io.observe(s));
  }

  items.forEach((li) => {
    li.addEventListener("mouseenter", () => moveSliderTo(li));
  });

  window.addEventListener("hashchange", () => setActiveByHash(location.hash));

  setActiveByHash(location.hash);
  requestAnimationFrame(() => setActiveByHash(location.hash));
  observeSections();

  const toggle = $("#navToggle");
  const btn = $(".nav__toggle");
  const mobileList = $("#navListMobile");
  if (toggle && btn && mobileList) {
    btn.addEventListener("click", () => {
      const nextOpen = mobileList.hasAttribute("hidden");
      if (nextOpen) mobileList.removeAttribute("hidden");
      else mobileList.setAttribute("hidden", "true");
      btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      btn.setAttribute("aria-label", nextOpen ? "关闭菜单" : "打开菜单");
    });

    mobileList.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      mobileList.setAttribute("hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "打开菜单");
    });
  }
}

function mountSmoothScroll() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", href);
  });
}

function mountReveal() {
  const els = $all(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}

function openModal(index) {
  const modal = $("#modal");
  if (!modal) return;
  state.modalIndex = clamp(index, 0, works.length - 1);
  state.isModalOpen = true;
  state.lastFocusedElement = document.activeElement;
  renderModal();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  $("button[data-close='true']", modal)?.focus();
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = $("#modal");
  if (!modal) return;
  state.isModalOpen = false;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  const last = state.lastFocusedElement;
  if (last && typeof last.focus === "function") last.focus();
}

function renderModal() {
  const w = works[state.modalIndex];
  if (!w) return;
  setText("modalTitle", w.title);
  setText("modalDesc", `${w.year} · ${w.tag} · ${w.description}`);
  const media = $("#modalMedia");
  if (media) {
    media.innerHTML = `<img alt="${escapeAttr(w.title)}" decoding="async" referrerpolicy="no-referrer" src="${escapeAttr(buildWorkPhotoUrl(w, state.modalIndex, true))}" />`;
  }
}

function mountModal() {
  const modal = $("#modal");
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close='true']");
    if (close) closeModal();
  });

  $("#modalPrev")?.addEventListener("click", () => navigateModal(-1));
  $("#modalNext")?.addEventListener("click", () => navigateModal(1));

  document.addEventListener("keydown", (e) => {
    if (!state.isModalOpen) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") navigateModal(-1);
    if (e.key === "ArrowRight") navigateModal(1);
    if (e.key === "Tab") trapFocus(modal, e);
  });
}

function trapFocus(modal, e) {
  const focusable = $all(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    modal
  ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function navigateModal(delta) {
  state.modalIndex = clamp(state.modalIndex + delta, 0, works.length - 1);
  renderModal();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

function hideLoader() {
  const loading = $("#loading");
  if (!loading) return;
  requestAnimationFrame(() => {
    loading.classList.add("is-hidden");
    setTimeout(() => loading.remove(), 420);
  });
}

function init() {
  mountProfile();
  mountWorks();
  mountLinks();
  mountResume();
  mountNav();
  mountSmoothScroll();
  mountReveal();
  mountModal();
  hideLoader();
}

function getStableSeed(storageKey, fallback) {
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const seed = `${fallback}-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    localStorage.setItem(storageKey, seed);
    return seed;
  } catch {
    return String(fallback || "seed");
  }
}

function buildAvatarUrl(seed) {
  const s = encodeURIComponent(String(seed));
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}&backgroundType=gradientLinear&backgroundColor=b6e3f4,d1d4f9,ffd5dc&radius=50&accessoriesProbability=0&facialHairProbability=0`;
}

function buildWorkPhotoUrl(work, index, isModal = false) {
  const baseSeed = getStableSeed("jp_photo_seed", profile.name || "photo");
  const type = String(work?.photoType || work?.tag || "").toLowerCase();
  const keywords = type.includes("street") || type.includes("街头") || type.includes("胶片")
    ? "street,city"
    : type.includes("travel") || type.includes("旅行") || type.includes("日常")
      ? "travel,urban"
      : "landscape,nature";
  const size = isModal ? { w: 1400, h: 950 } : { w: 900, h: 675 };
  const lock = hashToNumber(`${baseSeed}-${index}-${keywords}`);
  return `https://loremflickr.com/${size.w}/${size.h}/${keywords}?lock=${lock}`;
}

function hashToNumber(input) {
  const str = String(input ?? "");
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
