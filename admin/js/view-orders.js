/* =========================================================
   MÓDULO 2 · PEDIDOS — centro de operaciones
   Lista o tablero, filtros (modalidad, estado, fecha), búsqueda y
   detalle con acciones que dependen del estado y de la modalidad.
   Los filtros viven en la URL: al volver del detalle no se pierden.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, I = PV.icon, esc = PV.esc;
  var F = { modo:'todos', estado:'activos', fecha:'todo', q:'', vista:'lista' };
  var root = null, openId = null;

  var ESTADOS = [['activos','Activos'],['nuevo','Nuevos'],['confirmado','Confirmados'],['en_preparacion','En preparación'],['listo','Listos'],['en_camino','En camino'],['completados','Completados'],['cancelado','Cancelados'],['todos','Todos']];
  var FECHAS = [['hoy','Hoy'],['ayer','Ayer'],['7d','Últimos 7 días'],['todo','Todas las fechas']];

  function inDate(o){
    if (F.fecha === 'todo') return true;
    var k = PV.dayKey(o.createdAt), t = new Date(); t.setHours(0,0,0,0);
    if (F.fecha === 'hoy') return k === PV.dayKey(t);
    if (F.fecha === 'ayer'){ var y = new Date(t); y.setDate(y.getDate() - 1); return k === PV.dayKey(y); }
    var w = new Date(t); w.setDate(w.getDate() - 6); return new Date(o.createdAt) >= w;
  }
  function inState(o, st){
    st = st || F.estado;
    if (st === 'todos') return true;
    if (st === 'activos') return !DB.isFinal(o.status);
    if (st === 'completados') return o.status === 'finalizado' || o.status === 'entregado';
    return o.status === st;
  }
  function inSearch(o){
    var q = F.q.trim().toLowerCase(); if (!q) return true;
    var hay = [o.id, o.id.replace('DE-',''), o.table ? 'mesa ' + o.table : 'mesa no identificada', o.customer && o.customer.name, o.delivery && o.delivery.phone, o.delivery && o.delivery.address].join(' ').toLowerCase();
    return hay.indexOf(q.replace(/^#/, '')) >= 0;
  }
  function list(d, ignoreState){
    return d.orders.filter(function(o){ return (F.modo === 'todos' || o.mode === F.modo) && inDate(o) && inSearch(o) && (ignoreState || inState(o)); });
  }

  /* ---------- Tarjeta de pedido ---------- */
  function card(o, compact){
    var t = DB.totals(o), nx = PV.primaryNext(o), fresh = o.status === 'nuevo' && Date.now() - new Date(o.createdAt) < 120000;
    var ex = o.items.reduce(function(a, i){ return a + i.extras.length; }, 0);
    return '<article class="oc' + (compact ? ' oc--sm' : '') + (fresh ? ' is-fresh' : '') + (openId === o.id ? ' is-open' : '') + ' oc--' + DB.STATUS[o.status].tone + '" data-id="' + o.id + '" tabindex="0" role="button" aria-label="Abrir pedido ' + o.id + '">' +
      '<header class="oc-h"><b class="oc-id">' + o.id + '</b>' + (compact ? '' : PV.sourceTag(o)) + PV.statusPill(o) + '</header>' +
      '<p class="oc-meta">' + PV.modeChip(o) + '<span>' + PV.where(o) + '</span></p>' +
      '<p class="oc-time">' + I('clock') + PV.time(o.createdAt) + ' · ' + (DB.isFinal(o.status) ? PV.date(o.createdAt) : PV.ago(o.createdAt)) + '</p>' +
      '<p class="oc-items">' + esc(PV.itemsLine(o)) + (ex ? ' <em>+' + ex + ' extra' + (ex > 1 ? 's' : '') + '</em>' : '') + '</p>' +
      '<footer class="oc-f"><span class="oc-tot">' + PV.money(t.total) + (t.feePending ? '<small> + envío</small>' : '') + '</span>' + (compact ? '' : PV.payPill(o)) +
        (nx ? '<button type="button" class="btn btn--sm btn--primary oc-act" data-act="' + nx + '">' + PV.actionLabel(nx) + '</button>' : '') + '</footer>' +
    '</article>';
  }

  /* ---------- Detalle ---------- */
  function detail(o){
    var t = DB.totals(o), nxt = DB.nextStates(o), pri = PV.primaryNext(o), flow = DB.FLOW[o.mode];
    var idx = flow.indexOf(o.status), d = o.delivery || {};
    return '<header class="dr-h"><button type="button" class="ibtn dr-x" data-close aria-label="Volver al listado">' + I('arrowL') + '</button>' +
        '<div class="dr-ht"><p class="dr-k">' + PV.modeChip(o) + PV.sourceTag(o) + '</p><h2 id="drawerT">' + o.id + '</h2><p class="dr-when">Recibido el ' + PV.date(o.createdAt, { weekday:'short', day:'numeric', month:'short' }) + ' a las ' + PV.time(o.createdAt) + ' · ' + PV.ago(o.createdAt) + '</p></div>' + PV.statusPill(o) + '</header>' +
      '<div class="dr-body">' +
        /* acciones según el estado y la modalidad */
        (pri ? '<div class="dr-acts"><button type="button" class="btn btn--primary btn--lg" data-act="' + pri + '" data-autofocus>' + I('check') + PV.actionLabel(pri, true) + '</button>' +
               (nxt.indexOf('cancelado') >= 0 ? '<button type="button" class="btn btn--ghost-danger" data-act="cancelado">' + I('x') + 'Cancelar pedido</button>' : '') + '</div>'
             : '<p class="dr-final dr-final--' + DB.STATUS[o.status].tone + '">' + I(o.status === 'cancelado' ? 'x' : 'check') + (o.status === 'cancelado' ? 'Pedido cancelado' + (o.cancelReason ? ': ' + esc(o.cancelReason) : '') + '. No cuenta en las ventas.' : 'Pedido ' + DB.statusLabel(o.status, o.mode).toLowerCase() + '. No hay más acciones.') + '</p>') +
        (o.status !== 'cancelado' ? '<ol class="steps" aria-label="Progreso del pedido">' + flow.map(function(s, i){ return '<li class="' + (i < idx ? 'is-done' : i === idx ? 'is-now' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '><i></i><span>' + esc(DB.statusLabel(s, o.mode)) + '</span></li>'; }).join('') + '</ol>' : '') +
        /* cliente, mesa y entrega */
        '<section class="dr-sec"><h3>' + (o.mode === 'delivery' ? 'Entrega' : 'Mesa y cliente') + '</h3><dl class="kv">' +
          (o.mode === 'local' ? '<div><dt>' + I('table') + 'Mesa</dt><dd>' + (o.table ? 'Mesa ' + esc(o.table) : '<span class="muted">Mesa no identificada (sin QR/NFC)</span>') + '</dd></div>' : '') +
          '<div><dt>' + I('user') + 'Cliente</dt><dd>' + (o.customer && o.customer.name ? esc(o.customer.name) : '<span class="muted">Sin nombre</span>') + '</dd></div>' +
          (o.mode === 'delivery' ? '<div><dt>' + I('phone') + 'Teléfono</dt><dd>' + (d.phone ? '<a class="lnk" href="tel:' + esc(d.phone.replace(/[^\d+]/g, '')) + '">' + esc(d.phone) + '</a>' : '—') + '</dd></div>' +
            '<div><dt>' + I('pin') + 'Dirección</dt><dd>' + esc(d.address || '—') + '</dd></div>' +
            (d.reference ? '<div><dt>' + I('note') + 'Referencia</dt><dd>' + esc(d.reference) + '</dd></div>' : '') +
            (d.mapsUrl ? '<div><dt>' + I('pin') + 'Ubicación</dt><dd><a class="lnk" href="' + esc(d.mapsUrl) + '" target="_blank" rel="noopener noreferrer">Abrir en Google Maps ' + I('external') + '</a></dd></div>' : '') : '') +
          (o.note ? '<div><dt>' + I('note') + 'Observaciones</dt><dd>' + esc(o.note) + '</dd></div>' : '') +
        '</dl></section>' +
        /* productos */
        '<section class="dr-sec"><h3>Productos <small>' + t.units + ' ' + (t.units === 1 ? 'unidad' : 'unidades') + '</small></h3><ul class="items">' + o.items.map(function(i){
          var u = DB.lineUnit(i);
          return '<li><span class="items-q">' + i.qty + '×</span><div class="items-n"><b>' + esc(i.name) + '</b><small>' + esc(i.categoryLabel || '') + (i.variant ? ' · ' + esc(i.variant) : '') + ' · ' + PV.money(i.basePrice) + '</small>' +
            (i.extras.length ? '<ul class="items-x">' + i.extras.map(function(x){ return '<li>+ ' + esc(x.label) + '<span>' + (x.price ? '+' + PV.money(x.price) : 'sin costo') + '</span></li>'; }).join('') + '</ul>' : '') +
            (i.note ? '<p class="items-note">' + esc(i.note) + '</p>' : '') + '</div>' +
            '<div class="items-p"><small>' + i.qty + ' × ' + PV.money(u) + '</small><b>' + PV.money(u * i.qty) + '</b></div></li>';
        }).join('') + '</ul>' +
        '<dl class="sum"><div><dt>Subtotal</dt><dd>' + PV.money(t.subtotal) + '</dd></div>' +
          (o.mode === 'delivery' ? '<div><dt>Envío</dt><dd>' + (t.feePending ? '<span class="muted">Por confirmar (sin tarifa configurada)</span>' : PV.money(t.fee)) + '</dd></div>' : '') +
          '<div class="sum-t"><dt>Total' + (t.feePending ? ' sin envío' : '') + '</dt><dd>' + PV.money(t.total) + '</dd></div></dl>' +
        '<p class="hint">Total calculado con los precios, las cantidades y los extras de cada producto.</p></section>' +
        /* pago (independiente del estado del pedido) */
        '<section class="dr-sec"><h3>Pago ' + PV.payPill(o) + '</h3>' +
          (o.status === 'cancelado' && o.payment.status !== 'confirmado' ? '<p class="hint">Pedido cancelado: no se espera cobro.</p>' :
          '<div class="pay-acts">' + DB.paymentOptions(o).map(function(p){ return '<button type="button" class="chip chip--pay chip--' + DB.PAYMENT[p].tone + '" data-pay="' + p + '">' + esc(DB.PAYMENT[p].label) + '</button>'; }).join('') + '</div>' +
          '<p class="hint">Cambio manual del personal. En la demo no hay verificación bancaria ni cobros reales.</p>') + '</section>' +
        /* historial */
        '<section class="dr-sec"><h3>Historial</h3><ol class="hist">' + o.history.slice().reverse().map(function(h){
          var txt = h.type === 'created' ? 'Pedido recibido' : h.type === 'payment' ? DB.PAYMENT[h.to].label : DB.statusLabel(h.to, o.mode);
          return '<li class="hist--' + h.type + '"><i></i><div><b>' + esc(txt) + '</b><small>' + PV.date(h.at) + ' · ' + PV.time(h.at) + ' · ' + esc(h.by || '') + (h.reason ? ' · Motivo: ' + esc(h.reason) : '') + '</small></div></li>';
        }).join('') + '</ol></section>' +
      '</div>';
  }
  function openDetail(id, d){
    var o = d.orders.filter(function(x){ return x.id === id; })[0];
    if (!o){ PV.toast('No existe el pedido ' + id + '.', { tone:'cancel', icon:'alert' }); PV.setParams('pedidos', F); openId = null; return; }
    var html = detail(o);
    if (openId === id && PV.drawer.isOpen()) PV.drawer.update(html);
    else PV.drawer.open(html, function(){ openId = null; PV.setParams('pedidos', F); paint(PV.data()); });
    openId = id;
    PV.$$('.oc.is-open', root).forEach(function(c){ c.classList.toggle('is-open', c.dataset.id === id); });
  }

  /* ---------- Pintado ---------- */
  function counts(d){
    var base = d.orders.filter(function(o){ return (F.modo === 'todos' || o.mode === F.modo) && inDate(o) && inSearch(o); }), c = {};
    ESTADOS.forEach(function(e){ c[e[0]] = base.filter(function(o){ return inState(o, e[0]); }).length; });
    var m = d.orders.filter(function(o){ return inDate(o) && inSearch(o) && inState(o); });
    c.m_todos = m.length; c.m_local = m.filter(function(o){ return o.mode === 'local'; }).length; c.m_delivery = m.length - c.m_local;
    return c;
  }
  function paintToolbar(d){
    var c = counts(d);
    PV.$$('[data-modo]', root).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.modo === F.modo)); b.querySelector('em').textContent = c['m_' + b.dataset.modo]; });
    PV.$$('[data-estado]', root).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.estado === F.estado)); b.querySelector('em').textContent = c[b.dataset.estado]; });
    PV.$$('[data-vista]', root).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.vista === F.vista)); });
    root.querySelector('#fFecha').value = F.fecha;
    root.querySelector('.ord-states').hidden = F.vista === 'tablero';
  }
  function paint(d){
    if (!root) return;
    paintToolbar(d);
    var out = root.querySelector('.ord-out');
    if (!d.orders.length){ out.innerHTML = PV.emptyState('Aún no hay pedidos', 'Los pedidos que se confirmen en la web aparecerán aquí con un aviso.'); return; }
    if (F.vista === 'tablero'){
      var cols = F.modo === 'local' ? DB.FLOW.local.slice(0, 4) : DB.FLOW.delivery.slice(0, 5);
      var all = list(d, true);
      out.innerHTML = '<div class="board">' + cols.concat(['completados']).map(function(st){
        var items = all.filter(function(o){ return inState(o, st); }).sort(function(a, b){ return a.createdAt < b.createdAt ? -1 : 1; });
        if (st === 'completados') items = items.reverse().slice(0, 12);
        var label = st === 'completados' ? 'Completados' : st === 'listo' ? 'Listos' : DB.statusLabel(st, F.modo === 'todos' ? 'local' : F.modo);
        return '<section class="col col--' + (st === 'completados' ? 'done' : DB.STATUS[st].tone) + '"><header><i></i><b>' + esc(label) + '</b><em>' + items.length + '</em></header>' +
          '<div class="col-in">' + (items.length ? items.map(function(o){ return card(o, true); }).join('') : '<p class="col-empty">Sin pedidos</p>') + '</div></section>';
      }).join('') + '</div>';
      return;
    }
    var rows = list(d), active = F.estado === 'activos' || ['nuevo','confirmado','en_preparacion','listo','en_camino'].indexOf(F.estado) >= 0;
    rows.sort(function(a, b){ return active ? (a.createdAt < b.createdAt ? -1 : 1) : (a.createdAt < b.createdAt ? 1 : -1); });
    out.innerHTML = rows.length ? '<p class="ord-count">' + rows.length + ' ' + (rows.length === 1 ? 'pedido' : 'pedidos') + (active ? ' · el más antiguo primero' : ' · el más reciente primero') + '</p><div class="ord-grid">' + rows.map(function(o){ return card(o); }).join('') + '</div>'
      : '<div class="empty empty--sm">' + I('search') + '<h2>No hay pedidos con estos filtros</h2><p>Prueba con otra fecha, otro estado o borra la búsqueda.</p><button type="button" class="btn btn--ghost" data-reset>Quitar filtros</button></div>';
  }

  PV.register('pedidos', {
    label:'Pedidos', icon:'orders', kicker: function(){ return 'Centro de operaciones'; },
    mount: function(r){
      root = r;
      r.innerHTML =
        '<div class="ord-bar">' +
          '<div class="seg" role="group" aria-label="Modalidad">' + [['todos','Todos',''],['local','En el local','local'],['delivery','Delivery','delivery']].map(function(m){ return '<button type="button" data-modo="' + m[0] + '" aria-pressed="false">' + (m[2] ? I(m[2]) : '') + m[1] + ' <em>0</em></button>'; }).join('') + '</div>' +
          '<label class="search">' + I('search') + '<span class="sr-only">Buscar pedido</span><input type="search" id="fQ" placeholder="Buscar por número (DE-1004), mesa, cliente o teléfono" autocomplete="off"></label>' +
          '<div class="ord-right"><label class="sel"><span class="sr-only">Fecha</span>' + I('clock') + '<select id="fFecha">' + FECHAS.map(function(f){ return '<option value="' + f[0] + '">' + f[1] + '</option>'; }).join('') + '</select></label>' +
          '<div class="seg seg--icons" role="group" aria-label="Vista"><button type="button" data-vista="lista" aria-pressed="true" title="Lista">' + I('list') + '<span class="sr-only">Lista</span></button><button type="button" data-vista="tablero" aria-pressed="false" title="Tablero">' + I('board') + '<span class="sr-only">Tablero</span></button></div></div>' +
        '</div>' +
        '<div class="chips ord-states" role="group" aria-label="Estado">' + ESTADOS.map(function(e){ return '<button type="button" class="chip" data-estado="' + e[0] + '" aria-pressed="false">' + e[1] + ' <em>0</em></button>'; }).join('') + '</div>' +
        '<div class="ord-out"></div>';
      var q = r.querySelector('#fQ'), deb = null;
      q.addEventListener('input', function(){ clearTimeout(deb); deb = setTimeout(function(){ F.q = q.value; PV.setParams('pedidos', F, openId); paint(PV.data()); }, 140); });
      r.querySelector('#fFecha').addEventListener('change', function(e){ F.fecha = e.target.value; PV.setParams('pedidos', F, openId); paint(PV.data()); });
      r.addEventListener('keydown', function(e){ if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('oc')){ e.preventDefault(); PV.go('pedidos', F, e.target.dataset.id); } });
    },
    route: function(r, params, id){
      F.modo = ['local','delivery'].indexOf(params.modo) >= 0 ? params.modo : 'todos';
      F.estado = ESTADOS.some(function(e){ return e[0] === params.estado; }) ? params.estado : 'activos';
      F.fecha = FECHAS.some(function(f){ return f[0] === params.fecha; }) ? params.fecha : 'todo';
      F.vista = params.vista === 'tablero' ? 'tablero' : 'lista';
      F.q = params.q || ''; var q = r.querySelector('#fQ'); if (q.value !== F.q) q.value = F.q;
      var d = PV.data(); paint(d);
      if (id) openDetail(id, d); else if (PV.drawer.isOpen() && openId){ openId = null; PV.drawer.close(true); }
    },
    update: function(r, d){ paint(d); if (openId && PV.drawer.isOpen()) openDetail(openId, d); },
    click: function(e){
      var t = e.target;
      var m = t.closest('[data-modo]'); if (m){ F.modo = m.dataset.modo; PV.setParams('pedidos', F, openId); paint(PV.data()); return true; }
      var s = t.closest('[data-estado]'); if (s){ F.estado = s.dataset.estado; PV.setParams('pedidos', F, openId); paint(PV.data()); return true; }
      var v = t.closest('[data-vista]'); if (v){ F.vista = v.dataset.vista; PV.setParams('pedidos', F, openId); paint(PV.data()); return true; }
      if (t.closest('[data-reset]')){ F = { modo:'todos', estado:'todos', fecha:'todo', q:'', vista:F.vista }; root.querySelector('#fQ').value = ''; PV.setParams('pedidos', F); paint(PV.data()); return true; }
      var c = t.closest('.oc');
      if (c && t.closest('[data-act]')){ e.stopPropagation(); PV.act(c.dataset.id, t.closest('[data-act]').dataset.act, t.closest('[data-act]')); return true; }
      if (c){ PV.go('pedidos', F, c.dataset.id); return true; }
    },
    drawerClick: function(e){
      var a = e.target.closest('[data-act]'); if (a && openId){ PV.act(openId, a.dataset.act, a); return true; }
      var p = e.target.closest('[data-pay]'); if (p && openId){
        var to = p.dataset.pay; p.disabled = true;
        DB.updatePayment(openId, to, { by:'Personal (demo)' }).then(function(o){ PV.toast(o.id + ' · ' + DB.PAYMENT[to].label, { tone: DB.PAYMENT[to].tone === 'ok' ? 'ready' : DB.PAYMENT[to].tone === 'bad' ? 'cancel' : 'info', icon:'cash' }); }, function(err){ p.disabled = false; PV.toast(err.message, { tone:'cancel', icon:'alert' }); });
        return true;
      }
      if (e.target.closest('[data-close]')){ PV.drawer.close(); return true; }
    },
    leave: function(){ if (openId){ openId = null; PV.drawer.close(true); } root = null; }
  });
})();
