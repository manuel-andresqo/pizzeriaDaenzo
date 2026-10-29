/* =========================================================
   PANEL — ARRANQUE
   Entrada, navegación, herramientas de la demo, enrutado, avisos
   de eventos nuevos e indicadores persistentes.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, I = PV.icon, esc = PV.esc, $ = PV.$;
  var current = null, mounted = null, viewEl = $('#view');

  /* ---------- Entrada (demo sin autenticación) ---------- */
  var IN = 'daenzo.panel.in';
  function entered(){ try { return sessionStorage.getItem(IN) === '1'; } catch(e){ return true; } }
  function enter(){ try { sessionStorage.setItem(IN, '1'); } catch(e){} $('#gate').classList.add('out'); setTimeout(function(){ $('#gate').hidden = true; }, 420); $('#app').hidden = false; start(); }
  $('#gateEnter').addEventListener('click', enter);
  if (entered()){ $('#gate').hidden = true; $('#app').hidden = false; } else { $('#gate').hidden = false; requestAnimationFrame(function(){ $('#gate').classList.add('in'); }); setTimeout(function(){ $('#gateEnter').focus(); }, 300); }

  /* ---------- Navegación ---------- */
  $('#nav').innerHTML = PV.order.map(function(k){ var v = PV.views[k];
    return '<a href="#/' + k + '" class="nv" data-nav="' + k + '">' + I(v.icon) + '<span class="nv-l">' + esc(v.label) + '</span><span class="nv-s">' + esc(v.short || v.label) + '</span><em class="nv-b" hidden></em></a>'; }).join('');
  var TOOLS = '<p class="tools-k">Herramientas de la demo</p>' +
    '<button type="button" class="tool" data-tool="sim-order">' + I('play') + 'Simular pedido entrante</button>' +
    '<button type="button" class="tool" data-tool="sim-request">' + I('bell') + 'Simular solicitud de mesa</button>' +
    '<button type="button" class="tool" data-tool="seed">' + I('db') + 'Cargar datos de ejemplo</button>' +
    '<button type="button" class="tool tool--danger" data-tool="reset">' + I('trash') + 'Restablecer la demo</button>' +
    '<a class="tool" href="../index.html#ordenar" target="_blank" rel="noopener">' + I('external') + 'Abrir la web (pedir)</a>' +
    '<a class="tool" href="../index.html?mesa=5#pedido-local" target="_blank" rel="noopener">' + I('table') + 'Abrir la web en la mesa 5</a>';
  $('#sideTools').innerHTML = TOOLS;
  $('#sheetIn').innerHTML = '<header><b>Demostración</b><button type="button" class="ibtn ibtn--sm" data-sheet-x aria-label="Cerrar">' + I('x') + '</button></header>' + TOOLS +
    '<p class="hint">Los datos se guardan solo en este navegador. Para que la web y el panel se comuniquen, ábrelos en el mismo navegador.</p>';
  $('#moreBtn').innerHTML = I('more'); $('#bellBtn').insertAdjacentHTML('afterbegin', I('bell'));
  PV.paintSound();
  $('#soundBtn').addEventListener('click', function(){ PV.sound.set(!PV.sound.on()); PV.toast(PV.sound.on() ? 'Sonido de avisos activado' : 'Sonido de avisos desactivado', { tone:'info', icon: PV.sound.on() ? 'soundOn' : 'soundOff' }); });

  function tool(name){
    if (name === 'sim-order') return PV.seed.order();
    if (name === 'sim-request') return PV.seed.request();
    if (name === 'seed') return PV.modal.confirm({ title:'Cargar datos de ejemplo', text:'Se reemplazarán los pedidos y solicitudes actuales de la demo por datos de ejemplo de los últimos 7 días. Los cambios del menú se conservan.', ok:'Cargar datos de ejemplo' })
      .then(function(ok){ if (ok) PV.seed.load().then(function(){ PV.toast('Datos de ejemplo cargados', { tone:'ready', icon:'db' }); }); });
    if (name === 'reset') return PV.modal.confirm({ title:'Restablecer la demo', text:'Se borrarán todos los pedidos, solicitudes, avisos y cambios del menú guardados en este navegador. No se puede deshacer.', ok:'Borrar todo', danger:true })
      .then(function(ok){ if (ok) DB.reset().then(function(){ PV.toast('Demo restablecida: no hay datos', { tone:'info', icon:'refresh' }); }); });
  }
  function sheet(open){
    var s = $('#sheet'); if (open){ s.hidden = false; requestAnimationFrame(function(){ s.classList.add('open'); }); s.querySelector('[data-sheet-x]').focus(); }
    else { s.classList.remove('open'); setTimeout(function(){ s.hidden = true; }, 260); }
  }
  $('#moreBtn').addEventListener('click', function(){ sheet(true); });
  $('#sheet').addEventListener('click', function(e){ if (e.target === $('#sheet') || e.target.closest('[data-sheet-x]') || e.target.closest('.tool')) sheet(false); });

  /* ---------- Clics: herramientas, vista activa y detalle ---------- */
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-tool]'); if (t){ tool(t.dataset.tool); return; }
    if (e.target.closest('#drawer')){ var v0 = PV.views[current]; if (v0 && v0.drawerClick && v0.drawerClick(e)) return; if (e.target.closest('[data-close]')) PV.drawer.close(); return; }
    if (e.target.closest('#scrim') && $('#modal').hidden){ PV.drawer.close(); return; }
    if (e.target.closest('#view')){ var v = PV.views[current]; if (v && v.click) v.click(e); }
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (!$('#bell').hidden) return bell(false);
    if (!$('#sheet').hidden) return sheet(false);
    if ($('#modal').hidden && PV.drawer.isOpen()) PV.drawer.close();
  });

  /* ---------- Enrutado ---------- */
  function route(){
    var r = PV.parse();
    if (r.view !== current){
      if (current && PV.views[current].leave) PV.views[current].leave();
      if (PV.drawer.isOpen()) PV.drawer.close(true);
      current = r.view; viewEl.className = 'view view--' + current; viewEl.innerHTML = '';
      PV.views[current].mount(viewEl);
      viewEl.classList.remove('enter'); void viewEl.offsetWidth; viewEl.classList.add('enter');
      PV.views[current].update && PV.views[current].update(viewEl, PV.data());
      window.scrollTo(0, 0);
    }
    var v = PV.views[current];
    $('#topTitle').innerHTML = '<span class="tt-l">' + esc(v.label) + '</span><span class="tt-s">' + esc(v.short || v.label) + '</span>';
    var k = v.kicker ? v.kicker() : ''; $('#topK').textContent = k.charAt(0).toUpperCase() + k.slice(1);
    document.querySelectorAll('[data-nav]').forEach(function(a){ if (a.dataset.nav === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (v.route) v.route(viewEl, r.params, r.id);
    paintIndicators(PV.data());
  }
  addEventListener('hashchange', route);

  /* ---------- Indicadores persistentes ---------- */
  var SEEN = 'daenzo.panel.seen', processed = 0;
  function seen(){ try { return +localStorage.getItem(SEEN) || 0; } catch(e){ return 0; } }
  function setSeen(v){ try { localStorage.setItem(SEEN, String(v)); } catch(e){} }
  var NOTIFY = { order_new:1, request_new:1, order_cancel:1 };
  function paintIndicators(d){
    var nuevos = d.orders.filter(function(o){ return o.status === 'nuevo'; }).length;
    var pend = d.requests.filter(function(q){ return q.status === 'pendiente'; });
    var b1 = document.querySelector('[data-nav="pedidos"] .nv-b'), b2 = document.querySelector('[data-nav="mesas"] .nv-b');
    b1.hidden = !nuevos; b1.textContent = nuevos; b1.title = nuevos + ' pedidos por confirmar';
    b2.hidden = !pend.length; b2.textContent = pend.length; b2.classList.toggle('nv-b--pulse', pend.length > 0);
    var pill = $('#alertPill');
    if (pend.length && current !== 'mesas'){
      var bill = pend.filter(function(q){ return q.type === 'cuenta'; }).length;
      pill.innerHTML = '<span class="ap-ic">' + I('bell') + '</span><span><b>' + pend.length + ' ' + (pend.length === 1 ? 'solicitud de mesa pendiente' : 'solicitudes de mesa pendientes') + '</b>' + (bill ? '<small>' + bill + ' de cuenta</small>' : '') + '</span>' + I('arrowR');
      pill.hidden = false; requestAnimationFrame(function(){ pill.classList.add('in'); });
    } else { pill.classList.remove('in'); pill.hidden = true; }
    var unread = d.events.filter(function(e){ return !e.seed && NOTIFY[e.type] && e.id > seen(); }).length;
    var bc = $('#bellCount'); bc.hidden = !unread; bc.textContent = unread > 99 ? '99+' : unread;
    document.title = (unread ? '(' + unread + ') ' : '') + 'Panel de control · Da Enzo Pizzería';
    if (!$('#bell').hidden) paintBell(d);
  }
  $('#alertPill').addEventListener('click', function(){ location.hash = '#/mesas'; });

  /* ---------- Centro de avisos ---------- */
  function paintBell(d){
    var s = seen(), evs = d.events.filter(function(e){ return PV.describeEvent(e); }).slice(-30).reverse();
    $('#bellList').innerHTML = evs.length ? evs.map(function(e){ var x = PV.describeEvent(e); var link = e.data.orderId ? '#/pedidos/' + e.data.orderId : e.data.requestId ? '#/mesas' : '';
      return '<li class="' + (e.id > s && !e.seed && NOTIFY[e.type] ? 'is-new' : '') + '"><a href="' + link + '"><span class="feed-ic feed-ic--' + e.type + '">' + I(x.ic) + '</span><div><b>' + esc(x.t) + '</b><small>' + esc(x.s) + ' · ' + PV.ago(e.at) + '</small></div></a></li>'; }).join('')
      : '<li class="bell-empty">Sin avisos todavía.</li>';
  }
  function bell(open){
    var b = $('#bell'), btn = $('#bellBtn');
    if (open){ paintBell(PV.data()); b.hidden = false; requestAnimationFrame(function(){ b.classList.add('open'); }); btn.setAttribute('aria-expanded', 'true'); }
    else { b.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); setTimeout(function(){ b.hidden = true; }, 200); }
  }
  $('#bellBtn').addEventListener('click', function(e){ e.stopPropagation(); bell($('#bell').hidden); });
  $('#bellRead').addEventListener('click', function(){ var d = PV.data(); setSeen(d.seq.event); paintIndicators(d); });
  $('#bell').addEventListener('click', function(e){ if (e.target.closest('a')) bell(false); });
  document.addEventListener('click', function(e){ if (!$('#bell').hidden && !e.target.closest('#bell') && !e.target.closest('#bellBtn')) bell(false); });

  /* ---------- Eventos nuevos → avisos (solo cuando ocurre algo nuevo, nunca al redibujar) ---------- */
  function onEvents(d, change){
    var maxId = d.seq.event;
    if (change && change.initial){ processed = maxId; return; }   // primera copia desde la nube: no son eventos nuevos
    if (maxId < processed){ processed = 0; if (seen() > maxId) setSeen(0); }        // la demo se restableció
    var fresh = d.events.filter(function(e){ return e.id > processed && !e.seed; });
    processed = maxId;
    var ring = false;
    fresh.forEach(function(e){
      var x = PV.describeEvent(e); if (!x) return;
      if (e.type === 'order_new'){
        var o = d.orders.filter(function(z){ return z.id === e.data.orderId; })[0]; if (!o) return;
        ring = true;
        PV.toast(PV.itemsLine(o) + ' · ' + PV.money(DB.totals(o).total), { title:'Nuevo pedido ' + o.id + ' · ' + (o.mode === 'delivery' ? 'Delivery' : o.table ? 'Mesa ' + o.table : 'Mesa no identificada'), tone:'new', icon: o.mode === 'delivery' ? 'delivery' : 'local', big:true,
          action:{ label:'Ver pedido', run:function(){ location.hash = '#/pedidos/' + o.id; } } });
      } else if (e.type === 'request_new'){
        ring = true;
        PV.toast(e.data.type === 'cuenta' ? 'Revisa la cuenta de la mesa: no se cobra automáticamente.' : 'Un cliente necesita atención.', { title: x.t, tone:'req', icon: e.data.type, big:true, action:{ label:'Ver', run:function(){ location.hash = '#/mesas'; } } });
      } else if (e.tab !== DB.tab){                     // cambios hechos en otra pestaña del panel
        PV.toast(x.s, { title: x.t, tone: e.type === 'order_cancel' ? 'cancel' : 'info', icon: x.ic });
      }
    });
    if (ring){ PV.sound.play(); var s = $('#sync'); s.classList.remove('ping'); void s.offsetWidth; s.classList.add('ping'); }
  }

  /* Indicador de conexión: solo este navegador o nube (todos los dispositivos) */
  function paintSync(){
    var s = $('#sync'), st = DB.cloud.state(), txt = {
      local: 'Conectado a la web · este navegador', live: 'En la nube · todos los dispositivos (demo)',
      connecting: 'Conectando con la nube…', offline: 'Sin conexión con la nube · reintentando', error: 'Error con la nube · reintentando' }[st] || st;
    s.querySelector('span').textContent = txt; s.title = txt; s.dataset.state = st;
  }
  DB.cloud.onState(paintSync); paintSync();

  var started = false;
  function start(){
    if (started) return; started = true;
    processed = PV.data().seq.event;                   // lo anterior a abrir el panel no genera avisos
    DB.subscribe(function(d, change){
      onEvents(d, change);
      var v = PV.views[current]; if (v && v.update) v.update(viewEl, d);
      paintIndicators(d);
    });
    if (!location.hash) history.replaceState(null, '', '#/inicio');
    route();
    /* tiempos relativos («hace 3 min») al día sin redibujar nada más */
    setInterval(function(){ var v = PV.views[current]; if (v && v.update && !$('#modal').classList.contains('open') && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) v.update(viewEl, PV.data()); }, 60000);
  }
  if (entered()) start();
})();
