(function () {
  "use strict";
  var CFG = window.COUPE_CONFIG || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Config no DOM ---------- */
  $$("[data-config]").forEach(function (el) {
    var v = CFG[el.getAttribute("data-config")];
    if (v) el.textContent = v;
  });
  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Tags de anúncios (só carregam se configuradas em config.js) ---------- */
  if (CFG.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CFG.metaPixelId);
    var pv = document.querySelector('meta[name="pv-id"]'); // event_id do PageView enviado pelo servidor
    window.fbq("track", "PageView", {}, pv ? { eventID: pv.content } : undefined);
  }
  if (CFG.googleAdsId) {
    var gs = document.createElement("script"); gs.async = true;
    gs.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.googleAdsId;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CFG.googleAdsId, { allow_enhanced_conversions: true });
  }

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }
  function cookie(n) { var m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function metaIds() {
    var fbc = cookie("_fbc"), fbclid = new URLSearchParams(location.search).get("fbclid");
    if (!fbc && fbclid) fbc = "fb.1." + Date.now() + "." + fbclid;
    return { fbp: cookie("_fbp"), fbc: fbc, event_id: "lead_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10) };
  }
  function pixelLead(lead) {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "Lead", { content_name: "Coupé Tower", content_category: "Imóvel - alto padrão" }, { eventID: lead.event_id });
  }
  function googleLead(lead) {
    if (typeof window.gtag !== "function" || !CFG.googleAdsId) return;
    var d = String(lead.telefone || "").replace(/\D/g, ""); if (d.length === 10 || d.length === 11) d = "55" + d;
    var partes = String(lead.nome || "").trim().split(/\s+/);
    var ud = { address: { country: "BR" } };
    if (lead.email) ud.email = lead.email.trim().toLowerCase();
    if (d) ud.phone_number = "+" + d;
    if (partes[0]) ud.address.first_name = partes[0];
    if (partes.length > 1) ud.address.last_name = partes[partes.length - 1];
    window.gtag("set", "user_data", ud);
    window.gtag("event", "generate_lead", { send_to: CFG.googleAdsId, lead_origem: lead.origem });
    if (CFG.googleAdsLeadLabel) window.gtag("event", "conversion", { send_to: CFG.googleAdsId + "/" + CFG.googleAdsLeadLabel, transaction_id: lead.event_id });
  }

  /* ---------- Origem do lead: seção + botão (gravada no CRM) ---------- */
  var SECOES = { hero: "Topo", projeto: "O projeto", torres: "Torres", lounge: "Coupé Lounge", lazer: "Lazer",
    residencias: "Residências", plantas: "Plantas", flex: "Flex On", servicos: "Serviços", masterplan: "Masterplan",
    localizacao: "Localização", ficha: "Ficha técnica", contato: "Contato" };
  function secaoDe(el) {
    if (el.closest(".fab-cta")) return "Botão flutuante do WhatsApp";
    if (el.closest(".mobile-bar")) return "Barra fixa do celular";
    if (el.closest(".footer")) return "Rodapé";
    if (el.closest(".header")) return "Menu do topo";
    var sec = el.closest("section");
    var nome = sec ? (SECOES[sec.id] || sec.id || "Página") : "Página";
    var plan = el.closest(".plan");
    if (plan) {
      var tag = $(".plan__tag", plan), h = $("h3", plan), area = $(".plan__area", plan);
      nome += " · " + [h && h.textContent, area && area.textContent, tag && tag.textContent].filter(Boolean).join(" · ").replace(/\s+/g, " ").trim();
    }
    return nome;
  }
  function textoBotao(el) { return ((el.textContent || "").trim() || el.getAttribute("aria-label") || "WhatsApp").replace(/\s+/g, " "); }
  function origemDe(el) {
    var sec = secaoDe(el);
    return /Botão flutuante|Barra fixa|Rodapé/.test(sec) ? sec : sec + " · botão “" + textoBotao(el) + "”";
  }
  var waLink = function (msg) {
    return "https://wa.me/" + (CFG.whatsapp || "") + "?text=" + encodeURIComponent(msg || CFG.mensagemWhatsApp || "");
  };

  // Botões de WhatsApp abrem o popup de captura (nome, telefone e e-mail)
  $$("[data-fala]").forEach(function (a) {
    a.href = "#contato";
    a.removeAttribute("target");
    a.addEventListener("click", function (e) {
      e.preventDefault();
      track("whatsapp_click", { origem: origemDe(a) });
      openWaModal(origemDe(a), textoBotao(a), a.getAttribute("data-interesse") || "");
    });
  });

  /* ---------- Header / menu ---------- */
  var header = $(".header"), mobileBar = $(".mobile-bar");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    if (mobileBar) mobileBar.classList.toggle("is-visible", y > window.innerHeight * 0.7);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("a", nav).forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); });
  });

  /* ---------- Abas ---------- */
  $$(".tabs").forEach(function (tabs) {
    var section = tabs.closest("section");
    var btns = $$(".tab", tabs);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-tab");
        btns.forEach(function (x) { var on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on); });
        $$("[data-panel]", section).forEach(function (p) {
          var on = p.getAttribute("data-panel") === id;
          p.hidden = !on; p.classList.toggle("is-active", on);
        });
      });
    });
  });

  /* ---------- Sliders ---------- */
  $$("[data-slider]").forEach(function (s) {
    var track = $(".slider__track", s);
    $$(".slider__btn", s).forEach(function (b) {
      b.addEventListener("click", function () {
        var item = $(".g-item", track);
        var step = item ? item.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
        var dir = Number(b.getAttribute("data-dir"));
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: dir * step, behavior: "smooth" });
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb), group = [], idx = 0;
  function capOf(img) { var f = img.closest("figure"), c = f && $("figcaption", f); return c ? c.textContent : img.alt; }
  function openLb(list, i) { group = list; idx = i; showLb(); lb.hidden = false; document.body.style.overflow = "hidden"; }
  function showLb() {
    var img = group[idx];
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lbCap.textContent = capOf(img);
    $$(".lightbox__nav", lb).forEach(function (n) { n.style.display = group.length > 1 ? "" : "none"; });
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  function step(d) { idx = (idx + d + group.length) % group.length; showLb(); }
  $$(".gallery").forEach(function (g) {
    var imgs = $$("img", g);
    imgs.forEach(function (img, i) { img.closest(".g-item").addEventListener("click", function () { openLb(imgs, i); }); });
  });
  $$(".plans").forEach(function (g) {
    var imgs = $$(".plan__fig img", g);
    imgs.forEach(function (img, i) { img.closest(".plan__fig").addEventListener("click", function () { openLb(imgs, i); }); });
  });
  $$("[data-zoom]").forEach(function (img) { img.addEventListener("click", function () { openLb([img], 0); }); });
  $(".lightbox__close", lb).addEventListener("click", closeLb);
  $(".lightbox__prev", lb).addEventListener("click", function () { step(-1); });
  $(".lightbox__next", lb).addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null;
  });

  /* ---------- Reveal ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Formulários ---------- */
  function maskPhone(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    return v.length ? "(" + v : v;
  }
  $$('input[type="tel"]').forEach(function (i) { i.addEventListener("input", function () { i.value = maskPhone(i.value); }); });

  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) { if (p.get(k)) o[k] = p.get(k); });
    return o;
  }
  var LS_KEY = "coupe_lead";
  function remember(lead) { try { localStorage.setItem(LS_KEY, JSON.stringify({ nome: lead.nome, telefone: lead.telefone, email: lead.email })); } catch (_) {} }
  function recall() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (_) { return null; } }

  function buildLead(form, origem, cta) {
    return Object.assign({
      nome: form.nome.value.trim(), telefone: form.telefone.value, email: form.email.value.trim(),
      interesse: form.interesse ? form.interesse.value : "",
      website: form.website ? form.website.value : "",
      origem: origem, cta: cta || "",
      pagina: location.href, referrer: document.referrer
    }, metaIds(), utm());
  }
  // keepalive: o lead chega ao CRM mesmo que a pessoa saia da página indo para o WhatsApp
  function sendLead(lead) {
    if (!CFG.formEndpoint) return Promise.reject(new Error("sem endpoint"));
    var body = JSON.stringify(lead);
    try {
      return fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || d.ok === false) throw new Error(d.error || r.status); return d; }); });
    } catch (err) {
      if (navigator.sendBeacon && navigator.sendBeacon(CFG.formEndpoint, new Blob([body], { type: "text/plain" }))) return Promise.resolve({ ok: true });
      return Promise.reject(err);
    }
  }
  function validate(form) {
    var ok = true, nome = form.nome, tel = form.telefone, email = form.email, cons = form.consentimento;
    [nome, tel, email].forEach(function (f) { f.classList.remove("is-invalid"); });
    cons.closest(".consent").classList.remove("is-invalid");
    if (nome.value.trim().length < 2) { nome.classList.add("is-invalid"); ok = false; }
    if (tel.value.replace(/\D/g, "").length < 10) { tel.classList.add("is-invalid"); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { email.classList.add("is-invalid"); ok = false; }
    if (!cons.checked) { cons.closest(".consent").classList.add("is-invalid"); ok = false; }
    return ok;
  }
  function abrirWhatsApp(lead) {
    var msg = "Olá, Carla! Meu nome é " + lead.nome.split(" ")[0] + " e tenho interesse no Coupé Tower" +
      (lead.interesse && lead.interesse !== "Ainda não sei" ? " (" + lead.interesse + ")" : "") + ". Gostaria de receber a apresentação completa.";
    var url = waLink(msg);
    var w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
    return url;
  }
  function registrar(lead) {
    remember(lead);
    sendLead(lead).catch(function () {});
    pixelLead(lead);
    googleLead(lead);
    track("lead_submit", { origem: lead.origem, interesse: lead.interesse });
  }

  /* ---------- Popup do WhatsApp ---------- */
  var ctModal = $("#ctModal"), ctForm = $("#ctForm"), waOrigem = "WhatsApp", waCta = "", lastFocus = null;
  function openWaModal(origem, cta, interesse) {
    waOrigem = origem || "WhatsApp"; waCta = cta || "";
    ctForm.interesse.value = interesse || "";
    var saved = recall();
    if (saved) ["nome", "telefone", "email"].forEach(function (k) { if (saved[k] && !ctForm[k].value) ctForm[k].value = saved[k]; });
    var msg = $(".lead-form__msg", ctForm); msg.textContent = ""; msg.className = "lead-form__msg";
    lastFocus = document.activeElement;
    ctModal.hidden = false; document.body.style.overflow = "hidden";
    setTimeout(function () { (ctForm.nome.value ? ctForm.querySelector("button[type=submit]") : ctForm.nome).focus(); }, 50);
  }
  function closeWaModal() { ctModal.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  $(".ct-modal__close", ctModal).addEventListener("click", closeWaModal);
  ctModal.addEventListener("click", function (e) { if (e.target === ctModal) closeWaModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ctModal.hidden) closeWaModal(); });
  ctForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $(".lead-form__msg", ctForm);
    msg.className = "lead-form__msg";
    if (!validate(ctForm)) { msg.classList.add("is-err"); msg.textContent = "Preencha nome, WhatsApp e e-mail."; return; }
    var lead = buildLead(ctForm, waOrigem, waCta);
    registrar(lead);
    abrirWhatsApp(lead);
    msg.classList.add("is-ok"); msg.textContent = "Abrindo o WhatsApp…";
    setTimeout(closeWaModal, 1200);
  });

  /* ---------- Formulário de contato ---------- */
  $$(".lead-form").forEach(function (form) {
    var msg = $(".lead-form__msg", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "lead-form__msg"; msg.textContent = "";
      if (!validate(form)) { msg.classList.add("is-err"); msg.textContent = "Confira os campos destacados."; return; }
      var btn = form.querySelector('button[type="submit"]');
      var lead = buildLead(form, secaoDe(form) + " · formulário", btn ? btn.textContent.trim() : "");
      registrar(lead);
      var url = abrirWhatsApp(lead);
      msg.classList.add("is-ok");
      msg.innerHTML = 'Recebemos seus dados! Abrindo o WhatsApp… <a href="' + url + '" target="_blank" rel="noopener">Clique aqui se não abrir.</a>';
      form.reset();
    });
  });
})();
