/* Shield Automations — redesign interactions (vanilla JS) */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Hero slider ---------------- */
  const slides = $$(".hero__slide");
  const dotsWrap = $("#heroDots");
  const progressBar = $("#heroProgress");
  const SLIDE_MS = 6000;
  let current = 0, timer = null, rafId = null, slideStart = performance.now();

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "hero__dot" + (i === 0 ? " is-active" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(b);
  });
  const dots = $$(".hero__dot");

  function animateProgress(start) {
    cancelAnimationFrame(rafId);
    if (reducedMotion) { progressBar.style.width = "100%"; return; }
    const tick = now => {
      const p = Math.min((now - start) / SLIDE_MS, 1);
      progressBar.style.width = (p * 100).toFixed(2) + "%";
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function goTo(i) {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    // restart zoom animation on the incoming image
    const img = $("img", slides[i]);
    if (img && !reducedMotion) { img.style.animation = "none"; void img.offsetWidth; img.style.animation = ""; }
    current = i;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    slideStart = performance.now();
    animateProgress(slideStart);
    restartTimer();
  }

  function next() { goTo((current + 1) % slides.length); }
  function restartTimer() { clearInterval(timer); timer = setInterval(next, SLIDE_MS); }
  if (slides.length > 1) { animateProgress(slideStart); restartTimer(); }

  /* ---------------- Headline word rotator ---------------- */
  const words = $$(".rotator__word");
  let wIdx = 0;
  if (words.length > 1 && !reducedMotion) setInterval(() => {
    words[wIdx].classList.add("leaving"); words[wIdx].classList.remove("is-active");
    wIdx = (wIdx + 1) % words.length;
    setTimeout(() => words[wIdx].classList.remove("leaving"), 60);
    words[wIdx].classList.add("is-active");
  }, 2800);

  /* ---------------- Sticky header + to-top ---------------- */
  const header = $("#header"), toTop = $("#toTop");
  addEventListener("scroll", () => {
    header.classList.toggle("is-stuck", scrollY > 8);
    toTop.classList.toggle("show", scrollY > 700);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- Mobile menu ---------------- */
  const burger = $("#burger"), mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    mobileMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  $$("a", mobileMenu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  const accBtn = $(".mobile-menu__acc"), accPanel = $(".mobile-menu__panel");
  if (accBtn) accBtn.addEventListener("click", () => {
    const open = accPanel.classList.toggle("open");
    accBtn.setAttribute("aria-expanded", open);
  });

  /* ---------------- Product filtering ---------------- */
  const filterBtns = $$(".filter");
  const cards = $$("#productGrid .pcard");
  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
    const f = btn.dataset.filter;
    cards.forEach(c => {
      const show = f === "all" || c.dataset.cat === f;
      c.classList.toggle("is-hidden", !show);
      if (show) { c.classList.add("in"); }
    });
  }));

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: "0px 0px -40px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------------- Animated counters ---------------- */
  const counters = $$("[data-count]");
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count;
      cio.unobserve(el);
      if (reducedMotion) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1400;
      const step = now => {
        const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  /* ---------------- Scroll spy ---------------- */
  const spyLinks = $$(".nav__link[href^='#']");
  const sections = spyLinks.map(l => $(l.getAttribute("href"))).filter(Boolean);
  const sio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      spyLinks.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => sio.observe(s));

  /* ---------------- Enquiry form ---------------- */
  const form = $("#quoteForm"), okMsg = $("#formOk");
  const validate = field => {
    const input = $("input,textarea", field);
    let ok = true;
    if (input.required) ok = input.type === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
      : input.value.trim().length > 1;
    field.classList.toggle("invalid", !ok);
    return ok;
  };
  $$(".field", form).forEach(f => {
    const input = $("input,textarea", f);
    input.addEventListener("input", () => f.classList.remove("invalid"));
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const fields = $$(".field", form).filter(f => $("input,textarea", f).required);
    const allOk = fields.map(validate).every(Boolean);
    if (!allOk) { $(".field.invalid input,.field.invalid textarea", form)?.focus(); return; }
    okMsg.hidden = false;
    $(".form__submit").disabled = true;
    $(".form__submit").style.opacity = ".6";
    form.reset();
    setTimeout(() => { okMsg.hidden = true; $(".form__submit").disabled = false; $(".form__submit").style.opacity = ""; }, 6000);
  });
})();
