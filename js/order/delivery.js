/* =========================================================
   DELIVERY — VENTANAS (interfaz)
   · entrega      ¿Dónde llevamos tu pedido?  (formulario + WhatsApp de consulta)
   · seguimiento  pedido en proceso (estado de demostración / estado real)
   · «Ver mi pedido» muestra además el detalle de entrega (resumen compartido)
   La lógica de datos y la API viven en delivery-service.js.
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU, O = window.DaEnzoOrder, cart = O.cart, DS = O.deliveryService;
  var DE = window.DaEnzo, esc = O.esc, ICON = O.icon;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, r){ return (r || document).querySelector(s); };

  var WA_IC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.3l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04z"/></svg>';
  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var MOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h6l2.5-6h-4l-2-3H8M14 6h3l1.5 5"/></svg>';
  var CARD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>';

  function onClose(win, fn){ new MutationObserver(function(){ if (!win.classList.contains('open')) fn(); }).observe(win, { attributes:true, attributeFilter:['class'] }); }
  function time(iso){ try { return new Date(iso).toLocaleTimeString('es-VE', { hour:'numeric', minute:'2-digit' }); } catch(e){ return ''; } }

  /* =========================================================
     DATOS DE ENTREGA
     ========================================================= */
  var fWin = $('#win-entrega'), fBody = $('.win-body', fWin);
  var FIELDS = [
    { id:'address',   label:'Dirección exacta', req:true, tag:'textarea', ph:'Escribe la dirección donde deseas recibir tu pedido', ac:'street-address', rows:2 },
    { id:'phone',     label:'Número de teléfono', req:true, type:'tel', ph:'Introduce un número donde podamos contactarte', ac:'tel', im:'tel' },
    { id:'reference', label:'Punto de referencia', type:'text', ph:'Ej.: frente a la farmacia, portón azul, edificio de la esquina', ac:'off' },
    { id:'mapsUrl',   label:'Ubicación de Google Maps', type:'url', ph:'Pega aquí el enlace que copiaste de Google Maps', ac:'off', im:'url' }
  ];
  var pendingRef = null, sending = false;     // misma clave si se reintenta tras un error (sin duplicados)

  function fieldHTML(f, val){
    var common = ' id="dlv-' + f.id + '" name="' + f.id + '" placeholder="' + esc(f.ph) + '" autocomplete="' + f.ac + '"' + (f.im ? ' inputmode="' + f.im + '"' : '') +
      (f.req ? ' required aria-required="true"' : '') + ' aria-describedby="dlv-' + f.id + '-e' + (f.id === 'mapsUrl' ? ' dlvMapsHelpBtn' : '') + '"';
    var input = f.tag === 'textarea' ? '<textarea' + common + ' rows="' + f.rows + '" maxlength="300">' + esc(val) + '</textarea>'
                                     : '<input type="' + f.type + '"' + common + ' value="' + esc(val) + '" maxlength="' + (f.id === 'mapsUrl' ? 500 : 160) + '">';
    return '<div class="dl-field" data-field="' + f.id + '">' +
      '<label for="dlv-' + f.id + '">' + esc(f.label) + (f.req ? '<span class="dl-req" aria-hidden="true">Obligatorio</span>' : '<span class="dl-opt">Opcional</span>') + '</label>' +
      input +
      (f.id === 'mapsUrl' ? '<button type="button" class="dl-help-btn" id="dlvMapsHelpBtn" aria-expanded="false" aria-controls="dlvMapsHelp">' + PIN + '¿Cómo copio mi ubicación?</button>' +
        '<div class="dl-help" id="dlvMapsHelp" hidden><ol>' +
          '<li>Abre Google Maps y toca el punto azul de tu ubicación (o mantén pulsado el lugar exacto).</li>' +
          '<li>Pulsa <b>Compartir</b> y luego <b>Copiar enlace</b>.</li>' +
          '<li>Vuelve aquí y pégalo en este campo.</li>' +
        '</ol><a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Abrir Google Maps <span class="sr-only">(pestaña nueva)</span>' + ICON.arrow + '</a>' +
        '<p>No necesitas una cuenta de Google. Nunca pedimos acceso a tu ubicación desde esta página.</p></div>' : '') +
      '<p class="dl-err" id="dlv-' + f.id + '-e" aria-live="polite"></p>' +
    '</div>';
  }
  function renderForm(){
    var d = DS.draft.get(), t = DS.totals();
    fBody.innerHTML =
      '<p class="dl-intro">Déjanos los datos necesarios para preparar la entrega. Revisa que tu dirección y teléfono sean correctos para que podamos contactarte.</p>' +
      '<p class="dl-strip"><span>' + t.units + ' ' + (t.units === 1 ? 'producto' : 'productos') + '</span><span>Total' + (t.feePending ? ' sin envío' : '') + ' <b>' + O.money(t.total) + '</b></span><span>Envío: ' + (t.feePending ? 'se confirmará' : O.money(t.fee)) + '</span></p>' +
      '<form class="dl-form" novalidate>' +
        '<p class="dl-legend">Solo la dirección y el teléfono son obligatorios.</p>' +
        FIELDS.map(function(f){ return fieldHTML(f, d[f.id] || ''); }).join('') +
        '<p class="dl-form-err" role="alert" hidden></p>' +
        '<button type="submit" class="oc-btn oc-btn--primary dl-submit"><span>Confirmar dirección y continuar</span>' + ICON.arrow + '</button>' +
        '<p class="dl-privacy">Usamos tu dirección y teléfono solo para este pedido. En esta demostración se guardan únicamente en esta pestaña del navegador y no se envían a ningún sistema.</p>' +
      '</form>' +
      '<aside class="dl-wa" aria-labelledby="dlWaT">' +
        '<div><p class="dl-wa-t" id="dlWaT">¿Tienes alguna duda?</p><p>Contáctanos por WhatsApp y te ayudaremos con tu pedido.</p></div>' +
        '<a class="dl-wa-btn" href="' + esc(DS.waLink(DS.questionText)) + '" target="_blank" rel="noopener noreferrer">' + WA_IC + '<span>Contactar por WhatsApp</span><span class="sr-only"> (se abre WhatsApp en una pestaña nueva)</span></a>' +
      '</aside>';
  }
  function values(){ var f = $('.dl-form', fBody), o = {}; FIELDS.forEach(function(x){ o[x.id] = f.elements[x.id].value; }); return o; }
  function showErr(id, msg){
    var box = fBody.querySelector('[data-field="' + id + '"]'), el = box.querySelector('input,textarea');
    box.classList.toggle('has-err', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    box.querySelector('.dl-err').textContent = msg || '';
    if (msg && !reduced){ box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
  }
  fBody.addEventListener('input', function(e){
    if (!e.target.closest('.dl-form')) return;
    DS.draft.save(values());                                  // se conserva si la ventana se cierra
    var box = e.target.closest('[data-field]');
    if (box && box.classList.contains('has-err')){            // el error desaparece al corregirlo
      var errs = DS.validate(values()); if (!errs[box.dataset.field]) showErr(box.dataset.field, '');
    }
    var fe = $('.dl-form-err', fBody); if (fe) fe.hidden = true;
  });
  fBody.addEventListener('focusout', function(e){
    var box = e.target.closest && e.target.closest('[data-field]'); if (!box || !e.target.value) return;
    var errs = DS.validate(values()); showErr(box.dataset.field, errs[box.dataset.field] || '');
  });
  fBody.addEventListener('click', function(e){
    var h = e.target.closest('.dl-help-btn'); if (!h) return;
    var open = h.getAttribute('aria-expanded') !== 'true', panel = $('#dlvMapsHelp', fBody);
    h.setAttribute('aria-expanded', String(open)); panel.hidden = !open;
  });
  fBody.addEventListener('submit', function(e){
    e.preventDefault();
    if (sending) return;
    var v = values(), errs = DS.validate(v), first = null;
    FIELDS.forEach(function(f){ showErr(f.id, errs[f.id] || ''); if (errs[f.id] && !first) first = f.id; });
    if (first){ $('#dlv-' + first, fBody).focus(); return; }
    if (cart.isEmpty()){ DE.toast('Tu carrito está vacío.'); return; }
    submit(v);
  });

  function submit(v){
    sending = true;
    var btn = $('.dl-submit', fBody), fe = $('.dl-form-err', fBody);
    btn.disabled = true; btn.classList.add('is-busy'); btn.querySelector('span').textContent = DS.connected() ? 'Registrando tu pedido…' : 'Preparando tu pedido…';
    var order = DS.buildOrder(v);
    if (pendingRef) order.clientRef = pendingRef; else pendingRef = order.clientRef;
    DS.createOrder(order).then(function(res){
      var entry = { order: order, createdAt: order.createdAtClient, connected: !!res.connected,
                    server: res.connected ? { id: res.id, status: res.status, createdAt: res.createdAt, accessToken: res.accessToken } : null,
                    status: res.connected ? res.status : 'pendiente_confirmacion', statusSource: res.connected ? 'server' : 'demo', waOpenedAt: null };
      if (res.connected){ order.id = res.id; DS.notifyRestaurant(res.id, res.accessToken).then(function(n){ DS.store.update(order.clientRef, { notified: n.notified }); }).catch(function(){}); }
      DS.store.add(entry);
      pendingRef = null; sending = false;
      DS.draft.clear(); cart.clear();                        // el carrito local ya no es el pedido: evita duplicados al volver
      O.placedBtn && O.placedBtn.show();
      watch(entry);
      btn.classList.remove('is-busy'); btn.classList.add('is-done');
      setTimeout(function(){ tracking.open(entry.order.clientRef); }, reduced ? 0 : 420);
    }).catch(function(){
      sending = false; btn.disabled = false; btn.classList.remove('is-busy');
      btn.querySelector('span').textContent = 'Confirmar dirección y continuar';
      fe.hidden = false;
      fe.textContent = 'No pudimos registrar tu pedido. Tus datos siguen aquí: inténtalo de nuevo o escríbenos por WhatsApp.';
    });
  }
  O.deliveryForm = { open: function(opener){
    if (cart.isEmpty()){ DE.toast('Añade al menos un producto para continuar.'); return; }
    renderForm(); fBody.scrollTop = 0; DE.openWindow('entrega', opener);
  } };

  /* =========================================================
     SEGUIMIENTO (pedido en proceso)
     ========================================================= */
  var tWin = $('#win-seguimiento'), tBody = $('.win-body', tWin), curRef = null;
  var FLOW = ['pendiente_confirmacion','pendiente_pago','confirmado','en_preparacion','en_camino','entregado'];
  function entryOf(ref){ return DS.store.all().filter(function(e){ return e.order.clientRef === ref; })[0] || DS.store.last(); }
  function statusBlock(e){
    var cur = e.status, idx = FLOW.indexOf(cur), demo = e.statusSource !== 'server';
    return '<div class="dl-status">' +
      '<div class="dl-status-head"><p class="op-label">Estado del pedido</p>' +
        '<span class="dl-badge' + (demo ? ' dl-badge--demo' : '') + '">' + (demo ? 'Estado de demostración' : 'Actualizado por Da Enzo' + (e.statusAt ? ' · ' + time(e.statusAt) : '')) + '</span></div>' +
      '<p class="dl-status-now">' + esc(DS.status(cur).label) + '</p>' +
      (cur === 'cancelado' ? '<p class="dl-cancel">Este pedido fue cancelado. Escríbenos por WhatsApp si tienes dudas.</p>' :
      '<ol class="dl-steps">' + FLOW.map(function(id, i){
        return '<li class="' + (i < idx ? 'is-done' : i === idx ? 'is-now' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="dl-dot" aria-hidden="true"></span>' + esc(DS.status(id).label) + '</li>';
      }).join('') + '</ol>') +
    '</div>';
  }
  /* Texto principal según el estado (solo cambia con una actualización real del servidor) */
  var LEAD = {
    recibido: 'Tu pedido de Delivery está en proceso de confirmación. Te notificaremos cuando esté en camino.',
    pendiente_confirmacion: 'Tu pedido de Delivery está en proceso de confirmación. Te notificaremos cuando esté en camino.',
    pendiente_pago: 'Tu pedido está pendiente de pago. Te escribiremos por WhatsApp para completarlo.',
    confirmado: 'Da Enzo confirmó tu pedido. Te notificaremos cuando esté en camino.',
    en_preparacion: 'Tu pedido se está preparando en el horno de leña. Te notificaremos cuando esté en camino.',
    en_camino: 'Tu pedido salió de Da Enzo y va hacia tu dirección.',
    entregado: 'Tu pedido fue entregado. ¡Buen provecho!',
    cancelado: 'Este pedido fue cancelado.'
  };
  function renderTracking(){
    var e = entryOf(curRef); if (!e) { tBody.innerHTML = ''; return; }
    curRef = e.order.clientRef;
    var onWay = e.status === 'en_camino' && e.statusSource === 'server';
    tBody.innerHTML =
      '<div class="dl-onway" role="status"' + (onWay ? '' : ' hidden') + '>' + MOTO + '<div><b>¡Tu pedido está en camino!</b><p>Da Enzo va de camino a tu dirección. Mantén tu teléfono disponible por si necesitamos contactarte.</p></div></div>' +
      '<p class="oo-lead">' + (LEAD[e.statusSource === 'server' ? e.status : 'pendiente_confirmacion'] || LEAD.pendiente_confirmacion) + '</p>' +
      '<p class="oo-pay">' + CARD + '<span>Nos pondremos en contacto contigo por WhatsApp para confirmar los detalles del pago y completar el proceso del pedido.</span></p>' +
      statusBlock(e) +
      (e.connected ? '' :
        '<p class="oo-demo">' + ICON.check + '<span><b>Demostración:</b> la recepción real de pedidos todavía no está conectada. Da Enzo aún no ha recibido este pedido y no hay seguimiento en tiempo real.</span></p>' +
        '<div class="dl-send">' +
          '<p><b>¿Quieres que Da Enzo lo reciba ahora?</b> Envíales el detalle por WhatsApp.</p>' +
          '<a class="dl-wa-btn" data-wa-order href="' + esc(DS.waLink(DS.orderText(e))) + '" target="_blank" rel="noopener noreferrer">' + WA_IC + '<span>' + (e.waOpenedAt ? 'Abrir WhatsApp de nuevo' : 'Abrir WhatsApp con mi pedido') + '</span><span class="sr-only"> (pestaña nueva)</span></a>' +
          '<p class="dl-send-note">' + (e.waOpenedAt ? 'WhatsApp se abrió con el mensaje listo. Recuerda pulsar <b>Enviar</b> en WhatsApp: no podemos comprobar desde aquí si se envió.' : 'Se abrirá WhatsApp con tu pedido ya escrito. Tendrás que pulsar <b>Enviar</b> tú: abrirlo no envía el mensaje automáticamente.') + '</p>' +
        '</div>') +
      '<div class="oo-actions"><button type="button" class="oc-btn" data-keep-exploring>Seguir explorando</button><button type="button" class="oc-btn oc-btn--cream" data-view-order>Ver mi pedido</button></div>';
  }
  tBody.addEventListener('click', function(ev){
    if (ev.target.closest('[data-view-order]')){ fromTracking = true; return O.summary.open(ev.target.closest('button')); }
    if (ev.target.closest('[data-keep-exploring]')) return DE.closeWindow();
    if (ev.target.closest('[data-wa-order]')){
      DS.store.update(curRef, { waOpenedAt: new Date().toISOString() });       // solo se registra que se abrió, NO que se envió
      setTimeout(function(){ var y = tBody.scrollTop; renderTracking(); tBody.scrollTop = y; }, 400);
    }
  });
  var tracking = {
    open: function(ref){ curRef = ref || (DS.store.last() && DS.store.last().order.clientRef); renderTracking(); tBody.scrollTop = 0; DE.openWindow('seguimiento'); }
  };
  O.tracking = tracking;

  /* «Ver mi pedido» abierto desde el seguimiento: al cerrarlo se vuelve al seguimiento */
  var fromTracking = false;
  onClose(O.summary.win, function(){
    if (!fromTracking) return;
    fromTracking = false;
    setTimeout(function(){ if (!document.querySelector('.win.open') && DS.store.last()) tracking.open(curRef); }, 60);
  });
  O.summary.win.addEventListener('click', function(ev){
    if (ev.target.closest('[data-back-tracking]')) DE.closeWindow({ silent:true });   // dispara la vuelta
    else if (ev.target.closest('[data-tracking]')){ fromTracking = false; tracking.open(ev.target.closest('[data-tracking]').dataset.tracking); }
  });

  /* ---------- Resumen de Delivery dentro de «Ver mi pedido» ---------- */
  function summaryHTML(list){
    return list.slice().reverse().map(function(e){
      var o = e.order, d = o.delivery, a = o.amounts, demo = e.statusSource !== 'server';
      return '<section class="os-order os-order--dl" aria-label="Pedido a domicilio">' +
        '<header class="os-order-head"><b>A domicilio</b><span>' + (e.server && e.server.id ? 'Pedido n.º ' + esc(e.server.id) + ' · ' : 'Pedido de demostración · ') + time(e.createdAt) + '</span><strong>' + O.money(a.total) + '</strong></header>' +
        '<p class="dl-status-line"><span class="dl-badge' + (demo ? ' dl-badge--demo' : '') + '">' + esc(DS.status(e.status).label) + (demo ? ' · demostración' : '') + '</span></p>' +
        (e.status === 'en_camino' && !demo ? '<div class="dl-onway dl-onway--sm">' + MOTO + '<div><b>¡Tu pedido está en camino!</b></div></div>' : '') +
        '<ul class="os-lines">' + o.items.map(function(i, k){
          return O.summaryLine({ _sid:'d' + e.n + '-', img: i.img, pos: i.imgPos, category: i.categoryLabel, name: i.name, options: i.variant ? [i.variant] : [], extras: i.extras, qty: i.qty, unit: i.unitPrice, total: i.lineTotal }, k);
        }).join('') + '</ul>' +
        '<dl class="oc-sum"><div><dt>Subtotal</dt><dd>' + O.money(a.subtotal) + '</dd></div>' +
          '<div class="oc-sum-ship"><dt>Envío a domicilio</dt><dd>' + (a.deliveryFeePending ? '<span class="oc-pending">Se confirmará</span>' : O.money(a.deliveryFee)) + '</dd></div>' +
          '<div class="oc-sum-total"><dt>Total' + (a.deliveryFeePending ? ' sin envío' : '') + '</dt><dd>' + O.money(a.total) + '</dd></div></dl>' +
        '<dl class="dl-data"><div><dt>Dirección exacta</dt><dd>' + esc(d.address) + '</dd></div>' +
          '<div><dt>Teléfono</dt><dd>' + esc(d.phone) + '</dd></div>' +
          (d.reference ? '<div><dt>Punto de referencia</dt><dd>' + esc(d.reference) + '</dd></div>' : '') +
          (d.mapsUrl ? '<div><dt>Ubicación</dt><dd><a href="' + esc(d.mapsUrl) + '" target="_blank" rel="noopener noreferrer">Ver en Google Maps<span class="sr-only"> (pestaña nueva)</span></a></dd></div>' : '') +
        '</dl>' +
        '<p class="oo-pay oo-pay--light"><span><b>Pago:</b> te contactaremos por WhatsApp para confirmar los detalles del pago.</span></p>' +
        (fromTracking ? '<button type="button" class="oc-btn oc-btn--ghost dl-back" data-back-tracking>' + ICON.arrL + 'Volver al seguimiento</button>'
                      : '<button type="button" class="oc-btn oc-btn--ghost dl-back" data-tracking="' + esc(o.clientRef) + '">Ver el seguimiento</button>') +
      '</section>';
    }).join('') + '<p class="oc-price-note">' + esc(M.priceNote) + (DS.connected() ? '' : ' · pedido de demostración, no enviado a ningún sistema.') + '</p>';
  }

  /* =========================================================
     ESTADO REAL (preparado para el panel de control)
     Única vía para cambiar el estado: una actualización que venga del servidor
     (watchStatus). Nada en la demo la llama: no hay temporizadores ni estados fingidos.
     ========================================================= */
  var watchers = {};
  function applyStatus(ref, upd){
    if (!upd || upd.source !== 'server' || !DS.status(upd.status)) return;
    var e = entryOf(ref); if (!e || e.status === upd.status) return;
    DS.store.update(ref, { status: upd.status, statusSource: 'server', statusAt: upd.updatedAt || new Date().toISOString() });
    if (tWin.classList.contains('open') && curRef === ref) renderTracking();
    if (O.summary.win.classList.contains('open')) O.summary.render();
    if (upd.status === 'en_camino') DE.toast('¡Tu pedido está en camino! Mantén tu teléfono disponible.');
  }
  function watch(e){
    var ref = e.order.clientRef; if (watchers[ref]) return;
    watchers[ref] = DS.watchStatus(e, function(u){ applyStatus(ref, u); });
  }
  DS.store.all().forEach(watch);           // al volver a la página se recupera el estado real (con backend)

  O.deliveryUI = { summaryHTML: summaryHTML, applyStatus: applyStatus };
})();
