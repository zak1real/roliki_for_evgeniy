const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Шапка: фон при прокрутке и меню на телефоне ---------- */

const header = document.querySelector("[data-header]");
const burger = document.querySelector("[data-burger]");

if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
}

if (header && burger) {
    const setMenu = (open) => {
        header.classList.toggle("nav-open", open);
        burger.setAttribute("aria-expanded", String(open));
    };
    burger.addEventListener("click", () => setMenu(!header.classList.contains("nav-open")));
    header.querySelectorAll(".nav a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
    });
}

/* ---------- Появление блоков и счётчики ---------- */

const revealItems = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");

function runCounter(el) {
    const target = Number(el.dataset.count);
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("is-in"));
} else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealItems.forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
        });
    }, { threshold: 0.6 });
    counters.forEach((el) => {
        el.textContent = "0";
        counterObserver.observe(el);
    });
}

/* ---------- Видео на первом экране ---------- */

const video = document.querySelector("[data-hero-video]");
const videoToggle = document.querySelector("[data-video-toggle]");
const videoSound = document.querySelector("[data-video-sound]");

if (video) {
    const frame = video.closest(".video-frame");
    const syncState = () => {
        frame.classList.toggle("is-paused", video.paused);
        frame.classList.toggle("has-sound", !video.muted);
        videoToggle?.setAttribute("aria-label", video.paused ? "Смотреть видео" : "Пауза");
        videoSound?.setAttribute("aria-label", video.muted ? "Включить звук" : "Выключить звук");
    };

    // Тем, кто отключил анимации в системе, видео само не запускается
    if (reducedMotion) video.pause();

    video.addEventListener("play", syncState);
    video.addEventListener("pause", syncState);
    video.addEventListener("volumechange", syncState);
    syncState();

    videoToggle?.addEventListener("click", () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
    });
    videoSound?.addEventListener("click", () => {
        video.muted = !video.muted;
        if (!video.muted && video.paused) video.play().catch(() => {});
    });
}

/* ---------- Просмотр фото ---------- */

const lightbox = document.querySelector("[data-lightbox]");
const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];

if (lightbox && galleryItems.length && typeof lightbox.showModal === "function") {
    const img = lightbox.querySelector("[data-lightbox-img]");
    const caption = lightbox.querySelector("[data-lightbox-caption]");
    let current = 0;

    const show = (index) => {
        current = (index + galleryItems.length) % galleryItems.length;
        const source = galleryItems[current].querySelector("img");
        img.src = source.currentSrc || source.src;
        img.alt = source.alt;
        caption.textContent = source.alt;
        // Перезапуск анимации появления при листании
        img.style.animation = "none";
        void img.offsetWidth;
        img.style.animation = "";
    };

    galleryItems.forEach((item, index) => item.addEventListener("click", () => {
        show(index);
        lightbox.showModal();
    }));

    lightbox.querySelectorAll("[data-lightbox-step]").forEach((btn) => {
        btn.addEventListener("click", () => show(current + Number(btn.dataset.lightboxStep)));
    });
    lightbox.querySelector("[data-lightbox-close]").addEventListener("click", () => lightbox.close());

    // Клик по затемнению вокруг фото закрывает просмотр
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox || event.target.tagName === "FIGURE") lightbox.close();
    });
    lightbox.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") show(current + 1);
        if (event.key === "ArrowLeft") show(current - 1);
    });
}

/* ---------- Форма записи (contact.html) ---------- */

const form = document.querySelector("[data-signup-form]");

if (form) {
    const status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const phone = String(data.get("phone") || "").trim();
        const age = String(data.get("age") || "").trim();
        const group = String(data.get("group") || "").trim();
        const comment = String(data.get("comment") || "").trim();

        if (!name || !phone || !group) {
            status.textContent = "Заполните имя, телефон и группу.";
            status.className = "form-status err";
            return;
        }

        // Отправки на сервер нет: собираем письмо и открываем почтовый клиент посетителя.
        const body = [
            `Имя: ${name}`,
            `Телефон: ${phone}`,
            `Возраст: ${age || "—"}`,
            `Группа: ${group}`,
            `Комментарий: ${comment || "—"}`
        ].join("\n");
        const subject = `Запись в секцию: ${name}`;

        window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        status.textContent = "Откройте почтовую программу и отправьте письмо. Если она не открылась — позвоните тренеру.";
        status.className = "form-status ok";
    });
}
