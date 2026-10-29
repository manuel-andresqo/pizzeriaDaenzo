/* =========================================================
   «ORDENAR MI PEDIDO» — VENTANAS Y CARRITO (interfaz)
   Todas las ventanas usan el gestor existente (DaEnzo.openWindow):
   una sola abierta a la vez, Escape, foco y capa de fondo comunes.
     · modo       ¿Cómo quieres disfrutar Da Enzo?
     · producto   detalle + galería + variantes + extras + cantidad
     · bebidas    carta de bebidas con cócteles y café
     · revision   ¿Está todo listo? + recomendaciones
     · confirmacion  pedido de DEMOSTRACIÓN
     · resumen    Ver mi pedido
     · carrito    carrito completo (móvil)
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU, O = window.DaEnzoOrder, cart = O.cart;
  var DE = window.DaEnzo;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, r){ return (r || document).querySelector(s); };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  O.esc = esc;
  var ICON = {
    x:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12"/></svg>',
    minus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9"/></svg>',
    plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>',
    edit:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3z"/></svg>',
    trash:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
    arrL:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    arrR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    zoom:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    check:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
    arrow:'<svg viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    glass:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M10 8h28L24 24zM24 24v14M16 40h16"/><circle cx="33" cy="9" r="3"/></svg>',
    cup:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h24v8a12 12 0 0 1-24 0zM33 21h3a4 4 0 0 1 0 8h-4M7 40h30M17 8c-2 3 2 4 0 7M23 8c-2 3 2 4 0 7"/></svg>'
  };
  O.icon = ICON;

  var catById = {}; M.categories.forEach(function(c){ catById[c.id] = c; });
  O.category = function(id){ return catById[id]; };

  /* Descripción breve de la configuración de una línea */
  O.lineMeta = function(l){
    var p = O.product(l.productId), v = O.variantOf(p, l.variantId), bits = [];
    if (v && (p.variants || []).length > 1) bits.push(v.label);
    return bits;
  };
  O.lineExtras = function(l){ return (l.extras || []).map(function(e){ return M.extras[e].label; }); };

  /* Extras compactos: una sola píldora «2 extras · +$3,00» que despliega la lista
     con sus precios. Así todas las líneas del carrito mantienen la misma altura. */
  var openX = {};            // líneas con los extras desplegados (se conserva al redibujar)
  var CHEV = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3"/></svg>';
  var xSeq = 0;
  O.extrasHTML = function(id, list){    // list: [{ label, price }]
    if (!list.length) return '';
    var sum = list.reduce(function(a, x){ return a + (x.price || 0); }, 0), open = !!openX[id], dom = 'ocx-' + (++xSeq);
    return '<div class="oc-x' + (open ? ' is-open' : '') + '">' +
      '<button type="button" class="oc-xbtn" data-xtoggle="' + esc(id) + '" aria-expanded="' + open + '" aria-controls="' + dom + '">' +
        '<span class="oc-xn">' + list.length + '</span><span class="oc-xl">' + (list.length === 1 ? 'Extra' : 'Extras') + '</span>' + (sum ? '<em>+' + O.money(sum) + '</em>' : '') + CHEV +
      '</button>' +
      '<ul class="oc-xlist" id="' + dom + '"' + (open ? '' : ' hidden') + '>' + list.map(function(x){
        return '<li><span>' + esc(x.label) + '</span><b>' + (x.price ? '+' + O.money(x.price) : 'Sin costo') + '</b></li>';
      }).join('') + '</ul>' +
    '</div>';
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-xtoggle]'); if (!b) return;
    e.stopPropagation();
    var id = b.dataset.xtoggle, open = !openX[id];
    if (open) openX[id] = 1; else delete openX[id];
    var wrap = b.closest('.oc-x'), list = wrap.querySelector('.oc-xlist');
    b.setAttribute('aria-expanded', String(open)); wrap.classList.toggle('is-open', open); list.hidden = !open;
  }, true);

  /* Totales según la modalidad: en Delivery el envío va en una línea aparte
     y, si no hay tarifa real configurada, NO se suma (se confirmará). */
  function isDelivery(){ return O.orderMode && O.orderMode.is('delivery'); }
  O.orderTotal = function(){ return isDelivery() ? O.deliveryService.totals().total : cart.totals().total; };
  O.sumHTML = function(t){
    var rows = '<div><dt>Productos</dt><dd>' + t.lines + ' ' + (t.lines === 1 ? 'línea' : 'líneas') + ' · ' + t.units + ' ' + (t.units === 1 ? 'unidad' : 'unidades') + '</dd></div>' +
               '<div><dt>Subtotal</dt><dd>' + O.money(t.subtotal) + '</dd></div>';
    if (!isDelivery()) return '<dl class="oc-sum">' + rows + '<div class="oc-sum-total"><dt>Total estimado</dt><dd>' + O.money(t.total) + '</dd></div></dl>' +
      '<p class="oc-price-note">' + esc(M.priceNote) + ' · sin cargos adicionales configurados.</p>';
    var d = O.deliveryService.totals();
    return '<dl class="oc-sum">' + rows +
      '<div class="oc-sum-ship"><dt>Envío a domicilio</dt><dd>' + (d.feePending ? '<span class="oc-pending">Se confirmará</span>' : O.money(d.fee)) + '</dd></div>' +
      '<div class="oc-sum-total"><dt>Total' + (d.feePending ? ' sin envío' : '') + '</dt><dd>' + O.money(d.total) + '</dd></div></dl>' +
      '<p class="oc-price-note">' + esc(M.priceNote) + (d.feePending ? ' · el costo de envío aún no está definido: te lo confirmaremos antes de completar el pedido.' : '') + '</p>';
  };

  function onClose(win, fn){
    new MutationObserver(function(){ if (!win.classList.contains('open')) fn(); }).observe(win, { attributes:true, attributeFilter:['class'] });
  }

  /* =========================================================
     CARRITO (se dibuja en el panel lateral y en la ventana móvil)
     ========================================================= */
  O.cartHTML = function(){
    var t = cart.totals(), lines = cart.lines();
    var notice = cart.stage() === 'confirmed' ? '<p class="oc-note oc-note--ok">' + ICON.check + 'Selección confirmada (demostración).</p>'
               : cart.changedAfterConfirm() ? '<p class="oc-note">Has modificado tu pedido después de confirmarlo.</p>' : '';
    if (!lines.length) return '' +
      '<div class="oc-empty">' +
        '<img src="assets/logo-da-enzo.png" width="64" height="64" alt="">' +
        '<p class="oc-empty-t">Tu próxima experiencia favorita empieza con una pizza.</p>' +
        '<button type="button" class="oc-btn oc-btn--ghost" data-explore>Explorar el menú</button>' +
      '</div>' +
      '<div class="oc-foot"><button type="button" class="od-continue" data-continue disabled aria-describedby="ocHint">Continuar pedido</button>' +
      '<p class="oc-hint" id="ocHint">Añade al menos un producto para continuar.</p>' +
      '<button type="button" class="oc-drinks" data-drinks>' + ICON.glass + 'Ver carta de bebidas</button></div>';
    return notice +
      '<ul class="oc-lines">' + lines.map(function(l){
        var p = O.product(l.productId), meta = O.lineMeta(l), ex = O.lineExtras(l), unit = O.unitPrice(l.productId, l.variantId, l.extras);
        return '<li class="oc-line" data-key="' + esc(l.key) + '">' +
          '<button type="button" class="oc-thumb" data-edit aria-label="Ver o modificar ' + esc(p.name) + '">' + ((p.images || p.cartImage) ? '<img src="' + esc((p.images ? p.images[0] : p.cartImage).src) + '" alt="" loading="lazy" style="object-position:' + esc((p.images ? p.images[0] : p.cartImage).pos) + '">' : '<span>' + ICON.glass + '</span>') + '</button>' +
          '<div class="oc-info">' +
            '<button type="button" class="oc-name" data-edit>' + esc(p.name) + '</button>' +
            (p.available === false ? '<span class="oc-off">No disponible</span>' : '') +
            (meta.length ? '<span class="oc-meta">' + esc(meta.join(' · ')) + '</span>' : '') +
            '<span class="oc-unit">' + O.money(unit) + ' c/u</span>' +
          '</div>' +
          '<span class="oc-total">' + O.money(unit * l.qty) + '</span>' +
          (ex.length ? '<div class="oc-xrow">' + O.extrasHTML('c-' + l.key, (l.extras || []).map(function(x){ return M.extras[x]; })) + '</div>' : '') +
          '<div class="oc-right">' +
            '<div class="oc-qty" role="group" aria-label="Cantidad de ' + esc(p.name) + '">' +
              '<button type="button" data-dec aria-label="' + (l.qty === 1 ? 'Quitar' : 'Restar uno') + '">' + (l.qty === 1 ? ICON.trash : ICON.minus) + '</button>' +
              '<output aria-live="polite">' + l.qty + '</output>' +
              '<button type="button" data-inc aria-label="Sumar uno"' + (l.qty >= cart.MAX_QTY ? ' disabled' : '') + '>' + ICON.plus + '</button>' +
            '</div>' +
            '<div class="oc-acts"><button type="button" data-edit>' + ICON.edit + 'Editar</button><button type="button" data-remove>' + ICON.trash + 'Eliminar</button></div>' +
          '</div>' +
        '</li>';
      }).join('') + '</ul>' +
      O.sumHTML(t) +
      '<div class="oc-foot">' +
        '<button type="button" class="od-continue" data-continue><span>Continuar pedido</span><b>' + O.money(O.orderTotal()) + '</b></button>' +
        '<button type="button" class="oc-drinks" data-drinks>' + ICON.glass + 'Ver carta de bebidas</button>' +
        '<button type="button" class="oc-clear" data-clear>Vaciar carrito</button>' +
      '</div>';
  };

  /* Comportamiento del carrito (delegado: vale para cualquier contenedor) */
  O.bindCart = function(root){
    root.addEventListener('click', function(e){
      var li = e.target.closest('.oc-line'), key = li && li.dataset.key, l = key && cart.line(key);
      if (e.target.closest('[data-inc]') && l) return cart.setQty(key, l.qty + 1);
      if (e.target.closest('[data-dec]') && l) return cart.setQty(key, l.qty - 1);
      if (e.target.closest('[data-remove]') && l) return cart.remove(key);
      if (e.target.closest('[data-edit]') && l) return O.productModal.open(l.productId, { editKey:key, opener:e.target.closest('button') });
      if (e.target.closest('[data-continue]')) return O.review.open(e.target.closest('button'));
      if (e.target.closest('[data-drinks]')) return O.drinks.open(e.target.closest('button'));
      if (e.target.closest('[data-explore]')){ DE.closeWindow && DE.closeWindow({ silent:true }); return DE.order && DE.order.scrollTo('pizzas'); }
      var clr = e.target.closest('[data-clear]');
      if (clr){                                   // doble pulsación en lugar de confirm() del navegador
        if (clr.dataset.armed){ cart.clear(); DE.toast('Carrito vacío.'); return; }
        clr.dataset.armed = '1'; clr.textContent = '¿Vaciar todo? Toca de nuevo';
        setTimeout(function(){ if (document.contains(clr)){ delete clr.dataset.armed; clr.textContent = 'Vaciar carrito'; } }, 3500);
      }
    });
  };

  /* =========================================================
     MODO: ¿Cómo quieres disfrutar Da Enzo?
     ========================================================= */
  var modeWin = $('#win-modo');
  /* Sin fotografías: dos tarjetas tipográficas con su botón */
  $('.win-body', modeWin).innerHTML =
    '<p class="od-mode-sub">Elige cómo vas a disfrutar tus favoritos y te acompañaremos en el proceso.</p>' +
    '<div class="od-mode-grid">' +
      '<article class="od-mode-opt od-mode-opt--local">' +
        '<span class="od-mode-n" aria-hidden="true">01</span>' +
        '<p class="od-mode-k">En tu mesa</p>' +
        '<h3 class="od-mode-t">Comer en Da Enzo</h3>' +
        '<p class="od-mode-d">Explora el menú, personaliza tus favoritos y disfruta de la experiencia Da Enzo en tu mesa.</p>' +
        '<button type="button" class="oc-btn oc-btn--primary od-mode-btn" data-mode="local">Pedir en el local ' + ICON.arrow + '</button>' +
      '</article>' +
      '<article class="od-mode-opt od-mode-opt--delivery">' +
        '<span class="od-mode-n" aria-hidden="true">02</span>' +
        '<p class="od-mode-k">A domicilio</p>' +
        '<h3 class="od-mode-t">Recibir en casa</h3>' +
        '<p class="od-mode-d">Elige tus favoritos, prepara tu pedido y disfruta del sabor de Da Enzo donde quieras.</p>' +
        '<button type="button" class="oc-btn oc-btn--cream od-mode-btn" data-mode="delivery">Pedir a domicilio ' + ICON.arrow + '</button>' +
      '</article>' +
    '</div>';
  modeWin.addEventListener('click', function(e){
    var b = e.target.closest('[data-mode]'); if (!b) return;
    DE.closeWindow({ silent:true });
    if (b.dataset.mode === 'local') DE.order.openLocal(); else DE.order.openDelivery();
  });
  O.mode = { open: function(opener){ DE.openWindow('modo', opener); } };

  /* =========================================================
     DETALLE DE PRODUCTO
     ========================================================= */
  var pWin = $('#win-producto'), pBody = $('.od-product-body', pWin);
  var P = null;   // { p, variantId, extras:Set, qty, editKey, gi, timer, hold }

  function pTotal(){ return O.unitPrice(P.p.id, P.variantId, Array.from(P.extras)) * P.qty; }
  function pUnit(){ return O.unitPrice(P.p.id, P.variantId, Array.from(P.extras)); }

  function galleryHTML(p){
    var imgs = p.images || [];
    return '<div class="op-gal' + (imgs.length > 1 ? ' has-many' : '') + '">' +
      '<div class="op-stage">' + imgs.map(function(im, i){
        return '<img class="op-slide' + (i === 0 ? ' is-active' : '') + '" src="' + esc(im.src) + '" alt="' + esc(im.alt) + '" style="object-position:' + esc(im.pos) + '"' + (i ? ' loading="lazy"' : '') + '>';
      }).join('') +
      '<button type="button" class="op-zoom" aria-label="Ver foto ampliada">' + ICON.zoom + '</button>' +
      (imgs.length > 1 ? '<button type="button" class="op-nav op-prev" aria-label="Foto anterior">' + ICON.arrL + '</button><button type="button" class="op-nav op-next" aria-label="Foto siguiente">' + ICON.arrR + '</button>' : '') +
      '</div>' +
      (imgs.length > 1 ? '<div class="op-thumbs" role="group" aria-label="Fotos">' + imgs.map(function(im, i){
        return '<button type="button" class="op-thumb" data-gi="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Foto ' + (i + 1) + ' de ' + imgs.length + '"><img src="' + esc(im.src) + '" alt="" loading="lazy"></button>';
      }).join('') + '</div>' : '') +
    '</div>';
  }

  function infoHTML(){
    var p = P.p, c = O.category(p.category), vs = p.variants || [], xs = p.extras || [];
    var isPizza = p.category === 'pizzas';
    return '<div class="op-info">' +
      '<p class="op-k">' + esc(c.label) + (p.group && c.groups ? ' · ' + esc(c.groups.filter(function(g){ return g.id === p.group; })[0].label) : '') + '</p>' +
      '<h2 class="op-name" id="t-producto">' + esc(p.name) + '</h2>' +
      '<p class="op-desc">' + esc(p.description || p.short) + '</p>' +
      '<p class="op-base">' + (vs.length > 1 ? 'Desde ' : '') + '<b>' + O.money(p.price) + '</b></p>' +
      (p.ingredients ? '<div class="op-block"><p class="op-label">Incluye</p><ul class="op-ing">' + p.ingredients.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>' : '') +
      (vs.length > 1 ? '<div class="op-block"><p class="op-label" id="opVarL">' + (isPizza ? 'Tamaño' : p.category === 'pastas' ? 'Tipo de pasta' : 'Elige') + '</p><div class="op-vars" role="radiogroup" aria-labelledby="opVarL">' + vs.map(function(v){
          return '<button type="button" class="op-var" role="radio" data-v="' + v.id + '" aria-checked="' + (v.id === P.variantId) + '"><span>' + esc(v.label) + (v.note ? ' <small>' + esc(v.note) + '</small>' : '') + '</span>' + (v.delta ? '<em>+' + O.money(v.delta) + '</em>' : '') + '</button>';
        }).join('') + '</div></div>' : '') +
      (xs.length ? '<button type="button" class="op-extras-btn" aria-expanded="false" aria-controls="opExtras"><span>' + (isPizza ? 'Personaliza tu pizza' : 'Agregar ingredientes adicionales') + '</span><span class="op-extras-n"></span>' + ICON.arrR + '</button>' : '') +
      '<div class="op-extras-chosen"></div>' +
      '<div class="op-buy">' +
        '<div class="op-qty" role="group" aria-label="Cantidad"><button type="button" data-q="-1" aria-label="Restar uno">' + ICON.minus + '</button><output aria-live="polite"></output><button type="button" data-q="1" aria-label="Sumar uno">' + ICON.plus + '</button></div>' +
        '<div class="op-price"><span class="op-unit"></span><b class="op-total"></b></div>' +
      '</div>' +
      '<button type="button" class="op-add"><span>' + (P.editKey ? 'Guardar cambios' : 'Agregar al carrito') + '</span><b class="op-add-total"></b></button>' +
      '<p class="op-note">' + esc(M.priceNote) + (p.source === 'demo' ? ' · plato de demostración' : '') + '</p>' +
      (xs.length ? '<div class="op-extras" id="opExtras" role="dialog" aria-label="Ingredientes adicionales" hidden>' +
        '<div class="op-extras-head"><button type="button" class="op-extras-back">' + ICON.arrL + '<span>Volver al plato</span></button><p class="op-label">' + (isPizza ? 'Personaliza tu pizza' : 'Ingredientes adicionales') + '</p></div>' +
        '<ul class="op-xlist">' + xs.map(function(id){ var x = M.extras[id];
          return '<li><label class="op-x"><input type="checkbox" value="' + id + '"' + (P.extras.has(id) ? ' checked' : '') + '><span class="op-x-box" aria-hidden="true">' + ICON.check + '</span><span class="op-x-name">' + esc(x.label) + '</span><span class="op-x-price">' + (x.price ? '+' + O.money(x.price) : 'Sin costo') + '</span></label></li>';
        }).join('') + '</ul>' +
        '<button type="button" class="op-extras-done">Listo</button>' +
      '</div>' : '') +
    '</div>';
  }

  function paintPrice(){
    $('.op-qty output', pBody).textContent = P.qty;
    $('.op-qty [data-q="-1"]', pBody).disabled = P.qty <= 1;
    $('.op-qty [data-q="1"]', pBody).disabled = P.qty >= cart.MAX_QTY;
    $('.op-unit', pBody).textContent = O.money(pUnit()) + ' c/u';
    $('.op-total', pBody).textContent = O.money(pTotal());
    $('.op-add-total', pBody).textContent = O.money(pTotal());
    var ex = Array.from(P.extras), n = $('.op-extras-n', pBody), ch = $('.op-extras-chosen', pBody);
    if (n) n.textContent = ex.length ? ex.length + ' ' + (ex.length === 1 ? 'extra' : 'extras') : '';
    ch.innerHTML = ex.map(function(id){ return '<span>+ ' + esc(M.extras[id].label) + '</span>'; }).join('');
  }

  function gShow(i, manual){
    var slides = pBody.querySelectorAll('.op-slide'); if (slides.length < 2) return;
    P.gi = (i + slides.length) % slides.length;
    slides.forEach(function(s, k){ s.classList.toggle('is-active', k === P.gi); });
    pBody.querySelectorAll('.op-thumb').forEach(function(t, k){ if (k === P.gi) t.setAttribute('aria-current','true'); else t.removeAttribute('aria-current'); });
    if (!LB.hidden) paintLb();
    if (manual) P.hold = Date.now() + 10000;
  }
  function gAuto(){
    clearInterval(P.timer);
    if (reduced || (P.p.images || []).length < 2) return;
    P.timer = setInterval(function(){
      if (!P || Date.now() < P.hold || P.hover || !LB.hidden || document.hidden) return;
      gShow(P.gi + 1, false);
    }, 5000);
  }
  /* Foto ampliada: capa a pantalla completa fuera de la ventana, para que la imagen
     se vea entera en cualquier dispositivo (object-fit: contain) */
  var LB = document.createElement('div');
  LB.className = 'od-lb'; LB.hidden = true;
  LB.setAttribute('role', 'dialog'); LB.setAttribute('aria-modal', 'true'); LB.setAttribute('aria-label', 'Foto ampliada');
  LB.innerHTML = '<figure class="od-lb-fig"><img alt=""><figcaption><span class="od-lb-cap"></span><span class="od-lb-n"></span></figcaption></figure>' +
    '<button type="button" class="od-lb-x" aria-label="Cerrar foto">' + ICON.x + '</button>' +
    '<button type="button" class="od-lb-nav od-lb-prev" aria-label="Foto anterior">' + ICON.arrL + '</button>' +
    '<button type="button" class="od-lb-nav od-lb-next" aria-label="Foto siguiente">' + ICON.arrR + '</button>';
  document.body.appendChild(LB);
  function paintLb(){
    var slides = pBody.querySelectorAll('.op-slide'), sl = slides[P.gi], img = $('img', LB);
    img.classList.remove('in'); void img.offsetWidth;
    img.src = sl.src; img.alt = sl.alt; img.classList.add('in');
    $('.od-lb-cap', LB).textContent = sl.alt;
    $('.od-lb-n', LB).textContent = slides.length > 1 ? (P.gi + 1) + ' / ' + slides.length : '';
    LB.querySelectorAll('.od-lb-nav').forEach(function(b){ b.hidden = slides.length < 2; });
  }
  function openLb(){
    paintLb(); LB.hidden = false;
    requestAnimationFrame(function(){ LB.classList.add('open'); });
    $('.od-lb-x', LB).focus();
  }
  function closeLb(){
    if (LB.hidden) return false;
    LB.classList.remove('open'); LB.hidden = true;
    var z = $('.op-zoom', pBody); z && z.focus();
    return true;
  }
  LB.addEventListener('click', function(e){
    if (e.target.closest('.od-lb-x') || e.target === LB) return closeLb();
    if (e.target.closest('.od-lb-prev')) return gShow(P.gi - 1, true);
    if (e.target.closest('.od-lb-next')) return gShow(P.gi + 1, true);
  });
  LB.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeLb(); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); gShow(P.gi - 1, true); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); gShow(P.gi + 1, true); }
    if (e.key === 'Tab'){                         // el foco no sale de la foto ampliada
      var f = Array.prototype.filter.call(LB.querySelectorAll('button'), function(b){ return !b.hidden; });
      var i = f.indexOf(document.activeElement); e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  function toggleExtras(open){
    var panel = $('.op-extras', pBody), btn = $('.op-extras-btn', pBody); if (!panel) return false;
    if (open === undefined) open = panel.hidden;
    if (!open && panel.hidden) return false;
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    pWin.classList.toggle('extras-open', open);   // con los extras abiertos solo se ve «Volver al plato»
    requestAnimationFrame(function(){ panel.classList.toggle('open', open); });
    (open ? $('input', panel) : btn).focus();
    return true;
  }

  pBody.addEventListener('click', function(e){
    if (!P) return;
    var t = e.target;
    var v = t.closest('.op-var');
    if (v){ P.variantId = v.dataset.v; pBody.querySelectorAll('.op-var').forEach(function(b){ b.setAttribute('aria-checked', String(b === v)); }); return paintPrice(); }
    var q = t.closest('[data-q]');
    if (q){ P.qty = Math.max(1, Math.min(cart.MAX_QTY, P.qty + (+q.dataset.q))); return paintPrice(); }
    if (t.closest('.op-extras-btn')) return toggleExtras(true);
    if (t.closest('.op-extras-back') || t.closest('.op-extras-done')) return toggleExtras(false);
    var th = t.closest('.op-thumb'); if (th) return gShow(+th.dataset.gi, true);
    if (t.closest('.op-prev')) return gShow(P.gi - 1, true);
    if (t.closest('.op-next')) return gShow(P.gi + 1, true);
    if (t.closest('.op-zoom') || t.closest('.op-slide')) return openLb();
    if (t.closest('.op-add')) return addCurrent(t.closest('.op-add'));
  });
  pBody.addEventListener('change', function(e){
    if (!P || e.target.type !== 'checkbox') return;
    if (e.target.checked) P.extras.add(e.target.value); else P.extras.delete(e.target.value);
    paintPrice();
  });
  pBody.addEventListener('pointerenter', function(e){ if (P && e.target.closest && e.target.closest('.op-gal')) P.hover = true; }, true);
  pBody.addEventListener('pointerleave', function(e){ if (P && e.target.classList && e.target.classList.contains('op-gal')) P.hover = false; }, true);
  pBody.addEventListener('keydown', function(e){
    if (!P || !e.target.closest('.op-gal')) return;
    if (e.key === 'ArrowLeft'){ e.preventDefault(); gShow(P.gi - 1, true); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); gShow(P.gi + 1, true); }
  });

  function addCurrent(btn){
    var ex = Array.from(P.extras), name = P.p.name, editing = !!P.editKey;
    if (P.p.available === false){ DE.toast(name + ' no está disponible en este momento.'); return; }
    if (editing) cart.replace(P.editKey, P.variantId, ex, P.qty);
    else cart.add(P.p.id, P.variantId, ex, P.qty);
    btn.classList.add('is-done');
    setTimeout(function(){
      DE.closeWindow();
      DE.toast(editing ? 'Cambios guardados en tu pedido.' : '¡Añadido a tu pedido! · ' + name);
    }, reduced ? 0 : 280);
  }

  /* Escape: primero la foto ampliada, luego el panel de extras, luego la ventana */
  var prevEsc = DE.onEscape;
  DE.onEscape = function(){ if (pWin.classList.contains('open') && P && (closeLb() || toggleExtras(false))) return true; return prevEsc ? prevEsc() : false; };
  onClose(pWin, function(){ closeLb(); if (P){ clearInterval(P.timer); P = null; } });

  O.productModal = {
    open: function(pid, opts){
      opts = opts || {};
      var p = O.product(pid); if (!p) return;
      if (p.available === false && !opts.editKey){ DE.toast(p.name + ' no está disponible en este momento.'); return; }
      var l = opts.editKey ? cart.line(opts.editKey) : null;
      var v = O.variantOf(p, l ? l.variantId : null);
      if (P) clearInterval(P.timer);
      P = { p:p, variantId: v ? v.id : null, extras: new Set(l ? l.extras : []), qty: l ? l.qty : 1, editKey: l ? l.key : null, gi:0, timer:null, hold:0, hover:false };
      pWin.classList.toggle('od-product--noimg', !(p.images && p.images.length));
      pBody.innerHTML = '<div class="op-grid">' + (p.images && p.images.length ? galleryHTML(p) : '') + infoHTML() + '</div>';
      pBody.scrollTop = 0;
      paintPrice(); gAuto();
      DE.openWindow('producto', opts.opener);
    }
  };

  /* Agregar sin abrir el detalle (productos sin opciones) */
  O.quickAdd = function(pid, vid, btn){
    var p = O.product(pid);
    if (p.available === false){ DE.toast(p.name + ' no está disponible en este momento.'); return; }
    cart.add(pid, vid || null, [], 1);
    if (btn){ btn.classList.remove('is-added'); void btn.offsetWidth; btn.classList.add('is-added'); }
    DE.toast('¡Añadido a tu pedido! · ' + p.name + (vid && (p.variants || []).length > 1 ? ' (' + O.variantOf(p, vid).label + ')' : ''));
  };

  /* =========================================================
     BEBIDAS
     ========================================================= */
  var dWin = $('#win-bebidas'), dBody = $('.win-body', dWin), dSel = {};
  function photoSlot(key, label, icon){
    var im = M.drinks.images[key];
    if (im) return '<figure class="odr-photo"><img src="' + esc(im.src) + '" alt="' + esc(im.alt) + '" loading="lazy"><figcaption>' + esc(label) + '</figcaption></figure>';
    return '<figure class="odr-photo odr-photo--ph" aria-label="Espacio para la foto de ' + esc(label.toLowerCase()) + '">' + icon + '<figcaption>' + esc(label) + '<small>Foto por agregar</small></figcaption></figure>';
  }
  function coctelesSign(){
    return '<div class="odr-sign" role="img" aria-label="Cócteles">' + ICON.glass.replace('viewBox="0 0 48 48"', 'viewBox="0 0 48 48" class="odr-sign-ic"') +
      '<span class="odr-sign-word">' + 'COCTELES'.split('').map(function(c){ return '<span>' + c + '</span>'; }).join('') + '</span><span class="odr-sign-dots" aria-hidden="true">• • • • • •</span></div>';
  }
  function drinkRow(p){
    var vs = p.variants || [], sel = dSel[p.id] || (vs[0] && vs[0].id), off = p.available === false;
    return '<li class="odr-item' + (off ? ' is-off' : '') + '" data-id="' + p.id + '">' +
      '<div class="odr-item-t"><b>' + esc(p.name) + '</b><span>' + esc(p.short || '') + '</span>' +
      (vs.length > 1 ? '<div class="odr-vars" role="radiogroup" aria-label="Presentación de ' + esc(p.name) + '">' + vs.map(function(v){
        return '<button type="button" role="radio" class="odr-var" data-v="' + v.id + '" aria-checked="' + (v.id === sel) + '">' + esc(v.label) + '</button>';
      }).join('') + '</div>' : '') + '</div>' +
      '<span class="odr-price">' + O.money(O.unitPrice(p.id, sel, [])) + '</span>' +
      '<button type="button" class="odr-add" aria-label="Agregar ' + esc(p.name) + '">' + ICON.plus + '</button>' +
    '</li>';
  }
  function renderDrinks(){
    var G = M.drinks.groups, all = M.products.filter(function(p){ return p.category === 'bebidas'; });
    function list(gid){ return '<ul class="odr-list">' + all.filter(function(p){ return p.group === gid; }).map(drinkRow).join('') + '</ul>'; }
    dBody.innerHTML =
      '<p class="odr-intro">' + esc(O.category('bebidas').intro) + '</p>' +
      '<section class="odr-sec odr-sec--soft" aria-labelledby="odrB"><h3 class="odr-h" id="odrB">' + esc(G[0].label) + ' <small>' + esc(G[0].note) + '</small></h3>' + list('bebidas') + '</section>' +
      '<section class="odr-sec odr-sec--cocktails" aria-label="Cócteles"><div class="odr-feature">' + coctelesSign() + photoSlot('cocteles', 'Cócteles de la casa', ICON.glass) + '</div>' + list('cocteles') + '</section>' +
      '<section class="odr-sec odr-sec--coffee" aria-labelledby="odrC"><div class="odr-feature odr-feature--coffee">' + photoSlot('cafe', 'Capuchino', ICON.cup) + '<div class="odr-coffee-t"><h3 class="odr-h odr-h--big" id="odrC">Café</h3><p>Café recién hecho, frappuccino e infusiones frías o calientes</p></div>' + photoSlot('espresso', 'Espresso', ICON.cup) + photoSlot('frappuccino', 'Frappuccino', ICON.cup) + '</div>' + list('cafe') + '</section>' +
      '<p class="oc-price-note">' + esc(M.priceNote) + (isDelivery() ? '. Vinos por botella: consúltanos por WhatsApp.' : '. Vinos por botella: consulta la carta con tu mesero.') + '</p>';
  }
  dBody.addEventListener('click', function(e){
    var it = e.target.closest('.odr-item'); if (!it) return;
    var id = it.dataset.id, v = e.target.closest('.odr-var');
    if (v){ dSel[id] = v.dataset.v; it.outerHTML = drinkRow(O.product(id)); var nv = dBody.querySelector('.odr-item[data-id="' + id + '"] .odr-var[data-v="' + v.dataset.v + '"]'); nv && nv.focus(); return; }
    var add = e.target.closest('.odr-add');
    if (add){ var p = O.product(id); O.quickAdd(id, dSel[id] || (p.variants && p.variants[0].id), add); }
  });
  O.drinks = { open: function(opener){ renderDrinks(); dBody.scrollTop = 0; DE.openWindow('bebidas', opener); } };
  document.addEventListener('daenzo:catalog', function(){ if (dWin.classList.contains('open')){ var y = dBody.scrollTop; renderDrinks(); dBody.scrollTop = y; } });

  /* =========================================================
     REVISIÓN · CONFIRMACIÓN · RESUMEN
     ========================================================= */
  var rWin = $('#win-revision'), rBody = $('.win-body', rWin);
  function recos(){
    var R = M.recommendations, out = [], cats = ['bebidas','postres','pizzas'];
    var hasCat = function(c){ return cart.lines().some(function(l){ return O.product(l.productId).category === c; }); };
    cats.sort(function(a, b){ return hasCat(a) - hasCat(b); });
    cats.forEach(function(c){ (R.byCategory[c] || []).forEach(function(id){ if (out.length < R.max && O.product(id).available !== false && !cart.has(id) && out.indexOf(id) < 0 && out.filter(function(x){ return O.product(x).category === c; }).length < 1) out.push(id); }); });
    return out.map(O.product);
  }
  function compactLines(){
    return '<ul class="or-lines">' + cart.lines().map(function(l){
      var p = O.product(l.productId), ex = O.lineExtras(l), meta = O.lineMeta(l).concat(ex.length ? ['+ ' + (ex.length > 2 ? ex.length + ' extras' : ex.join(', '))] : []);
      return '<li><span class="or-q">' + l.qty + '×</span><span class="or-n"><b>' + esc(p.name) + '</b>' + (meta.length ? '<small>' + esc(meta.join(' · ')) + '</small>' : '') + '</span><span class="or-t">' + O.money(cart.lineTotal(l)) + '</span></li>';
    }).join('') + '</ul>';
  }
  function renderReview(){
    var t = cart.totals(), rs = recos(), dl = isDelivery(), d = dl && O.deliveryService.totals();
    $('#t-revision').textContent = dl ? '¿Todo listo para disfrutarlo en casa?' : '¿Está todo listo para disfrutar?';
    rBody.innerHTML =
      '<p class="od-mode-sub">' + (dl ? 'Revisa tu selección. En el siguiente paso nos dirás dónde llevar tu pedido.' : 'Revisa tu selección antes de confirmar el pedido.') + '</p>' +
      compactLines() +
      (dl ? '<p class="or-ship"><span>Envío a domicilio</span><b>' + (d.feePending ? 'Se confirmará' : O.money(d.fee)) + '</b></p>' +
            '<p class="or-total"><span>Total' + (d.feePending ? ' sin envío' : '') + '</span><b>' + O.money(d.total) + '</b></p>'
          : '<p class="or-total"><span>Total estimado</span><b>' + O.money(t.total) + '</b></p>') +
      (rs.length ? '<div class="or-recos"><p class="op-label">' + (dl ? 'Para completar tu pedido' : 'Para completar la mesa') + '</p><ul>' + rs.map(function(p){
        var img = p.images ? '<img src="' + esc(p.images[0].src) + '" alt="" loading="lazy">' : '<span class="or-reco-ic">' + ICON.glass + '</span>';
        return '<li class="or-reco" data-id="' + p.id + '">' + img + '<span><b>' + esc(p.name) + '</b><small>' + O.money(p.price) + '</small></span><button type="button" class="odr-add" aria-label="Agregar ' + esc(p.name) + '">' + ICON.plus + '</button></li>';
      }).join('') + '</ul></div>' : '') +
      '<div class="or-actions"><button type="button" class="oc-btn oc-btn--ghost" data-keep>Seguir ordenando</button><button type="button" class="oc-btn oc-btn--primary" data-confirm>' + (dl ? 'Continuar con la entrega' : 'Confirmar selección') + '</button></div>';
  }
  rBody.addEventListener('click', function(e){
    if (e.target.closest('[data-keep]')) return DE.closeWindow();
    if (e.target.closest('[data-confirm]')) return isDelivery() ? O.deliveryForm.open() : O.confirm.open();
    var r = e.target.closest('.or-reco');
    if (r && e.target.closest('.odr-add')){ var p = O.product(r.dataset.id); O.quickAdd(p.id, p.variants && p.variants[0].id); renderReview(); var c = rBody.querySelector('[data-confirm]'); c && c.focus(); }
  });
  O.review = { open: function(opener){
    if (cart.isEmpty()){ DE.toast('Añade al menos un producto para continuar.'); return; }
    var off = cart.lines().filter(function(l){ return O.product(l.productId).available === false; })[0];
    if (off){ DE.toast(O.product(off.productId).name + ' ya no está disponible. Quítalo del carrito para continuar.'); return; }
    cart.markReviewed(); renderReview(); DE.openWindow('revision', opener);
  } };

  /* ---------- Pedido realizado (instantánea de solo lectura) ----------
     Al confirmar se guarda una copia con nombres, opciones y precios
     (localStorage 'daenzo.placedOrder.v1'). Al cerrar la confirmación el
     carrito se vacía y aparece el botón flotante «Ver mi pedido». */
  /* Con el panel de control, el botón se retira cuando el personal marca el pedido como
     terminado y pagado (o cancelado). Sin panel se mantiene la caducidad de 5 minutos. */
  var PKEY = 'daenzo.placedOrders.v1', TTL = window.DaEnzoDB ? 24 * 3600000 : ((M.placedOrders && M.placedOrders.ttlMs) || 300000);
  var placed = null, expiryTimer = null;      // { orders:[…], expiresAt }
  function loadPlaced(){
    try { placed = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch(e){ placed = null; }
    if (!placed || !Array.isArray(placed.orders) || !placed.orders.length || !(placed.expiresAt > Date.now())) { placed = null; try { localStorage.removeItem(PKEY); } catch(e){} }
  }
  function savePlaced(){ try { if (placed) localStorage.setItem(PKEY, JSON.stringify(placed)); else localStorage.removeItem(PKEY); } catch(e){} }
  function placedTotals(){ var u = 0, t = 0; (placed ? placed.orders : []).forEach(function(o){ u += o.units; t += o.total; }); return { units:u, total:t, count: placed ? placed.orders.length : 0 }; }
  /* Cada pedido confirmado se AÑADE a la lista (no reemplaza a los anteriores).
     A los 5 minutos del último pedido la lista se borra y el botón desaparece.
     (Con backend: se borrará cuando el panel de la pizzería marque el pago.) */
  /* Líneas del carrito → modelo del panel (precio base + extras: el panel recalcula el total) */
  var lastPanel = null;
  O.panelItems = function(){
    return cart.lines().map(function(l){
      var p = O.product(l.productId), v = O.variantOf(p, l.variantId);
      return { productId: p.id, name: p.name, category: p.category, categoryLabel: O.category(p.category).label,
               variant: v && (p.variants || []).length > 1 ? v.label : null,
               basePrice: O.unitPrice(l.productId, l.variantId, []), qty: l.qty,
               extras: (l.extras || []).map(function(x){ return { id: x, label: M.extras[x].label, price: M.extras[x].price }; }) };
    });
  };
  function snapshot(){
    loadPlaced();
    var t = cart.totals();
    if (!placed) placed = { orders: [], expiresAt: 0 };
    placed.orders.push({ n: placed.orders.length + 1, at: new Date().toISOString(), table: O.table.get() ? O.table.get().id : null, units: t.units, total: t.total,
      lines: cart.lines().map(function(l){
        var p = O.product(l.productId), im = p.images ? p.images[0] : p.cartImage;
        return { name: p.name, category: O.category(p.category).label, options: O.lineMeta(l), extras: O.lineExtras(l), qty: l.qty,
                 unit: O.unitPrice(l.productId, l.variantId, l.extras), total: cart.lineTotal(l), img: im ? im.src : null, pos: im ? im.pos : null };
      }) });
    /* Demo: el pedido también se registra en el panel de control de este navegador */
    var snap = placed.orders[placed.orders.length - 1];
    if (window.DaEnzoDB){
      var sess = window.DaEnzoReviews && DaEnzoReviews.Auth && DaEnzoReviews.Auth.session();
      lastPanel = DaEnzoDB.createOrder({ mode:'local', source:'web', table: snap.table, items: O.panelItems(), ref: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                             customer: sess ? { name: sess.name } : null }).then(function(o){ snap.panelId = o.id; savePlaced(); });
    }
    placed.expiresAt = Date.now() + TTL;
    savePlaced(); armExpiry();
    return placed.orders[placed.orders.length - 1];
  }
  function armExpiry(){
    clearTimeout(expiryTimer);
    if (!placed) return;
    expiryTimer = setTimeout(function(){
      placed = null; savePlaced();
      if (O.placedBtn) O.placedBtn.sync();
      if (sWin.classList.contains('open')) renderSummary();
    }, Math.max(0, placed.expiresAt - Date.now()));
  }
  loadPlaced();
  var SOCIAL = (window.DAENZO_CONFIG && DAENZO_CONFIG.social) || {};
  var IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none"/></svg>';
  var FB = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>';

  var cWin = $('#win-confirmacion'), cBody = $('.win-body', cWin), justPlaced = false;
  cBody.addEventListener('click', function(e){
    var b = e.target.closest('[data-go]'); if (!b) return;
    var go = b.dataset.go;
    if (go === 'summary') return O.summary.open(b);
    DE.closeWindow({ silent:true });
    DE.order.close(false, function(){ DE.routes[go === 'about' ? '#sobre-nosotros' : '#resenas'](); });
  });
  /* Al salir de la confirmación (por cualquier vía): vaciar carrito y mostrar «Ver mi pedido» */
  onClose(cWin, function(){
    if (!justPlaced) return;
    justPlaced = false;
    cart.clear();
    O.placedBtn && O.placedBtn.show();
  });
  O.confirm = { open: function(){
    cart.markConfirmed(); var order = snapshot(); justPlaced = true;
    cBody.innerHTML =
      '<div class="oo-grid"><div>' +
        '<p class="oo-lead">Gracias por elegir Da Enzo. Tu pedido' + (order.n > 1 ? ' n.º ' + order.n : '') + ' ya está en proceso: <b>' + order.units + ' ' + (order.units === 1 ? 'producto' : 'productos') + '</b> por <b>' + O.money(order.total) + '</b>.</p>' +
        '<p class="oo-pay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg><span><b>Puedes pagar en caja</b> cuando termines de disfrutar tu pedido.</span></p>' +
        '<p class="oo-demo">' + ICON.check + '<span><b>Demostración:</b> ' + (window.DaEnzoDB ? 'el pedido llegó al panel de control de demostración de este navegador<span data-panel-id></span>. No se envía a una cocina real.' : 'el pedido no se ha enviado a la cocina ni a ningún sistema.') + '</span></p>' +
      '</div><img class="oo-logo" src="assets/logo-da-enzo.png" width="447" height="447" alt="Da Enzo Pizzería"></div>' +
      '<div class="oo-actions"><button type="button" class="oc-btn" data-go="about">Sobre nosotros</button><button type="button" class="oc-btn" data-go="reviews">Reseñas</button>' +
      '<button type="button" class="oc-btn oc-btn--cream oo-wide" data-go="summary">Ver mi pedido</button></div>' +
      '<div class="oo-social"><p>Mientras esperas, síguenos</p>' +
        '<a href="' + esc(SOCIAL.instagram) + '" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Da Enzo (pestaña nueva)">' + IG + '<span>Instagram</span></a>' +
        '<a href="' + esc(SOCIAL.facebook) + '" target="_blank" rel="noopener noreferrer" aria-label="Facebook de Da Enzo (pestaña nueva)">' + FB + '<span>Facebook</span></a>' +
      '</div>';
    if (lastPanel) lastPanel.then(function(){ var sp = cBody.querySelector('[data-panel-id]'); if (sp && order.panelId) sp.textContent = ' (' + order.panelId + ')'; });
    DE.openWindow('confirmacion');
  } };

  /* «Ver mi pedido»: solo lectura, no se puede modificar */
  var sWin = $('#win-resumen'), sBody = $('.win-body', sWin);
  var xid = '';
  function extraPrice(label){ for (var k in M.extras) if (M.extras[k].label === label) return M.extras[k].price; return 0; }
  function lineHTML(l, i){
    xid = (l._sid || '') + i;
    return '<li class="os-line">' +
      (l.img ? '<img src="' + esc(l.img) + '" alt="" loading="lazy" style="object-position:' + esc(l.pos || '50% 50%') + '">' : '<span class="os-ic">' + ICON.glass + '</span>') +
      '<div class="os-info"><p class="op-k">' + esc(l.category) + '</p><b>' + esc(l.name) + '</b>' +
        (l.options.length ? '<span>' + esc(l.options.join(' · ')) + '</span>' : '') +
      '</div>' +
      '<div class="os-num"><span>' + l.qty + ' × ' + O.money(l.unit) + '</span><b>' + O.money(l.total) + '</b></div>' +
      (l.extras.length ? '<div class="oc-xrow">' + O.extrasHTML('s-' + xid, l.extras.map(function(x){ return typeof x === 'string' ? { label: x, price: extraPrice(x) } : x; })) + '</div>' : '') +
    '</li>';
  }
  O.summaryLine = lineHTML;
  /* Estado que marca el personal en el panel de demostración (mismo navegador) */
  function panelStatus(o){
    if (!o.panelId || !window.DaEnzoDB) return '';
    var po = DaEnzoDB.peek().orders.filter(function(x){ return x.id === o.panelId; })[0]; if (!po) return '';
    var st = po.status === 'nuevo' ? 'Recibido · pendiente de confirmar' : DaEnzoDB.statusLabel(po.status, 'local');
    return '<p class="dl-status-line"><span class="dl-badge' + (po.status === 'nuevo' ? ' dl-badge--demo' : '') + '">' + esc(st) + (po.payment.status === 'confirmado' ? ' · pagado' : '') + ' · panel demo</span></p>';
  }
  if (window.DaEnzoDB) DaEnzoDB.subscribe(function(){ if (sWin.classList.contains('open')) { var y = sBody.scrollTop; renderSummary(); sBody.scrollTop = y; } });
  function renderSummary(){
    loadPlaced();
    var dls = O.deliveryService.store.all();
    if (!placed && !dls.length){ sBody.innerHTML = '<div class="oc-empty"><p class="oc-empty-t">No tienes pedidos en curso.</p></div>'; return; }
    /* Pedidos a domicilio (con dirección, teléfono y estado) */
    var dHTML = dls.length && O.deliveryUI ? O.deliveryUI.summaryHTML(dls) : '';
    if (!placed){ sBody.innerHTML = dHTML; return; }
    var T = placedTotals(), time = function(iso){ return new Date(iso).toLocaleTimeString('es-VE', { hour:'numeric', minute:'2-digit' }); };
    sBody.innerHTML = dHTML + (dHTML ? '<h3 class="os-group-h">En el local</h3>' : '') +
      '<p class="oc-note oc-note--ok">' + ICON.check + (T.count === 1 ? 'Pedido en proceso' : T.count + ' pedidos en proceso') + (placed.orders[0].table ? ' · Mesa ' + esc(placed.orders[0].table) : '') + '</p>' +
      placed.orders.slice().reverse().map(function(o){
        return '<section class="os-order" aria-label="Pedido ' + o.n + '">' +
          '<header class="os-order-head"><b>Pedido ' + o.n + '</b><span>' + (o.panelId ? esc(o.panelId) + ' · ' : '') + time(o.at) + ' · ' + o.units + ' ' + (o.units === 1 ? 'producto' : 'productos') + '</span><strong>' + O.money(o.total) + '</strong></header>' +
          panelStatus(o) +
          '<ul class="os-lines">' + o.lines.map(function(l, i){ l._sid = 'l' + o.n + '-'; return lineHTML(l, i); }).join('') + '</ul>' +
        '</section>';
      }).join('') +
      '<dl class="oc-sum"><div><dt>Pedidos</dt><dd>' + T.count + '</dd></div><div><dt>Unidades</dt><dd>' + T.units + '</dd></div><div class="oc-sum-total"><dt>Total a pagar</dt><dd>' + O.money(T.total) + '</dd></div></dl>' +
      '<p class="oo-pay oo-pay--light"><span><b>Puedes pagar en caja.</b> Este resumen es de solo lectura: si necesitas cambiar algo, avisa a tu mesero.</span></p>' +
      '<p class="oc-price-note">' + esc(M.priceNote) + ' · pedido de demostración, no enviado a una cocina real.</p>';
  }
  O.summary = { open: function(opener){ if (O.prunePlaced) O.prunePlaced(); renderSummary(); sBody.scrollTop = 0; DE.openWindow('resumen', opener); }, render: renderSummary, win: sWin };

  /* Botón flotante «Ver mi pedido» (visible en todo el sitio cuando hay un pedido hecho) */
  var pBtn = document.getElementById('odPlaced');
  if (pBtn){
    var pf = window.DaEnzoAbout.FloatingOrder(pBtn, document.querySelector('.hero'), function(){ O.summary.open(pBtn); }, {
      storageKey: 'daenzo.placedButton.pos',
      avoid: function(){ return [document.getElementById('odMbar'), document.getElementById('odWaiter'), document.getElementById('abOrder')]; }
    });
    /* Pedidos en el local (caducan a los 5 min) + pedidos a domicilio de esta pestaña */
    var pruning = false;
    O.placedBtn = {
      show: function(){
        if (O.prunePlaced && !pruning){ pruning = true; try { O.prunePlaced(); } finally { pruning = false; } }
        loadPlaced();
        var dls = O.deliveryService.store.all();
        if (!placed && !dls.length){ pBtn.hidden = true; return; }
        var T = placedTotals(), count = T.count + dls.length, total = T.total;
        dls.forEach(function(e){ total += e.order.amounts.total; });
        pBtn.querySelector('[data-placed-total]').textContent =
          count > 1 ? count + ' pedidos · ' + O.money(total)
          : dls.length ? 'A domicilio · ' + O.money(total)
          : T.units + ' ' + (T.units === 1 ? 'producto' : 'productos') + ' · ' + O.money(total);
        var wasHidden = pBtn.hidden;
        pBtn.hidden = false; if (wasHidden) pf.show(); armExpiry();
      },
      sync: function(){ O.placedBtn.show(); },
      hide: function(){ pBtn.hidden = true; },
      refresh: function(){ if (!pBtn.hidden) pf.refresh(); }
    };
    O.placedBtn.show();
  }

  /* ---------- Pedido cerrado por el personal → desaparece «Ver mi pedido» ----------
     Cerrado = (finalizado o entregado) Y pago confirmado, o cancelado.
     Cuando TODOS los pedidos del cliente están cerrados se borran de este dispositivo;
     el botón vuelve a aparecer solo con un pedido nuevo. */
  function closedInPanel(id, d, at){
    if (!id) return !!at && Date.now() - new Date(at).getTime() > 60000;   // pedido antiguo sin registro en el panel: se retira
    var o = d.orders.filter(function(x){ return x.id === id; })[0];
    if (!o) return d.seq.order < +String(id).replace('DE-', '');   // la demo se restableció
    return o.status === 'cancelado' || ((o.status === 'finalizado' || o.status === 'entregado') && o.payment.status === 'confirmado');
  }
  function prune(){
    if (!window.DaEnzoDB) return;
    var d = DaEnzoDB.peek(), changed = false;
    loadPlaced();
    if (placed && placed.orders.every(function(o){ return closedInPanel(o.panelId, d, o.at); })){ placed = null; savePlaced(); changed = true; }
    var DS = O.deliveryService, dl = DS.store.all();
    if (dl.length && dl.every(function(e){ return closedInPanel(e.demoId, d, e.demoId ? null : e.createdAt); })){ DS.store.clear(); changed = true; }
    if (changed){
      O.placedBtn && O.placedBtn.sync();
      if (sWin.classList.contains('open')) renderSummary();
    }
  }
  O.prunePlaced = prune;
  /* después de que el seguimiento muestre el último estado */
  if (window.DaEnzoDB){ DaEnzoDB.subscribe(function(){ setTimeout(prune, 0); }); prune(); }

  /* Carrito en ventana (móvil) */
  var kWin = $('#win-carrito'), kBody = $('.win-body', kWin);
  O.bindCart(kBody);
  O.cartWin = { open: function(opener){ kBody.innerHTML = O.cartHTML(); DE.openWindow('carrito', opener); }, body: kBody, win: kWin };
})();
