/* =========================================================
   VISTA «ORDENAR MI PEDIDO» (pedido en el local)
   · «Ordenar mi pedido» (en cualquier sección) → ventana de modo.
   · «Estoy en el local» → esta vista, apilada sobre la sección de origen;
     la flecha ← vuelve exactamente a esa sección.
   · Menú por categorías con navegación fija, carrito lateral (escritorio)
     o barra inferior + ventana (móvil), y botón «Llamar al mesero».
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU, O = window.DaEnzoOrder, cart = O.cart, esc = O.esc, ICON = O.icon;
  var DE = window.DaEnzo, R = window.DaEnzoReviews, NS = window.DaEnzoAbout;
  var view = document.getElementById('order'); if (!view) return;
  var scroller = view.querySelector('.od-scroll'), content = view.querySelector('#odContent'), bar = view.querySelector('.od-bar');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ROUTE = '#pedido-local', ROUTE_D = '#pedido-delivery';
  function routeOf(m){ return m === 'delivery' ? ROUTE_D : ROUTE; }
  function hashRoute(){ return location.hash.split('?')[0]; }
  var isOpen = false, pushed = false, lastOpener = null;

  function typeHTML(t){ var i = 0; return t.split('').map(function(c){ return c === ' ' ? '<span class="ab-type-sp"> </span>' : '<span class="ab-type-ch" style="--k:' + (i++) + '">' + esc(c) + '</span>'; }).join(''); }
  function hasOptions(p){ return (p.variants || []).length > 1 || (p.extras || []).length > 0; }
  function fromPrice(p){ return ((p.variants || []).length > 1 ? 'Desde ' : '') + O.money(p.price); }

  /* ---------- Tarjetas ---------- */
  function cardHTML(p, i, tag){
    var opts = hasOptions(p), img = p.images && p.images[0];
    return '<article class="od-card reveal" style="--i:' + (i % 6) + '" data-id="' + p.id + '">' +
      (img ? '<span class="od-card-img"><img src="' + esc(img.src) + '" alt="' + esc(img.alt) + '" style="object-position:' + esc(img.pos) + '" width="820" height="820" loading="lazy" decoding="async"></span>' : '') +
      '<div class="od-card-body">' +
        '<span class="ab-dish-tag od-card-tag">' + esc(tag) + '</span>' +
        '<h4 class="od-card-name">' + esc(p.name) + '</h4>' +
        '<p class="od-card-short">' + esc(p.short) + '</p>' +
        '<div class="od-card-foot">' +
          '<span class="od-card-price">' + fromPrice(p) + '</span>' +
          '<button type="button" class="od-card-open" data-open>' + (opts ? (p.category === 'pizzas' ? 'Personalizar' : 'Elegir') : 'Ver detalle') + '<span class="sr-only"> ' + esc(p.name) + '</span></button>' +
          (!opts ? '<button type="button" class="odr-add od-card-quick" data-quick aria-label="Agregar ' + esc(p.name) + ' al carrito">' + ICON.plus + '</button>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }
  function drinkCard(p){
    var vs = p.variants || [];
    return '<article class="od-dcard reveal" data-id="' + p.id + '">' +
      '<div><b>' + esc(p.name) + '</b><span>' + esc(p.short || '') + (vs.length > 1 ? ' · ' + vs.map(function(v){ return v.label; }).join(' / ') : '') + '</span></div>' +
      '<span class="od-card-price">' + fromPrice(p) + '</span>' +
      '<button type="button" class="odr-add" data-' + (vs.length > 1 ? 'open' : 'quick') + ' aria-label="' + (vs.length > 1 ? 'Elegir presentación de ' : 'Agregar ') + esc(p.name) + '">' + ICON.plus + '</button>' +
    '</article>';
  }

  /* ---------- Secciones ---------- */
  function catHead(c, extra){
    return '<header class="od-cat-head' + (c.image ? '' : ' od-cat-head--noimg') + '">' +
      (c.image ? '<figure class="od-cat-img reveal"><img src="' + esc(c.image.src) + '" alt="' + esc(c.image.alt) + '" style="object-position:' + esc(c.image.pos) + '" loading="lazy" decoding="async"></figure>' : '') +
      '<div class="od-cat-txt"><p class="ab-chapter reveal">' + esc(c.kicker) + '</p><h2 class="od-cat-title reveal">' + esc(c.title) + '</h2><p class="ab-p reveal">' + esc(c.intro) + '</p>' + (extra || '') + '</div>' +
    '</header>';
  }
  function section(c){
    var items = M.products.filter(function(p){ return p.category === c.id; });
    var html = '<section class="od-cat od-cat--' + c.id + '" id="odc-' + c.id + '" data-cat="' + c.id + '" aria-labelledby="odt-' + c.id + '">';
    if (c.id === 'pizzas'){
      html += catHead(c) + ('<div class="od-types" role="list">' + c.groups.map(function(g){
        var first = items.filter(function(p){ return p.group === g.id; })[0];
        return '<button type="button" role="listitem" class="od-type reveal" data-group="' + g.id + '"><span class="od-type-img"><img src="' + esc(first.images[0].src) + '" alt="" loading="lazy" style="object-position:' + esc(first.images[0].pos) + '"></span><b>' + esc(g.label) + '</b><small>' + esc(g.note) + '</small></button>';
      }).join('') + '</div>');   // fila propia a todo el ancho: los botones nunca se cortan
      c.groups.forEach(function(g){
        var gi = items.filter(function(p){ return p.group === g.id; });
        html += '<div class="od-group" id="odg-' + g.id + '"><h3 class="od-pill reveal">' + esc(g.label) + '</h3><div class="od-grid">' + gi.map(function(p, i){ return cardHTML(p, i, g.label); }).join('') + '</div></div>';
      });
    } else if (c.id === 'bebidas'){
      var ph = function(key, label, ic){ var im = M.drinks.images[key]; return im ? '<figure class="odr-photo reveal"><img src="' + esc(im.src) + '" alt="' + esc(im.alt) + '" loading="lazy"><figcaption>' + esc(label) + '</figcaption></figure>' : '<figure class="odr-photo odr-photo--ph reveal">' + ic + '<figcaption>' + esc(label) + '<small>Foto por agregar</small></figcaption></figure>'; };
      html += '<header class="od-cat-head od-cat-head--drinks"><div class="od-cat-txt"><p class="ab-chapter reveal">' + esc(c.kicker) + '</p><h2 class="od-cat-title reveal">' + esc(c.title) + '</h2><p class="ab-p reveal">' + esc(c.intro) + '</p>' +
        '<button type="button" class="oc-btn oc-btn--primary reveal" data-drinks>' + ICON.glass + 'Ver carta de bebidas</button></div>' +
        '<div class="od-drinks-art"><div class="odr-sign reveal" role="img" aria-label="Cócteles">' + ICON.glass + '<span class="odr-sign-word">' + 'COCTELES'.split('').map(function(ch){ return '<span>' + ch + '</span>'; }).join('') + '</span><span class="odr-sign-dots" aria-hidden="true">• • • • • •</span></div>' +
        ph('cocteles','Cócteles de la casa', ICON.glass) + ph('cafe','Café y frappuccino', ICON.cup) + '</div></header>';
      M.drinks.groups.forEach(function(g){
        html += '<div class="od-group"><h3 class="od-pill reveal">' + esc(g.label) + '</h3><div class="od-dgrid">' + items.filter(function(p){ return p.group === g.id; }).map(drinkCard).join('') + '</div></div>';
      });
    } else {
      html += catHead(c) + '<div class="od-grid">' + items.map(function(p, i){ return cardHTML(p, i, c.label); }).join('') + '</div>';
    }
    return html.replace('class="od-cat-title', 'id="odt-' + c.id + '" class="od-cat-title') + '</section>';
  }

  /* ---------- Botones desplegables por categoría ----------
     Cada categoría es un botón: al pulsarlo se despliegan sus platos (mismo diseño),
     y al pulsarlo otra vez se recogen. «Bebidas» abre la carta de bebidas. */
  function accordion(c){
    var n = M.products.filter(function(p){ return p.category === c.id; }).length;
    var thumb = c.image ? '<span class="od-acc-img"><img src="' + esc(c.image.src) + '" alt="" loading="lazy" style="object-position:' + esc(c.image.pos) + '"></span>'
                        : '<span class="od-acc-img od-acc-img--ic">' + ICON.glass + '</span>';
    var head = thumb + '<span class="od-acc-t"><b>' + esc(c.label) + '</b><small>' + esc(c.kicker) + ' · ' + n + ' ' + (n === 1 ? 'opción' : 'opciones') + '</small></span>';
    if (c.id === 'bebidas') return '<div class="od-acc od-acc--drinks reveal" data-cat="bebidas"><button type="button" class="od-acc-btn" data-drinks>' + head +
      '<span class="od-acc-chev od-acc-chev--open" aria-hidden="true">' + ICON.arrR + '</span></button></div>';
    return '<div class="od-acc reveal" data-cat="' + c.id + '">' +
      '<button type="button" class="od-acc-btn" aria-expanded="false" aria-controls="odp-' + c.id + '" data-acc="' + c.id + '">' + head +
      '<span class="od-acc-chev" aria-hidden="true">' + ICON.plus + '</span></button>' +
      '<div class="od-acc-panel" id="odp-' + c.id + '" role="region" aria-label="' + esc(c.label) + '" inert><div class="od-acc-in">' + section(c) + '</div></div>' +
    '</div>';
  }
  function toggleAcc(id, force){
    var acc = content.querySelector('.od-acc[data-cat="' + id + '"]'); if (!acc) return false;
    var btn = acc.querySelector('[data-acc]'), panel = acc.querySelector('.od-acc-panel');
    var open = force !== undefined ? force : btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    acc.classList.toggle('is-open', open);
    panel.inert = !open;
    if (open) setTimeout(armReveals, 60);
    return open;
  }

  var H = M.hero;
  content.innerHTML =
    '<section class="od-hero" aria-labelledby="odHeroT">' +
      '<div class="od-hero-txt">' +
        '<p class="od-brand" aria-label="' + esc(H.brand) + '"><span aria-hidden="true">' + typeHTML(H.brand) + '</span></p>' +
        '<h1 class="od-hero-title" id="odHeroT">' + esc(H.title) + '</h1>' +
        '<p class="od-hero-lead">' + esc(H.lead) + '</p>' +
        '<p class="od-hero-aside">' + esc(H.aside) + '</p>' +
        '<div class="od-hero-acts"><button type="button" class="oc-btn oc-btn--cream" data-jump="pizzas">Ver el menú ' + ICON.arrow + '</button><span class="od-table-chip" data-table></span></div>' +
      '</div>' +
      '<figure class="od-hero-img"><img src="' + esc(H.image.src) + '" alt="' + esc(H.image.alt) + '" style="object-position:' + esc(H.image.pos) + '" fetchpriority="high"></figure>' +
    '</section>' +
    '<div class="od-main" id="odMain">' +
      '<div class="od-menu"><p class="ab-chapter od-menu-k reveal">Nuestro menú</p>' + M.categories.map(accordion).join('') +
        '<p class="ab-demo-note">Menú, precios y algunas fotos son de demostración. Nombres e ingredientes basados en la carta de Da Enzo.</p></div>' +
      '<aside class="od-aside" aria-labelledby="odCartT"><div class="od-cart">' +
        '<div class="od-cart-head"><h2 id="odCartT">Tu pedido</h2><span class="od-badge" data-cart-count>0</span></div>' +
        '<div class="od-cart-body" id="odCartBody"></div>' +
      '</div></aside>' +
    '</div>';

  /* ---------- Interacción del menú ---------- */
  content.addEventListener('click', function(e){
    var j = e.target.closest('[data-jump]'); if (j){ e.preventDefault(); return scrollToEl(content.querySelector('.od-menu')); }
    var ab = e.target.closest('[data-acc]');
    if (ab){ if (toggleAcc(ab.dataset.acc)) setTimeout(function(){ scrollToEl(ab); }, reduced ? 0 : 120); return; }
    var g = e.target.closest('[data-group]'); if (g) return scrollToEl(document.getElementById('odg-' + g.dataset.group));
    if (e.target.closest('[data-drinks]') && !e.target.closest('.od-cart')) return O.drinks.open(e.target.closest('button'));
    var card = e.target.closest('[data-id]'); if (!card || card.closest('.od-cart')) return;
    var id = card.dataset.id;
    if (e.target.closest('[data-quick]')) return O.quickAdd(id, null, e.target.closest('button'));
    if (e.target.closest('[data-open]') || card.classList.contains('od-card')){
      /* el plato elegido queda marcado con borde naranja, como en «Sobre nosotros» */
      content.querySelectorAll('.od-card.is-selected').forEach(function(x){ x.classList.remove('is-selected'); });
      card.classList.add('is-selected');
      O.productModal.open(id, { opener: card.querySelector('[data-open]') || e.target.closest('button') });
    }
  });

  function navH(){ return bar.offsetHeight + 12; }
  function scrollToEl(el){ if (!el) return; scroller.scrollTo({ top: el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - navH() + 4, behavior: reduced ? 'auto' : 'smooth' }); }
  function scrollTo(cat){ toggleAcc(cat, true); setTimeout(function(){ scrollToEl(content.querySelector('.od-acc[data-cat="' + cat + '"]')); }, 80); }

  var revIO = null;
  function armReveals(){
    var els = content.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)){ els.forEach(function(el){ el.classList.add('is-in'); }); return; }
    if (revIO) revIO.disconnect();
    revIO = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting){ x.target.classList.add('is-in'); revIO.unobserve(x.target); } }); }, { root: scroller, threshold: 0.12 });
    els.forEach(function(el){ if (!el.classList.contains('is-in')) revIO.observe(el); });
  }
  scroller.addEventListener('scroll', function(){ bar.classList.toggle('is-solid', scroller.scrollTop > 40); }, { passive:true });

  /* ---------- Carrito ---------- */
  var cartBody = content.querySelector('#odCartBody');
  O.bindCart(cartBody);
  function paintCart(info){
    if (!cartBody) return;
    cartBody.innerHTML = O.cartHTML();
    if (O.cartWin.win.classList.contains('open')) O.cartWin.body.innerHTML = O.cartHTML();
    var t = cart.totals();
    document.querySelectorAll('#order [data-cart-count]').forEach(function(b){
      b.textContent = t.units;
      if (info && info.type === 'add'){ b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
    view.querySelector('[data-cart-total]').textContent = O.money(t.total);
    view.querySelector('.od-continue--m').disabled = !t.lines;
    view.classList.toggle('has-items', t.lines > 0);
    if (info && info.key){
      document.querySelectorAll('.oc-line[data-key="' + (window.CSS && CSS.escape ? CSS.escape(info.key) : info.key) + '"]').forEach(function(li){ li.classList.add('is-flash'); });
    }
  }
  cart.onChange(paintCart);
  paintCart();

  view.querySelector('#odMbarCart').addEventListener('click', function(e){ O.cartWin.open(e.currentTarget); });
  view.querySelector('.od-continue--m').addEventListener('click', function(e){ O.review.open(e.currentTarget); });
  view.querySelector('#odMbarDrinks').addEventListener('click', function(e){ O.drinks.open(e.currentTarget); });

  /* ---------- Cuenta ---------- */
  var acc = view.querySelector('#odAccount');
  function paintAccount(s){ acc.querySelector('.rv-account-label').textContent = s ? s.name + (s.real ? '' : ' · demo') : 'Acceder'; acc.classList.toggle('is-demo', !!s); }
  R.Auth.onChange(paintAccount); paintAccount(R.Auth.session());
  acc.addEventListener('click', function(){ R.Auth.open(acc); });
  /* Recordatorio de inicio de sesión (mismo comportamiento que en Reseñas y Sobre nosotros) */
  var loginPrompt = R.LoginPrompt(view.querySelector('#odLogin'), { initialDelayMs: 8000, autoHideMs: 15000 });

  /* …y en la pantalla principal: solo mientras está visible (ninguna otra sección encima) */
  var homeLogin = document.getElementById('homeLogin');
  if (homeLogin){
    var homePrompt = R.LoginPrompt(homeLogin, { initialDelayMs: 7000, autoHideMs: 15000 });
    var anyView = function(){ return /in-(reviews|about|order)/.test(document.body.className); };
    document.addEventListener('daenzo:hero', function(e){ if (e.detail.visible && !anyView()) homePrompt.start(); else homePrompt.stop(); });
    if (!anyView() && !location.hash) homePrompt.start();
  }

  /* ---------- Mesa y «Llamar al mesero» ---------- */
  var label = O.table.label();
  view.querySelector('#odTable').textContent = label;
  content.querySelector('[data-table]').textContent = label;
  var waiterEl = view.querySelector('#odWaiter');
  var waiter = NS.FloatingOrder(waiterEl, view, function(){
    DE.toast('La función para llamar al mesero estará disponible cuando conectemos el sistema del restaurante.');
  }, { storageKey: 'daenzo.waiterButton.pos',
        /* se mueve libremente y siempre queda por encima de todo; solo se aparta de la
           barra inferior del móvil y del botón «Ver mi pedido» para no taparlos */
        avoid: function(){ return [view.querySelector('#odMbar'), document.getElementById('odPlaced')]; } });
  window.addEventListener('resize', function(){ waiter.refresh(); });

  /* ---------- Modalidad: mismo menú, textos y acciones según local / delivery ---------- */
  function applyMode(){
    var dl = O.orderMode.is('delivery'), T = dl ? Object.assign({}, H, H.delivery) : H;
    view.classList.toggle('is-delivery', dl);
    view.setAttribute('aria-label', dl ? 'Pedido a domicilio · Da Enzo' : 'Ordenar mi pedido · Da Enzo');
    content.querySelector('#odHeroT').textContent = T.title;
    content.querySelector('.od-hero-lead').textContent = T.lead;
    content.querySelector('.od-hero-aside').textContent = T.aside;
    content.querySelector('[data-table]').textContent = dl ? 'Pedido a domicilio' : label;
    bar.querySelector('.od-bar-name span').textContent = dl ? '· A domicilio' : '· Tu pedido';
    waiterEl.hidden = dl;                       // «Llamar al mesero» solo existe en el local
    if (!dl && isOpen) waiter.show();
    paintCart();
  }
  O.orderMode.onChange(applyMode);

  /* ---------- Abrir / cerrar ---------- */
  function heroVisible(v){ document.dispatchEvent(new CustomEvent('daenzo:hero', { detail:{ visible: v } })); }
  function openLocal(opener, fromHistory){ openView('local', opener, fromHistory); }
  function openDelivery(opener, fromHistory){ openView('delivery', opener, fromHistory); }
  function openView(mode, opener, fromHistory){
    if (isOpen){                                     // ya abierta: solo cambia de modalidad
      if (!O.orderMode.is(mode)){ O.orderMode.set(mode); scroller.scrollTop = 0; if (!fromHistory) history.replaceState({ view:'pedido' }, '', routeOf(mode)); }
      return;
    }
    O.orderMode.set(mode); applyMode();
    isOpen = true; lastOpener = opener || document.activeElement;
    view.hidden = false; view.inert = false; view.setAttribute('aria-hidden','false');
    document.body.classList.add('in-order');
    scroller.scrollTop = 0; bar.classList.remove('is-solid');
    var b = content.querySelector('.od-brand'); b.classList.remove('is-typing'); void b.offsetWidth; b.classList.add(reduced ? 'is-typed' : 'is-typing');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ view.classList.add('open'); }); });
    if (!fromHistory && hashRoute() !== routeOf(mode)){ history.pushState({ view:'pedido' }, '', routeOf(mode)); pushed = true; }
    armReveals(); if (mode === 'local') waiter.show(); loginPrompt.start();
    setTimeout(function(){ heroVisible(false); view.querySelector('.rv-back').focus({ preventScroll:true }); }, 380);
  }
  function close(fromHistory, then){
    if (!isOpen){ if (then) then(); return; }
    isOpen = false;
    if (DE.closeWindow) DE.closeWindow({ silent:true });
    if (revIO) revIO.disconnect();
    loginPrompt.stop();
    view.classList.remove('open'); document.body.classList.remove('in-order');
    view.inert = true; view.setAttribute('aria-hidden','true');
    if (!document.body.classList.contains('in-reviews') && !document.body.classList.contains('in-about')) heroVisible(true);
    setTimeout(function(){ if (!isOpen) view.hidden = true; }, 420);
    if (!fromHistory){
      if (pushed){ pushed = false; history.back(); }
      else if (hashRoute() === ROUTE || hashRoute() === ROUTE_D) history.replaceState(null, '', location.pathname + location.search);
    } else pushed = false;
    if (then) setTimeout(then, 150);   // espera a que el historial termine de volver
    else { var back = lastOpener && document.contains(lastOpener) && lastOpener.offsetParent ? lastOpener : null; setTimeout(function(){ back && back.focus({ preventScroll:true }); }, 60); }
  }
  view.querySelector('.rv-back').addEventListener('click', function(){ close(false); });
  window.addEventListener('popstate', function(){ var h = hashRoute(); if (h === ROUTE) openLocal(null, true); else if (h === ROUTE_D) openDelivery(null, true); else close(true); });

  /* La ruta de «Ordenar mi pedido» que ya usan todas las secciones */
  DE.routes['#ordenar'] = function(a){ O.mode.open(a); };
  DE.order = {
    openLocal: openLocal, openDelivery: openDelivery, close: close, scrollTo: scrollTo,
    showCart: function(){ if (matchMedia('(max-width: 860px)').matches) O.cartWin.open(); else { var c = content.querySelector('.od-cart'); c.scrollIntoView({ block:'nearest' }); var f = c.querySelector('button'); f && f.focus(); } }
  };

  view.inert = true;
  /* Entrada directa: enlace #pedido-local o QR/NFC con ?mesa=… */
  if (hashRoute() === ROUTE_D) openDelivery(null, true);
  else if (hashRoute() === ROUTE || O.table.get() && new URLSearchParams(location.search).has(M.tables.param)) openLocal(null, hashRoute() === ROUTE);
})();
