/* =========================================================
   MÓDULO 3 · MESAS Y SOLICITUDES
   Solicitudes (mesero, cuenta, agua, cubiertos, ayuda) y estado de
   cada mesa. La mesa llega del QR/NFC de la web; si no viene, se
   muestra «Mesa no identificada» (nunca se inventa).
   «Solicitar la cuenta» solo avisa: no hay cobro automático.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, I = PV.icon, esc = PV.esc;
  var TABLES = 12, tab = 'pendiente', root = null;
  var LABEL = { pendiente:'Pendiente', atendida:'En curso', resuelta:'Resuelta' };

  function reqCard(q, d){
    var orders = d.orders.filter(function(o){ return o.mode === 'local' && q.table && o.table === q.table && !DB.isFinal(o.status); });
    var tot = orders.reduce(function(a, o){ return a + DB.totals(o).total; }, 0);
    return '<li class="rq rq--' + q.status + (q.type === 'cuenta' ? ' rq--bill' : '') + '">' +
      '<span class="rq-ic">' + I(q.type) + '</span>' +
      '<div class="rq-t"><b>' + (q.table ? 'Mesa ' + esc(q.table) : 'Mesa no identificada') + '</b><span>' + esc(DB.REQUEST[q.type].label) + '</span>' +
        '<small>' + I('clock') + PV.time(q.createdAt) + ' · ' + PV.ago(q.createdAt) + ' · ' + (q.source === 'ejemplo' ? 'Ejemplo' : q.source === 'simulado' ? 'Simulada' : 'Desde la web') + '</small>' +
        (q.type === 'cuenta' ? '<small class="rq-bill">' + (orders.length ? 'Pedidos: ' + orders.map(function(o){ return '<a class="lnk" href="#/pedidos/' + o.id + '">' + o.id + '</a>'; }).join(', ') + ' · total ' + PV.money(tot) : 'Sin pedidos activos asociados') + ' · revisar y atender (sin cobro automático)</small>' : '') +
      '</div>' +
      '<span class="rq-st">' + LABEL[q.status] + '</span>' +
      '<div class="rq-acts">' +
        (q.status === 'pendiente' ? '<button type="button" class="btn btn--sm btn--primary" data-rq="' + q.id + '" data-to="atendida">' + I('check') + 'Atender</button>' : '') +
        (q.status !== 'resuelta' ? '<button type="button" class="btn btn--sm btn--ghost" data-rq="' + q.id + '" data-to="resuelta">' + (q.type === 'cuenta' ? 'Cuenta entregada' : 'Resolver') + '</button>' : '') +
      '</div></li>';
  }
  function tables(d){
    var ids = []; for (var i = 1; i <= TABLES; i++) ids.push(String(i));
    d.orders.concat(d.requests).forEach(function(x){ if (x.table && ids.indexOf(x.table) < 0 && (!x.mode || x.mode === 'local')) ids.push(x.table); });
    var unknown = d.orders.some(function(o){ return o.mode === 'local' && !o.table && !DB.isFinal(o.status); }) || d.requests.some(function(q){ return !q.table && q.status !== 'resuelta'; });
    if (unknown) ids.push(null);
    return ids.map(function(id){
      var os = d.orders.filter(function(o){ return o.mode === 'local' && o.table === id && !DB.isFinal(o.status); });
      var rq = d.requests.filter(function(q){ return q.table === id && q.status === 'pendiente'; });
      var all = d.orders.filter(function(o){ return o.mode === 'local' && o.table === id; }).map(function(o){ return o.updatedAt; })
        .concat(d.requests.filter(function(q){ return q.table === id; }).map(function(q){ return q.createdAt; })).sort();
      var last = all[all.length - 1];
      var latest = os.slice().sort(function(a, b){ return a.createdAt < b.createdAt ? 1 : -1; })[0];
      var state = rq.length ? 'alert' : os.length ? 'busy' : 'free';
      return '<article class="tb tb--' + state + (id ? '' : ' tb--unknown') + '">' +
        '<header><b>' + (id ? 'Mesa ' + esc(id) : 'Mesa no identificada') + '</b>' + (rq.length ? '<span class="tb-alert">' + I('bell') + rq.length + '</span>' : '') + '</header>' +
        (os.length ? '<p class="tb-tot">' + PV.money(os.reduce(function(a, o){ return a + DB.totals(o).total; }, 0)) + '</p>' +
          '<p class="tb-meta">' + os.length + ' ' + (os.length === 1 ? 'pedido activo' : 'pedidos activos') + '</p>' + PV.statusPill(latest) +
          '<p class="tb-links">' + os.map(function(o){ return '<a class="lnk" href="#/pedidos/' + o.id + '">' + o.id + '</a>'; }).join(' ') + '</p>'
          : '<p class="tb-free">Libre</p><p class="tb-meta">Sin pedido activo</p>') +
        (rq.length ? '<ul class="tb-req">' + rq.map(function(q){ return '<li>' + I(q.type) + esc(DB.REQUEST[q.type].label) + '</li>'; }).join('') + '</ul>' : '') +
        '<footer>' + (last ? 'Última actividad ' + PV.ago(last) : 'Sin actividad') + '</footer></article>';
    }).join('');
  }
  function paint(d){
    if (!root) return;
    var c = { pendiente:0, atendida:0, resuelta:0 }; d.requests.forEach(function(q){ c[q.status]++; });
    PV.$$('[data-tab]', root).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); b.querySelector('em').textContent = c[b.dataset.tab]; });
    var rs = d.requests.filter(function(q){ return q.status === tab; }).sort(function(a, b){ return tab === 'resuelta' ? (a.createdAt < b.createdAt ? 1 : -1) : (a.createdAt < b.createdAt ? -1 : 1); });
    root.querySelector('.rq-list').innerHTML = rs.length ? rs.map(function(q){ return reqCard(q, d); }).join('')
      : '<li class="rq-empty">' + I('check') + (tab === 'pendiente' ? 'No hay solicitudes pendientes.' : tab === 'atendida' ? 'Ninguna solicitud en curso.' : 'Aún no hay solicitudes resueltas.') + '</li>';
    root.querySelector('.tb-grid').innerHTML = tables(d);
  }

  PV.register('mesas', {
    label:'Mesas y solicitudes', short:'Mesas', icon:'tables', kicker: function(){ return 'Atención en el local'; },
    mount: function(r){
      root = r;
      r.innerHTML =
        '<div class="tables-grid">' +
          '<section class="card card--req"><header class="card-h"><h3>Solicitudes de los clientes</h3>' +
            '<div class="seg seg--sm" role="group" aria-label="Estado de las solicitudes">' + ['pendiente','atendida','resuelta'].map(function(k){ return '<button type="button" data-tab="' + k + '" aria-pressed="false">' + (k === 'pendiente' ? 'Pendientes' : k === 'atendida' ? 'En curso' : 'Resueltas') + ' <em>0</em></button>'; }).join('') + '</div></header>' +
            '<ul class="rq-list"></ul>' +
            '<p class="hint">Llegan desde el botón «Llamar al mesero» de la web (pedido en el local). En la demo solo funcionan en este navegador.</p></section>' +
          '<section class="card"><header class="card-h"><h3>Mesas</h3><span class="legend"><i class="lg lg--free"></i>Libre<i class="lg lg--busy"></i>Con pedido<i class="lg lg--alert"></i>Solicitud pendiente</span></header>' +
            '<div class="tb-grid"></div>' +
            '<p class="hint">La mesa se identifica con el QR o NFC (enlace …/index.html?mesa=5). Sin ese dato el pedido aparece como «Mesa no identificada».</p></section>' +
        '</div>';
    },
    route: function(r){ paint(PV.data()); },
    update: function(r, d){ paint(d); },
    click: function(e){
      var t = e.target.closest('[data-tab]'); if (t){ tab = t.dataset.tab; paint(PV.data()); return true; }
      var b = e.target.closest('[data-rq]'); if (b){
        b.disabled = true;
        DB.updateRequest(b.dataset.rq, b.dataset.to).then(function(q){ PV.toast((q.table ? 'Mesa ' + q.table : 'Mesa no identificada') + ' · ' + DB.REQUEST[q.type].label + ': ' + LABEL[q.status].toLowerCase(), { tone:'ready' }); }, function(err){ b.disabled = false; PV.toast(err.message, { tone:'cancel', icon:'alert' }); });
        return true;
      }
    },
    leave: function(){ root = null; }
  });
})();
