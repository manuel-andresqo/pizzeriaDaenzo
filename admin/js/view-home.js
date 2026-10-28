/* =========================================================
   MÓDULO 1 · INICIO — resumen del negocio
   Todas las cifras se calculan a partir de los pedidos guardados.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, I = PV.icon, esc = PV.esc;

  function stats(d){
    var today = d.orders.filter(function(o){ return PV.isToday(o.createdAt); });
    var valid = today.filter(function(o){ return o.status !== 'cancelado'; });
    var reg = 0, paid = 0;
    valid.forEach(function(o){ var t = DB.totals(o).total; reg += t; if (o.payment.status === 'confirmado') paid += t; });
    var count = function(st){ return d.orders.filter(function(o){ return o.status === st; }).length; };
    return { today: today.length, nuevo: count('nuevo'), cooking: count('en_preparacion'), ready: count('listo'),
             reg: reg, paid: paid, pending: reg - paid, requests: d.requests.filter(function(q){ return q.status === 'pendiente'; }).length };
  }

  function kpi(k){
    return '<button type="button" class="kpi kpi--' + k.tone + (k.hot ? ' is-hot' : '') + '" data-go="' + k.go + '">' +
      '<span class="kpi-ic">' + I(k.icon) + '</span>' +
      '<span class="kpi-l">' + k.label + '</span>' +
      '<b class="kpi-v" data-count="' + (k.money ? '' : k.value) + '">' + (k.money ? PV.money(k.value) : k.value) + '</b>' +
      '<span class="kpi-s">' + k.sub + '</span>' +
      '<span class="kpi-go" aria-hidden="true">' + I('arrowR') + '</span></button>';
  }

  /* Lo que el personal debe resolver ya: nuevos, listos y solicitudes */
  function attention(d){
    var rows = [];
    d.orders.filter(function(o){ return o.status === 'nuevo'; }).forEach(function(o){ rows.push({ at:o.createdAt, html: row(o, 'Por confirmar', 'new') }); });
    d.orders.filter(function(o){ return o.status === 'listo'; }).forEach(function(o){ rows.push({ at:o.updatedAt, html: row(o, o.mode === 'delivery' ? 'Listo para salir' : 'Listo para servir', 'ready') }); });
    d.requests.filter(function(q){ return q.status === 'pendiente'; }).forEach(function(q){
      rows.push({ at:q.createdAt, html: '<li class="att att--req"><span class="att-ic">' + I(q.type) + '</span><div><b>' + (q.table ? 'Mesa ' + esc(q.table) : 'Mesa no identificada') + ' · ' + esc(DB.REQUEST[q.type].label) + '</b><small>' + PV.ago(q.createdAt) + (q.type === 'cuenta' ? ' · revisar la cuenta (sin cobro automático)' : '') + '</small></div>' +
        '<button type="button" class="btn btn--sm btn--primary" data-req="' + q.id + '">Atender</button></li>' });
    });
    rows.sort(function(a, b){ return a.at < b.at ? -1 : 1; });
    return rows;
  }
  function row(o, why, tone){
    var nx = PV.primaryNext(o);
    return '<li class="att"><span class="att-ic att-ic--' + tone + '">' + I(o.mode === 'delivery' ? 'delivery' : 'local') + '</span>' +
      '<div><b><a href="#/pedidos/' + o.id + '" class="lnk">' + o.id + '</a> · ' + PV.where(o) + '</b><small>' + why + ' · ' + PV.ago(o.status === 'nuevo' ? o.createdAt : o.updatedAt) + ' · ' + PV.money(DB.totals(o).total) + '</small></div>' +
      (nx ? '<button type="button" class="btn btn--sm btn--primary" data-act="' + o.id + '" data-to="' + nx + '">' + PV.actionLabel(nx) + '</button>' : '') + '</li>';
  }

  var EVT = {
    order_new: function(e){ return { ic:'sparkle', t: 'Nuevo pedido ' + e.data.orderId, s: e.data.mode === 'delivery' ? 'Delivery' : e.data.table ? 'Mesa ' + e.data.table : 'En el local' }; },
    order_status: function(e){ return { ic:'check', t: e.data.orderId + ' → ' + DB.statusLabel(e.data.to, e.data.mode), s: 'Antes: ' + DB.statusLabel(e.data.from, e.data.mode) }; },
    order_cancel: function(e){ return { ic:'x', t: e.data.orderId + ' cancelado', s: 'Antes: ' + DB.statusLabel(e.data.from, e.data.mode) }; },
    payment: function(e){ return { ic:'cash', t: e.data.orderId + ' · ' + DB.PAYMENT[e.data.to].label, s: 'Antes: ' + DB.PAYMENT[e.data.from].label.toLowerCase() }; },
    request_new: function(e){ return { ic: e.data.type, t: (e.data.table ? 'Mesa ' + e.data.table : 'Mesa no identificada') + ' · ' + DB.REQUEST[e.data.type].label, s: 'Solicitud nueva' }; },
    request_update: function(e){ return { ic:'check', t: (e.data.table ? 'Mesa ' + e.data.table : 'Mesa no identificada') + ' · ' + DB.REQUEST[e.data.type].label, s: e.data.to === 'atendida' ? 'Atendida' : 'Resuelta' }; }
  };
  PV.describeEvent = function(e){ var f = EVT[e.type]; return f ? f(e) : null; };

  PV.emptyState = function(title, text){
    return '<div class="empty"><img src="../assets/logo-da-enzo.png" width="300" height="300" alt=""><h2>' + title + '</h2><p>' + text + '</p>' +
      '<div class="empty-acts"><button type="button" class="btn btn--primary" data-tool="seed">' + I('db') + 'Cargar datos de ejemplo</button><button type="button" class="btn btn--ghost" data-tool="sim-order">' + I('play') + 'Simular un pedido</button>' +
      '<a class="btn btn--ghost" href="../index.html#ordenar" target="_blank" rel="noopener">' + I('external') + 'Hacer un pedido en la web</a></div></div>';
  };

  PV.register('inicio', {
    label:'Inicio', icon:'home', kicker: function(){ return new Date().toLocaleDateString('es-VE', { weekday:'long', day:'numeric', month:'long' }); },
    mount: function(root){ root.innerHTML = '<div class="home"></div>'; },
    update: function(root, d){
      var box = root.querySelector('.home');
      if (!d.orders.length && !d.requests.length){ box.innerHTML = PV.emptyState('Todavía no hay pedidos', 'Cuando un cliente confirme un pedido en la web aparecerá aquí al instante. También puedes cargar datos de ejemplo para la presentación.'); return; }
      var s = stats(d), att = attention(d), h = new Date().getHours();
      var evs = d.events.filter(function(e){ return EVT[e.type]; }).slice(-9).reverse();
      box.innerHTML =
        '<section class="hello"><div><p class="hello-k">' + (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches') + ', equipo Da Enzo</p>' +
          '<h2 class="hello-t">' + (s.nuevo + s.requests ? '<em>' + (s.nuevo + s.requests) + '</em> ' + (s.nuevo + s.requests === 1 ? 'cosa necesita' : 'cosas necesitan') + ' atención' : 'Todo está al día') + '</h2></div>' +
          '<p class="hello-note">' + I('alert') + 'Cifras calculadas con los pedidos de esta demostración — no son ventas reales de Da Enzo.</p></section>' +
        '<section class="kpis" aria-label="Indicadores de hoy">' + [
          { tone:'ink', icon:'orders', label:'Pedidos recibidos hoy', value:s.today, sub:'Local y delivery', go:'pedidos?fecha=hoy&estado=todos' },
          { tone:'new', icon:'sparkle', label:'Pendientes de confirmar', value:s.nuevo, sub: s.nuevo ? 'Confírmalos para empezar' : 'Ninguno en espera', go:'pedidos?estado=nuevo', hot: s.nuevo > 0 },
          { tone:'cooking', icon:'flame', label:'En preparación', value:s.cooking, sub:'En la cocina ahora', go:'pedidos?estado=en_preparacion' },
          { tone:'ready', icon:'check', label:'Listos', value:s.ready, sub:'Para servir o despachar', go:'pedidos?estado=listo', hot: s.ready > 0 },
          { tone:'money', icon:'cash', label:'Ventas registradas hoy', value:s.reg, money:true, sub:'Cobrado ' + PV.money(s.paid) + ' · por cobrar ' + PV.money(s.pending), go:'ventas?periodo=hoy' },
          { tone:'req', icon:'bell', label:'Solicitudes de mesa', value:s.requests, sub: s.requests ? 'Meseros o cuentas pendientes' : 'Sin solicitudes', go:'mesas', hot: s.requests > 0 }
        ].map(kpi).join('') + '</section>' +
        '<div class="home-grid">' +
          '<section class="card"><header class="card-h"><h3>Necesitan atención</h3><a class="lnk" href="#/pedidos?estado=activos">Ver pedidos activos ' + I('arrowR') + '</a></header>' +
            (att.length ? '<ul class="att-list">' + att.map(function(r){ return r.html; }).join('') + '</ul>' : '<p class="card-empty">' + I('check') + 'Nada pendiente. ¡Buen trabajo!</p>') + '</section>' +
          '<section class="card"><header class="card-h"><h3>Actividad reciente</h3></header>' +
            (evs.length ? '<ol class="feed">' + evs.map(function(e){ var x = EVT[e.type](e); return '<li><span class="feed-ic feed-ic--' + e.type + '">' + I(x.ic) + '</span><div><b>' + esc(x.t) + '</b><small>' + esc(x.s) + ' · ' + PV.ago(e.at) + '</small></div></li>'; }).join('') + '</ol>' : '<p class="card-empty">Aún no hay actividad.</p>') + '</section>' +
        '</div>';
    },
    click: function(e){
      var g = e.target.closest('[data-go]'); if (g){ location.hash = '#/' + g.dataset.go; return true; }
      var a = e.target.closest('[data-act]'); if (a){ PV.act(a.dataset.act, a.dataset.to, a); return true; }
      var q = e.target.closest('[data-req]'); if (q){ DB.updateRequest(q.dataset.req, 'atendida').then(function(r){ PV.toast((r.table ? 'Mesa ' + r.table : 'Mesa no identificada') + ' · solicitud atendida', { tone:'ready' }); }); return true; }
    }
  });
})();
