/* Salón Pomarrosa: ejemplo del paquete Pro de Small Shop Web (negocio ficticio).
   Un solo archivo para las 5 páginas: idioma, "Abierto ahora", cotizador, citas, galería, reseñas y compartir. */
(function () {
  "use strict";

  var KEY = "pomarrosa-lang";
  var DIR = "https://www.google.com/maps/dir/?api=1&destination=Las+Piedras%2C+Puerto+Rico";

  // Horario en hora de Puerto Rico. 0 = domingo ... 6 = sábado. [abre, cierra] en horas de 24.
  var HOURS = [null, null, [9, 18], [9, 18], [9, 18], [9, 18], [8, 16]];

  var CATS = [
    { id: "cabello", es: "Cabello", en: "Hair" },
    { id: "color", es: "Color", en: "Color" },
    { id: "unas", es: "Uñas", en: "Nails" },
    { id: "cejas", es: "Cejas y pestañas", en: "Brows and lashes" }
  ];

  var SVC = [
    { c: "cabello", es: "Corte de dama", en: "Women's cut", des: "Con lavado y secado", den: "With wash and blow-dry", p: 25 },
    { c: "cabello", es: "Corte de caballero", en: "Men's cut", des: "Con lavado", den: "With wash", p: 15 },
    { c: "cabello", es: "Lavado y secado", en: "Wash and blow-dry", des: "Con cepillo o plancha", den: "Brushed or flat-ironed", p: 20 },
    { c: "cabello", es: "Peinado para evento", en: "Event updo", des: "Bodas, graduaciones y quinceañeros", den: "Weddings, graduations and quinceañeras", p: 45 },
    { c: "cabello", es: "Tratamiento de keratina", en: "Keratin treatment", des: "El precio depende del largo", den: "Price depends on length", p: 120, from: true },
    { c: "color", es: "Retoque de raíz", en: "Root touch-up", des: "Un solo tono", den: "Single shade", p: 45 },
    { c: "color", es: "Tinte completo", en: "All-over color", des: "Incluye lavado y secado", den: "Includes wash and blow-dry", p: 65 },
    { c: "color", es: "Mechones o balayage", en: "Highlights or balayage", des: "El precio depende del largo", den: "Price depends on length", p: 90, from: true },
    { c: "color", es: "Matizado", en: "Toner", des: "Quita los tonos amarillos", den: "Takes out brassy tones", p: 25 },
    { c: "unas", es: "Manicura", en: "Manicure", des: "Con esmalte regular", den: "With regular polish", p: 15 },
    { c: "unas", es: "Manicura en gel", en: "Gel manicure", des: "Dura hasta tres semanas", den: "Lasts up to three weeks", p: 25 },
    { c: "unas", es: "Pedicura", en: "Pedicure", des: "Con exfoliación", den: "With a scrub", p: 25 },
    { c: "unas", es: "Uñas acrílicas", en: "Acrylic nails", des: "Juego completo", den: "Full set", p: 35 },
    { c: "cejas", es: "Cejas con cera", en: "Brow wax", des: "Diseño y limpieza", den: "Shaping and cleanup", p: 10 },
    { c: "cejas", es: "Cejas con henna", en: "Brow henna", des: "El color dura unas dos semanas", den: "Color lasts about two weeks", p: 20 },
    { c: "cejas", es: "Lifting de pestañas", en: "Lash lift", des: "Incluye tinte", den: "Includes tint", p: 40 }
  ];
  var FAVS = [0, 6, 10];

  // Reseñas de ejemplo: el negocio es inventado. En un sitio real van reseñas reales, con permiso.
  var REVIEWS = [
    { n: "M. R.", s: 7, es: "Me hicieron el balayage que quería y me explicaron cómo cuidarlo en casa. Salí feliz.", en: "They did the balayage I wanted and explained how to care for it at home. I left happy." },
    { n: "J. C.", s: 1, es: "Pedí cita por WhatsApp un martes y me atendieron a la hora. Nada de esperar.", en: "I booked on WhatsApp on a Tuesday and they took me right on time. No waiting." },
    { n: "A. L.", s: 10, es: "El gel me duró casi tres semanas. Ya tengo mi cita para la próxima.", en: "My gel lasted almost three weeks. I already booked the next one." },
    { n: "K. S.", s: 3, es: "Me peinaron para la boda de mi hermana y el peinado aguantó toda la noche.", en: "They did my hair for my sister's wedding and it held up all night." },
    { n: "L. M.", s: 5, es: "Llevé a mi mamá para el retoque de raíz y la atendieron con mucha paciencia.", en: "I took my mom for a root touch-up and they were very patient with her." },
    { n: "D. V.", s: 13, es: "Por primera vez en años las cejas me quedaron parejas.", en: "For the first time in years, my brows came out even." }
  ];

  var ICONS = {
    strand: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M22 8c-6 14 6 22 0 36s4 12 2 14"/><path d="M32 8c-6 14 6 22 0 36s4 12 2 14"/><path d="M42 8c-6 14 6 22 0 36s4 12 2 14"/></svg>',
    scissors: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="18" cy="18" r="7"/><circle cx="18" cy="46" r="7"/><path d="M23 22l29 26M23 42l29-26"/></svg>',
    polish: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><rect x="19" y="28" width="26" height="28" rx="6"/><path d="M25 28V19h14v9M28 19V7h8v12"/></svg>',
    flower: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><circle cx="32" cy="32" r="5"/><circle cx="32" cy="17" r="8"/><circle cx="46" cy="27" r="8"/><circle cx="41" cy="44" r="8"/><circle cx="23" cy="44" r="8"/><circle cx="18" cy="27" r="8"/></svg>',
    drop: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M32 7C24 21 15 30 15 41a17 17 0 0 0 34 0C49 30 40 21 32 7z"/><path d="M24 42a8 8 0 0 0 8 8" stroke-linecap="round"/></svg>',
    brow: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 28c12-12 34-14 48-4"/><path d="M13 43c10 9 28 9 38 0c-10-9-28-9-38 0z"/><circle cx="32" cy="43" r="4"/></svg>',
    comb: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="8" y="18" width="48" height="10" rx="3"/><path d="M13 28v18M19 28v18M25 28v18M31 28v18M37 28v18M43 28v18M49 28v14"/></svg>',
    nail: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 58V26a12 12 0 0 1 24 0v32"/><path d="M25 29a7 7 0 0 1 14 0v7a7 7 0 0 1-14 0z"/></svg>',
    mirror: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 50V26a14 14 0 0 1 28 0v24z"/><path d="M12 50h40M26 57h12M26 22l6-6M26 30l12-12"/></svg>'
  };

  var GAL = [
    { es: "Balayage castaño a caramelo", en: "Brown-to-caramel balayage", bg: "linear-gradient(170deg,#3A2214 0%,#6A4128 45%,#DDA765 100%)", fg: "#FFF8F6", icon: "strand" },
    { es: "Corte en capas", en: "Layered cut", bg: "linear-gradient(160deg,#F7D9D6,#EBC0BC)", fg: "#1F4A3A", icon: "scissors" },
    { es: "Manicura en gel", en: "Gel manicure", bg: "linear-gradient(160deg,#B3306A,#E07BA4)", fg: "#FFF8F6", icon: "polish" },
    { es: "Peinado de novia", en: "Bridal updo", bg: "linear-gradient(160deg,#F6EBDD,#E7D1B3)", fg: "#7A5A2E", icon: "flower" },
    { es: "Pedicura", en: "Pedicure", bg: "linear-gradient(160deg,#DCEBE2,#B9D6C5)", fg: "#1F4A3A", icon: "drop" },
    { es: "Cejas definidas", en: "Shaped brows", bg: "linear-gradient(160deg,#EADBD3,#CDB5A7)", fg: "#3A2214", icon: "brow" },
    { es: "Retoque de raíz", en: "Root touch-up", bg: "linear-gradient(160deg,#41203B,#8E4C80)", fg: "#FBEAE7", icon: "comb" },
    { es: "Uñas acrílicas", en: "Acrylic nails", bg: "linear-gradient(160deg,#FBEAE7,#F2A9C4)", fg: "#8E2353", icon: "nail" },
    { es: "El salón", en: "The salon", bg: "linear-gradient(160deg,#1F4A3A,#2E6650)", fg: "#F7D9D6", icon: "mirror" }
  ];

  var S = {
    es: {
      "days": ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      "months": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      "closed": "Cerrado",
      "st.open": "Abierto ahora. Cierra {t}",
      "st.today": "Cerrado ahora. Abre hoy {t}",
      "st.tomorrow": "Cerrado ahora. Abre mañana {t}",
      "st.on": "Cerrado ahora. Abre el {d} {t}",
      "svc.from": "desde", "svc.add": "Añadir", "svc.added": "Añadido", "svc.all": "Todo",
      "q.empty": "Todavía no has añadido nada. Toca “Añadir” en los servicios que quieres.",
      "q.remove": "Quitar",
      "q.bar": function (n, s) { return n + (n === 1 ? " servicio, " : " servicios, ") + s; },
      "q.hi": "Hola, quiero hacer una cita para:", "q.totalMsg": "Total estimado", "q.ask": "¿Qué días tienen disponibles?",
      "q.emptyTitle": "Tu cotización está vacía", "q.emptyNote": "Añade por lo menos un servicio y vuelve a intentarlo.",
      "m.waTitle": "Así llega el mensaje",
      "m.waNote": "En un sitio real, este botón abre el WhatsApp del salón con este mensaje listo para enviar. En este ejemplo no se envía nada.",
      "m.close": "Cerrar",
      "m.socialTitle": "Enlace a redes", "m.social": "En un sitio real, este botón abre el {x} del salón.",
      "m.callTitle": "Llamar", "m.callNote": "En un sitio real, este botón llama al salón. Este número es ficticio.",
      "m.saveTitle": "Guardar contacto", "m.saveNote": "En un sitio real, este botón guarda el teléfono, la dirección y el horario del salón en los contactos de tu teléfono.",
      "m.saveDl": "Descargar el contacto de ejemplo",
      "m.revTitle": "Dejar una reseña", "m.revNote": "En un sitio real, este botón abre la página donde el salón recibe reseñas, por ejemplo su perfil de Google.",
      "share.title": "Compartir este sitio", "share.text": "Mira Salón Pomarrosa en Las Piedras:", "share.copy": "Copiar el link", "share.copied": "Link copiado",
      "gal.photo": "Foto de ejemplo",
      "lb.count": function (i, n) { return i + " de " + n; },
      "rv.stars": "5 de 5 estrellas", "rv.sample": "Reseña de ejemplo",
      "bk.today": "hoy", "bk.tomorrow": "mañana", "bk.anon": "una clienta",
      "bk.msg": function (n, s, d, h) { return "Hola, soy " + n + ". Quiero una cita de " + s.toLowerCase() + " para el " + d + " " + h + " ¿Está disponible?"; }
    },
    en: {
      "demo.msg": "Pro package example site · Salón Pomarrosa is a fictional business.",
      "nav.label": "Pages", "nav.home": "Home", "nav.services": "Services", "nav.gallery": "Gallery", "nav.reviews": "Reviews", "nav.contact": "Contact",
      "cta.book": "Book an appointment",
      "title.inicio": "Salón Pomarrosa | Las Piedras, PR", "title.servicios": "Services and prices | Salón Pomarrosa", "title.galeria": "Gallery | Salón Pomarrosa",
      "title.resenas": "Reviews | Salón Pomarrosa", "title.contacto": "Appointments and contact | Salón Pomarrosa",
      "desc": "Example site made by Small Shop Web. Salón Pomarrosa is a fictional business.",
      "home.small": "Salón",
      "home.lead": "Cuts, color, nails and brows in Las Piedras. See the prices, put together a quote and book on WhatsApp.",
      "home.services": "See services and prices",
      "home.f1b": "Tuesday to Saturday", "home.f1": "Opens at 9:00 a.m. (Sat 8:00)",
      "home.f2": "Parking next door",
      "home.f3b": "ATH Móvil, card and cash", "home.f3": "Pay when you're done",
      "fav.title": "Most requested", "fav.all": "See all prices",
      "rev.title": "What people say", "rev.all": "Read all reviews",
      "visit.title": "Visit us", "visit.addr": "45 Fictional St., Las Piedras, PR 00771", "visit.dir": "Get directions",
      "visit.h1": "Tuesday to Friday", "visit.h2": "Saturday", "visit.h3": "Sunday and Monday", "visit.h3v": "Closed",
      "foot.share": "Share", "foot.made": "Site made by Small Shop Web", "foot.phone": "787-555-0142 (fictional number)",
      "svc.title": "Services and prices",
      "svc.lead": "Tap “Add” on what you want and we'll add up the total. Then send it on WhatsApp to book your appointment.",
      "svc.cats": "Categories", "svc.print": "Print prices",
      "q.title": "Your quote", "q.total": "Estimated total", "q.fromNote": "Prices marked “from” can go up depending on hair length.",
      "q.send": "Send on WhatsApp", "q.clear": "Clear all", "q.see": "See quote",
      "pr.title": "Price list", "pr.scan": "Scan to see the site and book an appointment",
      "pr.hours": "Tuesday to Friday 9:00 a.m. – 6:00 p.m. · Saturday 8:00 a.m. – 4:00 p.m.",
      "gal.title": "Gallery", "gal.lead": "Tap a photo to see it full size.", "gal.note": "These are sample photos. Your site shows photos of your own work.",
      "lb.label": "Photo", "lb.close": "Close", "lb.prev": "Previous photo", "lb.next": "Next photo",
      "rv.title": "Reviews", "rv.lead": "What our customers say.",
      "rv.note": "These reviews are samples because the business is made up. Your site shows real reviews from your customers, with their permission.",
      "rv.leaveT": "Have you visited us?", "rv.leaveP": "Your review helps other people find us.", "rv.leave": "Leave a review",
      "ct.title": "Appointments and contact", "ct.lead": "Book an appointment, check our hours or save our contact.",
      "bk.title": "Book an appointment",
      "bk.lead": "Pick the service, day and time. The button opens WhatsApp with your message ready, and we confirm there.",
      "bk.service": "Service", "bk.day": "Day", "bk.time": "Time", "bk.name": "Your name", "bk.send": "Book on WhatsApp", "bk.note": "We reply during business hours.",
      "hr.title": "Hours", "where.title": "Where we are", "ct.phone": "Phone", "ct.fake": "(fictional number)",
      "ct.call": "Call", "ct.save": "Save contact", "ct.share": "Share",
      "map.title": "Map of Las Piedras", "map.note": "The map shows Las Piedras. The example address is made up.",
      "qr.title": "Included in the Pro package: a QR code",
      "qr.text": "A code that opens your site, to put on your door or counter. Try scanning it with your phone's camera.",
      "qr.alt": "QR code that opens this site",
      "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      "closed": "Closed",
      "st.open": "Open now. Closes at {t}",
      "st.today": "Closed now. Opens today at {t}",
      "st.tomorrow": "Closed now. Opens tomorrow at {t}",
      "st.on": "Closed now. Opens {d} at {t}",
      "svc.from": "from", "svc.add": "Add", "svc.added": "Added", "svc.all": "All",
      "q.empty": "You haven't added anything yet. Tap “Add” on the services you want.",
      "q.remove": "Remove",
      "q.bar": function (n, s) { return n + (n === 1 ? " service, " : " services, ") + s; },
      "q.hi": "Hi, I'd like to book an appointment for:", "q.totalMsg": "Estimated total", "q.ask": "What days do you have open?",
      "q.emptyTitle": "Your quote is empty", "q.emptyNote": "Add at least one service and try again.",
      "m.waTitle": "This is the message that gets sent",
      "m.waNote": "On a real site, this button opens the salon's WhatsApp with this message ready to send. Nothing is sent from this example.",
      "m.close": "Close",
      "m.socialTitle": "Social link", "m.social": "On a real site, this button opens the salon's {x}.",
      "m.callTitle": "Call", "m.callNote": "On a real site, this button calls the salon. This number is made up.",
      "m.saveTitle": "Save contact", "m.saveNote": "On a real site, this button saves the salon's phone, address and hours to your phone's contacts.",
      "m.saveDl": "Download the sample contact",
      "m.revTitle": "Leave a review", "m.revNote": "On a real site, this button opens the page where the salon gets reviews, for example its Google profile.",
      "share.title": "Share this site", "share.text": "Check out Salón Pomarrosa in Las Piedras:", "share.copy": "Copy the link", "share.copied": "Link copied",
      "gal.photo": "Sample photo",
      "lb.count": function (i, n) { return i + " of " + n; },
      "rv.stars": "5 out of 5 stars", "rv.sample": "Sample review",
      "bk.today": "today", "bk.tomorrow": "tomorrow", "bk.anon": "a customer",
      "bk.msg": function (n, s, d, h) { return "Hi, I'm " + n + ". I'd like to book this: " + s + ", " + d + " at " + h + " Is it available?"; }
    }
  };

  /* ---------- Idioma ---------- */
  var lang = "es";
  try {
    var q = /[?&]lang=(es|en)(&|$)/.exec(location.search);
    if (q) { lang = q[1]; localStorage.setItem(KEY, lang); }
    else { var saved = localStorage.getItem(KEY); if (saved === "es" || saved === "en") lang = saved; }
  } catch (e) {}

  var page = document.body.getAttribute("data-page");
  var ROOT = document.body.getAttribute("data-root") || "";
  // El HTML trae el texto en español; se guarda aquí para poder volver a español sin recargar.
  var ORIG = {};

  function $(id) { return document.getElementById(id); }
  function t(k) { var v = S[lang][k]; return v === undefined ? S.es[k] : v; }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function money(n) { return "$" + (n % 1 ? n.toFixed(2) : String(n)); }
  function price(x) { return (x.from ? t("svc.from") + " " : "") + money(x.p); }
  function desc(x) { return lang === "es" ? x.des : x.den; }
  function catOf(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return CATS[0]; }
  function fmtH(h) { var hh = Math.floor(h), m = Math.round((h - hh) * 60); return (hh % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (hh < 12 ? "a.m." : "p.m."); }
  // "a las 9:00 a.m." pero "a la 1:00 p.m." La hora ya termina en punto (a.m./p.m.), así que las frases no añaden otro.
  function at(h) { var s = fmtH(h); if (lang !== "es") return s; return (s.indexOf("1:") === 0 ? "a la " : "a las ") + s; }

  function prNow() {
    // Puerto Rico está en UTC-4 todo el año (no cambia la hora).
    var d = new Date(Date.now() - 4 * 3600000);
    return { d: d, day: d.getUTCDay(), h: d.getUTCHours() + d.getUTCMinutes() / 60 };
  }

  function statusInfo() {
    var n = prNow(), today = HOURS[n.day];
    if (today && n.h >= today[0] && n.h < today[1]) return { open: true, text: t("st.open").replace("{t}", at(today[1])) };
    if (today && n.h < today[0]) return { open: false, text: t("st.today").replace("{t}", at(today[0])) };
    for (var i = 1; i <= 7; i++) {
      var dd = (n.day + i) % 7, hh = HOURS[dd];
      if (hh) return { open: false, text: (i === 1 ? t("st.tomorrow") : t("st.on").replace("{d}", t("days")[dd])).replace("{t}", at(hh[0])) };
    }
    return { open: false, text: "" };
  }

  function renderStatus() {
    var st = statusInfo(), nodes = document.querySelectorAll("[data-status]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = '<span class="dot" aria-hidden="true"></span>' + esc(st.text);
      nodes[i].classList.toggle("is-open", st.open);
    }
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-t]"), i, k, v;
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute("data-t");
      if (!(k in ORIG)) ORIG[k] = nodes[i].textContent;
      v = lang === "es" ? ORIG[k] : S.en[k];
      if (typeof v === "string") nodes[i].textContent = v;
    }
    var withAttr = document.querySelectorAll("[data-t-attr]");
    for (i = 0; i < withAttr.length; i++) {
      var el = withAttr[i], pairs = el.getAttribute("data-t-attr").split(",");
      for (var j = 0; j < pairs.length; j++) {
        var p = pairs[j].split(":"), ok = "@" + p[1] + "@" + p[0];
        if (!(ok in ORIG)) ORIG[ok] = el.getAttribute(p[0]);
        v = lang === "es" ? ORIG[ok] : S.en[p[1]];
        if (typeof v === "string") el.setAttribute(p[0], v);
      }
    }
    var btns = document.querySelectorAll(".lang button");
    for (i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-lang") === lang ? "true" : "false");
  }

  /* ---------- Hoja de mensajes (modal) ---------- */
  var lastFocus = null;
  function openSheet(title, bubble, note, acts) {
    lastFocus = document.activeElement;
    $("m-title").textContent = title;
    $("m-bubble").textContent = bubble || ""; $("m-bubble").hidden = !bubble;
    $("m-note").textContent = note || ""; $("m-note").hidden = !note;
    var box = $("m-acts"); box.innerHTML = "";
    (acts || []).forEach(function (a) {
      var el;
      if (a.href) {
        el = document.createElement("a"); el.href = a.href;
        if (a.download) el.setAttribute("download", a.download); else { el.target = "_blank"; el.rel = "noopener"; }
      } else {
        el = document.createElement("button"); el.type = "button";
        el.addEventListener("click", function () { a.run(el); });
      }
      el.className = "btn small"; el.textContent = a.label; box.appendChild(el);
    });
    box.hidden = !(acts && acts.length);
    $("m-close").textContent = t("m.close");
    $("modal").hidden = false;
    $("m-close").focus();
  }
  function closeSheet() {
    $("modal").hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("m-close").addEventListener("click", closeSheet);
  $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeSheet(); });

  /* ---------- Compartir ---------- */
  function siteUrl() { return location.href.split("#")[0].split("?")[0]; }
  function copyText(s, done) {
    try { navigator.clipboard.writeText(s).then(done, function () {}); } catch (e) {}
  }
  function share() {
    var url = siteUrl(), text = t("share.text");
    if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
    openSheet(t("share.title"), "", url, [
      { label: "WhatsApp", href: "https://wa.me/?text=" + encodeURIComponent(text + " " + url) },
      { label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) },
      { label: t("share.copy"), run: function (el) { copyText(url, function () { el.textContent = t("share.copied"); }); } }
    ]);
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-share]"), function (b) { b.addEventListener("click", share); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-social]"), function (b) {
    b.addEventListener("click", function () { openSheet(t("m.socialTitle"), "", t("m.social").replace("{x}", b.getAttribute("data-social"))); });
  });

  function stars() { return '<span class="stars" role="img" aria-label="' + esc(t("rv.stars")) + '">★★★★★</span>'; }

  /* ---------- Inicio ---------- */
  function renderHome() {
    $("favs").innerHTML = FAVS.map(function (i) {
      var x = SVC[i];
      return '<a class="fav" href="servicios/"><span class="fav-cat">' + esc(catOf(x.c)[lang]) + "</span><b>" + esc(x[lang]) + '</b><span class="fav-d">' + esc(desc(x)) + '</span><span class="fav-p">' + esc(price(x)) + "</span></a>";
    }).join("");
    var r = REVIEWS[0];
    $("rev-teaser").innerHTML = stars() + "<blockquote>“" + esc(r[lang]) + "”</blockquote><figcaption><b>" + esc(r.n) + "</b><span>" + esc(SVC[r.s][lang]) + '</span><span class="tag">' + esc(t("rv.sample")) + "</span></figcaption>";
  }

  /* ---------- Servicios + cotizador ---------- */
  var filter = "all", picked = [];
  function renderChips() {
    var html = '<button type="button" data-f="all" aria-pressed="' + (filter === "all") + '">' + esc(t("svc.all")) + "</button>";
    CATS.forEach(function (c) { html += '<button type="button" data-f="' + c.id + '" aria-pressed="' + (filter === c.id) + '">' + esc(c[lang]) + "</button>"; });
    $("chips").innerHTML = html;
  }
  function renderList() {
    var html = "";
    CATS.forEach(function (c) {
      if (filter !== "all" && filter !== c.id) return;
      html += '<section class="cat" aria-labelledby="cat-' + c.id + '"><h2 id="cat-' + c.id + '">' + esc(c[lang]) + "</h2>";
      SVC.forEach(function (x, i) {
        if (x.c !== c.id) return;
        var on = picked.indexOf(i) > -1, label = on ? t("svc.added") : t("svc.add");
        html += '<div class="row"><div class="row-t"><b>' + esc(x[lang]) + "</b><span>" + esc(desc(x)) + '</span></div><span class="row-p">' + esc(price(x)) +
          '</span><button type="button" class="add" data-i="' + i + '" aria-pressed="' + on + '" aria-label="' + esc(label + ": " + x[lang]) + '">' + esc(label) + "</button></div>";
      });
      html += "</section>";
    });
    $("svc-list").innerHTML = html;
  }
  function quoteSum() {
    var sum = 0, from = false;
    picked.forEach(function (i) { sum += SVC[i].p; if (SVC[i].from) from = true; });
    return { sum: sum, from: from, text: (from ? t("svc.from") + " " : "") + money(sum) };
  }
  function renderQuote() {
    var q = quoteSum();
    $("q-lines").innerHTML = picked.length ? picked.map(function (i) {
      var x = SVC[i];
      return '<div class="q-line"><span>' + esc(x[lang]) + "</span><span>" + esc(price(x)) + '</span><button type="button" class="q-x" data-x="' + i + '" aria-label="' + esc(t("q.remove") + ": " + x[lang]) + '">×</button></div>';
    }).join("") : '<p class="empty">' + esc(t("q.empty")) + "</p>";
    $("q-sum").textContent = q.text;
    $("q-from").hidden = !q.from;
    $("q-clear").hidden = !picked.length;
    $("qbar").hidden = !picked.length;
    $("qbar-text").textContent = t("q.bar")(picked.length, q.text);
    document.body.classList.toggle("has-qbar", picked.length > 0);
  }
  function renderPrint() {
    var html = "";
    CATS.forEach(function (c) {
      html += '<div class="pr-cat"><h3>' + esc(c[lang]) + "</h3>";
      SVC.forEach(function (x) { if (x.c === c.id) html += '<div class="pr-row"><span>' + esc(x[lang]) + "</span><span>" + esc(price(x)) + "</span></div>"; });
      html += "</div>";
    });
    $("pr-cols").innerHTML = html;
  }
  function renderServices() { renderChips(); renderList(); renderQuote(); renderPrint(); }
  function bindServices() {
    $("chips").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]"); if (!b) return;
      filter = b.getAttribute("data-f"); renderChips(); renderList();
      var again = document.querySelector('#chips button[data-f="' + filter + '"]'); if (again) again.focus();
    });
    $("svc-list").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (!b) return;
      var i = Number(b.getAttribute("data-i")), k = picked.indexOf(i);
      if (k > -1) picked.splice(k, 1); else picked.push(i);
      renderList(); renderQuote();
      var again = document.querySelector('#svc-list button[data-i="' + i + '"]'); if (again) again.focus();
    });
    $("q-lines").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-x]"); if (!b) return;
      var k = picked.indexOf(Number(b.getAttribute("data-x"))); if (k > -1) picked.splice(k, 1);
      renderList(); renderQuote(); $("q-title").focus();
    });
    $("q-clear").addEventListener("click", function () { picked = []; renderList(); renderQuote(); $("q-title").focus(); });
    $("q-send").addEventListener("click", function () {
      if (!picked.length) { openSheet(t("q.emptyTitle"), "", t("q.emptyNote")); return; }
      var q = quoteSum();
      var msg = t("q.hi") + "\n" + picked.map(function (i) { return "• " + SVC[i][lang] + " (" + price(SVC[i]) + ")"; }).join("\n") +
        "\n" + t("q.totalMsg") + ": " + q.text + "\n" + t("q.ask");
      openSheet(t("m.waTitle"), msg, t("m.waNote"));
    });
    $("print").addEventListener("click", function () { window.print(); });
  }

  /* ---------- Galería ---------- */
  var cur = 0, lbLast = null;
  function art(g) { return '<div class="art" style="background:' + g.bg + ";color:" + g.fg + '">' + ICONS[g.icon] + "</div>"; }
  function renderGallery() {
    $("gal").innerHTML = GAL.map(function (g, i) {
      return '<button type="button" class="ph" data-g="' + i + '">' + art(g) + '<span class="ph-cap"><b>' + esc(g[lang]) + "</b><span>" + esc(t("gal.photo")) + "</span></span></button>";
    }).join("");
    if (!$("lb").hidden) showLb(cur);
  }
  function showLb(i) {
    cur = (i + GAL.length) % GAL.length;
    var g = GAL[cur];
    $("lb-art").innerHTML = art(g);
    $("lb-cap").textContent = g[lang];
    $("lb-count").textContent = t("lb.count")(cur + 1, GAL.length);
  }
  function openLb(i) { lbLast = document.activeElement; showLb(i); $("lb").hidden = false; document.body.classList.add("no-scroll"); $("lb-x").focus(); }
  function closeLb() { $("lb").hidden = true; document.body.classList.remove("no-scroll"); if (lbLast && lbLast.focus) lbLast.focus(); }
  function bindGallery() {
    $("gal").addEventListener("click", function (e) { var b = e.target.closest("button[data-g]"); if (b) openLb(Number(b.getAttribute("data-g"))); });
    $("lb-x").addEventListener("click", closeLb);
    $("lb-prev").addEventListener("click", function () { showLb(cur - 1); });
    $("lb-next").addEventListener("click", function () { showLb(cur + 1); });
    $("lb").addEventListener("click", function (e) { if (e.target === $("lb")) closeLb(); });
  }

  /* ---------- Reseñas ---------- */
  function renderReviews() {
    $("reviews").innerHTML = REVIEWS.map(function (r) {
      return '<figure class="rv">' + stars() + "<blockquote>“" + esc(r[lang]) + "”</blockquote><figcaption><b>" + esc(r.n) + "</b><span>" + esc(SVC[r.s][lang]) + '</span><span class="tag">' + esc(t("rv.sample")) + "</span></figcaption></figure>";
    }).join("");
  }
  function bindReviews() { $("rv-leave").addEventListener("click", function () { openSheet(t("m.revTitle"), "", t("m.revNote")); }); }

  /* ---------- Contacto + citas ---------- */
  var days = [];
  function bookDays() {
    var n = prNow(), out = [];
    for (var i = 0; out.length < 6 && i < 14; i++) {
      var d = new Date(n.d.getTime() + i * 86400000), wd = d.getUTCDay(), hh = HOURS[wd];
      if (!hh) continue;
      if (i === 0 && n.h >= hh[1] - 1) continue;
      out.push({ i: i, wd: wd, date: d.getUTCDate(), mo: d.getUTCMonth(), hh: hh });
    }
    return out;
  }
  function dayText(o) {
    var L = S[lang];
    return lang === "es" ? L.days[o.wd] + " " + o.date + " de " + L.months[o.mo] : L.days[o.wd] + ", " + L.months[o.mo] + " " + o.date;
  }
  function dayLabel(o) {
    var pre = o.i === 0 ? t("bk.today") : o.i === 1 ? t("bk.tomorrow") : "";
    return cap(pre ? pre + ", " + dayText(o) : dayText(o));
  }
  function slots(o) {
    var n = prNow(), out = [];
    for (var h = o.hh[0]; h <= o.hh[1] - 1; h++) { if (o.i === 0 && h <= n.h) continue; out.push(h); }
    return out;
  }
  function renderTimes(keep) {
    var o = days[$("bk-day").selectedIndex] || days[0], sel = $("bk-time"), ti = keep ? sel.selectedIndex : 0;
    sel.innerHTML = slots(o).map(function (h) { return '<option value="' + h + '">' + fmtH(h) + "</option>"; }).join("");
    sel.selectedIndex = Math.max(0, Math.min(ti, sel.options.length - 1));
  }
  function renderHours() {
    var n = prNow();
    $("hours").innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) {
      var hh = HOURS[d];
      return "<div" + (d === n.day ? ' class="today"' : "") + "><dt>" + esc(cap(t("days")[d])) + "</dt><dd>" + (hh ? fmtH(hh[0]) + " – " + fmtH(hh[1]) : esc(t("closed"))) + "</dd></div>";
    }).join("");
  }
  function renderContact() {
    var svcSel = $("bk-service"), si = svcSel.selectedIndex, html = "";
    CATS.forEach(function (c) {
      html += '<optgroup label="' + esc(c[lang]) + '">';
      SVC.forEach(function (x, i) { if (x.c === c.id) html += '<option value="' + i + '">' + esc(x[lang] + " · " + price(x)) + "</option>"; });
      html += "</optgroup>";
    });
    svcSel.innerHTML = html; svcSel.selectedIndex = Math.max(0, si);
    days = bookDays();
    var daySel = $("bk-day"), di = daySel.selectedIndex;
    daySel.innerHTML = days.map(function (o, k) { return '<option value="' + k + '">' + esc(dayLabel(o)) + "</option>"; }).join("");
    daySel.selectedIndex = Math.max(0, di);
    renderTimes(true);
    renderHours();
  }
  function bindContact() {
    $("bk-day").addEventListener("change", function () { renderTimes(false); });
    $("book").addEventListener("submit", function (e) {
      e.preventDefault();
      var x = SVC[Number($("bk-service").value)], o = days[$("bk-day").selectedIndex] || days[0];
      var name = $("bk-name").value.trim() || t("bk.anon");
      var msg = t("bk.msg")(name, x[lang], dayText(o), lang === "es" ? at(Number($("bk-time").value)) : fmtH(Number($("bk-time").value)));
      openSheet(t("m.waTitle"), msg, t("m.waNote"));
    });
    $("ct-call").addEventListener("click", function () { openSheet(t("m.callTitle"), "", t("m.callNote")); });
    $("ct-save").addEventListener("click", function () {
      openSheet(t("m.saveTitle"), "", t("m.saveNote"), [{ label: t("m.saveDl"), href: ROOT + "assets/pomarrosa.vcf", download: "Salon-Pomarrosa.vcf" }]);
    });
  }

  /* ---------- Arranque ---------- */
  var RENDER = { inicio: renderHome, servicios: renderServices, galeria: renderGallery, resenas: renderReviews, contacto: renderContact };
  var BIND = { servicios: bindServices, galeria: bindGallery, resenas: bindReviews, contacto: bindContact };

  function applyAll() { applyStatic(); renderStatus(); if (RENDER[page]) RENDER[page](); }

  Array.prototype.forEach.call(document.querySelectorAll(".lang button"), function (b) {
    b.addEventListener("click", function () {
      lang = b.getAttribute("data-lang");
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      applyAll();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("a[data-dir]"), function (a) { a.href = DIR; });

  document.addEventListener("keydown", function (e) {
    var lb = $("lb");
    if (lb && !lb.hidden) {
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") showLb(cur - 1);
      else if (e.key === "ArrowRight") showLb(cur + 1);
      return;
    }
    if (e.key === "Escape" && !$("modal").hidden) closeSheet();
  });

  // En el teléfono el menú se desliza de lado: deja visible la página actual.
  var curLink = document.querySelector(".links a[aria-current]");
  if (curLink) {
    var nav = curLink.parentNode;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, curLink.offsetLeft - nav.offsetLeft - (nav.clientWidth - curLink.offsetWidth) / 2);
  }

  if (BIND[page]) BIND[page]();
  applyAll();
  setInterval(renderStatus, 60000);
})();
