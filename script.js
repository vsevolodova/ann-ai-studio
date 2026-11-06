/* =========================================================
   ANN — интерактивность сайта
   Скрипт написан без библиотек: только DOM и немного магии.
   ========================================================= */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------- Шапка при скролле ---------- */

  const header = $("#siteHeader");
  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Мобильное меню ---------- */

  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");

  const closeMenu = () => {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (!navLinks.classList.contains("is-open")) return;
      if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  /* ---------- Плавное появление блоков ---------- */

  const revealItems = $$("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -55px 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------- Счётчики ---------- */

  const counters = $$("[data-count]");

  const animateCounter = (element) => {
    const target = Number.parseInt(element.dataset.count, 10);
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }

    const duration = 1200;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            counters.forEach(animateCounter);
            observer.disconnect();
          });
        },
        { threshold: 0.35 }
      );

      const statsBlock = $(".stats");
      if (statsBlock) counterObserver.observe(statsBlock);
    }
  }

  /* ---------- 30 частиц на фоне ---------- */

  const particlesLayer = $("#particles");

  if (particlesLayer && !reduceMotion) {
    const colors = [
      "rgba(38, 109, 164, 0.42)",
      "rgba(63, 192, 238, 0.46)",
      "rgba(124, 92, 255, 0.3)",
      "rgba(32, 199, 177, 0.34)",
    ];

    for (let index = 0; index < 30; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.setProperty("--size", `${2 + Math.random() * 3}px`);
      particle.style.setProperty("--duration", `${13 + Math.random() * 15}s`);
      particle.style.setProperty("--delay", `${-Math.random() * 24}s`);
      particle.style.setProperty("--drift", `${-46 + Math.random() * 92}px`);
      particle.style.setProperty("--color", colors[index % colors.length]);
      particlesLayer.appendChild(particle);
    }
  }

  /* ---------- Параллакс hero-визуала ---------- */

  const heroStage = $(".hero-stage");

  if (heroStage && finePointer && !reduceMotion) {
    heroStage.addEventListener("pointermove", (event) => {
      const rect = heroStage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      heroStage.style.setProperty("--mx", x.toFixed(3));
      heroStage.style.setProperty("--my", y.toFixed(3));
    });

    heroStage.addEventListener("pointerleave", () => {
      heroStage.style.setProperty("--mx", "0");
      heroStage.style.setProperty("--my", "0");
    });
  }

  /* ---------- Лёгкий 3D-наклон карточек ---------- */

  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--rx");
        card.style.removeProperty("--ry");
      });
    });
  }

  /* ---------- Поиск и фильтр кейсов ---------- */

  const searchInput = $("#caseSearch");
  const clearSearch = $("#clearSearch");
  const caseItems = $$("[data-case-item]");
  const tagPills = $$(".tag-pill");
  const visibleCount = $("#visibleCount");
  const countLabel = $("#countLabel");
  const emptyState = $("#emptyState");
  const resetFilters = $("#resetFilters");

  let activeTag = "Все";

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .trim();

  const pluralCases = (number) => {
    const lastTwo = number % 100;
    const lastOne = number % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "кейсов";
    if (lastOne === 1) return "кейс";
    if (lastOne >= 2 && lastOne <= 4) return "кейса";
    return "кейсов";
  };

  const applyFilters = () => {
    const query = normalize(searchInput ? searchInput.value : "");
    let shown = 0;

    caseItems.forEach((item) => {
      const searchText = normalize(item.dataset.search);
      const tags = String(item.dataset.tags || "").split("|");
      const matchesQuery = !query || searchText.includes(query);
      const matchesTag = activeTag === "Все" || tags.includes(activeTag);
      const isShown = matchesQuery && matchesTag;

      item.hidden = !isShown;
      if (isShown) shown += 1;
    });

    if (visibleCount) visibleCount.textContent = String(shown);
    if (countLabel) countLabel.textContent = pluralCases(shown);
    if (emptyState) emptyState.hidden = shown !== 0;
    if (clearSearch) clearSearch.hidden = !searchInput || !searchInput.value;
  };

  const setTag = (tag) => {
    activeTag = tag;
    tagPills.forEach((pill) => {
      const isActive = pill.dataset.tag === tag;
      pill.classList.toggle("is-active", isActive);
      pill.setAttribute("aria-pressed", String(isActive));
    });
    applyFilters();
  };

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);

    document.addEventListener("keydown", (event) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.focus();
      }
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      if (!searchInput) return;
      searchInput.value = "";
      searchInput.focus();
      applyFilters();
    });
  }

  tagPills.forEach((pill) => {
    pill.addEventListener("click", () => setTag(pill.dataset.tag));
  });

  document.addEventListener("click", (event) => {
    const miniTag = event.target.closest("[data-filter-tag]");
    if (!miniTag) return;

    setTag(miniTag.dataset.filterTag);

    const toolbar = $(".cases-toolbar");
    if (toolbar) {
      toolbar.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  });

  if (resetFilters) {
    resetFilters.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      setTag("Все");
      if (searchInput) searchInput.focus();
    });
  }

  applyFilters();

  /* ---------- Модальное окно кейса ---------- */

  const dialog = $("#caseDialog");
  const modalShell = $("#modalShell");
  const casesDataElement = $("#casesData");

  let cases = [];
  try {
    cases = JSON.parse(casesDataElement ? casesDataElement.textContent : "[]");
  } catch (error) {
    cases = [];
  }

  const caseMap = new Map(cases.map((item) => [item.slug, item]));

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return entities[character];
    });

  const listHtml = (items = []) =>
    items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const tagsHtml = (tags = []) =>
    tags.map((tag) => `<span class="modal-tag">#${escapeHtml(tag)}</span>`).join("");

  const metricsHtml = (metrics = []) =>
    metrics
      .map(
        (metric) => `
          <div class="modal-metric">
            <strong>${escapeHtml(metric.value)}</strong>
            <span>${escapeHtml(metric.label)}</span>
          </div>`
      )
      .join("");

  const stackHtml = (stack = []) =>
    stack.map((item) => `<span class="modal-stack">${escapeHtml(item)}</span>`).join("");

  const openCase = (slug, updateHash = true) => {
    const item = caseMap.get(slug);
    if (!item || !dialog || !modalShell) return;

    const details = item.details || {};

    modalShell.innerHTML = `
      <div class="modal-hero">
        <button class="modal-close" type="button" data-close-modal aria-label="Закрыть окно">×</button>
        <div class="modal-kicker">Кейс ${escapeHtml(item.number)} · ${escapeHtml(item.category)}</div>
        <h2 class="modal-title" id="caseModalTitle">${escapeHtml(item.title)}</h2>
        <p class="modal-summary">${escapeHtml(item.summary)}</p>
        <div class="modal-tags">${tagsHtml(item.tags)}</div>
      </div>

      <div class="modal-body">
        <div class="modal-metrics">${metricsHtml(item.metrics)}</div>

        <section class="modal-section">
          <h3>Контекст</h3>
          <p>${escapeHtml(details.intro || item.summary)}</p>
        </section>

        <div class="modal-columns">
          <section class="modal-section">
            <h3>Задача</h3>
            <ul class="modal-list">${listHtml(details.challenge)}</ul>
          </section>
          <section class="modal-section">
            <h3>Что сделали</h3>
            <ul class="modal-list">${listHtml(details.actions)}</ul>
          </section>
        </div>

        <section class="modal-section">
          <h3>Результат</h3>
          <p>${escapeHtml(item.result)}</p>
        </section>

        <div class="modal-meta">
          <div class="modal-meta-group">
            <span class="modal-meta-label">Стек</span>
            ${stackHtml(details.stack)}
          </div>
          <div class="modal-meta-group">
            <span class="modal-meta-label">Срок</span>
            <span class="modal-timeline">${escapeHtml(details.timeline || "по задаче")}</span>
          </div>
        </div>

        <blockquote class="modal-quote">
          <p>«${escapeHtml(details.quote || "")}»</p>
          <cite>${escapeHtml(details.author || "")}</cite>
        </blockquote>

        <div class="modal-footer">
          <a class="btn btn--primary modal-cta" href="#contact">
            Хочу похожий проект
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </a>
          <button class="btn btn--glass" type="button" data-close-modal>Закрыть</button>
          <span class="modal-footer-note">Расскажу, как это может работать в вашей нише.</span>
        </div>
      </div>
    `;

    if (!dialog.open) dialog.showModal();
    document.body.classList.add("modal-open");
    modalShell.scrollTop = 0;

    if (updateHash) {
      history.replaceState(null, "", `#case-${slug}`);
    }
  };

  const closeCase = () => {
    if (dialog && dialog.open) dialog.close();
  };

  document.addEventListener("click", (event) => {
    const caseLink = event.target.closest("[data-case-link]");
    if (!caseLink) return;
    event.preventDefault();
    openCase(caseLink.dataset.caseLink);
  });

  if (dialog) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeCase();
        return;
      }

      const closeButton = event.target.closest("[data-close-modal]");
      if (closeButton) {
        closeCase();
        return;
      }

      const contactButton = event.target.closest(".modal-cta");
      if (contactButton) {
        event.preventDefault();
        closeCase();

        window.requestAnimationFrame(() => {
          const contactSection = $("#contact");
          if (contactSection) {
            contactSection.scrollIntoView({
              behavior: reduceMotion ? "auto" : "smooth",
              block: "start",
            });
          }
          history.replaceState(null, "", "#contact");
        });
      }
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (window.location.hash.startsWith("#case-")) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });
  }

  /* Если страницу открыли по прямой ссылке на кейс — показываем его. */
  if (window.location.hash.startsWith("#case-")) {
    const slug = window.location.hash.replace("#case-", "");
    if (caseMap.has(slug)) {
      openCase(slug, false);
    }
  }
})();
