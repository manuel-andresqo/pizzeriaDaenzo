/* =========================================================
   MÓDULO 4 · VENTAS Y ESTADÍSTICAS
   Reglas: los cancelados no cuentan como ventas; «cobrado» = pago
   confirmado; cada pedido cuenta una sola vez (por su fecha de
   recepción); unidades e ingresos se muestran por separado.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, I = PV.icon, esc = PV.esc;
  var S = { periodo:'7d', desde:'', hasta:'', metric:'ventas', table:false }, root = null;
  var COLORS = { local:'#c75c2e', delivery:'#2c72a0', bar:'#4c5f33' };       // validado (daltonismo y contraste) con el validador de paletas

  function range(){
    var t = new Date(); t.setHours(0,0,0,0); var end = new Date(t), start; end.setDate(end.getDate() + 1);
    if (S.periodo === 'hoy') start = t;
    else if (S.periodo === '30d'){ start = new Date(t); start.setDate(start.getDate() - 29); }
    else if (S.periodo === 'rango' && S.desde){ start = new Date(S.desde + 'T00:00'); end = S.hasta ? new Date(S.hasta + 'T00:00') : new Date(start); end.setDate(end.getDate() + 1); }
    else if (S.periodo === 'todo'){ var d = PV.data().orders.map(function(o){ return o.createdAt; }).sort()[0]; start = d ? new Date(d) : new Date(t); start.setHours(0,0,0,0); }
    else { start = new Date(t); start.setDate(start.getDate() - 6); }
    return { start: start, end: end };
  }
  function compute(d){
    var R = range(), os = d.orders.filter(function(o){ var c = new Date(o.createdAt); return c >= R.start && c < R.end; });
    var valid = os.filter(function(o){ return o.status !== 'cancelado'; });
    var reg = 0, paid = 0, completed = 0, byMode = { local:{ n:0, v:0 }, delivery:{ n:0, v:0 } }, prods = {}, pay = {};
    valid.forEach(function(o){
      var t = DB.totals(o).total; reg += t;
      if (o.payment.status === 'confirmado') paid += t;
      if (o.status === 'finalizado' || o.status === 'entregado') completed++;
      byMode[o.mode].n++; byMode[o.mode].v += t;
      pay[o.payment.status] = (pay[o.payment.status] || 0) + t;
      o.items.forEach(function(i){ var p = prods[i.productId] || (prods[i.productId] = { name:i.name, cat:i.categoryLabel, units:0, total:0 }); p.units += i.qty; p.total += DB.lineUnit(i) * i.qty; });
    });
    var refunded = os.filter(function(o){ return o.payment.status === 'devuelto'; }).reduce(function(a, o){ return a + DB.totals(o).total; }, 0);
    /* serie: por hora si el período es un solo día; si no, por día */
    var days = Math.round((R.end - R.start) / 86400000), series = [];
    if (days <= 1){
      var h0 = Math.min.apply(null, [11].concat(valid.map(function(o){ return new Date(o.createdAt).getHours(); })));
      for (var h = h0; h <= 23; h++) series.push({ k: h, label: h + ':00', full: h + ':00 – ' + h + ':59', v:0, n:0 });
      valid.forEach(function(o){ var b = series.filter(function(s){ return s.k === new Date(o.createdAt).getHours(); })[0]; if (b){ b.v += DB.totals(o).total; b.n++; } });
    } else {
      var cap = Math.min(days, 62), st = new Date(R.end); st.setDate(st.getDate() - cap);
      for (var k = 0; k < cap; k++){ var day = new Date(st); day.setDate(day.getDate() + k); series.push({ k: PV.dayKey(day), label: day.toLocaleDateString('es-VE', { weekday: cap <= 7 ? 'short' : undefined, day:'numeric', month: cap > 7 ? 'numeric' : undefined }), full: day.toLocaleDateString('es-VE', { weekday:'long', day:'numeric', month:'long' }), v:0, n:0 }); }
      valid.forEach(function(o){ var b = series.filter(function(s){ return s.k === PV.dayKey(o.createdAt); })[0]; if (b){ b.v += DB.totals(o).total; b.n++; } });
    }
    return { R:R, all: os.length, cancelled: os.length - valid.length, count: valid.length, reg:reg, paid:paid, pending: reg - paid - (pay.devuelto || 0), refunded: refunded, completed: completed,
             avg: valid.length ? Math.round(reg / valid.length) : 0, byMode: byMode, pay: pay,
             top: Object.keys(prods).map(function(k){ return prods[k]; }).sort(function(a, b){ return b.units - a.units || b.total - a.total; }).slice(0, 10), series: series, hourly: days <= 1 };
  }

  /* ---------- Gráfico de barras (SVG, una sola serie, sin doble eje) ---------- */
  function niceMax(v){ if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function chart(c){
    var money = S.metric === 'ventas', vals = c.series.map(function(s){ return money ? s.v : s.n; });
    var W = 720, H = 240, L = 54, B = 26, T = 12, max = niceMax(Math.max.apply(null, vals)), n = vals.length;
    var bw = (W - L - 8) / n, gap = Math.max(2, Math.min(10, bw * .28));
    var y = function(v){ return T + (H - T - B) * (1 - v / max); };
    var ticks = [0, .25, .5, .75, 1].map(function(f){ return f * max; });
    var fmt = function(v){ return money ? (v >= 100000 ? '$' + Math.round(v / 100).toLocaleString('es-VE') : PV.money(v).replace(',00', '')) : String(Math.round(v)); };
    var every = Math.ceil(n / 10);
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (money ? 'Ventas registradas' : 'Pedidos') + ' por ' + (c.hourly ? 'hora' : 'día') + '">' +
      ticks.map(function(v){ return '<g class="ch-grid"><line x1="' + L + '" x2="' + (W - 4) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v) + '</text></g>'; }).join('') +
      vals.map(function(v, i){
        var x = L + i * bw + gap / 2, w = Math.max(2, bw - gap), h = Math.max(0, y(0) - y(v)), r = Math.min(4, w / 2, h);
        var top = y(v), path = h ? 'M' + x + ',' + y(0) + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + top + ' ' + (x + w) + ',' + (top + r) + 'V' + y(0) + 'Z' : '';
        var s = c.series[i];
        return '<g class="ch-bar" data-i="' + i + '" tabindex="0" aria-label="' + esc((s.full || s.label) + ': ' + (money ? PV.money(s.v) : s.n + ' pedidos')) + '">' +
          '<rect class="ch-hit" x="' + (L + i * bw) + '" y="' + T + '" width="' + bw + '" height="' + (H - T - B) + '"/>' + (path ? '<path d="' + path + '" fill="' + COLORS.bar + '"/>' : '') +
          (i % every === 0 ? '<text class="ch-x" x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(s.label) + '</text>' : '') + '</g>';
      }).join('') +
      '<line class="ch-base" x1="' + L + '" x2="' + (W - 4) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
    return svg;
  }
  function tableView(c){
    return '<table class="tbl tbl--sm"><thead><tr><th>' + (c.hourly ? 'Hora' : 'Día') + '</th><th class="num">Pedidos</th><th class="num">Ventas registradas</th></tr></thead><tbody>' +
      c.series.map(function(s){ return '<tr><td>' + esc(s.full || s.label) + '</td><td class="num">' + s.n + '</td><td class="num">' + PV.money(s.v) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function split(c){
    var l = c.byMode.local, d = c.byMode.delivery, tot = l.n + d.n;
    if (!tot) return '<p class="card-empty">Sin pedidos en el período.</p>';
    var pl = Math.round(l.n / tot * 100), pd = 100 - pl;
    return '<div class="split" role="img" aria-label="En el local ' + pl + ' %, delivery ' + pd + ' %">' +
        (l.n ? '<span style="flex:' + l.n + ';background:' + COLORS.local + '"></span>' : '') + (d.n ? '<span style="flex:' + d.n + ';background:' + COLORS.delivery + '"></span>' : '') + '</div>' +
      '<ul class="split-l">' +
        '<li><i style="background:' + COLORS.local + '"></i><div><b>En el local · ' + pl + ' %</b><small>' + l.n + ' pedidos · ' + PV.money(l.v) + '</small></div></li>' +
        '<li><i style="background:' + COLORS.delivery + '"></i><div><b>Delivery · ' + pd + ' %</b><small>' + d.n + ' pedidos · ' + PV.money(d.v) + '</small></div></li></ul>';
  }

  function paint(d){
    if (!root) return;
    PV.$$('[data-per]', root).forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.per === S.periodo)); });
    root.querySelector('.sl-range').hidden = S.periodo !== 'rango';
    var out = root.querySelector('.sl-out');
    if (!d.orders.length){ out.innerHTML = PV.emptyState('Sin datos de ventas', 'Las estadísticas se calculan con los pedidos. Carga los datos de ejemplo o haz pedidos desde la web.'); return; }
    var c = compute(d);
    var R = c.R, endShow = new Date(R.end - 1);
    out.innerHTML =
      '<p class="sl-period">' + I('clock') + 'Del ' + PV.date(R.start, { day:'numeric', month:'long' }) + ' al ' + PV.date(endShow, { day:'numeric', month:'long', year:'numeric' }) + ' · ' + c.all + ' pedidos recibidos (' + c.cancelled + ' cancelados, excluidos de las ventas) · ' + PV.currencyNote + '</p>' +
      '<section class="kpis kpis--sales">' +
        '<div class="kpi kpi--money kpi--static"><span class="kpi-ic">' + I('cash') + '</span><span class="kpi-l">Ventas registradas</span><b class="kpi-v">' + PV.money(c.reg) + '</b><span class="kpi-s">' + c.count + ' pedidos no cancelados</span></div>' +
        '<div class="kpi kpi--ready kpi--static"><span class="kpi-ic">' + I('check') + '</span><span class="kpi-l">Cobrado</span><b class="kpi-v">' + PV.money(c.paid) + '</b><span class="kpi-s">Pagos confirmados por el personal</span></div>' +
        '<div class="kpi kpi--cooking kpi--static"><span class="kpi-ic">' + I('clock') + '</span><span class="kpi-l">Pendiente de cobro</span><b class="kpi-v">' + PV.money(c.pending) + '</b><span class="kpi-s">Sin pago confirmado' + (c.refunded ? ' · devuelto ' + PV.money(c.refunded) : '') + '</span></div>' +
        '<div class="kpi kpi--ink kpi--static"><span class="kpi-ic">' + I('orders') + '</span><span class="kpi-l">Pedidos completados</span><b class="kpi-v">' + c.completed + '</b><span class="kpi-s">Finalizados o entregados</span></div>' +
        '<div class="kpi kpi--confirmed kpi--static"><span class="kpi-ic">' + I('sales') + '</span><span class="kpi-l">Ticket promedio</span><b class="kpi-v">' + PV.money(c.avg) + '</b><span class="kpi-s">Por pedido no cancelado</span></div>' +
      '</section>' +
      '<div class="sl-grid">' +
        '<section class="card sl-chart"><header class="card-h"><h3>' + (S.metric === 'ventas' ? 'Ventas registradas' : 'Pedidos') + ' por ' + (c.hourly ? 'hora' : 'día') + '</h3>' +
          '<div class="seg seg--sm" role="group" aria-label="Medida"><button type="button" data-metric="ventas" aria-pressed="' + (S.metric === 'ventas') + '">Ventas</button><button type="button" data-metric="pedidos" aria-pressed="' + (S.metric === 'pedidos') + '">Pedidos</button></div>' +
          '<button type="button" class="link" data-table aria-pressed="' + S.table + '">' + (S.table ? 'Ver gráfico' : 'Ver como tabla') + '</button></header>' +
          (S.table ? tableView(c) : '<div class="chart-wrap">' + chart(c) + '<div class="ch-tip" role="status" hidden></div></div>') + '</section>' +
        '<section class="card"><header class="card-h"><h3>Local y delivery</h3></header>' + split(c) +
          '<h4 class="sub-h">Estado del pago</h4><ul class="pay-l">' + ['confirmado','comprobante','pendiente','rechazado','devuelto'].filter(function(k){ return c.pay[k]; }).map(function(k){ return '<li>' + '<span class="pay pay--' + DB.PAYMENT[k].tone + '">' + I('cash') + esc(DB.PAYMENT[k].label) + '</span><b>' + PV.money(c.pay[k]) + '</b></li>'; }).join('') + '</ul></section>' +
      '</div>' +
      '<section class="card"><header class="card-h"><h3>Productos más vendidos</h3><span class="hint">Por unidades · el total generado es aparte</span></header>' +
        (c.top.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th class="num">Unidades</th><th class="num">Total generado</th></tr></thead><tbody>' +
          c.top.map(function(p, i){ var w = Math.round(p.units / c.top[0].units * 100); return '<tr><td class="rank">' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b><span class="ubar"><i style="width:' + w + '%"></i></span></td><td>' + esc(p.cat) + '</td><td class="num">' + p.units + '</td><td class="num">' + PV.money(p.total) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="card-empty">Sin productos vendidos en el período.</p>') + '</section>';
    root._c = c;
  }

  PV.register('ventas', {
    label:'Ventas y estadísticas', short:'Ventas', icon:'sales', kicker: function(){ return 'Calculado con los pedidos de la demo'; },
    mount: function(r){
      root = r;
      r.innerHTML = '<div class="sl-bar"><div class="seg" role="group" aria-label="Período">' + [['hoy','Hoy'],['7d','7 días'],['30d','30 días'],['todo','Todo'],['rango','Elegir fechas']].map(function(p){ return '<button type="button" data-per="' + p[0] + '" aria-pressed="false">' + p[1] + '</button>'; }).join('') + '</div>' +
        '<div class="sl-range" hidden><label>Desde <input type="date" id="slFrom" class="field field--date"></label><label>Hasta <input type="date" id="slTo" class="field field--date"></label></div></div><div class="sl-out"></div>';
      var f = r.querySelector('#slFrom'), t = r.querySelector('#slTo');
      [f, t].forEach(function(x){ x.addEventListener('change', function(){ S.desde = f.value; S.hasta = t.value; if (S.hasta && S.desde && S.hasta < S.desde){ S.hasta = S.desde; t.value = S.desde; } paint(PV.data()); }); });
      /* información al pasar el ratón o con el foco del teclado */
      function tip(g){
        var wrap = r.querySelector('.chart-wrap'), box = r.querySelector('.ch-tip'); if (!g || !wrap || !r._c){ if (box) box.hidden = true; PV.$$('.ch-bar.is-on', r).forEach(function(x){ x.classList.remove('is-on'); }); return; }
        var s = r._c.series[+g.dataset.i], bb = g.getBoundingClientRect(), wb = wrap.getBoundingClientRect();
        PV.$$('.ch-bar.is-on', r).forEach(function(x){ x.classList.remove('is-on'); }); g.classList.add('is-on');
        box.innerHTML = '<b>' + esc(s.full || s.label) + '</b><span>' + PV.money(s.v) + ' · ' + s.n + ' ' + (s.n === 1 ? 'pedido' : 'pedidos') + '</span>';
        box.hidden = false;
        var x = bb.left - wb.left + bb.width / 2; box.style.left = Math.max(70, Math.min(wb.width - 70, x)) + 'px';
      }
      r.addEventListener('pointerover', function(e){ var g = e.target.closest && e.target.closest('.ch-bar'); if (g) tip(g); });
      r.addEventListener('pointerleave', function(){ tip(null); }, true);
      r.addEventListener('focusin', function(e){ var g = e.target.closest('.ch-bar'); if (g) tip(g); });
      r.addEventListener('focusout', function(e){ if (e.target.closest('.ch-bar')) tip(null); });
    },
    route: function(r, params){ if (['hoy','7d','30d','todo','rango'].indexOf(params.periodo) >= 0) S.periodo = params.periodo; paint(PV.data()); },
    update: function(r, d){ paint(d); },
    click: function(e){
      var p = e.target.closest('[data-per]'); if (p){ S.periodo = p.dataset.per; PV.setParams('ventas', { periodo:S.periodo }); if (S.periodo === 'rango' && !S.desde){ var t = new Date(); root.querySelector('#slTo').value = S.hasta = PV.dayKey(t); t.setDate(t.getDate() - 13); root.querySelector('#slFrom').value = S.desde = PV.dayKey(t); } paint(PV.data()); return true; }
      var m = e.target.closest('[data-metric]'); if (m){ S.metric = m.dataset.metric; paint(PV.data()); return true; }
      if (e.target.closest('[data-table]')){ S.table = !S.table; paint(PV.data()); return true; }
    },
    leave: function(){ root = null; }
  });
})();
