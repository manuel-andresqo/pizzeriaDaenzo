/* =========================================================
   PANEL DE CONTROL DA ENZO — NÚCLEO
   Utilidades, iconos, enrutador, avisos, ventanas y componentes
   compartidos por los cinco módulos. Los datos vienen SIEMPRE de
   DaEnzoDB (capa de datos de demostración compartida con la web).
   ========================================================= */
(function(){
  var DB = window.DaEnzoDB, M = window.DAENZO_MENU;
  var PV = window.DaEnzoPanel = { views: {}, order: [] };

  /* ---------- Utilidades ---------- */
  var $ = PV.$ = function(s, r){ return (r || document).querySelector(s); };
  PV.$$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = PV.esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); };
  PV.money = function(c){ c = Math.round(c || 0); var n = c < 0; c = Math.abs(c); return (n ? '−' : '') + '$' + Math.floor(c / 100).toLocaleString('es-VE') + ',' + String(c % 100).padStart(2, '0'); };
  PV.currencyNote = 'USD · precios de demostración';
  PV.time = function(iso){ return new Date(iso).toLocaleTimeString('es-VE', { hour:'numeric', minute:'2-digit' }); };
  PV.date = function(iso, opts){ return new Date(iso).toLocaleDateString('es-VE', opts || { day:'numeric', month:'short' }); };
  PV.dayKey = function(d){ d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  PV.ago = function(iso){
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 50) return 'ahora';
    if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h' + (Math.round(s % 3600 / 60) ? ' ' + Math.round(s % 3600 / 60) + ' min' : '');
    var dd = Math.floor(s / 86400); return dd === 1 ? 'ayer' : 'hace ' + dd + ' días';
  };
  PV.isToday = function(iso){ return PV.dayKey(iso) === PV.dayKey(Date.now()); };
  PV.asset = function(src){ return src ? '../' + src : ''; };
  PV.data = function(){ return DB.peek(); };

  /* ---------- Catálogo efectivo (menu-data + cambios del panel) ---------- */
  var byId = {}; M.products.forEach(function(p){ byId[p.id] = p; });
  var catById = {}; M.categories.forEach(function(c){ catById[c.id] = c; });
  PV.category = function(id){ return catById[id] || { label: id }; };
  PV.product = function(id, d){
    var p = byId[id]; if (!p) return null;
    var o = ((d || PV.data()).overrides || {})[id] || {};
    return { id: p.id, base: p, category: p.category, group: p.group, name: p.name,
      price: typeof o.price === 'number' ? o.price : p.price, origPrice: p.price,
      short: typeof o.short === 'string' ? o.short : p.short, origShort: p.short,
      available: o.available !== false, edited: Object.keys(o).length > 0,
      img: p.images ? p.images[0] : p.cartImage || null, variants: p.variants || [], extras: p.extras || [] };
  };

  /* ---------- Iconos (trazo fino, coherentes con la web) ---------- */
  var P = {
    home:'<path d="M3.5 10.5 12 4l8.5 6.5M6 9v10h12V9"/><path d="M10 19v-5h4v5"/>',
    orders:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    tables:'<path d="M3 9h18M5 9v10M19 9v10M8 9l1-4h6l1 4"/>',
    sales:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    menu:'<path d="M12 3 3 19h18z"/><circle cx="10" cy="13" r="1.2"/><circle cx="14" cy="15" r="1.2"/><circle cx="12.5" cy="10" r="1"/>',
    bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    soundOn:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    soundOff:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>',
    more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    local:'<path d="M4 10h16M6 10v9M18 10v9M3 21h18M8 10l1.5-5h5L16 10"/>',
    delivery:'<circle cx="6" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M9 17h5.5L17 11h-4l-2-3H8M14 6h3l1.5 5"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrowR:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    phone:'<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
    pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    user:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.7 4.2-5.5 7.5-5.5s6.1 1.8 7.5 5.5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    refresh:'<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit:'<path d="M14.5 4.5l5 5L9 20H4v-5z"/>',
    play:'<path d="M7 4.5v15L19.5 12z"/>',
    external:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    board:'<rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="15.5" y="4" width="5" height="7" rx="1.5"/>',
    cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    alert:'<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    mesero:'<path d="M6 15a6 6 0 0 1 12 0M4 15h16M12 9V7M10 7h4M8 19h8"/>',
    cuenta:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
    agua:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    cubiertos:'<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M16 3c-1.7 1.5-2.5 4-2.5 7H17V3zM16 13v8"/>',
    ayuda:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5V14M12 17.2v.1"/>',
    flame:'<path d="M12 21c-4 0-6.5-2.7-6.5-6.3 0-3.9 3.4-5.7 3.9-10.2 2.6 1.6 4.1 4 4.3 6.1 1-.8 1.6-2 1.8-3.3 1.9 1.7 3 4.1 3 6.9C18.5 18.4 16 21 12 21z"/>',
    sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    db:'<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
    table:'<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M9 9.5V20"/>',
    note:'<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/>'
  };
  PV.icon = function(n, cls){ return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; };
  var I = PV.icon;

  /* ---------- Etiquetas compartidas ---------- */
  PV.statusPill = function(o){ var s = DB.STATUS[o.status] || {}; return '<span class="pill pill--' + s.tone + '"><i></i>' + esc(DB.statusLabel(o.status, o.mode)) + '</span>'; };
  PV.payPill = function(o){ var s = DB.PAYMENT[o.payment.status] || {}; return '<span class="pay pay--' + s.tone + '">' + I('cash') + esc(s.label) + '</span>'; };
  PV.modeChip = function(o){ return o.mode === 'delivery' ? '<span class="mode mode--dl">' + I('delivery') + 'Delivery</span>' : '<span class="mode mode--lc">' + I('local') + 'En el local</span>'; };
  PV.where = function(o){
    if (o.mode === 'delivery') return (o.customer && o.customer.name ? esc(o.customer.name) + ' · ' : '') + esc((o.delivery && o.delivery.phone) || 'Sin teléfono');
    return o.table ? 'Mesa ' + esc(o.table) : '<span class="muted">Mesa no identificada</span>';
  };
  PV.sourceTag = function(o){ return o.source === 'ejemplo' ? '<span class="tag tag--demo">Ejemplo</span>' : o.source === 'simulado' ? '<span class="tag tag--sim">Simulado</span>' : '<span class="tag tag--web">Desde la web</span>'; };
  PV.itemsLine = function(o){ return o.items.map(function(i){ return i.qty + '× ' + i.name; }).join(' · '); };
  var ACTION = { confirmado:'Confirmar', en_preparacion:'A preparación', listo:'Marcar listo', en_camino:'Enviar · en camino', entregado:'Marcar entregado', finalizado:'Finalizar', cancelado:'Cancelar' };
  var ACTION_LONG = { confirmado:'Confirmar pedido', en_preparacion:'Pasar a preparación', listo:'Marcar como listo', en_camino:'Marcar en camino', entregado:'Marcar como entregado', finalizado:'Finalizar pedido', cancelado:'Cancelar pedido' };
  PV.actionLabel = function(to, long){ return (long ? ACTION_LONG : ACTION)[to] || to; };
  PV.primaryNext = function(o){ return DB.nextStates(o).filter(function(s){ return s !== 'cancelado'; })[0] || null; };

  /* Acción sobre un pedido (cancelar siempre pide confirmación y motivo) */
  PV.act = function(id, to, btn){
    if (to === 'cancelado') return PV.cancelDialog(id);
    if (btn){ btn.disabled = true; btn.classList.add('is-busy'); }
    return DB.updateStatus(id, to, { by:'Personal (demo)' }).then(function(o){
      PV.toast(o.id + ' · ' + DB.statusLabel(o.status, o.mode), { tone: DB.STATUS[o.status].tone, icon:'check' });
      return o;
    }, function(err){ if (btn){ btn.disabled = false; btn.classList.remove('is-busy'); } PV.toast(err.message, { tone:'cancel', icon:'alert' }); });
  };
  PV.cancelDialog = function(id){
    var o = PV.data().orders.filter(function(x){ return x.id === id; })[0]; if (!o) return;
    var reasons = o.mode === 'delivery' ? ['El cliente lo canceló','Dirección fuera de la zona','Producto agotado','No se pudo contactar al cliente','Pedido duplicado'] : ['El cliente lo canceló','Producto agotado','Pedido duplicado','Error al tomar el pedido'];
    PV.modal.open({
      title: 'Cancelar ' + o.id, tone:'danger',
      body: '<p class="mp">El pedido dejará de contar en las ventas. Esta acción no se puede deshacer en la demo.</p>' +
        '<p class="lbl">Motivo de la cancelación <span class="req">Obligatorio</span></p>' +
        '<div class="chips chips--wrap" data-reasons>' + reasons.map(function(r){ return '<button type="button" class="chip" data-r="' + esc(r) + '">' + esc(r) + '</button>'; }).join('') + '</div>' +
        '<label class="sr-only" for="cancelReason">Motivo</label><textarea id="cancelReason" class="field" rows="2" maxlength="200" placeholder="Escribe el motivo o elige uno de arriba"></textarea>' +
        '<p class="ferr" id="cancelErr" aria-live="polite"></p>',
      actions: [{ label:'Volver', ghost:true }, { label:'Cancelar pedido', danger:true, run: function(root){
        var r = $('#cancelReason', root).value.trim();
        if (!r){ $('#cancelErr', root).textContent = 'Indica el motivo para poder cancelar.'; $('#cancelReason', root).focus(); return false; }
        return DB.updateStatus(id, 'cancelado', { reason: r, by:'Personal (demo)' }).then(function(){ PV.toast(id + ' cancelado', { tone:'cancel', icon:'x' }); }, function(err){ $('#cancelErr', root).textContent = err.message; return false; });
      } }],
      mount: function(root){
        root.addEventListener('click', function(e){ var c = e.target.closest('[data-r]'); if (!c) return; $('#cancelReason', root).value = c.dataset.r; PV.$$('[data-r]', root).forEach(function(x){ x.classList.toggle('is-on', x === c); }); $('#cancelErr', root).textContent = ''; });
        setTimeout(function(){ var f = root.querySelector('[data-r]'); f && f.focus(); }, 60);
      }
    });
  };

  /* ---------- Avisos (toasts) ---------- */
  PV.toast = function(text, o){
    o = o || {};
    var box = $('#toasts'), t = document.createElement('div');
    t.className = 'toast toast--' + (o.tone || 'info') + (o.big ? ' toast--big' : '');
    t.innerHTML = '<span class="toast-ic">' + I(o.icon || 'check') + '</span><div class="toast-txt">' + (o.title ? '<b>' + esc(o.title) + '</b>' : '') + '<span>' + esc(text) + '</span></div>' +
      (o.action ? '<button type="button" class="toast-act">' + esc(o.action.label) + '</button>' : '') + '<button type="button" class="toast-x" aria-label="Cerrar aviso">' + I('x') + '</button>';
    box.appendChild(t);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    requestAnimationFrame(function(){ t.classList.add('in'); });
    var kill = function(){ t.classList.remove('in'); t.classList.add('out'); setTimeout(function(){ t.remove(); }, 260); };
    var timer = setTimeout(kill, o.ms || (o.big ? 7000 : 3600));
    t.addEventListener('mouseenter', function(){ clearTimeout(timer); });
    t.addEventListener('mouseleave', function(){ timer = setTimeout(kill, 2200); });
    t.querySelector('.toast-x').onclick = kill;
    if (o.action) t.querySelector('.toast-act').onclick = function(){ o.action.run(); kill(); };
  };

  /* ---------- Sonido opcional (desactivado por defecto) ---------- */
  var SKEY = 'daenzo.panel.sound', actx = null;
  PV.sound = {
    on: function(){ try { return localStorage.getItem(SKEY) === '1'; } catch(e){ return false; } },
    set: function(v){ try { localStorage.setItem(SKEY, v ? '1' : '0'); } catch(e){} paintSound(); if (v) PV.sound.play(); },
    play: function(){
      if (!PV.sound.on()) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        [[660, 0], [880, .16]].forEach(function(n){
          var o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = n[0];
          g.gain.setValueAtTime(0, actx.currentTime + n[1]); g.gain.linearRampToValueAtTime(.12, actx.currentTime + n[1] + .02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + n[1] + .45);
          o.connect(g); g.connect(actx.destination); o.start(actx.currentTime + n[1]); o.stop(actx.currentTime + n[1] + .5);
        });
      } catch(e){}
    }
  };
  function paintSound(){ var b = $('#soundBtn'), on = PV.sound.on(); b.innerHTML = I(on ? 'soundOn' : 'soundOff'); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', 'Sonido de avisos: ' + (on ? 'activado' : 'desactivado')); b.title = b.getAttribute('aria-label'); }
  PV.paintSound = paintSound;

  /* ---------- Ventana lateral (detalle) ---------- */
  var lastFocus = null;
  PV.drawer = {
    open: function(html, onClose){
      var d = $('#drawer'), s = $('#scrim');
      if (d.hidden) lastFocus = document.activeElement;
      d.innerHTML = html; d.hidden = false; s.hidden = false; d._onClose = onClose;
      requestAnimationFrame(function(){ d.classList.add('open'); s.classList.add('open'); });
      var f = d.querySelector('[data-autofocus]') || d.querySelector('.dr-x'); f && f.focus({ preventScroll:true });
    },
    update: function(html){ var d = $('#drawer'); if (d.hidden) return; var y = d.querySelector('.dr-body') ? d.querySelector('.dr-body').scrollTop : 0; d.innerHTML = html; var b = d.querySelector('.dr-body'); if (b) b.scrollTop = y; },
    close: function(silent){
      var d = $('#drawer'), s = $('#scrim'); if (d.hidden) return;
      d.classList.remove('open'); if ($('#modal').hidden) s.classList.remove('open');
      setTimeout(function(){ d.hidden = true; if ($('#modal').hidden) s.hidden = true; }, 280);
      var cb = d._onClose; d._onClose = null; if (cb && !silent) cb();
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll:true });
    },
    isOpen: function(){ return !$('#drawer').hidden; }
  };

  /* ---------- Ventana modal ---------- */
  PV.modal = {
    open: function(cfg){
      var m = $('#modal'), s = $('#scrim'), prev = document.activeElement;
      m.className = 'modal' + (cfg.tone ? ' modal--' + cfg.tone : '') + (cfg.wide ? ' modal--wide' : '');
      m.innerHTML = '<div class="modal-card"><header><h2 id="modalT">' + esc(cfg.title) + '</h2><button type="button" class="ibtn ibtn--sm" data-mx aria-label="Cerrar">' + I('x') + '</button></header>' +
        '<div class="modal-body">' + cfg.body + '</div><footer>' + (cfg.actions || []).map(function(a, i){
          return '<button type="button" class="btn ' + (a.danger ? 'btn--danger' : a.ghost ? 'btn--ghost' : 'btn--primary') + '" data-ma="' + i + '">' + esc(a.label) + '</button>';
        }).join('') + '</footer></div>';
      m.hidden = false; s.hidden = false;
      requestAnimationFrame(function(){ m.classList.add('open'); s.classList.add('open'); });
      function close(){ m.classList.remove('open'); if ($('#drawer').hidden) s.classList.remove('open'); setTimeout(function(){ m.hidden = true; m.innerHTML = ''; if ($('#drawer').hidden) s.hidden = true; }, 220); document.removeEventListener('keydown', key, true); prev && document.contains(prev) && prev.focus({ preventScroll:true }); }
      function key(e){
        if (e.key === 'Escape'){ e.stopPropagation(); e.preventDefault(); close(); }
        if (e.key === 'Tab'){ var f = PV.$$('button,textarea,input,select,a[href]', m).filter(function(x){ return !x.disabled && x.offsetParent; }); var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); } }
      }
      document.addEventListener('keydown', key, true);
      m.onclick = function(e){
        if (e.target === m || e.target.closest('[data-mx]')) return close();
        var b = e.target.closest('[data-ma]'); if (!b) return;
        var a = cfg.actions[+b.dataset.ma];
        if (!a.run) return close();
        b.disabled = true;
        Promise.resolve(a.run(m)).then(function(r){ if (r === false){ b.disabled = false; return; } close(); }, function(){ b.disabled = false; });
      };
      if (cfg.mount) cfg.mount(m);
      var f = m.querySelector('textarea,input') || m.querySelector('[data-ma]'); if (!cfg.mount) setTimeout(function(){ f && f.focus(); }, 60);
      return { close: close };
    },
    confirm: function(cfg){
      return new Promise(function(res){
        PV.modal.open({ title: cfg.title, tone: cfg.danger ? 'danger' : '', body: '<p class="mp">' + esc(cfg.text) + '</p>',
          actions: [{ label: cfg.cancel || 'Cancelar', ghost:true, run: function(){ res(false); } }, { label: cfg.ok || 'Aceptar', danger: !!cfg.danger, run: function(){ res(true); } }] });
      });
    }
  };

  /* ---------- Enrutador: #/vista/id?filtro=valor ---------- */
  PV.parse = function(){
    var h = (location.hash || '#/inicio').replace(/^#\/?/, ''), q = h.split('?'), parts = q[0].split('/'), params = {};
    (q[1] || '').split('&').forEach(function(kv){ if (!kv) return; var x = kv.split('='); params[decodeURIComponent(x[0])] = decodeURIComponent(x[1] || ''); });
    return { view: PV.views[parts[0]] ? parts[0] : 'inicio', id: parts[1] || null, params: params };
  };
  PV.go = function(view, params, id){
    var q = Object.keys(params || {}).filter(function(k){ return params[k] != null && params[k] !== ''; }).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    location.hash = '#/' + view + (id ? '/' + id : '') + (q ? '?' + q : '');
  };
  /* Cambia los filtros en la URL sin crear entradas nuevas en el historial */
  PV.setParams = function(view, params, id){
    var q = Object.keys(params || {}).filter(function(k){ return params[k] != null && params[k] !== ''; }).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    history.replaceState(null, '', '#/' + view + (id ? '/' + id : '') + (q ? '?' + q : ''));
  };
  PV.register = function(key, def){ PV.views[key] = def; PV.order.push(key); };
})();
